export default function Slide6Step4Listing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#E8786C', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', padding: '4.5vh 5vw 4.5vh 5vw', gap: '4vw' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5vw', marginBottom: '1.5vh' }}>
              <div style={{ width: '4.5vw', height: '4.5vw', borderRadius: '50%', background: '#E8786C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.2vw', fontWeight: 900, color: '#FBF8F4' }}>4</span>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.12em' }}>STEP 4</p>
            </div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3.2vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, marginBottom: '0.8vh' }}>本人確認書類のアップロード</h2>
            <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A', marginBottom: '2.5vh' }}>代表者情報入力の直後に続けて行います</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5vh' }}>
              <div style={{ background: '#FDF0EE', borderRadius: '0.8vw', padding: '2vh 2vw' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '1vh' }}>使える本人確認書類</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8vh' }}>
                  <div style={{ display: 'flex', gap: '1vw', alignItems: 'center' }}>
                    <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', background: '#E8786C', flexShrink: 0 }} />
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#2A2623' }}>運転免許証（表・裏の2枚）</p>
                  </div>
                  <div style={{ display: 'flex', gap: '1vw', alignItems: 'center' }}>
                    <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', background: '#E8786C', flexShrink: 0 }} />
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#2A2623' }}>マイナンバーカード（表・裏の2枚）</p>
                  </div>
                  <div style={{ display: 'flex', gap: '1vw', alignItems: 'center' }}>
                    <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', background: '#E8786C', flexShrink: 0 }} />
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#2A2623' }}>パスポート（顔写真のページのみ）</p>
                  </div>
                </div>
              </div>
              <div style={{ background: '#FDF0EE', borderRadius: '0.8vw', padding: '2vh 2vw' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '1vh' }}>撮影のポイント</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7vh' }}>
                  <div style={{ display: 'flex', gap: '1vw', alignItems: 'center' }}>
                    <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', background: '#E8786C', flexShrink: 0 }} />
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#2A2623' }}>全体が画面に収まるように撮影する</p>
                  </div>
                  <div style={{ display: 'flex', gap: '1vw', alignItems: 'center' }}>
                    <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', background: '#E8786C', flexShrink: 0 }} />
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#2A2623' }}>文字がはっきり読めること（ぼかし・光反射NG）</p>
                  </div>
                  <div style={{ display: 'flex', gap: '1vw', alignItems: 'center' }}>
                    <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', background: '#E8786C', flexShrink: 0 }} />
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#2A2623' }}>有効期限が切れていないもの</p>
                  </div>
                </div>
              </div>
              <div style={{ background: '#F5FAF4', borderRadius: '0.8vw', padding: '1.5vh 2vw', border: '1px solid rgba(68,168,54,0.3)' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', fontWeight: 700, color: '#44A836', marginBottom: '0.3vh' }}>iPhoneをお使いの方へ</p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: '#2A2623' }}>HEIC形式の画像はエラーになる場合があります。設定 → カメラ → フォーマット → 「互換性優先」に変更してから撮影してください</p>
              </div>
            </div>
          </div>
          <div style={{ width: '28vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2vh' }}>
            <div style={{ background: '#2A2623', borderRadius: '1.5vw', padding: '2.5vh 2.5vw' }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.2vw', fontWeight: 700, color: 'rgba(251,248,244,0.45)', letterSpacing: '0.1em', marginBottom: '1.5vh', textAlign: 'center' }}>書類アップロード画面</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2vh' }}>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.2vw', color: 'rgba(251,248,244,0.5)', marginBottom: '0.8vh' }}>表面</p>
                  <div style={{ background: 'rgba(232,120,108,0.15)', border: '2px dashed rgba(232,120,108,0.5)', borderRadius: '0.8vw', padding: '2.5vh', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.3vw', color: 'rgba(251,248,244,0.6)' }}>写真を撮る または</p>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.3vw', color: 'rgba(251,248,244,0.6)' }}>ライブラリから選ぶ</p>
                  </div>
                </div>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.2vw', color: 'rgba(251,248,244,0.5)', marginBottom: '0.8vh' }}>裏面（パスポートは不要）</p>
                  <div style={{ background: 'rgba(232,120,108,0.15)', border: '2px dashed rgba(232,120,108,0.5)', borderRadius: '0.8vw', padding: '2.5vh', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.3vw', color: 'rgba(251,248,244,0.6)' }}>写真を撮る または</p>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.3vw', color: 'rgba(251,248,244,0.6)' }}>ライブラリから選ぶ</p>
                  </div>
                </div>
                <div style={{ background: '#E8786C', borderRadius: '0.7vw', padding: '1.2vh', textAlign: 'center', marginTop: '0.5vh' }}>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', fontWeight: 700, color: '#FBF8F4' }}>送信して次へ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
