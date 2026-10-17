import numpy as np, re, sys
def parse(path):
    toks = open(path).read().split()
    i = 0; joints = []; stack = []
    def nxt():
        nonlocal i; t = toks[i]; i += 1; return t
    assert nxt() == 'HIERARCHY'
    while True:
        t = nxt()
        if t in ('ROOT', 'JOINT'):
            name = nxt(); joints.append({'name': name, 'parent': stack[-1] if stack else -1, 'chan': []}); cur = len(joints) - 1
        elif t == 'End':
            nxt(); joints.append({'name': joints[stack[-1]]['name'] + '_end', 'parent': stack[-1], 'chan': []}); cur = len(joints) - 1
        elif t == '{': stack.append(cur)
        elif t == '}':
            stack.pop()
            if not stack: break
        elif t == 'OFFSET': joints[cur]['off'] = np.array([float(nxt()) for _ in range(3)])
        elif t == 'CHANNELS': n = int(nxt()); joints[cur]['chan'] = [nxt() for _ in range(n)]
    assert nxt() == 'MOTION'; nxt(); nf = int(nxt()); nxt(); nxt(); ft = float(nxt())
    nc = sum(len(j['chan']) for j in joints)
    data = np.array(toks[i:i + nf * nc], dtype=np.float64).reshape(nf, nc)
    return joints, data, ft
def rot(axis, deg):
    a = np.radians(deg); c, s = np.cos(a), np.sin(a); n = len(a)
    R = np.zeros((n, 3, 3)); R[:, 0, 0] = R[:, 1, 1] = R[:, 2, 2] = 1
    k = {'X': 0, 'Y': 1, 'Z': 2}[axis]; p, q = [(1, 2), (2, 0), (0, 1)][k]
    R[:, p, p] = c; R[:, q, q] = c; R[:, p, q] = -s; R[:, q, p] = s
    return R
def fk(joints, data):
    nf = len(data); P = {}; Rw = {}; col = 0
    for j, J in enumerate(joints):
        R = np.tile(np.eye(3), (nf, 1, 1)); t = np.zeros((nf, 3))
        for c in J['chan']:
            v = data[:, col]; col += 1
            if c.endswith('position'): t[:, 'XYZ'.index(c[0])] = v
            else: R = R @ rot(c[0], v)
        if J['parent'] < 0: Rw[j] = R; P[j] = t + J['off']
        else:
            p = J['parent']; P[j] = P[p] + np.einsum('nij,j->ni', Rw[p], J['off']); Rw[j] = Rw[p] @ R
    names = {J['name']: j for j, J in enumerate(joints)}
    return {n: P[j] for n, j in names.items()}, {n: Rw[j] for n, j in names.items()}
