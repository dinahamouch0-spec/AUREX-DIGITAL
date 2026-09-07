#!/usr/bin/env python3
"""يفصل المنتج عن المشهد المركّب ويخرجه PNG شفاف.

الصور الواردة مشاهد كاملة: لوقو فوق، منتج في الوسط، منصّة تحت، وحلقات
ضوء حولها. GrabCut يفصل المنتج، ثم نقصّ المنصّة لأن الموقع يرسم أرضيته.
"""
import sys, os, glob
import cv2, numpy as np

OUT = 'src/assets/img/products'
SIZE = 2000          # مربع التصدير
PAD  = 0.07          # هامش حول المنتج

def cutout(path):
    img = cv2.imread(path)
    if img is None: return None, 'unreadable'
    h, w = img.shape[:2]

    # المنتج يقع دائماً في الوسط تحت اللوقو وفوق المنصّة
    rect = (int(w*.20), int(h*.30), int(w*.60), int(h*.55))

    mask = np.zeros((h, w), np.uint8)
    bgd, fgd = np.zeros((1,65), np.float64), np.zeros((1,65), np.float64)
    cv2.grabCut(img, mask, rect, bgd, fgd, 6, cv2.GC_INIT_WITH_RECT)
    m = np.where((mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    # أكبر مكوّن متصل = المنتج؛ يستبعد حلقات الضوء المتناثرة
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    if n < 2: return None, 'no object'
    big = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    m = np.where(lab == big, 255, 0).astype(np.uint8)

    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7,7), np.uint8))

    # حلقات الضوء والمثلث تلامس المنتج، فـGrabCut يضمّها إليه. الفتح بنواة
    # أكبر من سُمكها يمحوها ويُبقي الجسم الصلب، ثم نستعيد الحافة الحادة
    # بتقاطع النتيجة الموسّعة مع القناع الأصلي.
    k = int(min(h, w) * 0.045) | 1
    body = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    n2, lab2, st2, _ = cv2.connectedComponentsWithStats(body, 8)
    if n2 > 1:
        body = np.where(lab2 == 1 + np.argmax(st2[1:, cv2.CC_STAT_AREA]), 255, 0).astype(np.uint8)
        grown = cv2.dilate(body, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
        m = cv2.bitwise_and(m, grown)

    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5,5), np.uint8))
    m = cv2.GaussianBlur(m, (5,5), 0)            # حافة ناعمة بدل حافة مسنّنة

    ys, xs = np.where(m > 30)
    if len(xs) == 0: return None, 'empty mask'
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()

    rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    rgba[:, :, 3] = m
    crop = rgba[y0:y1+1, x0:x1+1]

    # ضعه في مربّع بهامش متساوٍ — يبقي المقاسات النسبية بين المنتجات
    ch, cw = crop.shape[:2]
    side = int(max(ch, cw) * (1 + PAD*2))
    canvas = np.zeros((side, side, 4), np.uint8)
    oy, ox = (side-ch)//2, (side-cw)//2
    canvas[oy:oy+ch, ox:ox+cw] = crop
    out = cv2.resize(canvas, (SIZE, SIZE), interpolation=cv2.INTER_LANCZOS4)
    return out, f'{cw}x{ch} → {SIZE}'

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    files = sorted(glob.glob('src/assets/img/products/_incoming/*.jpg'))
    for f in files:
        name = os.path.basename(f).replace('.jpg', '.png')
        img, note = cutout(f)
        if img is None:
            print(f'  ✗ {name:34} {note}'); continue
        cv2.imwrite(os.path.join(OUT, name), img, [cv2.IMWRITE_PNG_COMPRESSION, 6])
        cov = (img[:,:,3] > 30).mean() * 100
        print(f'  ✓ {name:34} {note}   تغطية {cov:.0f}%')
