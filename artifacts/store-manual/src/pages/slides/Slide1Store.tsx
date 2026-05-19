export default function Slide1Store() {
  const base = import.meta.env.BASE_URL;
  return (
    <div className="w-screen h-screen overflow-hidden relative" style={{ background: '#F0EDE8', fontFamily: "'Noto Sans JP', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* A4縦比率カード (約56vw × 100vh相当、16:9フレームに合わせ高さを基準) */}
      <div style={{
        background: '#FBFBFA',
        height: '96vh',
        width: '54vh',
        borderRadius: '2vh',
        boxShadow: '0 1vh 4vh rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* ヘッダー帯 */}
        <div style={{ background: '#F26419', padding: '2.2vh 2.5vh 1.8vh', display: 'flex', alignItems: 'center', gap: '1.5vh' }}>
          <img src={`${base}logo.jpg`} alt="おすそわけ" style={{ width: '6vh', height: '6vh', borderRadius: '1vh', objectFit: 'cover', flexShrink: 0 }} />
          <div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '2.6vh', lineHeight: 1.1 }}>おすそわけ</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.3vh', fontWeight: 700 }}>フードシェアリングアプリ</div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2.5vh 2.5vh 0', gap: '2vh' }}>
          {/* キャッチ */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5vh', fontWeight: 700, color: '#F26419', marginBottom: '0.8vh', letterSpacing: '0.04em' }}>このお店の食材を捨てる前に</div>
            <div style={{ fontSize: '3.4vh', fontWeight: 900, color: '#1A1A1A', lineHeight: 1.2, marginBottom: '0.5vh' }}>アプリで買って</div>
            <div style={{ fontSize: '3.4vh', fontWeight: 900, color: '#F26419', lineHeight: 1.2, marginBottom: '0.5vh' }}>食品ロスを救おう！</div>
            <div style={{ width: '6vh', height: '0.4vh', background: '#F26419', borderRadius: '1vh', margin: '1.2vh auto', opacity: 0.5 }} />
          </div>

          {/* 説明文 */}
          <div style={{ background: '#FFF4EE', borderRadius: '1.2vh', padding: '1.5vh 1.8vh', fontSize: '1.55vh', color: '#444', lineHeight: 1.85, textAlign: 'center' }}>
            お店が余った食材やお弁当・パンなどを<br />
            <span style={{ fontWeight: 700, color: '#F26419' }}>最大 70% OFF</span> でアプリに出品中！<br />
            予約してお店に取りに来るだけで<br />
            <span style={{ fontWeight: 700, color: '#27ae60' }}>食品ロス削減</span> に貢献できます。
          </div>

          {/* ステップ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1vh' }}>
            {[
              { icon: '📲', step: 'STEP 1', label: 'アプリをダウンロード', sub: '下のQRを読み込むだけ (無料)' },
              { icon: '🔍', step: 'STEP 2', label: '近くの出品を探す', sub: '高槻・摂津・大阪エリア展開中' },
              { icon: '🛍️', step: 'STEP 3', label: 'タップして予約→受け取り', sub: 'お店に取りに来るだけ！' },
            ].map(({ icon, step, label, sub }) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '1.5vh', background: '#fff', border: '0.2vh solid #eee', borderRadius: '1.2vh', padding: '1.2vh 1.5vh' }}>
                <div style={{ fontSize: '2.8vh', flexShrink: 0 }}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.1vh', fontWeight: 900, color: '#F26419', letterSpacing: '0.05em' }}>{step}</div>
                  <div style={{ fontSize: '1.55vh', fontWeight: 700, color: '#1A1A1A' }}>{label}</div>
                  <div style={{ fontSize: '1.2vh', color: '#888' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* エリア */}
          <div style={{ textAlign: 'center', background: '#F0FFF5', borderRadius: '1vh', padding: '1vh', border: '0.2vh solid #2ECC71' }}>
            <div style={{ fontSize: '1.3vh', fontWeight: 700, color: '#27ae60' }}>📍 現在の対応エリア</div>
            <div style={{ fontSize: '1.45vh', color: '#1A1A1A', fontWeight: 700, marginTop: '0.3vh' }}>高槻市・摂津市・大阪市 ほか拡大中</div>
          </div>
        </div>

        {/* QRフッター */}
        <div style={{ background: '#1A1A1A', padding: '1.8vh 2vh', display: 'flex', justifyContent: 'center', gap: '2.5vh', alignItems: 'flex-start', marginTop: '2vh' }}>
          {[
            { src: `${base}qr-appstore.jpeg`, label: 'App Store', sub: 'iPhone' },
            { src: `${base}web-signup-qr.png`, label: 'Web サイト', sub: 'Android' },
            { src: `${base}instagram-qr.png`, label: 'Instagram', sub: '@osusowake_official' },
          ].map(({ src, label, sub }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ background: '#fff', padding: '0.6vh', borderRadius: '0.8vh', marginBottom: '0.5vh' }}>
                <img src={src} alt={label} style={{ width: '7vh', height: '7vh', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ fontSize: '1.1vh', color: '#ccc', fontWeight: 700 }}>{label}</div>
              <div style={{ fontSize: '0.95vh', color: '#777' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
