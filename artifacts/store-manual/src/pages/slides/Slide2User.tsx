export default function Slide2User() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex flex-col" style={{ background: 'linear-gradient(145deg, #FFF8F3 0%, #FBFBFA 60%, #F0FFF5 100%)', fontFamily: "'Noto Sans JP', sans-serif" }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3vh 6vw 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5vw' }}>
            <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="おすそわけ" style={{ width: '6vw', borderRadius: '1.2vw', boxShadow: '0 0.3vw 1.5vw rgba(242,100,25,0.15)' }} />
            <div style={{ fontSize: '2.0vw', fontWeight: 900, color: '#F26419' }}>おすそわけ</div>
          </div>
          <div style={{ fontSize: '1.3vw', color: '#888', fontWeight: 700 }}>フードシェアリングアプリ</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2vh 6vw' }}>
          <div style={{ fontSize: '2.0vw', fontWeight: 700, color: '#F26419', marginBottom: '1vh', letterSpacing: '0.05em' }}>あなたも参加してみませんか？</div>
          <div style={{ fontSize: '5.0vw', fontWeight: 900, color: '#1A1A1A', textAlign: 'center', lineHeight: 1.15, marginBottom: '1.2vh' }}>近くのお店の食材が</div>
          <div style={{ fontSize: '5.0vw', fontWeight: 900, color: '#F26419', textAlign: 'center', lineHeight: 1.15, marginBottom: '2.5vh' }}>お得にゲットできる！</div>
          <div style={{ width: '8vw', height: '0.5vh', background: '#F26419', borderRadius: '1vw', marginBottom: '3vh', opacity: 0.4 }} />
          <div style={{ fontSize: '1.9vw', color: '#444', textAlign: 'center', lineHeight: 1.9, marginBottom: '3vh', maxWidth: '68vw' }}>
            近くのレストランやベーカリーが余った食材・お弁当・パンなどを<br />
            <span style={{ fontWeight: 900, color: '#F26419' }}>最大 70% OFF</span> で出品しています。<br />
            買うだけで <span style={{ fontWeight: 900, color: '#2ECC71' }}>食品ロス削減</span> に貢献できます。
          </div>
          <div className="flex gap-[3vw] justify-center items-start w-full" style={{ marginBottom: '2.5vh' }}>
            <div style={{ background: '#fff', border: '0.2vw solid #F26419', borderRadius: '1.5vw', padding: '2.2vh 2.5vw', textAlign: 'center', minWidth: '17vw', boxShadow: '0 0.3vw 1.5vw rgba(242,100,25,0.10)' }}>
              <div style={{ fontSize: '3.0vw', marginBottom: '0.8vh' }}>📍</div>
              <div style={{ fontSize: '1.4vw', fontWeight: 900, color: '#F26419', marginBottom: '0.4vh' }}>近所のお店を発見</div>
              <div style={{ fontSize: '1.15vw', color: '#555', lineHeight: 1.5 }}>マップで近くの<br />出品店舗を検索</div>
            </div>
            <div style={{ background: '#fff', border: '0.2vw solid #2ECC71', borderRadius: '1.5vw', padding: '2.2vh 2.5vw', textAlign: 'center', minWidth: '17vw', boxShadow: '0 0.3vw 1.5vw rgba(46,204,113,0.10)' }}>
              <div style={{ fontSize: '3.0vw', marginBottom: '0.8vh' }}>🛍️</div>
              <div style={{ fontSize: '1.4vw', fontWeight: 900, color: '#27ae60', marginBottom: '0.4vh' }}>アプリで予約</div>
              <div style={{ fontSize: '1.15vw', color: '#555', lineHeight: 1.5 }}>タップするだけで<br />かんたん購入</div>
            </div>
            <div style={{ background: '#fff', border: '0.2vw solid #F26419', borderRadius: '1.5vw', padding: '2.2vh 2.5vw', textAlign: 'center', minWidth: '17vw', boxShadow: '0 0.3vw 1.5vw rgba(242,100,25,0.10)' }}>
              <div style={{ fontSize: '3.0vw', marginBottom: '0.8vh' }}>🌱</div>
              <div style={{ fontSize: '1.4vw', fontWeight: 900, color: '#F26419', marginBottom: '0.4vh' }}>受け取って貢献</div>
              <div style={{ fontSize: '1.15vw', color: '#555', lineHeight: 1.5 }}>お店へ取りに行くだけ<br />地球にも優しい</div>
            </div>
          </div>
        </div>
        <div style={{ background: '#1A1A1A', padding: '3vh 6vw', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3vw' }}>
          <div style={{ color: '#fff', flex: 1 }}>
            <div style={{ fontSize: '1.8vw', fontWeight: 900, marginBottom: '0.8vh', color: '#F26419' }}>今すぐダウンロード（無料）</div>
            <div style={{ fontSize: '1.3vw', color: '#ccc', lineHeight: 1.7 }}>
              iPhone は App Store から「おすそわけ」で検索<br />
              Android は <span style={{ color: '#fff', fontWeight: 700 }}>osusowakejapan.org</span> からご利用ください
            </div>
          </div>
          <div style={{ display: 'flex', gap: '3vw', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: '#fff', padding: '1vw', borderRadius: '1vw', marginBottom: '0.8vh' }}>
                <img src={`${import.meta.env.BASE_URL}qr-appstore.jpeg`} alt="App Store" style={{ width: '8vw', height: '8vw', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ fontSize: '1.1vw', color: '#aaa' }}>App Store</div>
              <div style={{ fontSize: '0.9vw', color: '#777' }}>(iPhone)</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: '#fff', padding: '1vw', borderRadius: '1vw', marginBottom: '0.8vh' }}>
                <img src={`${import.meta.env.BASE_URL}web-signup-qr.png`} alt="Webサイト" style={{ width: '8vw', height: '8vw', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ fontSize: '1.1vw', color: '#aaa' }}>Webサイト</div>
              <div style={{ fontSize: '0.9vw', color: '#777' }}>(Android)</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: '#fff', padding: '1vw', borderRadius: '1vw', marginBottom: '0.8vh' }}>
                <img src={`${import.meta.env.BASE_URL}instagram-qr.png`} alt="Instagram" style={{ width: '8vw', height: '8vw', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ fontSize: '1.1vw', color: '#aaa' }}>Instagram</div>
              <div style={{ fontSize: '0.9vw', color: '#777' }}>@osusowake_official</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
