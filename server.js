const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

let TikTokLiveConnection = null;
try {
  const pkg = require('tiktok-live-connector');
  TikTokLiveConnection = pkg.TikTokLiveConnection || pkg.WebcastPushConnection;
} catch (err) {
  console.log('Not: tiktok-live-connector paketi opsiyoneldir. npm install ile kurulabilir.');
}

const CONFIG_PATH = path.join(__dirname, 'tiktok-config.json');

function loadSavedUsername() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      return (data.username || '').replace(/^@/, '').trim();
    }
  } catch (e) {}
  return '';
}

function saveUsername(username) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ username }, null, 2), 'utf8');
  } catch (e) {}
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

let tiktokConnection = null;
let currentUsername = loadSavedUsername();
let lastStatusPayload = {
  connected: false,
  username: currentUsername,
  message: currentUsername
    ? `⏳ @${currentUsername} yayini bekleniyor...`
    : 'Simülasyon / Test Modu Aktif'
};
let isManualDisconnect = false;
let reconnectTimeout = null;
let retryBackoffMs = 15000;
let activeHostSocketId = null;

// Seri (Combo / Streak) hediyelerde mükerrer jeton eklenmesini önleyen takip tablosu
const giftStreakTracker = new Map();
const seenGiftMsgIds = new Set();

function trackGiftMsgId(msgId) {
  if (!msgId) return false;
  if (seenGiftMsgIds.has(msgId)) return true;
  seenGiftMsgIds.add(msgId);
  if (seenGiftMsgIds.size > 500) {
    const first = seenGiftMsgIds.values().next().value;
    seenGiftMsgIds.delete(first);
  }
  return false;
}

function pruneGiftStreaks(now) {
  for (const [k, v] of giftStreakTracker.entries()) {
    if (now - v.ts > 120000) giftStreakTracker.delete(k);
  }
}

// Tüm açık ekranların (Yayıncı Paneli + OBS ?obs=1) aynı harita ve rastgelelik tohumuyla çalışması için ortak durum
let sharedRaceState = {
  seed: Date.now() % 2147483647,
  mapIndex: 0,
  volume: 20,
  muted: false
};

function clearReconnectTimer() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
}

function broadcastStatus(payload) {
  lastStatusPayload = payload;
  io.emit('tiktokStatus', payload);
}

// v2.5+ ve v1 veri yapılarını ortak formata dönüştüren yardımcı fonksiyonlar
function extractUserInfo(data) {
  const u = data?.user || data || {};
  const rawNick = u.nickname || data?.nickname || '';
  const displayId = u.displayId || data?.displayId || '';
  const uId = u.id || data?.userId || '';
  const uniqueId =
    displayId ||
    u.uniqueId ||
    uId ||
    data?.uniqueId ||
    (rawNick ? rawNick : `oyuncu_${Math.random().toString(36).slice(2, 7)}`);
  const nickname = rawNick || displayId || uniqueId;
  const pic =
    u.avatarThumb?.urlList?.[0] ||
    u.profilePicture?.url?.[0] ||
    u.profilePicture?.urlList?.[0] ||
    u.avatarLarge?.urlList?.[0] ||
    data?.profilePictureUrl ||
    '';
  return { uniqueId, nickname, displayId, userId: uId, profilePictureUrl: pic };
}

function scheduleAutoRetry(delayMs = 12000) {
  clearReconnectTimer();
  if (isManualDisconnect || !currentUsername) return;
  reconnectTimeout = setTimeout(() => {
    if (!isManualDisconnect && currentUsername) {
      connectToTikTok(currentUsername);
    }
  }, delayMs);
}

