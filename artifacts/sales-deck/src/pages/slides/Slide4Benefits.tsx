export default function Slide4Benefits() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#E8786C', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4vh 7vw 4vh 6vw' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.12em', marginBottom: '2vh' }}>
            BENEFITS
          </p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '4vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: '4.5vh' }}>
            店舗のメリット
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2vw', maxWidth: '80vw' }}>
            <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'flex-start', background: '#FDF0EE', borderRadius: '1vw', padding: '2.5vh 2.5vw' }}>
              <div style={{ width: '0.4vw', height: '100%', background: '#E8786C', borderRadius: '2px', flexShrink: 0, alignSelf: 'stretch' }} />
              <div>
                <p style={{ fontFamily: "Outfit, 'Noto Sans JP', sans-serif", fontSize: '2vw', fontWeight: 900, color: '#2A2623', marginBottom: '0.8vh' }}>廃棄コスト削減</p>
                <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '1.7vw', color: '#5A4F4A', lineHeight: 1.6 }}>捨てるはずの商品が売上へ</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'flex-start', background: '#F5FAF4', borderRadius: '1vw', padding: '2.5vh 2.5vw' }}>
              <div style={{ width: '0.4vw', height: '100%', background: '#44A836', borderRadius: '2px', flexShrink: 0, alignSelf: 'stretch' }} />
              <div>
                <p style={{ fontFamily: "Outfit, 'Noto Sans JP', sans-serif", fontSize: '2vw', fontWeight: 900, color: '#2A2623', marginBottom: '0.8vh' }}>新規顧客獲得</p>
                <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '1.7vw', color: '#5A4F4A', lineHeight: 1.6 }}>アプリ経由で新しいお客様との出会い</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'flex-start', background: '#F5FAF4', borderRadius: '1vw', padding: '2.5vh 2.5vw' }}>
              <div style={{ width: '0.4vw', height: '100%', background: '#44A836', borderRadius: '2px', flexShrink: 0, alignSelf: 'stretch' }} />
              <div>
                <p style={{ fontFamily: "Outfit, 'Noto Sans JP', sans-serif", fontSize: '2vw', fontWeight: 900, color: '#2A2623', marginBottom: '0.8vh' }}>環境アピール</p>
                <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '1.7vw', color: '#5A4F4A', lineHeight: 1.6 }}>SDGs・フードロス削減への取り組みをPR</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'flex-start', background: '#FDF0EE', borderRadius: '1vw', padding: '2.5vh 2.5vw' }}>
              <div style={{ width: '0.4vw', height: '100%', background: '#E8786C', borderRadius: '2px', flexShrink: 0, alignSelf: 'stretch' }} />
              <div>
                <p style={{ fontFamily: "Outfit, 'Noto Sans JP', sans-serif", fontSize: '2vw', fontWeight: 900, color: '#2A2623', marginBottom: '0.8vh' }}>手間なし運営</p>
                <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '1.7vw', color: '#5A4F4A', lineHeight: 1.6 }}>出品・決済・受け取り確認はアプリで完結</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
