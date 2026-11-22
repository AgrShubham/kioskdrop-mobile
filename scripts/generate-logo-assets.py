import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

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

def make_svg_icon(fill="currentColor", bg=None):
    bg_tag = f'<rect width="1000" height="1000" fill="{bg}" />' if bg else ""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="{fill}">
  {bg_tag}
  <!-- KioskDrop KD Monogram -->
  <path d="M 155,323 L 224,323 L 224,475 L 376,323 L 472,323 L 298,497 L 298,503 L 472,677 L 376,677 L 224,525 L 224,677 L 155,677 Z" />
  <rect x="500" y="323" width="69" height="354" />
  <path d="M 597,323 L 688,323 L 845,500 L 688,677 L 597,677 L 754,500 Z" />
</svg>'''

def make_svg_brand_icon():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  <defs>
    <linearGradient id="kd-cyan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="50%" stop-color="#2563EB" />
      <stop offset="100%" stop-color="#06B6D4" />
    </linearGradient>
    <linearGradient id="kd-stem-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>
    <filter id="kd-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="18" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="1000" height="1000" rx="220" fill="#0A0E17" />
  <rect width="996" height="996" x="2" y="2" rx="218" fill="none" stroke="#1E293B" stroke-width="4" />
  <path d="M 155,323 L 224,323 L 224,475 L 376,323 L 472,323 L 298,497 L 298,503 L 472,677 L 376,677 L 224,525 L 224,677 L 155,677 Z" fill="url(#kd-stem-grad)" />
  <rect x="500" y="323" width="69" height="354" fill="url(#kd-stem-grad)" />
  <path d="M 597,323 L 688,323 L 845,500 L 688,677 L 597,677 L 754,500 Z" fill="url(#kd-cyan-grad)" filter="url(#kd-glow)" />
</svg>'''

def make_svg_horizontal_logo(theme="dark"):
    is_dark = theme == "dark"
    mark_fill = "#FFFFFF" if is_dark else "#090D16"
    text_main = "#FFFFFF" if is_dark else "#0F172A"
    badge_bg = "rgba(37,99,235,0.15)" if is_dark else "rgba(37,99,235,0.08)"
    badge_border = "rgba(56,189,248,0.3)" if is_dark else "rgba(37,99,235,0.2)"
    badge_text = "#38BDF8" if is_dark else "#2563EB"
    accent_fill = "url(#kd-h-cyan)"

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 360" fill="none">
  <defs>
    <linearGradient id="kd-h-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#2563EB" />
    </linearGradient>
  </defs>
  <g transform="translate(40, 20) scale(0.85)">
    <g transform="translate(-130, -290)">
      <path d="M 155,323 L 224,323 L 224,475 L 376,323 L 472,323 L 298,497 L 298,503 L 472,677 L 376,677 L 224,525 L 224,677 L 155,677 Z" fill="{mark_fill}" />
      <rect x="500" y="323" width="69" height="354" fill="{mark_fill}" />
      <path d="M 597,323 L 688,323 L 845,500 L 688,677 L 597,677 L 754,500 Z" fill="{accent_fill}" />
    </g>
  </g>
  <text x="680" y="195" font-family="system-ui, -apple-system, 'Inter', 'Segoe UI', Roboto, sans-serif" font-size="108" font-weight="800" letter-spacing="-2" fill="{text_main}">KioskDrop</text>
  <g transform="translate(685, 230)">
    <rect width="215" height="48" rx="10" fill="{badge_bg}" stroke="{badge_border}" stroke-width="1.5" />
    <text x="107.5" y="32" font-family="system-ui, -apple-system, 'Inter', 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="700" letter-spacing="2.5" fill="{badge_text}" text-anchor="middle">ENTERPRISE</text>
  </g>
