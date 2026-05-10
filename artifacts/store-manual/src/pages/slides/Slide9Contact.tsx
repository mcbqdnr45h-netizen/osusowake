const base = import.meta.env.BASE_URL;

export default function Slide9Contact() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#2A2623' }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 70% at 20% 80%, rgba(68,168,54,0.12) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#44A836', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '7vh 8vw 7vh 6vw' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#44A836', letterSpacing: '0.12em', marginBottom: '2vh' }}>
            START TODAY
          </p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '4.5vw', fontWeight: 900, color: '#FBF8F4', lineHeight: 1.1, marginBottom: '2vh' }}>
            今日から始めましょう
          </h2>
          <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '2vw', color: 'rgba(251,248,244,0.65)', marginBottom: '6vh' }}>
            登録・初期費用は一切かかりません。まずはアカウントを作るところから。
          </p>
          <div style={{ display: 'flex', gap: '3vw', alignItems: 'stretch' }}>
            <div style={{ flex: 1, background: 'rgba(251,248,244,0.06)', borderRadius: '1.2vw', padding: '3.5vh 3vw', border: '1px solid rgba(251,248,244,0.1)' }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', fontWeight: 700, color: 'rgba(251,248,244,0.45)', letterSpacing: '0.1em', marginBottom: '1.5vh' }}>CONTACT</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '2vw', fontWeight: 700, color: '#FBF8F4', marginBottom: '0.8vh' }}>おすそわけ 店舗担当</p>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8vw', color: '#E8786C' }}>hello@osusowakejapan.org</p>
            </div>
            <div style={{ flex: 1, background: 'rgba(68,168,54,0.12)', borderRadius: '1.2vw', padding: '3.5vh 3vw', border: '1px solid rgba(68,168,54,0.25)', display: 'flex', gap: '2.5vw', alignItems: 'center' }}>
              <div style={{ background: '#FBF8F4', borderRadius: '0.8vw', padding: '1.2vh' }}>
                <img src={`${base}store-qr.png`} crossOrigin="anonymous" alt="店舗登録QR" style={{ width: '9vw', height: '9vw', objectFit: 'contain', display: 'block' }} />
              </div>
              <div>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#FBF8F4', marginBottom: '1vh' }}>QRコードで今すぐ登録</p>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', color: '#44A836' }}>osusowakejapan.org</p>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', color: '#44A836' }}>/store/signup</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
