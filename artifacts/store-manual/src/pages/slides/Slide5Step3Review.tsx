export default function Slide5Step3Review() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#E8786C', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '5vh 8vw 5vh 6vw' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5vw', marginBottom: '2vh' }}>
            <div style={{ width: '5vw', height: '5vw', borderRadius: '50%', background: '#E8786C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.5vw', fontWeight: 900, color: '#FBF8F4' }}>3</span>
            </div>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.12em' }}>STEP 3</p>
          </div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3.8vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, marginBottom: '5vh' }}>
            審査・承認待ち
          </h2>
          <div style={{ display: 'flex', gap: '3vw' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2.5vh' }}>
              <div style={{ background: '#FDF0EE', borderRadius: '1vw', padding: '3vh 2.5vw' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '2vw', fontWeight: 700, color: '#2A2623', marginBottom: '1vh' }}>審査期間</p>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '4vw', fontWeight: 900, color: '#E8786C', lineHeight: 1 }}>最短3日</p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A', marginTop: '0.5vh' }}>通常1〜3営業日以内</p>
              </div>
              <div style={{ background: '#F5FAF4', borderRadius: '1vw', padding: '3vh 2.5vw' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '2vw', fontWeight: 700, color: '#2A2623', marginBottom: '1vh' }}>承認後の通知</p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', color: '#44A836', fontWeight: 700 }}>登録したメールアドレスに通知が届きます</p>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2vh' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.5vh' }}>審査でチェックされること</p>
              <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
                <div style={{ width: '1.8vw', height: '1.8vw', borderRadius: '50%', background: '#E8786C', flexShrink: 0, marginTop: '0.3vh' }} />
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', color: '#2A2623' }}>実在する店舗であること</p>
              </div>
              <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
                <div style={{ width: '1.8vw', height: '1.8vw', borderRadius: '50%', background: '#E8786C', flexShrink: 0, marginTop: '0.3vh' }} />
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', color: '#2A2623' }}>食品を取り扱っていること</p>
              </div>
              <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
                <div style={{ width: '1.8vw', height: '1.8vw', borderRadius: '50%', background: '#E8786C', flexShrink: 0, marginTop: '0.3vh' }} />
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', color: '#2A2623' }}>店舗写真が適切であること</p>
              </div>
              <div style={{ display: 'flex', gap: '1.2vw', alignItems: 'flex-start' }}>
                <div style={{ width: '1.8vw', height: '1.8vw', borderRadius: '50%', background: '#E8786C', flexShrink: 0, marginTop: '0.3vh' }} />
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', color: '#2A2623' }}>住所・地図が正確であること</p>
              </div>
              <div style={{ background: 'rgba(68,168,54,0.1)', borderRadius: '0.8vw', padding: '2vh 2vw', marginTop: '1vh', border: '1px solid rgba(68,168,54,0.25)' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#44A836', fontWeight: 700 }}>審査中も情報の修正は可能です</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
