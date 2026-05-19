export default function Slide2User() {
  const base = import.meta.env.BASE_URL;
  return (
    <div className="w-screen h-screen overflow-hidden relative" style={{ background: '#E8F4F0', fontFamily: "'Noto Sans JP', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <div style={{ background: 'linear-gradient(135deg, #F26419 0%, #e05a10 100%)', padding: '2.2vh 2.5vh 1.8vh', textAlign: 'center' }}>
          <img src={`${base}logo.jpg`} alt="おすそわけ" style={{ width: '7vh', height: '7vh', borderRadius: '1.5vh', objectFit: 'cover', margin: '0 auto 0.8vh', display: 'block', border: '0.3vh solid rgba(255,255,255,0.5)' }} />
          <div style={{ color: '#fff', fontWeight: 900, fontSize: '2.4vh', lineHeight: 1.1 }}>おすそわけ</div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.2vh', marginTop: '0.3vh' }}>フードシェアリングアプリ</div>
        </div>

        {/* メインコンテンツ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2.2vh 2.5vh 0', gap: '1.8vh' }}>
          {/* キャッチ */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4vh', fontWeight: 700, color: '#888', marginBottom: '0.6vh', letterSpacing: '0.04em' }}>高槻・摂津・大阪エリアで使える</div>
            <div style={{ fontSize: '3.2vh', fontWeight: 900, color: '#1A1A1A', lineHeight: 1.2 }}>近くのお店の食材が</div>
            <div style={{ fontSize: '3.2vh', fontWeight: 900, color: '#F26419', lineHeight: 1.2, marginBottom: '0.5vh' }}>お得にゲットできる！</div>
            <div style={{ width: '6vh', height: '0.4vh', background: '#F26419', borderRadius: '1vh', margin: '0.8vh auto', opacity: 0.5 }} />
          </div>

          {/* バッジ */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2vh' }}>
            <div style={{ background: '#FFF4EE', border: '0.2vh solid #F26419', borderRadius: '1vh', padding: '0.8vh 1.2vh', textAlign: 'center' }}>
              <div style={{ fontSize: '2.2vh' }}>💰</div>
              <div style={{ fontSize: '1.2vh', fontWeight: 900, color: '#F26419' }}>最大70%OFF</div>
            </div>
            <div style={{ background: '#F0FFF5', border: '0.2vh solid #2ECC71', borderRadius: '1vh', padding: '0.8vh 1.2vh', textAlign: 'center' }}>
              <div style={{ fontSize: '2.2vh' }}>🌱</div>
              <div style={{ fontSize: '1.2vh', fontWeight: 900, color: '#27ae60' }}>食品ロス削減</div>
            </div>
            <div style={{ background: '#FFF4EE', border: '0.2vh solid #F26419', borderRadius: '1vh', padding: '0.8vh 1.2vh', textAlign: 'center' }}>
              <div style={{ fontSize: '2.2vh' }}>📍</div>
              <div style={{ fontSize: '1.2vh', fontWeight: 900, color: '#F26419' }}>高槻中心</div>
            </div>
          </div>

          {/* 説明 */}
          <div style={{ background: '#fff', border: '0.2vh solid #eee', borderRadius: '1.2vh', padding: '1.5vh 1.8vh', fontSize: '1.5vh', color: '#444', lineHeight: 1.9, textAlign: 'center' }}>
            近くのレストラン・ベーカリー・カフェが<br />
            余ったお弁当やパン・食材を出品中。<br />
            <span style={{ fontWeight: 700, color: '#F26419' }}>アプリで予約してお店に取りに行くだけ！</span><br />
            お得に買えて地球にも優しい。
          </div>

          {/* ステップ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9vh' }}>
            {[
              { icon: '📲', label: 'アプリをダウンロード (無料)', sub: 'App Store または Web サイトから' },
              { icon: '🔍', label: 'マップで近くの出品を探す', sub: '高槻・摂津・大阪エリア対応中' },
              { icon: '✅', label: '予約→お店でピックアップ', sub: 'かんたん操作で完了！' },
            ].map(({ icon, label, sub }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '1.2vh', background: '#FAFAFA', borderRadius: '1vh', padding: '1vh 1.3vh', border: '0.15vh solid #eee' }}>
                <div style={{ fontSize: '2.4vh', flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: '1.45vh', fontWeight: 700, color: '#1A1A1A' }}>{label}</div>
                  <div style={{ fontSize: '1.15vh', color: '#888' }}>{sub}</div>
                </div>
              </div>
            ))}
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
