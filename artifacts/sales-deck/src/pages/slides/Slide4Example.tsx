export default function Slide4Example() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#44A836', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4vh 7vw 4vh 6vw' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#44A836', letterSpacing: '0.12em', marginBottom: '1.5vh' }}>
            EXAMPLE
          </p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3.8vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: '4vh' }}>
            売上シミュレーション
          </h2>

          <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'stretch' }}>

            <div style={{ flex: 1, background: '#F0F7EE', borderRadius: '1vw', padding: '3vh 2.5vw', border: '1px solid rgba(68,168,54,0.2)' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#44A836', marginBottom: '2vh' }}>
                想定条件
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2vh' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(68,168,54,0.15)', paddingBottom: '1vh' }}>
                  <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#2A2623' }}>1日の出品数</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2vw', fontWeight: 800, color: '#2A2623' }}>10袋</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(68,168,54,0.15)', paddingBottom: '1vh' }}>
                  <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#2A2623' }}>1袋あたりの価格</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2vw', fontWeight: 800, color: '#2A2623' }}>¥500</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#2A2623' }}>稼働日数</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2vw', fontWeight: 800, color: '#2A2623' }}>25日/月</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 0.5vw', color: 'rgba(42,38,35,0.25)', fontSize: '2.5vw' }}>
              →
            </div>

            <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', gap: '1.2vh' }}>
              <div style={{ background: '#2A2623', borderRadius: '1vw', padding: '2.2vh 2.5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: 'rgba(251,248,244,0.6)', marginBottom: '0.3vh' }}>月間売上（手数料前）</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: 'rgba(251,248,244,0.4)' }}>10袋 × ¥500 × 25日</p>
                </div>
                <p style={{ fontFamily: "'MS Mincho', 'MS 明朝', serif", fontSize: '3vw', fontWeight: 900, color: '#FBF8F4' }}>¥125,000</p>
              </div>
              <div style={{ background: '#E8786C', borderRadius: '1vw', padding: '2.2vh 2.5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: 'rgba(251,248,244,0.85)', marginBottom: '0.3vh' }}>手数料（25%）</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: 'rgba(251,248,244,0.65)' }}>おすそわけへの成果報酬</p>
                </div>
                <p style={{ fontFamily: "'MS Mincho', 'MS 明朝', serif", fontSize: '3vw', fontWeight: 900, color: '#FBF8F4' }}>−¥31,250</p>
              </div>
              <div style={{ background: '#44A836', borderRadius: '1vw', padding: '2.2vh 2.5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: 'rgba(251,248,244,0.9)', marginBottom: '0.3vh' }}>店舗の純収益</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: 'rgba(251,248,244,0.7)' }}>廃棄していた分がそのまま利益に</p>
                </div>
                <p style={{ fontFamily: "'MS Mincho', 'MS 明朝', serif", fontSize: '3vw', fontWeight: 900, color: '#FBF8F4' }}>¥93,750</p>
              </div>
            </div>

          </div>

          <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: 'rgba(42,38,35,0.45)', marginTop: '2.5vh' }}>
            ※ 上記はシミュレーション例です。実際の売上は店舗・商品・状況により異なります。
          </p>
        </div>
      </div>
    </div>
  );
}
