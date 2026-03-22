import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, X, Loader2 } from 'lucide-react';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  required?: boolean;
}

export function ImageUpload({ value, onChange, required }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
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
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-black/80 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            変更
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-48 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/3 transition-all group disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-bold text-muted-foreground">アップロード中...</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <ImagePlus className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-foreground">写真を追加</p>
                <p className="text-xs text-muted-foreground mt-0.5">タップしてカメラロールから選択</p>
              </div>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-xs font-bold text-red-500">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
