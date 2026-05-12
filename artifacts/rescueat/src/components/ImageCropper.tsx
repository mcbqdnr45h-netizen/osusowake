import React, { useEffect, useRef, useState } from 'react';
import { X, Check, ZoomIn } from 'lucide-react';

type Props = {
  file: File;
  aspect?: number;
  outputMaxPx?: number;
  quality?: number;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
};

export function ImageCropper({
  file,
  aspect = 16 / 9,
  outputMaxPx = 1200,
  quality = 0.8,
  onCancel,
  onConfirm,
}: Props) {
  const [src, setSrc] = useState<string>('');
  const [imgSize, setImgSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [frameSize, setFrameSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setSrc(url);
        setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = () => onCancel();
      img.src = url;
    };
    reader.readAsDataURL(file);
  }, [file, onCancel]);

  useEffect(() => {
    if (!frameRef.current) return;
    const update = () => {
      if (!frameRef.current) return;
      const w = frameRef.current.clientWidth;
      const h = w / aspect;
      setFrameSize({ w, h });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(frameRef.current);
    return () => ro.disconnect();
  }, [aspect]);

  useEffect(() => {
    if (!imgSize.w || !frameSize.w) return;
    // 最小スケール = フレームを完全に覆うスケール
    const sx = frameSize.w / imgSize.w;
    const sy = frameSize.h / imgSize.h;
    const min = Math.max(sx, sy);
    setMinScale(min);
    setScale(min);
    setOffset({ x: 0, y: 0 });
  }, [imgSize, frameSize]);

  // ドラッグで位置調整。フレーム内に収まるようクランプ。
  const clampOffset = (x: number, y: number, s: number) => {
    const dispW = imgSize.w * s;
    const dispH = imgSize.h * s;
    const maxX = Math.max(0, (dispW - frameSize.w) / 2);
    const maxY = Math.max(0, (dispH - frameSize.h) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset(clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, scale));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    dragStart.current = null;
  };

  const handleScale = (newScale: number) => {
    const s = Math.max(minScale, Math.min(minScale * 4, newScale));
    setScale(s);
    setOffset((prev) => clampOffset(prev.x, prev.y, s));
  };

  const handleConfirm = () => {
    if (!src || !imgSize.w || !frameSize.w) return;
    // フレーム中心 = 画像中心 + offset。フレームに対応する画像の元座標を求める。
    const cx = imgSize.w / 2 - offset.x / scale;
    const cy = imgSize.h / 2 - offset.y / scale;
    const cropW = frameSize.w / scale;
    const cropH = frameSize.h / scale;
    const sx = Math.max(0, cx - cropW / 2);
    const sy = Math.max(0, cy - cropH / 2);

    // 出力サイズ
    let outW = cropW;
    let outH = cropH;
    if (outW > outputMaxPx || outH > outputMaxPx) {
      if (outW >= outH) { outH = outH * outputMaxPx / outW; outW = outputMaxPx; }
      else { outW = outW * outputMaxPx / outH; outH = outputMaxPx; }
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(outW);
    canvas.height = Math.round(outH);
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height);
      onConfirm(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = src;
  };

  const dispW = imgSize.w * scale;
  const dispH = imgSize.h * scale;

  return (
    <div className="fixed inset-0 z-[200] bg-black/85 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-background rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-black text-foreground">写真の位置を調整</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted" aria-label="キャンセル">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3 text-xs text-muted-foreground leading-relaxed bg-muted/40">
          指でドラッグして位置を調整、下のスライダーで拡大できます。枠の中に映る範囲が店舗写真として保存されます。
        </div>

        <div className="p-4">
          <div
            ref={frameRef}
            className="relative w-full bg-black overflow-hidden rounded-xl select-none touch-none"
            style={{ aspectRatio: `${aspect}` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {src && frameSize.w > 0 && (
              <img
                src={src}
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: dispW,
                  height: dispH,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  pointerEvents: 'none',
                  maxWidth: 'none',
                }}
              />
            )}
            {/* 中央ガイド */}
            <div className="pointer-events-none absolute inset-0 ring-2 ring-white/40 rounded-xl" />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="range"
              min={minScale}
              max={minScale * 4}
              step={(minScale * 3) / 100 || 0.01}
              value={scale}
              onChange={(e) => handleScale(parseFloat(e.target.value))}
              className="flex-1 accent-primary"
            />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-border flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-border font-bold text-foreground hover:bg-muted"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            disabled={!src || !frameSize.w}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-black flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            この位置で確定
          </button>
        </div>
      </div>
    </div>
  );
}
