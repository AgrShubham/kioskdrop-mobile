import os
from PIL import Image, ImageDraw

K_POLY = [
    (155, 323), (224, 323),
    (224, 475),
    (376, 323), (472, 323),
    (298, 497), (298, 503),
    (472, 677), (376, 677),
    (224, 525),
    (224, 677), (155, 677)
]
BAR_RECT = (500, 323, 569, 677)
CHEV_POLY = [
    (597, 323), (688, 323),
    (845, 500),
    (688, 677), (597, 677),
    (754, 500)
]

def render_kd(size, bg_color=None, rounded_pct=0.22, padding_pct=0.18, fg_k=(255, 255, 255), fg_chev=(56, 189, 248)):
    scale = 4
    cs = size * scale
    img = Image.new("RGBA", (cs, cs), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if bg_color:
        rx = int(cs * rounded_pct)
        draw.rounded_rectangle([0, 0, cs - 1, cs - 1], radius=rx, fill=bg_color)
        draw.rounded_rectangle([2, 2, cs - 3, cs - 3], radius=rx, outline=(30, 41, 59, 255), width=int(2 * scale))

    avail = cs * (1.0 - 2 * padding_pct)
    mark_scale = avail / 690.0

    def t(p):
        return ((p[0] - 500) * mark_scale + cs / 2.0, (p[1] - 500) * mark_scale + cs / 2.0)

    draw.polygon([t(p) for p in K_POLY], fill=fg_k)
    draw.polygon([t((BAR_RECT[0], BAR_RECT[1])), t((BAR_RECT[2], BAR_RECT[1])), t((BAR_RECT[2], BAR_RECT[3])), t((BAR_RECT[0], BAR_RECT[3]))], fill=fg_k)
    draw.polygon([t(p) for p in CHEV_POLY], fill=fg_chev)

    return img.resize((size, size), Image.Resampling.LANCZOS)

def update_res():
    base_res = "mobile/android/app/src/main/res"
    densities = {
        "mdpi": (48, 108, 320),
        "hdpi": (72, 162, 480),
        "xhdpi": (96, 216, 640),
        "xxhdpi": (144, 324, 960),
        "xxxhdpi": (192, 432, 1280),
    }

    bg_dark = (10, 14, 23, 255)

    for dens, (icon_sz, fg_sz, splash_sz) in densities.items():
        mipmap_dir = os.path.join(base_res, f"mipmap-{dens}")
        drawable_dir = os.path.join(base_res, f"drawable-{dens}")

        if os.path.exists(mipmap_dir):
            # Square icon (webp)
            sq = render_kd(icon_sz, bg_color=bg_dark, rounded_pct=0.22, padding_pct=0.18)
            sq.save(os.path.join(mipmap_dir, "ic_launcher.webp"), format="WEBP")

            # Round icon (webp)
            rd = render_kd(icon_sz, bg_color=bg_dark, rounded_pct=0.5, padding_pct=0.22)
            rd.save(os.path.join(mipmap_dir, "ic_launcher_round.webp"), format="WEBP")

            # Foreground adaptive icon (webp)
            fg = render_kd(fg_sz, bg_color=None, padding_pct=0.28)
            fg.save(os.path.join(mipmap_dir, "ic_launcher_foreground.webp"), format="WEBP")

            # Monochrome adaptive icon (webp)
            mono = render_kd(fg_sz, bg_color=None, fg_k=(255, 255, 255, 255), fg_chev=(255, 255, 255, 255), padding_pct=0.28)
            mono.save(os.path.join(mipmap_dir, "ic_launcher_monochrome.webp"), format="WEBP")

        if os.path.exists(drawable_dir):
            # Splash screen image (png)
            sp = render_kd(splash_sz // 2, bg_color=None, padding_pct=0.22)
            sp.save(os.path.join(drawable_dir, "splashscreen_image.png"), format="PNG")

    print("Native Android resources (mipmaps and drawables) updated successfully!")

if __name__ == '__main__':
    update_res()

