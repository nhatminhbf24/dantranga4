import React from 'react';
import {
  Printer,
  Download,
  Sliders,
  Settings2,
  FileSpreadsheet,
  Scissors,
  Sparkles,
  Smartphone,
  Maximize2,
  FileImage,
} from 'lucide-react';
import { LayoutSettings, ShapeType } from '../types';
import { Uploader } from './Uploader';
import { PhotoItem } from '../types';

interface SettingsSidebarProps {
  settings: LayoutSettings;
  onUpdateSettings: (updates: Partial<LayoutSettings>) => void;
  pageCount: number;
  totalPhotos: number;
  onAddPhotos: (photos: PhotoItem[]) => void;
  onPrint: () => void;
  onExport: (format: 'png' | 'jpeg') => void;
  isExporting: boolean;
  exportProgress: { current: number; total: number } | null;
  onToast: (type: 'success' | 'error' | 'info', text: string) => void;
  defaultSize: { width: number; height: number; shape: ShapeType };
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  settings,
  onUpdateSettings,
  pageCount,
  totalPhotos,
  onAddPhotos,
  onPrint,
  onExport,
  isExporting,
  exportProgress,
  onToast,
  defaultSize,
}) => {
  return (
    <aside
      id="sidebar"
      className="no-print w-80 shrink-0 flex flex-col bg-white border-r border-slate-200 h-full overflow-hidden z-20 shadow-xs"
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-20 flex items-center gap-3">
        <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl text-white shadow-sm shadow-blue-500/20">
          <Printer className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 leading-none mb-1">AutoPack Print</h1>
          <p className="text-[11px] text-slate-500 font-medium">Dàn trang in ảnh A4 thông minh</p>
        </div>
      </div>

      {/* Main Settings Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {/* Page Stats & Orientation */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Tổng trang A4:</span>
            <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-md text-xs font-bold font-mono">
              {pageCount} trang
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-600">Hướng giấy:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => onUpdateSettings({ paperOrientation: 'portrait' })}
                className={`px-2.5 py-1 rounded-md transition ${
                  settings.paperOrientation === 'portrait'
                    ? 'bg-white text-blue-700 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Khổ Dọc
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ paperOrientation: 'landscape' })}
                className={`px-2.5 py-1 rounded-md transition ${
                  settings.paperOrientation === 'landscape'
                    ? 'bg-white text-blue-700 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Khổ Ngang
              </button>
            </div>
          </div>
        </div>

        {/* 1. Uploader Box (Tải ảnh vào trang) */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2 text-slate-800">
            <FileImage className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wide">Tải ảnh vào trang</h2>
          </div>

          <Uploader
            onAddPhotos={onAddPhotos}
            onToast={onToast}
            defaultSize={defaultSize}
            smartCrop={settings.smartCrop}
          />
        </div>

        {/* 2. General Settings (Cài đặt lề & khoảng cách) */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2 text-slate-800">
            <Settings2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wide">Cài đặt lề & khoảng cách</h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">
                Lề trang (mm)
              </label>
              <input
                type="number"
                min="0"
                max="25"
                value={settings.margin}
                onChange={(e) => onUpdateSettings({ margin: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">
                K.Cách ảnh (mm)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={settings.gap}
                onChange={(e) => onUpdateSettings({ gap: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Cut lines Toggle */}
          <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition select-none">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-slate-600" />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Viền cắt (Cut lines)</span>
                <span className="text-[10px] text-slate-500">Đường đứt nét dễ rọc giấy</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.cutLines}
              onChange={(e) => onUpdateSettings({ cutLines: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>

          {/* Smart Crop Toggle */}
          <label className="flex items-center justify-between p-2.5 bg-purple-50/60 rounded-lg border border-purple-100 cursor-pointer hover:bg-purple-50 transition select-none">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <div>
                <span className="text-xs font-semibold text-purple-900 block">Smart Portrait Crop</span>
                <span className="text-[10px] text-purple-600">Tối ưu trọng tâm khuôn mặt 1/3</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.smartCrop}
              onChange={(e) => onUpdateSettings({ smartCrop: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
          </label>
        </div>
      </div>

      {/* Export & Print Action Footer */}
      <div className="p-4 border-t border-slate-200 bg-white space-y-2 sticky bottom-0 z-20 shadow-lg">
        {isExporting && exportProgress && (
          <div className="text-[11px] text-blue-600 font-semibold text-center pb-1">
            Đang xuất trang {exportProgress.current} / {exportProgress.total}...
          </div>
        )}

        <button
          type="button"
          id="btn-print"
          onClick={onPrint}
          disabled={totalPhotos === 0 || isExporting}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>In ngay (Print A4)</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            id="btn-export-png"
            onClick={() => onExport('png')}
            disabled={totalPhotos === 0 || isExporting}
            className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất PNG</span>
          </button>
          <button
            type="button"
            id="btn-export-jpg"
            onClick={() => onExport('jpeg')}
            disabled={totalPhotos === 0 || isExporting}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất JPG</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