function connectToTikTok(username) {
  clearReconnectTimer();

  const cleaned = (username || '').replace(/^@/, '').trim();
  if (!cleaned) return;

  currentUsername = cleaned;
  isManualDisconnect = false;
  saveUsername(currentUsername);

  if (!TikTokLiveConnection) {
    broadcastStatus({
      connected: false,
      username: currentUsername,
      message: 'tiktok-live-connector kurulu degil. Simülasyon modu aktif!'
    });
    return;
  }

  if (tiktokConnection) {
    try {
      tiktokConnection.removeAllListeners();
      tiktokConnection.disconnect();
    } catch (e) {}
    tiktokConnection = null;
  }

  giftStreakTracker.clear();
  seenGiftMsgIds.clear();

  const conn = new TikTokLiveConnection(currentUsername, {
    processInitialData: false,
    enableExtendedGiftInfo: true,
    fetchRoomInfoOnConnect: true
  });
  conn._justEndedStream = false;
  tiktokConnection = conn;

  broadcastStatus({
    connected: false,
    connecting: true,
    username: currentUsername,
    message: `⏳ @${currentUsername} yayini kontrol ediliyor...`
  });

  conn.connect().then(state => {
    if (conn !== tiktokConnection || isManualDisconnect) {
      try { conn.disconnect(); } catch (e) {}
      return;
    }
    retryBackoffMs = 15000;
    console.log(`✅ TikTok Canli Yayina Baglandi! Kullanici: @${currentUsername}, RoomId: ${state.roomId}`);
    broadcastStatus({
      connected: true,
      username: currentUsername,
      message: `🟢 @${currentUsername} canli yayinina baglandi!`
    });
  }).catch(err => {
    if (conn !== tiktokConnection || isManualDisconnect) return;
    const rawMsg = String(err?.message || err || '');
    const isOffline =
      err?.constructor?.name === 'UserOfflineError' ||
      /isn't online|offline|not live|Room ID/i.test(rawMsg);
    const nextDelay = retryBackoffMs;
    retryBackoffMs = Math.min(120000, retryBackoffMs * 2);

    if (isOffline) {
      broadcastStatus({
        connected: false,
        connecting: true,
        username: currentUsername,
        message: `📡 @${currentUsername} yayin acmasi bekleniyor (${Math.round(nextDelay / 1000)}sn)...`
      });
      scheduleAutoRetry(nextDelay);
    } else {
      console.error('TikTok Baglanti Hatasi:', rawMsg);
      broadcastStatus({
        connected: false,
        username: currentUsername,
        message: `🔄 @${currentUsername} bekleniyor (${rawMsg.slice(0, 38)})...`
      });
      scheduleAutoRetry(nextDelay);
    }
  });

  // 1. Yorum geldiginde -> Yarisa katil
  conn.on('chat', data => {
    if (conn !== tiktokConnection) return;
    const user = extractUserInfo(data);
    const comment = data.content || data.comment || '';
    console.log(`💬 [TikTok Yorum] ${user.nickname} (@${user.displayId || user.uniqueId}): ${comment}`);
    io.emit('chatEvent', {
      uniqueId: user.uniqueId,
      nickname: user.nickname,
      displayId: user.displayId,
      userId: user.userId,
      profilePictureUrl: user.profilePictureUrl,
      comment: comment
    });
  });

  // 2. Hediye geldiginde -> MsgId dedupe + Seri (Streak) delta hesaplama (tiktok-live-connector v2 data.gift uyumlu)
  conn.on('gift', data => {
    if (conn !== tiktokConnection) return;
    const msgId = data?.common?.msgId ?? data?.msgId;
    if (trackGiftMsgId(msgId)) return;

    const user = extractUserInfo(data);
    const g = data.gift || data.giftDetails || data.extendedGiftInfo || {};
    const ext = data.extendedGiftInfo || {};
    const giftType = g.type ?? g.giftType ?? ext.type ?? data.giftType ?? (g.combo ? 1 : 0);
    const unitDiamonds = Math.max(
      1,
      Number(
        g.diamondCount ||
        g.diamond_count ||
        ext.diamond_count ||
        ext.diamondCount ||
        data.diamondCount ||
        data.fanTicketCount ||
        1
      )
    );
    const repeatCount = Math.max(1, Number(data.repeatCount || data.comboCount || 1));
    const giftId = data.giftId || g.id || ext.id || g.name || 'gift';
    const giftName = g.name || g.giftName || ext.name || g.describe || data.giftName || 'Hediye';
    const giftPictureUrl =
      g.image?.urlList?.[0] ||
      g.icon?.urlList?.[0] ||
      g.giftImage?.url?.[0] ||
      g.giftImage?.urlList?.[0] ||
      ext.image?.url_list?.[0] ||
      data.giftPictureUrl ||
      '';

    const now = Date.now();
    pruneGiftStreaks(now);
    const streakKey = `${user.uniqueId}_${giftId}`;
    let deltaRepeats = repeatCount;

    if (giftType === 1) {
      const prev = giftStreakTracker.get(streakKey);
      const prevCount = prev ? prev.count : 0;
      if (prev?.ended || repeatCount < prevCount) {
        deltaRepeats = repeatCount;
      } else {
        deltaRepeats = Math.max(0, repeatCount - prevCount);
      }
      giftStreakTracker.set(streakKey, {
        count: repeatCount,
        ts: now,
        ended: Boolean(data.repeatEnd)
      });
      if (deltaRepeats <= 0) return;
    }

    const diamondCount = unitDiamonds * deltaRepeats;
    console.log(`🎁 [TikTok Hediye] ${user.nickname} (@${user.displayId || user.uniqueId}): ${giftName} x${deltaRepeats} (${diamondCount} Jeton)`);
    io.emit('giftEvent', {
      uniqueId: user.uniqueId,
      nickname: user.nickname,
      displayId: user.displayId,
      userId: user.userId,
      profilePictureUrl: user.profilePictureUrl,
      giftName,
      giftPictureUrl,
      diamondCount,
      unitDiamonds,
      repeatCount: deltaRepeats
    });
  });

  // 3. Begeni geldiginde -> Yarisa katilim veya hafif begeni kivilcimi
  conn.on('like', data => {
    if (conn !== tiktokConnection) return;
    const user = extractUserInfo(data);
    const likeCount = Number(data.count) || Number(data.likeCount) || 1;
    const totalLikes = Number(data.total) || Number(data.totalLikes) || 0;
    console.log(`❤️ [TikTok Beğeni] ${user.nickname} (@${user.displayId || user.uniqueId}): +${likeCount} (Toplam: ${totalLikes})`);
    io.emit('likeEvent', {
      uniqueId: user.uniqueId,
      nickname: user.nickname,
      displayId: user.displayId,
      userId: user.userId,
      profilePictureUrl: user.profilePictureUrl,
      likeCount: likeCount,
      totalLikes: totalLikes
    });
  });

  // 4. Anlik ag kopmalarinda otomatik yeniden baglanma (Uzun yayin korumasi)
  conn.on('disconnected', () => {
    if (conn !== tiktokConnection || isManualDisconnect || !currentUsername) return;
    if (conn._justEndedStream) return;
    console.log(`@${currentUsername} TikTok baglantisi koptu, yeniden baglaniliyor...`);
    broadcastStatus({
      connected: false,
      connecting: true,
      username: currentUsername,
      message: `⏳ @${currentUsername} baglantisi yenileniyor...`
    });
    scheduleAutoRetry(4000);
  });

  conn.on('streamEnd', () => {
    if (conn !== tiktokConnection) return;
    conn._justEndedStream = true;
    giftStreakTracker.clear();
    retryBackoffMs = 15000;
    broadcastStatus({
      connected: false,
      connecting: true,
      username: currentUsername,
      message: `🏁 @${currentUsername} yayini bitti (Yeni yayin bekleniyor)...`
    });
    scheduleAutoRetry(15000);
  });

  conn.on('error', err => {
    if (conn !== tiktokConnection) return;
    const msg = String(err?.info || err?.message || err || '');
    if (msg === 'Error while connecting' || /Failed to retrieve Room ID/i.test(msg)) return;
    console.warn('TikTok Live Stream Uyarisi:', msg);
  });
}

