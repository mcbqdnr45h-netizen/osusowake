export default function Slide2Problem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#E8786C', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '5vh 7vw 5vh 6vw' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.12em', marginBottom: '2vh' }}>
            PROBLEM
          </p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '4vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, letterSpacing: '-0.01em', textWrap: 'balance', marginBottom: '5vh' }}>
            飲食店の食品廃棄、<br />年間コストはいくら？
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5vw', maxWidth: '72vw' }}>
            <div style={{ background: '#FDF0EE', borderRadius: '1.2vw', padding: '3.5vh 3vw' }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '5.5vw', fontWeight: 900, color: '#E8786C', lineHeight: 1, marginBottom: '1vh' }}>
                472<span style={{ fontSize: '2.5vw' }}>万t</span>
              </p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', color: '#2A2623', fontWeight: 700, marginBottom: '0.5vh' }}>
                日本の年間食品廃棄量
              </p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A' }}>
                農林水産省 2023年
              </p>
            </div>
            <div style={{ background: '#F5FAF4', borderRadius: '1.2vw', padding: '3.5vh 3vw', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '2vw', color: '#2A2623', fontWeight: 700, lineHeight: 1.6, marginBottom: '1.5vh' }}>
                廃棄食材のコストは<br />すべて損失として計上される
              </p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', color: '#44A836', fontWeight: 700 }}>
                売れ残りを売上に変える仕組みが必要です
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
