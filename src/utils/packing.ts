import { PhotoItem, LayoutSettings, PackedPage, PlacedPhotoItem } from '../types';

export const MM_TO_PX_300DPI = 300 / 25.4; // approx 11.811 px/mm for 300 DPI high-res print/export
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

interface FreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ItemToPack {
  photo: PhotoItem;
  instanceIndex: number;
  w: number;
  h: number;
  area: number;
}

/**
 * Standard shelf packing (xếp tuần tự tự nhiên theo thứ tự ảnh, giữ nguyên 100% kích thước)
 */
function packShelf(
  items: ItemToPack[],
  usableWidth: number,
  usableHeight: number,
  margin: number,
  gap: number
): PackedPage[] {
  const pages: PackedPage[] = [];
  let currentPageItems: PlacedPhotoItem[] = [];
  let currentX = 0;
  let currentY = 0;
  let shelfHeight = 0;

  for (const item of items) {
    if (currentX + item.w > usableWidth && currentX > 0) {
      currentX = 0;
      currentY += shelfHeight + gap;
      shelfHeight = 0;
    }

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

/**
 * Maximal Rectangles 2D Guillotine Bin Packing (Auto Nesting / Best-Fit)
 * GIỮ NGUYÊN 100% KÍCH THƯỚC ĐÃ CÀI ĐẶT (KHÔNG XOAY / KHÔNG HOÁN ĐỔI W/H).
 * Chỉ tìm tọa độ (X, Y) và khoảng trống thích hợp nhất để ghép khít các bức ảnh khác kích thước lại với nhau.
 */
function packMaximalRectanglesNesting(
  items: ItemToPack[],
  usableWidth: number,
  usableHeight: number,
  margin: number,
  gap: number
): PackedPage[] {
  const remaining = [...items];
  const pages: PackedPage[] = [];

  while (remaining.length > 0) {
    const pageItems: PlacedPhotoItem[] = [];
    let freeRects: FreeRect[] = [
      { x: 0, y: 0, w: usableWidth, h: usableHeight },
    ];

    let itemPlaced = true;
    while (itemPlaced && remaining.length > 0) {
      itemPlaced = false;
      let bestItemIndex = -1;
      let bestRectIndex = -1;
      let bestScore = Number.MAX_VALUE; // Best Short Side Fit + top-left heuristic

      for (let i = 0; i < remaining.length; i++) {
        const item = remaining[i];

        for (let r = 0; r < freeRects.length; r++) {
          const rect = freeRects[r];
          // Giữ nguyên 100% item.w và item.h đã cài đặt, không xoay đổi chiều
          if (item.w <= rect.w && item.h <= rect.h) {
            const leftoverW = rect.w - item.w;
            const leftoverH = rect.h - item.h;
            const shortSideFit = Math.min(leftoverW, leftoverH);
            const score = rect.y * 10000 + rect.x * 100 + shortSideFit;

            if (score < bestScore) {
              bestScore = score;
              bestItemIndex = i;
              bestRectIndex = r;
            }
          }
        }
      }

      if (bestItemIndex !== -1 && bestRectIndex !== -1) {
        const [placedItem] = remaining.splice(bestItemIndex, 1);
        const freeRect = freeRects[bestRectIndex];
        const finalW = placedItem.w;
        const finalH = placedItem.h;

        pageItems.push({
          ...placedItem.photo,
          instanceIndex: placedItem.instanceIndex,
          x: margin + freeRect.x,
          y: margin + freeRect.y,
          w: finalW,
          h: finalH,
        });

        // Split the chosen free rectangle (Guillotine cut: Leftover Right & Leftover Bottom)
        const occupiedW = finalW + gap;
        const occupiedH = finalH + gap;

        const newRects: FreeRect[] = [];
        for (let r = 0; r < freeRects.length; r++) {
          if (r === bestRectIndex) {
            // Right split
            if (freeRect.w - occupiedW > 0) {
              newRects.push({
                x: freeRect.x + occupiedW,
                y: freeRect.y,
                w: freeRect.w - occupiedW,
                h: finalH,
              });
            }
            // Bottom split
            if (freeRect.h - occupiedH > 0) {
              newRects.push({
                x: freeRect.x,
                y: freeRect.y + occupiedH,
                w: freeRect.w,
                h: freeRect.h - occupiedH,
              });
            }
          } else {
            // Check intersection with other free rects
            const rect = freeRects[r];
            const overlapX = Math.max(0, Math.min(rect.x + rect.w, freeRect.x + occupiedW) - Math.max(rect.x, freeRect.x));
            const overlapY = Math.max(0, Math.min(rect.y + rect.h, freeRect.y + occupiedH) - Math.max(rect.y, freeRect.y));

            if (overlapX > 0 && overlapY > 0) {
              // Subdivide overlapped rect into non-overlapping pieces
              if (freeRect.x + occupiedW < rect.x + rect.w) {
                newRects.push({
                  x: freeRect.x + occupiedW,
                  y: rect.y,
                  w: rect.x + rect.w - (freeRect.x + occupiedW),
                  h: rect.h,
                });
              }
              if (freeRect.y + occupiedH < rect.y + rect.h) {
                newRects.push({
                  x: rect.x,
                  y: freeRect.y + occupiedH,
                  w: rect.w,
                  h: rect.y + rect.h - (freeRect.y + occupiedH),
                });
              }
            } else {
              newRects.push(rect);
            }
          }
        }

        // Clean up redundant / tiny / enclosed rects
        freeRects = newRects.filter((r) => r.w >= 10 && r.h >= 10);
        itemPlaced = true;
      }
    }

    if (pageItems.length > 0) {
      pages.push({
        pageNumber: pages.length + 1,
        items: pageItems,
      });
    } else {
      // Safety fallback: if an item is larger than the page, place it alone
      if (remaining.length > 0) {
        const item = remaining.shift()!;
        pages.push({
          pageNumber: pages.length + 1,
          items: [
            {
              ...item.photo,
              instanceIndex: item.instanceIndex,
              x: margin,
              y: margin,
              w: Math.min(item.w, usableWidth),
              h: Math.min(item.h, usableHeight),
            },
          ],
        });
      }
    }
  }

  return pages;
}

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
  const itemsToPack: ItemToPack[] = [];

  photos.forEach((photo) => {
    const qty = Math.max(1, photo.qty || 1);
    for (let i = 0; i < qty; i++) {
      const w = photo.targetWidth;
      const h = photo.targetHeight;
      itemsToPack.push({
        photo,
        w,
        h,
        area: w * h,
        instanceIndex: i,
      });
    }
  });

  // Chỉ bật Nesting khi người dùng chủ động bật (settings.autoNesting === true)
  if (settings.autoNesting === true) {
    // Sort items by area and larger dimension descending for best packing efficiency (giữ nguyên W x H)
    itemsToPack.sort((a, b) => b.area - a.area || Math.max(b.w, b.h) - Math.max(a.w, a.h));
    return packMaximalRectanglesNesting(itemsToPack, usableWidth, usableHeight, margin, gap);
  }

  // Mặc định: Xếp tuần tự tự nhiên (Standard Shelf Packing) theo thứ tự ảnh
  return packShelf(itemsToPack, usableWidth, usableHeight, margin, gap);
}
