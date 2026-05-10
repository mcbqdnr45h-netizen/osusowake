export default function Slide3Step1Account() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#E8786C', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', padding: '5vh 6vw 5vh 6vw', gap: '5vw' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5vw', marginBottom: '2vh' }}>
              <div style={{ width: '5vw', height: '5vw', borderRadius: '50%', background: '#E8786C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.5vw', fontWeight: 900, color: '#FBF8F4' }}>1</span>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.12em' }}>STEP 1</p>
            </div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3.8vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, marginBottom: '4vh' }}>
              アカウント作成
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5vh' }}>
              <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'flex-start' }}>
                <div style={{ width: '2.5vw', height: '2.5vw', borderRadius: '50%', background: '#FDF0EE', border: '2px solid #E8786C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.3vh' }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3vw', fontWeight: 900, color: '#E8786C' }}>1</span>
                </div>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.9vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.3vh' }}>QRコードを読み込む</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#8A7F7A' }}>カメラアプリでQRコードをスキャン</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'flex-start' }}>
                <div style={{ width: '2.5vw', height: '2.5vw', borderRadius: '50%', background: '#FDF0EE', border: '2px solid #E8786C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.3vh' }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3vw', fontWeight: 900, color: '#E8786C' }}>2</span>
                </div>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.9vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.3vh' }}>「店舗として登録」を選ぶ</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#8A7F7A' }}>登録画面でタブを「店舗」に切り替える</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'flex-start' }}>
                <div style={{ width: '2.5vw', height: '2.5vw', borderRadius: '50%', background: '#FDF0EE', border: '2px solid #E8786C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.3vh' }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3vw', fontWeight: 900, color: '#E8786C' }}>3</span>
                </div>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.9vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.3vh' }}>メールアドレスとパスワードを入力</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#8A7F7A' }}>確認メールが届くので認証を完了させる</p>
                </div>
              </div>
            </div>
          </div>
          <div style={{ width: '35vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '2vh' }}>
            <div style={{ background: '#2A2623', borderRadius: '2vw', padding: '3vh 2.5vw', width: '100%', maxWidth: '22vw' }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3vw', fontWeight: 700, color: 'rgba(251,248,244,0.5)', letterSpacing: '0.1em', marginBottom: '2vh', textAlign: 'center' }}>店舗登録画面</p>
              <div style={{ background: 'rgba(251,248,244,0.08)', borderRadius: '1vw', padding: '2vh 1.5vw', marginBottom: '1.5vh' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.3vw', color: 'rgba(251,248,244,0.5)', marginBottom: '0.8vh' }}>メールアドレス</p>
                <div style={{ background: 'rgba(251,248,244,0.12)', borderRadius: '0.5vw', padding: '1vh 1vw', border: '1px solid rgba(232,120,108,0.5)' }}>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', color: '#E8786C' }}>store@example.com</p>
                </div>
              </div>
              <div style={{ background: 'rgba(251,248,244,0.08)', borderRadius: '1vw', padding: '2vh 1.5vw', marginBottom: '2vh' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.3vw', color: 'rgba(251,248,244,0.5)', marginBottom: '0.8vh' }}>パスワード</p>
                <div style={{ background: 'rgba(251,248,244,0.12)', borderRadius: '0.5vw', padding: '1vh 1vw' }}>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', color: 'rgba(251,248,244,0.4)' }}>••••••••</p>
                </div>
              </div>
              <div style={{ background: '#E8786C', borderRadius: '0.8vw', padding: '1.5vh', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#FBF8F4' }}>登録する</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
