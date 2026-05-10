export default function Slide2Overview() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#E8786C', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '5vh 7vw 5vh 6vw' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.12em', marginBottom: '2vh' }}>OVERVIEW</p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3.8vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, marginBottom: '4vh' }}>登録の全体像</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6vh' }}>
            <div style={{ display: 'flex', gap: '2vw', alignItems: 'center', background: '#FDF0EE', borderRadius: '0.8vw', padding: '1.8vh 2.5vw' }}>
              <div style={{ width: '3.5vw', height: '3.5vw', borderRadius: '50%', background: '#E8786C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8vw', fontWeight: 900, color: '#FBF8F4' }}>1</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.9vw', fontWeight: 700, color: '#2A2623' }}>アカウント作成</p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A' }}>メールアドレス＋パスワードで登録 → メール認証</p>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#E8786C', flexShrink: 0 }}>約2分</p>
            </div>
            <div style={{ display: 'flex', gap: '2vw', alignItems: 'center', background: '#F5FAF4', borderRadius: '0.8vw', padding: '1.8vh 2.5vw' }}>
              <div style={{ width: '3.5vw', height: '3.5vw', borderRadius: '50%', background: '#44A836', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8vw', fontWeight: 900, color: '#FBF8F4' }}>2</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.9vw', fontWeight: 700, color: '#2A2623' }}>店舗情報の入力</p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A' }}>店名・住所・ジャンル・店舗写真・アイコン・電話番号</p>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#44A836', flexShrink: 0 }}>約5分</p>
            </div>
            <div style={{ display: 'flex', gap: '2vw', alignItems: 'center', background: '#FDF0EE', borderRadius: '0.8vw', padding: '1.8vh 2.5vw' }}>
              <div style={{ width: '3.5vw', height: '3.5vw', borderRadius: '50%', background: '#E8786C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8vw', fontWeight: 900, color: '#FBF8F4' }}>3</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.9vw', fontWeight: 700, color: '#2A2623' }}>代表者情報・本人確認書類のアップロード</p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A' }}>氏名・生年月日・住所・免許証など（売上受け取りのため必須）</p>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#E8786C', flexShrink: 0 }}>約5分</p>
            </div>
            <div style={{ display: 'flex', gap: '2vw', alignItems: 'center', background: '#F5FAF4', borderRadius: '0.8vw', padding: '1.8vh 2.5vw' }}>
              <div style={{ width: '3.5vw', height: '3.5vw', borderRadius: '50%', background: '#44A836', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8vw', fontWeight: 900, color: '#FBF8F4' }}>4</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.9vw', fontWeight: 700, color: '#2A2623' }}>振込口座の登録</p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A' }}>銀行コード・支店コード・口座番号・口座名義（カナ）</p>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#44A836', flexShrink: 0 }}>約3分</p>
            </div>
            <div style={{ display: 'flex', gap: '2vw', alignItems: 'center', background: '#2A2623', borderRadius: '0.8vw', padding: '1.8vh 2.5vw' }}>
              <div style={{ width: '3.5vw', height: '3.5vw', borderRadius: '50%', background: '#FBF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8vw', fontWeight: 900, color: '#2A2623' }}>5</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.9vw', fontWeight: 700, color: '#FBF8F4' }}>審査通過 → 出品開始</p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: 'rgba(251,248,244,0.6)' }}>審査は最短3日。通過後はダッシュボードからすぐに出品可能</p>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: 'rgba(251,248,244,0.5)', flexShrink: 0 }}>最短3日</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
