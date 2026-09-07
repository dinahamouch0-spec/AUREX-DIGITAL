#!/usr/bin/env python3
"""يحوّل مشاهد الأقسام إلى WebP بمقاسات متجاوبة.

الأصول 2-3 ميجا للصورة الواحدة، والمجموع 21 ميجا — لا يصح أن يصل هذا
إلى هاتف. تُقصّ إلى نسبة عريضة لأنها تُستخدم رأساً لصفحة، لا مربعاً.
"""
import os, glob
from PIL import Image

SRC = 'src/assets/img/groups'
WIDTHS = [(1600, ''), (900, '@900'), (500, '@500')]
RATIO = 21 / 9          # شريط عريض لرأس الصفحة

def main():
    total_in = total_out = 0
    for f in sorted(glob.glob(f'{SRC}/*.png')):
        stem = os.path.basename(f).rsplit('.', 1)[0]
        total_in += os.path.getsize(f)
        im = Image.open(f).convert('RGB')
        w, h = im.size
        # اقتطع من الوسط-الأعلى: المنتجات تجلس في النصف السفلي
        ch = int(w / RATIO)
        top = int(h * 0.42)
        top = min(top, h - ch)
        im = im.crop((0, top, w, top + ch))
        for width, suffix in WIDTHS:
            r = im.resize((width, int(width / RATIO)), Image.LANCZOS)
            out = f'{SRC}/{stem}{suffix}.webp'
            r.save(out, 'WEBP', quality=82, method=6)
            total_out += os.path.getsize(out)
        print(f'  ✓ {stem}')
    print(f'\n{total_in//1024//1024} MB → {total_out//1024} KB')

if __name__ == '__main__':
    main()
