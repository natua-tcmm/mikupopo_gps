import { decodeAreas, findMunicipality } from './geo.js';

let areas;
let latest;

function resolveLatest() {
  if (!areas || !latest) return;
  const { id, latitude, longitude } = latest;
  postMessage({ type: 'result', id, name: findMunicipality(areas, latitude, longitude) });
}

self.onmessage = ({ data }) => {
  latest = data;
  resolveLatest();
};

async function loadAsset(url, type) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Municipality data unavailable');
    return response[type]();
}
Promise.all([
  loadAsset('./assets/data/municipalities.json', 'json'),
  loadAsset('./assets/data/municipalities.bin', 'arrayBuffer'),
])
  .then(([metadata, buffer]) => { areas = decodeAreas(buffer, metadata.names); resolveLatest(); })
  .catch(() => postMessage({ type: 'error' }));
