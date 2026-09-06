#!/usr/bin/env python3
"""Regenerate the shipped image variants from the source assets.

    pip install Pillow && python3 scripts/build-images.py

Reads  src/assets/img/{logo-src.jpg, asset-{stories,stickers,notebooks}-src.png}
Writes src/assets/img/out/  (the only images the build ships)

The promotional assets are approved marketing material: they are resized but
never cropped, recomposed or re-lettered, and quality is kept high enough to
showcase print work.
"""
from PIL import Image, ImageDraw
import os

SRC, OUT = 'src/assets/img', 'src/assets/img/out'
WIDTHS = (480, 768, 1100, 1536)
os.makedirs(OUT, exist_ok=True)

# --- logo: circular crop with transparent corners -------------------------
im = Image.open(f'{SRC}/logo-src.jpg').convert('RGB')
w, h = im.size
px = im.load()

# Find the white disc: scan the centre column for the first/last light row.
col = w // 2
rows = [y for y in range(h) if max(px[col, y]) > 90]
top, bottom = rows[0], rows[-1]
cx, cy = w // 2, (top + bottom) // 2
r = min(cx, (bottom - top) // 2)

mark = im.crop((cx - r, cy - r, cx + r, cy + r)).convert('RGBA')
size = mark.size[0]
mask = Image.new('L', (size, size), 0)
ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
mark.putalpha(mask)

for s in (512, 256, 128, 96, 64, 48):
    mark.resize((s, s), Image.LANCZOS).save(f'{OUT}/logo-mark-{s}.png', optimize=True)
mark.resize((180, 180), Image.LANCZOS).save(f'{OUT}/apple-touch-icon.png', optimize=True)
mark.resize((32, 32), Image.LANCZOS).save(f'{OUT}/favicon-32.png', optimize=True)
mark.resize((64, 64), Image.LANCZOS).save(f'{OUT}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
print(f'logo: disc {2*r}px -> 8 variants')

# --- promotional assets: responsive WebP + JPEG fallback ------------------
for name in ('stories', 'stickers', 'notebooks'):
    src = Image.open(f'{SRC}/asset-{name}-src.png').convert('RGB')
    for wpx in WIDTHS:
        src.resize((wpx, round(src.height * wpx / src.width)), Image.LANCZOS) \
           .save(f'{OUT}/{name}-{wpx}.webp', 'WEBP', quality=88, method=6)
    src.resize((1100, round(src.height * 1100 / src.width)), Image.LANCZOS) \
       .save(f'{OUT}/{name}-1100.jpg', 'JPEG', quality=86, optimize=True, progressive=True)
    print(f'{name}: {src.size[0]}x{src.size[1]} -> {len(WIDTHS)} webp + jpeg fallback')
