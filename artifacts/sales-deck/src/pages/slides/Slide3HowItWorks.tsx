export default function Slide3HowItWorks() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#44A836', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4vh 7vw 4vh 6vw' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#44A836', letterSpacing: '0.12em', marginBottom: '2vh' }}>
            HOW IT WORKS
          </p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '4vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: '5vh' }}>
            おすそわけの仕組み
          </h2>
          <div style={{ display: 'flex', gap: '2.5vw', alignItems: 'stretch', maxWidth: '82vw' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ width: '5.5vh', height: '5.5vh', borderRadius: '50%', background: '#E8786C', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2vh' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.5vh', fontWeight: 900, color: '#fff' }}>1</span>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.2vw', fontWeight: 900, color: '#2A2623', marginBottom: '1.2vh', lineHeight: 1.2 }}>
                出品
              </p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', color: '#2A2623', lineHeight: 1.7 }}>
                売れ残りそうな商品を「袋」として出品
              </p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#8A7F7A', marginTop: '0.8vh' }}>
                スマホで1分
              </p>
            </div>
            <div style={{ width: '0.15vw', background: '#E8E0D8', alignSelf: 'stretch' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ width: '5.5vh', height: '5.5vh', borderRadius: '50%', background: '#E8786C', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2vh' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.5vh', fontWeight: 900, color: '#fff' }}>2</span>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.2vw', fontWeight: 900, color: '#2A2623', marginBottom: '1.2vh', lineHeight: 1.2 }}>
                購入
              </p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', color: '#2A2623', lineHeight: 1.7 }}>
                近隣ユーザーがアプリで発見・購入
              </p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#8A7F7A', marginTop: '0.8vh' }}>
                決済はアプリ内で完結
              </p>
            </div>
            <div style={{ width: '0.15vw', background: '#E8E0D8', alignSelf: 'stretch' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ width: '5.5vh', height: '5.5vh', borderRadius: '50%', background: '#44A836', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2vh' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.5vh', fontWeight: 900, color: '#fff' }}>3</span>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.2vw', fontWeight: 900, color: '#2A2623', marginBottom: '1.2vh', lineHeight: 1.2 }}>
                受け取り
              </p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', color: '#2A2623', lineHeight: 1.7 }}>
                閉店前にお客様が来店して受け取り
              </p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#44A836', marginTop: '0.8vh', fontWeight: 700 }}>
                廃棄ゼロ ・ 売上確保
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
