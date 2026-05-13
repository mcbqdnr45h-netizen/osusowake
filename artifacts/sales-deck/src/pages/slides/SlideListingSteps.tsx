function PhoneMockup({ step, color, icon, label, sublabel, screenBg, children }: {
  step: number; color: string; icon: string; label: string; sublabel: string;
  screenBg?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      {/* Step number */}
      <div style={{ width: '4.5vh', height: '4.5vh', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.8vh', flexShrink: 0 }}>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2vh', fontWeight: 900, color: '#fff' }}>{step}</span>
      </div>
      {/* Phone frame */}
      <div style={{
        width: '17vw',
        aspectRatio: '9/18',
        borderRadius: '2.5vw',
        background: '#1C1C1E',
        padding: '1.5vw 0.8vw 1vw',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 12px 40px rgba(0,0,0,0.28)',
        marginBottom: '2.5vh',
        flexShrink: 0,
      }}>
        {/* Notch */}
        <div style={{ width: '6vw', height: '0.7vh', background: '#3A3A3C', borderRadius: '100px', alignSelf: 'center', marginBottom: '1.2vh' }} />
        {/* Screen */}
        <div style={{ flex: 1, borderRadius: '1.5vw', background: screenBg ?? '#FBF8F4', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
      {/* Label */}
      <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.9vw', fontWeight: 900, color: '#2A2623', textAlign: 'center', marginBottom: '0.8vh', lineHeight: 1.3 }}>
        {label}
      </p>
      <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A', textAlign: 'center', lineHeight: 1.5 }}>
        {sublabel}
      </p>
    </div>
  );
}

import React from 'react';

export default function SlideListingSteps() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#E8786C', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '4vh 6vw 3vh 5.5vw' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.14em', marginBottom: '1.2vh' }}>
            HOW TO LIST
          </p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3.8vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: '0.8vh' }}>
            超かんたん！3ステップ出品
          </h2>
          <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', color: '#8A7F7A', marginBottom: '3.5vh' }}>
            スマホがあれば、今すぐ始められます
          </p>

          {/* 3 Phones */}
          <div style={{ display: 'flex', gap: '3vw', alignItems: 'flex-start', flex: 1 }}>

            {/* Step 1: Photo */}
            <PhoneMockup step={1} color="#E8786C" icon="📸" label="写真をパシャッ！" sublabel={"余った商品を\nスマホで撮るだけ"} screenBg="#FBF8F4">
              {/* App header */}
              <div style={{ background: '#FBF8F4', padding: '0.8vw 0.8vw 0.4vw', borderBottom: '1px solid #EDE8E2' }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.9vw', fontWeight: 900, color: '#2A2623', textAlign: 'center' }}>商品を追加</div>
              </div>
              {/* Photo area */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.8vw', gap: '0.5vw' }}>
                <div style={{ flex: 1, background: '#F0EAE3', borderRadius: '0.8vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #E8786C', gap: '0.4vw' }}>
                  <span style={{ fontSize: '2.2vw' }}>📷</span>
                  <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.85vw', color: '#E8786C', fontWeight: 700 }}>タップして写真を選択</span>
                </div>
                <div style={{ background: '#E8786C', borderRadius: '0.6vw', padding: '0.5vw', textAlign: 'center' }}>
                  <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.85vw', fontWeight: 900, color: '#fff' }}>カメラで撮影</span>
                </div>
              </div>
            </PhoneMockup>

            {/* Divider arrow */}
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20vh', flexShrink: 0 }}>
              <span style={{ fontSize: '2.5vw', color: '#D4C8BC' }}>→</span>
            </div>

            {/* Step 2: Time + Qty */}
            <PhoneMockup step={2} color="#E8786C" icon="⏰" label="時間と個数をポチッ！" sublabel={"受取時間は\n自動で今の時刻に設定"} screenBg="#FBF8F4">
              <div style={{ background: '#FBF8F4', padding: '0.8vw 0.8vw 0.4vw', borderBottom: '1px solid #EDE8E2' }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.9vw', fontWeight: 900, color: '#2A2623', textAlign: 'center' }}>出品設定</div>
              </div>
              <div style={{ flex: 1, padding: '0.8vw', display: 'flex', flexDirection: 'column', gap: '0.6vw' }}>
                <div style={{ background: '#F5FAF4', borderRadius: '0.6vw', padding: '0.5vw 0.7vw', border: '1.5px solid #44A836' }}>
                  <div style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.65vw', color: '#44A836', fontWeight: 700, marginBottom: '0.2vw' }}>受取時間（自動設定）</div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1vw', fontWeight: 900, color: '#2A2623' }}>今すぐ〜21:00</div>
                </div>
                <div style={{ background: '#FDF0EE', borderRadius: '0.6vw', padding: '0.5vw 0.7vw', border: '1.5px solid #E8786C' }}>
                  <div style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.65vw', color: '#E8786C', fontWeight: 700, marginBottom: '0.2vw' }}>個数</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '1.8vw', height: '1.8vw', background: '#E8786C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#fff', fontSize: '1.2vw', fontWeight: 900 }}>−</span>
                    </div>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 900, color: '#2A2623' }}>3</span>
                    <div style={{ width: '1.8vw', height: '1.8vw', background: '#E8786C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#fff', fontSize: '1.2vw', fontWeight: 900 }}>＋</span>
                    </div>
                  </div>
                </div>
                <div style={{ background: '#F5FAF4', borderRadius: '0.6vw', padding: '0.5vw 0.7vw' }}>
                  <div style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.65vw', color: '#8A7F7A', marginBottom: '0.2vw' }}>販売価格</div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1vw', fontWeight: 900, color: '#44A836' }}>¥ 500</div>
                </div>
              </div>
            </PhoneMockup>

            {/* Divider arrow */}
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20vh', flexShrink: 0 }}>
              <span style={{ fontSize: '2.5vw', color: '#D4C8BC' }}>→</span>
            </div>

            {/* Step 3: Publish */}
            <PhoneMockup step={3} color="#44A836" icon="🎉" label="出品ボタンをポンッ！" sublabel={"これで完了！近くの\nお客様に通知が届きます"} screenBg="#FBF8F4">
              <div style={{ background: '#FBF8F4', padding: '0.8vw 0.8vw 0.4vw', borderBottom: '1px solid #EDE8E2' }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.9vw', fontWeight: 900, color: '#2A2623', textAlign: 'center' }}>出品管理</div>
              </div>
              <div style={{ flex: 1, padding: '0.8vw', display: 'flex', flexDirection: 'column', gap: '0.6vw', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, background: '#F0EAE3', borderRadius: '0.6vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '2vw' }}>🥐</span>
                </div>
                {/* The pink/red big button */}
                <div style={{ background: 'linear-gradient(135deg, #E8786C, #D44A00)', borderRadius: '0.7vw', padding: '0.7vw', textAlign: 'center', boxShadow: '0 4px 12px rgba(232,120,108,0.45)' }}>
                  <div style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.75vw', fontWeight: 900, color: '#fff', lineHeight: 1.3 }}>
                    ＋ 本日のおすそわけを出品する
                  </div>
                </div>
                {/* Success state hint */}
                <div style={{ background: '#F5FAF4', border: '1px solid #44A836', borderRadius: '0.5vw', padding: '0.4vw 0.6vw', display: 'flex', alignItems: 'center', gap: '0.4vw' }}>
                  <span style={{ fontSize: '0.9vw' }}>✅</span>
                  <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.65vw', fontWeight: 700, color: '#44A836' }}>近くのユーザーに通知送信中！</span>
                </div>
              </div>
            </PhoneMockup>

          </div>

          {/* Bottom tag */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5vh' }}>
            <div style={{ background: '#FDF0EE', border: '1px solid #E8786C', borderRadius: '100px', padding: '0.7vh 2vw', display: 'inline-flex', alignItems: 'center', gap: '0.8vw' }}>
              <span style={{ fontSize: '1.6vw' }}>⏱</span>
              <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', fontWeight: 900, color: '#E8786C' }}>写真を撮って、個数を入れるだけ。慣れたら1分以内で完了！</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
