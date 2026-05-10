export default function Slide7Pickup() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#44A836', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', padding: '4.5vh 5vw 4.5vh 5vw', gap: '4vw' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5vw', marginBottom: '1.5vh' }}>
              <div style={{ width: '4.5vw', height: '4.5vw', borderRadius: '50%', background: '#44A836', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.2vw', fontWeight: 900, color: '#FBF8F4' }}>5</span>
              </div>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', fontWeight: 700, color: '#44A836', letterSpacing: '0.12em' }}>STEP 5</p>
            </div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3.2vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, marginBottom: '0.8vh' }}>振込口座の登録</h2>
            <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A', marginBottom: '2.5vh' }}>売上が翌月末に振り込まれる口座を設定します</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2vh' }}>
              <div style={{ display: 'flex', gap: '1.5vw', background: '#F5FAF4', borderRadius: '0.7vw', padding: '1.3vh 1.8vw', alignItems: 'flex-start' }}>
                <div style={{ background: '#44A836', color: '#FBF8F4', borderRadius: '0.4vw', padding: '0.2vh 0.7vw', fontFamily: 'Outfit, sans-serif', fontSize: '1.1vw', fontWeight: 700, flexShrink: 0, marginTop: '0.3vh' }}>必須</div>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.2vh' }}>銀行名・銀行コード（4桁）</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: '#8A7F7A' }}>例：三菱UFJ銀行 → 0005 ／ 三井住友銀行 → 0009 ／ ゆうちょ銀行 → 9900</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', background: '#F5FAF4', borderRadius: '0.7vw', padding: '1.3vh 1.8vw', alignItems: 'flex-start' }}>
                <div style={{ background: '#44A836', color: '#FBF8F4', borderRadius: '0.4vw', padding: '0.2vh 0.7vw', fontFamily: 'Outfit, sans-serif', fontSize: '1.1vw', fontWeight: 700, flexShrink: 0, marginTop: '0.3vh' }}>必須</div>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.2vh' }}>支店コード（3桁）</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: '#8A7F7A' }}>通帳やアプリの「支店番号」欄を確認してください</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', background: '#F5FAF4', borderRadius: '0.7vw', padding: '1.3vh 1.8vw', alignItems: 'flex-start' }}>
                <div style={{ background: '#44A836', color: '#FBF8F4', borderRadius: '0.4vw', padding: '0.2vh 0.7vw', fontFamily: 'Outfit, sans-serif', fontSize: '1.1vw', fontWeight: 700, flexShrink: 0, marginTop: '0.3vh' }}>必須</div>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.2vh' }}>口座番号（7桁）</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: '#8A7F7A' }}>普通預金の口座番号</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5vw', background: '#F5FAF4', borderRadius: '0.7vw', padding: '1.3vh 1.8vw', alignItems: 'flex-start' }}>
                <div style={{ background: '#44A836', color: '#FBF8F4', borderRadius: '0.4vw', padding: '0.2vh 0.7vw', fontFamily: 'Outfit, sans-serif', fontSize: '1.1vw', fontWeight: 700, flexShrink: 0, marginTop: '0.3vh' }}>必須</div>
                <div>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.2vh' }}>口座名義（カタカナ）</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: '#8A7F7A' }}>通帳に記載されている名義を全角カタカナで入力。例：ヤマダタロウ</p>
                </div>
              </div>
              <div style={{ background: 'rgba(68,168,54,0.1)', borderRadius: '0.8vw', padding: '1.5vh 2vw', border: '1px solid rgba(68,168,54,0.3)', marginTop: '0.5vh' }}>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', fontWeight: 700, color: '#44A836', marginBottom: '0.3vh' }}>振込スケジュール</p>
                <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.45vw', color: '#2A2623' }}>月末締め → 翌月末に指定口座へ自動振込。手数料は売上の25%のみ（月額固定費なし）</p>
              </div>
            </div>
          </div>
          <div style={{ width: '28vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0' }}>
            <div style={{ background: '#2A2623', borderRadius: '1.5vw', padding: '2.5vh 2.5vw' }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.2vw', fontWeight: 700, color: 'rgba(251,248,244,0.45)', letterSpacing: '0.1em', marginBottom: '1.5vh', textAlign: 'center' }}>口座登録画面</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1vh' }}>
                <div style={{ background: 'rgba(68,168,54,0.15)', borderRadius: '0.5vw', padding: '0.9vh 1.2vw', border: '1px solid rgba(68,168,54,0.3)' }}>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.1vw', color: 'rgba(251,248,244,0.4)' }}>銀行名</p>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: '#FBF8F4', fontWeight: 700 }}>三菱UFJ銀行</p>
                </div>
                <div style={{ display: 'flex', gap: '0.8vw' }}>
                  <div style={{ flex: 1, background: 'rgba(68,168,54,0.15)', borderRadius: '0.5vw', padding: '0.9vh 1.2vw', border: '1px solid rgba(68,168,54,0.3)' }}>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.1vw', color: 'rgba(251,248,244,0.4)' }}>銀行コード</p>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', color: '#FBF8F4', fontWeight: 700 }}>0005</p>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(68,168,54,0.15)', borderRadius: '0.5vw', padding: '0.9vh 1.2vw', border: '1px solid rgba(68,168,54,0.3)' }}>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.1vw', color: 'rgba(251,248,244,0.4)' }}>支店コード</p>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', color: '#FBF8F4', fontWeight: 700 }}>001</p>
                  </div>
                </div>
                <div style={{ background: 'rgba(68,168,54,0.15)', borderRadius: '0.5vw', padding: '0.9vh 1.2vw', border: '1px solid rgba(68,168,54,0.3)' }}>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.1vw', color: 'rgba(251,248,244,0.4)' }}>口座番号（7桁）</p>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', color: '#FBF8F4', fontWeight: 700 }}>1234567</p>
                </div>
                <div style={{ background: 'rgba(68,168,54,0.15)', borderRadius: '0.5vw', padding: '0.9vh 1.2vw', border: '1px solid rgba(68,168,54,0.3)' }}>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.1vw', color: 'rgba(251,248,244,0.4)' }}>口座名義（カタカナ）</p>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', color: '#FBF8F4', fontWeight: 700 }}>ヤマダタロウ</p>
                </div>
                <div style={{ background: '#44A836', borderRadius: '0.7vw', padding: '1.2vh', textAlign: 'center', marginTop: '0.5vh' }}>
                  <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', fontWeight: 700, color: '#FBF8F4' }}>登録して完了</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
