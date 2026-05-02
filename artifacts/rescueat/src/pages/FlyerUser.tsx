import React from 'react';

export default function FlyerUser() {
  const isPrint = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('print');
  return (
    <div className="flyer-root" data-print={isPrint ? '1' : undefined}>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        .flyer-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #f3f4f6;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .flyer-root[data-print="1"] { padding: 0; min-height: 0; background: transparent; }
        .flyer-root[data-print="1"] .a4 { box-shadow: none; }
        .a4 {
          width: 210mm;
          height: 297mm;
          background: #FFF6E5;
          color: #1a1a1a;
          font-family: 'Noto Sans JP', system-ui, sans-serif;
          position: relative;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
        }
        @media print {
          .flyer-root { padding: 0; box-shadow: none; }
          .a4 { box-shadow: none; }
        }
        .blob1 { position: absolute; top: -120px; right: -120px; width: 420px; height: 420px; border-radius: 50%; background: radial-gradient(circle, #FFD37A 0%, #F08C42 70%); opacity: 0.55; }
        .blob2 { position: absolute; bottom: -180px; left: -140px; width: 480px; height: 480px; border-radius: 50%; background: radial-gradient(circle, #FFA9A0 0%, #EE7666 70%); opacity: 0.45; }

        .badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fff; color: #EE7666; font-weight: 700;
          padding: 6px 14px; border-radius: 999px; font-size: 13px;
          box-shadow: 0 4px 12px rgba(238,118,102,0.25);
        }
        .h1 {
          font-size: 64px; font-weight: 900; line-height: 1.05;
          letter-spacing: -0.02em; color: #1a1a1a; margin: 0;
        }
        .h1 .accent { color: #EE7666; }
        .sub {
          font-size: 18px; line-height: 1.6; color: #555;
          margin-top: 18px; max-width: 480px;
        }
        .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .stat {
          background: #fff; border-radius: 16px; padding: 18px 12px;
          text-align: center; box-shadow: 0 6px 20px rgba(0,0,0,0.06);
        }
        .stat-num { font-size: 36px; font-weight: 900; color: #EE7666; line-height: 1; }
        .stat-num small { font-size: 18px; }
        .stat-label { font-size: 12px; color: #666; margin-top: 6px; font-weight: 600; }

        .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .step {
          background: rgba(255,255,255,0.85); border: 1.5px solid #FFD37A;
          border-radius: 14px; padding: 14px 12px; position: relative;
        }
        .step-num {
          position: absolute; top: -12px; left: 14px;
          width: 28px; height: 28px; border-radius: 50%;
          background: #EE7666; color: #fff; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; box-shadow: 0 3px 8px rgba(238,118,102,0.4);
        }
        .step-emoji { font-size: 28px; line-height: 1; }
        .step-title { font-size: 14px; font-weight: 800; margin-top: 6px; color: #1a1a1a; }
        .step-desc { font-size: 11px; color: #666; line-height: 1.5; margin-top: 4px; }

        .price-vis {
          display: flex; align-items: center; justify-content: center;
          gap: 16px; padding: 18px 0;
        }
        .price-strike {
          font-size: 28px; color: #999; text-decoration: line-through;
          font-weight: 700;
        }
        .price-arrow { font-size: 32px; color: #EE7666; font-weight: 900; }
        .price-now {
          font-size: 56px; color: #EE7666; font-weight: 900;
          line-height: 1;
        }
        .price-now small { font-size: 22px; }

        .qr-box {
          width: 110px; height: 110px;
          border: 2.5px dashed #EE7666; border-radius: 14px;
          background: rgba(255,255,255,0.6);
          display: flex; align-items: center; justify-content: center;
          color: #EE7666; font-weight: 700; font-size: 11px; text-align: center;
          flex-shrink: 0;
        }

        .footer-band {
          background: linear-gradient(135deg, #EE7666 0%, #F08C42 100%);
          color: #fff; padding: 18px 24px;
          display: flex; justify-content: space-between; align-items: center;
          gap: 20px;
        }
        .logo {
          font-size: 30px; font-weight: 900; letter-spacing: -0.02em;
          line-height: 1;
        }
        .logo small { display: block; font-size: 11px; font-weight: 500; opacity: 0.95; margin-top: 4px; letter-spacing: 0.05em; }
      `}</style>
      <div className="a4">
        <div className="blob1" />
        <div className="blob2" />

        {/* === HEADER === */}
        <div style={{ padding: '32px 40px 0', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="badge">🌍 食品ロス削減アプリ</span>
            <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>iOS / Android / Web 対応</span>
          </div>
        </div>

        {/* === HERO === */}
        <div style={{ padding: '24px 40px 0', position: 'relative', zIndex: 2 }}>
          <h1 className="h1">
            美味しいご飯、<br/>
            <span className="accent">半額で。</span>🍱
          </h1>
          <p className="sub">
            お店の閉店前の余り食材を救出するアプリ。<br/>
            あなたの「いただきます」が、地球を救います。
          </p>
        </div>

        {/* === PRICE VISUAL === */}
        <div style={{ padding: '8px 40px 0', position: 'relative', zIndex: 2 }}>
          <div className="price-vis">
            <span className="price-strike">¥1,500</span>
            <span className="price-arrow">→</span>
            <span className="price-now"><small>¥</small>500</span>
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: '#888', fontWeight: 600, marginTop: -8 }}>
            ※同等の商品をお店で購入した場合との比較イメージ
          </div>
        </div>

        {/* === STATS === */}
        <div style={{ padding: '20px 40px 0', position: 'relative', zIndex: 2 }}>
          <div className="stat-row">
            <div className="stat">
              <div className="stat-num">最大<br/>70<small>%</small></div>
              <div className="stat-label">OFF で買える</div>
            </div>
            <div className="stat">
              <div className="stat-num">¥0</div>
              <div className="stat-label">登録・利用無料</div>
            </div>
            <div className="stat">
              <div className="stat-num">3<small>分</small></div>
              <div className="stat-label">で予約完了</div>
            </div>
          </div>
        </div>

        {/* === STEPS === */}
        <div style={{ padding: '32px 40px 0', position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginBottom: 18 }}>
            📱 はじめ方はカンタン3ステップ
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-emoji">📲</div>
              <div className="step-title">アプリをダウンロード</div>
              <div className="step-desc">無料でインストール、メアドだけで登録OK</div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-emoji">🔍</div>
              <div className="step-title">近所のお店を探す</div>
              <div className="step-desc">地図やカテゴリから今日の救出バッグを発見</div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-emoji">🛍️</div>
              <div className="step-title">予約して受け取り</div>
              <div className="step-desc">指定時間にお店へ。チケット見せるだけ</div>
            </div>
          </div>
        </div>

        {/* === SPACER === */}
        <div style={{ flex: 1 }} />

        {/* === FOOTER BAND === */}
        <div className="footer-band" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="qr-box" style={{ background: '#fff', borderColor: '#fff', color: '#EE7666' }}>
              QR<br/>(公開後)
            </div>
            <div>
              <div className="logo">
                おすそわけ
                <small>おすそわけ — 食品ロス削減</small>
              </div>
              <div style={{ fontSize: 13, marginTop: 10, fontWeight: 600 }}>
                🌐 osusowakejapan.org
              </div>
              <div style={{ fontSize: 11, marginTop: 2, opacity: 0.9 }}>
                ✉ hello@osusowakejapan.org
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1 }}>
              捨てる前に、<br/>救おう。
            </div>
            <div style={{ fontSize: 11, marginTop: 6, opacity: 0.95 }}>
              地球と、お財布に、やさしい。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
