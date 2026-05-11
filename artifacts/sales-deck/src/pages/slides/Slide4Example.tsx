export default function Slide4Example() {
  const font = "'Noto Sans JP', sans-serif";
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#44A836', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4vh 7vw 4vh 6vw' }}>
          <p style={{ fontFamily: font, fontSize: '1.4vw', fontWeight: 700, color: '#44A836', letterSpacing: '0.1em', marginBottom: '1.5vh' }}>
            EXAMPLE
          </p>
          <h2 style={{ fontFamily: font, fontSize: '3.6vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, marginBottom: '4vh' }}>
            売上シミュレーション
          </h2>

          <div style={{ display: 'flex', gap: '3vw', alignItems: 'stretch' }}>

            <div style={{ flex: 1, background: '#F0F7EE', borderRadius: '1vw', padding: '3vh 2.5vw', border: '1px solid rgba(68,168,54,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontFamily: font, fontSize: '1.4vw', fontWeight: 700, color: '#44A836', marginBottom: '2.5vh' }}>
                想定条件（控えめ）
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5vh' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(68,168,54,0.15)', paddingBottom: '1.2vh' }}>
                  <span style={{ fontFamily: font, fontSize: '1.6vw', color: '#2A2623' }}>1日の出品数</span>
                  <span style={{ fontFamily: font, fontSize: '2vw', fontWeight: 800, color: '#2A2623' }}>3袋</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(68,168,54,0.15)', paddingBottom: '1.2vh' }}>
                  <span style={{ fontFamily: font, fontSize: '1.6vw', color: '#2A2623' }}>1袋あたりの価格</span>
                  <span style={{ fontFamily: font, fontSize: '2vw', fontWeight: 800, color: '#2A2623' }}>¥500</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: font, fontSize: '1.6vw', color: '#2A2623' }}>稼働日数</span>
                  <span style={{ fontFamily: font, fontSize: '2vw', fontWeight: 800, color: '#2A2623' }}>20日/月</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 0.5vw', color: 'rgba(42,38,35,0.25)', fontFamily: font, fontSize: '2.5vw' }}>
              →
            </div>

            <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5vh' }}>
              <div style={{ background: '#2A2623', borderRadius: '1vw', padding: '2.5vh 2.5vw' }}>
                <p style={{ fontFamily: font, fontSize: '1.4vw', color: 'rgba(251,248,244,0.5)', marginBottom: '1vh' }}>計算式</p>
                <p style={{ fontFamily: font, fontSize: '2.2vw', fontWeight: 800, color: '#FBF8F4' }}>
                  3袋 × ¥500 × 20日
                </p>
              </div>
              <div style={{ background: '#44A836', borderRadius: '1vw', padding: '3vh 2.5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontFamily: font, fontSize: '1.6vw', fontWeight: 700, color: 'rgba(251,248,244,0.9)', marginBottom: '0.4vh' }}>月間の純収益</p>
                  <p style={{ fontFamily: font, fontSize: '1.3vw', color: 'rgba(251,248,244,0.7)' }}>廃棄品は原価ゼロ → 売上がそのまま利益に</p>
                </div>
                <p style={{ fontFamily: font, fontSize: '4vw', fontWeight: 900, color: '#FBF8F4' }}>¥30,000</p>
              </div>
            </div>

          </div>

          <p style={{ fontFamily: font, fontSize: '1.3vw', color: 'rgba(42,38,35,0.4)', marginTop: '2.5vh' }}>
            ※ 上記はシミュレーション例です。実際の売上は店舗・商品・状況により異なります。
          </p>
        </div>
      </div>
    </div>
  );
}
