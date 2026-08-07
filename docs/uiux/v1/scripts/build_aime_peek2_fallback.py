from pathlib import Path

from PIL import Image


root = Path(__file__).resolve().parent.parent
images = root / "assets" / "aime" / "images"
pet_path = images / "aime_peek.png"
output_path = images / "aime_peek2.png"
frame_path = images / "aime_peek2_frame.png"

if not frame_path.exists():
    source = Image.open(output_path).convert("RGBA")
    source.crop((334, 101, 368, 418)).save(frame_path)

pet = Image.open(pet_path).convert("RGBA")
frame = Image.open(frame_path).convert("RGBA")
canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))

scale = 1.32
pet = pet.resize((round(512 * scale), round(512 * scale)), Image.Resampling.LANCZOS)
canvas.alpha_composite(pet, (round(378 - 256 * scale), round(256 - 256 * scale)))

frame = frame.resize((30, 474), Image.Resampling.LANCZOS)
canvas.alpha_composite(frame, (482, 24))
canvas.save(output_path, optimize=True)

print("AIMe peek2 fallback generated")
