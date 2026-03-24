import React, { useRef, useState } from 'react';
import { Camera, Images, X, Loader2, RefreshCw } from 'lucide-react';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  required?: boolean;
}

export function ImageUpload({ value, onChange, required }: ImageUploadProps) {
  const cameraRef  = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${BASE}/api/upload/bag-image`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? 'アップロードに失敗しました');
      }
      const { url } = await res.json();
      onChange(url);
    } catch (e: any) {
      setError(e.message ?? 'アップロードエラー');
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-muted-foreground mb-1.5">
        商品写真 {required && <span className="text-red-500">*</span>}
      </label>

      {value ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 shadow-sm">
          <img
            src={value}
            alt="商品写真"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          {/* 変更ボタン（カメラ / ライブラリ） */}
          <div className="absolute bottom-2 right-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex items-center gap-1 bg-black/60 text-white text-xs font-bold px-2.5 py-1.5 rounded-full hover:bg-black/80 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              カメラ
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex items-center gap-1 bg-black/60 text-white text-xs font-bold px-2.5 py-1.5 rounded-full hover:bg-black/80 transition-colors"
            >
              <Images className="w-3.5 h-3.5" />
              ライブラリ
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {uploading ? (
            <div className="w-full h-48 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-bold text-muted-foreground">アップロード中...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {/* カメラで撮る */}
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="h-24 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/3 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs font-black text-foreground">カメラで撮る</p>
              </button>

              {/* ライブラリから選ぶ */}
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="h-24 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/3 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Images className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs font-black text-foreground">ライブラリ</p>
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs font-bold text-red-500">{error}</p>
      )}

      {/* カメラ専用 input */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />

      {/* ライブラリ専用 input（capture なし → ギャラリー表示） */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