io.on('connection', socket => {
  console.log('Tarayici kaynagi baglandi:', socket.id);

  // Yeni acilan ekrana (orn. OBS ?obs=1) mevcut ortak tohum ve ses bilgisini gonder
  socket.emit('syncInitialState', sharedRaceState);
  socket.emit('tiktokStatus', lastStatusPayload);

  socket.on('connectTikTok', username => {
    connectToTikTok(username);
  });

  socket.on('disconnectTikTok', () => {
    isManualDisconnect = true;
    clearReconnectTimer();
    if (tiktokConnection) {
      try {
        tiktokConnection.removeAllListeners();
        tiktokConnection.disconnect();
      } catch (e) {}
      tiktokConnection = null;
    }
    giftStreakTracker.clear();
    broadcastStatus({
      connected: false,
      username: currentUsername,
      message: 'TikTok baglantisi durduruldu (Simülasyon aktif).'
    });
  });

  // Yayinci kontrol panelinden yapilan tum aksiyonlari OBS ve diger acik ekranlara senkronize et
  socket.on('adminCommand', payload => {
    if (!payload || !payload.type) return;

    if (payload.type === 'initNewRace') {
      sharedRaceState.seed = payload.seed || (Date.now() % 2147483647);
      if (Number.isInteger(payload.mapIndex) && payload.mapIndex >= 0 && payload.mapIndex < 3) {
        sharedRaceState.mapIndex = payload.mapIndex;
      } else {
        sharedRaceState.mapIndex = (sharedRaceState.mapIndex + 1) % 3;
      }
      payload.seed = sharedRaceState.seed;
      payload.mapIndex = sharedRaceState.mapIndex;
    } else if (payload.type === 'setVolume') {
      const vol = Number(payload.volume);
      if (Number.isFinite(vol)) {
        sharedRaceState.volume = Math.max(0, Math.min(100, vol));
        payload.volume = sharedRaceState.volume;
      }
      sharedRaceState.muted = Boolean(payload.muted);
      payload.muted = sharedRaceState.muted;
    }

    // Komutu gonderen dahil tum bagli ekranlara (Yayinci + OBS) ilet
    io.emit('adminCommand', payload);
  });

  // Ana sekmeden OBS sekmesine periyodik durum senkronizasyonu (Tek yetkili ana sekme)
  socket.on('hostStateSnapshot', snapshot => {
    if (!activeHostSocketId || !io.sockets.sockets.has(activeHostSocketId)) {
      activeHostSocketId = socket.id;
    }
    if (socket.id !== activeHostSocketId) return;
    socket.broadcast.emit('hostStateSnapshot', snapshot);
  });

  socket.on('disconnect', () => {
    if (activeHostSocketId === socket.id) activeHostSocketId = null;
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`====================================================`);
  console.log(`🚀 TikTok Misket Yarisi Sunucusu Hazir!`);
  console.log(`👉 Tarayicida veya OBS'de acin: http://127.0.0.1:${PORT}`);
  console.log(`====================================================`);
  if (currentUsername) {
    console.log(`📡 Kayitli TikTok kullanicisi bulundu: @${currentUsername}, otomatik baglanti baslatiliyor...`);
    connectToTikTok(currentUsername);
  }
});
