export default function Slide2Overview() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#E8786C', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '5vh 8vw 5vh 6vw' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.12em', marginBottom: '2vh' }}>
            OVERVIEW
          </p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '4vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, marginBottom: '5vh' }}>
            登録の流れ（全4ステップ）
          </h2>
          <div style={{ display: 'flex', gap: '2vw', alignItems: 'stretch' }}>
            <div style={{ flex: 1, background: '#FDF0EE', borderRadius: '1vw', padding: '3vh 2.5vw', display: 'flex', flexDirection: 'column', gap: '1.5vh' }}>
              <div style={{ width: '4vw', height: '4vw', borderRadius: '50%', background: '#E8786C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2vw', fontWeight: 900, color: '#FBF8F4' }}>1</span>
              </div>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '2vw', fontWeight: 700, color: '#2A2623' }}>アカウント作成</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#8A7F7A', lineHeight: 1.5 }}>メールアドレスとパスワードで登録</p>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', color: '#E8786C', fontWeight: 700 }}>約2分</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(42,38,35,0.2)', fontSize: '2vw' }}>→</div>
            <div style={{ flex: 1, background: '#F5FAF4', borderRadius: '1vw', padding: '3vh 2.5vw', display: 'flex', flexDirection: 'column', gap: '1.5vh' }}>
              <div style={{ width: '4vw', height: '4vw', borderRadius: '50%', background: '#44A836', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2vw', fontWeight: 900, color: '#FBF8F4' }}>2</span>
              </div>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '2vw', fontWeight: 700, color: '#2A2623' }}>店舗情報の入力</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#8A7F7A', lineHeight: 1.5 }}>店名・住所・カテゴリ・写真を登録</p>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', color: '#44A836', fontWeight: 700 }}>約5分</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(42,38,35,0.2)', fontSize: '2vw' }}>→</div>
            <div style={{ flex: 1, background: '#FDF0EE', borderRadius: '1vw', padding: '3vh 2.5vw', display: 'flex', flexDirection: 'column', gap: '1.5vh' }}>
              <div style={{ width: '4vw', height: '4vw', borderRadius: '50%', background: '#E8786C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2vw', fontWeight: 900, color: '#FBF8F4' }}>3</span>
              </div>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '2vw', fontWeight: 700, color: '#2A2623' }}>審査・承認</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#8A7F7A', lineHeight: 1.5 }}>おすそわけスタッフが確認します</p>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', color: '#E8786C', fontWeight: 700 }}>最短3日</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(42,38,35,0.2)', fontSize: '2vw' }}>→</div>
            <div style={{ flex: 1, background: '#F5FAF4', borderRadius: '1vw', padding: '3vh 2.5vw', display: 'flex', flexDirection: 'column', gap: '1.5vh' }}>
              <div style={{ width: '4vw', height: '4vw', borderRadius: '50%', background: '#44A836', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2vw', fontWeight: 900, color: '#FBF8F4' }}>4</span>
              </div>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '2vw', fontWeight: 700, color: '#2A2623' }}>初回出品</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', color: '#8A7F7A', lineHeight: 1.5 }}>袋を出品してすぐに販売開始</p>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', color: '#44A836', fontWeight: 700 }}>約3分</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
