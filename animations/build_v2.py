import math
import random
import os
from lottie.importers.svg import import_svg
from lottie.objects.shapes import Group, Rect, Fill
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
ALL_LETTERS = [C, I_STEM_PLASTIC, T, S, A, L, P, I_DOT_NURI, U, I_STEM_NURI, R, N]

FPS = 60
DURATION = 180  # 3s loop

anim.frame_rate = FPS
anim.in_point = 0
anim.out_point = DURATION

def ease_in():
    """Standard CSS 'ease-in': slow start, fast finish -- gravity accelerating."""
    return easing.Bezier(NVector(0.42, 0.0), NVector(1.0, 1.0))

def ease_out():
    """Standard CSS 'ease-out': fast start, slow finish -- decelerating at the top of a bounce."""
    return easing.Bezier(NVector(0.0, 0.0), NVector(0.58, 1.0))

def std_ease():
    return easing.Bezier(NVector(0.42, 0.0), NVector(0.58, 1.0))

# ---------------------------------------------------------------
# Letters fall straight down (no horizontal drift) from directly
# above their own resting spot, in random order with a rhythmic
# stagger, then settle with a single gentle bounce off the ground.
# Position (and, for a few letters, rotation) only -- never scaled,
# squashed, or otherwise distorted.
# ---------------------------------------------------------------
random.seed(7)
# The "i" dot in "nuri" isn't its own free-floating piece -- it has to
# land on top of its stem, so it's pulled out of the random shuffle and
# scheduled separately, after I_STEM_NURI, instead of falling by chance
# whenever the shuffle happens to place it (which could land it first).
FALL_LETTERS = [x for x in ALL_LETTERS if x != I_DOT_NURI]
fall_order = list(FALL_LETTERS)
random.shuffle(fall_order)

# Each letter's own bottom-center point, in native SVG coordinates --
# used as the pivot for the teeter/wobble so it rocks on its own base
# like an unbalanced plastic bottle, instead of spinning on its center.
LETTER_PIVOT = {
    C: (7399.4, 2643.0),
    I_STEM_PLASTIC: (6800.15, 2628.9),
    T: (6296.55, 2643.0),
    S: (5644.65, 2643.0),
    A: (4914.15, 2643.0),
    L: (4314.85, 2628.9),
    P: (3680.85, 3046.2),
    I_DOT_NURI: (2883.7, 1709.9),
    U: (1503.55, 2656.5),
    I_STEM_NURI: (2885.35, 2648.5),
    R: (2388.8, 2648.5),
    N: (615.4, 2648.5),
}

# Only a handful of (grounded, roundish-bottomed) letters get the
# teeter -- not the floating "i" dot, and not every letter, so it
# reads as a bit of character rather than a uniform effect.
wobble_rng = random.Random(99)
WOBBLE_CANDIDATES = [N, U, A, S, C, P]
WOBBLE_SET = set(wobble_rng.sample(WOBBLE_CANDIDATES, 4))

DROP_START = 8
STAGGER_BASE = 5
FALL_DUR = 24
BOUNCE_UP_DUR = 10
BOUNCE_DOWN_DUR = 10
BOUNCE_HEIGHT = 55.0

# Clears every letter's own lowest point (the 'p' descender, y~3046)
# with generous margin, so nothing is visible before it starts falling.
DROP_HEIGHT_BASE = 3600.0

