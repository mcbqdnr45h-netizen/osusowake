export default function Slide2User() {
  const base = import.meta.env.BASE_URL;
  return (
    <div className="w-screen h-screen overflow-hidden relative" style={{ background: '#081a00', fontFamily: "'Noto Sans JP', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

      {/* 背景: 食材写真 */}
      <img src={`${base}slide-hero.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.32, filter: 'saturate(1.5) hue-rotate(10deg)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg, rgba(141,198,63,0.06) 0px, rgba(141,198,63,0.06) 2px, transparent 2px, transparent 18px)', pointerEvents: 'none' }} />

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

        {/* ▼ ヘッダー */}
        <div style={{ background: 'linear-gradient(160deg, #8DC63F 0%, #6aab1a 100%)', padding: '2.2vh 2vh 1.5vh', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <img src={`${base}slide-hero.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '1.4vh', fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: '0.3vh', letterSpacing: '0.1em' }}>北摂エリア（高槻・茨木中心）</div>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.5vh', marginBottom: '0.2vh' }}>
              <span style={{ fontSize: '8.5vh', fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: '0 0.3vh 1.2vh rgba(0,0,0,0.25)', letterSpacing: '-0.02em' }}>6/15</span>
              <span style={{ fontSize: '3vh', fontWeight: 900, color: '#FFE566', textShadow: '0 0.2vh 0.8vh rgba(0,0,0,0.2)' }}>日</span>
            </div>
            <div style={{ fontSize: '4.8vh', fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: '0 0.3vh 1.2vh rgba(0,0,0,0.2)', letterSpacing: '0.02em' }}>
              <span style={{ color: '#FFE566' }}>出品</span>開始！
            </div>
          </div>
        </div>

        {/* ▼ ロゴ帯 */}
        <div style={{ background: '#F26419', padding: '1.2vh 2vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.2vh' }}>
          <img src={`${base}logo.jpg`} alt="おすそわけ" style={{ width: '4.5vh', height: '4.5vh', borderRadius: '0.8vh', objectFit: 'cover', border: '0.3vh solid rgba(255,255,255,0.6)' }} />
          <div>
            <div style={{ fontSize: '2.2vh', fontWeight: 900, color: '#fff', lineHeight: 1 }}>おすそわけ</div>
            <div style={{ fontSize: '1.1vh', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>フードシェアリングアプリ 完全無料</div>
          </div>
        </div>

        {/* ▼ メインコンテンツ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2vh 2.2vh', gap: '1.6vh', background: '#FAFAFA' }}>

          {/* キャッチ */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.6vh', fontWeight: 900, color: '#1A1A1A', lineHeight: 1.25 }}>近くのお店の食材が</div>
            <div style={{ fontSize: '2.6vh', fontWeight: 900, color: '#F26419', lineHeight: 1.25 }}>お得にゲットできる！</div>
            <div style={{ width: '5vh', height: '0.4vh', background: '#8DC63F', borderRadius: '1vh', margin: '1vh auto' }} />
          </div>

          {/* バッジ */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2vh' }}>
            <div style={{ background: '#FFF4EE', border: '0.2vh solid #F26419', borderRadius: '1vh', padding: '0.9vh 1.2vh', textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '2vh' }}>🛍️</div>
              <div style={{ fontSize: '1.1vh', fontWeight: 900, color: '#F26419', marginTop: '0.2vh' }}>お得に購入</div>
            </div>
            <div style={{ background: '#F0FFF5', border: '0.2vh solid #8DC63F', borderRadius: '1vh', padding: '0.9vh 1.2vh', textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '2vh' }}>🌱</div>
              <div style={{ fontSize: '1.1vh', fontWeight: 900, color: '#6aab1a', marginTop: '0.2vh' }}>食品ロス削減</div>
            </div>
            <div style={{ background: '#FFF9E6', border: '0.2vh solid #F0C000', borderRadius: '1vh', padding: '0.9vh 1.2vh', textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '2vh' }}>📍</div>
              <div style={{ fontSize: '1.1vh', fontWeight: 900, color: '#b8860b', marginTop: '0.2vh' }}>北摂エリア</div>
            </div>
          </div>

          {/* 説明 */}
          <div style={{ background: '#fff', border: '0.18vh solid #E8E8E8', borderRadius: '1.2vh', padding: '1.5vh 1.8vh', fontSize: '1.48vh', color: '#444', lineHeight: 1.9, textAlign: 'center', boxShadow: '0 0.2vh 0.8vh rgba(0,0,0,0.05)' }}>
            レストラン・ベーカリー・カフェなどが<br />
            余ったお弁当や食材を出品中！<br />
            <span style={{ fontWeight: 700, color: '#F26419' }}>アプリで予約してお店に取りに行くだけ。</span><br />
            買うだけで地球に優しい。
          </div>

          {/* ステップ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9vh' }}>
            {[
              { num: '1', text: 'アプリをダウンロード（無料）', sub: 'App Store または osusowakejapan.org' },
              { num: '2', text: 'マップで出品を探す', sub: '高槻・茨木を中心に北摂エリア対応' },
              { num: '3', text: '予約→お店でピックアップ', sub: '取りに行くだけ！簡単操作' },
            ].map(({ num, text, sub }) => (
              <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '1.2vh', background: '#fff', border: '0.18vh solid #E8E8E8', borderRadius: '1vh', padding: '0.9vh 1.2vh', boxShadow: '0 0.15vh 0.5vh rgba(0,0,0,0.04)' }}>
                <div style={{ width: '3.2vh', height: '3.2vh', background: '#8DC63F', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '1.5vh', fontWeight: 900, color: '#fff' }}>{num}</span>
                </div>
                <div>
                  <div style={{ fontSize: '1.42vh', fontWeight: 700, color: '#1A1A1A' }}>{text}</div>
                  <div style={{ fontSize: '1.1vh', color: '#888' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* エリア帯 */}
          <div style={{ background: 'linear-gradient(90deg, #F26419, #8DC63F)', borderRadius: '1vh', padding: '0.9vh 1.5vh', textAlign: 'center' }}>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.42vh' }}>📍 高槻市・茨木市を中心とした北摂エリアで展開中</div>
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
