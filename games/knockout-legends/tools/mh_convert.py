# Usage: python3 tools/mh_convert.py <makehuman checkout>/makehuman/data assets/mhbody.js
# Bake MakeHuman (CC0) base mesh + targets into a compact skinned body for the game.
import json, re, sys, base64, struct, math
D = sys.argv[1]  # makehuman/data dir
OUT = sys.argv[2]
V, VT, F = [], [], []
group = None
for line in open(f'{D}/3dobjs/base.obj'):
    if line.startswith('v '): V.append([float(x) for x in line.split()[1:4]])
    elif line.startswith('vt '): VT.append([float(x) for x in line.split()[1:3]])
    elif line.startswith('g '): group = line.split()[1]
    elif line.startswith('f ') and group == 'body':
        F.append([tuple(int(p) - 1 if p else -1 for p in (c.split('/') + [''])[:2]) for c in line.split()[1:]])
print('verts', len(V), 'uvs', len(VT), 'body faces', len(F))
def target(path):
    t = {}
    for line in open(path):
        if line[0] in '#\n': continue
        p = line.split(); t[int(p[0])] = (float(p[1]), float(p[2]), float(p[3]))
    return t
T = f'{D}/targets/macrodetails'
TG = {
  'african': target(f'{T}/african-male-young.target'), 'caucasian': target(f'{T}/caucasian-male-young.target'),
  'muscle': target(f'{T}/universal-male-young-maxmuscle-averageweight.target'), 'lean': target(f'{T}/universal-male-young-maxmuscle-minweight.target'),
  'tall': target(f'{T}/height/male-young-maxmuscle-averageweight-maxheight.target'), 'ideal': target(f'{T}/proportions/male-young-maxmuscle-averageweight-idealproportions.target'),
}
RECIPES = {
  'vance': {'african': 1.0, 'muscle': .75, 'lean': .25, 'ideal': .8},
  'volkov': {'caucasian': 1.0, 'muscle': .6, 'lean': .4, 'tall': .35, 'ideal': .8},
}
skel = json.load(open(f'{D}/rigs/default.mhskel'))
weights = json.load(open(f'{D}/rigs/default_weights.mhw'))['weights']
# our 15 bones
OURS = ['hips', 'abdomen', 'chest', 'neck', 'head', 'uarmL', 'uarmR', 'farmL', 'farmR', 'thighL', 'thighR', 'shinL', 'shinR', 'footL', 'footR',
        'clavL', 'clavR', 'twistL', 'twistR', 'wristL', 'wristR']
def map_bone(b):
    side = 'L' if b.endswith('.L') else 'R' if b.endswith('.R') else ''
    n = b.split('.')[0]
    if n in ('root', 'pelvis', 'spine05'): return 0
    if n in ('spine04', 'spine03'): return 1
    if n in ('spine02', 'spine01', 'breast'): return 2
    if n in ('clavicle', 'shoulder01'): return 15 if side == 'L' else 16
    if n.startswith('neck'): return 3
    if n.startswith('upperarm'): return 5 if side == 'L' else 6
    if n == 'lowerarm01': return 7 if side == 'L' else 8
    if n == 'lowerarm02': return 17 if side == 'L' else 18
    if n == 'wrist' or n.startswith('metacarpal') or n.startswith('finger'): return 19 if side == 'L' else 20
    if n.startswith('upperleg'): return 9 if side == 'L' else 10
    if n.startswith('lowerleg'): return 11 if side == 'L' else 12
    if n == 'foot' or n.startswith('toe'): return 13 if side == 'L' else 14
    return 4  # head, jaw, eyes, tongue, face muscles
HANDS = lambda b: b.split('.')[0] in ('wrist',) or b.startswith('metacarpal') or b.startswith('finger')
W = [dict() for _ in V]; handW = [0.0] * len(V)
for b, lst in weights.items():
    o = map_bone(b)
    for vi, w in lst:
        W[vi][o] = W[vi].get(o, 0) + w
        if HANDS(b): handW[vi] += w
def joint(pos, name):
    idx = skel['joints'][name]; n = len(idx)
    return [sum(pos[i][k] for i in idx) / n for k in range(3)]
