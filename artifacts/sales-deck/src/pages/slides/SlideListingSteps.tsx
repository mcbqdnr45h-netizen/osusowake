import React from 'react';

function StatusBar({ light = false }: { light?: boolean }) {
  const c = light ? 'rgba(251,248,244,0.9)' : '#2A2623';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5vw 1vw 0.2vw', flexShrink: 0 }}>
      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.75vw', fontWeight: 700, color: c }}>9:41</span>
      <div style={{ display: 'flex', gap: '0.25vw', alignItems: 'center' }}>
        {/* Signal bars */}
        <svg width="1vw" height="0.8vw" viewBox="0 0 13 10" style={{ width: '0.9vw', height: '0.7vw' }}>
          <rect x="0" y="6" width="2.5" height="4" rx="0.5" fill={c} opacity="1"/>
          <rect x="3.5" y="4" width="2.5" height="6" rx="0.5" fill={c} opacity="1"/>
          <rect x="7" y="2" width="2.5" height="8" rx="0.5" fill={c} opacity="1"/>
          <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill={c} opacity="0.35"/>
        </svg>
        {/* WiFi */}
        <svg width="1vw" height="0.8vw" viewBox="0 0 14 10" style={{ width: '0.9vw', height: '0.7vw' }}>
          <path d="M7 8.5 C6.17 8.5 5.5 9.17 5.5 10" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M3.5 6 Q7 3.5 10.5 6" stroke={c} strokeWidth="1.3" fill="none" strokeLinecap="round"/>
          <path d="M1 3.5 Q7 -0.5 13 3.5" stroke={c} strokeWidth="1.3" fill="none" strokeLinecap="round"/>
        </svg>
        {/* Battery */}
        <svg width="1.4vw" height="0.8vw" viewBox="0 0 22 11" style={{ width: '1.3vw', height: '0.7vw' }}>
          <rect x="0.5" y="0.5" width="18" height="10" rx="2" stroke={c} strokeWidth="1" fill="none"/>
          <rect x="19" y="3.5" width="2.5" height="4" rx="1" fill={c} opacity="0.5"/>
          <rect x="1.5" y="1.5" width="14" height="8" rx="1.2" fill="#44A836"/>
        </svg>
      </div>
    </div>
  );
}

function DynamicIsland() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.3vw', flexShrink: 0 }}>
      <div style={{ width: '4.5vw', height: '0.9vw', background: '#1C1C1E', borderRadius: '100px' }} />
    </div>
  );
}

function HomeBar({ light = false }: { light?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '0.4vw', paddingTop: '0.3vw', flexShrink: 0 }}>
      <div style={{ width: '5vw', height: '0.3vw', background: light ? 'rgba(255,255,255,0.35)' : 'rgba(42,38,35,0.28)', borderRadius: '100px' }} />
    </div>
  );
}

