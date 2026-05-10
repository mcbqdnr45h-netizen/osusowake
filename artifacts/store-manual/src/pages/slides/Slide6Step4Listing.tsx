export default function Slide6Step4Listing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#44A836', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', padding: '5vh 6vw 5vh 6vw', gap: '5vw' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5vw', marginBottom: '2vh' }}>
              <div style={{ width: '5vw', height: '5vw', borderRadius: '50%', background: '#44A836', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.5vw', fontWeight: 900, color: '#FBF8F4' }}>4</span>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#44A836', letterSpacing: '0.12em' }}>STEP 4</p>
            </div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3.8vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, marginBottom: '4vh' }}>
              袋を出品する
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.2vh' }}>
              <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'flex-start' }}>
                <div style={{ width: '2.5vw', height: '2.5vw', borderRadius: '50%', background: '#F5FAF4', border: '2px solid #44A836', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.3vh' }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3vw', fontWeight: 900, color: '#44A836' }}>1</span>
                </div>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.9vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.3vh' }}>ダッシュボードを開く</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#8A7F7A' }}>メール内のリンクまたはQRコードからログイン</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'flex-start' }}>
                <div style={{ width: '2.5vw', height: '2.5vw', borderRadius: '50%', background: '#F5FAF4', border: '2px solid #44A836', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.3vh' }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3vw', fontWeight: 900, color: '#44A836' }}>2</span>
                </div>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.9vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.3vh' }}>「袋を出品」をタップ</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#8A7F7A' }}>出品数・価格・受け取り時間を設定</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'flex-start' }}>
                <div style={{ width: '2.5vw', height: '2.5vw', borderRadius: '50%', background: '#F5FAF4', border: '2px solid #44A836', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.3vh' }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3vw', fontWeight: 900, color: '#44A836' }}>3</span>
                </div>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.9vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.3vh' }}>出品完了・近隣に通知</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#8A7F7A' }}>近くのユーザーに自動通知。お客様を待つだけ</p>
                </div>
              </div>
            </div>
          </div>
          <div style={{ width: '32vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#2A2623', borderRadius: '2vw', padding: '3vh 2.5vw', width: '100%', maxWidth: '24vw' }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3vw', fontWeight: 700, color: 'rgba(251,248,244,0.5)', letterSpacing: '0.1em', marginBottom: '2vh', textAlign: 'center' }}>出品画面</p>
              <div style={{ background: 'rgba(68,168,54,0.12)', borderRadius: '1vw', padding: '1.5vh 1.5vw', marginBottom: '1.2vh', border: '1px solid rgba(68,168,54,0.3)' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.2vw', color: 'rgba(251,248,244,0.5)', marginBottom: '0.5vh' }}>出品数</p>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2vw', fontWeight: 900, color: '#FBF8F4' }}>10 袋</p>
              </div>
              <div style={{ background: 'rgba(68,168,54,0.12)', borderRadius: '1vw', padding: '1.5vh 1.5vw', marginBottom: '1.2vh', border: '1px solid rgba(68,168,54,0.3)' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.2vw', color: 'rgba(251,248,244,0.5)', marginBottom: '0.5vh' }}>1袋の価格</p>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2vw', fontWeight: 900, color: '#FBF8F4' }}>¥ 500</p>
              </div>
              <div style={{ background: 'rgba(68,168,54,0.12)', borderRadius: '1vw', padding: '1.5vh 1.5vw', marginBottom: '2vh', border: '1px solid rgba(68,168,54,0.3)' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.2vw', color: 'rgba(251,248,244,0.5)', marginBottom: '0.5vh' }}>受け取り時間</p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#FBF8F4' }}>18:00 〜 19:30</p>
              </div>
              <div style={{ background: '#44A836', borderRadius: '0.8vw', padding: '1.5vh', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#FBF8F4' }}>出品する</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
