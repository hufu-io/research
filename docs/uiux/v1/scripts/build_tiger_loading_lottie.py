import base64
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
FRAME_DIR = ROOT / "assets" / "loading" / "frames"
OUTPUT = ROOT / "assets" / "loading" / "tiger_loading.json"
COMPONENT_OUTPUT = ROOT / "assets" / "loading" / "tiger_loading.component.js"
CHECK_ONLY = "--check" in sys.argv
FRAME_FILES = [FRAME_DIR / f"tiger_run_{index:02d}.png" for index in range(1, 5)]


def prop(value, animated=False):
    return {"a": 1 if animated else 0, "k": value}


def keyframes(points):
    frames = []
    for index, (time, value) in enumerate(points):
        frame = {"t": time, "s": value}
        if index < len(points) - 1:
            frame["e"] = points[index + 1][1]
            frame["i"] = {"x": 0.667, "y": 1}
            frame["o"] = {"x": 0.333, "y": 0}
        frames.append(frame)
    return frames


def transform(anchor, position, scale, rotation=0, opacity=100):
    return {
        "o": prop(opacity if isinstance(opacity, int) else keyframes(opacity), not isinstance(opacity, int)),
        "r": prop(rotation if isinstance(rotation, (int, float)) else keyframes(rotation), not isinstance(rotation, (int, float))),
        "p": prop(position if isinstance(position[0], (int, float)) else keyframes(position), not isinstance(position[0], (int, float))),
        "a": prop(anchor),
        "s": prop(scale if isinstance(scale[0], (int, float)) else keyframes(scale), not isinstance(scale[0], (int, float))),
    }


def image_asset(index, path):
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return {
        "id": f"aime_tiger_run_frame_{index:02d}",
        "w": 627,
        "h": 627,
        "u": "",
        "p": f"data:image/png;base64,{encoded}",
        "e": 1,
    }


def frame_layer(index, frame_index, start, end):
    positions = [[256, 260], [256, 258], [256, 251], [256, 258]]
    scales = [[73, 73], [72, 72], [72, 72], [73, 73]]
    rotations = [-0.8, 0.8, -1.0, 0.5]
    return {
        "ddd": 0,
        "ind": index,
        "ty": 2,
        "nm": f"AIMe Running Frame {frame_index:02d} {start:02d}-{end:02d}",
        "refId": f"aime_tiger_run_frame_{frame_index:02d}",
        "sr": 1,
        "ks": transform([313.5, 313.5], positions[frame_index - 1], scales[frame_index - 1], rotations[frame_index - 1]),
        "ao": 0,
        "ip": start,
        "op": end,
        "st": start,
        "bm": 0,
    }


def streak_layer(index, y, width, color, delay):
    points = [
        (0, [104 - delay * 4, y]),
        (6, [84 - delay * 4, y]),
        (12, [104 - delay * 4, y]),
        (18, [84 - delay * 4, y]),
        (24, [104 - delay * 4, y]),
    ]
    opacity = [
        (0, [12]),
        (3 + delay, [62]),
        (8 + delay, [8]),
        (12, [12]),
        (15 + delay, [62]),
        (20 + delay, [8]),
        (24, [12]),
    ]
    return {
        "ddd": 0,
        "ind": index,
        "ty": 4,
        "nm": f"Running Speed Streak {index - 8}",
        "sr": 1,
        "ks": transform([0, 0], points, [100, 100], opacity=opacity),
        "ao": 0,
        "shapes": [
            {
                "ty": "gr",
                "it": [
                    {"ty": "rc", "d": 1, "s": prop([width, 5]), "p": prop([0, 0]), "r": prop(2.5), "nm": "Streak Shape"},
                    {"ty": "fl", "c": prop(color), "o": prop(100), "r": 1, "nm": "Streak Fill"},
                    {"ty": "tr", "p": prop([0, 0]), "a": prop([0, 0]), "s": prop([100, 100]), "r": prop(0), "o": prop(100), "sk": prop(0), "sa": prop(0), "nm": "Transform"},
                ],
                "nm": "Speed Streak",
            }
        ],
        "ip": 0,
        "op": 24,
        "st": 0,
        "bm": 0,
    }


def animation():
    assets = [image_asset(index, path) for index, path in enumerate(FRAME_FILES, 1)]
    sequence = [1, 2, 3, 4, 1, 2, 3, 4]
    layers = [
        frame_layer(index + 1, frame_index, index * 3, index * 3 + 3)
        for index, frame_index in enumerate(sequence)
    ]
    layers.extend(
        [
            streak_layer(9, 263, 72, [0.28, 0.76, 1, 1], 0),
            streak_layer(10, 299, 50, [0.48, 0.43, 1, 1], 2),
            streak_layer(11, 227, 38, [0.27, 0.9, 0.94, 1], 1),
        ]
    )
    return {
        "v": "5.12.2",
        "fr": 30,
        "ip": 0,
        "op": 24,
        "w": 512,
        "h": 512,
        "nm": "AIMe Tiger App Transition Loading Frame Animation",
        "ddd": 0,
        "assets": assets,
        "layers": layers,
        "markers": [{"tm": 0, "cm": "run_loop", "dr": 24}],
    }


animation_data = animation()
content = json.dumps(animation_data, separators=(",", ":"), ensure_ascii=False) + "\n"
component_content = f"window.TigerLoadingAnimationData={json.dumps(animation_data, separators=(',', ':'), ensure_ascii=False)};\n"
if CHECK_ONLY:
    if not OUTPUT.exists() or OUTPUT.read_text() != content:
        raise RuntimeError(f"Outdated tiger loading Lottie: {OUTPUT}")
    if not COMPONENT_OUTPUT.exists() or COMPONENT_OUTPUT.read_text() != component_content:
        raise RuntimeError(f"Outdated tiger loading component: {COMPONENT_OUTPUT}")
    print("Tiger loading Lottie frame animation and component are current")
else:
    OUTPUT.write_text(content)
    COMPONENT_OUTPUT.write_text(component_content)
    print(f"Generated {OUTPUT} and {COMPONENT_OUTPUT}")
