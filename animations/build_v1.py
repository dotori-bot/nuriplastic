import math
import os
from lottie.importers.svg import import_svg
from lottie.objects.shapes import Group, Rect, Fill, Path
from lottie.objects.bezier import Bezier
from lottie.objects.layers import ShapeLayer
from lottie.objects import easing
from lottie import NVector
import json

# Run from anywhere -- paths are resolved relative to this script's location.
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = HERE

# import_svg() needs numeric width/height (not "100%"), so patch a scratch
# copy of the source SVG rather than requiring a pre-fixed file in the repo.
RAW_SVG = os.path.join(HERE, "..", "NuriRise.svg")
SRC = os.path.join(HERE, "_NuriRise_fixed.svg")
with open(RAW_SVG) as f:
    _svg = f.read().replace('width="100%"', 'width="8000"').replace('height="100%"', 'height="4500"')
with open(SRC, "w") as f:
    f.write(_svg)

anim = import_svg(SRC)
base_layer = anim.layers[0]
shapes = base_layer.shapes  # 18 parsed groups

# semantic indices (parsed order)
PUMP_MID, PUMP_BASE, PUMP_BAR1, PUMP_TRIGGER = 0, 1, 2, 3
C, I_STEM_PLASTIC, T, S, A, L, P = 4, 5, 6, 7, 8, 9, 10
GREEN, MAGENTA = 11, 12
I_DOT_NURI, U, I_STEM_NURI, R, N = 13, 14, 15, 16, 17
TEXT_OTHER = [C, T, S, A, L, P, I_DOT_NURI, U, I_STEM_NURI, R, N]

FPS = 60
DURATION = 180  # 3s loop

anim.frame_rate = FPS
anim.in_point = 0
anim.out_point = DURATION

def back_ease():
    return easing.Bezier(NVector(0.6, -0.28), NVector(0.735, 0.045))

def std_ease():
    return easing.Bezier(NVector(0.42, 0.0), NVector(0.58, 1.0))

# ---------------------------------------------------------------
# Sequenced reveal: magenta accent rises first, then the wordmark
# fills in, then the green accent rises last.
# ---------------------------------------------------------------
MAGENTA_START = 8
MAGENTA_END = MAGENTA_START + 26    # 34

REVEAL_START = MAGENTA_END + 6       # 40
REVEAL_END = REVEAL_START + 56       # 96  (longer, so the slow wave has room to be seen)

GREEN_START = REVEAL_END + 6         # 102
GREEN_END = GREEN_START + 26         # 128

# ---------------------------------------------------------------
# Accent strokes: grow upward out of the wordmark from their base
# (anchor/position pinned to the stroke's inner-bottom corner so
# scaling 0->100% visually extends the flick outward/up from the letter)
# These are abstract graphic marks, not letterforms, so scaling them
# is fine.
# ---------------------------------------------------------------
def setup_accent(group, base_point, start_t, grow_dur=26, fade_dur=14):
    tr = group.transform
    tr.anchor_point.value = NVector(*base_point)
    tr.position.value = NVector(*base_point)
    # NOTE: growth starts *at* scale 0 -- back_ease()'s anticipation dip would
    # pull it briefly negative (a visible flip), so use a plain ease here.
    tr.scale.add_keyframe(start_t, NVector(0, 0), std_ease())
    tr.scale.add_keyframe(start_t + grow_dur, NVector(100, 100))
    tr.opacity.add_keyframe(start_t, 0, std_ease())
    tr.opacity.add_keyframe(start_t + fade_dur, 100)

setup_accent(shapes[GREEN], (4563.08, 1569.436), start_t=GREEN_START, grow_dur=GREEN_END - GREEN_START)
setup_accent(shapes[MAGENTA], (2626.14, 3557.232), start_t=MAGENTA_START, grow_dur=MAGENTA_END - MAGENTA_START)

# ---------------------------------------------------------------
# Pump glyph: only the nozzle/head piece presses straight down into
# the body and springs back up; the base/collar (mid, base, bar1)
# stays put, like a real pump dispenser being pressed.
# ---------------------------------------------------------------
trigger_mount = (6807.2, 1573.1)  # where the trigger meets the body, below it
ttr = shapes[PUMP_TRIGGER].transform
ttr.anchor_point.value = NVector(*trigger_mount)
ttr.position.value = NVector(*trigger_mount)

cycles = [118, 146]  # after the pump has fully faded in (REVEAL_END=96 + 14); both fit before DURATION
# (t_offset, dy, (scaleX, scaleY))  dy>0 = pressed down, dy<0 = popped up above rest
press_kf = [
    (0,  0,   (100, 100)),   # rest
    (10, 75,  (116, 82)),    # pressed down, squashed
    (22, -35, (88, 120)),    # spring past rest, stretched tall
    (34, 0,   (100, 100)),   # settle at rest
]
for c in cycles:
    for dt, dy, sv in press_kf:
        t = c + dt
        ease = back_ease() if dt in (10, 22) else std_ease()
        ttr.position.add_keyframe(t, NVector(trigger_mount[0], trigger_mount[1] + dy), ease)
        ttr.scale.add_keyframe(t, NVector(*sv), ease)
ttr.position.add_keyframe(DURATION, NVector(*trigger_mount))
ttr.scale.add_keyframe(DURATION, NVector(100, 100))

