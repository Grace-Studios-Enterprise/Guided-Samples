# Convert a Marvelous Designer trunks .glb into a compact game asset: the main garment mesh only
# (stitch meshes dropped), node transform applied, metres, plus 1024px diffuse variants and normal map.
import json, struct, sys, base64, math
from PIL import Image
import numpy as np
SRC, OUTDIR = sys.argv[1], sys.argv[2]
b = open(SRC, 'rb').read(); l = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + l]); bin0 = 20 + l + 8
CT = {5120: ('b', 1, 127), 5121: ('B', 1, 255), 5122: ('h', 2, 32767), 5123: ('H', 2, 65535), 5125: ('I', 4, 1), 5126: ('f', 4, 1)}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}
def acc(i):
    a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]; fmt, sz, mx = CT[a['componentType']]; n = NC[a['type']]
    stride = bv.get('byteStride', sz * n); off = bin0 + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    out = np.empty((a['count'], n), dtype=np.float64)
    for k in range(a['count']): out[k] = struct.unpack_from(f'<{n}{fmt}', b, off + k * stride)
    if a.get('normalized'): out = np.maximum(out / mx, -1.0)
    return out
node = j['nodes'][0]; prim = j['meshes'][node['mesh']]['primitives'][0]
P = acc(prim['attributes']['POSITION']); N = acc(prim['attributes']['NORMAL']); UV = acc(prim['attributes']['TEXCOORD_0']); I = acc(prim['indices']).astype(np.int64).ravel()
x, y, z, w = node['rotation']; s = np.array(node['scale']); t = np.array(node['translation'])
R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
P = (P * s) @ R.T + t; N = N @ R.T; N /= np.linalg.norm(N, axis=1, keepdims=True) + 1e-9
P *= 0.1  # decimetres -> metres
# Marvelous Designer exports each panel twice (outer face and an inward-wound inner face a fabric's thickness away).
# Rendered two-sided, the inner twin pokes through the outer layer in every fold, so keep only the outward panel.
T3 = I.reshape(-1, 3); par = np.arange(len(P))
def root(x):
    while par[x] != x: par[x] = par[par[x]]; x = par[x]
    return x
for a, b2, c in T3: par[root(a)] = root(b2); par[root(b2)] = root(c)
comp = np.array([root(i) for i in range(len(P))]); tc = comp[T3[:, 0]]
FN = np.cross(P[T3[:, 1]] - P[T3[:, 0]], P[T3[:, 2]] - P[T3[:, 0]]); C = P[T3].mean(1)
OUT = C.copy(); OUT[:, 1] = 0; OUT[:, 0] -= np.sign(OUT[:, 0]) * 0.1 * (C[:, 1] < -0.06)  # legs: measure from each leg's own axis
outward = (np.einsum('ij,ij->i', FN, OUT) > 0)
info = {c: (outward[tc == c].mean(), (tc == c).sum(), P[comp == c].mean(0)) for c in np.unique(tc)}
drop = set()
for c, (o, n, m) in info.items():
    if o > .25: continue
    twin = [d for d, (o2, n2, m2) in info.items() if d != c and o2 > .75 and abs(n2 - n) <= .1 * n and np.linalg.norm(m2 - m) < .01]
    if twin: drop.add(c)
keepT = np.array([c not in drop for c in tc]); T3 = T3[keepT]
used = np.unique(T3); remap = -np.ones(len(P), np.int64); remap[used] = np.arange(len(used))
P, N, UV, I = P[used], N[used], UV[used], remap[T3].ravel()
print('dropped', len(drop), 'inner panels')
print('verts', len(P), 'tris', len(I) // 3, 'min', P.min(0).round(3), 'max', P.max(0).round(3))
B = lambda a, fmt: base64.b64encode(np.asarray(a).astype(fmt).tobytes()).decode()
out = {'note': 'Boxing trunks garment (main mesh of the uploaded Marvelous Designer export)', 'pos': B(P.ravel(), '<f4'), 'nrm': B(N.ravel(), '<f4'), 'uv': B(UV.ravel(), '<f4'), 'idx': B(I, '<u2'), 'count': len(P)}
open(f'{OUTDIR}/trunks.js', 'w').write('export default ' + json.dumps(out, separators=(',', ':')) + ';\n')
tex = {t2['source']: k for k, t2 in enumerate(j['textures'])}
mat = j['materials'][prim['material']]
def img(texIdx):
    im = j['images'][j['textures'][texIdx]['source']]; bv = j['bufferViews'][im['bufferView']]; o = bin0 + bv.get('byteOffset', 0)
    import io; return Image.open(io.BytesIO(b[o:o + bv['byteLength']]))
# unused atlas space: grow each panel's colour outward so mip levels and seam texels never pick up the background
def dilate(rgb, filled, steps=24):
    rgb, filled = rgb.copy(), filled.copy()
    for _ in range(steps):
        acc = np.zeros_like(rgb); cnt = np.zeros(filled.shape)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
            f2 = np.roll(np.roll(filled, dy, 0), dx, 1); acc += np.roll(np.roll(rgb, dy, 0), dx, 1) * f2[..., None]; cnt += f2
        grow = (~filled) & (cnt > 0); rgb[grow] = acc[grow] / cnt[grow][:, None]; filled = filled | grow
    rgb[~filled] = rgb[filled].mean(0); return rgb
dif = img(mat['pbrMetallicRoughness']['baseColorTexture']['index']).convert('RGBA').resize((1024, 1024), Image.LANCZOS)
nrm = img(mat['normalTexture']['index']).convert('RGB').resize((1024, 1024), Image.LANCZOS)
dif_a = np.asarray(dif)[..., 3] > 200
nrm = Image.fromarray(dilate(np.asarray(nrm).astype(np.float64), dif_a).astype(np.uint8))
nrm.save(f'{OUTDIR}/trunks_normal.jpg', quality=92)
a = np.asarray(dif).astype(np.float64); rgb = a[..., :3]
filled = a[..., 3] > 200
rgb = dilate(rgb, filled)
Image.fromarray(rgb.astype(np.uint8)).save(f'{OUTDIR}/trunks_red.jpg', quality=90)
# second colourway: the red panels become navy, white stays white
r, g, bl = rgb[..., 0], rgb[..., 1], rgb[..., 2]
red = (r > g + 35) & (r > bl + 35)
shade = (r / 214.0)[..., None]
navy = np.clip(np.array([16, 46, 104]) * shade, 0, 255)
rgb2 = np.where(red[..., None], navy, rgb)
Image.fromarray(rgb2.astype(np.uint8)).save(f'{OUTDIR}/trunks_navy.jpg', quality=90)
print('done')
