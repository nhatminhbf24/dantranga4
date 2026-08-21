import React, { useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Move } from 'lucide-react';
import { PhotoItem, ShapeType } from '../types';
import { rotateImageBase64, calculateCrop } from '../utils/imageUtils';

interface CropModalProps {
  photo: PhotoItem | null;
  onClose: () => void;
  onSave: (photoId: string, updates: Partial<PhotoItem>) => void;
  smartCrop: boolean;
}

export const CropModal: React.FC<CropModalProps> = ({
  photo,
  onClose,
  onSave,
  smartCrop,
}) => {
  if (!photo) return null;

  const [scale, setScale] = useState(photo.scale || 1);
  const [cropX, setCropX] = useState(photo.cropX);
  const [cropY, setCropY] = useState(photo.cropY);
  const [shape, setShape] = useState<ShapeType>(photo.shape);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startCropX: number; startCropY: number }>({
    x: 0,
    y: 0,
    startCropX: 0,
    startCropY: 0,
  });

  const actualCropW = photo.cropW / scale;
  const actualCropH = photo.cropH / scale;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startCropX: cropX,
      startCropY: cropY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Scale displacement to original image pixel coordinates
    const containerEl = e.currentTarget as HTMLDivElement;
    const rect = containerEl.getBoundingClientRect();
    const pxScaleX = actualCropW / rect.width;
    const pxScaleY = actualCropH / rect.height;

    let newX = dragStartRef.current.startCropX - dx * pxScaleX;
    let newY = dragStartRef.current.startCropY - dy * pxScaleY;

    newX = Math.max(0, Math.min(newX, photo.imgWidth - actualCropW));
    newY = Math.max(0, Math.min(newY, photo.imgHeight - actualCropH));

    setCropX(newX);
    setCropY(newY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    const newScale = Math.max(1, Math.min(4, scale + zoomDelta));
    handleScaleChange(newScale);
  };

  const handleScaleChange = (newScale: number) => {
    const oldActualW = photo.cropW / scale;
    const oldActualH = photo.cropH / scale;
    const centerX = cropX + oldActualW / 2;
    const centerY = cropY + oldActualH / 2;

    const newActualW = photo.cropW / newScale;
    const newActualH = photo.cropH / newScale;

    let newX = centerX - newActualW / 2;
    let newY = centerY - newActualH / 2;

    newX = Math.max(0, Math.min(newX, photo.imgWidth - newActualW));
    newY = Math.max(0, Math.min(newY, photo.imgHeight - newActualH));

    setScale(newScale);
    setCropX(newX);
    setCropY(newY);
  };

  const handleRotate = async () => {
    const rotatedSrc = await rotateImageBase64(photo.originalSrc, 90);
    const newWidth = photo.imgHeight;
    const newHeight = photo.imgWidth;
    const crop = calculateCrop(newWidth, newHeight, photo.targetWidth, photo.targetHeight, smartCrop);

    onSave(photo.id, {
      originalSrc: rotatedSrc,
      imgWidth: newWidth,
      imgHeight: newHeight,
      cropX: crop.cropX,
      cropY: crop.cropY,
      cropW: crop.cropW,
      cropH: crop.cropH,
      scale: 1,
    });
    onClose();
  };

  const handleSave = () => {
    onSave(photo.id, {
      scale,
      cropX,
      cropY,
      shape,
    });
    onClose();
  };

  // Preview calculations
  const percentW = (photo.imgWidth / actualCropW) * 100;
  const percentH = (photo.imgHeight / actualCropH) * 100;
  const percentX = (-cropX / actualCropW) * 100;
  const percentY = (-cropY / actualCropH) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Chỉnh sửa khung hình & Góc chụp</h3>
            <p className="text-[11px] text-slate-500">
              Kích thước: {photo.targetWidth / 10} x {photo.targetHeight / 10} cm
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-100/70 overflow-hidden select-none">
          <div className="text-[11px] text-slate-500 mb-2 flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5" />
            <span>Kéo chuột để dịch chuyển ảnh • Cuộn chuột để Phóng to/Thu nhỏ</span>
          </div>

          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{
              aspectRatio: `${photo.targetWidth} / ${photo.targetHeight}`,
              width: photo.targetWidth >= photo.targetHeight ? '300px' : 'auto',
              height: photo.targetHeight > photo.targetWidth ? '300px' : 'auto',
            }}
            className={`relative border-2 border-dashed border-blue-400 shadow-md overflow-hidden cursor-grab active:cursor-grabbing bg-white ${
              shape === 'circle' ? 'shape-circle' : shape === 'heart' ? 'shape-heart' : 'rounded-lg'
            }`}
          >
            <img
              src={photo.originalSrc}
              alt="Crop preview"
              draggable={false}
              className="absolute max-w-none pointer-events-none"
              style={{
                width: `${percentW}%`,
                height: `${percentH}%`,
                left: `${percentX}%`,
                top: `${percentY}%`,
              }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-3">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
              className="flex-1 accent-blue-600"
            />
            <ZoomIn className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-mono font-semibold text-slate-600 w-10 text-right">
              {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Shape and Rotate */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Hình dạng:</span>
              <button
                type="button"
                onClick={() => setShape('rect')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
                  shape === 'rect' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                Chữ nhật
              </button>
              <button
                type="button"
                onClick={() => setShape('circle')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
                  shape === 'circle' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                Tròn
              </button>
              <button
                type="button"
                onClick={() => setShape('heart')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
                  shape === 'heart' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                Trái tim
              </button>
            </div>

            <button
              type="button"
              onClick={handleRotate}
              className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Xoay 90°</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
