import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "assets" / "aime"
CHECK_ONLY = "--check" in sys.argv
STATES = {
    "idle": {
        "duration": 90,
        "blink": 44,
        "eyes": [(165, 216, 78, 88, -4), (291, 216, 78, 88, 4)],
    },
    "thinking": {
        "duration": 90,
        "blink": 64,
        "eyes": [(171, 199, 78, 88, -5), (292, 216, 78, 88, 5)],
    },
    "greeting": {
        "duration": 30,
        "blink": 14,
        "eyes": [(195, 190, 72, 84, -5), (307, 210, 78, 88, 5)],
    },
    "peek": {
        "duration": 90,
        "blink": 46,
        "eyes": [(285, 236, 80, 92, 2)],
    },
}


def prop(value, animated=0):
    return {"a": animated, "k": value}


def ease_keyframes(points):
    result = []
    for index, (time, start) in enumerate(points):
        item = {"t": time, "s": start}
        if index < len(points) - 1:
            item["e"] = points[index + 1][1]
            item["i"] = {"x": 0.667, "y": 1}
            item["o"] = {"x": 0.333, "y": 0}
        result.append(item)
    return result


def transform(anchor=(0, 0), position=(0, 0), scale=(100, 100), rotation=0, opacity=100):
    return {
        "o": prop(opacity if isinstance(opacity, int) else ease_keyframes(opacity), 0 if isinstance(opacity, int) else 1),
        "r": prop(rotation if isinstance(rotation, (int, float)) else ease_keyframes(rotation), 0 if isinstance(rotation, (int, float)) else 1),
        "p": prop(position if isinstance(position[0], (int, float)) else ease_keyframes(position), 0 if isinstance(position[0], (int, float)) else 1),
        "a": prop(list(anchor)),
        "s": prop(scale if isinstance(scale[0], (int, float)) else ease_keyframes(scale), 0 if isinstance(scale[0], (int, float)) else 1),
    }


def group_transform(position=(0, 0), rotation=0):
    return {
        "ty": "tr",
        "p": prop(list(position)),
        "a": prop([0, 0]),
        "s": prop([100, 100]),
        "r": prop(rotation),
        "o": prop(100),
        "sk": prop(0),
        "sa": prop(0),
        "nm": "Transform",
    }


def shape_path(vertices, closed=True):
    return {
        "i": [[0, 0] for _ in vertices],
        "o": [[0, 0] for _ in vertices],
        "v": vertices,
        "c": closed,
    }


def fill(rgb):
    return {
        "ty": "fl",
        "c": prop([channel / 255 for channel in rgb] + [1]),
        "o": prop(100),
        "r": 1,
        "nm": "Fill",
    }


def stroke(rgb, width):
    return {
        "ty": "st",
        "c": prop([channel / 255 for channel in rgb] + [1]),
        "o": prop(100),
        "w": prop(width),
        "lc": 2,
        "lj": 2,
        "ml": 4,
        "nm": "Stroke",
    }


def ellipse_group(name, x, y, width, height, rotation):
    return {
        "ty": "gr",
        "it": [
            {"ty": "el", "p": prop([0, 0]), "s": prop([width, height]), "d": 1, "nm": f"{name} Shape"},
            fill((247, 249, 255)),
            group_transform((x, y), rotation),
        ],
        "nm": name,
    }


def closed_line_group(name, x, y, width, rotation):
    vertices = [[-width * 0.42, 0], [0, width * 0.13], [width * 0.42, 0]]
    return {
        "ty": "gr",
        "it": [
            {"ty": "sh", "ks": prop(shape_path(vertices, False)), "nm": f"{name} Path"},
            stroke((20, 34, 112), 7),
            group_transform((x, y), rotation),
        ],
        "nm": name,
    }


def artwork_layer(state, duration):
    return {
        "ddd": 0,
        "ind": 2,
        "ty": 2,
        "nm": f"AIMe {state} HD Artwork",
        "refId": f"aime_{state}_image",
        "sr": 1,
        "ks": transform(),
        "ao": 0,
        "ip": 0,
        "op": duration,
        "st": 0,
        "bm": 0,
    }


