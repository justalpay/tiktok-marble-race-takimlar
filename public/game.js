// ============================================================================
// TİKTOK CANLI MİSKET YARIŞI - 5 BÜYÜK TAKIM ŞAMPİYONLAR LİGİ
// Takımlar: FB, GS, BJK, TS, AMEDSPOR
// ============================================================================

const canvas = document.getElementById('raceCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const W = canvas.width;   // 720
const H = canvas.height;  // 1280

// OBS Modu Kontrolü (?obs=1)
const urlParams = new URLSearchParams(window.location.search);
const isObsClient = urlParams.get('obs') === '1';
if (isObsClient) {
  document.body.classList.add('obs-mode');
}

// Deterministik Rastgelelik
let prngSeed = 123456789;
function setGameSeed(seed) {
  prngSeed = (Number(seed) || 123456789) >>> 0;
}
function gameRandom() {
  prngSeed = (prngSeed + 0x6D2B79F5) >>> 0;
  let t = Math.imul(prngSeed ^ (prngSeed >>> 15), 1 | prngSeed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================================
// 1. TAKIM TANIMLARI & VEKTÖREL LOGOLAR
// ============================================================================
const TEAMS = [
  {
    id: 'FB',
    name: 'Fenerbahçe',
    short: 'FB',
    color: '#FFE600',          // Kanarya Sarı
    secondaryColor: '#001C5B',   // Lacivert
    glow: '#FFE600',
    giftName: 'Donut',
    giftCoins: 30,
    wins: 0,
    totalCoins: 0,
    totalLikes: 0,
    likesMilestone: 1000,
    logoSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#001C5B" stroke="#FFE600" stroke-width="4"/>
      <circle cx="50" cy="50" r="38" fill="#FFFFFF"/>
      <path d="M28,32 Q50,22 72,32 L68,64 Q50,84 50,84 Q50,84 32,64 Z" fill="#DA291C" stroke="#FFE600" stroke-width="2"/>
      <rect x="36" y="36" width="6" height="32" fill="#FFE600"/>
      <rect x="42" y="36" width="6" height="34" fill="#001C5B"/>
      <rect x="48" y="36" width="6" height="35" fill="#FFE600"/>
      <rect x="54" y="36" width="6" height="34" fill="#001C5B"/>
      <rect x="60" y="36" width="6" height="32" fill="#FFE600"/>
      <path d="M38,60 Q50,46 62,60" fill="none" stroke="#00843D" stroke-width="4" stroke-linecap="round"/>
      <text x="50" y="24" font-family="Arial, sans-serif" font-weight="900" font-size="13" fill="#FFE600" text-anchor="middle">FB</text>
    </svg>`
  },
  {
    id: 'GS',
    name: 'Galatasaray',
    short: 'GS',
    color: '#C8102E',          // Kırmızı
    secondaryColor: '#FFB81C',   // Sarı
    glow: '#FFB81C',
    giftName: 'Panda',
    giftCoins: 30,
    wins: 0,
    totalCoins: 0,
    totalLikes: 0,
    likesMilestone: 1000,
    logoSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#C8102E" stroke="#FFB81C" stroke-width="4"/>
      <circle cx="50" cy="50" r="40" fill="#1A050B"/>
      <path d="M32,48 C32,32 46,24 60,26 C68,28 73,34 73,34 L66,41 C66,41 62,36 57,35 C48,34 40,40 40,50 C40,60 48,66 58,65 C64,64 67,60 67,60 L67,52 L54,52 L54,44 L76,44 L76,66 C76,66 69,74 57,75 C42,76 32,66 32,48 Z" fill="#FFB81C"/>
      <path d="M58,34 C58,34 50,33 46,38 C42,42 42,47 48,51 L56,56 C63,60 63,67 59,71 C55,75 46,75 41,70 L46,63 C46,63 51,66 55,64 C58,62 57,58 52,55 L45,50 C38,45 38,38 43,33 C48,27 58,27 63,31 Z" fill="#C8102E" stroke="#FFB81C" stroke-width="1"/>
      <text x="50" y="90" font-family="Arial, sans-serif" font-weight="900" font-size="12" fill="#FFB81C" text-anchor="middle">1905</text>
    </svg>`
  },
  {
    id: 'BJK',
    name: 'Beşiktaş',
    short: 'BJK',
    color: '#FFFFFF',          // Beyaz
    secondaryColor: '#111111',   // Siyah
    glow: '#E30A17',
    giftName: 'Güneş Gözlüğü',
    giftCoins: 30,
    wins: 0,
    totalCoins: 0,
    totalLikes: 0,
    likesMilestone: 1000,
    logoSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M20,16 L80,16 L80,60 Q80,86 50,94 Q20,86 20,60 Z" fill="#FFFFFF" stroke="#111111" stroke-width="4"/>
      <rect x="20" y="16" width="60" height="22" fill="#111111"/>
      <text x="50" y="32" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="#FFFFFF" text-anchor="middle">BJK</text>
      <rect x="25" y="38" width="10" height="38" fill="#111111"/>
      <rect x="35" y="38" width="10" height="42" fill="#FFFFFF"/>
      <rect x="45" y="38" width="10" height="44" fill="#DA291C"/>
      <rect x="55" y="38" width="10" height="42" fill="#FFFFFF"/>
      <rect x="65" y="38" width="10" height="38" fill="#111111"/>
      <circle cx="50" cy="50" r="3.2" fill="#FFFFFF"/>
      <circle cx="51.2" cy="50" r="2.4" fill="#DA291C"/>
      <polygon points="52.5,50 54.5,49 53.5,51" fill="#FFFFFF"/>
    </svg>`
  },
  {
    id: 'TS',
    name: 'Trabzonspor',
    short: 'TS',
    color: '#800020',          // Bordo
    secondaryColor: '#41B6E6',   // Mavi
    glow: '#41B6E6',
    giftName: 'Dondurma',
    giftCoins: 30,
    wins: 0,
    totalCoins: 0,
    totalLikes: 0,
    likesMilestone: 1000,
    logoSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <path d="M22,18 L78,18 L78,58 Q78,84 50,92 Q22,84 22,58 Z" fill="#800020" stroke="#41B6E6" stroke-width="4"/>
      <path d="M50,18 L78,18 L78,58 Q78,84 50,92 Z" fill="#41B6E6"/>
      <circle cx="50" cy="52" r="24" fill="rgba(0,0,0,0.25)"/>
      <text x="50" y="62" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="#FFD700" text-anchor="middle" stroke="#111111" stroke-width="1.5">TS</text>
      <polygon points="50,23 52,28 58,28 53,31 55,36 50,33 45,36 47,31 42,28 48,28" fill="#FFD700"/>
    </svg>`
  },
  {
    id: 'AMED',
    name: 'Amedspor',
    short: 'AMED',
    color: '#00843D',          // Yeşil
    secondaryColor: '#DA291C',   // Kırmızı
    glow: '#FFE600',
    giftName: 'Ördek',
    giftCoins: 30,
    wins: 0,
    totalCoins: 0,
    totalLikes: 0,
    likesMilestone: 1000,
    logoSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#00843D" stroke="#DA291C" stroke-width="4"/>
      <circle cx="50" cy="50" r="40" fill="#FFFFFF"/>
      <path d="M50,14 L86,30 L86,60 Q86,82 50,90 Q14,82 14,60 L14,30 Z" fill="#00843D"/>
      <path d="M50,14 L86,30 L86,60 Q86,82 50,90 Z" fill="#DA291C"/>
      <circle cx="50" cy="50" r="14" fill="#FFE600" stroke="#FFFFFF" stroke-width="2"/>
      <path d="M36,46 Q50,34 64,46 L60,58 Q50,52 40,58 Z" fill="#FFFFFF"/>
      <text x="50" y="78" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle">AMED</text>
    </svg>`
  }
];

TEAMS.forEach(team => {
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(team.logoSvg);
  team.logoImg = img;
});

// İzleyicilerin tuttukları takımlar: Map<uniqueId, teamId>
const userTeamMap = new Map();

// ============================================================================
// 2. ORİJİNAL ASMR SES MOTORU (Cam Misket Tıkırtısı & Yumuşak Zil)
// ============================================================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.25;       // Çok yumuşak, kulağı yormayan orijinal ses seviyesi
    this.noiseBuffer = null;
    this.lastPopTime = 0;
    this.lastBoingTime = 0;
    this.lastPadTime = 0;
    this.lastGiftSoundTime = 0;
    this.currentAnthemAudio = null;
    this.currentPlayingTeam = null;
    this.bgMusicAudio = null;
    this.bgMusicPaused = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  _getNoiseBuffer() {
    if (this.noiseBuffer) return this.noiseBuffer;
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  // Orijinal cam misket çarpışma sesi (ASMR Tok Tıkırtı)
  playMarbleClink(freq = 1150, duration = 0.022, baseVol = 0.018) {
    if (this.muted || this.volume <= 0.001) return;
    this.init();
    if (!this.ctx || this.ctx.state !== 'running') return;
    const finalVol = baseVol * this.volume;
    if (finalVol <= 0.0003) return;

    try {
      const now = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this._getNoiseBuffer();
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(freq, now);
      bp.Q.setValueAtTime(6.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(finalVol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      src.connect(bp);
      bp.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(now);
      src.stop(now + duration + 0.005);
    } catch (e) {}
  }

  // Yumuşak arcade zil / ödül sesi
  playSoftNote(freq, duration = 0.06, baseVol = 0.025, slideFreq = null, cutoff = 1200) {
    if (this.muted || this.volume <= 0.001) return;
    this.init();
    if (!this.ctx || this.ctx.state !== 'running') return;
    const finalVol = baseVol * this.volume;
    if (finalVol <= 0.0003) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      if (slideFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(60, slideFreq), now + duration);
      }

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cutoff, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(finalVol, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.008);
    } catch (e) {}
  }

  playPop(marbleY = null) {
    if (gameState !== 'RACING') return;
    const now = performance.now();
    if (now - this.lastPopTime < 300) return;
    this.lastPopTime = now;
    const freq = 950 + Math.random() * 450;
    this.playMarbleClink(freq, 0.020, 0.016);
  }

  playBoing(marbleY = null) {
    if (gameState !== 'RACING') return;
    const now = performance.now();
    if (now - this.lastBoingTime < 450) return;
    this.lastBoingTime = now;
    this.playSoftNote(190, 0.065, 0.024, 290, 600);
  }

  playSpeedPad() {
    const now = performance.now();
    if (now - this.lastPadTime < 700) return;
    this.lastPadTime = now;
    this.playMarbleClink(1700, 0.075, 0.020);
  }

  playCountdownBeep(final = false) {
    if (final) {
      this.playSoftNote(587.33, 0.11, 0.032, 783.99, 1400);
    } else {
      this.playMarbleClink(880, 0.035, 0.025);
    }
  }

  playGiftBoost(tier = 1) {
    if (this.muted) return;
    const notes = tier >= 3 ? [523.25, 659.25, 783.99, 1046.50] : [587.33, 880.00];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playSoftNote(n, 0.07, 0.028, null, 1500), idx * 65);
    });
  }

  playFreezeSound() {
    if (this.muted) return;
    [1568, 2093, 2637].forEach((f, i) => {
      setTimeout(() => this.playSoftNote(f, 0.14, 0.022, f * 0.75, 2400), i * 40);
    });
  }

  // TEKİL (SINGLE-CHANNEL) + RAM PRELOAD MÜZİK & MARŞ MOTORU:
  // Sayfa açılır açılmaz tüm takım marşlarını (fb, gs, bjk, ts, amed) ve maç müziğini (bg_match)
  // RAM'e (Blob URL olarak) indirir. Yarış bittiği anda ağ/tünel beklemeden 0ms gecikmeyle RAM'den çalar!
  preloadAllAudio() {
    if (this._preloadStarted) return;
    this._preloadStarted = true;
    this.blobUrls = this.blobUrls || {};

    const files = {
      BG: '/audio/bg_match.mp3?v=7',
      FB: '/audio/fb.mp3?v=7',
      GS: '/audio/gs.mp3?v=7',
      BJK: '/audio/bjk.mp3?v=7',
      TS: '/audio/ts.mp3?v=7',
      AMED: '/audio/amed.mp3?v=7'
    };

    if (typeof fetch !== 'function' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      return;
    }

    Object.entries(files).forEach(([key, url]) => {
      fetch(url)
        .then(r => (r.ok ? r.blob() : Promise.reject(new Error('HTTP ' + r.status))))
        .then(blob => {
          if (blob && blob.size > 1000) {
            this.blobUrls[key] = URL.createObjectURL(blob);
          }
        })
        .catch(() => {});
    });
  }

  _getTrackUrl(key) {
    if (this.blobUrls && this.blobUrls[key]) {
      return this.blobUrls[key];
    }
    if (key === 'BG') return '/audio/bg_match.mp3?v=7';
    return `/audio/${key.toLowerCase()}.mp3?v=7`;
  }

  _ensureMasterAudio() {
    this.preloadAllAudio();
    if (!this.bgMusicAudio) {
      this.bgMusicAudio = new Audio(this._getTrackUrl('BG'));
      this.bgMusicAudio.loop = true;
      this.bgMusicMode = 'bg'; // 'bg' | 'anthem'
      this.savedBgTime = 0;
    }
    return this.bgMusicAudio;
  }

  startBgMusic() {
    if (this.muted) return;
    // Marş çalıyorsa veya PODYUM ekranındaysak arka plan müziği devreye girmesin!
    if (this.currentPlayingTeam || this.bgMusicMode === 'anthem' || gameState === 'PODIUM') return;

    const audio = this._ensureMasterAudio();
    const bgUrl = this._getTrackUrl('BG');

    if (this.bgMusicMode !== 'bg' || !audio.src || (!audio.src.includes('bg_match') && audio.src !== this.blobUrls?.BG)) {
      audio.onended = null;
      audio.src = bgUrl;
      audio.loop = true;
      if (this.savedBgTime > 0) {
        const resumeAt = this.savedBgTime;
        audio.addEventListener('loadedmetadata', () => {
          try { audio.currentTime = resumeAt % (audio.duration || 180); } catch (e) {}
        }, { once: true });
      }
    }

    this.bgMusicMode = 'bg';
    audio.playbackRate = 1.0;
    audio.loop = true;
    audio.volume = Math.min(1.0, Math.max(0.08, this.volume * 2.2));

    if (audio.paused) {
      const p = audio.play();
      if (p !== undefined) {
        p.then(() => {
          this.bgMusicPaused = false;
        }).catch(() => {});
      }
    }
  }

  pauseBgMusic() {
    if (this.resumeBgTimeout) {
      clearTimeout(this.resumeBgTimeout);
      this.resumeBgTimeout = null;
    }
    if (this.bgMusicAudio && this.bgMusicMode === 'bg') {
      try {
        if (this.bgMusicAudio.currentTime > 0) {
          this.savedBgTime = this.bgMusicAudio.currentTime;
        }
        this.bgMusicAudio.pause();
      } catch (e) {}
      this.bgMusicPaused = true;
    }
  }

  resumeBgMusic() {
    if (this.muted || this.currentPlayingTeam || gameState === 'PODIUM') return;
    this.bgMusicMode = 'bg';
    this.startBgMusic();
  }

  stopAnthem(shouldResumeBg = true) {
    if (this.resumeBgTimeout) {
      clearTimeout(this.resumeBgTimeout);
      this.resumeBgTimeout = null;
    }
    this.currentPlayingTeam = null;
    this.currentAnthemAudio = null;
    document.querySelectorAll('.anthem-test-btn').forEach(btn => btn.classList.remove('playing'));

    if (this.bgMusicAudio && this.bgMusicMode === 'anthem') {
      try {
        this.bgMusicAudio.onended = null;
        this.bgMusicAudio.pause();
      } catch (e) {}
    }

    this.bgMusicMode = 'bg';

    if (shouldResumeBg && gameState !== 'PODIUM') {
      this.startBgMusic();
    }
  }

  // Kazanan takımın marşı (RAM'deki Blob URL üzerinden 0ms gecikmeyle anında çalar!)
  playTeamAnthem(teamId, forcePlay = false) {
    this.init();
    if (this.muted) return;

    const cleanTeam = (teamId || '').toUpperCase().trim();
    if (!cleanTeam) return;

    // Panelden aynı marş butonuna tekrar basıldıysa durdur ve maç müziğine dön
    if (!forcePlay && this.currentPlayingTeam === cleanTeam && this.bgMusicMode === 'anthem') {
      this.stopAnthem(true);
      return;
    }

    if (this.resumeBgTimeout) {
      clearTimeout(this.resumeBgTimeout);
      this.resumeBgTimeout = null;
    }

    const audio = this._ensureMasterAudio();

    // Eğer şu an maç müziği çalıyorsa kaldığı saniyeyi kaydet ve durdur
    if (this.bgMusicMode === 'bg') {
      try {
        if (audio.currentTime > 0) this.savedBgTime = audio.currentTime;
      } catch (e) {}
    }

    try {
      audio.onended = null;
      audio.pause();
    } catch (e) {}

    this.bgMusicMode = 'anthem';
    this.currentPlayingTeam = cleanTeam;
    this.currentAnthemAudio = audio;

    // RAM'de hazır bekleyen Blob URL'yi (veya yerel yolu) kaynağa ver
    audio.src = this._getTrackUrl(cleanTeam);
    audio.loop = false;
    audio.playbackRate = 1.06; // Telif botunu (Audible Magic) atlatmak ve tempoyu artırmak için %6 anti-fingerprint ivmesi
    audio.volume = Math.min(1.0, Math.max(0.22, this.volume * 3.5));

    document.querySelectorAll('.anthem-test-btn').forEach(btn => {
      if (btn.getAttribute('data-team') === cleanTeam) {
        btn.classList.add('playing');
      } else {
        btn.classList.remove('playing');
      }
    });

    const teamObj = TEAMS.find(t => t.id === cleanTeam);
    const teamName = teamObj ? teamObj.name : cleanTeam;
    spawnFloatingText(W / 2, cameraY + H * 0.5, `🎵 ${teamName} Marşı Çalıyor!`, teamObj ? teamObj.color : '#FFE600');

    audio.onended = () => {
      if (this.currentPlayingTeam === cleanTeam && this.bgMusicMode === 'anthem') {
        this.currentPlayingTeam = null;
        this.currentAnthemAudio = null;
        this.bgMusicMode = 'bg';
        document.querySelectorAll('.anthem-test-btn').forEach(btn => btn.classList.remove('playing'));
        this.startBgMusic();
      }
    };

    const p = audio.play();
    if (p !== undefined) {
      p.catch(err => {
        console.warn(`[Audio] ${cleanTeam}.mp3 otomatik çalınamadı:`, err);
        this.playGentleVictoryFanfare();
      });
    }
  }

  playGentleVictoryFanfare() {
    const melody = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    melody.forEach((n, idx) => {
      setTimeout(() => this.playSoftNote(n, 0.22, 0.038, null, 1800), idx * 120);
    });
  }
}

const sfx = new SoundEngine();

// ============================================================================
// 3. OYUN DURUMU & PİST DEĞİŞKENLERİ
// ============================================================================
const FIXED_DT = 1 / 60;
const JOIN_DURATION = 6;      // Hızlı hazırlık (izleyicinin sıkılıp kaçmaması için 6 sn)
const PODIUM_DURATION = 8;    // Şampiyonluk & marş kutlama süresi (8 sn)

let gameState = 'LOBBY_RING'; // 'LOBBY_RING' | 'RACING' | 'PODIUM'
let stateTimer = JOIN_DURATION;
let worldTime = 0;
let cameraY = 0;
let targetCameraY = 0;
let screenShakeTimer = 0;
let lastWholeSecond = -1;

let marbles = [];
let particles = [];
let floatingTexts = [];
let winnerTeam = null;

// Çember içi dönen mor çubuk açısı
let lobbyBarAngle = 0;

// Parkur Y sınırları (1 Dakikalık ~60 sn Uzun ve Zengin Parkur!)
const RING_CENTER_X = W / 2;
const RING_CENTER_Y = 575;
const RING_RADIUS = 204;

const STAGE1_START_Y = 855;
const STAGE1_END_Y = 4600;      // Etap 1: Renkli Plinko & Zıplatıcı Mantarlar (~20 sn)
const STAGE2_END_Y = 8600;      // Etap 2: Dönen Değirmen Çarklar, Huniler & Hız Pedleri (~20 sn)
const STAGE3_END_Y = 12500;     // Etap 3: Hareketli Kayar Platformlar & Yaylı Tamponlar (~20 sn)
const FINISH_LINE_Y = 12600;    // Damalı Bitiş Çizgisi (Toplam ~60 sn sürer)

const CANDY_COLORS = [
  '#FF2A85', '#00E5FF', '#FFE600', '#00FF88',
  '#FF6B00', '#9D4EDD', '#FF4D6D', '#38B000',
  '#00BBF9', '#F15BB5', '#FEE440', '#FB5607'
];

// Parkur Engelleri
let pegs = [];            // Plinko çivileri & zıplatıcı mantarlar
let ramps = [];           // Sabit eğimli şeker rampalar
let spinners = [];        // Dönen çarklar / değirmenler
let speedPads = [];       // Yeşil hızlandırıcı pedler (>>>)
let movingPlatforms = []; // Sağa-sola kayan platformlar (Etap 3)

// Harita Döngü Sistemi (Her oyun sırayla değişen 3 farklı harita!)
const MAPS_META = [
  {
    id: 0,
    name: 'HARİTA 1: ŞEKER FABRİKASI',
    shortName: 'Şeker Fabrikası',
    stage1Label: '🎯 ETAP 1: PLİNKO & MANTARLAR',
    stage2Label: '🎡 ETAP 2: DEĞİRMEN ÇARKLAR',
    stage3Label: '🚀 ETAP 3: KAYAR PLATFORMLAR',
    bgColors: [
      ['#2b1055', '#3c1361', '#1f0a4d'],
      ['#1a1b6b', '#3a0ca3', '#240046'],
      ['#3b0944', '#590d22', '#1d0947']
    ]
  },
  {
    id: 1,
    name: 'HARİTA 2: ZİKZAK KANYONU',
    shortName: 'Zikzak Kanyonu',
    stage1Label: '⚡ ETAP 1: ZİKZAK ŞELALESİ',
    stage2Label: '🌪️ ETAP 2: ÇİFT KÖPRÜ & MİKSER',
    stage3Label: '✂️ ETAP 3: MAKAS KAPILAR & SARKAÇ',
    bgColors: [
      ['#0f3460', '#16213e', '#1a1a2e'],
      ['#004e64', '#00a5cf', '#0b2545'],
      ['#2d00f7', '#6a00f4', '#10002b']
    ]
  },
  {
    id: 2,
    name: 'HARİTA 3: KAOS ARENASI',
    shortName: 'Kaos Arenası',
    stage1Label: '🎱 ETAP 1: FLİPPER & BUMPER ARENA',
    stage2Label: '⚙️ ETAP 2: DEV ÇARK LABİRENTİ',
    stage3Label: '⏳ ETAP 3: KUM SAATİ & TAMPON DUVARI',
    bgColors: [
      ['#3d0066', '#5c0099', '#240046'],
      ['#6a040f', '#9d0208', '#370617'],
      ['#003566', '#001d3d', '#000814']
    ]
  }
];

let currentMapIndex = -1; // İlk yarışta 0 (Harita 1) olacak, sonra 1, 2, 0, 1, 2 diye sırayla dönecek

// ============================================================================
// 4. 3 FARKLI HARİTA & 3 ETAPLI PARKUR OLUŞTURUCU (~60 SANİYELİK DEV PARKURLAR)
// ============================================================================
function buildCourse(mapIndex = 0) {
  pegs = [];
  ramps = [];
  spinners = [];
  speedPads = [];
  movingPlatforms = [];

  if (mapIndex === 0) {
    buildMap1CandyFactory();
  } else if (mapIndex === 1) {
    buildMap2ZigzagCanyon();
  } else {
    buildMap3ChaosArena();
  }

  const mapInfoEl = document.getElementById('activeMapInfoText');
  if (mapInfoEl) {
    mapInfoEl.textContent = MAPS_META[mapIndex].name;
  }
}

// ----------------------------------------------------------------------------
// HARİTA 1: ŞEKER FABRİKASI (Klasik Plinko + 4 Kollu Değirmenler + Kayar Barlar)
// ----------------------------------------------------------------------------
function buildMap1CandyFactory() {
  // ETAP 1 (Y: 820 -> 4600)
  ramps.push({ x1: 26, y1: 820, x2: 225, y2: 920, color: '#00E5FF', thickness: 18 });
  ramps.push({ x1: W - 26, y1: 820, x2: W - 225, y2: 920, color: '#FF2A85', thickness: 18 });

  for (let r = 0; r < 12; r++) {
    const y = 980 + r * 92;
    const isEven = r % 2 === 0;
    const cols = isEven ? 7 : 6;
    const spacing = 88;
    const startX = (W - (cols - 1) * spacing) / 2;

    for (let c = 0; c < cols; c++) {
      const x = startX + c * spacing;
      const isBumper = (r % 3 === 2) && (c === 1 || c === cols - 2);
      pegs.push({
        x,
        y,
        r: isBumper ? 21 : 12,
        type: isBumper ? 'bumper' : 'peg',
        color: isBumper ? '#FF9F1C' : CANDY_COLORS[(r + c) % CANDY_COLORS.length],
        hitAnim: 0
      });
    }
  }

  ramps.push({ x1: 40, y1: 2140, x2: 430, y2: 2260, color: '#00FF88', thickness: 18 });
  ramps.push({ x1: W - 40, y1: 2340, x2: 290, y2: 2460, color: '#FFE600', thickness: 18 });
  speedPads.push({ x: W / 2 - 55, y: 2510, w: 110, h: 68 });

  ramps.push({ x1: 30, y1: 2620, x2: 260, y2: 2740, color: '#FF4D6D', thickness: 18 });
  ramps.push({ x1: W - 30, y1: 2620, x2: W - 260, y2: 2740, color: '#00BBF9', thickness: 18 });

  for (let r = 0; r < 17; r++) {
    const y = 2850 + r * 94;
    const isEven = r % 2 === 0;
    const cols = isEven ? 7 : 6;
    const spacing = 88;
    const startX = (W - (cols - 1) * spacing) / 2;

    for (let c = 0; c < cols; c++) {
      const x = startX + c * spacing;
      const isBumper = (r % 4 === 1) && (c === 2 || c === cols - 3);
      pegs.push({
        x,
        y,
        r: isBumper ? 22 : 13,
        type: isBumper ? 'bumper' : 'peg',
        color: isBumper ? '#FF2A85' : CANDY_COLORS[(r * 2 + c) % CANDY_COLORS.length],
        hitAnim: 0
      });
    }
  }

  // ETAP 2 (Y: 4650 -> 8600)
  const stage2Sectors = [4750, 5680, 6620, 7560];
  stage2Sectors.forEach((baseY, idx) => {
    ramps.push({ x1: 24, y1: baseY, x2: 255, y2: baseY + 140, color: '#FF6B00', thickness: 20 });
    ramps.push({ x1: W - 24, y1: baseY, x2: W - 255, y2: baseY + 140, color: '#FF6B00', thickness: 20 });

    spinners.push({
      x: W / 2,
      y: baseY + 275,
      length: 130,
      thickness: 16,
      angle: idx * 0.5,
      speed: (idx % 2 === 0 ? 1 : -1) * 0.042,
      blades: 2,
      color: '#C77DFF'
    });

    spinners.push({
      x: 195,
      y: baseY + 510,
      length: 112,
      thickness: 16,
      angle: 0.3,
      speed: 0.048,
      blades: 2,
      color: '#00F5D4'
    });
    spinners.push({
      x: W - 195,
      y: baseY + 510,
      length: 112,
      thickness: 16,
      angle: -0.3,
      speed: -0.048,
      blades: 2,
      color: '#FF4D6D'
    });

    speedPads.push({ x: 65, y: baseY + 640, w: 105, h: 65 });
    speedPads.push({ x: W - 170, y: baseY + 640, w: 105, h: 65 });

    for (let c = 0; c < 5; c++) {
      pegs.push({
        x: 120 + c * 120,
        y: baseY + 790,
        r: 20,
        type: c % 2 === 0 ? 'bumper' : 'peg',
        color: c % 2 === 0 ? '#FFE600' : '#00E5FF',
        hitAnim: 0
      });
    }
  });

  // ETAP 3 (Y: 8650 -> 12600)
  const stage3Blocks = [8780, 9980, 11180];
  stage3Blocks.forEach((baseY, bIdx) => {
    movingPlatforms.push({
      baseX: W / 2,
      x: W / 2,
      y: baseY,
      w: 205,
      h: 22,
      amp: 170,
      speed: 0.032 + bIdx * 0.004,
      phase: 0,
      color: '#FF2A85'
    });

    movingPlatforms.push({
      baseX: W / 2,
      x: W / 2,
      y: baseY + 210,
      w: 205,
      h: 22,
      amp: 170,
      speed: 0.036 + bIdx * 0.004,
      phase: Math.PI,
      color: '#00E5FF'
    });

    for (let r = 0; r < 3; r++) {
      const by = baseY + 390 + r * 145;
      const count = r % 2 === 0 ? 4 : 3;
      const gap = 145;
      const sx = (W - (count - 1) * gap) / 2;
      for (let i = 0; i < count; i++) {
        pegs.push({
          x: sx + i * gap,
          y: by,
          r: 24,
          type: 'bumper',
          color: r === 1 ? '#FFE600' : '#FF5400',
          hitAnim: 0
        });
      }
    }

    speedPads.push({ x: W / 2 - 58, y: baseY + 820, w: 116, h: 68 });
    spinners.push({
      x: 215,
      y: baseY + 990,
      length: 115,
      thickness: 16,
      angle: 0,
      speed: 0.055,
      blades: 2,
      color: '#00FF88'
    });
    spinners.push({
      x: W - 215,
      y: baseY + 990,
      length: 115,
      thickness: 16,
      angle: 0.7,
      speed: -0.055,
      blades: 2,
      color: '#00FF88'
    });
  });

  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < 6; i++) {
      pegs.push({
        x: 110 + i * 100 + (r % 2) * 40 - 20,
        y: 12360 + r * 85,
        r: 14,
        type: 'peg',
        color: CANDY_COLORS[(i + r) % CANDY_COLORS.length],
        hitAnim: 0
      });
    }
  }
}

// ----------------------------------------------------------------------------
// HARİTA 2: ZİKZAK KANYONU (Çapraz Kaydırak Şelaleleri + İkiz Köprü & Mikserler)
// ----------------------------------------------------------------------------
function buildMap2ZigzagCanyon() {
  // ETAP 1: Zikzak Şelalesi & Sürpriz Bumper Cepleri (Y: 820 -> 4600)
  for (let z = 0; z < 8; z++) {
    const yTop = 860 + z * 450;
    const fromLeft = z % 2 === 0;

    if (fromLeft) {
      ramps.push({ x1: 24, y1: yTop, x2: 470, y2: yTop + 135, color: '#00F5D4', thickness: 20 });
      speedPads.push({ x: 520, y: yTop + 115, w: 120, h: 65 });
    } else {
      ramps.push({ x1: W - 24, y1: yTop, x2: 250, y2: yTop + 135, color: '#FF2A85', thickness: 20 });
      speedPads.push({ x: 80, y: yTop + 115, w: 120, h: 65 });
    }

    // Her zikzak arasında 3 sıra Elmas Plinko & Bumper dizilimi
    for (let r = 0; r < 3; r++) {
      const py = yTop + 205 + r * 80;
      const cols = r === 1 ? 5 : 6;
      const gap = 95;
      const sx = (W - (cols - 1) * gap) / 2;
      for (let c = 0; c < cols; c++) {
        const isBump = r === 1 && (c === 1 || c === 3);
        pegs.push({
          x: sx + c * gap,
          y: py,
          r: isBump ? 23 : 12,
          type: isBump ? 'bumper' : 'peg',
          color: isBump ? '#FFE600' : CANDY_COLORS[(z + r + c) % CANDY_COLORS.length],
          hitAnim: 0
        });
      }
    }
  }

  // ETAP 2: Çift Köprü Ayrımı & Üçlü Mikser Çarkları (Y: 4650 -> 8600)
  const canyonSectors = [4740, 5700, 6660, 7620];
  canyonSectors.forEach((baseY, idx) => {
    // Ortada V şeklinde Ters Ayırıcı Çatı (Misketleri Sol ve Sağ Kanala Böler!)
    ramps.push({ x1: W / 2, y1: baseY, x2: 220, y2: baseY + 130, color: '#FFE600', thickness: 18 });
    ramps.push({ x1: W / 2, y1: baseY, x2: W - 220, y2: baseY + 130, color: '#FFE600', thickness: 18 });

    // Sol ve Sağ Kanal Çarkları
    spinners.push({
      x: 165,
      y: baseY + 260,
      length: 105,
      thickness: 15,
      angle: 0,
      speed: 0.052,
      blades: 2,
      color: '#00E5FF'
    });
    spinners.push({
      x: W - 165,
      y: baseY + 260,
      length: 105,
      thickness: 15,
      angle: 0.5,
      speed: -0.052,
      blades: 2,
      color: '#FF4D6D'
    });

    // Kanalları tekrar ortaya toplayan huni
    ramps.push({ x1: 24, y1: baseY + 420, x2: 260, y2: baseY + 560, color: '#9D4EDD', thickness: 18 });
    ramps.push({ x1: W - 24, y1: baseY + 420, x2: W - 260, y2: baseY + 560, color: '#9D4EDD', thickness: 18 });

    // Merkez Tek Kanatlı Hızlı Mikser
    spinners.push({
      x: W / 2,
      y: baseY + 670,
      length: 145,
      thickness: 18,
      angle: idx * 0.8,
      speed: (idx % 2 === 0 ? -1 : 1) * 0.06,
      blades: 1,
      color: '#00FF88'
    });

    speedPads.push({ x: W / 2 - 60, y: baseY + 790, w: 120, h: 65 });
  });

  // ETAP 3: Makaslama Kayan Kapılar & Sarkaç Çarklar (Y: 8650 -> 12600)
  const stage3Zones = [8760, 9960, 11160];
  stage3Zones.forEach((baseY, idx) => {
    // Zıt yönlü çalışan üçlü makas kapılar
    for (let k = 0; k < 3; k++) {
      movingPlatforms.push({
        baseX: W / 2,
        x: W / 2,
        y: baseY + k * 175,
        w: 225,
        h: 22,
        amp: 165,
        speed: 0.038 + k * 0.005,
        phase: k * Math.PI * 0.75,
        color: k % 2 === 0 ? '#00F5D4' : '#FF2A85'
      });
    }

    // Elmas dizilimli zıplatıcı tamponlar
    const diamondPts = [
      { x: W / 2, y: baseY + 540 },
      { x: W / 2 - 140, y: baseY + 650 },
      { x: W / 2 + 140, y: baseY + 650 },
      { x: W / 2, y: baseY + 760 },
      { x: 130, y: baseY + 840 },
      { x: W - 130, y: baseY + 840 }
    ];
    diamondPts.forEach((pt, i) => {
      pegs.push({
        x: pt.x,
        y: pt.y,
        r: 25,
        type: 'bumper',
        color: i % 2 === 0 ? '#FF9F1C' : '#C77DFF',
        hitAnim: 0
      });
    });

    // Alt Dev Çark + Yan Hız Pedleri
    spinners.push({
      x: W / 2,
      y: baseY + 995,
      length: 140,
      thickness: 16,
      angle: 0,
      speed: (idx % 2 === 0 ? 1 : -1) * 0.055,
      blades: 2,
      color: '#FFE600'
    });
    speedPads.push({ x: 55, y: baseY + 965, w: 95, h: 65 });
    speedPads.push({ x: W - 150, y: baseY + 965, w: 95, h: 65 });
  });

  // Finiş önü son plinko sırası
  for (let i = 0; i < 6; i++) {
    pegs.push({
      x: 110 + i * 100,
      y: 12420,
      r: 15,
      type: 'peg',
      color: CANDY_COLORS[i % CANDY_COLORS.length],
      hitAnim: 0
    });
  }
}

// ----------------------------------------------------------------------------
// HARİTA 3: KAOS ARENASI (Flipper Tampon Kümesi + 3'lü Çark Şelalesi + Kum Saati)
// ----------------------------------------------------------------------------
function buildMap3ChaosArena() {
  // ETAP 1: Pinball / Flipper Bumper Arenası (Y: 820 -> 4600)
  for (let sec = 0; sec < 5; sec++) {
    const by = 880 + sec * 730;

    // Üst Daraltıcı V-Flipper Kolları
    ramps.push({ x1: 24, y1: by, x2: 245, y2: by + 125, color: '#FF2A85', thickness: 20 });
    ramps.push({ x1: W - 24, y1: by, x2: W - 245, y2: by + 125, color: '#00E5FF', thickness: 20 });

    // Merkez Pinball Bumper Çemberi (Ortada 1 dev, etrafında 6 bumper/peg)
    const cx = W / 2;
    const cy = by + 310;
    pegs.push({ x: cx, y: cy, r: 28, type: 'bumper', color: '#FFE600', hitAnim: 0 });
    for (let a = 0; a < 6; a++) {
      const ang = (a * Math.PI) / 3;
      pegs.push({
        x: cx + Math.cos(ang) * 125,
        y: cy + Math.sin(ang) * 110,
        r: 20,
        type: a % 2 === 0 ? 'bumper' : 'peg',
        color: CANDY_COLORS[(sec + a) % CANDY_COLORS.length],
        hitAnim: 0
      });
    }

    // Alt Çapraz Saptırıcılar & Hız Pedi
    ramps.push({ x1: 140, y1: by + 490, x2: 310, y2: by + 580, color: '#00FF88', thickness: 16 });
    ramps.push({ x1: W - 140, y1: by + 490, x2: W - 310, y2: by + 580, color: '#00FF88', thickness: 16 });
    speedPads.push({ x: W / 2 - 55, y: by + 600, w: 110, h: 64 });
  }

  // ETAP 2: 3'lü Dev Çark Labirenti (Y: 4650 -> 8600)
  const wheelClusters = [4780, 5720, 6660, 7600];
  wheelClusters.forEach((baseY, idx) => {
    // Üstte Yan Yana 2 Çark
    spinners.push({
      x: 215,
      y: baseY + 120,
      length: 120,
      thickness: 16,
      angle: 0,
      speed: 0.05,
      blades: 2,
      color: '#FF9F1C'
    });
    spinners.push({
      x: W - 215,
      y: baseY + 120,
      length: 120,
      thickness: 16,
      angle: 0.4,
      speed: -0.05,
      blades: 2,
      color: '#00F5D4'
    });

    // Ortada Tek Büyük Çark
    spinners.push({
      x: W / 2,
      y: baseY + 370,
      length: 138,
      thickness: 17,
      angle: 0.8,
      speed: (idx % 2 === 0 ? 1 : -1) * 0.055,
      blades: 2,
      color: '#FF2A85'
    });

    // Yanlardan ortaya yönlendiren huni + 2 sıra Plinko
    ramps.push({ x1: 24, y1: baseY + 520, x2: 240, y2: baseY + 640, color: '#C77DFF', thickness: 18 });
    ramps.push({ x1: W - 24, y1: baseY + 520, x2: W - 240, y2: baseY + 640, color: '#C77DFF', thickness: 18 });

    for (let r = 0; r < 2; r++) {
      const py = baseY + 710 + r * 90;
      for (let c = 0; c < 6; c++) {
        pegs.push({
          x: 110 + c * 100 + (r % 2) * 35 - 17,
          y: py,
          r: 14,
          type: 'peg',
          color: CANDY_COLORS[(idx + r + c) % CANDY_COLORS.length],
          hitAnim: 0
        });
      }
    }
  });

  // ETAP 3: Kum Saati Boğazları & Hızlı Kayar Barlar (Y: 8650 -> 12600)
  const hourglassBlocks = [8760, 9980, 11200];
  hourglassBlocks.forEach((baseY, bIdx) => {
    // Kum Saati Daralan Boğaz
    ramps.push({ x1: 24, y1: baseY, x2: 265, y2: baseY + 150, color: '#FFE600', thickness: 20 });
    ramps.push({ x1: W - 24, y1: baseY, x2: W - 265, y2: baseY + 150, color: '#FFE600', thickness: 20 });

    // Boğazın hemen altında hızlı kayar engel
    movingPlatforms.push({
      baseX: W / 2,
      x: W / 2,
      y: baseY + 240,
      w: 195,
      h: 22,
      amp: 175,
      speed: 0.044,
      phase: bIdx,
      color: '#FF4D6D'
    });

    speedPads.push({ x: 80, y: baseY + 340, w: 110, h: 65 });
    speedPads.push({ x: W - 190, y: baseY + 340, w: 110, h: 65 });

    // İkinci Kayar Bar + Bumper Kümesi
    movingPlatforms.push({
      baseX: W / 2,
      x: W / 2,
      y: baseY + 500,
      w: 220,
      h: 22,
      amp: 165,
      speed: 0.04,
      phase: bIdx + Math.PI,
      color: '#00E5FF'
    });

    for (let r = 0; r < 3; r++) {
      const by = baseY + 660 + r * 135;
      const cols = r % 2 === 0 ? 5 : 4;
      const gap = 125;
      const sx = (W - (cols - 1) * gap) / 2;
      for (let c = 0; c < cols; c++) {
        pegs.push({
          x: sx + c * gap,
          y: by,
          r: 23,
          type: 'bumper',
          color: (r + c) % 2 === 0 ? '#FF9F1C' : '#00FF88',
          hitAnim: 0
        });
      }
    }
  });

  // Finiş önü son hızlandırıcılar
  speedPads.push({ x: W / 2 - 70, y: 12380, w: 140, h: 65 });
}

// ============================================================================
// 5. PROFİL FOTOĞRAFI, AVATAR & ORİJİNAL TIKTOK HEDİYE GÖRSELLERİ KATALOĞU
// ============================================================================
const avatarCache = new Map();

// TikTok Orijinal 199 Jetonluk Taç (Crown) İkonu (Kırmızı Kadife & Altın Mücevherli Kral Tacı)
const TIKTOK_CROWN_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="goldG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFF380"/>
      <stop offset="45%" stop-color="#FFD700"/>
      <stop offset="100%" stop-color="#FF8C00"/>
    </linearGradient>
    <linearGradient id="velvetG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF2A85"/>
      <stop offset="100%" stop-color="#B8004C"/>
    </linearGradient>
  </defs>
  <!-- İç Kırmızı Kadife Kubbe -->
  <path d="M12,44 C12,24 26,20 32,20 C38,20 52,24 52,44 Z" fill="url(#velvetG)" />
  <!-- Altın Taç Gövdesi -->
  <polygon points="8,46 6,22 20,33 32,14 44,33 58,22 56,46" fill="url(#goldG)" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
  <!-- Taç Alt Taban Şeridi -->
  <rect x="8" y="45" width="48" height="9" rx="4.5" fill="url(#goldG)" stroke="#FFFFFF" stroke-width="2"/>
  <!-- Mücevherler -->
  <circle cx="6" cy="20" r="3.5" fill="#00E5FF" stroke="#FFFFFF" stroke-width="1.2"/>
  <circle cx="32" cy="12" r="4.5" fill="#FF2A85" stroke="#FFFFFF" stroke-width="1.5"/>
  <circle cx="58" cy="20" r="3.5" fill="#00E5FF" stroke="#FFFFFF" stroke-width="1.2"/>
  <circle cx="20" cy="49.5" r="2.5" fill="#00E5FF"/>
  <circle cx="32" cy="49.5" r="3" fill="#FF2A85"/>
  <circle cx="44" cy="49.5" r="2.5" fill="#00E5FF"/>
</svg>`);

// TikTok Parmak Kalp (5 Jeton - Finger Heart) Birebir El & Kalp İkonu (CDN Yedeği)
const TIKTOK_FINGER_HEART_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="fhHeart" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FF5E9E"/>
      <stop offset="100%" stop-color="#FF0055"/>
    </linearGradient>
    <linearGradient id="fhSkin" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFE0BD"/>
      <stop offset="100%" stop-color="#F1C27D"/>
    </linearGradient>
  </defs>
  <!-- Üstteki Mini Pembe Kalp -->
  <path d="M32,27 C32,27 20,19 20,11.5 C20,7.5 23.2,5 26.8,5 C29.2,5 31,6.5 32,8.2 C33,6.5 34.8,5 37.2,5 C40.8,5 44,7.5 44,11.5 C44,19 32,27 32,27 Z" fill="url(#fhHeart)" stroke="#FFFFFF" stroke-width="2"/>
  <!-- Çapraz Başparmak ve İşaret Parmağı (Parmak Kalp Hareketi) -->
  <rect x="27" y="25" width="9" height="24" rx="4.5" transform="rotate(-18 31 37)" fill="url(#fhSkin)" stroke="#FFFFFF" stroke-width="1.8"/>
  <rect x="28" y="25" width="9" height="24" rx="4.5" transform="rotate(22 33 37)" fill="url(#fhSkin)" stroke="#FFFFFF" stroke-width="1.8"/>
  <!-- El Gövdesi ve Mavi Manşet -->
  <path d="M21,44 C21,39 43,39 43,44 L41,55 L23,55 Z" fill="url(#fhSkin)" stroke="#FFFFFF" stroke-width="1.8"/>
  <rect x="20" y="52" width="24" height="8" rx="3" fill="#00E5FF" stroke="#FFFFFF" stroke-width="1.8"/>
</svg>`);

// TikTok El Kalbi (100 Jeton - Hand Hearts) Orijinal CDN ve Yedek İkonu
const TIKTOK_HAND_HEART_URL = 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/6cd022271dc4669d182cad856384870f~tplv-obj.webp';
const TIKTOK_FINGER_HEART_URL = 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/a4c4dc437fd3a6632aba149769491f49.png~tplv-obj.webp';
const TIKTOK_ROSA_URL = 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/eb77ead5c3abb6da6034d3cf6cfeb438~tplv-obj.webp';

// TikTok Resmi Hediye Kataloğu (En Çok Kullanılan Gerçek TikTok Türkiye Hediyeleri & Orijinal Görselleri)
const TIKTOK_GIFT_CATALOG = {
  'gül': {
    name: 'Gül',
    coins: 1,
    img: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/eba3a9bb85c33e017f3648eaf88d7189~tplv-obj.webp'
  },
  'rose': {
    name: 'Gül',
    coins: 1,
    img: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/eba3a9bb85c33e017f3648eaf88d7189~tplv-obj.webp'
  },
  'parmak kalp': {
    name: 'Parmak Kalp',
    coins: 5,
    img: TIKTOK_FINGER_HEART_URL
  },
  'finger heart': {
    name: 'Parmak Kalp',
    coins: 5,
    img: TIKTOK_FINGER_HEART_URL
  },
  'rosa': {
    name: 'Rosa',
    coins: 10,
    img: TIKTOK_ROSA_URL
  },
  'parfüm': {
    name: 'Parfüm',
    coins: 20,
    img: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/20b8f61246c7b6032777bb81bf4ee055~tplv-obj.webp'
  },
  'perfume': {
    name: 'Parfüm',
    coins: 20,
    img: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/20b8f61246c7b6032777bb81bf4ee055~tplv-obj.webp'
  },
  'donut': {
    name: 'Donut',
    coins: 30,
    img: '/images/donut.svg'
  },
  'doughnut': {
    name: 'Donut',
    coins: 30,
    img: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/4e7ad6bdf0a1d860c538f38026d4e812~tplv-obj.webp'
  },
  'el kalbi': {
    name: 'El Kalbi',
    coins: 100,
    img: TIKTOK_HAND_HEART_URL
  },
  'hand heart': {
    name: 'El Kalbi',
    coins: 100,
    img: TIKTOK_HAND_HEART_URL
  },
  'hand hearts': {
    name: 'El Kalbi',
    coins: 100,
    img: TIKTOK_HAND_HEART_URL
  },
  'konfeti': {
    name: 'El Kalbi',
    coins: 100,
    img: TIKTOK_HAND_HEART_URL
  },
  'taç': {
    name: 'Taç',
    coins: 199,
    img: TIKTOK_CROWN_SVG
  },
  'crown': {
    name: 'Taç',
    coins: 199,
    img: TIKTOK_CROWN_SVG
  },
  'little crown': {
    name: 'Taç',
    coins: 199,
    img: TIKTOK_CROWN_SVG
  }
};

// Sayfadaki İkonları Başlat (Orijinal TikTok CDN + Kırılmaz Yedek)
const crownLegendEl = document.getElementById('crownLegendImg');
if (crownLegendEl) crownLegendEl.src = TIKTOK_CROWN_SVG;
const crownBtnImgEl = document.getElementById('crownBtnImg');
if (crownBtnImgEl) crownBtnImgEl.src = TIKTOK_CROWN_SVG;
const crownTestBtnEl = document.getElementById('crownTestBtn');
if (crownTestBtnEl) crownTestBtnEl.setAttribute('data-img', TIKTOK_CROWN_SVG);

function initTeamMarbles() {
  marbles = [];
  TEAMS.forEach((team, index) => {
    const angle = (index / TEAMS.length) * Math.PI * 2 - Math.PI / 2;
    const dist = 70 + (index % 2) * 22;
    const x = RING_CENTER_X + Math.cos(angle) * dist;
    const y = RING_CENTER_Y + Math.sin(angle) * dist;

    marbles.push({
      team: team,
      uniqueId: team.id,
      nickname: team.name,
      x: x,
      y: y,
      vx: (gameRandom() - 0.5) * 3.5,
      vy: (gameRandom() - 0.5) * 2.5,
      baseRadius: 22,
      radius: 22,               // Orijinal harita geçitlerine ve hunilerine %100 uyumlu boyut
      rotation: 0,              // Gerçekçi yuvarlanma açısı
      coins: 0,
      fireTimer: 0,
      ghostTimer: 0,            // 30 Jeton Donut ile engellerden geçme
      freezeTimer: 0,           // 100 Jeton El Kalbi ile 2 sn donma
      speedPadBoostTimer: 0,
      stuckTimer: 0,
      noProgressTimer: 0,
      lastProgressY: y,
      finished: false,
      finishRank: 0,
      trail: []
    });
  });
}

// ============================================================================
// 6. FİZİK & HAREKET MOTORU (ORİJİNAL KALİBRELİ + TAKILMA ÖNLEYİCİ)
// ============================================================================
function resolveLineCollision(marble, x1, y1, x2, y2, radiusSum, restitution = 0.65, surfaceBoost = 0) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return false;

  let t = ((marble.x - x1) * dx + (marble.y - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  const distX = marble.x - closestX;
  const distY = marble.y - closestY;
  const dist = Math.hypot(distX, distY);

  if (dist < radiusSum && dist > 0.0001) {
    const nx = distX / dist;
    const ny = distY / dist;
    const overlap = radiusSum - dist;

    marble.x += nx * overlap;
    marble.y += ny * overlap;

    const vn = marble.vx * nx + marble.vy * ny;
    if (vn < 0) {
      marble.vx -= (1 + restitution) * vn * nx;
      marble.vy -= (1 + restitution) * vn * ny;
      if (surfaceBoost !== 0) {
        marble.vx += -ny * surfaceBoost;
        marble.vy += nx * surfaceBoost;
      }
      sfx.playPop(marble.y);
    }
    return true;
  }
  return false;
}

function resolveRampCollision(m, r) {
  resolveLineCollision(m, r.x1, r.y1, r.x2, r.y2, m.radius + r.thickness / 2, 0.55);
}

function updatePhysics(dt) {
  worldTime += dt;
  if (screenShakeTimer > 0) screenShakeTimer = Math.max(0, screenShakeTimer - dt);

  // Çember içi dönen çubuğun açısı
  lobbyBarAngle += 0.045;

  // Çarkları döndür
  for (const sp of spinners) {
    sp.angle += sp.speed;
  }
  for (const peg of pegs) {
    if (peg.hitAnim > 0) peg.hitAnim = Math.max(0, peg.hitAnim - dt * 4);
  }

  // Sağa-sola kayan platformları güncelle
  for (const mp of movingPlatforms) {
    const prevX = mp.x;
    mp.x = mp.baseX + Math.sin(worldTime * mp.speed * 60 + mp.phase) * mp.amp;
    mp.vx = mp.x - prevX;
  }

  const gravity = gameState === 'LOBBY_RING' ? 0.24 : 0.22;

  // Sıkı rekabet (Rubber-banding): Geride kalanların kopmasını önle
  let leaderY = -Infinity;
  let secondY = -Infinity;
  if (gameState === 'RACING') {
    for (const m of marbles) {
      if (m.finished) continue;
      if (m.y > leaderY) {
        secondY = leaderY;
        leaderY = m.y;
      } else if (m.y > secondY) {
        secondY = m.y;
      }
    }
  }

  // Misketlerin Güncellenmesi
  for (let i = 0; i < marbles.length; i++) {
    const m = marbles[i];

    // İzi kaydet (Turbo kuyruğu)
    if (m.trail.length > (m.fireTimer > 0 || m.ghostTimer > 0 ? 14 : 8)) m.trail.shift();
    m.trail.push({ x: m.x, y: m.y, r: m.radius });

    // Dondurma (Freeze) Etkisi - 100 Jetonluk Tuzak (2 Saniye)
    if (m.freezeTimer > 0) {
      m.freezeTimer = Math.max(0, m.freezeTimer - dt);
      m.vx = 0;
      m.vy = 0;
      m.stuckTimer = 0;
      m.noProgressTimer = 0;
      continue;
    }

    // Turbo / Ghost sürelerini azalt
    if (gameState === 'RACING') {
      if (m.fireTimer > 0) m.fireTimer = Math.max(0, m.fireTimer - dt);
      if (m.ghostTimer > 0) m.ghostTimer = Math.max(0, m.ghostTimer - dt);
      if (m.speedPadBoostTimer > 0) m.speedPadBoostTimer = Math.max(0, m.speedPadBoostTimer - dt);
    }

    if (gameState === 'LOBBY_RING') {
      m.vy += gravity;
      m.vx *= 0.992;
      if (m.vy > 9) m.vy = 9;
      if (m.vy < -9) m.vy = -9;

      m.x += m.vx;
      m.y += m.vy;
      m.rotation = (m.rotation || 0) + m.vx * 0.075;

      // Dönen çubukla çarpışma
      const barLen = RING_RADIUS - 38;
      const bx1 = RING_CENTER_X - Math.cos(lobbyBarAngle) * barLen;
      const by1 = RING_CENTER_Y - Math.sin(lobbyBarAngle) * barLen;
      const bx2 = RING_CENTER_X + Math.cos(lobbyBarAngle) * barLen;
      const by2 = RING_CENTER_Y + Math.sin(lobbyBarAngle) * barLen;
      resolveLineCollision(m, bx1, by1, bx2, by2, m.radius + 11, 0.85, 2.5);

      // Çember dış duvarı ile çarpışma
      const dx = m.x - RING_CENTER_X;
      const dy = m.y - RING_CENTER_Y;
      const dist = Math.hypot(dx, dy);
      const maxDist = RING_RADIUS - m.radius - 6;
      if (dist > maxDist && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        m.x = RING_CENTER_X + nx * maxDist;
        m.y = RING_CENTER_Y + ny * maxDist;
        const vn = m.vx * nx + m.vy * ny;
        if (vn > 0) {
          m.vx -= 1.75 * vn * nx;
          m.vy -= 1.75 * vn * ny;
          m.vx += -ny * 1.4;
          m.vy += nx * 1.4;
          sfx.playPop(m.y);
        }
      }
      continue;
    }

    if (gameState !== 'RACING') continue;

    // RACING Fiziği
    let catchUpAccel = 0;
    let catchUpMaxBonus = 0;
    let soloLeaderPenalty = 0;
    if (leaderY > -Infinity) {
      const gap = leaderY - m.y;
      if (gap > 260) {
        catchUpAccel = Math.min(0.32, (gap - 260) * 0.0005);
        catchUpMaxBonus = Math.min(4.7, (gap - 260) * 0.005);
      } else if (m.y >= leaderY - 2 && secondY > -Infinity && (leaderY - secondY) > 300 && m.fireTimer <= 0 && m.ghostTimer <= 0) {
        soloLeaderPenalty = 1.2;
      }
    }

    m.vy += gravity + (m.fireTimer > 0 ? 0.14 : 0) + catchUpAccel;

    // 30 Jetonluk Donut ile Engelsiz Turbo Fırlama
    if (m.ghostTimer > 0) {
      m.vy = Math.max(m.vy, 14.0);
    }

    m.vx *= 0.992;
    const baseMaxVy = m.ghostTimer > 0 ? 16.5 : (m.speedPadBoostTimer > 0 ? 13.5 : (m.fireTimer > 0 ? 11.5 : 8.2));
    const maxVy = Math.min(16.5, baseMaxVy + catchUpMaxBonus - soloLeaderPenalty);
    if (m.vy > maxVy) m.vy = maxVy;
    if (m.vy < -12) m.vy = -12;
    if (Math.abs(m.vx) > 9) m.vx = Math.sign(m.vx) * 9;

    // Konum güncelle
    m.x += m.vx;
    m.y += m.vy;

    // GERÇEKÇİ YUVARLANMA (Toplar döner!)
    m.rotation = (m.rotation || 0) + (m.vx * 0.075);

    // Yan duvarlar
    const wallMargin = 24 + m.radius;
    if (m.x < wallMargin) {
      m.x = wallMargin;
      m.vx = Math.abs(m.vx) * 0.75 + 1.2;
      sfx.playPop(m.y);
    } else if (m.x > W - wallMargin) {
      m.x = W - wallMargin;
      m.vx = -Math.abs(m.vx) * 0.75 - 1.2;
      sfx.playPop(m.y);
    }

    // Çemberden çıkışta alt kapı huni yönlendirmesi (çember ağzında takılmayı %100 önler)
    if (m.y < RING_CENTER_Y + RING_RADIUS + 20) {
      const dx = m.x - RING_CENTER_X;
      const dy = m.y - RING_CENTER_Y;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const isBottomGate = angle > 0.33 * Math.PI && angle < 0.67 * Math.PI;
      const maxDist = RING_RADIUS - m.radius - 6;

      if (dist < RING_RADIUS) {
        m.vx += (RING_CENTER_X - m.x) * 0.035;
      }

      if (!isBottomGate && dist > maxDist && dist < RING_RADIUS + 25 && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        m.x = RING_CENTER_X + nx * maxDist;
        m.y = RING_CENTER_Y + ny * maxDist;
        const vn = m.vx * nx + m.vy * ny;
        if (vn > 0) {
          m.vx -= 1.5 * vn * nx;
          m.vy -= 1.5 * vn * ny;
        }
        m.vx += (RING_CENTER_X - m.x) * 0.065;
      }
    }

    // Hız Pedleri
    for (const pad of speedPads) {
      if (
        m.x > pad.x - m.radius &&
        m.x < pad.x + (pad.w || pad.width || 80) + m.radius &&
        m.y > pad.y &&
        m.y < pad.y + (pad.h || pad.height || 30)
      ) {
        if (m.vy < 13.5) {
          m.vy = 13.5;
          m.speedPadBoostTimer = 0.45;
          m.fireTimer = Math.max(m.fireTimer, 1.4);
          sfx.playSpeedPad(m.y);
          spawnParticles(m.x, m.y, '#00FF88', 6);
        }
      }
    }

    // Ghost modunda değilse engellerle çarpışır
    if (m.ghostTimer <= 0) {
      // 1. Plinko Çivileri & Zıplatıcı Mantarlar (Bumper)
      for (const peg of pegs) {
        if (Math.abs(peg.y - m.y) > 70) continue;
        const dx = m.x - peg.x;
        const dy = m.y - peg.y;
        const dist = Math.hypot(dx, dy);
        const minDist = m.radius + peg.r;

        if (dist < minDist && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          m.x = peg.x + nx * minDist;
          m.y = peg.y + ny * minDist;

          const bounce = peg.type === 'bumper' ? 1.35 : 0.72;
          const vn = m.vx * nx + m.vy * ny;
          if (vn < 0) {
            m.vx -= (1 + bounce) * vn * nx + (gameRandom() - 0.5) * 1.8;
            m.vy -= (1 + bounce) * vn * ny;
          }
          peg.hitAnim = 1.0;
          if (peg.type === 'bumper') {
            sfx.playBoing(m.y);
            spawnParticles(peg.x, peg.y, peg.color, 10);
          } else {
            sfx.playPop(m.y);
          }
        }
      }

      // 2. Eğimli Sabit Rampalar
      for (const r of ramps) {
        if (Math.abs((r.y1 + r.y2) / 2 - m.y) > 160) continue;
        resolveLineCollision(m, r.x1, r.y1, r.x2, r.y2, m.radius + r.thickness / 2, 0.55);
      }

      // 3. Dönen Çarklar / Değirmenler (Merkez Göbek + Kanatlar)
      for (const sp of spinners) {
        if (Math.abs(sp.y - m.y) > sp.length + 50) continue;

        const hdx = m.x - sp.x;
        const hdy = m.y - sp.y;
        const hDist = Math.hypot(hdx, hdy);
        const hMin = m.radius + 14;
        if (hDist < hMin && hDist > 0.001) {
          const hnx = hdx / hDist;
          const hny = hdy / hDist;
          m.x = sp.x + hnx * hMin;
          m.y = sp.y + hny * hMin;
          const hvn = m.vx * hnx + m.vy * hny;
          if (hvn < 0) {
            m.vx -= 1.65 * hvn * hnx;
            m.vy -= 1.65 * hvn * hny;
          }
        }

        for (let b = 0; b < sp.blades; b++) {
          const ang = sp.angle + (b * Math.PI) / sp.blades;
          const x1 = sp.x - Math.cos(ang) * sp.length;
          const y1 = sp.y - Math.sin(ang) * sp.length;
          const x2 = sp.x + Math.cos(ang) * sp.length;
          const y2 = sp.y + Math.sin(ang) * sp.length;
          resolveLineCollision(
            m,
            x1,
            y1,
            x2,
            y2,
            m.radius + sp.thickness / 2,
            0.75,
            sp.speed * 45
          );
        }
      }

      // 4. Hareketli Platformlar
      for (const mp of movingPlatforms) {
        if (Math.abs(mp.y - m.y) > 70) continue;
        const hitMp = resolveLineCollision(
          m,
          mp.x - mp.w / 2, mp.y,
          mp.x + mp.w / 2, mp.y,
          m.radius + mp.h / 2,
          0.75
        );
        if (hitMp && mp.vx) {
          m.vx += mp.vx * 0.25;
        }
      }
    }

    // Anti-Stuck (Misketin herhangi bir engelde veya köşede takılı kalmasını %100 önler)
    if (Math.hypot(m.vx, m.vy) < 0.45) {
      m.stuckTimer = (m.stuckTimer || 0) + dt;
      if (m.stuckTimer >= 0.45) {
        m.vx += (gameRandom() - 0.5) * 4.5;
        m.vy += 2.8;
        m.stuckTimer = 0;
      }
    } else {
      m.stuckTimer = 0;
    }

    if (m.lastProgressY === undefined) m.lastProgressY = m.y;
    if (Math.abs(m.y - m.lastProgressY) >= 38) {
      m.lastProgressY = m.y;
      m.noProgressTimer = 0;
    } else {
      m.noProgressTimer = (m.noProgressTimer || 0) + dt;
      if (m.noProgressTimer >= 2.2) {
        m.vx += (gameRandom() - 0.5) * 6.5;
        m.vy = Math.max(m.vy, 5.5);
        m.y += 4;
        m.lastProgressY = m.y;
        m.noProgressTimer = 0;
      }
    }

    // Finiş Çizgisini Geçme Kontrolü (Host bağlıysa kararı Host verir, değilse OBS kendisi verir)
    if (gameState === 'RACING' && !m.finished && m.y >= FINISH_LINE_Y) {
      m.finished = true;
      if (!isObsClient || (Date.now() - lastHostSnapshotAt >= 1200)) {
        triggerWinner(m.team);
      }
    }
  }

  // Misketlerin Birbirleriyle Çarpışması
  for (let i = 0; i < marbles.length; i++) {
    for (let j = i + 1; j < marbles.length; j++) {
      const m = marbles[i];
      const m2 = marbles[j];
      if (m.finished || m2.finished) continue;
      const dx = m2.x - m.x;
      const dy = m2.y - m.y;
      const minDist = m.radius + m2.radius;
      if (dx * dx + dy * dy < minDist * minDist) {
        const dist = Math.hypot(dx, dy) || 1;
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = (minDist - dist) * 0.5;
        m.x -= nx * overlap;
        m.y -= ny * overlap;
        m2.x += nx * overlap;
        m2.y += ny * overlap;

        const dvx = m2.vx - m.vx;
        const dvy = m2.vy - m.vy;
        const vn = dvx * nx + dvy * ny;
        if (vn < 0) {
          const impulse = -0.85 * vn;
          m.vx -= impulse * nx;
          m.vy -= impulse * ny;
          m2.vx += impulse * nx;
          m2.vy += impulse * ny;
          sfx.playPop(m.y);
        }
      }
    }
  }

  // Kamera Takibi
  if (gameState === 'RACING') {
    const leader = getLeaderMarble();
    if (leader) {
      targetCameraY = Math.max(0, Math.min(FINISH_LINE_Y - H * 0.62, leader.y - H * 0.42));
      cameraY += (targetCameraY - cameraY) * 0.12;
    }
  } else if (gameState === 'LOBBY_RING') {
    targetCameraY = 0;
    cameraY += (0 - cameraY) * 0.15;
  }
}

function getLeaderMarble() {
  let leader = null;
  let maxY = -Infinity;
  for (const m of marbles) {
    if (m.y > maxY) {
      maxY = m.y;
      leader = m;
    }
  }
  return leader;
}

// ============================================================================
// 7. GERÇEK TİKTOK HEDİYE VE BOOST MOTORU
// ============================================================================
function boostTeam(teamId, donorName = 'İzleyici', coins = 30) {
  const marble = marbles.find(m => m.team.id === teamId);
  if (!marble) return;

  marble.fireTimer = 3.5;
  marble.ghostTimer = 3.5;   // 30 Jeton Donut ile engellerin içinden fırlar
  marble.vy = Math.max(marble.vy + 7, 14);
  marble.coins += coins;
  marble.team.totalCoins += coins;

  sfx.playGiftBoost(3);
  screenShakeTimer = 0.25;
  spawnParticles(marble.x, marble.y, marble.team.color, 20);
  spawnFloatingText(marble.x, marble.y - 35, `🚀 ${marble.team.short} TURBO BOOST!`, marble.team.color);

  showBoostToast(
    donorName,
    'Donut (30 Jeton)',
    coins,
    `🚀 ${marble.team.name.toUpperCase()} ENGELSİZ ROKET MODUNDA!`,
    'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/4e7ad6bdf0a1d860c538f38026d4e812~tplv-obj.webp'
  );
}

// 100 Jetonluk El Kalbi: 1. Sıradaki Takımı 1 Saniye Dondur!

// 1000 Beğeni Hedefi & Boost Motoru
function addTeamLikes(teamId, count = 1, donorName = 'İzleyici') {
  const team = TEAMS.find(t => t.id === teamId);
  if (!team) return;

  team.totalLikes = (team.totalLikes || 0) + count;
  if (!team.likesMilestone) team.likesMilestone = 1000;

  // 1000 Beğeni barajına ulaştığında küçük boost ver
  while (team.totalLikes >= team.likesMilestone) {
    team.likesMilestone += 1000;
    triggerTeamLikeBoost(team.id, donorName);
  }

  updateLikesHUD();
}

function triggerTeamLikeBoost(teamId, donorName = 'İzleyici') {
  const marble = marbles.find(m => m.team.id === teamId);
  if (!marble) return;

  // 1000 Beğeni Boostu: İleri doğru ivme & alev efekti
  marble.fireTimer = 2.5;
  marble.vy = Math.max(marble.vy + 5.0, 12.0);

  sfx.playSpeedPad(marble.y);
  screenShakeTimer = 0.15;
  spawnParticles(marble.x, marble.y, '#FF1744', 25);
  spawnFloatingText(marble.x, marble.y - 45, `❤️ ${marble.team.short} 1.000 BEĞENİ BOOSTU!`, '#FF1744');

  showBoostToast(
    donorName,
    '1.000 Beğeni Hedefi!',
    0,
    `❤️ ${marble.team.name.toUpperCase()} 1.000 BEĞENİYE ULAŞTI VE BOOST ALDI!`,
    '/images/like_heart.svg'
  );
}

function trigger100CoinFreeze(donorName = 'İzleyici') {
  const leader = getLeaderMarble();
  if (!leader) return;

  leader.freezeTimer = 2.0; // Kullanıcı isteği: Tam 2 saniye dondur
  leader.vx = 0;
  leader.vy = 0;

  sfx.playFreezeSound();
  screenShakeTimer = 0.3;
  spawnParticles(leader.x, leader.y, '#00E5FF', 35);
  spawnFloatingText(leader.x, leader.y - 35, `❄️ ${leader.team.short} 2 SN DONDURULDU!`, '#00E5FF');

  showBoostToast(
    donorName,
    'El Kalbi (100 Jeton)',
    100,
    `❄️ 1. SIRADAKİ ${leader.team.name.toUpperCase()} 2 SANİYE DONDURULDU!`,
    '/images/hand_heart.svg'
  );
}

// 199 Jetonluk Taç: Mega Şampiyonluk İvmesi
function triggerCrownMegaBoost(teamId, donorName = 'İzleyici') {
  const marble = marbles.find(m => m.team.id === teamId);
  if (!marble) return;

  marble.fireTimer = 5.0;
  marble.ghostTimer = 5.0;
  marble.vy = 18;
  marble.coins += 199;
  marble.team.totalCoins += 199;

  sfx.playGiftBoost(4);
  screenShakeTimer = 0.4;
  spawnParticles(marble.x, marble.y, '#FFD700', 30);
  spawnFloatingText(marble.x, marble.y - 40, `👑 ${marble.team.short} ŞAMPİYONLUK TAÇI!`, '#FFD700');

  showBoostToast(
    donorName,
    'Taç (199 Jeton)',
    199,
    `👑 ${marble.team.name.toUpperCase()} MEGA LİDERLİK PATLAMASI!`,
    ''
  );
}

function applyMiniPush(teamId, amount = 2.0) {
  const marble = marbles.find(m => m.team.id === teamId);
  if (!marble || marble.freezeTimer > 0) return;
  marble.vy += amount;
  spawnParticles(marble.x, marble.y, marble.team.color, 5);
}

// ============================================================================
// 8. TUR GEÇİŞLERİ & MARŞ ÇALMA
// ============================================================================
function startRace() {
  gameState = 'RACING';
  stateTimer = 0;
  sfx.playCountdownBeep(true);
  sfx.startBgMusic(); // Maç müziğini başlat
  for (const m of marbles) {
    m.vy += 3.5 + gameRandom() * 2.5;
    m.vx += (gameRandom() - 0.5) * 3.5;
  }
  const centerBanner = document.getElementById('centerBanner');
  if (centerBanner) centerBanner.classList.add('hidden');
}

function triggerWinner(team) {
  if (gameState === 'PODIUM') return;
  gameState = 'PODIUM';
  stateTimer = PODIUM_DURATION;
  winnerTeam = team;
  team.wins += 1;

  // Kazanan takımın MARŞINI ÇAL (forcePlay = true)!
  sfx.playTeamAnthem(team.id, true);

  showPodiumModal(team);
}

function resetToLobby() {
  sfx.stopAnthem();
  sfx.resumeBgMusic(); // Yeni tur başlayınca maç müziğini geri aç
  gameState = 'LOBBY_RING';
  stateTimer = JOIN_DURATION;
  winnerTeam = null;
  cameraY = 0;
  currentMapIndex = (currentMapIndex + 1) % 3;
  buildCourse(currentMapIndex);
  initTeamMarbles();

  const podiumModal = document.getElementById('podiumModal');
  if (podiumModal) podiumModal.classList.add('hidden');

  const centerBanner = document.getElementById('centerBanner');
  if (centerBanner) {
    centerBanner.classList.remove('hidden');
    document.getElementById('bannerBadge').textContent = 'HAZIRLIK AÇIK';
    document.getElementById('bannerMain').textContent = 'Takımını Destekle!';
    document.getElementById('bannerSub').textContent = '🏁 Takımını Yorumlarda ve Beğenilerle Destekle!';
  }
}

// ============================================================================
// 9. ÇİZİM FONKSİYONLARI (RENDER)
// ============================================================================
function render() {
  ctx.clearRect(0, 0, W, H);
  drawCandyBackground();
  ctx.save();

  if (screenShakeTimer > 0) {
    ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
  }
  ctx.translate(0, -cameraY);

  // Etap Bölme Çizgileri & Etiketleri
  drawStageDividers();

  // 2. Başlangıç Çemberi
  drawLobbyRing();

  // 3. Parkur Engelleri (Orijinal zengin map)
  drawObstacles();

  // 4. Misketler
  drawMarbles();

  // 5. Parçacıklar & Yazılar
  drawParticles();

  ctx.restore();

  // HUD
  updateHUD();
}

function drawLobbyRing() {
  ctx.beginPath();
  ctx.arc(RING_CENTER_X, RING_CENTER_Y, RING_RADIUS, 0, Math.PI * 2);
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#FFE600';
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 230, 0, 0.05)';
  ctx.fill();

  // Çember içi dönen mor karıştırıcı çubuk
  const barLen = RING_RADIUS - 38;
  ctx.save();
  ctx.translate(RING_CENTER_X, RING_CENTER_Y);
  ctx.rotate(lobbyBarAngle);
  const barGrad = ctx.createLinearGradient(-barLen, 0, barLen, 0);
  barGrad.addColorStop(0, '#FF2A85');
  barGrad.addColorStop(0.5, '#C77DFF');
  barGrad.addColorStop(1, '#00E5FF');
  ctx.fillStyle = barGrad;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-barLen, -10, barLen * 2, 20, 10);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Çember Alt Kapısı (Yarış başlayınca açılır)
  if (gameState === 'LOBBY_RING') {
    ctx.strokeStyle = '#FF0055';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(RING_CENTER_X, RING_CENTER_Y, RING_RADIUS, Math.PI * 0.35, Math.PI * 0.65);
    ctx.stroke();

    // Çember içi sayaç
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '800 18px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAKIM KAPİŞMASI', RING_CENTER_X, RING_CENTER_Y - 95);

    ctx.font = '800 46px Fredoka, sans-serif';
    ctx.fillStyle = stateTimer <= 5 ? '#FF2A85' : '#FFE600';
    ctx.fillText(`${Math.ceil(stateTimer)}`, RING_CENTER_X, RING_CENTER_Y + 70);
  }
}

function getCurrentStageNumber() {
  if (gameState === 'LOBBY_RING') return 0;
  const leader = getLeaderMarble();
  if (!leader) return 1;
  if (leader.y < STAGE1_END_Y) return 1;
  if (leader.y < STAGE2_END_Y) return 2;
  return 3;
}

function drawCandyBackground() {
  // Aktif haritanın ve etabın renk paletine göre canlı arka plan geçişleri
  const stg = getCurrentStageNumber();
  const mapMeta = MAPS_META[currentMapIndex] || MAPS_META[0];
  const palette = mapMeta.bgColors[Math.max(0, Math.min(2, stg - 1))] || mapMeta.bgColors[0];

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, palette[0]);
  grad.addColorStop(0.5, palette[1]);
  grad.addColorStop(1, palette[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Neşeli Parlak Polka Noktaları / Grid Deseni (Parallax - Tek çağrıda optimize çizim)
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.045)';
  const spacing = 80;
  const offsetY = -(cameraY * 0.4) % spacing;
  ctx.beginPath();
  for (let y = offsetY - spacing; y < H + spacing; y += spacing) {
    for (let x = 40; x < W; x += spacing) {
      ctx.moveTo(x + 5, y);
      ctx.arc(x, y, 5, 0, Math.PI * 2);
    }
  }
  ctx.fill();
  ctx.restore();

  // Yan Duvar Şeker Şeritleri
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fillRect(0, 0, 22, H);
  ctx.fillRect(W - 22, 0, 22, H);
}

function drawStageDividers() {
  const mapMeta = MAPS_META[currentMapIndex] || MAPS_META[0];
  const dividers = [
    { y: STAGE1_START_Y, label: mapMeta.stage1Label, color: '#00E5FF' },
    { y: STAGE1_END_Y + 40, label: mapMeta.stage2Label, color: '#FFE600' },
    { y: STAGE2_END_Y + 60, label: mapMeta.stage3Label, color: '#FF2A85' }
  ];

  for (const d of dividers) {
    if (d.y < cameraY - 100 || d.y > cameraY + H + 100) continue;
    ctx.save();
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    ctx.moveTo(24, d.y);
    ctx.lineTo(W - 24, d.y);
    ctx.stroke();

    // Etap Başlık Tableti
    ctx.fillStyle = 'rgba(18, 6, 44, 0.9)';
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    const bw = 420;
    const bh = 38;
    ctx.beginPath();
    ctx.roundRect(W / 2 - bw / 2, d.y - bh / 2, bw, bh, 19);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 16px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.label, W / 2, d.y);
    ctx.restore();
  }
}

function drawLobbyRing() {
  if (RING_CENTER_Y + RING_RADIUS < cameraY - 120) return;

  ctx.save();
  // Çember içi parlak zemin
  const rGrad = ctx.createRadialGradient(
    RING_CENTER_X, RING_CENTER_Y, 20,
    RING_CENTER_X, RING_CENTER_Y, RING_RADIUS
  );
  rGrad.addColorStop(0, 'rgba(0, 229, 255, 0.18)');
  rGrad.addColorStop(1, 'rgba(157, 78, 221, 0.28)');

  ctx.beginPath();
  if (gameState === 'LOBBY_RING') {
    ctx.arc(RING_CENTER_X, RING_CENTER_Y, RING_RADIUS, 0, Math.PI * 2);
  } else {
    // Yarış başlayınca alt kapak açık çizilir
    ctx.arc(RING_CENTER_X, RING_CENTER_Y, RING_RADIUS, 0.66 * Math.PI, 0.34 * Math.PI);
  }
  ctx.fillStyle = rGrad;
  ctx.fill();

  // Dış renkli kalın halka
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#00E5FF';
  ctx.stroke();

  // Kesikli dış süs halkası
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#FFE600';
  ctx.setLineDash([16, 12]);
  ctx.beginPath();
  ctx.arc(RING_CENTER_X, RING_CENTER_Y, RING_RADIUS + 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Ortadaki Dönen Mor Çubuk
  const barLen = RING_RADIUS - 38;
  ctx.save();
  ctx.translate(RING_CENTER_X, RING_CENTER_Y);
  ctx.rotate(lobbyBarAngle);

  const barGrad = ctx.createLinearGradient(-barLen, 0, barLen, 0);
  barGrad.addColorStop(0, '#FF2A85');
  barGrad.addColorStop(0.5, '#C77DFF');
  barGrad.addColorStop(1, '#00E5FF');

  ctx.fillStyle = barGrad;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-barLen, -11, barLen * 2, 22, 11);
  ctx.fill();
  ctx.stroke();

  // Merkez vida
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fillStyle = '#FFE600';
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Çember içi büyük geri sayım göstergesi (Son 10 saniyede devleşir)
  if (gameState === 'LOBBY_RING') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.font = '800 20px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.fillText('DÖNEN ÇEMBER', RING_CENTER_X, RING_CENTER_Y - 110);

    ctx.font = '800 50px Fredoka, sans-serif';
    ctx.fillStyle = stateTimer <= 5 ? '#FF2A85' : '#FFE600';
    ctx.strokeStyle = '#1a083d';
    ctx.lineWidth = 6;
    const secText = `${Math.ceil(stateTimer)}`;
    ctx.strokeText(secText, RING_CENTER_X, RING_CENTER_Y - 62);
    ctx.fillText(secText, RING_CENTER_X, RING_CENTER_Y - 62);
  }

  ctx.restore();
}

function drawObstacles() {
  // 1. Yeşil Hız Pedleri (>>>)
  for (const pad of speedPads) {
    if (pad.y + pad.h < cameraY - 50 || pad.y > cameraY + H + 50) continue;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 255, 136, 0.22)';
    ctx.strokeStyle = '#00FF88';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(pad.x, pad.y, pad.w, pad.h, 14);
    ctx.fill();
    ctx.stroke();

    // Hareketli aşağı oklar (v v v)
    const animOffset = (worldTime * 40) % 18;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 2; i++) {
      const cy = pad.y + 16 + i * 20 + animOffset * 0.6;
      ctx.beginPath();
      ctx.moveTo(pad.x + 28, cy - 6);
      ctx.lineTo(pad.x + pad.w / 2, cy + 5);
      ctx.lineTo(pad.x + pad.w - 28, cy - 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2. Eğimli Sabit Şeker Rampalar
  for (const r of ramps) {
    const minY = Math.min(r.y1, r.y2);
    const maxY = Math.max(r.y1, r.y2);
    if (maxY < cameraY - 60 || minY > cameraY + H + 60) continue;

    ctx.save();
    ctx.lineCap = 'round';
    // Dış beyaz kontur
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = r.thickness + 5;
    ctx.beginPath();
    ctx.moveTo(r.x1, r.y1);
    ctx.lineTo(r.x2, r.y2);
    ctx.stroke();

    // İç canlı renk
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.thickness;
    ctx.beginPath();
    ctx.moveTo(r.x1, r.y1);
    ctx.lineTo(r.x2, r.y2);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Plinko Çivileri & Zıplatıcı Mantarlar (Bumper)
  for (const peg of pegs) {
    if (peg.y < cameraY - 50 || peg.y > cameraY + H + 50) continue;
    ctx.save();
    const scale = 1 + peg.hitAnim * 0.35;
    const rad = peg.r * scale;

    ctx.beginPath();
    ctx.arc(peg.x, peg.y, rad, 0, Math.PI * 2);
    ctx.fillStyle = peg.color;
    ctx.fill();
    ctx.lineWidth = peg.type === 'bumper' ? 4 : 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    if (peg.type === 'bumper') {
      // Bumper ortasında yıldız/halka detayı
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, rad * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFE600';
      ctx.fill();
    } else {
      // Parlama noktası
      ctx.beginPath();
      ctx.arc(peg.x - rad * 0.3, peg.y - rad * 0.3, rad * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fill();
    }
    ctx.restore();
  }

  // 4. Dönen Değirmen Çarklar
  for (const sp of spinners) {
    if (sp.y + sp.length < cameraY - 60 || sp.y - sp.length > cameraY + H + 60) continue;
    ctx.save();
    ctx.translate(sp.x, sp.y);
    for (let b = 0; b < sp.blades; b++) {
      ctx.save();
      ctx.rotate(sp.angle + (b * Math.PI) / sp.blades);
      ctx.fillStyle = sp.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-sp.length, -sp.thickness / 2, sp.length * 2, sp.thickness, sp.thickness / 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // Çark göbeği
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#FFE600';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();
  }

  // 5. Sağa-Sola Kayan Hareketli Platformlar (Etap 3)
  for (const mp of movingPlatforms) {
    if (mp.y < cameraY - 60 || mp.y > cameraY + H + 60) continue;
    ctx.save();
    ctx.fillStyle = mp.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(mp.x - mp.w / 2, mp.y - mp.h / 2, mp.w, mp.h, mp.h / 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 6. Damalı Bitiş Çizgisi (FINISH)
  if (FINISH_LINE_Y > cameraY - 100 && FINISH_LINE_Y < cameraY + H + 100) {
    const tileW = 28;
    const rows = 2;
    for (let r = 0; r < rows; r++) {
      for (let x = 22, c = 0; x < W - 22; x += tileW, c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#111111';
        ctx.fillRect(x, FINISH_LINE_Y + r * 20, Math.min(tileW, W - 22 - x), 20);
      }
    }
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(22, FINISH_LINE_Y, W - 44, rows * 20);
  }
}

function drawMarbles() {
  const leader = getLeaderMarble();
  const sorted = [...marbles].sort((a, b) => a.y - b.y);

  for (const m of sorted) {
    // 1. Ateş Kuyruğu
    if (m.trail.length > 1) {
      for (let i = 0; i < m.trail.length; i++) {
        const pt = m.trail[i];
        const ratio = (i + 1) / m.trail.length;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r * ratio * 0.85, 0, Math.PI * 2);
        ctx.globalAlpha = m.ghostTimer > 0 ? ratio * 0.7 : ratio * 0.25;
        ctx.fillStyle = m.ghostTimer > 0 ? '#FF0055' : m.team.color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // 2. Lider Halkası
    if (gameState === 'RACING' && m === leader && !m.finished) {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius + 9, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFE600';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. MİSKETİN KENDİSİ VE GERÇEKÇİ YUVARLANMA DÖNGÜSÜ
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.rotation); // Top yuvarlandıkça arma döner!

    ctx.beginPath();
    ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Takım arka planı
    ctx.fillStyle = m.team.secondaryColor;
    ctx.fillRect(-m.radius, -m.radius, m.radius * 2, m.radius * 2);

    // Resmi Takım Logosu
    if (m.team.logoImg && m.team.logoImg.complete) {
      ctx.drawImage(m.team.logoImg, -m.radius, -m.radius, m.radius * 2, m.radius * 2);
    }

    // 3D Cam Parlama
    const shine = ctx.createLinearGradient(0, -m.radius, 0, m.radius);
    shine.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    shine.addColorStop(0.5, 'rgba(255, 255, 255, 0.0)');
    shine.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = shine;
    ctx.fillRect(-m.radius, -m.radius, m.radius * 2, m.radius * 2);
    ctx.restore();

    // Dış Neon Çerçeve
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
    ctx.lineWidth = m.ghostTimer > 0 ? 5 : 3.5;
    ctx.strokeStyle = m.freezeTimer > 0 ? '#00E5FF' : (m.ghostTimer > 0 ? '#FF0055' : m.team.color);
    ctx.stroke();

    // 100 JETONLUK BUZ KÜTLESİ
    if (m.freezeTimer > 0) {
      ctx.save();
      const iceSize = m.radius * 2.3;
      ctx.fillStyle = 'rgba(0, 229, 255, 0.45)';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(m.x - iceSize / 2, m.y - iceSize / 2, iceSize, iceSize, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Takım Rozet Etiketi (Üstte)
    const labelY = m.y - m.radius - 12;
    ctx.save();
    ctx.fillStyle = m.team.secondaryColor;
    ctx.strokeStyle = m.team.color;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(m.x - 26, labelY - 12, 52, 18, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = m.team.color;
    ctx.font = '900 12px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(m.team.short, m.x, labelY - 2);
    ctx.restore();
  }
}

function spawnParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 3 + Math.random() * 3,
      color,
      alpha: 1,
      life: 0.6
    });
  }
}

function spawnFloatingText(x, y, text, color) {
  floatingTexts.push({
    x, y,
    text,
    color,
    alpha: 1,
    vy: -1.5,
    life: 1.2
  });
}

function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.025;
    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const t = floatingTexts[i];
    t.y += t.vy;
    t.alpha -= 0.02;
    if (t.alpha <= 0) {
      floatingTexts.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = t.alpha;
    ctx.fillStyle = t.color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.font = '900 16px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  }
}

// ============================================================================
// 10. HUD & TOAST BİLDİRİMLERİ
// ============================================================================

function updateLikesHUD() {
  const listEl = document.getElementById('likesLeaderboard');
  if (!listEl) return;

  // Takımları beğeni sayısına göre büyükten küçüğe sırala
  const sorted = [...TEAMS].sort((a, b) => (b.totalLikes || 0) - (a.totalLikes || 0));
  let html = '';
  sorted.forEach((team, idx) => {
    const likes = team.totalLikes || 0;
    const progressInCycle = likes % 1000;
    const progressPct = Math.min(100, Math.floor((progressInCycle / 1000) * 100));

    html += `
      <div class="likes-team-row" style="margin-bottom:2px; padding:2px 4px; background:rgba(255,255,255,0.06); border-radius:5px;">
        <div style="display:flex; align-items:center; justify-content:space-between; font-size:10px; line-height:1.15; white-space:nowrap;">
          <div style="display:flex; align-items:center; gap:3px; min-width:0;">
            <span style="font-weight:900; color:#FF5252; font-size:9.5px;">${idx + 1}.</span>
            <span style="background:${team.secondaryColor}; color:${team.color}; padding:1px 4px; border-radius:3px; font-weight:900; font-size:9px;">${team.short}</span>
          </div>
          <div style="font-weight:900; color:#FF5252; font-size:10px; flex-shrink:0;">
            ${likes.toLocaleString('tr-TR')} ❤️
          </div>
        </div>
        <div style="background:rgba(255,255,255,0.14); height:3px; border-radius:2px; margin-top:2px; overflow:hidden;">
          <div style="background:linear-gradient(90deg, #FF1744, #FFE600); width:${progressPct}%; height:100%;"></div>
        </div>
      </div>
    `;
  });
  listEl.innerHTML = html;
}

let lastHudThrottleTime = 0;
function updateHUD(force = false) {
  const now = performance.now();
  if (!force && (now - lastHudThrottleTime < 160)) {
    return;
  }
  lastHudThrottleTime = now;

  updateLikesHUD();
  const sorted = [...marbles].sort((a, b) => b.y - a.y);
  const listEl = document.getElementById('liveLeaderboard');
  if (listEl) {
    let html = '';
    sorted.forEach((m, idx) => {
      const isLead = idx === 0 && gameState === 'RACING';
      const statusIcon = m.freezeTimer > 0 ? '❄️' : (m.ghostTimer > 0 ? '🚀' : '');
      html += `
        <div class="lb-row ${isLead ? 'lead-row' : ''}" style="display:flex; align-items:center; justify-content:space-between; padding:2px 4px; font-size:10.5px; margin-bottom:2px; white-space:nowrap; gap:3px;">
          <div style="display:flex; align-items:center; min-width:0; overflow:hidden;">
            <span style="font-weight:900; color:#FFE600; margin-right:3px; font-size:10px;">${idx + 1}.</span>
            <span style="background:${m.team.secondaryColor}; color:${m.team.color}; padding:1px 4px; border-radius:3px; font-weight:900; font-size:9px; flex-shrink:0;">${m.team.short}</span>
            <span style="font-weight:800; color:#fff; margin-left:3px; overflow:hidden; text-overflow:ellipsis; font-size:10px;">${m.team.name}</span>
          </div>
          <div style="display:flex; align-items:center; flex-shrink:0;">
            <span style="font-size:10px; margin-right:2px;">${statusIcon}</span>
            <span style="font-weight:900; color:#00F5D4; font-size:10px;">🏆 ${m.team.wins}</span>
          </div>
        </div>
      `;
    });
    listEl.innerHTML = html;
  }

  const stagePill = document.getElementById('stageTitleText');
  if (stagePill) {
    if (gameState === 'LOBBY_RING') {
      stagePill.textContent = `HAZIRLIK • ${Math.ceil(stateTimer)} SN`;
    } else if (gameState === 'RACING') {
      const leader = getLeaderMarble();
      stagePill.textContent = leader ? `LİDER: ${leader.team.short}` : 'YARIŞ';
    } else {
      stagePill.textContent = `ŞAMPİYON: ${winnerTeam ? winnerTeam.short : ''}`;
    }
  }
}

function showBoostToast(donor, giftTitle, coins, boostMsg, giftImg) {
  const container = document.getElementById('boostToastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'boost-toast';
  toast.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px;">
      ${giftImg ? `<img src="${giftImg}" style="width:26px; height:26px; object-fit:contain;" />` : ''}
      <div>
        <div style="font-size:11px; color:#A0AEC0;"><strong>${esc(donor)}</strong> • ${coins} Jeton</div>
        <div style="font-size:13px; font-weight:900; color:#FFE600;">${boostMsg}</div>
      </div>
    </div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

function showPodiumModal(team) {
  const modal = document.getElementById('podiumModal');
  if (!modal) return;
  modal.classList.remove('hidden');

  const card = modal.querySelector('.podium-card');
  if (card) {
    card.innerHTML = `
      <div class="podium-ribbon">🏆 TURUN ŞAMPİYONU 🏆</div>
      <div style="margin:20px 0; text-align:center;">
        <div style="display:inline-block; width:120px; height:120px; border-radius:50%; background:${team.secondaryColor}; border:5px solid ${team.color}; padding:8px; box-shadow:0 0 30px ${team.glow};">
          <img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(team.logoSvg)}" style="width:100%; height:100%;" />
        </div>
      </div>
      <h2 style="font-size:30px; font-weight:900; color:${team.color}; margin:0;">${team.name.toUpperCase()}</h2>
      <p style="font-size:15px; color:#FFFFFF; margin:8px 0 14px 0;">🎵 Zafer Marşı Çalıyor...</p>
      <div style="font-size:16px; font-weight:800; color:#FFE600; background:rgba(0,0,0,0.4); padding:8px; border-radius:10px;">
        Toplam Şampiyonluk: ${team.wins} Kupa 🏆
      </div>
      <div id="podiumCountdownText" style="margin-top:14px; font-size:13px; color:#A0AEC0;">
        ⏳ Yeni tur başlıyor: 12 sn
      </div>
    `;
  }
}

// ============================================================================
// 11. TİKTOK CANLI YAYIN VE ETKİLEŞİM
// ============================================================================
const socket = io();

socket.on('tiktokStatus', status => {
  const statusEl = document.getElementById('tiktokStatusText');
  if (statusEl) {
    statusEl.textContent = status.message || (status.connected ? 'Canlı Yayına Bağlı' : 'Bağlantı Yok');
    statusEl.style.color = status.connected ? '#00FF66' : '#FFCC00';
  }
});

socket.on('chatEvent', data => {
  const rawComment = (data.comment || data.content || '').toString().trim();
  const comment = rawComment.toLowerCase();
  const uniqueId = data.uniqueId;
  const nickname = data.nickname || uniqueId || 'İzleyici';
  const displayId = data.displayId;
  const userId = data.userId;

  let detectedTeam = null;
  const clean = comment.replace(/[^a-z0-9]/g, '');

  if (/^(fb|fener|fenerbahce|fenerbahçe|kanarya)/i.test(comment) || /^(fb|fener)/i.test(clean)) detectedTeam = 'FB';
  else if (/^(gs|cimbom|galatasaray|aslan)/i.test(comment) || /^(gs|cimbom)/i.test(clean)) detectedTeam = 'GS';
  else if (/^(bjk|besiktas|beşiktaş|kartal)/i.test(comment) || /^(bjk|besik)/i.test(clean)) detectedTeam = 'BJK';
  else if (/^(ts|trabzon|trabzonspor|firtina|fırtına)/i.test(comment) || /^(ts|trab)/i.test(clean)) detectedTeam = 'TS';
  else if (/^(amed|amedspor)/i.test(comment) || /^amed/i.test(clean)) detectedTeam = 'AMED';

  if (detectedTeam) {
    // Kullanıcıyı tüm olası tanımlayıcılarıyla bu takıma mühürle
    if (uniqueId) userTeamMap.set(uniqueId, detectedTeam);
    if (nickname) userTeamMap.set(nickname, detectedTeam);
    if (displayId) userTeamMap.set(displayId, detectedTeam);
    if (userId) userTeamMap.set(String(userId), detectedTeam);

    addTeamLikes(detectedTeam, 20, nickname);
    applyMiniPush(detectedTeam, 2.0);
    spawnFloatingText(W / 2, cameraY + H * 0.65, `⚽ ${nickname} ➔ ${detectedTeam}!`, '#FFE600');
    console.log(`[Takım Eşleşti] ${nickname} -> ${detectedTeam} (Yorum: ${rawComment})`);
  }
});

socket.on('giftEvent', data => {
  const diamondCount = Math.max(1, Number(data.diamondCount) || 1);
  const unitDiamonds = Math.max(1, Number(data.unitDiamonds) || diamondCount);
  const donorName = data.nickname || data.displayId || data.uniqueId || 'İzleyici';
  const uniqueId = data.uniqueId;
  const nickname = data.nickname;
  const displayId = data.displayId;
  const userId = data.userId;
  const giftName = data.giftName || 'Hediye';

  // Kullanıcının tuttuğu takımı tüm kimlikleriyle bul
  let targetTeam =
    (uniqueId && userTeamMap.get(uniqueId)) ||
    (nickname && userTeamMap.get(nickname)) ||
    (displayId && userTeamMap.get(displayId)) ||
    (userId && userTeamMap.get(String(userId)));

  if (!targetTeam) {
    if (/donut/i.test(giftName)) targetTeam = 'FB';
    else if (/panda/i.test(giftName)) targetTeam = 'GS';
    else if (/gözlük|sunglasses/i.test(giftName)) targetTeam = 'BJK';
    else if (/dondurma|ice cream/i.test(giftName)) targetTeam = 'TS';
    else if (/ördek|duck/i.test(giftName)) targetTeam = 'AMED';
    else {
      // Kullanıcı yorumda takım yazmadıysa yarışta en gerideki takıma destek ver
      const sorted = [...marbles].sort((a, b) => a.y - b.y);
      targetTeam = sorted[0]?.team?.id || 'FB';
    }
  }

  // 100 Jeton ve üzeri (El Kalbi vb.): 1. Sıradakini 2 Saniye Dondur!
  if (diamondCount >= 100 || unitDiamonds >= 100 || /el kalbi|hand heart/i.test(giftName)) {
    trigger100CoinFreeze(donorName);
    return;
  }

  // 30 Jeton ve üzeri (Donut vb.): Engelsiz Turbo Roket Boost
  if (diamondCount >= 30 || unitDiamonds >= 30 || /donut|panda|gözlük|sunglasses|dondurma|ice cream|ördek|duck/i.test(giftName)) {
    boostTeam(targetTeam, donorName, diamondCount, giftName);
  } else {
    // 1-29 Jeton (Gül, Parmak Kalp, Rosa vb.): Görsel & Sesli Nitro İvme Boostu!
    const marble = marbles.find(m => m.team.id === targetTeam);
    if (marble) {
      marble.fireTimer = Math.max(marble.fireTimer || 0, 2.0);
      marble.vy = Math.max(marble.vy + 4.5, 11.5);
      marble.coins = (marble.coins || 0) + diamondCount;
      marble.team.totalCoins = (marble.team.totalCoins || 0) + diamondCount;

      sfx.playGiftBoost(1);
      screenShakeTimer = 0.12;
      spawnParticles(marble.x, marble.y, marble.team.color, 18);
      spawnFloatingText(marble.x, marble.y - 38, `⚡ ${marble.team.short} +NİTRO!`, '#FFE600');

      showBoostToast(
        donorName,
        `${giftName} (${diamondCount} Jeton)`,
        diamondCount,
        `⚡ ${marble.team.name.toUpperCase()} NİTRO İVME ALDI!`,
        '/images/rose.svg'
      );
    }
  }
});

socket.on('likeEvent', data => {
  const count = Number(data.likeCount) || Number(data.count) || 1;
  const uniqueId = data.uniqueId;
  const nickname = data.nickname || 'İzleyici';
  const displayId = data.displayId;
  const userId = data.userId;

  let targetTeamId =
    (uniqueId && userTeamMap.get(uniqueId)) ||
    (nickname && userTeamMap.get(nickname)) ||
    (displayId && userTeamMap.get(displayId)) ||
    (userId && userTeamMap.get(String(userId)));

  if (!targetTeamId) {
    // Takım seçmediyse yarışta en arkadaki takıma yardım et
    const sorted = [...marbles].sort((a, b) => a.y - b.y);
    targetTeamId = sorted[0]?.team?.id || 'FB';
  }

  addTeamLikes(targetTeamId, count, nickname);
  applyMiniPush(targetTeamId, 0.35);
});

// ============================================================================
// 12. OYUN DÖNGÜSÜ (ARKA PLANDA DURMAYAN 60 FPS FİZİK + CANLI SENKRONİZASYON)
// ============================================================================
let lastSimTime = performance.now();
let physicsAccumulator = 0;
let lastHostSnapshotAt = 0;

function stepGameTimers(dt) {
  // OBS ekranı Host'tan canlı paket alıyorsa sayaç geçişlerini Host yönetir
  if (isObsClient && (Date.now() - lastHostSnapshotAt < 1200)) {
    if (gameState !== 'PODIUM' && !sfx.currentAnthemAudio && (!sfx.bgMusicAudio || sfx.bgMusicAudio.paused)) {
      sfx.startBgMusic();
    }
    if (gameState === 'PODIUM') {
      const cdEl = document.getElementById('podiumCountdownText');
      if (cdEl) cdEl.textContent = `⏳ Yeni tur başlıyor: ${Math.max(0, Math.ceil(stateTimer))} sn`;
    }
    return;
  }

  if (gameState === 'LOBBY_RING') {
    if (!sfx.currentAnthemAudio && (!sfx.bgMusicAudio || sfx.bgMusicAudio.paused)) {
      sfx.startBgMusic();
    }
    stateTimer -= dt;
    const ceilSec = Math.ceil(stateTimer);
    if (ceilSec !== lastWholeSecond && ceilSec <= 5 && ceilSec > 0) {
      sfx.playCountdownBeep(false);
    }
    lastWholeSecond = ceilSec;

    if (stateTimer <= 0) {
      startRace();
    }
  } else if (gameState === 'RACING') {
    if (!sfx.currentAnthemAudio && (!sfx.bgMusicAudio || sfx.bgMusicAudio.paused)) {
      sfx.startBgMusic();
    }
  } else if (gameState === 'PODIUM') {
    stateTimer -= dt;
    const cdEl = document.getElementById('podiumCountdownText');
    if (cdEl) cdEl.textContent = `⏳ Yeni tur başlıyor: ${Math.max(0, Math.ceil(stateTimer))} sn`;
    if (stateTimer <= 0) {
      resetToLobby();
    }
  }
}

function stepSimulation(now) {
  const curTime = (typeof now === 'number' && now > 0) ? now : performance.now();
  const dt = Math.min(0.08, Math.max(0, (curTime - lastSimTime) / 1000));
  lastSimTime = curTime;

  physicsAccumulator += dt;
  let steps = 0;
  // Sabit adımda 60 FPS fizik simülasyonu (Spiral of death korumasıyla max 10 adım)
  while (physicsAccumulator >= FIXED_DT && steps < 10) {
    stepGameTimers(FIXED_DT);
    updatePhysics(FIXED_DT);
    physicsAccumulator -= FIXED_DT;
    steps++;
  }
  if (steps === 10) physicsAccumulator = 0;
}

function gameLoop(now) {
  stepSimulation(now);
  render();
  requestAnimationFrame(gameLoop);
}

// ============================================================================
// 13. PANEL ETKİLEŞİMLERİ & ADMIN KOMUT SENKRONİZASYONU
// ============================================================================
function dispatchAdminCommand(payload) {
  if (socket && socket.connected) {
    socket.emit('adminCommand', payload);
  } else {
    executeAdminCommand(payload);
  }
}

function executeAdminCommand(payload) {
  if (!payload || !payload.type) return;
  switch (payload.type) {
    case 'skipTimer':
      if (gameState === 'LOBBY_RING') startRace();
      else if (gameState === 'PODIUM') resetToLobby();
      break;
    case 'resetRace':
      if (typeof payload.seed === 'number') setGameSeed(payload.seed);
      if (typeof payload.mapIndex === 'number') currentMapIndex = payload.mapIndex - 1;
      resetToLobby();
      break;
    case 'boostTeam':
      boostTeam(payload.teamId, payload.donorName || 'Yayıncı Test', payload.coins || 30);
      break;
    case 'freezeLeader':
      trigger100CoinFreeze(payload.donorName || 'Yayıncı Test');
      break;
    case 'addLikes':
      addTeamLikes(payload.teamId, payload.count || 200, payload.donorName || 'Panel Testi');
      if (payload.count < 1000) {
        spawnFloatingText(W / 2, cameraY + H * 0.6, `❤️ ${payload.teamId} +${payload.count} Beğeni!`, '#FF1744');
      }
      break;
    case 'playAnthem':
      sfx.playTeamAnthem(payload.teamId);
      break;
    case 'stopAnthem':
      sfx.stopAnthem(true);
      break;
    case 'setVolume': {
      const v = Math.max(0, Math.min(100, Number(payload.volume) || 25)) / 100;
      sfx.volume = v;
      if (sfx.bgMusicAudio) {
        sfx.bgMusicAudio.volume = sfx.bgMusicMode === 'anthem'
          ? Math.min(1.0, Math.max(0.15, v * 3.5))
          : Math.min(1.0, Math.max(0.05, v * 2.2));
      }
      const volSlider = document.getElementById('panelVolumeSlider');
      const volVal = document.getElementById('panelVolumeValue');
      if (volSlider) volSlider.value = Math.round(v * 100);
      if (volVal) volVal.textContent = `${Math.round(v * 100)}%`;
      break;
    }
  }
}

if (socket) {
  socket.on('adminCommand', payload => {
    executeAdminCommand(payload);
  });
}

function setupPanelControls() {
  const connectBtn = document.getElementById('connectTiktokBtn');
  const disconnectBtn = document.getElementById('disconnectTiktokBtn');
  const usernameInput = document.getElementById('tiktokUsernameInput');

  if (connectBtn && usernameInput) {
    connectBtn.addEventListener('click', () => {
      const u = usernameInput.value.trim();
      if (u) socket.emit('connectTikTok', u);
    });
  }
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', () => {
      socket.emit('disconnectTikTok');
    });
  }

  // 30 Jeton Test Butonları
  document.querySelectorAll('.team-boost-test-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const teamId = btn.getAttribute('data-team');
      dispatchAdminCommand({ type: 'boostTeam', teamId, donorName: 'Yayıncı Test', coins: 30 });
    });
  });

  // 100 Jeton Test Butonu
  const freezeBtn = document.getElementById('testFreezeBtn');
  if (freezeBtn) {
    freezeBtn.addEventListener('click', () => {
      dispatchAdminCommand({ type: 'freezeLeader', donorName: 'Yayıncı Test' });
    });
  }

  // Takım Beğeni Test Butonları (+200 ❤️)
  document.querySelectorAll('.team-like-test-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const teamId = btn.getAttribute('data-team');
      dispatchAdminCommand({ type: 'addLikes', teamId, count: 200, donorName: 'Panel Testi' });
    });
  });

  // 1000 Beğeni Boost Test Butonu
  const test1000Btn = document.getElementById('test1000LikesBtn');
  if (test1000Btn) {
    test1000Btn.addEventListener('click', () => {
      const leader = getLeaderMarble();
      const targetTeamId = leader ? leader.team.id : 'FB';
      dispatchAdminCommand({ type: 'addLikes', teamId: targetTeamId, count: 1000, donorName: 'Panel Testi' });
    });
  }

  // Marş Test Butonları
  document.querySelectorAll('.anthem-test-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const teamId = btn.getAttribute('data-team');
      dispatchAdminCommand({ type: 'playAnthem', teamId });
    });
  });

  const stopAnthemBtn = document.getElementById('stopAnthemBtn');
  if (stopAnthemBtn) {
    stopAnthemBtn.addEventListener('click', () => {
      dispatchAdminCommand({ type: 'stopAnthem' });
    });
  }

  // Yarışı Başlat / Atla
  const startBtn = document.getElementById('skipTimerBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      dispatchAdminCommand({ type: 'skipTimer' });
    });
  }

  // Yeni Tur / Sıfırla
  const resetBtn = document.getElementById('resetRaceBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      dispatchAdminCommand({
        type: 'resetRace',
        seed: Date.now() % 2147483647,
        mapIndex: (currentMapIndex + 1) % 3
      });
    });
  }

  // TikTok Güvenli Mod / Hediye Şeridini Gizle-Göster
  const toggleLegendBtn = document.getElementById('toggleLegendBtn');
  if (toggleLegendBtn) {
    toggleLegendBtn.addEventListener('click', () => {
      const bar = document.querySelector('.gift-legend-bar');
      if (bar) {
        bar.classList.toggle('hidden');
        toggleLegendBtn.textContent = bar.classList.contains('hidden') ? '👁️ Hediye Şeridini Göster' : '👁️ Hediye Şeridini Gizle';
      }
    });
  }

  // Ses Sürgüsü
  const volSlider = document.getElementById('panelVolumeSlider');
  if (volSlider) {
    volSlider.addEventListener('input', e => {
      dispatchAdminCommand({ type: 'setVolume', volume: Number(e.target.value) });
    });
  }
}

// Tarayıcı otomatik ses engelini ilk tıklama/dokunuşta aç
function unlockAudioOnInteraction() {
  sfx.init();
  if (!sfx.currentAnthemAudio) {
    sfx.startBgMusic();
  }
}
window.addEventListener('pointerdown', unlockAudioOnInteraction, { passive: true });
window.addEventListener('click', unlockAudioOnInteraction, { passive: true });
window.addEventListener('keydown', unlockAudioOnInteraction, { passive: true });

// Başlatma
window.addEventListener('DOMContentLoaded', () => {
  currentMapIndex = 0;
  buildCourse(currentMapIndex);
  initTeamMarbles();
  setupPanelControls();
  sfx.preloadAllAudio();
  sfx.startBgMusic();
  lastSimTime = performance.now();
  requestAnimationFrame(gameLoop);
});

// Sekme simge durumundan öne gelince fizik zamanlayıcısını pürüzsüz sıfırla
document.addEventListener('visibilitychange', () => {
  lastSimTime = performance.now();
  physicsAccumulator = 0;
});

// ============================================================================
// 14. WEB WORKER ARKA PLAN SAATİ & HOST -> OBS CANLI SENKRONİZASYON MOTORU
// ============================================================================
// Chrome/Edge arka plan sekmelerinde normal setInterval'ı 1 saniyeye yavaşlatır.
// Web Worker saati ise sekme arka planda veya simge durumunda olsa bile ASLA yavaşlatılmaz!
if (!isObsClient) {
  let snapshotTickCounter = 0;

  function onBackgroundHeartbeat() {
    const now = performance.now();
    // YALNIZCA sekme arka planda/simge durumunda ise Web Worker fiziği ilerletsin!
    // Sekme açıkken requestAnimationFrame zaten çalışır; ikisi aynı anda çalışırsa kareler çakışır ve donma yapar.
    if (document.hidden && (now - lastSimTime >= 25)) {
      stepSimulation(now);
    }

    snapshotTickCounter++;
    if (snapshotTickCounter >= 3) { // ~100ms'de bir OBS'e durum özeti gönder
      snapshotTickCounter = 0;
      if (!socket || !socket.connected) return;
      socket.emit('hostStateSnapshot', {
        currentMapIndex,
        gameState,
        stateTimer,
        worldTime,
        lobbyBarAngle,
        cameraY,
        targetCameraY,
        winnerTeamId: winnerTeam ? winnerTeam.id : null,
        marbles: marbles.map(m => ({
          id: m.team.id,
          x: Math.round(m.x * 10) / 10,
          y: Math.round(m.y * 10) / 10,
          vx: +(m.vx).toFixed(2),
          vy: +(m.vy).toFixed(2),
          fireTimer: +(m.fireTimer).toFixed(2),
          ghostTimer: +(m.ghostTimer).toFixed(2),
          freezeTimer: +(m.freezeTimer).toFixed(2),
          finished: m.finished,
          rotation: +(m.rotation || 0).toFixed(2)
        })),
        teams: TEAMS.map(t => ({
          id: t.id,
          wins: t.wins,
          totalLikes: t.totalLikes || 0,
          likesMilestone: t.likesMilestone || 1000,
          totalCoins: t.totalCoins || 0
        }))
      });
    }
  }

  let workerStarted = false;
  try {
    if (typeof Worker !== 'undefined' && typeof Blob !== 'undefined') {
      const workerBlob = new Blob([
        'setInterval(function(){ postMessage("tick"); }, 33);'
      ], { type: 'application/javascript' });
      const bgWorker = new Worker(URL.createObjectURL(workerBlob));
      bgWorker.onmessage = onBackgroundHeartbeat;
      workerStarted = true;
    }
  } catch (e) {}

  if (!workerStarted) {
    setInterval(onBackgroundHeartbeat, 33);
  }
}

// OBS Ekranı (?obs=1): Yayıncı ana ekranından gelen veriyi sıfır takılmayla senkronize eder!
if (isObsClient && socket) {
  socket.on('hostStateSnapshot', snap => {
    if (!snap) return;
    lastHostSnapshotAt = Date.now();

    if (snap.currentMapIndex !== undefined && snap.currentMapIndex !== currentMapIndex) {
      currentMapIndex = snap.currentMapIndex;
      buildCourse(currentMapIndex);
    }

    const prevGameState = gameState;
    gameState = snap.gameState;
    stateTimer = snap.stateTimer;
    if (typeof snap.worldTime === 'number') worldTime = snap.worldTime;
    if (typeof snap.lobbyBarAngle === 'number') lobbyBarAngle = snap.lobbyBarAngle;

    // Durum geçişlerinde banner, podyum ve müzik/marşları OBS ekranında da birebir tetikle
    if (gameState !== prevGameState) {
      const centerBanner = document.getElementById('centerBanner');
      const podiumModal = document.getElementById('podiumModal');

      if (gameState === 'RACING') {
        if (centerBanner) centerBanner.classList.add('hidden');
        if (podiumModal) podiumModal.classList.add('hidden');
        sfx.stopAnthem(false);
        sfx.startBgMusic();
      } else if (gameState === 'PODIUM') {
        if (centerBanner) centerBanner.classList.add('hidden');
        const wTeam = TEAMS.find(t => t.id === snap.winnerTeamId) || getLeaderMarble()?.team || TEAMS[0];
        winnerTeam = wTeam;
        sfx.playTeamAnthem(wTeam.id, true);
        showPodiumModal(wTeam);
      } else if (gameState === 'LOBBY_RING') {
        if (podiumModal) podiumModal.classList.add('hidden');
        if (centerBanner) {
          centerBanner.classList.remove('hidden');
          document.getElementById('bannerBadge').textContent = 'HAZIRLIK AÇIK';
          document.getElementById('bannerMain').textContent = 'Takımını Destekle!';
          document.getElementById('bannerSub').textContent = '🏁 Takımını Yorumlarda ve Beğenilerle Destekle!';
        }
        sfx.stopAnthem(true);
      }
    }

    if (Array.isArray(snap.marbles)) {
      snap.marbles.forEach(sm => {
        const m = marbles.find(x => x.team.id === sm.id);
        if (m) {
          const errDist = Math.hypot(sm.x - m.x, sm.y - m.y);
          // Küçük farklarda yumuşak düzeltme yap, büyük farkta (yeni tur / boost) direkt hizala
          if (errDist > 120) {
            m.x = sm.x;
            m.y = sm.y;
          } else {
            m.x += (sm.x - m.x) * 0.45;
            m.y += (sm.y - m.y) * 0.45;
          }
          m.vx = sm.vx;
          m.vy = sm.vy;
          m.fireTimer = sm.fireTimer;
          m.ghostTimer = sm.ghostTimer;
          m.freezeTimer = sm.freezeTimer;
          m.finished = sm.finished;
        }
      });
    }

    if (Array.isArray(snap.teams)) {
      snap.teams.forEach(st => {
        const t = TEAMS.find(x => x.id === st.id);
        if (t) {
          t.wins = st.wins;
          t.totalLikes = st.totalLikes;
          t.likesMilestone = st.likesMilestone || 1000;
          t.totalCoins = st.totalCoins;
        }
      });
      updateLikesHUD();
    }
  });
}
