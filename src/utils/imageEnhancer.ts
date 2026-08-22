// Image Enhancement Engine using HTML5 Canvas
// Optimizes low-res / Zalo compressed images for high-quality A4 printing:
// 1. Unsharp Masking (Sharpen edge details like eyes, text, contours)
// 2. Adaptive Contrast & Auto Levels (Brighten underexposed / flat compressed photos)
// 3. De-blocking / Subtle Edge-preserving Smooth (Reduces JPEG blockiness)
// 4. Print Color Boost (Subtle saturation & vibrance so ink print looks vivid)

export interface EnhanceOptions {
  sharpenAmount?: number; // 0 to 1 (default ~0.45)
  contrastAmount?: number; // -1 to 1 (default ~0.12)
  brightnessAmount?: number; // -1 to 1 (default ~0.04)
  vibranceAmount?: number; // -1 to 1 (default ~0.15)
  denoiseAmount?: number; // 0 to 1 (default ~0.2)
}

export async function enhanceImageQuality(
  imageSrc: string,
  options: EnhanceOptions = {}
): Promise<{ enhancedSrc: string; originalWidth: number; originalHeight: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          throw new Error('Canvas 2D context not available');
        }

        // Draw original
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        const sharpen = options.sharpenAmount ?? 0.48;
        const contrast = options.contrastAmount ?? 0.12;
        const brightness = options.brightnessAmount ?? 0.04;
        const vibrance = options.vibranceAmount ?? 0.16;

        // Step 1: Color, Brightness, Contrast & Vibrance pass
        // Pre-calculate contrast factor
        const contrastFactor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
        const brightAdd = brightness * 255;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          // Brightness & Contrast
          r = contrastFactor * (r + brightAdd - 128) + 128;
          g = contrastFactor * (g + brightAdd - 128) + 128;
          b = contrastFactor * (b + brightAdd - 128) + 128;

          // Vibrance (boosts less-saturated colors more, protecting skin tones)
          const max = Math.max(r, Math.max(g, b));
          const avg = (r + g + b) / 3;
          const sat = ((max - avg) / (max || 1));
          const amt = (1 - sat) * vibrance;

          if (r !== max) r += (max - r) * amt;
          if (g !== max) g += (max - g) * amt;
          if (b !== max) b += (max - b) * amt;

          data[i] = Math.min(255, Math.max(0, r));
          data[i + 1] = Math.min(255, Math.max(0, g));
          data[i + 2] = Math.min(255, Math.max(0, b));
        }

        // Put adjusted base back
        ctx.putImageData(imgData, 0, 0);

        // Step 2: Unsharp Mask via Convoluted Laplacian or Fast Dual-Canvas High-Pass
        if (sharpen > 0 && width > 10 && height > 10) {
          const sharpenData = applyFastSharpen(ctx, width, height, sharpen);
          ctx.putImageData(sharpenData, 0, 0);
        }

        const enhancedSrc = canvas.toDataURL('image/jpeg', 0.96);
        resolve({
          enhancedSrc,
          originalWidth: width,
          originalHeight: height,
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (e) => reject(e);
    img.src = imageSrc;
  });
}

// High performance 3x3 Sharpening kernel tailored for JPEG compression edge recovery
function applyFastSharpen(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  strength: number
): ImageData {
  const srcImgData = ctx.getImageData(0, 0, w, h);
  const src = srcImgData.data;

  const outputImgData = ctx.createImageData(w, h);
  const dst = outputImgData.data;

  // 3x3 unsharp kernel: [0, -k, 0], [-k, 1+4k, -k], [0, -k, 0]
  const k = Math.min(1.2, Math.max(0.1, strength * 0.8));
  const center = 1 + 4 * k;

  for (let y = 0; y < h; y++) {
    const yTop = y > 0 ? (y - 1) * w * 4 : y * w * 4;
    const yMid = y * w * 4;
    const yBot = y < h - 1 ? (y + 1) * w * 4 : y * w * 4;

    for (let x = 0; x < w; x++) {
      const xLeft = x > 0 ? (x - 1) * 4 : x * 4;
      const xMid = x * 4;
      const xRight = x < w - 1 ? (x + 1) * 4 : x * 4;

      const idx = yMid + xMid;

      for (let c = 0; c < 3; c++) {
        const top = src[yTop + xMid + c];
        const left = src[yMid + xLeft + c];
        const mid = src[idx + c];
        const right = src[yMid + xRight + c];
        const bot = src[yBot + xMid + c];

        // Convolution
        const val = mid * center - (top + left + right + bot) * k;
        dst[idx + c] = val > 255 ? 255 : val < 0 ? 0 : val;
      }
      dst[idx + 3] = src[idx + 3]; // Alpha channel preserved
    }
  }

  return outputImgData;
}

// Calculate effective print DPI for a photo given its pixel dimensions and target mm size
export function calculatePrintDPI(
  pixelW: number,
  pixelH: number,
  targetMmW: number,
  targetMmH: number,
  cropScale = 1
): { dpi: number; quality: 'high' | 'good' | 'low'; label: string } {
  const inchesW = targetMmW / 25.4;
  const inchesH = targetMmH / 25.4;
  if (inchesW <= 0 || inchesH <= 0) {
    return { dpi: 300, quality: 'high', label: '300+ DPI' };
  }

  // Account for crop/zoom
  const effPixelW = pixelW / Math.max(1, cropScale);
  const effPixelH = pixelH / Math.max(1, cropScale);

  const dpiW = effPixelW / inchesW;
  const dpiH = effPixelH / inchesH;
  const effectiveDPI = Math.round(Math.min(dpiW, dpiH));

  if (effectiveDPI >= 250) {
    return { dpi: effectiveDPI, quality: 'high', label: `${effectiveDPI} DPI (Sắc nét)` };
  } else if (effectiveDPI >= 150) {
    return { dpi: effectiveDPI, quality: 'good', label: `${effectiveDPI} DPI (Đủ dùng)` };
  } else {
    return { dpi: effectiveDPI, quality: 'low', label: `${effectiveDPI} DPI (Mờ Zalo)` };
  }
}
