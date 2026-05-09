export default function Slide5Pricing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#E8786C', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '6vh 7vw 6vh 6vw' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.12em', marginBottom: '2vh' }}>
            PRICING
          </p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '4vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: '5vh' }}>
            料金・手数料
          </h2>
          <div style={{ display: 'flex', gap: '2.5vw', maxWidth: '80vw' }}>
            <div style={{ flex: 1, background: 'rgba(232,120,108,0.07)', borderRadius: '1.2vw', padding: '3.5vh 3vw', border: '1px solid rgba(232,120,108,0.2)' }}>
              <p style={{ fontFamily: "'MS Mincho', 'MS 明朝', serif", fontSize: '4.5vw', fontWeight: 900, color: '#2A2623', lineHeight: 1, marginBottom: '1.2vh' }}>
                無料
              </p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', color: '#2A2623', marginBottom: '2.5vh' }}>
                初期費用・月額固定費
              </p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: 'rgba(42,38,35,0.55)', lineHeight: 1.6 }}>
                売れなければ費用ゼロ。リスクなしでスタートできます
              </p>
            </div>
            <div style={{ flex: 1, background: 'rgba(232,120,108,0.1)', borderRadius: '1.2vw', padding: '3.5vh 3vw', border: '1px solid rgba(232,120,108,0.3)' }}>
              <p style={{ fontFamily: "'MS Mincho', 'MS 明朝', serif", fontSize: '4.5vw', fontWeight: 900, color: '#E8786C', lineHeight: 1, marginBottom: '1.2vh' }}>
                25<span style={{ fontSize: '2.2vw' }}>%</span>
              </p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', color: '#2A2623', marginBottom: '2.5vh' }}>
                店舗様の手数料（販売額より）
              </p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: 'rgba(42,38,35,0.55)', lineHeight: 1.6 }}>
                別途、ユーザー側から5%いただきます。固定費は一切なし。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
