export default function Slide1Store() {
  const base = import.meta.env.BASE_URL;
  return (
    <div className="w-screen h-screen overflow-hidden relative" style={{ background: '#F5F5F5', fontFamily: "'Noto Sans JP', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* A4縦カード */}
      <div style={{
        height: '96vh', width: '54vh',
        borderRadius: '2vh',
        overflow: 'hidden',
        boxShadow: '0 1.5vh 6vh rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        background: '#fff',
      }}>

        {/* ▼ ヘッダー: 日付 */}
        <div style={{ background: 'linear-gradient(160deg, #E8247A 0%, #c01265 100%)', padding: '2vh 2vh 1.8vh', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6vh', marginBottom: '0.2vh' }}>
            <span style={{ fontSize: '7.8vh', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em', textShadow: '0 0.2vh 0.8vh rgba(0,0,0,0.2)' }}>6/15</span>
            <span style={{ fontSize: '2.8vh', fontWeight: 900, color: '#FFE566', alignSelf: 'flex-end', paddingBottom: '0.6vh' }}>日</span>
          </div>
          <div style={{ fontSize: '4.4vh', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '0.04em', textShadow: '0 0.2vh 0.8vh rgba(0,0,0,0.15)' }}>
            <span style={{ color: '#FFE566' }}>出品</span>開始！
          </div>
        </div>

        {/* ▼ ロゴ帯 */}
        <div style={{ background: '#8DC63F', padding: '1.1vh 2vh', display: 'flex', alignItems: 'center', gap: '1.2vh' }}>
          <img src={`${base}logo.jpg`} alt="おすそわけ" style={{ width: '4.2vh', height: '4.2vh', borderRadius: '0.8vh', objectFit: 'cover', border: '0.25vh solid rgba(255,255,255,0.7)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '2.1vh', fontWeight: 900, color: '#fff', lineHeight: 1 }}>おすそわけ</div>
            <div style={{ fontSize: '1.05vh', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>フードシェアリングアプリ</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '0.8vh', padding: '0.5vh 1.1vh', textAlign: 'center' }}>
            <div style={{ fontSize: '1.05vh', color: '#fff', fontWeight: 900 }}>北摂エリア</div>
            <div style={{ fontSize: '0.9vh', color: 'rgba(255,255,255,0.9)' }}>高槻・茨木中心</div>
          </div>
        </div>

        {/* ▼ メインコンテンツ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2vh 2.2vh', gap: '1.5vh', background: '#FAFAFA' }}>

          {/* キャッチ */}
          <div style={{ background: '#FFF4EE', border: '0.25vh solid #E8247A', borderRadius: '1.2vh', padding: '1.4vh 1.8vh', textAlign: 'center' }}>
            <div style={{ fontSize: '2.7vh', fontWeight: 900, color: '#1A1A1A', lineHeight: 1.25 }}>余った食材・お弁当を</div>
            <div style={{ fontSize: '2.7vh', fontWeight: 900, color: '#E8247A', lineHeight: 1.25 }}>アプリでお得にゲット！</div>
          </div>

          {/* 説明 */}
          <div style={{ fontSize: '1.48vh', color: '#444', lineHeight: 1.9, textAlign: 'center' }}>
            近くのお店が余った食材やお弁当を<br />
            アプリに出品しています。<br />
            予約してお店に取りに来るだけで<br />
            <span style={{ fontWeight: 700, color: '#8DC63F' }}>食品ロス削減</span> に貢献できます。
          </div>

          {/* ステップ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9vh' }}>
            {[
              { num: '1', text: 'アプリをダウンロード（無料）', sub: '下のQRコードを読み込むだけ' },
              { num: '2', text: '近くの出品を探す', sub: '高槻・茨木を中心に北摂エリア展開中' },
              { num: '3', text: '予約→お店でピックアップ', sub: 'かんたん操作で完了！' },
            ].map(({ num, text, sub }) => (
              <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '1.2vh', background: '#fff', border: '0.18vh solid #E8E8E8', borderRadius: '1vh', padding: '1vh 1.3vh', boxShadow: '0 0.15vh 0.5vh rgba(0,0,0,0.05)' }}>
                <div style={{ width: '3.4vh', height: '3.4vh', background: '#E8247A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '1.6vh', fontWeight: 900, color: '#fff' }}>{num}</span>
                </div>
                <div>
                  <div style={{ fontSize: '1.42vh', fontWeight: 700, color: '#1A1A1A' }}>{text}</div>
                  <div style={{ fontSize: '1.1vh', color: '#888', marginTop: '0.1vh' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* エリア帯 */}
          <div style={{ background: '#8DC63F', borderRadius: '1vh', padding: '1vh 1.5vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8vh' }}>
            <span style={{ fontSize: '1.7vh' }}>📍</span>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.42vh' }}>高槻市・茨木市を中心とした北摂エリア</div>
          </div>
        </div>

        {/* ▼ QRフッター */}
        <div style={{ background: '#E8247A', padding: '1.6vh 1.5vh', display: 'flex', justifyContent: 'center', gap: '2vh', alignItems: 'flex-start' }}>
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
