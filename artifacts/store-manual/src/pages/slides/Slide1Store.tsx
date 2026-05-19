export default function Slide1Store() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex" style={{ background: '#FBFBFA', fontFamily: "'Noto Sans JP', sans-serif" }}>
      <div className="relative z-10 flex flex-col justify-between w-full h-full">
        <div className="flex flex-col h-full">
          <div className="flex flex-col items-center justify-center flex-1 px-[6vw] pt-[4vh]">
            <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="おすそわけ" style={{ width: '14vw', borderRadius: '2vw', marginBottom: '2.5vh', boxShadow: '0 0.4vw 2vw rgba(242,100,25,0.18)' }} />
            <div style={{ fontSize: '2.2vw', fontWeight: 900, color: '#F26419', letterSpacing: '0.05em', marginBottom: '0.8vh' }}>飲食店の皆さまへ</div>
            <div style={{ fontSize: '5.2vw', fontWeight: 900, color: '#1A1A1A', lineHeight: 1.15, textAlign: 'center', marginBottom: '1.5vh' }}>食品ロスを減らして</div>
            <div style={{ fontSize: '5.2vw', fontWeight: 900, color: '#F26419', lineHeight: 1.15, textAlign: 'center', marginBottom: '2.5vh' }}>売上を増やしませんか？</div>
            <div style={{ width: '10vw', height: '0.5vh', background: '#F26419', borderRadius: '1vw', marginBottom: '3vh', opacity: 0.5 }} />
            <div style={{ fontSize: '2.0vw', color: '#444', textAlign: 'center', lineHeight: 1.8, marginBottom: '3vh', maxWidth: '72vw' }}>
              <span style={{ fontWeight: 700, color: '#F26419' }}>おすそわけ</span> は、 余った食材・お弁当・パンなどを<br />
              アプリユーザーに販売できる <span style={{ fontWeight: 700 }}>フードシェアリングアプリ</span> です。<br />
              <span style={{ fontWeight: 700, color: '#2ECC71' }}>初期費用・月額費用ゼロ。 売れた分だけ 25% の手数料のみ。</span>
            </div>
            <div className="flex gap-[3vw] justify-center items-start w-full" style={{ marginBottom: '2vh' }}>
              <div style={{ background: '#FFF4EE', border: '0.2vw solid #F26419', borderRadius: '1.5vw', padding: '2.5vh 2.5vw', textAlign: 'center', minWidth: '18vw' }}>
                <div style={{ fontSize: '3.2vw', marginBottom: '0.8vh' }}>🗑️</div>
                <div style={{ fontSize: '1.5vw', fontWeight: 900, color: '#F26419', marginBottom: '0.4vh' }}>廃棄コスト削減</div>
                <div style={{ fontSize: '1.2vw', color: '#555', lineHeight: 1.5 }}>捨てていた食材が<br />売上に変わる</div>
              </div>
              <div style={{ background: '#F0FFF5', border: '0.2vw solid #2ECC71', borderRadius: '1.5vw', padding: '2.5vh 2.5vw', textAlign: 'center', minWidth: '18vw' }}>
                <div style={{ fontSize: '3.2vw', marginBottom: '0.8vh' }}>📱</div>
                <div style={{ fontSize: '1.5vw', fontWeight: 900, color: '#27ae60', marginBottom: '0.4vh' }}>新規集客</div>
                <div style={{ fontSize: '1.2vw', color: '#555', lineHeight: 1.5 }}>アプリ経由で<br />新しいお客様が来店</div>
              </div>
              <div style={{ background: '#FFF8F0', border: '0.2vw solid #F26419', borderRadius: '1.5vw', padding: '2.5vh 2.5vw', textAlign: 'center', minWidth: '18vw' }}>
                <div style={{ fontSize: '3.2vw', marginBottom: '0.8vh' }}>✅</div>
                <div style={{ fontSize: '1.5vw', fontWeight: 900, color: '#F26419', marginBottom: '0.4vh' }}>完全成果報酬型</div>
                <div style={{ fontSize: '1.2vw', color: '#555', lineHeight: 1.5 }}>売れなければ<br />費用は一切かかりない</div>
              </div>
            </div>
          </div>
          <div style={{ background: '#1A1A1A', padding: '3vh 6vw', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3vw' }}>
            <div style={{ color: '#fff', flex: 1 }}>
              <div style={{ fontSize: '1.8vw', fontWeight: 900, marginBottom: '0.8vh', color: '#F26419' }}>登録はこちらから（無料）</div>
              <div style={{ fontSize: '1.3vw', color: '#ccc', lineHeight: 1.7 }}>
                アプリをインストール → 飲食店・パートナータブで新規登録<br />
                <span style={{ color: '#fff', fontWeight: 700 }}>osusowakejapan.org</span> からもご登録いただけます
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
                  <img src={`${import.meta.env.BASE_URL}web-signup-qr.png`} alt="Webサイト (Android)" style={{ width: '8vw', height: '8vw', objectFit: 'cover', display: 'block' }} />
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
    </div>
  );
}
