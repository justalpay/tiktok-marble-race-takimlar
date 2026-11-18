[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $dir

# 1. Clean old processes
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Find node.exe
$nodeExe = "node.exe"
if (Test-Path "C:\Program Files\nodejs\node.exe") {
    $nodeExe = "C:\Program Files\nodejs\node.exe"
}

# 2. Check cloudflared.exe
$cloudflared = Join-Path $dir "cloudflared.exe"
if (-not (Test-Path $cloudflared)) {
    Write-Host "[1/2] Cloudflared hazirlaniyor..." -ForegroundColor Yellow
    curl.exe -L "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -o $cloudflared
}

Write-Host "[1/2] TikTok LIVE Studio icin Guvenli HTTPS Baglantisi kuruluyor..." -ForegroundColor Cyan
$logFile = Join-Path $dir "tunnel.log"
if (Test-Path $logFile) { Remove-Item $logFile -Force -ErrorAction SilentlyContinue }

$cloudProc = Start-Process -FilePath $cloudflared -ArgumentList "tunnel --url http://127.0.0.1:3000 --logfile `"$logFile`"" -PassThru -WindowStyle Hidden

$tunnelUrl = ""
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 600
    if (Test-Path $logFile) {
        $lines = Get-Content $logFile -ErrorAction SilentlyContinue
        foreach ($line in $lines) {
            if ($line -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
                $tunnelUrl = $Matches[0]
                break
            }
        }
        if ($tunnelUrl -ne "") { break }
    }
}

if ($tunnelUrl -ne "") {
    $obsUrl = "$tunnelUrl`?obs=1"
    
    # Copy to clipboard
    try {
        Set-Clipboard -Value $obsUrl
    } catch {
        $obsUrl | clip.exe
    }
    
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host "   TIKTOK LIVE STUDIO ICIN BAGLANTI ADRESIN HAZIR!" -ForegroundColor Yellow
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host " [1] TikTok Live Studio'da 'Baglanti' kutusuna yapistiracagin adres:" -ForegroundColor White
    Write-Host "     $obsUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host " [*] Bu adres otomatik olarak PANONA KOPYALANDI! (Direkt Ctrl+V yapabilirsin)" -ForegroundColor Green
    Write-Host " [*] Ozel Cozunurluk ayari: W: 1080  H: 1920 (Cam gibi net goruntu)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host ""
    
    # Open local host control panel in browser
    Start-Process "http://localhost:3000"
    
    Write-Host "[2/2] Misket Yarisi Sunucusu Baslatiliyor..." -ForegroundColor Cyan
    Write-Host "Yayini yonetmek icin kontrol paneli tarayicinda acildi (http://localhost:3000)" -ForegroundColor Gray
    Write-Host "Yayin suresince bu konsol penceresini KAPATMA." -ForegroundColor Magenta
    Write-Host ""
    
    try {
        # Run node in foreground so user sees live events and gifts
        & $nodeExe server.js
    } finally {
        if ($cloudProc -and -not $cloudProc.HasExited) {
            $cloudProc.Kill()
        }
    }
} else {
    Write-Host "[HATA] Baglanti adresi olusturulamadi. Lutfen internet baglantinizi kontrol edin." -ForegroundColor Red
    pause
}
