export default function Slide7Pickup() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#E8786C', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '5vh 8vw 5vh 6vw' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.12em', marginBottom: '2vh' }}>
            PICKUP
          </p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3.8vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, marginBottom: '4.5vh' }}>
            受け取り当日の流れ
          </h2>
          <div style={{ display: 'flex', gap: '2.5vw' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2vh' }}>
              <div style={{ background: '#FDF0EE', borderRadius: '1vw', padding: '2.5vh 2.5vw' }}>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.1em', marginBottom: '1vh' }}>お客様側</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5vh' }}>
                  <div style={{ display: 'flex', gap: '1vw', alignItems: 'flex-start' }}>
                    <div style={{ width: '2vw', height: '2vw', borderRadius: '50%', background: '#E8786C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.2vh' }}>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1vw', fontWeight: 900, color: '#FBF8F4' }}>1</span>
                    </div>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', color: '#2A2623' }}>アプリで袋を購入・決済</p>
                  </div>
                  <div style={{ display: 'flex', gap: '1vw', alignItems: 'flex-start' }}>
                    <div style={{ width: '2vw', height: '2vw', borderRadius: '50%', background: '#E8786C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.2vh' }}>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1vw', fontWeight: 900, color: '#FBF8F4' }}>2</span>
                    </div>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', color: '#2A2623' }}>受け取り時間にお店へ来店</p>
                  </div>
                  <div style={{ display: 'flex', gap: '1vw', alignItems: 'flex-start' }}>
                    <div style={{ width: '2vw', height: '2vw', borderRadius: '50%', background: '#E8786C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.2vh' }}>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1vw', fontWeight: 900, color: '#FBF8F4' }}>3</span>
                    </div>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', color: '#2A2623' }}>アプリの購入証明を提示</p>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '3vw', color: 'rgba(42,38,35,0.15)' }}>⇔</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2vh' }}>
              <div style={{ background: '#F5FAF4', borderRadius: '1vw', padding: '2.5vh 2.5vw' }}>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3vw', fontWeight: 700, color: '#44A836', letterSpacing: '0.1em', marginBottom: '1vh' }}>店舗側</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5vh' }}>
                  <div style={{ display: 'flex', gap: '1vw', alignItems: 'flex-start' }}>
                    <div style={{ width: '2vw', height: '2vw', borderRadius: '50%', background: '#44A836', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.2vh' }}>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1vw', fontWeight: 900, color: '#FBF8F4' }}>1</span>
                    </div>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', color: '#2A2623' }}>ダッシュボードで予約を確認</p>
                  </div>
                  <div style={{ display: 'flex', gap: '1vw', alignItems: 'flex-start' }}>
                    <div style={{ width: '2vw', height: '2vw', borderRadius: '50%', background: '#44A836', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.2vh' }}>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1vw', fontWeight: 900, color: '#FBF8F4' }}>2</span>
                    </div>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', color: '#2A2623' }}>袋に商品を詰めて準備</p>
                  </div>
                  <div style={{ display: 'flex', gap: '1vw', alignItems: 'flex-start' }}>
                    <div style={{ width: '2vw', height: '2vw', borderRadius: '50%', background: '#44A836', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.2vh' }}>
                      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1vw', fontWeight: 900, color: '#FBF8F4' }}>3</span>
                    </div>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', color: '#2A2623' }}>画面を確認して商品を渡す</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ background: '#2A2623', borderRadius: '1vw', padding: '2vh 2.5vw', marginTop: '3vh', display: 'flex', alignItems: 'center', gap: '2vw' }}>
            <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#FBF8F4' }}>決済はすべてアプリ内で完結。現金のやり取りは不要です。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
