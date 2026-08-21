import { PhotoItem, LayoutSettings, PackedPage, PlacedPhotoItem } from '../types';

export const MM_TO_PX_300DPI = 300 / 25.4; // approx 11.811 px/mm for 300 DPI high-res print/export
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

export function packImagesToPages(
  photos: PhotoItem[],
  settings: LayoutSettings
): PackedPage[] {
  if (photos.length === 0) return [];

  const isLandscape = settings.paperOrientation === 'landscape';
  const pageWidth = isLandscape ? A4_HEIGHT_MM : A4_WIDTH_MM;
  const pageHeight = isLandscape ? A4_WIDTH_MM : A4_HEIGHT_MM;

  const margin = Math.max(0, settings.margin);
  const gap = Math.max(0, settings.gap);

  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  if (usableWidth <= 0 || usableHeight <= 0) return [];

  // Expand photos by quantity
  const itemsToPack: { photo: PhotoItem; w: number; h: number; instanceIndex: number }[] = [];

  photos.forEach((photo) => {
    const qty = Math.max(1, photo.qty || 1);
    for (let i = 0; i < qty; i++) {
      // If photo itself is bigger than the entire usable page area, cap it or skip
      const w = Math.min(photo.targetWidth, usableWidth);
      const h = Math.min(photo.targetHeight, usableHeight);
      itemsToPack.push({ photo, w, h, instanceIndex: i });
    }
  });

  // Sort by height descending for optimal shelf packing
  itemsToPack.sort((a, b) => b.h - a.h || b.w - a.w);

  const pages: PackedPage[] = [];
  let currentPageItems: PlacedPhotoItem[] = [];
  let currentX = 0;
  let currentY = 0;
  let shelfHeight = 0;

  for (const item of itemsToPack) {
    // Check if we need to wrap to the next shelf (new row)
    if (currentX + item.w > usableWidth && currentX > 0) {
      currentX = 0;
      currentY += shelfHeight + gap;
      shelfHeight = 0;
    }

    // Check if we need to wrap to the next page
    if (currentY + item.h > usableHeight && currentPageItems.length > 0) {
      pages.push({
        pageNumber: pages.length + 1,
        items: currentPageItems,
      });
      currentPageItems = [];
      currentX = 0;
      currentY = 0;
      shelfHeight = 0;
    }

    // Place the item
    currentPageItems.push({
      ...item.photo,
      instanceIndex: item.instanceIndex,
      x: margin + currentX,
      y: margin + currentY,
      w: item.w,
      h: item.h,
    });

    currentX += item.w + gap;
    shelfHeight = Math.max(shelfHeight, item.h);
  }

  if (currentPageItems.length > 0) {
    pages.push({
      pageNumber: pages.length + 1,
      items: currentPageItems,
    });
  }

  return pages;
}
