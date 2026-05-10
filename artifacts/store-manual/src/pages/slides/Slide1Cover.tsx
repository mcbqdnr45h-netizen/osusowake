const base = import.meta.env.BASE_URL;

export default function Slide1Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#2A2623' }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 70% 50%, rgba(232,120,108,0.18) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#E8786C', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8vh 8vw 8vh 6vw' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.6vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.15em', marginBottom: '3vh' }}>
            STORE MANUAL
          </p>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '6vw', fontWeight: 900, color: '#FBF8F4', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: '2vh' }}>
            おすそわけ
          </h1>
          <h2 style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '3vw', fontWeight: 700, color: '#FBF8F4', lineHeight: 1.2, marginBottom: '5vh' }}>
            店舗登録・出品マニュアル
          </h2>
          <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', color: 'rgba(251,248,244,0.6)', marginBottom: '5vh' }}>
            このマニュアルに沿って進めれば、最短10分で出品できます。
          </p>
          <div style={{ display: 'flex', gap: '3vw', alignItems: 'center' }}>
            <div style={{ background: '#FBF8F4', borderRadius: '0.8vw', padding: '1.5vh 2vw' }}>
              <img src={`${base}store-qr.png`} crossOrigin="anonymous" alt="店舗登録QR" style={{ width: '8vw', height: '8vw', objectFit: 'contain', display: 'block' }} />
            </div>
            <div>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: 'rgba(251,248,244,0.7)', marginBottom: '0.5vh' }}>QRコードを読み込んで登録開始</p>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8vw', fontWeight: 700, color: '#E8786C' }}>osusowakejapan.org/store/signup</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
