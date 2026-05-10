export default function Slide8FAQ() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      <div className="absolute inset-0 flex">
        <div style={{ width: '0.6vw', background: '#44A836', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '5vh 8vw 5vh 6vw' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: '#44A836', letterSpacing: '0.12em', marginBottom: '2vh' }}>
            FAQ
          </p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3.8vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, marginBottom: '4vh' }}>
            よくある質問
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2vh 3vw' }}>
            <div style={{ borderLeft: '3px solid #E8786C', paddingLeft: '1.5vw' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.8vh' }}>スマホがなくても使える？</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A', lineHeight: 1.5 }}>ウェブブラウザからも操作できます。スマホ・PC・タブレット対応。</p>
            </div>
            <div style={{ borderLeft: '3px solid #44A836', paddingLeft: '1.5vw' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.8vh' }}>売れ残った場合は？</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A', lineHeight: 1.5 }}>費用は一切かかりません。売れた分だけ25%の手数料が発生します。</p>
            </div>
            <div style={{ borderLeft: '3px solid #E8786C', paddingLeft: '1.5vw' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.8vh' }}>売上の振込はいつ？</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A', lineHeight: 1.5 }}>月末締め・翌月払い。登録時に振込先口座を設定します。</p>
            </div>
            <div style={{ borderLeft: '3px solid #44A836', paddingLeft: '1.5vw' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.8vh' }}>出品をやめたいときは？</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A', lineHeight: 1.5 }}>いつでもダッシュボードから出品を停止・再開できます。</p>
            </div>
            <div style={{ borderLeft: '3px solid #E8786C', paddingLeft: '1.5vw' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.8vh' }}>袋の中身は何でもいい？</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A', lineHeight: 1.5 }}>その日の売れ残り食品であれば自由に詰めてOK。内容は「おまかせ」で出品します。</p>
            </div>
            <div style={{ borderLeft: '3px solid #44A836', paddingLeft: '1.5vw' }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.7vw', fontWeight: 700, color: '#2A2623', marginBottom: '0.8vh' }}>トラブルがあったときは？</p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', color: '#8A7F7A', lineHeight: 1.5 }}>hello@osusowakejapan.org へご連絡ください。担当者が対応します。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
