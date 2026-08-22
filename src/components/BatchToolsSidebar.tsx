import React, { useState } from 'react';
import {
  Sparkles,
  RotateCw,
  Copy,
  Check,
  Undo2,
  Loader2,
  Sliders,
  Maximize2,
  Layers,
  Wand2,
} from 'lucide-react';
import { PhotoItem, DEFAULT_SIZE_PRESETS } from '../types';
import { rotateImageBase64, calculateCrop } from '../utils/imageUtils';
import { enhanceImageQuality } from '../utils/imageEnhancer';

interface BatchToolsSidebarProps {
  photos: PhotoItem[];
  onUpdatePhoto: (id: string, updates: Partial<PhotoItem>) => void;
  onToast: (type: 'success' | 'error' | 'info', text: string) => void;
  smartCrop: boolean;
}

export const BatchToolsSidebar: React.FC<BatchToolsSidebarProps> = ({
  photos,
  onUpdatePhoto,
  onToast,
  smartCrop,
}) => {
  const [batchPresetId, setBatchPresetId] = useState<string>('60x90_rect');
  const [batchQuantity, setBatchQuantity] = useState<number>(1);
  const [enhanceStrength, setEnhanceStrength] = useState<number>(50);
  const [isEnhancingAll, setIsEnhancingAll] = useState<boolean>(false);
  const [isRevertingAll, setIsRevertingAll] = useState<boolean>(false);

  // Group presets by category
  const categories = Array.from(new Set(DEFAULT_SIZE_PRESETS.map((p) => p.category)));

  // 1. Batch Size Preset Change
  const handleApplyPresetToAll = () => {
    if (photos.length === 0) {
      onToast('error', 'Chưa có ảnh nào để áp dụng kích thước!');
      return;
    }
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

    onToast('success', `Đã đồng bộ tất cả sang kích thước: ${preset.label}`);
  };

  // 2. Batch Quantity
  const handleApplyQuantityToAll = (qtyToApply?: number) => {
    if (photos.length === 0) {
      onToast('error', 'Chưa có ảnh nào để đổi số lượng!');
      return;
    }
    const targetQty = Math.max(1, qtyToApply !== undefined ? qtyToApply : batchQuantity);
    photos.forEach((photo) => {
      onUpdatePhoto(photo.id, { qty: targetQty });
    });
    onToast('success', `Đã đặt số lượng tất cả ảnh thành ${targetQty} bản`);
  };

  const handleAdjustQuantityAll = (delta: number) => {
    if (photos.length === 0) return;
    photos.forEach((photo) => {
      const newQty = Math.max(1, (photo.qty || 1) + delta);
      onUpdatePhoto(photo.id, { qty: newQty });
    });
    onToast('info', `Đã ${delta > 0 ? 'tăng' : 'giảm'} 1 bản in cho tất cả ảnh`);
  };

  // 3. Batch Enhance All (Smart Sharpen & Contrast)
  const handleEnhanceAll = async () => {
    if (photos.length === 0 || isEnhancingAll) {
      if (photos.length === 0) onToast('error', 'Chưa có ảnh nào để làm nét!');
      return;
    }
    setIsEnhancingAll(true);
    onToast('info', `Đang phục hồi độ nét (${enhanceStrength}%) cho ${photos.length} ảnh...`);

    const sharpenVal = (enhanceStrength / 100) * 0.85 + 0.1;
    const contrastVal = (enhanceStrength / 100) * 0.16 + 0.04;

    let successCount = 0;
    for (const photo of photos) {
      try {
        const sourceForEnhancing = photo.rawOriginalSrc || photo.originalSrc;
        const result = await enhanceImageQuality(sourceForEnhancing, {
          sharpenAmount: sharpenVal,
          contrastAmount: contrastVal,
          brightnessAmount: 0.04,
          vibranceAmount: 0.18,
        });

        onUpdatePhoto(photo.id, {
          originalSrc: result.enhancedSrc,
          rawOriginalSrc: sourceForEnhancing,
          isEnhanced: true,
        });
        successCount++;
      } catch (e) {
        console.error('Enhance batch error for photo', photo.id, e);
      }
    }

    setIsEnhancingAll(false);
    onToast('success', `Đã nâng cao chất lượng (${enhanceStrength}%) cho ${successCount} ảnh!`);
  };

  // 4. Batch Revert All to Raw Original
  const handleRevertAllToOriginal = () => {
    if (photos.length === 0) return;
    setIsRevertingAll(true);
    let revertCount = 0;

    photos.forEach((photo) => {
      if (photo.isEnhanced && photo.rawOriginalSrc) {
        onUpdatePhoto(photo.id, {
          originalSrc: photo.rawOriginalSrc,
          isEnhanced: false,
        });
        revertCount++;
      }
    });

    setIsRevertingAll(false);
    if (revertCount > 0) {
      onToast('info', `Đã khôi phục ảnh gốc ban đầu cho ${revertCount} ảnh`);
    } else {
      onToast('info', 'Tất cả ảnh hiện tại đều đang ở trạng thái gốc');
    }
  };

  // 5. Batch Rotate All 90deg
  const handleRotateAll = async () => {
    if (photos.length === 0) {
      onToast('error', 'Chưa có ảnh nào để xoay!');
      return;
    }
    onToast('info', 'Đang xoay toàn bộ ảnh 90°...');

    for (const photo of photos) {
      const rotatedSrc = await rotateImageBase64(photo.originalSrc, 90);
      const rawRotated = photo.rawOriginalSrc ? await rotateImageBase64(photo.rawOriginalSrc, 90) : undefined;
      const newWidth = photo.imgHeight;
      const newHeight = photo.imgWidth;
      const crop = calculateCrop(newWidth, newHeight, photo.targetWidth, photo.targetHeight, smartCrop);

      onUpdatePhoto(photo.id, {
        originalSrc: rotatedSrc,
        rawOriginalSrc: rawRotated,
        imgWidth: newWidth,
        imgHeight: newHeight,
        cropX: crop.cropX,
        cropY: crop.cropY,
        cropW: crop.cropW,
        cropH: crop.cropH,
        scale: 1,
      });
    }

    onToast('success', 'Đã xoay tất cả ảnh 90° thành công!');
  };

  const enhancedCount = photos.filter((p) => p.isEnhanced).length;

  return (
    <aside
      id="batch-tools-sidebar"
      className="no-print w-76 shrink-0 flex flex-col bg-slate-50 border-r border-slate-200 h-full overflow-hidden z-20"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white sticky top-0 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-blue-600" />
          <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">
            Thao tác hàng loạt
          </h2>
        </div>
        {photos.length > 0 && (
          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full font-bold">
            {photos.length} ảnh
          </span>
        )}
      </div>

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {/* CỤM 1: ĐỒNG BỘ KÍCH THƯỚC */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5 transition hover:border-slate-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-800">
              <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-bold uppercase tracking-wide">Đồng bộ kích thước:</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Khổ in</span>
          </div>

          <select
            value={batchPresetId}
            onChange={(e) => setBatchPresetId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
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
            disabled={photos.length === 0}
            className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Áp dụng kích thước cho tất cả</span>
          </button>
        </div>

        {/* CỤM 2: SỐ LƯỢNG IN HÀNG LOẠT */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5 transition hover:border-emerald-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-800">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-bold uppercase tracking-wide">Số lượng in hàng loạt:</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
              Bản sao
            </span>
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
              disabled={photos.length === 0}
              className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-2.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition active:scale-95 whitespace-nowrap cursor-pointer"
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
                disabled={photos.length === 0}
                className={`flex-1 py-1 rounded-md text-[11px] font-bold border transition active:scale-95 ${
                  batchQuantity === num
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Incremental Adjustment Buttons (+1 all / -1 all) */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => handleAdjustQuantityAll(-1)}
              disabled={photos.length === 0}
              className="flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 text-slate-600 py-1.5 rounded-lg text-[11px] font-semibold transition active:scale-95 cursor-pointer"
            >
              <span>-1 tất cả ảnh</span>
            </button>
            <button
              type="button"
              onClick={() => handleAdjustQuantityAll(1)}
              disabled={photos.length === 0}
              className="flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 text-slate-600 py-1.5 rounded-lg text-[11px] font-semibold transition active:scale-95 cursor-pointer"
            >
              <span>+1 tất cả ảnh</span>
            </button>
          </div>
        </div>

        {/* CỤM 3: CHẤT LƯỢNG & ĐỘ NÉT (LÀM NÉT & PHỤC HỒI) */}
        <div className="bg-white rounded-xl p-3.5 border border-amber-200/90 shadow-2xs space-y-2.5 transition hover:border-amber-300">
          {/* Main Enhance Button */}
          <button
            type="button"
            id="btn-enhance-all-hd"
            onClick={handleEnhanceAll}
            disabled={isEnhancingAll || photos.length === 0}
            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white px-3 py-2.5 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
          >
            {isEnhancingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Đang làm nét {photos.length} ảnh...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Làm nét & Tăng chất lượng TẤT CẢ</span>
              </>
            )}
          </button>

          {/* Sharpness & Quality Intensity Slider Box */}
          <div className="bg-amber-50/50 border border-amber-200/70 rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span className="flex items-center gap-1 text-amber-900 font-bold">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Mức độ làm nét:</span>
              </span>
              <span className="font-bold text-amber-700 bg-amber-100/90 border border-amber-300 px-1.5 py-0.5 rounded text-[10px]">
                {enhanceStrength}%
              </span>
            </div>

            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={enhanceStrength}
              onChange={(e) => setEnhanceStrength(Number(e.target.value))}
              className="w-full h-1.5 bg-amber-200/80 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />

            <div className="flex justify-between text-[9px] text-amber-800/70 font-medium px-0.5">
              <span>Nhẹ (10%)</span>
              <span>Chuẩn (50%)</span>
              <span>Cực nét (100%)</span>
            </div>
          </div>

          {/* Revert to Original All Button */}
          <button
            type="button"
            id="btn-revert-all-original"
            onClick={handleRevertAllToOriginal}
            disabled={isRevertingAll || photos.length === 0 || enhancedCount === 0}
            className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 cursor-pointer"
            title="Khôi phục lại toàn bộ ảnh gốc ban đầu"
          >
            <Undo2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Khôi phục ảnh gốc TẤT CẢ {enhancedCount > 0 ? `(${enhancedCount})` : ''}</span>
          </button>
        </div>

        {/* CỤM 4: XOAY & ĐỊNH HƯỚNG */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2 transition hover:border-blue-200">
          <button
            type="button"
            id="btn-rotate-all"
            onClick={handleRotateAll}
            disabled={photos.length === 0}
            className="w-full flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 px-3 py-2 rounded-lg text-xs font-semibold transition active:scale-95 border border-blue-200 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Xoay tất cả ảnh 90°</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