last_land_time = 0
land_times = []  # when each letter touches down + settles (bounce done)
land_time_by_idx = {}
for i, idx in enumerate(fall_order):
    jitter = random.randint(-2, 2)
    t0 = max(DROP_START, DROP_START + i * STAGGER_BASE + jitter)
    drop_height = DROP_HEIGHT_BASE + random.uniform(0, 500)
    t1 = t0 + FALL_DUR                    # touches down
    t2 = t1 + BOUNCE_UP_DUR                # small bounce peak
    t3 = t2 + BOUNCE_DOWN_DUR              # settles at rest
    last_land_time = max(last_land_time, t3)
    land_times.append(t3)
    land_time_by_idx[idx] = t3

    tr = shapes[idx].transform

    if idx in WOBBLE_SET:
        # Rotate around the letter's own base so position keyframes
        # must now be expressed relative to that same pivot.
        px, py = LETTER_PIVOT[idx]
        tr.anchor_point.value = NVector(px, py)
        tr.position.add_keyframe(t0, NVector(px, py - drop_height), ease_in())
        tr.position.add_keyframe(t1, NVector(px, py), ease_out())
        tr.position.add_keyframe(t2, NVector(px, py - BOUNCE_HEIGHT), ease_in())
        tr.position.add_keyframe(t3, NVector(px, py))

        # Decaying side-to-side teeter, timed to the touchdown/bounce.
        sign = wobble_rng.choice([1, -1])
        a1 = sign * wobble_rng.uniform(7.0, 10.0)
        a2 = -sign * wobble_rng.uniform(4.0, 6.0)
        a3 = sign * wobble_rng.uniform(1.5, 2.5)
        wt1 = t1 + wobble_rng.randint(4, 6)
        wt2 = wt1 + wobble_rng.randint(5, 7)
        wt3 = wt2 + wobble_rng.randint(5, 7)
        wt4 = wt3 + wobble_rng.randint(5, 7)
        tr.rotation.add_keyframe(t1, 0, ease_out())
        tr.rotation.add_keyframe(wt1, a1, std_ease())
        tr.rotation.add_keyframe(wt2, a2, std_ease())
        tr.rotation.add_keyframe(wt3, a3, std_ease())
        tr.rotation.add_keyframe(wt4, 0)
        last_land_time = max(last_land_time, wt4)
    else:
        tr.position.add_keyframe(t0, NVector(0, -drop_height), ease_in())
        tr.position.add_keyframe(t1, NVector(0, 0), ease_out())
        tr.position.add_keyframe(t2, NVector(0, -BOUNCE_HEIGHT), ease_in())
        tr.position.add_keyframe(t3, NVector(0, 0))

# The "i" dot drops in shortly after its stem has landed, never before.
DOT_GAP = 8
dot_t0 = land_time_by_idx[I_STEM_NURI] + DOT_GAP
dot_drop_height = DROP_HEIGHT_BASE + random.uniform(0, 500)
dot_t1 = dot_t0 + FALL_DUR
dot_t2 = dot_t1 + BOUNCE_UP_DUR
dot_t3 = dot_t2 + BOUNCE_DOWN_DUR
last_land_time = max(last_land_time, dot_t3)
land_times.append(dot_t3)
land_time_by_idx[I_DOT_NURI] = dot_t3

dot_tr = shapes[I_DOT_NURI].transform
dot_tr.position.add_keyframe(dot_t0, NVector(0, -dot_drop_height), ease_in())
dot_tr.position.add_keyframe(dot_t1, NVector(0, 0), ease_out())
dot_tr.position.add_keyframe(dot_t2, NVector(0, -BOUNCE_HEIGHT), ease_in())
dot_tr.position.add_keyframe(dot_t3, NVector(0, 0))

# ---------------------------------------------------------------
# Pump glyph: fades in and fires its press -- like version 1's press
# (trigger dips down and squashes, springs back up past rest, then
# settles) -- right as the wordmark is about 80% "filled in" (the
# 10th of 12 letters landing), instead of waiting for every letter.
# ---------------------------------------------------------------
back_ease_v1 = lambda: easing.Bezier(NVector(0.6, -0.28), NVector(0.735, 0.045))

fill_80_idx = math.ceil(0.8 * len(land_times)) - 1
FILL_80_TIME = sorted(land_times)[fill_80_idx]

PUMP_FADE_START = FILL_80_TIME - 14
PUMP_FADE_END = FILL_80_TIME

pump_wrap = Group()
pump_wrap.shapes = [shapes[PUMP_MID], shapes[PUMP_BASE], shapes[PUMP_BAR1], shapes[PUMP_TRIGGER]] + [pump_wrap.shapes[-1]]
pump_wrap.transform.opacity.add_keyframe(PUMP_FADE_START, 0, std_ease())
pump_wrap.transform.opacity.add_keyframe(PUMP_FADE_END, 100)

trigger_mount = (6807.2, 1573.1)  # where the trigger meets the body, below it
ttr = shapes[PUMP_TRIGGER].transform
ttr.anchor_point.value = NVector(*trigger_mount)
ttr.position.value = NVector(*trigger_mount)