function NavBar({ label }: { label: string }) {
  return (
    <div style={{ background: '#FBF8F4', borderBottom: '1px solid #EDE8E2', padding: '0.5vw 0.8vw', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
      <div style={{ position: 'absolute', left: '0.7vw', width: '1.2vw', height: '1.2vw', borderRadius: '50%', background: '#F0EAE3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.6vw', color: '#8A7F7A' }}>‹</span>
      </div>
      <span style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.75vw', fontWeight: 900, color: '#2A2623' }}>{label}</span>
    </div>
  );
}

function PhoneMockup({ step, stepColor, label, sublabel, children }: {
  step: number; stepColor: string; label: string; sublabel: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      {/* Step badge */}
      <div style={{
        width: '4.2vh', height: '4.2vh', borderRadius: '50%',
        background: stepColor, display: 'flex', alignItems: 'center',
        justifyContent: 'center', marginBottom: '1.5vh', flexShrink: 0,
        boxShadow: `0 4px 14px ${stepColor}55`,
      }}>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2vh', fontWeight: 900, color: '#fff' }}>{step}</span>
      </div>

      {/* Phone shell */}
      <div style={{
        width: '14.5vw',
        aspectRatio: '9 / 19.5',
        borderRadius: '2vw',
        background: 'linear-gradient(160deg, #2E2E30 0%, #1A1A1C 100%)',
        padding: '0.5vw',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
        marginBottom: '1.5vh',
        flexShrink: 0,
        border: '0.5px solid rgba(255,255,255,0.1)',
      }}>
        {/* Inner screen */}
        <div style={{
          flex: 1,
          borderRadius: '1.8vw',
          background: '#FBF8F4',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <StatusBar />
          <DynamicIsland />
          {children}
          <HomeBar />
        </div>
      </div>

      {/* Label */}
      <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '1.75vw', fontWeight: 900, color: '#2A2623', textAlign: 'center', marginBottom: '0.5vh', lineHeight: 1.3 }}>
        {label}
      </p>
      <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '1.35vw', color: '#8A7F7A', textAlign: 'center', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
        {sublabel}
      </p>
    </div>
  );
}

export default function SlideListingSteps() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#E8786C', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '3.5vh 6vw 2.5vh 5.5vw' }}>

          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.14em', marginBottom: '0.8vh' }}>
            HOW TO LIST
          </p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3.6vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: '0.6vh' }}>
            超かんたん！3ステップ出品
          </h2>
          <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '1.6vw', color: '#8A7F7A', marginBottom: '2.5vh' }}>
            スマホがあれば、今すぐ始められます
          </p>

          {/* 3 Phones */}
          <div style={{ display: 'flex', gap: '2vw', alignItems: 'flex-start', flex: 1, minHeight: 0 }}>

            {/* ─── Step 1: Photo ─── */}
            <PhoneMockup step={1} stepColor="#E8786C" label="写真をパシャッ！" sublabel={"余った商品を\nスマホで撮るだけ"}>
              <NavBar label="商品を追加" />
              <div style={{ flex: 1, padding: '0.8vw 0.7vw', display: 'flex', flexDirection: 'column', gap: '0.5vw', overflow: 'hidden' }}>
                {/* Photo upload zone */}
                <div style={{
                  flex: 1.4,
                  background: '#F5EFE8',
                  borderRadius: '0.8vw',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  border: '2px dashed #E8786C', gap: '0.4vw',
                }}>
                  <div style={{ width: '3vw', height: '3vw', borderRadius: '50%', background: 'rgba(232,120,108,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.4vw' }}>📷</span>
                  </div>
                  <span style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.7vw', color: '#E8786C', fontWeight: 700 }}>タップして写真を選択</span>
                  <span style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.6vw', color: '#C4937F' }}>JPG・PNG・HEIF 対応</span>
                </div>
                {/* OR divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4vw' }}>
                  <div style={{ flex: 1, height: '1px', background: '#EDE8E2' }} />
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.6vw', color: '#B4A89E', fontWeight: 700 }}>OR</span>
                  <div style={{ flex: 1, height: '1px', background: '#EDE8E2' }} />
                </div>
                {/* Camera button */}
                <div style={{
                  background: 'linear-gradient(135deg, #E8786C, #D44A00)',
                  borderRadius: '0.6vw', padding: '0.55vw',
                  textAlign: 'center',
                  boxShadow: '0 3px 10px rgba(232,120,108,0.4)',
                }}>
                  <span style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.72vw', fontWeight: 900, color: '#fff' }}>📸　カメラで今すぐ撮影</span>
                </div>
                {/* Helper text */}
                <div style={{ background: '#FDF0EE', borderRadius: '0.5vw', padding: '0.35vw 0.6vw' }}>
                  <span style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.6vw', color: '#C4937F' }}>💡 正方形に近い写真がきれいに表示されます</span>
                </div>
              </div>
            </PhoneMockup>

            {/* Arrow */}
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '22vh', flexShrink: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5vh' }}>
                <div style={{ width: '2.5vw', height: '1.5px', background: '#D4C8BC' }} />
                <div style={{ width: 0, height: 0, borderTop: '0.5vh solid transparent', borderBottom: '0.5vh solid transparent', borderLeft: '0.8vw solid #D4C8BC' }} />
              </div>
            </div>

            {/* ─── Step 2: Time + Qty ─── */}
            <PhoneMockup step={2} stepColor="#E8786C" label="時間と個数をポチッ！" sublabel={"受取時間は今の時刻に\n自動で設定されます"}>
              <NavBar label="出品設定" />
              <div style={{ flex: 1, padding: '0.7vw', display: 'flex', flexDirection: 'column', gap: '0.5vw', overflow: 'hidden' }}>
                {/* Receipt time */}
                <div style={{ background: '#F5FAF4', borderRadius: '0.7vw', padding: '0.55vw 0.7vw', border: '1.5px solid #44A836' }}>
                  <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.6vw', color: '#44A836', fontWeight: 700, marginBottom: '0.15vw' }}>🕐 受取時間（自動設定）</div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.05vw', fontWeight: 900, color: '#2A2623' }}>今すぐ〜21:00</div>
                  <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.55vw', color: '#44A836', marginTop: '0.1vw' }}>現在時刻から自動で入力されます</div>
                </div>
                {/* Qty */}
                <div style={{ background: '#FDF0EE', borderRadius: '0.7vw', padding: '0.55vw 0.7vw', border: '1.5px solid #E8786C' }}>
                  <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.6vw', color: '#E8786C', fontWeight: 700, marginBottom: '0.3vw' }}>個数</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '2vw', height: '2vw', background: '#E8786C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(232,120,108,0.4)' }}>
                      <span style={{ color: '#fff', fontSize: '1.1vw', fontWeight: 900, lineHeight: 1 }}>−</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2vw', fontWeight: 900, color: '#2A2623' }}>3</span>
                      <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.55vw', color: '#8A7F7A' }}>個</div>
                    </div>
                    <div style={{ width: '2vw', height: '2vw', background: '#E8786C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(232,120,108,0.4)' }}>
                      <span style={{ color: '#fff', fontSize: '1.1vw', fontWeight: 900, lineHeight: 1 }}>＋</span>
                    </div>
                  </div>
                </div>
                {/* Price */}
                <div style={{ background: '#FAFAF8', borderRadius: '0.7vw', padding: '0.55vw 0.7vw', border: '1px solid #EDE8E2' }}>
                  <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.6vw', color: '#8A7F7A', marginBottom: '0.15vw' }}>販売価格</div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1vw', fontWeight: 900, color: '#44A836' }}>¥ 500</div>
                </div>
                {/* Product name */}
                <div style={{ background: '#FAFAF8', borderRadius: '0.7vw', padding: '0.5vw 0.7vw', border: '1px solid #EDE8E2' }}>
                  <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.6vw', color: '#8A7F7A', marginBottom: '0.15vw' }}>商品名</div>
                  <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.75vw', fontWeight: 700, color: '#2A2623' }}>本日のパンセット</div>
                </div>
              </div>
            </PhoneMockup>

            {/* Arrow */}
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '22vh', flexShrink: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5vh' }}>
                <div style={{ width: '2.5vw', height: '1.5px', background: '#D4C8BC' }} />
                <div style={{ width: 0, height: 0, borderTop: '0.5vh solid transparent', borderBottom: '0.5vh solid transparent', borderLeft: '0.8vw solid #D4C8BC' }} />
              </div>
            </div>

            {/* ─── Step 3: Publish ─── */}
            <PhoneMockup step={3} stepColor="#44A836" label="出品ボタンをポンッ！" sublabel={"これで完了！\n近くのお客様に通知が届きます"}>
              <NavBar label="出品管理" />
              <div style={{ flex: 1, padding: '0.7vw', display: 'flex', flexDirection: 'column', gap: '0.5vw', overflow: 'hidden', justifyContent: 'space-between' }}>
                {/* Product preview card */}
                <div style={{ background: '#FFF', borderRadius: '0.8vw', border: '1px solid #EDE8E2', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '3.5vw', background: 'linear-gradient(135deg, #F5EFE8 0%, #EDE3D8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.8vw' }}>🥐</span>
                  </div>
                  <div style={{ padding: '0.4vw 0.6vw' }}>
                    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.7vw', fontWeight: 900, color: '#2A2623', marginBottom: '0.1vw' }}>本日のパンセット</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.85vw', fontWeight: 900, color: '#44A836' }}>¥500</span>
                      <span style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.58vw', color: '#8A7F7A' }}>残り 3個</span>
                    </div>
                  </div>
                </div>

                {/* Publish button — THE highlight */}
                <div style={{
                  background: 'linear-gradient(135deg, #F97B6C 0%, #D44A00 100%)',
                  borderRadius: '0.8vw',
                  padding: '0.8vw 0.6vw',
                  textAlign: 'center',
                  boxShadow: '0 6px 20px rgba(232,120,108,0.55)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Shimmer effect */}
                  <div style={{ position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', transform: 'skewX(-15deg)' }} />
                  <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.82vw', fontWeight: 900, color: '#fff', lineHeight: 1.3 }}>
                    ＋ 本日のおすそわけを出品する
                  </div>
                </div>

                {/* Success notification */}
                <div style={{
                  background: '#F5FAF4',
                  border: '1.5px solid #44A836',
                  borderRadius: '0.6vw',
                  padding: '0.45vw 0.6vw',
                  display: 'flex', alignItems: 'center', gap: '0.4vw',
                }}>
                  <div style={{ width: '1.3vw', height: '1.3vw', borderRadius: '50%', background: '#44A836', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontSize: '0.7vw', fontWeight: 900 }}>✓</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.62vw', fontWeight: 900, color: '#44A836' }}>出品完了！</div>
                    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.58vw', color: '#5A7F54' }}>近くのお客様に通知を送信中…</div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: '0.4vw' }}>
                  <div style={{ flex: 1, background: '#FDF0EE', borderRadius: '0.5vw', padding: '0.35vw', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.9vw', fontWeight: 900, color: '#E8786C' }}>0</div>
                    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.55vw', color: '#8A7F7A' }}>出品中</div>
                  </div>
                  <div style={{ flex: 1, background: '#EEF5F5', borderRadius: '0.5vw', padding: '0.35vw', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.9vw', fontWeight: 900, color: '#2A6CC4' }}>0</div>
                    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.55vw', color: '#8A7F7A' }}>本日予約</div>
                  </div>
                  <div style={{ flex: 1, background: '#F5FAF4', borderRadius: '0.5vw', padding: '0.35vw', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.9vw', fontWeight: 900, color: '#44A836' }}>0</div>
                    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '0.55vw', color: '#8A7F7A' }}>受取済</div>
                  </div>
                </div>
              </div>
            </PhoneMockup>

          </div>


        </div>
      </div>
    </div>
  );
}
