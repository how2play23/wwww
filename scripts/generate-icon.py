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

root = Path(__file__).resolve().parent.parent
assets = root / 'assets'
assets.mkdir(parents=True, exist_ok=True)

png_path = assets / 'icon.png'
img.save(png_path)
print(f'PNG saved to {png_path}')

ico_path = assets / 'icon.ico'
img.save(ico_path, format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
print(f'ICO saved to {ico_path}')
