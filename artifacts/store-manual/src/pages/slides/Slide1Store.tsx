export default function Slide1Store() {
  const base = import.meta.env.BASE_URL;
  return (
    <div className="w-screen h-screen overflow-hidden relative" style={{ background: '#1a0800', fontFamily: "'Noto Sans JP', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

      {/* 背景: 食材写真 */}
      <img src={`${base}slide-hero.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35, filter: 'saturate(1.4)' }} />

      {/* ピンク斜めストライプ装飾 */}
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg, rgba(242,100,25,0.07) 0px, rgba(242,100,25,0.07) 2px, transparent 2px, transparent 18px)', pointerEvents: 'none' }} />

      {/* A4縦カード */}
      <div style={{
        position: 'relative', zIndex: 10,
        height: '96vh', width: '54vh',
        borderRadius: '2vh',
        overflow: 'hidden',
        boxShadow: '0 2vh 8vh rgba(0,0,0,0.7)',
        display: 'flex', flexDirection: 'column',
        background: '#fff',
      }}>

        {/* ▼ ヘッダー: 日付ドーン */}
        <div style={{ background: 'linear-gradient(160deg, #F26419 0%, #d94f0a 100%)', padding: '2.2vh 2vh 1.5vh', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* 食材写真オーバーレイ */}
          <img src={`${base}slide-hero.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18, filter: 'saturate(1.5)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* 日付 */}
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.5vh', marginBottom: '0.3vh' }}>
              <span style={{ fontSize: '8.5vh', fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: '0 0.3vh 1.2vh rgba(0,0,0,0.3)', letterSpacing: '-0.02em' }}>6/15</span>
              <span style={{ fontSize: '3vh', fontWeight: 900, color: '#FFE566', textShadow: '0 0.2vh 0.8vh rgba(0,0,0,0.3)' }}>日</span>
            </div>
            <div style={{ fontSize: '4.8vh', fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: '0 0.3vh 1.2vh rgba(0,0,0,0.25)', letterSpacing: '0.02em' }}>
              <span style={{ color: '#FFE566' }}>出品</span>開始！
            </div>
          </div>
        </div>

        {/* ▼ ロゴ帯 */}
        <div style={{ background: '#8DC63F', padding: '1.2vh 2vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.2vh' }}>
          <img src={`${base}logo.jpg`} alt="おすそわけ" style={{ width: '4.5vh', height: '4.5vh', borderRadius: '0.8vh', objectFit: 'cover', border: '0.3vh solid #fff' }} />
          <div>
            <div style={{ fontSize: '2.2vh', fontWeight: 900, color: '#fff', lineHeight: 1 }}>おすそわけ</div>
            <div style={{ fontSize: '1.1vh', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>フードシェアリングアプリ</div>
          </div>
          <div style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.25)', borderRadius: '0.8vh', padding: '0.5vh 1.2vh' }}>
            <div style={{ fontSize: '1.1vh', color: '#fff', fontWeight: 900 }}>北摂エリア</div>
            <div style={{ fontSize: '0.95vh', color: 'rgba(255,255,255,0.9)' }}>高槻・茨木中心</div>
          </div>
        </div>

        {/* ▼ メインコンテンツ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2vh 2.2vh', gap: '1.6vh', background: '#FAFAFA' }}>

          {/* キャッチ */}
          <div style={{ background: 'linear-gradient(135deg, #FFF4EE, #FFF9F5)', border: '0.25vh solid #F26419', borderRadius: '1.2vh', padding: '1.5vh 1.8vh', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4vh', fontWeight: 700, color: '#888', marginBottom: '0.5vh' }}>このお店に来たついでに</div>
            <div style={{ fontSize: '2.8vh', fontWeight: 900, color: '#1A1A1A', lineHeight: 1.25 }}>余った食材・お弁当を</div>
            <div style={{ fontSize: '2.8vh', fontWeight: 900, color: '#F26419', lineHeight: 1.25 }}>アプリでお得にゲット！</div>
          </div>

          {/* 説明 */}
          <div style={{ fontSize: '1.5vh', color: '#444', lineHeight: 1.85, textAlign: 'center' }}>
            近くのお店が余った食材やお弁当を<br />
            アプリに出品しています。<br />
            予約してお店に取りに来るだけで<br />
            <span style={{ fontWeight: 700, color: '#8DC63F' }}>食品ロス削減</span> に貢献できます。
          </div>

          {/* ステップ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9vh' }}>
            {[
              { num: '1', icon: '📲', text: 'アプリをダウンロード（無料）', sub: '下のQRコードを読み込むだけ' },
              { num: '2', icon: '🔍', text: '近くの出品を探す', sub: '高槻・茨木を中心に北摂エリア展開中' },
              { num: '3', icon: '🛍️', text: '予約→お店でピックアップ', sub: 'かんたん操作で完了！' },
            ].map(({ num, icon, text, sub }) => (
              <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '1.2vh', background: '#fff', border: '0.18vh solid #E8E8E8', borderRadius: '1vh', padding: '1vh 1.3vh', boxShadow: '0 0.2vh 0.6vh rgba(0,0,0,0.05)' }}>
                <div style={{ width: '3.5vh', height: '3.5vh', background: '#F26419', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '1.6vh', fontWeight: 900, color: '#fff' }}>{num}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.45vh', fontWeight: 700, color: '#1A1A1A' }}>{icon} {text}</div>
                  <div style={{ fontSize: '1.1vh', color: '#888', marginTop: '0.1vh' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* エリア */}
          <div style={{ background: '#8DC63F', borderRadius: '1vh', padding: '1vh 1.5vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8vh' }}>
            <span style={{ fontSize: '1.8vh' }}>📍</span>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.5vh' }}>高槻市・茨木市を中心とした北摂エリア</div>
          </div>
        </div>

        {/* ▼ QRフッター */}
        <div style={{ background: '#1A1A1A', padding: '1.6vh 1.5vh', display: 'flex', justifyContent: 'center', gap: '2vh', alignItems: 'flex-start' }}>
          {[
            { src: `${base}qr-appstore.jpeg`, label: 'App Store', sub: 'iPhone' },
            { src: `${base}web-signup-qr.png`, label: 'Web サイト', sub: 'Android' },
            { src: `${base}instagram-qr.png`, label: 'Instagram', sub: '@osusowake_official' },
          ].map(({ src, label, sub }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ background: '#fff', padding: '0.5vh', borderRadius: '0.7vh', marginBottom: '0.4vh' }}>
                <img src={src} alt={label} style={{ width: '6.5vh', height: '6.5vh', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ fontSize: '1.05vh', color: '#ccc', fontWeight: 700 }}>{label}</div>
              <div style={{ fontSize: '0.9vh', color: '#666' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
