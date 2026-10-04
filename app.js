import { formatDMS } from './geo.js';

const latitudeLine = document.querySelector('#latitude');
const longitudeLine = document.querySelector('#longitude');
const municipalityLine = document.querySelector('#municipality');
let worker;
let lookupFailed = false;
let currentId = 0;
let lastPosition;
let watchId = null;

try {
  worker = new Worker('./location-worker.js', { type: 'module' });
  worker.onmessage = ({ data }) => {
    if (data.type === 'error') {
      lookupFailed = true;
      if (lastPosition) municipalityLine.textContent = '地域データを読み込めません';
    } else if (data.id === currentId) {
      municipalityLine.textContent = data.name ?? '市区町村を特定できません';
    }
  };
  worker.onerror = () => {
    lookupFailed = true;
    if (lastPosition) municipalityLine.textContent = '地域データを読み込めません';
  };
} catch {
  lookupFailed = true;
}

function showPosition({ coords, timestamp }) {
  // Invalidate old results even if an error follows before the lookup finishes.
  currentId += 1;
  lastPosition = { latitude: coords.latitude, longitude: coords.longitude, timestamp };
  latitudeLine.textContent = formatDMS(coords.latitude, 'latitude');
  longitudeLine.textContent = formatDMS(coords.longitude, 'longitude');
  municipalityLine.textContent = lookupFailed ? '地域データを読み込めません' : '市区町村を確認しています';
  if (!lookupFailed) worker.postMessage({ id: currentId, ...lastPosition });
}

function showError(error) {
  currentId += 1;
  lastPosition = null;
  // Do not leave old coordinates looking like a live fix after GPS fails.
  latitudeLine.textContent = '北緯 --°--′--.-″';
  longitudeLine.textContent = '東経 ---°--′--.-″';
  municipalityLine.textContent = error.code === 1 ? '位置情報の利用を許可してください'
    : error.code === 3 ? 'GPSの取得に時間がかかっています' : '現在地を取得できません';
  if (error.code === 1 && watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

function startGPS() {
  if (!window.isSecureContext) {
    municipalityLine.textContent = 'HTTPSで開いてください';
    return;
  }
  if (!navigator.geolocation) {
    municipalityLine.textContent = '位置情報に対応していません';
    return;
  }
  if (watchId !== null) return;
  municipalityLine.textContent = '現在地を取得しています';
  watchId = navigator.geolocation.watchPosition(showPosition, showError, {
    enableHighAccuracy: true, maximumAge: 0, timeout: 20_000,
  });
}

startGPS();
// Returning from browser settings can restart a previously denied watch.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') startGPS();
});
if (navigator.permissions) {
  navigator.permissions.query({ name: 'geolocation' }).then(permission => {
    permission.onchange = () => {
      if (permission.state === 'granted') startGPS();
      if (permission.state === 'denied') showError({ code: 1 });
    };
  }).catch(() => {});
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
  } catch {
    // Some mobile browsers only support full screen through installed PWAs.
  }
}
document.querySelector('.stage').addEventListener('dblclick', toggleFullscreen);
document.addEventListener('keydown', event => {
  if (event.key.toLowerCase() === 'f' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.repeat) {
    event.preventDefault();
    toggleFullscreen();
  }
});

if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
