import os
from PIL import Image, ImageDraw, ImageFont

# Re-use geometry
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

def draw_kd_mark(draw, cx, cy, size, fg_k=(255, 255, 255), fg_chev=(56, 189, 248)):
    scale = size / 690.0
    def t(p):
        return ((p[0] - 500) * scale + cx, (p[1] - 500) * scale + cy)

    k_scaled = [t(p) for p in K_POLY]
    bar_scaled = [
        t((BAR_RECT[0], BAR_RECT[1])),
        t((BAR_RECT[2], BAR_RECT[1])),
        t((BAR_RECT[2], BAR_RECT[3])),
        t((BAR_RECT[0], BAR_RECT[3]))
    ]
    chev_scaled = [t(p) for p in CHEV_POLY]

    draw.polygon(k_scaled, fill=fg_k)
    draw.polygon(bar_scaled, fill=fg_k)
    draw.polygon(chev_scaled, fill=fg_chev)

def create_phone_frame(w=420, h=860, bg_color=(7, 10, 16)):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Phone outer bezel
    draw.rounded_rectangle([0, 0, w - 1, h - 1], radius=44, fill=bg_color, outline=(30, 41, 59), width=2)
    # Dynamic Island / Camera notch
    draw.rounded_rectangle([w // 2 - 55, 14, w // 2 + 55, 38], radius=12, fill=(15, 23, 42))
    # Home indicator
    draw.rounded_rectangle([w // 2 - 60, h - 16, w // 2 + 60, h - 11], radius=3, fill=(100, 116, 139))
    return img, draw

# 1. Splash Screen Preview
def render_splash_preview(out_path):
    w, h = 420, 860
    img, draw = create_phone_frame(w, h, (7, 10, 16))
    cx, cy = w // 2, int(h * 0.42)

    # Ambient glow
    for r in range(160, 0, -6):
        alpha = int(24 * (1.0 - r / 160) ** 2)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(37, 99, 235, alpha))

    # Logo Card
    card_w = 90
    draw.rounded_rectangle([cx - card_w//2, cy - card_w//2, cx + card_w//2, cy + card_w//2], radius=24, fill=(15, 23, 42), outline=(56, 189, 248, 80), width=1)
    draw_kd_mark(draw, cx, cy, size=52)

    # Title
    draw.text((cx, cy + 72), "KioskDrop", fill=(255, 255, 255), anchor="mm")
    
    # Badge
    bw, bh = 150, 24
    by = cy + 104
    draw.rounded_rectangle([cx - bw//2, by, cx + bw//2, by + bh], radius=12, fill=(37, 99, 235, 36), outline=(56, 189, 248, 80), width=1)
    draw.ellipse([cx - bw//2 + 10, by + bh//2 - 3, cx - bw//2 + 16, by + bh//2 + 3], fill=(16, 185, 129))
    draw.text((cx + 6, by + bh//2), "ENTERPRISE VAULT", fill=(96, 165, 250), anchor="mm")

    # Diagnostic logs
    draw.text((cx, cy + 160), "Syncing Smart Locker SSE Bus...", fill=(148, 163, 184), anchor="mm")

    # Progress bar
    pw = 140
    py = cy + 185
    draw.rounded_rectangle([cx - pw//2, py, cx + pw//2, py + 3], radius=2, fill=(30, 41, 59))
    draw.rounded_rectangle([cx - pw//2, py, cx - pw//2 + int(pw * 0.65), py + 3], radius=2, fill=(56, 189, 248))

    # Footer
    draw.text((cx, h - 55), "AV / IT Zero-Trust Hardware Vault", fill=(100, 116, 139), anchor="mm")
    draw.text((cx, h - 38), "v1.0.1 • BLE & SSE Telemetry", fill=(71, 85, 105), anchor="mm")

    img.save(out_path, format="PNG")
    print(f"Saved: {out_path}")

# 2. Loading Screen Preview
def render_loading_preview(out_path):
    w, h = 420, 860
    img, draw = create_phone_frame(w, h, (7, 10, 16))
    cx, cy = w // 2, int(h * 0.44)

    # Semi-transparent overlay backdrop
    draw.rectangle([10, 45, w - 10, h - 25], fill=(7, 10, 16, 230))

    # Outer radar ring
    for r in [90, 72]:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(56, 189, 248, 60), width=1)

    # Core emblem
    ew = 68
    draw.rounded_rectangle([cx - ew//2, cy - ew//2, cx + ew//2, cy + ew//2], radius=18, fill=(15, 21, 33), outline=(56, 189, 248, 120), width=1)
    draw_kd_mark(draw, cx, cy, size=38)

    # Subsystem code
    sw, sh = 170, 22
    sy = cy + 62
    draw.rounded_rectangle([cx - sw//2, sy, cx + sw//2, sy + sh], radius=11, fill=(37, 99, 235, 30), outline=(56, 189, 248, 60), width=1)
    draw.ellipse([cx - sw//2 + 10, sy + sh//2 - 3, cx - sw//2 + 16, sy + sh//2 + 3], fill=(16, 185, 129))
    draw.text((cx + 6, sy + sh//2), "IOT_SOLENOID_DISPATCH", fill=(96, 165, 250), anchor="mm")

    # Title & message
    draw.text((cx, cy + 110), "Unlocking Smart Locker...", fill=(248, 250, 252), anchor="mm")
    draw.text((cx, cy + 132), "Securing end-to-end hardware tunnel", fill=(139, 155, 180), anchor="mm")
    draw.text((cx, cy + 148), "Authorizing Bay Solenoid #4B...", fill=(139, 155, 180), anchor="mm")

    # Cancel button
    cbw, cbh = 120, 32
    cby = cy + 195
    draw.rounded_rectangle([cx - cbw//2, cby, cx + cbw//2, cby + cbh], radius=10, fill=(23, 32, 48), outline=(51, 65, 85), width=1)
    draw.text((cx, cby + cbh//2), "Cancel Operation", fill=(148, 163, 184), anchor="mm")

    img.save(out_path, format="PNG")
    print(f"Saved: {out_path}")

# 3. Skeleton Loading Preview
def render_skeleton_preview(out_path):
    w, h = 420, 860
    img, draw = create_phone_frame(w, h, (7, 10, 16))

    # Header bar
    draw.rectangle([16, 52, w - 16, 92], fill=(15, 21, 33), outline=(30, 41, 59), width=1)
    draw.rounded_rectangle([28, 62, 54, 82], radius=6, fill=(37, 99, 235, 120))
    draw.rounded_rectangle([62, 65, 140, 75], radius=4, fill=(51, 65, 85))
    draw.rounded_rectangle([62, 79, 110, 85], radius=3, fill=(30, 41, 59))

    # Live Sync badge skeleton
    draw.rounded_rectangle([w - 95, 66, w - 28, 80], radius=7, fill=(37, 99, 235, 40))

    # 2 Stat cards
    card_y = 110
    cw = (w - 32 - 12) // 2
    for i in range(2):
        x1 = 16 + i * (cw + 12)
        draw.rounded_rectangle([x1, card_y, x1 + cw, card_y + 90], radius=16, fill=(15, 21, 33), outline=(30, 41, 59), width=1)
        draw.rounded_rectangle([x1 + 14, card_y + 14, x1 + 65, card_y + 24], radius=4, fill=(51, 65, 85))
        draw.rounded_rectangle([x1 + 14, card_y + 40, x1 + 55, card_y + 64], radius=6, fill=(71, 85, 105))
        draw.rounded_rectangle([x1 + 14, card_y + 72, x1 + 85, card_y + 80], radius=3, fill=(30, 41, 59))

    # 3 Locker Bay Skeletons
    locker_y = 220
    for i in range(3):
        ly = locker_y + i * 110
        draw.rounded_rectangle([16, ly, w - 16, ly + 96], radius=16, fill=(15, 21, 33), outline=(30, 41, 59), width=1)
        # Bay icon
        draw.rounded_rectangle([28, ly + 14, 60, ly + 46], radius=8, fill=(37, 99, 235, 60))
        # Title & Sub
        draw.rounded_rectangle([70, ly + 18, 170, ly + 30], radius=4, fill=(71, 85, 105))
        draw.rounded_rectangle([70, ly + 36, 130, ly + 44], radius=3, fill=(51, 65, 85))
        # Status pill
        draw.rounded_rectangle([w - 95, ly + 18, w - 28, ly + 36], radius=9, fill=(51, 65, 85))
        # Bar lines
        draw.rounded_rectangle([28, ly + 62, w - 28, ly + 72], radius=4, fill=(30, 41, 59))
        draw.rounded_rectangle([28, ly + 78, int((w - 28) * 0.65), ly + 86], radius=3, fill=(30, 41, 59))

    img.save(out_path, format="PNG")
    print(f"Saved: {out_path}")

def main():
    art_dir = "C:/Users/agshu/.gemini/antigravity/brain/9d847b3f-df17-4bf3-ad83-a77cffcc6a27"
    os.makedirs(art_dir, exist_ok=True)
    render_splash_preview(os.path.join(art_dir, "preview-splash-screen.png"))
    render_loading_preview(os.path.join(art_dir, "preview-loading-screen.png"))
    render_skeleton_preview(os.path.join(art_dir, "preview-skeleton-screen.png"))

if __name__ == "__main__":
    main()