def eyelid_layer(state, config):
    blink = config["blink"]
    shapes = []
    for index, (x, y, width, height, rotation) in enumerate(config["eyes"]):
        shapes.append(ellipse_group(f"Eye Cover {index + 1}", x, y, width, height, rotation))
        shapes.append(closed_line_group(f"Closed Eye {index + 1}", x, y + 3, width, rotation))
    opacity = [[0, [0]], [blink - 2, [0]], [blink, [100]], [blink + 2, [100]], [blink + 4, [0]]]
    return {
        "ddd": 0,
        "ind": 1,
        "ty": 4,
        "nm": f"AIMe {state} Vector Eyelids",
        "sr": 1,
        "ks": transform(opacity=opacity),
        "ao": 0,
        "shapes": shapes,
        "ip": 0,
        "op": config["duration"],
        "st": 0,
        "bm": 0,
    }


def outer_transform(state):
    if state == "idle":
        return transform(
            anchor=(256, 256),
            position=[[0, [256, 258]], [45, [256, 249]], [90, [256, 258]]],
            rotation=[[0, [-1]], [45, [1]], [90, [-1]]],
            scale=[[0, [122, 122]], [45, [126, 126]], [90, [122, 122]]],
        )
    if state == "thinking":
        return transform(
            anchor=(256, 256),
            position=[[0, [256, 258]], [22, [252, 250]], [45, [256, 258]], [67, [260, 250]], [90, [256, 258]]],
            rotation=[[0, [-2]], [22, [2]], [45, [-2]], [67, [2]], [90, [-2]]],
            scale=[[0, [122, 122]], [45, [126, 126]], [90, [122, 122]]],
        )
    if state == "greeting":
        return transform(
            anchor=(256, 256),
            position=[[0, [256, 270]], [8, [256, 245]], [22, [256, 247]], [30, [256, 258]]],
            rotation=[[0, [0]], [8, [-2]], [22, [2]], [30, [0]]],
            scale=[[0, [116, 116]], [8, [128, 128]], [22, [124, 124]], [30, [122, 122]]],
        )
    return transform(
        anchor=(256, 256),
        position=[[0, [455, 256]], [15, [366, 256]], [45, [363, 254]], [75, [366, 256]], [90, [455, 256]]],
        rotation=[[0, [1]], [15, [0]], [45, [-1]], [75, [0]], [90, [1]]],
        scale=[[0, [145, 145]], [15, [150, 150]], [45, [153, 153]], [75, [150, 150]], [90, [145, 145]]],
    )


def animation(state, config):
    duration = config["duration"]
    markers = []
    if state == "peek":
        markers = [
            {"tm": 0, "cm": "peek_enter", "dr": 15},
            {"tm": 15, "cm": "peek_loop", "dr": 60},
            {"tm": 75, "cm": "peek_exit", "dr": 15},
        ]
    return {
        "v": "5.12.2",
        "fr": 30,
        "ip": 0,
        "op": duration,
        "w": 512,
        "h": 512,
        "nm": f"AIMe {state} HD Hybrid Animation",
        "ddd": 0,
        "assets": [
            {"id": f"aime_{state}_image", "w": 512, "h": 512, "u": "images/", "p": f"aime_{state}.png", "e": 0},
            {"id": f"aime_{state}_character", "w": 512, "h": 512, "layers": [eyelid_layer(state, config), artwork_layer(state, duration)]},
        ],
        "layers": [
            {
                "ddd": 0,
                "ind": 1,
                "ty": 0,
                "nm": f"AIMe {state} HD Character",
                "refId": f"aime_{state}_character",
                "sr": 1,
                "ks": outer_transform(state),
                "ao": 0,
                "w": 512,
                "h": 512,
                "ip": 0,
                "op": duration,
                "st": 0,
                "bm": 0,
            }
        ],
        "markers": markers,
    }


for state, config in STATES.items():
    output_path = SOURCE_DIR / f"aime_{state}.json"
    output = json.dumps(animation(state, config), separators=(",", ":"), ensure_ascii=False) + "\n"
    if CHECK_ONLY:
        if output_path.read_text() != output:
            raise RuntimeError(f"Outdated AIMe HD source: {output_path}")
    else:
        output_path.write_text(output)

print("AIMe HD sources are current" if CHECK_ONLY else "AIMe HD sources generated")
