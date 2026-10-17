# Bake CMU shadowboxing guard stretches into a looping "live guard" layer: per-frame deviations from the mean pose
# (pelvis bob/sway and rotation, chest and head rotation relative to their parent, both hands relative to the chest).
import sys, json, numpy as np
sys.path.insert(0, sys.argv[1]); from bvh import parse, fk
OUT = sys.argv[2]; SEGS = json.loads(sys.argv[3])  # [[file, start_s, dur_s, mirror], ...]
FPS, XF, H_GAME = 30, .4, 1.85
def smooth(a, n):
    k = np.ones(n) / n; pad = np.pad(a, [(n // 2, n - 1 - n // 2)] + [(0, 0)] * (a.ndim - 1), mode='edge')
    return np.stack([np.convolve(pad[:, c], k, 'valid') for c in range(a.shape[1])], 1) if a.ndim > 1 else np.convolve(pad, k, 'valid')
def eulerYXZ(M):  # M maps local->ref in (x left, y up, z forward); returns pitch(x), yaw(y), roll(z) for three.js 'YXZ'
    x = np.arcsin(np.clip(-M[:, 1, 2], -1, 1)); y = np.arctan2(M[:, 0, 2], M[:, 2, 2]); z = np.arctan2(M[:, 1, 0], M[:, 1, 1]); return np.stack([x, y, z], 1)
def meanrot(R):
    U, _, Vt = np.linalg.svd(R.mean(0)); return U @ Vt
cache = {}; pieces = []
for f, t0, dur, mirror in SEGS:
    if f not in cache: J, D, ft = parse(f); cache[f] = (fk(J, D), ft)
    (P, R), ft = cache[f]
    idx = np.arange(int(t0 / ft), int((t0 + dur) / ft), int(round(1 / FPS / ft)))
    foot = np.minimum(P['LeftFoot'][:, 1], P['RightFoot'][:, 1]); height = np.median(P['Head'][:, 1] - foot); sc = H_GAME * .93 / height
    left = P['LeftUpLeg'] - P['RightUpLeg']; left[:, 1] = 0; left = smooth(left, int(.6 / ft)); left /= np.linalg.norm(left, axis=1, keepdims=True)
    up = np.array([0, 1., 0]); fwd = np.cross(left, up)
    Ref = np.stack([left, np.tile(up, (len(left), 1)), fwd], 2)  # columns: game axes in BVH world
    hipS = smooth(P['Hips'], int(.6 / ft))
    def toRef(v, k): return np.einsum('nji,nj->ni', Ref[k], v)
    k = idx
    pel = toRef(P['Hips'][k] - hipS[k], k) * sc
    Rh = np.einsum('nji,njk->nik', Ref[k], R['Hips'][k])           # hips in ref axes
    Rc = np.einsum('nji,njk->nik', R['Hips'][k], R['Spine1'][k])     # chest relative to hips
    Rk = np.einsum('nji,njk->nik', R['Spine1'][k], R['Head'][k])     # head relative to chest
    def dev(Rx, frame):  # deviation from the mean, expressed in game axes through the given frame
        Mx = meanrot(Rx); Dl = np.einsum('nij,kj->nik', Rx, Mx)     # R * mean^T (world-ish of that parent)
        F = frame; return eulerYXZ(np.einsum('nji,njk,nkl->nil', F, Dl, F))
    Fh = Ref[k]; dh = eulerYXZ(np.einsum('nij,kj->nik', Rh, meanrot(Rh)))
    Fc = np.einsum('nij,njk->nik', np.transpose(Ref[k], (0, 2, 1)), R['Hips'][k])  # hips frame in ref axes
    dc = eulerYXZ(np.einsum('nij,njk,nlk->nil', Fc, np.einsum('nij,kj->nik', Rc, meanrot(Rc)), Fc))
    Fk = np.einsum('nij,njk->nik', np.transpose(Ref[k], (0, 2, 1)), R['Spine1'][k])
    dk = eulerYXZ(np.einsum('nij,njk,nlk->nil', Fk, np.einsum('nij,kj->nik', Rk, meanrot(Rk)), Fk))
    def handC(name):  # hand relative to chest joint, in chest frame expressed in ref axes at the mean chest orientation
        v = toRef(P[name][k] - P['Spine1'][k], k) * sc; return v - v.mean(0)
    lh, rh = handC('LeftHand'), handC('RightHand')
    pel = pel - pel.mean(0)
    ch = np.concatenate([pel, dh, dc, dk, lh, rh], 1)  # 3 + 3 + 3 + 3 + 3 + 3 = 18
    if mirror:  # southpaw take -> orthodox: flip x, negate yaw and roll, swap hands
        m = np.array([-1, 1, 1, 1, -1, -1, 1, -1, -1, 1, -1, -1, 1, -1, -1, 1, -1, -1.])
        ch = ch * m; ch = np.concatenate([ch[:, :12], ch[:, 15:18], ch[:, 12:15]], 1)
    pieces.append(ch)
# join with crossfades and close the loop
n = int(XF * FPS); out = pieces[0]
for p in pieces[1:] + [pieces[0][:n * 2]]:
    w = np.linspace(0, 1, n)[:, None]; out = np.concatenate([out[:-n], out[-n:] * (1 - w) + p[:n] * w, p[n:]], 0)
out = out[n:-n]  # the tail now blends back into the head
out = out - out.mean(0)
names = ['px', 'py', 'pz', 'hp', 'hy', 'hr', 'cp', 'cy', 'cr', 'kp', 'ky', 'kr', 'lx', 'ly', 'lz', 'rx', 'ry', 'rz']
print('frames', len(out), 'seconds %.1f' % (len(out) / FPS)); print({nm: round(float(np.abs(out[:, i]).max()), 3) for i, nm in enumerate(names)})
q = np.round(out, 4)
open(OUT, 'w').write('// Live-guard layer baked from CMU Graphics Lab Motion Capture Database shadowboxing takes (13_17, 15_13).\n'
  '// The data is free to use (mocap.cs.cmu.edu; BVH conversion by B. Hahne). Deviations from the mean pose, 30 fps, looping.\n'
  'export default ' + json.dumps({'fps': FPS, 'n': len(q), 'names': names, 'data': q.ravel().tolist()}, separators=(',', ':')) + ';\n')
