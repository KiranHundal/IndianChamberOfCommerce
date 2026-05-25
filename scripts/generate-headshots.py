"""
Generate professional placeholder headshot images for board members.
Creates gradient-background circular portraits with styled initials.
Output: public/headshots/<slug>.jpg
"""
from PIL import Image, ImageDraw, ImageFont
import os, math

W, H = 600, 600

# Board members: (name, slug, gradient_colors)
# Each gets a unique gradient from the brand palette
MEMBERS = [
    ("Harpreet Singh", "harpreet-singh", [(15, 36, 71), (37, 77, 140)]),
    ("Anil Varma", "anil-varma", [(27, 58, 107), (58, 106, 175)]),
    ("Gurpreet Kaur", "gurpreet-kaur", [(120, 96, 8), (184, 150, 12)]),
    ("Kiran Shah", "kiran-shah", [(15, 36, 71), (120, 96, 8)]),
    ("Ramesh Kulkarni", "ramesh-kulkarni", [(37, 77, 140), (27, 58, 107)]),
    ("Sunita Rao", "sunita-rao", [(58, 106, 175), (15, 36, 71)]),
    ("Deepak Nair", "deepak-nair", [(27, 58, 107), (37, 77, 140)]),
    ("Pooja Agarwal", "pooja-agarwal", [(120, 96, 8), (27, 58, 107)]),
    ("Sanjay Bhatt", "sanjay-bhatt", [(15, 36, 71), (58, 106, 175)]),
]

def get_initials(name):
    parts = name.split()
    return parts[0][0] + parts[-1][0]

def lerp(a, b, t):
    return int(a + (b - a) * t)

def lerp_color(c1, c2, t):
    return tuple(lerp(c1[i], c2[i], t) for i in range(3))

def create_headshot(name, slug, colors):
    img = Image.new('RGB', (W, H))
    draw = ImageDraw.Draw(img)
    c1, c2 = colors

    # Diagonal gradient background
    for y in range(H):
        for x in range(W):
            t = (x / W * 0.5 + y / H * 0.5)
            color = lerp_color(c1, c2, t)
            draw.point((x, y), fill=color)

    # Subtle radial lighter center for depth
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    cx, cy = W // 2, H // 2 - 20
    for r in range(180, 0, -1):
        t = r / 180
        alpha = int(35 * (1 - t))
        odraw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255, alpha))
    img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
    draw = ImageDraw.Draw(img)

    # Initials - use a large built-in font
    initials = get_initials(name)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 160)
    except:
        font = ImageFont.load_default()

    # Center text
    bbox = draw.textbbox((0, 0), initials, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (W - tw) // 2
    ty = (H - th) // 2 - 20

    # Text shadow
    draw.text((tx + 3, ty + 3), initials, fill=(0, 0, 0, ), font=font)
    # Main text
    draw.text((tx, ty), initials, fill=(255, 255, 255), font=font)

    # Subtle border ring
    ring = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    rdraw = ImageDraw.Draw(ring)
    for i in range(3):
        rdraw.ellipse([20 + i, 20 + i, W - 20 - i, H - 20 - i], outline=(255, 255, 255, 30))
    img = Image.alpha_composite(img.convert('RGBA'), ring).convert('RGB')

    return img

# Create output directory
out_dir = os.path.join(os.getcwd(), "public", "headshots")
os.makedirs(out_dir, exist_ok=True)

for name, slug, colors in MEMBERS:
    img = create_headshot(name, slug, colors)
    path = os.path.join(out_dir, f"{slug}.jpg")
    img.save(path, "JPEG", quality=90)
    print(f"  Created {path}")

print(f"\nDone! Generated {len(MEMBERS)} headshots in {out_dir}")
