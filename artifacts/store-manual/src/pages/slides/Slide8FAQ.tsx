export default function Slide8FAQ() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#E8786C', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', padding: '4.5vh 7vw 4.5vh 6vw', gap: '5vw' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.12em', marginBottom: '2vh' }}>SPECIAL CASES</p>
            <div style={{ background: '#2A2623', borderRadius: '1.2vw', padding: '3vh 3vw', marginBottom: '2.5vh' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.9vw', fontWeight: 900, color: '#FBF8F4', marginBottom: '1.5vh' }}>オーナーと店長が違う場合</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: 'rgba(251,248,244,0.75)', lineHeight: 1.65, marginBottom: '1.5vh' }}>代表者情報・口座登録は必ず<span style={{ color: '#E8786C', fontWeight: 700 }}>売上を受け取るオーナー本人の情報</span>を入力してください。雇われ店長の方が登録する場合は、オーナーの方に以下を用意してもらってください。</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8vh' }}>
                <div style={{ display: 'flex', gap: '1vw', alignItems: 'center' }}>
                  <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', background: '#E8786C', flexShrink: 0 }} />
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: 'rgba(251,248,244,0.85)' }}>氏名（漢字・カナ）、生年月日、自宅住所</p>
                </div>
                <div style={{ display: 'flex', gap: '1vw', alignItems: 'center' }}>
                  <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', background: '#E8786C', flexShrink: 0 }} />
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: 'rgba(251,248,244,0.85)' }}>運転免許証またはマイナンバーカードの写真（表裏）</p>
                </div>
                <div style={{ display: 'flex', gap: '1vw', alignItems: 'center' }}>
                  <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', background: '#E8786C', flexShrink: 0 }} />
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: 'rgba(251,248,244,0.85)' }}>振込先口座の通帳またはキャッシュカード（銀行コード・支店コード・口座番号・名義カナ）</p>
                </div>
              </div>
            </div>
            <div style={{ background: '#F5FAF4', borderRadius: '1.2vw', padding: '2.5vh 3vw', border: '1px solid rgba(68,168,54,0.3)' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.9vw', fontWeight: 900, color: '#2A2623', marginBottom: '1.2vh' }}>口座登録を後でやりたい場合</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#2A2623', lineHeight: 1.65, marginBottom: '1.2vh' }}>店舗情報（STEP 2）の登録を完了すれば、口座登録（STEP 3〜5）は<span style={{ color: '#44A836', fontWeight: 700 }}>後日ログインして続きから行うことができます。</span></p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8vh' }}>
                <div style={{ display: 'flex', gap: '1vw', alignItems: 'center' }}>
                  <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', background: '#44A836', flexShrink: 0 }} />
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#2A2623' }}>ログイン後、「口座・本人確認の設定に進む」から再開できます</p>
                </div>
                <div style={{ display: 'flex', gap: '1vw', alignItems: 'center' }}>
                  <div style={{ width: '1.5vw', height: '1.5vw', borderRadius: '50%', background: '#44A836', flexShrink: 0 }} />
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#2A2623' }}>口座登録が完了するまで出品・売上受け取りはできません</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
