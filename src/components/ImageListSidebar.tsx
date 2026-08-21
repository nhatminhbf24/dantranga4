import React, { useState } from 'react';
import {
  Trash2,
  RotateCw,
  Copy,
  Layers,
  Image as ImageIcon,
  Check,
  Crop,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { PhotoItem, ShapeType, DEFAULT_SIZE_PRESETS, SizePreset } from '../types';
import { rotateImageBase64, calculateCrop } from '../utils/imageUtils';

interface ImageListSidebarProps {
  photos: PhotoItem[];
  onUpdatePhoto: (id: string, updates: Partial<PhotoItem>) => void;
  onRemovePhoto: (id: string) => void;
  onClearAll: () => void;
  onOpenCropModal: (photo: PhotoItem) => void;
  onToast: (type: 'success' | 'error' | 'info', text: string) => void;
  smartCrop: boolean;
}

export const ImageListSidebar: React.FC<ImageListSidebarProps> = ({
  photos,
  onUpdatePhoto,
  onRemovePhoto,
  onClearAll,
  onOpenCropModal,
  onToast,
  smartCrop,
}) => {
  const [batchPresetId, setBatchPresetId] = useState<string>('60x90_rect');
  const [batchQuantity, setBatchQuantity] = useState<number>(1);

  const totalCopies = photos.reduce((acc, p) => acc + (p.qty || 1), 0);

  const handleApplyPresetToAll = () => {
    const preset = DEFAULT_SIZE_PRESETS.find((p) => p.id === batchPresetId);
    if (!preset) return;

    photos.forEach((photo) => {
      const crop = calculateCrop(photo.imgWidth, photo.imgHeight, preset.width, preset.height, smartCrop);
      onUpdatePhoto(photo.id, {
        targetWidth: preset.width,
        targetHeight: preset.height,
        shape: preset.shape,
        cropX: crop.cropX,
        cropY: crop.cropY,
        cropW: crop.cropW,
        cropH: crop.cropH,
        scale: 1,
      });
    });

    onToast('success', `Đã đổi tất cả sang: ${preset.label}`);
  };

  const handleApplyQuantityToAll = (qtyToApply?: number) => {
    const targetQty = Math.max(1, qtyToApply !== undefined ? qtyToApply : batchQuantity);
    photos.forEach((photo) => {
      onUpdatePhoto(photo.id, { qty: targetQty });
    });
    onToast('success', `Đã đặt số lượng tất cả ảnh thành ${targetQty} bản`);
  };

  const handleAdjustQuantityAll = (delta: number) => {
    photos.forEach((photo) => {
      const newQty = Math.max(1, (photo.qty || 1) + delta);
      onUpdatePhoto(photo.id, { qty: newQty });
    });
    onToast('info', `Đã ${delta > 0 ? 'tăng' : 'giảm'} 1 bản in cho tất cả ảnh`);
  };

  const handleRotateAll = async () => {
    if (photos.length === 0) return;
    onToast('info', 'Đang xoay toàn bộ ảnh 90°...');

    for (const photo of photos) {
      const rotatedSrc = await rotateImageBase64(photo.originalSrc, 90);
      const newWidth = photo.imgHeight;
      const newHeight = photo.imgWidth;
      const crop = calculateCrop(newWidth, newHeight, photo.targetWidth, photo.targetHeight, smartCrop);

      onUpdatePhoto(photo.id, {
        originalSrc: rotatedSrc,
        imgWidth: newWidth,
        imgHeight: newHeight,
        cropX: crop.cropX,
        cropY: crop.cropY,
        cropW: crop.cropW,
        cropH: crop.cropH,
        scale: 1,
      });
    }

    onToast('success', 'Đã xoay tất cả ảnh thành công!');
  };

  const handleRotateSingle = async (photo: PhotoItem) => {
    const rotatedSrc = await rotateImageBase64(photo.originalSrc, 90);
    const newWidth = photo.imgHeight;
    const newHeight = photo.imgWidth;
    const crop = calculateCrop(newWidth, newHeight, photo.targetWidth, photo.targetHeight, smartCrop);

    onUpdatePhoto(photo.id, {
      originalSrc: rotatedSrc,
      imgWidth: newWidth,
      imgHeight: newHeight,
      cropX: crop.cropX,
      cropY: crop.cropY,
      cropW: crop.cropW,
      cropH: crop.cropH,
      scale: 1,
    });
  };

  const handleSizePresetChange = (photo: PhotoItem, presetId: string) => {
    const preset = DEFAULT_SIZE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const crop = calculateCrop(photo.imgWidth, photo.imgHeight, preset.width, preset.height, smartCrop);
    onUpdatePhoto(photo.id, {
      targetWidth: preset.width,
      targetHeight: preset.height,
      shape: preset.shape,
      cropX: crop.cropX,
      cropY: crop.cropY,
      cropW: crop.cropW,
      cropH: crop.cropH,
      scale: 1,
    });
  };

  // Group presets by category
  const categories = Array.from(new Set(DEFAULT_SIZE_PRESETS.map((p) => p.category)));

  return (
    <aside
      id="list-sidebar"
      className="w-80 shrink-0 flex flex-col bg-slate-50 border-r border-slate-200 h-full overflow-hidden z-20"
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 bg-white sticky top-0 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">
            Danh sách ảnh ({photos.length})
          </span>
          {photos.length > 0 && (
            <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
              {totalCopies} bản
            </span>
          )}
        </div>

        {photos.length > 0 && (
          <button
            id="btn-clear-all"
            type="button"
            onClick={onClearAll}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition"
          >
            Xóa hết
          </button>
        )}
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Batch Tools Box */}
        {photos.length > 0 && (
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
            {/* Batch Size Sync */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  Đồng bộ kích thước:
                </label>
              </div>

              <select
                value={batchPresetId}
                onChange={(e) => setBatchPresetId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              >
                {categories.map((cat) => (
                  <optgroup key={cat} label={cat}>
                    {DEFAULT_SIZE_PRESETS.filter((p) => p.category === cat).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <button
                type="button"
                id="btn-apply-size-all"
                onClick={handleApplyPresetToAll}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition active:scale-95"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Áp dụng kích thước cho tất cả</span>
              </button>
            </div>

            <div className="border-t border-slate-100" />

            {/* Batch Quantity Sync */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  Số lượng in hàng loạt:
                </label>
              </div>

              {/* Stepper + Input + Apply Button */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setBatchQuantity((q) => Math.max(1, q - 1))}
                    className="w-6 h-6 flex items-center justify-center rounded bg-white text-slate-700 font-bold hover:bg-slate-50 transition shadow-2xs text-xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={batchQuantity}
                    onChange={(e) => setBatchQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-10 text-center text-xs font-bold text-slate-800 bg-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setBatchQuantity((q) => q + 1)}
                    className="w-6 h-6 flex items-center justify-center rounded bg-white text-slate-700 font-bold hover:bg-slate-50 transition shadow-2xs text-xs"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  id="btn-apply-qty-all"
                  onClick={() => handleApplyQuantityToAll()}
                  className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition active:scale-95 whitespace-nowrap"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Áp dụng SL tất cả</span>
                </button>
              </div>

              {/* Quick Preset Pills */}
              <div className="flex items-center gap-1 pt-0.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase pr-0.5">Nhanh:</span>
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setBatchQuantity(num);
                      handleApplyQuantityToAll(num);
                    }}
                    className={`flex-1 py-1 rounded-md text-[11px] font-bold border transition active:scale-95 ${
                      batchQuantity === num
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Incremental Adjustment Buttons (+1 all / -1 all) */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleAdjustQuantityAll(-1)}
                  className="flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 py-1 rounded-md text-[11px] font-semibold transition active:scale-95"
                >
                  <span>-1 tất cả ảnh</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustQuantityAll(1)}
                  className="flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 py-1 rounded-md text-[11px] font-semibold transition active:scale-95"
                >
                  <span>+1 tất cả ảnh</span>
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Batch Rotate 90deg */}
            <button
              type="button"
              id="btn-rotate-all"
              onClick={handleRotateAll}
              className="w-full flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 border border-blue-100"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Xoay tất cả ảnh 90°</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {photos.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-white space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div className="text-xs font-semibold text-slate-600">Chưa có ảnh nào</div>
            <p className="text-[11px] text-slate-400">Tải ảnh ở cột bên cạnh hoặc dán (Ctrl+V) để bắt đầu dàn trang.</p>
          </div>
        ) : (
          /* Image Cards List */
          <div className="space-y-2.5">
            {photos.map((photo, index) => {
              const currentPresetId = `${photo.targetWidth}x${photo.targetHeight}_${photo.shape}`;
              const matchedPreset = DEFAULT_SIZE_PRESETS.find(
                (p) => p.width === photo.targetWidth && p.height === photo.targetHeight && p.shape === photo.shape
              );

              return (
                <div
                  key={photo.id}
                  id={`photo-card-${photo.id}`}
                  className="bg-white border border-slate-200/80 hover:border-blue-300 rounded-xl p-3 shadow-2xs hover:shadow-sm transition group flex flex-col gap-2.5"
                >
                  {/* Top: Thumbnail & Size Selector */}
                  <div className="flex items-center gap-2.5">
                    {/* Thumbnail with Shape Mask Preview */}
                    <div className="relative w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                      <div
                        className={`w-full h-full bg-cover bg-center ${
                          photo.shape === 'circle'
                            ? 'shape-circle'
                            : photo.shape === 'heart'
                            ? 'shape-heart'
                            : 'rounded-md'
                        }`}
                        style={{ backgroundImage: `url(${photo.originalSrc})` }}
                      />
                      <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white font-mono text-[9px] px-1 rounded">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Size Select */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-slate-700 truncate mb-1" title={photo.name}>
                        {photo.name}
                      </div>
                      <select
                        value={matchedPreset ? matchedPreset.id : currentPresetId}
                        onChange={(e) => handleSizePresetChange(photo, e.target.value)}
                        className="w-full text-xs font-medium border border-slate-200 bg-slate-50 rounded-lg p-1.5 text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition"
                      >
                        {categories.map((cat) => (
                          <optgroup key={cat} label={cat}>
                            {DEFAULT_SIZE_PRESETS.filter((p) => p.category === cat).map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Bottom: Quantity & Controls */}
                  <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase px-1">SL:</span>
                      <button
                        type="button"
                        onClick={() => onUpdatePhoto(photo.id, { qty: Math.max(1, (photo.qty || 1) - 1) })}
                        className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={photo.qty || 1}
                        onChange={(e) =>
                          onUpdatePhoto(photo.id, { qty: Math.max(1, parseInt(e.target.value) || 1) })
                        }
                        className="w-9 h-6 text-center text-xs font-bold bg-white border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-400"
                      />
                      <button
                        type="button"
                        onClick={() => onUpdatePhoto(photo.id, { qty: (photo.qty || 1) + 1 })}
                        className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
                      >
                        +
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      {/* Crop / Adjust framing */}
                      <button
                        type="button"
                        onClick={() => onOpenCropModal(photo)}
                        className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition shadow-2xs"
                        title="Chỉnh khung & Cắt góc"
                      >
                        <Crop className="w-3.5 h-3.5" />
                      </button>

                      {/* Rotate 90° */}
                      <button
                        type="button"
                        onClick={() => handleRotateSingle(photo)}
                        className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition shadow-2xs"
                        title="Xoay ảnh 90°"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onRemovePhoto(photo.id)}
                        className="p-1.5 rounded-md bg-white border border-transparent text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition"
                        title="Xóa ảnh này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
