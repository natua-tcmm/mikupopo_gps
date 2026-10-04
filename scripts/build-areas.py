#!/usr/bin/env python3
"""Build offline polygons from a geolonia/japanese-admins tarball.
Usage: python3 scripts/build-areas.py /path/to/japanese-admins.tar.gz
Requires shapely. This is a development tool; the app needs no Python.
"""
import json
import re
import sys
import struct
import tarfile
from pathlib import Path
from shapely.geometry import shape, mapping

ROOT = Path(__file__).resolve().parents[1]
areas = []
with tarfile.open(sys.argv[1], 'r:gz') as archive:
    members = sorted((m for m in archive.getmembers() if re.search(r'/docs/\d{2}/\d{5}\.json$', m.name)), key=lambda m: m.name)
    for member in members:
        source = json.load(archive.extractfile(member))
        for feature in source['features']:
            geometry = shape(feature['geometry'])
            # About 5 metres in latitude; keep topology and every island/hole.
            geometry = geometry.simplify(0.00005, preserve_topology=True)
            if geometry.is_empty:
                continue
            coords = mapping(geometry)['coordinates']
            polygons = [coords] if geometry.geom_type == 'Polygon' else coords
            def rounded(value):
                if isinstance(value, (float, int)):
                    return round(value, 6)
                return [rounded(v) for v in value]
            name = feature['properties']['name']
            name = re.sub(r'^(東京都|北海道).*?支庁', r'\1', name)
            # Designated cities are displayed at city level (not ward level).
            name = re.sub(r'(市)[^市]*区$', r'\1', name)
            areas.append({'name': name, 'bbox': rounded(geometry.bounds), 'polygons': rounded(polygons)})
names = sorted(set(a['name'] for a in areas))
name_ids = {name: i for i, name in enumerate(names)}
metadata = {'sourceDate': '2022-01-01', 'simplificationDegrees': 0.00005, 'names': names}
(ROOT / 'assets/data/municipalities.json').write_text(json.dumps(metadata, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
target = ROOT / 'assets/data/municipalities.bin'
with target.open('wb') as out:
    out.write(struct.pack('<4sI', b'MKG1', len(areas)))
    for area in areas:
        out.write(struct.pack('<II4i', name_ids[area['name']], len(area['polygons']), *(round(v * 1e6) for v in area['bbox'])))
        for polygon in area['polygons']:
            out.write(struct.pack('<I', len(polygon)))
            for ring in polygon:
                out.write(struct.pack('<I', len(ring)))
                for x, y in ring:
                    out.write(struct.pack('<2i', round(x * 1e6), round(y * 1e6)))
print(f'{len(areas)} polygons, {len(names)} names, {target.stat().st_size / 1e6:.1f} MB')
