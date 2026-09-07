#!/usr/bin/env python3
"""يحوّل مشاهد الأقسام إلى WebP بمقاسات متجاوبة.

الأصول 2-3 ميجا للصورة الواحدة، والمجموع 21 ميجا — لا يصح أن يصل هذا
إلى هاتف. تُقصّ إلى نسبة عريضة لأنها تُستخدم رأساً لصفحة، لا مربعاً.
"""
import os, glob
from PIL import Image

SRC = 'src/assets/img/groups'
# رأس الصفحة شريط عريض؛ خانة الرئيسية أقرب للمربّع. قصّتان مختلفتان من
# الأصل نفسه أفضل من قصّة واحدة تُجبَر على النسبتين وتقطع المنتجات.
WIDTHS = [(1600, ''), (900, '@900'), (500, '@500')]
RATIO = 21 / 9          # شريط عريض لرأس الصفحة
CARD_WIDTHS = [(640, '-card'), (360, '-card@360')]
CARD_RATIO = 4 / 3

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

        # قصّة الخانة: مركزها المنتجات، تحت اللوقو مباشرة
        full = Image.open(f).convert('RGB')
        fw, fh = full.size
        ch = int(fw / CARD_RATIO)
        top = min(int(fh * 0.34), fh - ch)
        card = full.crop((0, top, fw, top + ch))
        for width, suffix in CARD_WIDTHS:
            r = card.resize((width, int(width / CARD_RATIO)), Image.LANCZOS)
            out = f'{SRC}/{stem}{suffix}.webp'
            r.save(out, 'WEBP', quality=82, method=6)
            total_out += os.path.getsize(out)

        print(f'  ✓ {stem}')
    print(f'\n{total_in//1024//1024} MB → {total_out//1024} KB')

if __name__ == '__main__':
    main()
