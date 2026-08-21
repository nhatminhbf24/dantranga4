import React, { useState, useMemo, useCallback } from 'react';
import { PhotoItem, LayoutSettings, ShapeType } from './types';
import { packImagesToPages } from './utils/packing';
import { exportPagesToImage } from './utils/imageUtils';
import { ImageListSidebar } from './components/ImageListSidebar';
import { SettingsSidebar } from './components/SettingsSidebar';
import { A4PreviewArea } from './components/A4PreviewArea';
import { CropModal } from './components/CropModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [settings, setSettings] = useState<LayoutSettings>({
    margin: 5,
    gap: 2,
    cutLines: true,
    smartCrop: true,
    paperOrientation: 'portrait',
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [cropModalPhoto, setCropModalPhoto] = useState<PhotoItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);

  const defaultSize = useMemo<{ width: number; height: number; shape: ShapeType }>(
    () => ({
      width: 60,
      height: 90,
      shape: 'rect',
    }),
    []
  );

  const addToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleAddPhotos = useCallback((newPhotos: PhotoItem[]) => {
    setPhotos((prev) => [...prev, ...newPhotos]);
  }, []);

  const handleUpdatePhoto = useCallback((id: string, updates: Partial<PhotoItem>) => {
    setPhotos((prev) =>
      prev.map((photo) => (photo.id === id ? { ...photo, ...updates } : photo))
    );
  }, []);

  const handleRemovePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
    addToast('info', 'Đã xóa ảnh');
  }, [addToast]);

  const handleClearAll = useCallback(() => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ ảnh?')) {
      setPhotos([]);
      addToast('info', 'Đã xóa toàn bộ ảnh');
    }
  }, [addToast]);

  const handleUpdateSettings = useCallback((updates: Partial<LayoutSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const packedPages = useMemo(() => {
    return packImagesToPages(photos, settings);
  }, [photos, settings]);

  const handlePrint = useCallback(() => {
    if (photos.length === 0) {
      addToast('error', 'Chưa có ảnh nào để in!');
      return;
    }
    window.print();
  }, [photos.length, addToast]);

  const handleExport = useCallback(
    async (format: 'png' | 'jpeg') => {
      if (photos.length === 0) {
        addToast('error', 'Chưa có ảnh nào để xuất file!');
        return;
      }

      setIsExporting(true);
      setExportProgress({ current: 1, total: packedPages.length });
      addToast('info', `Đang kết xuất ${packedPages.length} trang độ nét cao 300 DPI...`);

      try {
        await exportPagesToImage(packedPages, settings, format, (current, total) => {
          setExportProgress({ current, total });
        });
        addToast('success', `Đã xuất ${packedPages.length} trang ảnh chất lượng cao thành công!`);
      } catch (err) {
        console.error('Error exporting:', err);
        addToast('error', 'Có lỗi xảy ra khi tạo file xuất.');
      } finally {
        setIsExporting(false);
        setExportProgress(null);
      }
    },
    [photos.length, packedPages, settings, addToast]
  );

  return (
    <div id="app-root" className="flex w-full h-screen overflow-hidden bg-slate-100 text-slate-800 font-sans">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Column 1: Image List Sidebar (Left) */}
      <ImageListSidebar
        photos={photos}
        onUpdatePhoto={handleUpdatePhoto}
        onRemovePhoto={handleRemovePhoto}
        onClearAll={handleClearAll}
        onOpenCropModal={setCropModalPhoto}
        onToast={addToast}
        smartCrop={settings.smartCrop}
      />

      {/* Column 2: Settings Sidebar (Middle) */}
      <SettingsSidebar
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        pageCount={packedPages.length}
        totalPhotos={photos.length}
        onAddPhotos={handleAddPhotos}
        onPrint={handlePrint}
        onExport={handleExport}
        isExporting={isExporting}
        exportProgress={exportProgress}
        onToast={addToast}
        defaultSize={defaultSize}
      />

      {/* Column 3: Live Interactive A4 Preview (Right) */}
      <A4PreviewArea
        pages={packedPages}
        settings={settings}
        onUpdatePhoto={handleUpdatePhoto}
        onOpenCropModal={setCropModalPhoto}
        totalPhotos={photos.length}
      />

      {/* Modal for Fine-Tuned Crop / Pan / Framing */}
      {cropModalPhoto && (
        <CropModal
          photo={cropModalPhoto}
          onClose={() => setCropModalPhoto(null)}
          onSave={handleUpdatePhoto}
          smartCrop={settings.smartCrop}
        />
      )}
    </div>
  );
}