# Whole pump (all 4 pieces) stays invisible until the wordmark has
# finished revealing, then fades in -- pure opacity, no shape distortion.
# (It sits in the same screen area the wipe-cover sweeps through, so
# fading it in any earlier would just be hidden behind that cover.)
pump_wrap = Group()
pump_wrap.shapes = [shapes[PUMP_MID], shapes[PUMP_BASE], shapes[PUMP_BAR1], shapes[PUMP_TRIGGER]] + [pump_wrap.shapes[-1]]
pump_wrap.transform.opacity.add_keyframe(REVEAL_END, 0, std_ease())
pump_wrap.transform.opacity.add_keyframe(REVEAL_END + 14, 100)

# ---------------------------------------------------------------
# "i" stem in "plastic" doubles as the pump's body. Its *initial*
# appearance comes from the same wipe mask as the rest of the
# wordmark (below), so its shape stays undistorted. Only *after*
# the wordmark is fully visible, on each subsequent press, it
# briefly drains (shrinks from the bottom) and refills -- an
# intentional liquid-level effect, not a proportion glitch.
# ---------------------------------------------------------------
istem_base = (6800.15, 2628.9)
istr = shapes[I_STEM_PLASTIC].transform
istr.anchor_point.value = NVector(*istem_base)
istr.position.value = NVector(*istem_base)
for c in cycles:
    press_peak = c + 10
    if press_peak < REVEAL_END:
        continue  # skip presses that land before the wordmark is fully visible
    istr.scale.add_keyframe(press_peak, NVector(100, 100), std_ease())
    istr.scale.add_keyframe(press_peak + 8, NVector(100, 32), back_ease())
    istr.scale.add_keyframe(press_peak + 24, NVector(100, 100), std_ease())

# ---------------------------------------------------------------
# Non-text layer: pump (fades in) + accents (grow in). Downscaled
# from the native 8000x4500 SVG coordinate space to the 1600x900
# output canvas directly on the layer transform.
# ---------------------------------------------------------------
bg_rect = Rect()
bg_rect.position.value = NVector(4000.0, 2250.0)
bg_rect.size.value = NVector(9000.0, 5100.0)
bg_fill = Fill(NVector(1, 1, 1, 1))
bg_group = Group()
bg_group.shapes = [bg_rect, bg_fill] + [bg_group.shapes[-1]]

base_layer.shapes = [pump_wrap, shapes[GREEN], shapes[MAGENTA], bg_group]
base_layer.transform.scale.value = NVector(20, 20)
base_layer.transform.position.value = NVector(0, 0)
base_layer.transform.anchor_point.value = NVector(0, 0)
base_layer.in_point = 0
base_layer.out_point = DURATION

# ---------------------------------------------------------------
# Text layer: every letterform kept at its true, undistorted shape
# (identity transform) at all times -- never scaled or squashed.
# Visibility comes from a plain white "cover" shape sitting on top
# of the letters, pinned along its top edge and covering down to
# (and past) the wordmark's lowest point. Its *bottom* edge is a
# wavy liquid-like line that rises from the baseline up past the
# ascenders over REVEAL_START->REVEAL_END, uncovering the letters
# the way a rising, sloshing fill level would -- never touching the
# letters' own geometry. (The renderer here doesn't support real
# Lottie masks, so this reproduces the same visual result with a
# plain animated shape.)
# ---------------------------------------------------------------
text_layer = ShapeLayer()
letters = [shapes[i] for i in TEXT_OTHER] + [shapes[I_STEM_PLASTIC]]

cover_top = 1380.0     # above the 'l' ascender: pinned top edge
cover_bottom = 3100.0  # below the 'p' descender: fill starts here (fully covered)
cover_left = -200.0
cover_right = 8200.0

WAVE_X = [cover_right, 6257.0, 4314.0, 2371.0, 428.0, cover_left]  # right -> left
WAVE_AMPLITUDE = 240.0
WAVE_CYCLES = 1.3
WAVE_SPEED = 0.11

def wave_bezier(t):
    progress = max(0.0, min(1.0, (t - REVEAL_START) / (REVEAL_END - REVEAL_START)))
    base_y = cover_bottom - progress * (cover_bottom - cover_top)
    amp = WAVE_AMPLITUDE * math.sin(math.pi * progress)  # 0 at both ends, peaks mid-fill
    phase = t * WAVE_SPEED
    b = Bezier()
    b.add_point((cover_left, cover_top))
    b.add_point((cover_right, cover_top))
    span = cover_right - cover_left
    for x in WAVE_X:
        wobble = amp * math.sin(phase + 2 * math.pi * WAVE_CYCLES * (x - cover_left) / span)
        b.add_point((x, base_y + wobble))
    b.close()
    return b

cover_path = Path()
step = 2
frame_t = REVEAL_START
while frame_t < REVEAL_END:
    cover_path.shape.add_keyframe(frame_t, wave_bezier(frame_t), std_ease())
    frame_t += step
cover_path.shape.add_keyframe(REVEAL_END, wave_bezier(REVEAL_END))

cover_fill = Fill(NVector(1, 1, 1, 1))
cover_group = Group()
cover_group.shapes = [cover_path, cover_fill] + [cover_group.shapes[-1]]

text_layer.shapes = [cover_group] + letters
text_layer.transform.scale.value = NVector(20, 20)
text_layer.transform.position.value = NVector(0, 0)
text_layer.transform.anchor_point.value = NVector(0, 0)
text_layer.in_point = 0
text_layer.out_point = DURATION

anim.layers = [text_layer, base_layer]
anim.width = 1600
anim.height = 900

out_path = f"{OUT_DIR}/nuriplastic_logo_v1.json"
with open(out_path, "w") as f:
    json.dump(anim.to_dict(), f)
print("wrote", out_path)
