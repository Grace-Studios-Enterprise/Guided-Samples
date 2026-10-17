# Pack the clips baked by tools/bake_mixamo.html into assets/mocap_mixamo.js (int16, 39 channels per frame, 30 fps).
# Channels (character space: x = fighter's left, y up, z facing; lengths in leg or arm lengths):
#  0-2 hips position (x, z per leg; y per standing hip height)  3-6 hips rotation from rest  7-10 chest rotation from rest
#  11-14 head rotation relative to chest  15-17 / 18-20 left / right wrist from shoulder  21-23 / 24-26 left / right elbow
#  from shoulder  27-29 / 30-32 left / right ankle  33-35 / 36-38 left / right toe direction
import json, sys, base64, struct
src, out = sys.argv[1], sys.argv[2]
KEEP = ['Idle', 'Medium_Step_Forward', 'Long_Step_Forward', 'Step_Backward', 'Short_Left_Side_Step', 'Long_Left_Side_Step', 'Short_Right_Side_Step',
        'Left_Pivot', 'Lead_Jab', 'Jab_Cross', 'Hook', 'Punch_Combo', 'Combo_Punch', 'Body_Jab_Cross', 'Light_Hit_To_Head', 'Medium_Hit_To_Head',
        'Head_Hit', 'Big_Side_Hit', 'Stomach_Hit', 'Kidney_Hit', 'Big_Kidney_Hit', 'Center_Block', 'Left_Block', 'Right_Block',
        'Livershot_Knockdown', 'Crouch_To_Stand', 'Taunt', 'Praying']
d = json.load(open(src))['out']; Q = 8192
clips = {}
for k in KEEP:
    c = d[k]; flat = [max(-32767, min(32767, round(v * Q))) for fr in c['ch'] for v in fr]
    clips[k] = {'n': len(c['ch']), 'speed': c['speed'], 'turn': c['turn'], 'hits': [[h[0], h[1]] for h in c['hits']], 'd': base64.b64encode(struct.pack(f'<{len(flat)}h', *flat)).decode()}
open(out, 'w').write('// Boxing motion: Mixamo animations (mixamo.com, Adobe), downloaded by the project owner and baked with tools/bake_mixamo.html\n'
                     '// + tools/pack_mixamo.py into the game\'s retargeting channels. See README for the channel layout.\n'
                     'export default ' + json.dumps({'fps': 30, 'q': Q, 'ch': 39, 'clips': clips}, separators=(',', ':')) + ';\n')
print(len(clips), 'clips', sum(c['n'] for c in clips.values()), 'frames')