PRESS_START = FILL_80_TIME
press_kf = [
    (0,  0,   (100, 100)),   # rest
    (10, 75,  (116, 82)),    # pressed down, squashed
    (22, -35, (88, 120)),    # spring past rest, stretched tall
    (34, 0,   (100, 100)),   # settle at rest
]
for dt, dy, sv in press_kf:
    t = PRESS_START + dt
    ease = back_ease_v1() if dt in (10, 22) else std_ease()
    ttr.position.add_keyframe(t, NVector(trigger_mount[0], trigger_mount[1] + dy), ease)
    ttr.scale.add_keyframe(t, NVector(*sv), ease)
PRESS_END = PRESS_START + press_kf[-1][0]

# ---------------------------------------------------------------
# Accent strokes: revealed with a mask-style wipe that travels along
# each stroke's own diagonal axis, starting from the end nearest the
# wordmark and sweeping out toward the tip. A plain white "door"
# shape -- rotated to match the stroke's angle, then only ever
# translated (never scaled) -- slides along that axis to uncover it.
# The stroke geometry itself is never touched.
# ---------------------------------------------------------------
REVEAL_START = PRESS_START + 4  # fire right as the pump presses, not after
REVEAL_DUR = 20                 # short and snappy, so it reads as immediate

def make_wipe_cover(base_point, tip_point, start_t, dur):
    bx, by = base_point
    tx, ty = tip_point
    dx, dy = tx - bx, ty - by
    length = math.hypot(dx, dy)
    ux, uy = dx / length, dy / length
    angle_deg = math.degrees(math.atan2(dy, dx))

    # Door is centered on the base at rest, so its half-length must reach
    # past the tip (half >= length) to fully cover the stroke at start;
    # travel must then carry its trailing edge past the tip too, so it
    # fully clears the stroke by the end instead of stalling mid-sweep.
    half = length * 1.1
    door = Rect()
    door.position.value = NVector(0, 0)
    door.size.value = NVector(half * 2, 700.0)
    door_fill = Fill(NVector(1, 1, 1, 1))
    group = Group()
    group.shapes = [door, door_fill] + [group.shapes[-1]]
    tr = group.transform
    tr.anchor_point.value = NVector(0, 0)
    tr.rotation.value = angle_deg

    travel = length * 2.3
    tr.position.add_keyframe(start_t, NVector(bx, by), std_ease())
    tr.position.add_keyframe(start_t + dur, NVector(bx + ux * travel, by + uy * travel))
    return group

green_cover = make_wipe_cover((4563.08, 1569.436), (5001.968, 942.769), REVEAL_START, REVEAL_DUR)
magenta_cover = make_wipe_cover((2626.14, 3557.232), (3059.75, 2933.953), REVEAL_START, REVEAL_DUR)

# ---------------------------------------------------------------
# Background + non-text layer (pump, accents + their wipe covers),
# downscaled from the native 8000x4500 SVG coordinate space to the
# 1600x900 output canvas.
# ---------------------------------------------------------------
bg_rect = Rect()
bg_rect.position.value = NVector(4000.0, 2250.0)
bg_rect.size.value = NVector(9000.0, 5100.0)
bg_fill = Fill(NVector(1, 1, 1, 1))
bg_group = Group()
bg_group.shapes = [bg_rect, bg_fill] + [bg_group.shapes[-1]]

base_layer.shapes = [pump_wrap, green_cover, shapes[GREEN], magenta_cover, shapes[MAGENTA], bg_group]
base_layer.transform.scale.value = NVector(20, 20)
base_layer.transform.position.value = NVector(0, 0)
base_layer.transform.anchor_point.value = NVector(0, 0)
base_layer.in_point = 0
base_layer.out_point = DURATION

# ---------------------------------------------------------------
# Text layer: falling letters, each its own group with the fall
# animation set above.
# ---------------------------------------------------------------
text_layer = ShapeLayer()
text_layer.shapes = [shapes[i] for i in ALL_LETTERS]
text_layer.transform.scale.value = NVector(20, 20)
text_layer.transform.position.value = NVector(0, 0)
text_layer.transform.anchor_point.value = NVector(0, 0)
text_layer.in_point = 0
text_layer.out_point = DURATION

anim.layers = [text_layer, base_layer]
anim.width = 1600
anim.height = 900

out_path = f"{OUT_DIR}/nuriplastic_logo_v2.json"
with open(out_path, "w") as f:
    json.dump(anim.to_dict(), f)
print("wrote", out_path)
print("last_land_time", last_land_time, "pump_fade_end", PUMP_FADE_END,
      "reveal_start", REVEAL_START, "reveal_end", REVEAL_START + REVEAL_DUR)
