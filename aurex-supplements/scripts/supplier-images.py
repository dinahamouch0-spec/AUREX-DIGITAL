#!/usr/bin/env python3
"""يضغط صور المورّد إلى WebP بمقاسين.

الأصول من Shopify بأحجامها الكاملة (103 ميجا). تُعرض عندنا بحد أقصى
~600px في صفحة المنتج و~250px في الشبكة، فلا معنى لشحن الأصل.
"""
import os, glob
from PIL import Image, ImageOps

SRC = 'src/assets/img/supplier'
SIZES = [(700, ''), (350, '@350')]

def main():
    before = after = 0
    files = sorted(glob.glob(f'{SRC}/*.*'))
    files = [f for f in files if not f.endswith('.webp')]
    for i, f in enumerate(files, 1):
        stem = os.path.basename(f).rsplit('.', 1)[0]
        before += os.path.getsize(f)
        try:
            im = Image.open(f)
            im = ImageOps.exif_transpose(im).convert('RGB')
        except Exception as e:
            print(f'  ✗ {stem}: {e}'); continue
        for px, suffix in SIZES:
            r = ImageOps.contain(im, (px, px), Image.LANCZOS)
            out = f'{SRC}/{stem}{suffix}.webp'
            r.save(out, 'WEBP', quality=80, method=5)
            after += os.path.getsize(out)
        os.remove(f)
        if i % 100 == 0: print(f'  {i}/{len(files)}')
    print(f'\n{before//1024//1024} MB → {after//1024//1024} MB  ({len(files)} images)')

if __name__ == '__main__':
    main()
