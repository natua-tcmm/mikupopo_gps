import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodeAreas, findMunicipality, formatDMS, ringContains } from '../geo.js';

test('DMS rounds and carries seconds/minutes, including signs', () => {
  assert.equal(formatDMS(35.681236, 'latitude'), '北緯 35°40′52.4″');
  assert.equal(formatDMS(139.767125, 'longitude'), '東経 139°46′01.7″');
  assert.equal(formatDMS(35 + 59 / 60 + 59.96 / 3600, 'latitude'), '北緯 36°00′00.0″');
  assert.equal(formatDMS(-0.5, 'latitude'), '南緯 0°30′00.0″');
  assert.equal(formatDMS(-180, 'longitude'), '西経 180°00′00.0″');
  assert.throws(() => formatDMS(NaN, 'latitude'));
  assert.throws(() => formatDMS(91, 'latitude'));
});

test('Polygon edges, holes, enclaves, and separated islands are handled', () => {
  const square = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
  const hole = [[3, 3], [7, 3], [7, 7], [3, 7], [3, 3]];
  const island = [[20, 20], [22, 20], [22, 22], [20, 22], [20, 20]];
  const areas = [
    { name: '外側', bbox: [0, 0, 22, 22], polygons: [[square, hole], [island]] },
    { name: '飛び地', bbox: [3, 3, 7, 7], polygons: [[hole]] },
  ];
  assert.equal(ringContains(square, 10, 5), 2);
  assert.equal(ringContains(square, 12, 5), 0);
  assert.equal(findMunicipality(areas, 5, 5), '飛び地');
  assert.equal(findMunicipality(areas, 1, 1), '外側');
  assert.equal(findMunicipality(areas, 21, 21), '外側');
  assert.equal(findMunicipality(areas, 15, 15), null);
});

const metadata = JSON.parse(readFileSync(new URL('../assets/data/municipalities.json', import.meta.url)));
const file = readFileSync(new URL('../assets/data/municipalities.bin', import.meta.url));
const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
const areas = decodeAreas(buffer, metadata.names);
const fixtures = [
  [35.681236, 139.767125, '東京都千代田区'],
  [35.6938, 139.7034, '東京都新宿区'],
  [35.4662, 139.6227, '神奈川県横浜市'],
  [34.6937, 135.5023, '大阪府大阪市'],
  [35.0116, 135.7681, '京都府京都市'],
  [43.0618, 141.3545, '北海道札幌市'],
  [26.2124, 127.6809, '沖縄県那覇市'],
  [33.5902, 130.4017, '福岡県福岡市'],
  [38.2682, 140.8694, '宮城県仙台市'],
  [35.8617, 139.6455, '埼玉県さいたま市'],
  [34.9756, 138.3827, '静岡県静岡市'],
  [34.7108, 137.7261, '静岡県浜松市'],
  [35.1815, 136.9066, '愛知県名古屋市'],
  [36.3483, 138.596, '長野県北佐久郡軽井沢町'],
  [36.2704, 136.8986, '岐阜県大野郡白川村'],
  [24.3448, 124.1572, '沖縄県石垣市'],
  [27.0942, 142.1918, '東京都小笠原村'],
];
for (const [latitude, longitude, name] of fixtures) {
  test(`Offline lookup: ${name}`, () => {
    assert.equal(findMunicipality(areas, latitude, longitude), name);
  });
}
test('Uncovered positions do not invent an address', () => {
  assert.equal(findMunicipality(areas, 0, 0), null);
  assert.equal(findMunicipality(areas, 35, 150), null);
  assert.equal(metadata.names.length, 1747);
});
