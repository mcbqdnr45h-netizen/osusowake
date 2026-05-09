export default function Slide5Pricing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#2A2623' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 70% at 80% 50%, rgba(232,120,108,0.12) 0%, transparent 70%)' }}
      />
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#E8786C', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '6vh 7vw 6vh 6vw' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.12em', marginBottom: '2vh' }}>
            PRICING
          </p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '4vw', fontWeight: 900, color: '#FBF8F4', lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: '5vh' }}>
            料金・手数料
          </h2>
          <div style={{ display: 'flex', gap: '2.5vw', maxWidth: '75vw' }}>
            <div style={{ flex: 1, background: 'rgba(251,248,244,0.06)', borderRadius: '1.2vw', padding: '3.5vh 3vw', border: '1px solid rgba(251,248,244,0.1)' }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '4.5vw', fontWeight: 900, color: '#FBF8F4', lineHeight: 1, marginBottom: '1.2vh' }}>
                無料
              </p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', color: 'rgba(251,248,244,0.7)', marginBottom: '2.5vh' }}>
                初期費用・月額固定費
              </p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: 'rgba(251,248,244,0.5)', lineHeight: 1.6 }}>
                登録から運用開始まで<br />一切固定費はかかりません
              </p>
            </div>
            <div style={{ flex: 1, background: 'rgba(232,120,108,0.15)', borderRadius: '1.2vw', padding: '3.5vh 3vw', border: '1px solid rgba(232,120,108,0.3)' }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '4.5vw', fontWeight: 900, color: '#E8786C', lineHeight: 1, marginBottom: '1.2vh' }}>
                成果報酬
              </p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', color: 'rgba(251,248,244,0.7)', marginBottom: '2.5vh' }}>
                販売金額の手数料のみ
              </p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: 'rgba(251,248,244,0.5)', lineHeight: 1.6 }}>
                売れなければ費用ゼロ<br />リスクなしでスタートできます
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
