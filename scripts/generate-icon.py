from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

size = 512
img = Image.new('RGBA', (size, size), (10, 10, 10, 255))
draw = ImageDraw.Draw(img)

for i in range(180, 0, -2):
    alpha = int(255 * (1 - i / 180) * 0.35)
    draw.ellipse([256 - i, 256 - i, 256 + i, 256 + i], fill=(52, 211, 153, alpha))

try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 220)
except OSError:
    font = ImageFont.load_default()

draw.text((256, 250), 'A', fill=(110, 231, 183, 255), font=font, anchor='mm')

out = Path(__file__).resolve().parent.parent / 'assets' / 'icon.png'
out.parent.mkdir(parents=True, exist_ok=True)
img.save(out)
print(f'Icon saved to {out}')