</svg>'''

def render_raster_icon(size, bg_color=(10, 14, 23), fg_k=(255, 255, 255), fg_chev=None, rounded_pct=0.22, padding_pct=0.15):
    scale = 4
    canvas_size = size * scale
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if bg_color:
        rx = int(canvas_size * rounded_pct)
        draw.rounded_rectangle([0, 0, canvas_size - 1, canvas_size - 1], radius=rx, fill=bg_color)
        rim_color = (30, 41, 59, 255)
        draw.rounded_rectangle([2, 2, canvas_size - 3, canvas_size - 3], radius=rx, outline=rim_color, width=int(2 * scale))

    avail = canvas_size * (1.0 - 2 * padding_pct)
    mark_scale = avail / 690.0

    def transform_pt(p):
        x = (p[0] - 500) * mark_scale + canvas_size / 2.0
        y = (p[1] - 500) * mark_scale + canvas_size / 2.0
        return (x, y)

    k_scaled = [transform_pt(p) for p in K_POLY]
    bar_scaled = [
        transform_pt((BAR_RECT[0], BAR_RECT[1])),
        transform_pt((BAR_RECT[2], BAR_RECT[1])),
        transform_pt((BAR_RECT[2], BAR_RECT[3])),
        transform_pt((BAR_RECT[0], BAR_RECT[3]))
    ]
    chev_scaled = [transform_pt(p) for p in CHEV_POLY]

    draw.polygon(k_scaled, fill=fg_k)
    draw.polygon(bar_scaled, fill=fg_k)

    if fg_chev:
        draw.polygon(chev_scaled, fill=fg_chev)
    else:
        draw.polygon(chev_scaled, fill=(56, 189, 248, 255))

    return img.resize((size, size), Image.Resampling.LANCZOS)

def render_splash_screen(width=1080, height=2160, bg_color=(7, 10, 16)):
    """Render a dedicated enterprise splash screen with glowing mark and logotype."""
    scale = 2
    cw = width * scale
    ch = height * scale
    img = Image.new("RGBA", (cw, ch), (*bg_color, 255))
    draw = ImageDraw.Draw(img)

    # 1. Subtle Radial Glow behind logo
    center_x = cw // 2
    center_y = int(ch * 0.44)
    glow_radius = int(320 * scale)

    # Simple circular gradient
    for r in range(glow_radius, 0, -8):
        alpha = int(28 * (1.0 - r / glow_radius) ** 2)
        draw.ellipse(
            [center_x - r, center_y - r, center_x + r, center_y + r],
            fill=(37, 99, 235, alpha)
        )

    # 2. Draw KD Monogram
    mark_w = int(240 * scale)
    mark_scale = mark_w / 690.0

    def t_pt(p):
        x = (p[0] - 500) * mark_scale + center_x
        y = (p[1] - 500) * mark_scale + center_y
        return (x, y)

    k_pts = [t_pt(p) for p in K_POLY]
    bar_pts = [
        t_pt((BAR_RECT[0], BAR_RECT[1])),
        t_pt((BAR_RECT[2], BAR_RECT[1])),
        t_pt((BAR_RECT[2], BAR_RECT[3])),
        t_pt((BAR_RECT[0], BAR_RECT[3]))
    ]
    chev_pts = [t_pt(p) for p in CHEV_POLY]

    draw.polygon(k_pts, fill=(255, 255, 255, 255))
    draw.polygon(bar_pts, fill=(255, 255, 255, 255))
    draw.polygon(chev_pts, fill=(56, 189, 248, 255))

    # 3. Logotype lines (simulated crisp shapes/rectangles for high-res typography)
    # Brand: KIOSKDROP
    text_y = int(ch * 0.55)
    # Sub-badge at text_y + 80
    badge_w = int(180 * scale)
    badge_h = int(34 * scale)
    bx1 = center_x - badge_w // 2
    by1 = text_y + int(45 * scale)
    draw.rounded_rectangle([bx1, by1, bx1 + badge_w, by1 + badge_h], radius=int(8 * scale), fill=(37, 99, 235, 45), outline=(56, 189, 248, 120), width=int(1.5 * scale))

    # 4. Footer Telemetry status line
    foot_y = int(ch * 0.88)
    line_w = int(120 * scale)
    draw.rounded_rectangle([center_x - line_w // 2, foot_y, center_x + line_w // 2, foot_y + int(3 * scale)], radius=int(2 * scale), fill=(30, 41, 59, 255))
    # Active indicator dot
    dot_r = int(4 * scale)
    draw.ellipse([center_x - int(70 * scale) - dot_r, foot_y - dot_r + int(1.5 * scale), center_x - int(70 * scale) + dot_r, foot_y + dot_r + int(1.5 * scale)], fill=(16, 185, 129, 255))

    return img.resize((width, height), Image.Resampling.LANCZOS)

def main():
    os.makedirs('public', exist_ok=True)
    os.makedirs('mobile/assets', exist_ok=True)

    print("Generating Vector SVG Assets in /public...")
    with open('public/logo-icon.svg', 'w', encoding='utf-8') as f:
        f.write(make_svg_icon(fill="currentColor"))
    with open('public/logo-icon-dark.svg', 'w', encoding='utf-8') as f:
        f.write(make_svg_icon(fill="#FFFFFF"))
    with open('public/logo-icon-light.svg', 'w', encoding='utf-8') as f:
        f.write(make_svg_icon(fill="#0A0E17"))
    with open('public/logo-icon-brand.svg', 'w', encoding='utf-8') as f:
        f.write(make_svg_brand_icon())
    with open('public/logo-horizontal-dark.svg', 'w', encoding='utf-8') as f:
        f.write(make_svg_horizontal_logo(theme="dark"))
    with open('public/logo-horizontal-light.svg', 'w', encoding='utf-8') as f:
        f.write(make_svg_horizontal_logo(theme="light"))
    with open('public/favicon.svg', 'w', encoding='utf-8') as f:
        f.write(make_svg_brand_icon())

    print("Generating Mobile & Web Raster Assets...")
    icon_1024 = render_raster_icon(1024, bg_color=(10, 14, 23, 255), rounded_pct=0.22, padding_pct=0.18)
    icon_1024.convert("RGB").save('mobile/assets/icon.png', format="PNG")
    icon_1024.save('public/icon-1024.png', format="PNG")

    fg_512 = render_raster_icon(512, bg_color=None, fg_chev=(56, 189, 248, 255), padding_pct=0.28)
    fg_512.save('mobile/assets/android-icon-foreground.png', format="PNG")

    bg_512 = Image.new("RGBA", (512, 512), (7, 10, 16, 255))
    bg_512.save('mobile/assets/android-icon-background.png', format="PNG")

    mono_432 = render_raster_icon(432, bg_color=None, fg_k=(255, 255, 255, 255), fg_chev=(255, 255, 255, 255), padding_pct=0.28)
    mono_432.save('mobile/assets/android-icon-monochrome.png', format="PNG")

    # Native Expo Splash Screen: 1024x1024 centered for contain mode
    splash_icon = render_raster_icon(1024, bg_color=None, fg_chev=(56, 189, 248, 255), padding_pct=0.24)
    splash_icon.save('mobile/assets/splash-icon.png', format="PNG")

    # Full splash preview render
    splash_full = render_splash_screen(1080, 2160)
    splash_full.save('mobile/assets/splash-full-preview.png', format="PNG")

    fav_48 = render_raster_icon(48, bg_color=(10, 14, 23, 255), rounded_pct=0.22, padding_pct=0.15)
    fav_48.save('mobile/assets/favicon.png', format="PNG")
    fav_48.save('public/favicon.png', format="PNG")

    print("All logo, splash, and loading visual assets successfully generated!")

if __name__ == '__main__':
    main()
