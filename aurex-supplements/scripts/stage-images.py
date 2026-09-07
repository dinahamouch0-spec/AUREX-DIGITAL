#!/usr/bin/env python3
"""يحضّر صور المنتجات المصوّرة للاستخدام على الموقع.

الصور مشاهد مركّبة بإضاءة وخلفية موحّدة — نفس عالم الموقع الداكن. بدل
محاولة انتزاع المنتج (تفشل مع المثلث الزجاجي خلفه)، نقصّ لوقو AUREX
المتكرر في الأعلى ونخفّف الحواف حتى تذوب الصورة في الصفحة.
"""
import os, glob
from PIL import Image, ImageDraw, ImageFilter

SRC = 'src/assets/img/products/_incoming'
OUT = 'src/assets/img/products'
TOP = 0.345         # ما فوقه لوقو مكرر في كل صورة
FADE = 0.085         # عرض التلاشي كنسبة من الضلع
SIZES = [(1000, ''), (500, '@500')]   # المصدر ~670px، فلا نبالغ في التكبير

def edge_mask(side, fade_px):
    """تلاشٍ ناعم من الحواف الأربع — يذيب الإطار دون قصّ المنتج."""
    m = Image.new('L', (side, side), 0)
    d = ImageDraw.Draw(m)
    d.rectangle([fade_px, fade_px, side - fade_px, side - fade_px], fill=255)
    return m.filter(ImageFilter.GaussianBlur(fade_px * 0.55))

def main():
    os.makedirs(OUT, exist_ok=True)
    files = sorted(glob.glob(f'{SRC}/*.jpg'))
    for f in files:
        stem = os.path.basename(f).rsplit('.', 1)[0]
        im = Image.open(f).convert('RGB')
        w, h = im.size

        # اقتطع اللوقو، ثم مربّع متمركز على المنتج
        top = int(h * TOP)
        side = min(w, h - top)
        left = (w - side) // 2
        im = im.crop((left, top, left + side, top + side))

        for px, suffix in SIZES:
            r = im.resize((px, px), Image.LANCZOS)
            r.putalpha(edge_mask(px, int(px * FADE)))
            r.save(f'{OUT}/{stem}{suffix}.webp', 'WEBP', quality=88, method=6)

        print(f'  ✓ {stem}')
    print(f'\n{len(files)} صورة × {len(SIZES)} مقاسات')

if __name__ == '__main__':
    main()
