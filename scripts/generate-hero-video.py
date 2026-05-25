"""
Generate an ambient hero video for CVICC — slowly drifting aurora/gradient blobs in navy/gold brand colors.
Output: public/hero-ambient.mp4, ~12 seconds, 1920x1080, seamless-loop-friendly.
"""
import numpy as np
import imageio.v3 as iio
from PIL import Image, ImageDraw, ImageFilter
import math
import os
import subprocess

W, H = 1920, 1080
FPS = 30
DURATION = 12  # seconds
TOTAL_FRAMES = FPS * DURATION

# Brand colors (RGB)
NAVY_DEEP = (8, 24, 48)
NAVY_MID = (15, 36, 71)
NAVY_LIGHT = (27, 58, 107)
GOLD_DIM = (120, 96, 8)
GOLD_MID = (184, 150, 12)
GOLD_BRIGHT = (212, 172, 42)

def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))

def draw_radial_blob(draw, cx, cy, radius, color, alpha_max=0.35):
    """Draw a soft radial gradient blob."""
    for r in range(int(radius), 0, -2):
        t = r / radius
        alpha = int(alpha_max * 255 * (1 - t * t))
        fill = (*color, alpha)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill)

def generate_frame(frame_idx):
    t = frame_idx / TOTAL_FRAMES  # 0..1 over full loop
    angle = t * 2 * math.pi

    # Base navy gradient
    img = Image.new('RGBA', (W, H), (*NAVY_DEEP, 255))

    # Create overlay for blobs
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Blob 1: Large navy-blue, top-left, slow drift
    bx1 = W * 0.25 + math.sin(angle) * W * 0.08
    by1 = H * 0.3 + math.cos(angle * 0.7) * H * 0.06
    draw_radial_blob(draw, bx1, by1, W * 0.35, NAVY_LIGHT, 0.4)

    # Blob 2: Gold, bottom-right, counter-drift
    bx2 = W * 0.72 + math.sin(angle * 0.6 + 1.2) * W * 0.1
    by2 = H * 0.65 + math.cos(angle * 0.8 + 0.5) * H * 0.08
    draw_radial_blob(draw, bx2, by2, W * 0.28, GOLD_DIM, 0.25)

    # Blob 3: Small warm gold accent, center-ish, figure-8
    bx3 = W * 0.5 + math.sin(angle * 1.3) * W * 0.12
    by3 = H * 0.4 + math.sin(angle * 0.9 + 2.0) * H * 0.1
    draw_radial_blob(draw, bx3, by3, W * 0.18, GOLD_MID, 0.15)

    # Blob 4: Deep navy accent, bottom-left
    bx4 = W * 0.15 + math.cos(angle * 0.5 + 3.0) * W * 0.06
    by4 = H * 0.8 + math.sin(angle * 0.7 + 1.5) * H * 0.05
    draw_radial_blob(draw, bx4, by4, W * 0.22, NAVY_MID, 0.3)

    # Blob 5: Subtle bright gold, top-right
    bx5 = W * 0.85 + math.sin(angle * 0.4 + 4.0) * W * 0.05
    by5 = H * 0.2 + math.cos(angle * 0.6 + 2.5) * H * 0.04
    draw_radial_blob(draw, bx5, by5, W * 0.15, GOLD_BRIGHT, 0.08)

    # Apply heavy blur for softness
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=80))

    # Composite
    img = Image.alpha_composite(img, overlay)

    # Subtle vignette
    vignette = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vignette)
    for i in range(40):
        t_v = i / 40
        alpha = int(90 * t_v * t_v)
        margin = int((1 - t_v) * min(W, H) * 0.5)
        vdraw.rectangle([margin, margin, W - margin, H - margin], outline=(0, 0, 0, alpha))
    vignette = vignette.filter(ImageFilter.GaussianBlur(radius=30))
    img = Image.alpha_composite(img, vignette)

    return np.array(img.convert('RGB'))

print("Generating hero video frames...")
frames = []
for i in range(TOTAL_FRAMES):
    if i % 30 == 0:
        print(f"  Frame {i}/{TOTAL_FRAMES}")
    frames.append(generate_frame(i))

output_path = os.path.join(os.getcwd(), "public", "hero-ambient.mp4")
print(f"Writing video to {output_path}...")

# Use imageio-ffmpeg writer
writer = iio.imopen(output_path, "w", plugin="pyav")
writer.write(
    np.stack(frames),
    codec="libx264",
    fps=FPS,
    is_batch=True,
)
writer.close()

file_size = os.path.getsize(output_path)
print(f"Done! Video: {output_path} ({file_size / 1024 / 1024:.1f} MB)")
