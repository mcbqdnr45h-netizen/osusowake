export default function Slide2User() {
  const base = import.meta.env.BASE_URL;
  return (
    <div className="w-screen h-screen overflow-hidden relative" style={{ background: '#F0F5E8', fontFamily: "'Noto Sans JP', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* A4縦カード */}
      <div style={{
        height: '96vh', width: '54vh',
        borderRadius: '2vh',
        overflow: 'hidden',
        boxShadow: '0 1.5vh 6vh rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        background: '#fff',
      }}>

        {/* ▼ ヘッダー */}
        <div style={{ background: 'linear-gradient(160deg, #F48D82 0%, #C85A50 100%)', padding: '2vh 2vh 1.8vh', textAlign: 'center' }}>
          <div style={{ fontSize: '1.3vh', fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: '0.3vh', letterSpacing: '0.08em' }}>北摂エリア（高槻・茨木中心）</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6vh', marginBottom: '0.2vh' }}>
            <span style={{ fontSize: '7.8vh', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em', textShadow: '0 0.2vh 0.8vh rgba(0,0,0,0.15)' }}>6/15</span>
            <span style={{ fontSize: '2.8vh', fontWeight: 900, color: '#FFE566', alignSelf: 'flex-end', paddingBottom: '0.6vh' }}>日</span>
          </div>
          <div style={{ fontSize: '4.4vh', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '0.04em', textShadow: '0 0.2vh 0.8vh rgba(0,0,0,0.12)' }}>
            <span style={{ color: '#FFE566' }}>出品</span>開始！
          </div>
        </div>

        {/* ▼ ロゴ帯 */}
        <div style={{ background: '#8DC63F', padding: '1.1vh 2vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.2vh' }}>
          <img src={`${base}logo.jpg`} alt="おすそわけ" style={{ width: '4.2vh', height: '4.2vh', borderRadius: '0.8vh', objectFit: 'cover', border: '0.25vh solid rgba(255,255,255,0.6)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '2.1vh', fontWeight: 900, color: '#fff', lineHeight: 1 }}>おすそわけ</div>
            <div style={{ fontSize: '1.05vh', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>フードシェアリングアプリ 完全無料</div>
          </div>
        </div>

        {/* ▼ メインコンテンツ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2vh 2.2vh', gap: '1.5vh', background: '#FAFAFA' }}>

          {/* キャッチ */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.6vh', fontWeight: 900, color: '#1A1A1A', lineHeight: 1.25 }}>近くのお店の食材が</div>
            <div style={{ fontSize: '2.6vh', fontWeight: 900, color: '#E87A6D', lineHeight: 1.25 }}>お得にゲットできる！</div>
            <div style={{ width: '5vh', height: '0.4vh', background: '#8DC63F', borderRadius: '1vh', margin: '0.8vh auto' }} />
          </div>

          {/* バッジ */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2vh' }}>
            <div style={{ background: '#FFF4EE', border: '0.2vh solid #E87A6D', borderRadius: '1vh', padding: '0.9vh 1vh', textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '2vh' }}>🛍️</div>
              <div style={{ fontSize: '1.1vh', fontWeight: 900, color: '#E87A6D', marginTop: '0.2vh' }}>お得に購入</div>
            </div>
            <div style={{ background: '#F0FFF5', border: '0.2vh solid #8DC63F', borderRadius: '1vh', padding: '0.9vh 1vh', textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '2vh' }}>🌱</div>
              <div style={{ fontSize: '1.1vh', fontWeight: 900, color: '#6aab1a', marginTop: '0.2vh' }}>食品ロス削減</div>
            </div>
            <div style={{ background: '#FFF9E6', border: '0.2vh solid #F0C000', borderRadius: '1vh', padding: '0.9vh 1vh', textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '2vh' }}>📍</div>
              <div style={{ fontSize: '1.1vh', fontWeight: 900, color: '#b8860b', marginTop: '0.2vh' }}>北摂エリア</div>
            </div>
          </div>

          {/* アプリ画像 + 説明 */}
          <div style={{ display: 'flex', gap: '1.5vh', alignItems: 'center' }}>
            <div style={{ flexShrink: 0, width: '18vh', borderRadius: '1.5vh', overflow: 'hidden', boxShadow: '0 0.5vh 2vh rgba(0,0,0,0.15)', border: '0.3vh solid #E8E8E8' }}>
              <img src={`${base}app-screenshot.png`} alt="アプリ画面" style={{ width: '100%', display: 'block' }} />
            </div>
            <div style={{ fontSize: '1.38vh', color: '#444', lineHeight: 1.85 }}>
              レストラン・<br />
              ベーカリー・<br />
              カフェなどが<br />
              余ったお弁当や<br />
              食材を出品中！<br />
              <span style={{ fontWeight: 700, color: '#E87A6D' }}>予約して<br />取りに行くだけ。</span><br />
              買うだけで<br />
              地球に優しい。
            </div>
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
          <div style={{ background: 'linear-gradient(90deg, #E87A6D, #8DC63F)', borderRadius: '1vh', padding: '0.9vh 1.5vh', textAlign: 'center' }}>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.4vh' }}>📍 高槻市・茨木市を中心とした北摂エリアで展開中</div>
          </div>
        </div>

        {/* ▼ QRフッター */}
        <div style={{ background: '#E87A6D', padding: '1.6vh 1.5vh', display: 'flex', justifyContent: 'center', gap: '2vh', alignItems: 'flex-start' }}>
          {[
            { src: `${base}qr-appstore.jpeg`, label: 'App Store', sub: 'iPhone' },
            { src: `${base}web-signup-qr.png`, label: 'Web サイト', sub: 'Android' },
            { src: `${base}instagram-qr.png`, label: 'Instagram', sub: '@osusowake_official' },
          ].map(({ src, label, sub }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ background: '#fff', padding: '0.5vh', borderRadius: '0.7vh', marginBottom: '0.4vh' }}>
                <img src={src} alt={label} style={{ width: '6.5vh', height: '6.5vh', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ fontSize: '1.05vh', color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>{label}</div>
              <div style={{ fontSize: '0.9vh', color: 'rgba(255,255,255,0.7)' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
