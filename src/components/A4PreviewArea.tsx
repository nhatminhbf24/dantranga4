import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Info,
  Move,
  Layers,
} from 'lucide-react';
import { PackedPage, LayoutSettings, PhotoItem, ShapeType } from '../types';
import { A4_WIDTH_MM, A4_HEIGHT_MM } from '../utils/packing';

interface A4PreviewAreaProps {
  pages: PackedPage[];
  settings: LayoutSettings;
  onUpdatePhoto: (id: string, updates: Partial<PhotoItem>) => void;
  onOpenCropModal: (photo: PhotoItem) => void;
  totalPhotos: number;
}

export const A4PreviewArea: React.FC<A4PreviewAreaProps> = ({
  pages,
  settings,
  onUpdatePhoto,
  onOpenCropModal,
  totalPhotos,
}) => {
  const [zoom, setZoom] = useState<number>(70); // Percentage: 30% to 150%
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isLandscape = settings.paperOrientation === 'landscape';
  const pageW_mm = isLandscape ? A4_HEIGHT_MM : A4_WIDTH_MM;
  const pageH_mm = isLandscape ? A4_WIDTH_MM : A4_HEIGHT_MM;

  // In-Page Interactive Dragging State
  const [draggingPhotoId, setDraggingPhotoId] = useState<string | null>(null);
  const dragInfoRef = useRef<{
    photo: PhotoItem;
    startX: number;
    startY: number;
    initialCropX: number;
    initialCropY: number;
    renderedWidth: number;
    renderedHeight: number;
  } | null>(null);

  const handlePhotoMouseDown = (
    e: React.MouseEvent,
    photo: PhotoItem
  ) => {
    // Only drag on primary mouse button
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const targetEl = e.currentTarget as HTMLElement;
    const rect = targetEl.getBoundingClientRect();

    setDraggingPhotoId(photo.id);
    dragInfoRef.current = {
      photo,
      startX: e.clientX,
      startY: e.clientY,
      initialCropX: photo.cropX,
      initialCropY: photo.cropY,
      renderedWidth: rect.width || 100,
      renderedHeight: rect.height || 100,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragInfoRef.current) return;
      const {
        photo: p,
        startX,
        startY,
        initialCropX,
        initialCropY,
        renderedWidth,
        renderedHeight,
      } = dragInfoRef.current;

      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      const scale = p.scale || 1;
      const actualCropW = p.cropW / scale;
      const actualCropH = p.cropH / scale;

      // 1:1 Pixel-perfect direct manipulation mapping from screen pixels to image crop pixels
      const pxScaleX = actualCropW / renderedWidth;
      const pxScaleY = actualCropH / renderedHeight;

      let newX = initialCropX - dx * pxScaleX;
      let newY = initialCropY - dy * pxScaleY;

      newX = Math.max(0, Math.min(newX, p.imgWidth - actualCropW));
      newY = Math.max(0, Math.min(newY, p.imgHeight - actualCropH));

      onUpdatePhoto(p.id, { cropX: newX, cropY: newY });
    };

    const handleMouseUp = () => {
      setDraggingPhotoId(null);
      dragInfoRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handlePhotoWheel = (e: React.WheelEvent, photo: PhotoItem) => {
    e.preventDefault();
    e.stopPropagation();

    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    const oldScale = photo.scale || 1;
    const newScale = Math.max(1, Math.min(4, oldScale + zoomDelta));

    if (newScale !== oldScale) {
      const oldActualW = photo.cropW / oldScale;
      const oldActualH = photo.cropH / oldScale;
      const centerX = photo.cropX + oldActualW / 2;
      const centerY = photo.cropY + oldActualH / 2;

      const newActualW = photo.cropW / newScale;
      const newActualH = photo.cropH / newScale;

      let newCropX = centerX - newActualW / 2;
      let newCropY = centerY - newActualH / 2;

      newCropX = Math.max(0, Math.min(newCropX, photo.imgWidth - newActualW));
      newCropY = Math.max(0, Math.min(newCropY, photo.imgHeight - newActualH));

      onUpdatePhoto(photo.id, {
        scale: newScale,
        cropX: newCropX,
        cropY: newCropY,
      });
    }
  };

  return (
    <div
      id="preview-area"
      ref={containerRef}
      className="flex-1 flex flex-col items-center bg-slate-200/80 overflow-y-auto h-full relative"
    >
      {/* Top Floating Control Bar */}
      <div
        id="preview-topbar"
        className="no-print sticky top-3 z-30 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-slate-200/80 text-xs text-slate-700"
      >
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">
          Zoom:
        </span>

        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(30, z - 10))}
          className="p-1 rounded-full hover:bg-slate-100 text-slate-600 transition"
          title="Thu nhỏ"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <input
          type="range"
          min="30"
          max="150"
          step="5"
          value={zoom}
          onChange={(e) => setZoom(parseInt(e.target.value))}
          className="w-24 accent-blue-600 cursor-pointer"
        />

        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(150, z + 10))}
          className="p-1 rounded-full hover:bg-slate-100 text-slate-600 transition"
          title="Phóng to"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <span className="font-mono font-bold text-slate-800 w-10 text-right">{zoom}%</span>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => setZoom(70)}
          className="px-2 py-0.5 rounded-md hover:bg-slate-100 text-[11px] font-semibold text-slate-600 transition"
        >
          Mặc định (70%)
        </button>
        <button
          type="button"
          onClick={() => setZoom(100)}
          className="px-2 py-0.5 rounded-md hover:bg-slate-100 text-[11px] font-semibold text-slate-600 transition"
        >
          100%
        </button>
      </div>

      {/* Pages Container with Zoom scaling */}
      <div className="print-area-wrapper flex flex-col items-center w-full py-6 pb-24">
        {pages.length === 0 ? (
          <div className="no-print mt-20 p-8 max-w-md text-center bg-white rounded-2xl shadow-sm border border-slate-200/80 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Trang in A4 trống</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tải ảnh lên hoặc bấm &quot;Thử ngay với ảnh mẫu&quot; ở cột bên trái để công cụ tự động xếp ảnh
              vào trang A4 theo thuật toán tối ưu diện tích.
            </p>
          </div>
        ) : (
          <div
            id="pages-container"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
            className="flex flex-col items-center gap-8 transition-transform duration-75"
          >
            {pages.map((page) => (
              <div
                key={`page-${page.pageNumber}`}
                id={`a4-page-${page.pageNumber}`}
                className="a4-page-sheet relative bg-white shadow-xl rounded-xs border border-slate-300/60 overflow-hidden"
                style={{
                  width: `${pageW_mm}mm`,
                  height: `${pageH_mm}mm`,
                }}
              >
                {/* Page Number Watermark (Hidden in Print) */}
                <div className="no-print absolute top-2 right-3 z-30 pointer-events-none bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  Trang {page.pageNumber} / {pages.length} (A4 {isLandscape ? 'Ngang' : 'Dọc'})
                </div>

                {/* Printable Margin Guideline (Subtle dashed, hidden in print) */}
                <div
                  className="no-print absolute border border-blue-200/40 pointer-events-none z-10"
                  style={{
                    left: `${settings.margin}mm`,
                    top: `${settings.margin}mm`,
                    width: `${pageW_mm - settings.margin * 2}mm`,
                    height: `${pageH_mm - settings.margin * 2}mm`,
                  }}
                />

                {/* Placed Photo Items */}
                {page.items.map((item) => {
                  const actualCropW = item.cropW / (item.scale || 1);
                  const actualCropH = item.cropH / (item.scale || 1);
                  const percentW = (item.imgWidth / actualCropW) * 100;
                  const percentH = (item.imgHeight / actualCropH) * 100;
                  const percentX = (-item.cropX / actualCropW) * 100;
                  const percentY = (-item.cropY / actualCropH) * 100;

                  const isCircle = item.shape === 'circle';
                  const isHeart = item.shape === 'heart';

                  return (
                    <div
                      key={`placed-${item.id}-${item.instanceIndex}`}
                      id={`img-box-${item.id}-${item.instanceIndex}`}
                      onMouseDown={(e) => handlePhotoMouseDown(e, item)}
                      onWheel={(e) => handlePhotoWheel(e, item)}
                      onDoubleClick={() => onOpenCropModal(item)}
                      title="Kéo chuột để dịch ảnh • Cuộn chuột để zoom • Nhấp đúp để chỉnh chi tiết"
                      style={{
                        position: 'absolute',
                        left: `${item.x}mm`,
                        top: `${item.y}mm`,
                        width: `${item.w}mm`,
                        height: `${item.h}mm`,
                      }}
                      className={`overflow-hidden select-none cursor-grab active:cursor-grabbing group/box ${
                        isCircle ? 'shape-circle' : isHeart ? 'shape-heart' : ''
                      } ${settings.cutLines ? 'cut-lines-box' : ''}`}
                    >
                      {/* Image Content */}
                      <img
                        src={item.originalSrc}
                        alt={item.name}
                        draggable={false}
                        className="absolute max-w-none pointer-events-none transition-none"
                        style={{
                          width: `${percentW}%`,
                          height: `${percentH}%`,
                          left: `${percentX}%`,
                          top: `${percentY}%`,
                        }}
                      />

                      {/* Hover Info Tag (Hidden in Print) */}
                      <div className="no-print opacity-0 group-hover/box:opacity-100 transition-opacity absolute bottom-1 right-1 bg-black/65 backdrop-blur-xs text-white text-[9px] font-mono px-1 py-0.5 rounded pointer-events-none flex items-center gap-0.5 z-20">
                        <span>
                          {item.w / 10}x{item.h / 10}cm
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
