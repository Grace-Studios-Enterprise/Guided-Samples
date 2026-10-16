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
OURS = ['hips', 'abdomen', 'chest', 'neck', 'head', 'uarmL', 'uarmR', 'farmL', 'farmR', 'thighL', 'thighR', 'shinL', 'shinR', 'footL', 'footR']
def map_bone(b):
    side = 'L' if b.endswith('.L') else 'R' if b.endswith('.R') else ''
    n = b.split('.')[0]
    if n in ('root', 'pelvis', 'spine05'): return 0
    if n in ('spine04', 'spine03'): return 1
    if n in ('spine02', 'spine01', 'clavicle', 'breast', 'shoulder01'): return 2
    if n.startswith('neck'): return 3
    if n.startswith('upperarm'): return 5 if side == 'L' else 6
    if n.startswith('lowerarm') or n in ('wrist',) or n.startswith('metacarpal') or n.startswith('finger'): return 7 if side == 'L' else 8
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
for name, recipe in RECIPES.items():
    P = [list(v) for v in V]
    for tname, w in recipe.items():
        for i, d in TG[tname].items():
            for k in range(3): P[i][k] += d[k] * w
    J = {n: joint(P, n) for n in skel['joints']}
    bone = lambda b, end='head': J[skel['bones'][b][end]]
    # orientation: make +Z the facing direction and +X the fighter's left (.L)
    sx = 1 if bone('upperarm01.L')[0] > 0 else -1
    toe, ank = bone('foot.L', 'tail'), bone('foot.L')
    sz = 1 if toe[2] > ank[2] else -1
    ys = [P[v][1] for v in range(len(V)) if any(v == vv for vv, _ in [])] or [p[1] for p in P[:13380]]
    ymin, ymax = min(ys), max(ys)
    scale = 1.85 / (ymax - ymin)
    tf = lambda p: [p[0] * sx * scale, (p[1] - ymin) * scale, p[2] * sz * scale]
    pos = []
    for v in src: pos += tf(P[v])
    joints = {
      'S': [tf(bone('upperarm01.L')), tf(bone('upperarm01.R'))], 'E': [tf(bone('lowerarm01.L')), tf(bone('lowerarm01.R'))], 'W': [tf(bone('wrist.L')), tf(bone('wrist.R'))],
      'H': [tf(bone('upperleg01.L')), tf(bone('upperleg01.R'))], 'K': [tf(bone('lowerleg01.L')), tf(bone('lowerleg01.R'))], 'A': [tf(bone('foot.L')), tf(bone('foot.R'))],
      'T': [tf(bone('foot.L', 'tail')), tf(bone('foot.R', 'tail'))], 'neck': tf(bone('neck01')), 'head': tf(bone('head')), 'spine': tf(bone('spine03')),
    }
    out['fighters'][name] = {'pos': B(pos, 'f'), 'joints': joints, 'sx': sx, 'sz': sz}
    print(name, 'scale', round(scale, 4), 'sx', sx, 'sz', sz, {k: [[round(c, 3) for c in p] for p in (v if isinstance(v[0], list) else [v])] for k, v in joints.items()})
open(OUT, 'w').write('// MakeHuman base mesh, rig weights and shape targets: CC0 1.0 (github.com/makehumancommunity/makehuman)\nexport default ' + json.dumps(out, separators=(',', ':')) + ';\n')
print('geom verts', len(src), 'uv verts', len(uvs) // 2, 'quads', len(qg) // 4)