out = {'license': 'Body: MakeHuman base mesh, rig weights and targets, CC0 1.0 (makehumancommunity/makehuman)', 'bones': OURS, 'fighters': {}}
# geometry vertices and UV vertices used by the kept quads; head and hands dropped
def headish(vi): w = W[vi]; tot = sum(w.values()) or 1; return w.get(4, 0) / tot > .5
def handish(vi): tot = sum(W[vi].values()) or 1; return handW[vi] / tot > .5
keep = [f for f in F if not all(headish(v) for v, _ in f) and not all(handish(v) for v, _ in f)]
assert all(len(f) == 4 for f in keep), 'expected quads'
print('faces kept', len(keep), 'of', len(F))
gmap, gsrc, tmap, uvs, qg, qt = {}, [], {}, [], [], []
for f in keep:
    for v, t in f:
        if v not in gmap: gmap[v] = len(gsrc); gsrc.append(v)
        if t not in tmap: tmap[t] = len(tmap); uvs += VT[t]
        qg.append(gmap[v]); qt.append(tmap[t])
src = gsrc
si, sw = [], []
for v in src:
    top = sorted(W[v].items(), key=lambda kv: -kv[1])[:4]; tot = sum(w for _, w in top) or 1
    top += [(0, 0)] * (4 - len(top))
    si += [b for b, _ in top]; sw += [round(w / tot * 255) for _, w in top]
B = lambda a, fmt: base64.b64encode(struct.pack(f'<{len(a)}{fmt}', *a)).decode()
out['uv'] = B(uvs, 'f'); out['quadsG'] = B(qg, 'H'); out['quadsT'] = B(qt, 'H')
out['skinIndex'] = B(si, 'B'); out['skinWeight'] = B(sw, 'B'); out['count'] = len(src); out['uvCount'] = len(uvs) // 2
# runtime body types: one base shape plus quantized target deltas (muscle x weight grid, ethnicity, proportions).
# Extra pseudo-vertices ride along: crown, sole and every joint the game needs (joints are averages of
# MakeHuman's helper vertices, so they blend linearly with the same targets).
import numpy as np
base = np.array(V)
bodyIdx = [v for f in F for v, _ in f]
crown = max(bodyIdx, key=lambda v: V[v][1]); sole = min(bodyIdx, key=lambda v: V[v][1])
def jidx(b, end='head'): return skel['joints'][skel['bones'][b][end]]
EXTRA = [('crown', [crown]), ('sole', [sole])]
for side in 'LR':
    EXTRA += [(f'S{side}', jidx(f'upperarm01.{side}')), (f'E{side}', jidx(f'lowerarm01.{side}')), (f'W{side}', jidx(f'wrist.{side}')),
              (f'H{side}', jidx(f'upperleg01.{side}')), (f'K{side}', jidx(f'lowerleg01.{side}')), (f'A{side}', jidx(f'foot.{side}')), (f'T{side}', jidx(f'foot.{side}', 'tail'))]
EXTRA += [('neck', jidx('neck01')), ('head', jidx('head')), ('spine', jidx('spine03'))]
# pivots for the spine chain (abdomen at spine04, chest at spine02), the clavicles, and the forearm twist joints
EXTRA += [('sp4', jidx('spine04')), ('sp2', jidx('spine02'))]
for side in 'LR': EXTRA += [(f'CL{side}', jidx(f'clavicle.{side}')), (f'X{side}', jidx(f'lowerarm02.{side}'))]
def gather(arr): return np.concatenate([arr[np.array(src)], np.array([arr[np.array(ix)].mean(0) for _, ix in EXTRA])])
out['extras'] = [n for n, _ in EXTRA]
out['base'] = B(gather(base).ravel().tolist(), 'f')
TNAMES = {f'u_{m}_{w}': f'{T}/universal-male-young-{m}muscle-{w}weight.target' for m in ('min', 'average', 'max') for w in ('min', 'average', 'max')}
TNAMES.update({'african': f'{T}/african-male-young.target', 'caucasian': f'{T}/caucasian-male-young.target', 'asian': f'{T}/asian-male-young.target',
               'ideal': f'{T}/proportions/male-young-maxmuscle-averageweight-idealproportions.target'})
out['targets'] = {}
for name, path in TNAMES.items():
    d = np.zeros_like(base)
    for i, dv in target(path).items(): d[i] = dv
    g = gather(d); mx = float(np.abs(g).max()) or 1.0
    q = np.round(g / mx * 32767).astype('<i2')
    out['targets'][name] = {'s': mx / 32767, 'd': base64.b64encode(q.tobytes()).decode()}
    print('target', name, 'max', round(mx, 4))
open(OUT, 'w').write('// MakeHuman base mesh, rig weights and shape targets: CC0 1.0 (github.com/makehumancommunity/makehuman)\nexport default ' + json.dumps(out, separators=(',', ':')) + ';\n')
print('geom verts', len(src), 'uv verts', len(uvs) // 2, 'quads', len(qg) // 4)
