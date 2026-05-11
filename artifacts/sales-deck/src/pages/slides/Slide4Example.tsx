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

          <div style={{ display: 'flex', gap: '3vw', alignItems: 'stretch' }}>

            <div style={{ flex: 1, background: '#F0F7EE', borderRadius: '1vw', padding: '3vh 2.5vw', border: '1px solid rgba(68,168,54,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#44A836', marginBottom: '2.5vh' }}>
                想定条件（控えめ）
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5vh' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(68,168,54,0.15)', paddingBottom: '1.2vh' }}>
                  <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', color: '#2A2623' }}>1日の出品数</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.2vw', fontWeight: 800, color: '#2A2623' }}>3袋</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(68,168,54,0.15)', paddingBottom: '1.2vh' }}>
                  <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', color: '#2A2623' }}>1袋あたりの価格</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.2vw', fontWeight: 800, color: '#2A2623' }}>¥500</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', color: '#2A2623' }}>稼働日数</span>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.2vw', fontWeight: 800, color: '#2A2623' }}>20日/月</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 0.5vw', color: 'rgba(42,38,35,0.25)', fontSize: '2.5vw' }}>
              →
            </div>

            <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5vh' }}>
              <div style={{ background: '#2A2623', borderRadius: '1vw', padding: '2.5vh 2.5vw' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: 'rgba(251,248,244,0.55)', marginBottom: '1vh' }}>計算式</p>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.2vw', fontWeight: 800, color: '#FBF8F4', letterSpacing: '-0.01em' }}>
                  3袋 × ¥500 × 20日
                </p>
              </div>
              <div style={{ background: '#44A836', borderRadius: '1vw', padding: '3vh 2.5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: 'rgba(251,248,244,0.9)', marginBottom: '0.4vh', fontWeight: 700 }}>月間の純収益</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: 'rgba(251,248,244,0.7)' }}>廃棄していた分がそのまま利益に</p>
                </div>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '4vw', fontWeight: 900, color: '#FBF8F4', letterSpacing: '-0.02em' }}>¥30,000</p>
              </div>
            </div>

          </div>

          <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: 'rgba(42,38,35,0.45)', marginTop: '2.5vh' }}>
            ※ 廃棄予定品は原価ゼロのため売上がそのまま純収益になります。手数料25%を差し引いても¥22,500。上記はシミュレーション例です。
          </p>
        </div>
      </div>
    </div>
  );
}
