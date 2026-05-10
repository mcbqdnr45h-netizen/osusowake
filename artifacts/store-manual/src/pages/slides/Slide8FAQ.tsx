export default function Slide8FAQ() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#E8786C', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4.5vh 8vw 4.5vh 6vw' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.12em', marginBottom: '2vh' }}>FAQ</p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3.5vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, marginBottom: '3.5vh' }}>よくある質問</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2vh 4vw' }}>
            <div style={{ borderLeft: '3px solid #E8786C', paddingLeft: '1.5vw' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.8vh' }}>口座登録は後でできますか？</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A', lineHeight: 1.55 }}>できます。店舗情報の登録を完了後、ログインして「口座・本人確認の設定に進む」から再開してください。口座登録が完了するまで出品はできません。</p>
            </div>
            <div style={{ borderLeft: '3px solid #44A836', paddingLeft: '1.5vw' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.8vh' }}>代表者情報は何を入力すればいい？</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A', lineHeight: 1.55 }}>売上の振込先口座の名義人の情報を入力してください。氏名・生年月日・自宅住所・本人確認書類が必要です。</p>
            </div>
            <div style={{ borderLeft: '3px solid #E8786C', paddingLeft: '1.5vw' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.8vh' }}>売れ残った場合は費用がかかる？</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A', lineHeight: 1.55 }}>いいえ。月額固定費は一切なし。売れた分だけ25%の手数料が発生します。</p>
            </div>
            <div style={{ borderLeft: '3px solid #44A836', paddingLeft: '1.5vw' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.8vh' }}>銀行コードがわからない場合は？</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A', lineHeight: 1.55 }}>通帳・キャッシュカード・銀行アプリで確認できます。ゆうちょ銀行の場合は9900です。</p>
            </div>
            <div style={{ borderLeft: '3px solid #E8786C', paddingLeft: '1.5vw' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.8vh' }}>出品をやめたいときは？</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A', lineHeight: 1.55 }}>ダッシュボードからいつでも出品の停止・再開ができます。退会も随時可能です。</p>
            </div>
            <div style={{ borderLeft: '3px solid #44A836', paddingLeft: '1.5vw' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.8vh' }}>わからないことがあったら？</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A', lineHeight: 1.55 }}>hello@osusowakejapan.org にお問い合わせください。担当者が対応します。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
