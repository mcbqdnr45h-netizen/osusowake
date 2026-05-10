export default function Slide4Step2StoreInfo() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#44A836', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', padding: '4.5vh 5vw 4.5vh 5vw', gap: '4vw' }}>
          <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5vw', marginBottom: '1.5vh' }}>
              <div style={{ width: '4.5vw', height: '4.5vw', borderRadius: '50%', background: '#44A836', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.2vw', fontWeight: 900, color: '#FBF8F4' }}>2</span>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', fontWeight: 700, color: '#44A836', letterSpacing: '0.12em' }}>STEP 2</p>
            </div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3.4vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, marginBottom: '3vh' }}>店舗情報の入力</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4vh' }}>
              <div style={{ background: '#F5FAF4', borderRadius: '0.7vw', padding: '1.4vh 1.8vw', display: 'flex', gap: '1.5vw', alignItems: 'flex-start' }}>
                <div style={{ width: '1.8vw', height: '1.8vw', borderRadius: '50%', background: '#44A836', flexShrink: 0, marginTop: '0.4vh' }} />
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.2vh' }}>店舗写真</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.45vw', color: '#8A7F7A' }}>外観・商品など1枚以上。あとで変更可能</p>
                </div>
              </div>
              <div style={{ background: '#F5FAF4', borderRadius: '0.7vw', padding: '1.4vh 1.8vw', display: 'flex', gap: '1.5vw', alignItems: 'flex-start' }}>
                <div style={{ width: '1.8vw', height: '1.8vw', borderRadius: '50%', background: '#44A836', flexShrink: 0, marginTop: '0.4vh' }} />
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.2vh' }}>店舗アイコン（地図ピン用）</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.45vw', color: '#8A7F7A' }}>アプリの地図上に表示される小さなアイコン。正方形推奨</p>
                </div>
              </div>
              <div style={{ background: '#F5FAF4', borderRadius: '0.7vw', padding: '1.4vh 1.8vw', display: 'flex', gap: '1.5vw', alignItems: 'flex-start' }}>
                <div style={{ width: '1.8vw', height: '1.8vw', borderRadius: '50%', background: '#44A836', flexShrink: 0, marginTop: '0.4vh' }} />
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.2vh' }}>店名</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.45vw', color: '#8A7F7A' }}>お店の正式名称（例：〇〇弁当 渋谷店）</p>
                </div>
              </div>
              <div style={{ background: '#F5FAF4', borderRadius: '0.7vw', padding: '1.4vh 1.8vw', display: 'flex', gap: '1.5vw', alignItems: 'flex-start' }}>
                <div style={{ width: '1.8vw', height: '1.8vw', borderRadius: '50%', background: '#44A836', flexShrink: 0, marginTop: '0.4vh' }} />
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.2vh' }}>住所（番地・建物名まで）＋地図確認</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.45vw', color: '#8A7F7A' }}>検索ボックスにお店を入力 → 候補を選択 → 地図でピンを確認</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.35vw', color: '#E8786C', marginTop: '0.3vh' }}>※ 番地まで入力してください。「大阪市〇〇区」だけではエラーになります</p>
                </div>
              </div>
              <div style={{ background: '#F5FAF4', borderRadius: '0.7vw', padding: '1.4vh 1.8vw', display: 'flex', gap: '1.5vw', alignItems: 'flex-start' }}>
                <div style={{ width: '1.8vw', height: '1.8vw', borderRadius: '50%', background: '#44A836', flexShrink: 0, marginTop: '0.4vh' }} />
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.2vh' }}>ジャンル</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.45vw', color: '#8A7F7A' }}>料理・お惣菜 ／ パン・スイーツ ／ 食材・その他</p>
                </div>
              </div>
              <div style={{ background: '#F5FAF4', borderRadius: '0.7vw', padding: '1.4vh 1.8vw', display: 'flex', gap: '1.5vw', alignItems: 'flex-start' }}>
                <div style={{ width: '1.8vw', height: '1.8vw', borderRadius: '50%', background: '#44A836', flexShrink: 0, marginTop: '0.4vh' }} />
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.2vh' }}>店舗電話番号</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.45vw', color: '#8A7F7A' }}>店舗に繋がる番号（携帯・固定どちらでも可）</p>
                </div>
              </div>
            </div>
          </div>
          <div style={{ width: '30vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#2A2623', borderRadius: '2vw', padding: '2.5vh 2.5vw', width: '100%' }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.2vw', fontWeight: 700, color: 'rgba(251,248,244,0.45)', letterSpacing: '0.1em', marginBottom: '1.5vh', textAlign: 'center' }}>実際の入力画面</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1vh' }}>
                <div style={{ background: 'rgba(68,168,54,0.15)', borderRadius: '0.8vw', padding: '1.2vh 1.4vw', border: '1px solid rgba(68,168,54,0.3)' }}>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.1vw', color: 'rgba(251,248,244,0.45)', marginBottom: '0.3vh' }}>店名 *</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#FBF8F4', fontWeight: 700 }}>〇〇弁当 渋谷店</p>
                </div>
                <div style={{ background: 'rgba(68,168,54,0.15)', borderRadius: '0.8vw', padding: '1.2vh 1.4vw', border: '1px solid rgba(68,168,54,0.3)' }}>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.1vw', color: 'rgba(251,248,244,0.45)', marginBottom: '0.3vh' }}>住所 *（番地まで）</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: '#FBF8F4', fontWeight: 700 }}>東京都渋谷区〇〇町1-2-3</p>
                </div>
                <div style={{ background: 'rgba(68,168,54,0.15)', borderRadius: '0.8vw', padding: '1.2vh 1.4vw', border: '1px solid rgba(68,168,54,0.3)' }}>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.1vw', color: 'rgba(251,248,244,0.45)', marginBottom: '0.3vh' }}>ジャンル *</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: '#44A836', fontWeight: 700 }}>料理・お惣菜 ✓</p>
                </div>
                <div style={{ background: 'rgba(68,168,54,0.15)', borderRadius: '0.8vw', padding: '1.2vh 1.4vw', border: '1px solid rgba(68,168,54,0.3)' }}>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.1vw', color: 'rgba(251,248,244,0.45)', marginBottom: '0.3vh' }}>電話番号 *</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: '#FBF8F4', fontWeight: 700 }}>03-XXXX-XXXX</p>
                </div>
                <div style={{ background: '#44A836', borderRadius: '0.7vw', padding: '1.2vh', textAlign: 'center', marginTop: '0.5vh' }}>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', fontWeight: 700, color: '#FBF8F4' }}>登録して次へ進む</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
