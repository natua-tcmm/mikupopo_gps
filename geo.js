/** Round total tenths of seconds first, so 59.95 seconds carries correctly. */
export function formatDMS(value, axis) {
  if (!Number.isFinite(value) || !['latitude', 'longitude'].includes(axis)) {
    throw new TypeError('Invalid coordinate');
  }
  const limit = axis === 'latitude' ? 90 : 180;
  if (Math.abs(value) > limit) throw new RangeError('Coordinate out of range');
  const ticks = Math.round(Math.abs(value) * 36_000);
  const degrees = Math.floor(ticks / 36_000);
  const minutes = Math.floor((ticks % 36_000) / 600);
  const seconds = ((ticks % 600) / 10).toFixed(1).padStart(4, '0');
  const direction = axis === 'latitude' ? (value < 0 ? '南緯' : '北緯') : (value < 0 ? '西経' : '東経');
  return `${direction} ${degrees}°${String(minutes).padStart(2, '0')}′${seconds}″`;
}

function onSegment(x, y, ax, ay, bx, by) {
  const cross = (x - ax) * (by - ay) - (y - ay) * (bx - ax);
  return Math.abs(cross) < 1e-12 && x >= Math.min(ax, bx) && x <= Math.max(ax, bx)
    && y >= Math.min(ay, by) && y <= Math.max(ay, by);
}

// 0 = outside, 1 = inside, 2 = exactly on the boundary.
export function ringContains(ring, x, y) {
  let inside = false;
  const packed = ArrayBuffer.isView(ring);
  const length = packed ? ring.length / 2 : ring.length;
  for (let i = 0, j = length - 1; i < length; j = i++) {
    const ax = packed ? ring[i * 2] / 1e6 : ring[i][0];
    const ay = packed ? ring[i * 2 + 1] / 1e6 : ring[i][1];
    const bx = packed ? ring[j * 2] / 1e6 : ring[j][0];
    const by = packed ? ring[j * 2 + 1] / 1e6 : ring[j][1];
    if (onSegment(x, y, ax, ay, bx, by)) return 2;
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) {
      inside = !inside;
    }
  }
  return inside ? 1 : 0;
}

export function findMunicipality(areas, latitude, longitude) {
  for (const area of areas) {
    const [west, south, east, north] = area.bbox;
    if (longitude < west || longitude > east || latitude < south || latitude > north) continue;
    for (const polygon of area.polygons) {
      if (!ringContains(polygon[0], longitude, latitude)) continue;
      // Holes may belong to a different municipality (enclaves).
      if (polygon.slice(1).some(ring => ringContains(ring, longitude, latitude) === 1)) continue;
      return area.name;
    }
  }
  return null;
}

/** Coordinates are stored as signed integer microdegrees to avoid JSON overhead. */
export function decodeAreas(buffer, names) {
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== 0x31474b4d) throw new Error('Invalid area data');
  const count = view.getUint32(4, true);
  const areas = [];
  let offset = 8;
  const read = () => { const value = view.getUint32(offset, true); offset += 4; return value; };
  for (let i = 0; i < count; i++) {
    const name = names[read()];
    const polygonCount = read();
    const bbox = [];
    for (let j = 0; j < 4; j++) { bbox.push(view.getInt32(offset, true) / 1e6); offset += 4; }
    const polygons = [];
    for (let j = 0; j < polygonCount; j++) {
      const ringCount = read();
      const rings = [];
      for (let k = 0; k < ringCount; k++) {
        const points = read();
        // Supported browser/Node platforms are little-endian.
        rings.push(new Int32Array(buffer, offset, points * 2));
        offset += points * 8;
      }
      polygons.push(rings);
    }
    if (typeof name !== 'string') throw new Error('Invalid area name');
    areas.push({ name, bbox, polygons });
  }
  if (offset !== buffer.byteLength) throw new Error('Invalid area data size');
  return areas;
}
