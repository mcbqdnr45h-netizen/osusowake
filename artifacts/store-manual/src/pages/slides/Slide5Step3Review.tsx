export default function Slide5Step3Review() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#E8786C', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', padding: '4.5vh 5vw 4.5vh 5vw', gap: '4vw' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5vw', marginBottom: '1.5vh' }}>
              <div style={{ width: '4.5vw', height: '4.5vw', borderRadius: '50%', background: '#E8786C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.2vw', fontWeight: 900, color: '#FBF8F4' }}>3</span>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.12em' }}>STEP 3</p>
            </div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3.2vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, marginBottom: '1vh' }}>代表者情報の入力</h2>
            <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A', marginBottom: '2.5vh' }}>売上を振り込むため、決済会社（Stripe）の本人確認が必要です</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2vh' }}>
              <div style={{ display: 'flex', gap: '1.5vw', background: '#FDF0EE', borderRadius: '0.7vw', padding: '1.3vh 1.8vw', alignItems: 'flex-start' }}>
                <div style={{ background: '#E8786C', color: '#FBF8F4', borderRadius: '0.4vw', padding: '0.2vh 0.7vw', fontFamily: 'Outfit, sans-serif', fontSize: '1.1vw', fontWeight: 700, flexShrink: 0, marginTop: '0.3vh' }}>必須</div>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.2vh' }}>事業形態の選択</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: '#8A7F7A' }}>個人事業主 または 法人　どちらかを選ぶ</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', background: '#FDF0EE', borderRadius: '0.7vw', padding: '1.3vh 1.8vw', alignItems: 'flex-start' }}>
                <div style={{ background: '#E8786C', color: '#FBF8F4', borderRadius: '0.4vw', padding: '0.2vh 0.7vw', fontFamily: 'Outfit, sans-serif', fontSize: '1.1vw', fontWeight: 700, flexShrink: 0, marginTop: '0.3vh' }}>必須</div>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.2vh' }}>代表者氏名（漢字・カナの両方）</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: '#8A7F7A' }}>姓・名それぞれ入力。カナは全角カタカナで</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', background: '#FDF0EE', borderRadius: '0.7vw', padding: '1.3vh 1.8vw', alignItems: 'flex-start' }}>
                <div style={{ background: '#E8786C', color: '#FBF8F4', borderRadius: '0.4vw', padding: '0.2vh 0.7vw', fontFamily: 'Outfit, sans-serif', fontSize: '1.1vw', fontWeight: 700, flexShrink: 0, marginTop: '0.3vh' }}>必須</div>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.2vh' }}>生年月日</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: '#8A7F7A' }}>年・月・日をそれぞれ選択</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', background: '#FDF0EE', borderRadius: '0.7vw', padding: '1.3vh 1.8vw', alignItems: 'flex-start' }}>
                <div style={{ background: '#E8786C', color: '#FBF8F4', borderRadius: '0.4vw', padding: '0.2vh 0.7vw', fontFamily: 'Outfit, sans-serif', fontSize: '1.1vw', fontWeight: 700, flexShrink: 0, marginTop: '0.3vh' }}>必須</div>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.2vh' }}>代表者の自宅住所（郵便番号・都道府県・市区町村・番地）</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: '#8A7F7A' }}>郵便番号を入力すると住所が自動補完されます。漢字・カナ両方入力</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', background: '#FDF0EE', borderRadius: '0.7vw', padding: '1.3vh 1.8vw', alignItems: 'flex-start' }}>
                <div style={{ background: '#E8786C', color: '#FBF8F4', borderRadius: '0.4vw', padding: '0.2vh 0.7vw', fontFamily: 'Outfit, sans-serif', fontSize: '1.1vw', fontWeight: 700, flexShrink: 0, marginTop: '0.3vh' }}>必須</div>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.2vh' }}>電話番号・メールアドレス</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: '#8A7F7A' }}>代表者本人の連絡先（0から始まる10〜11桁）</p>
                </div>
              </div>
            </div>
          </div>
          <div style={{ width: '28vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#2A2623', borderRadius: '1.5vw', padding: '2.5vh 2.5vw', width: '100%' }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.2vw', fontWeight: 700, color: 'rgba(251,248,244,0.45)', letterSpacing: '0.1em', marginBottom: '1.5vh', textAlign: 'center' }}>入力例</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1vh' }}>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.1vw', color: 'rgba(251,248,244,0.4)', marginBottom: '0.3vh' }}>事業形態</p>
                  <div style={{ display: 'flex', gap: '0.8vw' }}>
                    <div style={{ flex: 1, background: '#E8786C', borderRadius: '0.5vw', padding: '0.8vh', textAlign: 'center' }}>
                      <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.3vw', fontWeight: 700, color: '#FBF8F4' }}>個人事業主</p>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(251,248,244,0.08)', borderRadius: '0.5vw', padding: '0.8vh', textAlign: 'center' }}>
                      <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.3vw', color: 'rgba(251,248,244,0.4)' }}>法人</p>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.8vw' }}>
                  <div style={{ flex: 1, background: 'rgba(232,120,108,0.15)', borderRadius: '0.5vw', padding: '0.8vh 1vw', border: '1px solid rgba(232,120,108,0.3)' }}>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.1vw', color: 'rgba(251,248,244,0.4)' }}>姓（漢字）</p>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: '#FBF8F4', fontWeight: 700 }}>山田</p>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(232,120,108,0.15)', borderRadius: '0.5vw', padding: '0.8vh 1vw', border: '1px solid rgba(232,120,108,0.3)' }}>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.1vw', color: 'rgba(251,248,244,0.4)' }}>名（漢字）</p>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: '#FBF8F4', fontWeight: 700 }}>太郎</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.8vw' }}>
                  <div style={{ flex: 1, background: 'rgba(232,120,108,0.15)', borderRadius: '0.5vw', padding: '0.8vh 1vw', border: '1px solid rgba(232,120,108,0.3)' }}>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.1vw', color: 'rgba(251,248,244,0.4)' }}>姓（カナ）</p>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', color: '#FBF8F4', fontWeight: 700 }}>ヤマダ</p>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(232,120,108,0.15)', borderRadius: '0.5vw', padding: '0.8vh 1vw', border: '1px solid rgba(232,120,108,0.3)' }}>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.1vw', color: 'rgba(251,248,244,0.4)' }}>名（カナ）</p>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', color: '#FBF8F4', fontWeight: 700 }}>タロウ</p>
                  </div>
                </div>
                <div style={{ background: 'rgba(232,120,108,0.15)', borderRadius: '0.5vw', padding: '0.8vh 1vw', border: '1px solid rgba(232,120,108,0.3)' }}>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.1vw', color: 'rgba(251,248,244,0.4)' }}>生年月日</p>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', color: '#FBF8F4', fontWeight: 700 }}>1975年 4月 12日</p>
                </div>
                <div style={{ background: 'rgba(232,120,108,0.15)', borderRadius: '0.5vw', padding: '0.8vh 1vw', border: '1px solid rgba(232,120,108,0.3)' }}>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.1vw', color: 'rgba(251,248,244,0.4)' }}>郵便番号</p>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', color: '#FBF8F4', fontWeight: 700 }}>5300001 → 住所自動入力</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
