const base = import.meta.env.BASE_URL;

export default function Slide6Closing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 60% at 20% 80%, rgba(68,168,54,0.08) 0%, transparent 70%)' }}
      />
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#44A836', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '7vh 7vw 7vh 6vw' }}>
          <div>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#44A836', letterSpacing: '0.12em', marginBottom: '3vh' }}>
              GET STARTED
            </p>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '4.2vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: '5vh' }}>
              まずはお気軽に<br />ご相談ください
            </h2>
            <div style={{ display: 'flex', gap: '3vw', marginBottom: '5vh' }}>
              <div>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', fontWeight: 700, color: '#8A7F7A', letterSpacing: '0.1em', marginBottom: '1vh' }}>
                  STEP 1
                </p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', color: '#2A2623', fontWeight: 700, marginBottom: '0.5vh' }}>お問い合わせ</p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#8A7F7A' }}>本日〜1日</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '1vh' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2vw', color: '#E8E0D8' }}>→</span>
              </div>
              <div>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', fontWeight: 700, color: '#8A7F7A', letterSpacing: '0.1em', marginBottom: '1vh' }}>
                  STEP 2
                </p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', color: '#2A2623', fontWeight: 700, marginBottom: '0.5vh' }}>アカウント作成・審査</p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#8A7F7A' }}>最短3日</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '1vh' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2vw', color: '#E8E0D8' }}>→</span>
              </div>
              <div>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', fontWeight: 700, color: '#44A836', letterSpacing: '0.1em', marginBottom: '1vh' }}>
                  STEP 3
                </p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', color: '#2A2623', fontWeight: 700, marginBottom: '0.5vh' }}>初回出品・運用開始</p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#44A836', fontWeight: 700 }}>最短1週間でスタート</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '3vw', alignItems: 'stretch' }}>
            <div style={{ background: '#2A2623', borderRadius: '1.2vw', padding: '3vh 3.5vw', display: 'flex', gap: '4vw', alignItems: 'center', flex: 1 }}>
              <div>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', fontWeight: 700, color: 'rgba(251,248,244,0.5)', letterSpacing: '0.1em', marginBottom: '1vh' }}>CONTACT</p>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2vw', fontWeight: 900, color: '#FBF8F4', marginBottom: '0.5vh' }}>おすそわけ 店舗担当</p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', color: 'rgba(251,248,244,0.65)' }}>hello@osusowakejapan.org</p>
              </div>
              <div style={{ width: '0.1vw', background: 'rgba(251,248,244,0.15)', alignSelf: 'stretch' }} />
              <div>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', fontWeight: 700, color: 'rgba(251,248,244,0.5)', letterSpacing: '0.1em', marginBottom: '1vh' }}>WEB</p>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2vw', fontWeight: 700, color: '#E8786C' }}>osusowakejapan.org</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.2vw' }}>
              <div style={{ background: '#F0F7EE', borderRadius: '1.2vw', padding: '2vh 1.4vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1vh', border: '1px solid rgba(68,168,54,0.2)' }}>
                <img src={`${base}store-qr.png`} crossOrigin="anonymous" alt="店舗登録QRコード" style={{ width: '6.8vw', height: '6.8vw', objectFit: 'contain' }} />
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1vw', color: '#44A836', fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>WEBから<br />店舗登録</p>
              </div>
              <div style={{ background: '#F0F7EE', borderRadius: '1.2vw', padding: '2vh 1.4vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1vh', border: '1px solid rgba(68,168,54,0.2)' }}>
                <img src={`${base}qr-line.png`} crossOrigin="anonymous" alt="App Store QRコード" style={{ width: '6.8vw', height: '6.8vw', objectFit: 'contain' }} />
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1vw', color: '#44A836', fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>iPhone<br />App Store</p>
              </div>
              <div style={{ background: '#FFF4F2', borderRadius: '1.2vw', padding: '2vh 1.4vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1vh', border: '1px solid rgba(232,120,108,0.25)' }}>
                <img src={`${base}web-signup-qr.png`} crossOrigin="anonymous" alt="Web版登録QRコード" style={{ width: '6.8vw', height: '6.8vw', objectFit: 'contain' }} />
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1vw', color: '#E8786C', fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>Android<br />Web版登録</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
