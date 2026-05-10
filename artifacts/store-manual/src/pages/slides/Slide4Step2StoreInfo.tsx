export default function Slide4Step2StoreInfo() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#44A836', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', padding: '5vh 6vw 5vh 6vw', gap: '5vw' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5vw', marginBottom: '2vh' }}>
              <div style={{ width: '5vw', height: '5vw', borderRadius: '50%', background: '#44A836', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.5vw', fontWeight: 900, color: '#FBF8F4' }}>2</span>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#44A836', letterSpacing: '0.12em' }}>STEP 2</p>
            </div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3.8vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, marginBottom: '4vh' }}>
              店舗情報の入力
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2vh' }}>
              <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'center', background: '#F5FAF4', borderRadius: '0.8vw', padding: '1.8vh 2vw' }}>
                <span style={{ fontSize: '2vw' }}>🏪</span>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', fontWeight: 700, color: '#2A2623' }}>店名</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A' }}>お店の正式名称を入力</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'center', background: '#F5FAF4', borderRadius: '0.8vw', padding: '1.8vh 2vw' }}>
                <span style={{ fontSize: '2vw' }}>📍</span>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', fontWeight: 700, color: '#2A2623' }}>住所・地図</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A' }}>検索バーで店名や住所を入力して地図上で確認</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'center', background: '#F5FAF4', borderRadius: '0.8vw', padding: '1.8vh 2vw' }}>
                <span style={{ fontSize: '2vw' }}>🍱</span>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', fontWeight: 700, color: '#2A2623' }}>カテゴリ</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A' }}>料理・お惣菜 / パン・スイーツ / 食材・その他</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', alignItems: 'center', background: '#F5FAF4', borderRadius: '0.8vw', padding: '1.8vh 2vw' }}>
                <span style={{ fontSize: '2vw' }}>📷</span>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', fontWeight: 700, color: '#2A2623' }}>店舗写真</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A' }}>外観や商品の写真を1枚以上アップロード</p>
                </div>
              </div>
            </div>
          </div>
          <div style={{ width: '32vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#2A2623', borderRadius: '2vw', padding: '3vh 2.5vw', width: '100%', maxWidth: '24vw' }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3vw', fontWeight: 700, color: 'rgba(251,248,244,0.5)', letterSpacing: '0.1em', marginBottom: '2vh', textAlign: 'center' }}>店舗情報入力画面</p>
              <div style={{ background: 'rgba(68,168,54,0.15)', borderRadius: '1vw', padding: '2vh 1.5vw', marginBottom: '1.2vh', border: '1px solid rgba(68,168,54,0.3)' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.2vw', color: 'rgba(251,248,244,0.5)', marginBottom: '0.5vh' }}>店名</p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#FBF8F4', fontWeight: 700 }}>〇〇弁当 渋谷店</p>
              </div>
              <div style={{ background: 'rgba(68,168,54,0.15)', borderRadius: '1vw', padding: '2vh 1.5vw', marginBottom: '1.2vh', border: '1px solid rgba(68,168,54,0.3)' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.2vw', color: 'rgba(251,248,244,0.5)', marginBottom: '0.5vh' }}>カテゴリ</p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#44A836', fontWeight: 700 }}>料理・お惣菜 ✓</p>
              </div>
              <div style={{ background: 'rgba(251,248,244,0.06)', borderRadius: '1vw', padding: '2vh 1.5vw', marginBottom: '2vh', border: '1px dashed rgba(251,248,244,0.2)', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: 'rgba(251,248,244,0.5)' }}>写真をアップロード</p>
              </div>
              <div style={{ background: '#44A836', borderRadius: '0.8vw', padding: '1.5vh', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#FBF8F4' }}>次へ進む</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
