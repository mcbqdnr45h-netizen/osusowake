import React from 'react';

export default function FlyerStore() {
  return (
    <div className="flyer-root">
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        html, body, #root { background: #f3f4f6 !important; }
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
        .a4 {
          width: 210mm;
          height: 297mm;
          background: #0F172A;
          color: #F8FAFC;
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
        .glow1 { position: absolute; top: -180px; right: -180px; width: 520px; height: 520px; border-radius: 50%; background: radial-gradient(circle, rgba(238,118,102,0.5) 0%, transparent 70%); }
        .glow2 { position: absolute; bottom: -100px; left: -100px; width: 380px; height: 380px; border-radius: 50%; background: radial-gradient(circle, rgba(255,211,122,0.35) 0%, transparent 70%); }
        .grid-bg {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(238,118,102,0.18);
          color: #FFB8AB;
          border: 1px solid rgba(238,118,102,0.4);
          font-weight: 700;
          padding: 6px 14px; border-radius: 999px; font-size: 13px;
        }
        .h1 {
          font-size: 64px; font-weight: 900; line-height: 1.05;
          letter-spacing: -0.02em; color: #fff; margin: 0;
        }
        .h1 .accent {
          background: linear-gradient(135deg, #EE7666 0%, #FFD37A 100%);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .sub {
          font-size: 18px; line-height: 1.6; color: #CBD5E1;
          margin-top: 18px; max-width: 500px;
        }

        .pain {
          background: rgba(248, 113, 113, 0.1);
          border-left: 3px solid #F87171;
          border-radius: 8px;
          padding: 12px 16px;
          color: #FCA5A5;
          font-size: 14px;
          font-weight: 600;
        }
        .pain strong { color: #fff; font-size: 16px; }

        .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .stat {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 18px 12px; text-align: center;
          backdrop-filter: blur(10px);
        }
        .stat-num {
          font-size: 36px; font-weight: 900; line-height: 1;
          background: linear-gradient(135deg, #EE7666 0%, #FFD37A 100%);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .stat-num small { font-size: 18px; }
        .stat-label { font-size: 12px; color: #94A3B8; margin-top: 6px; font-weight: 600; }

        .benefit {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 0;
          border-bottom: 1px dashed rgba(255,255,255,0.1);
        }
        .check {
          width: 22px; height: 22px; border-radius: 50%;
          background: linear-gradient(135deg, #EE7666 0%, #FFD37A 100%);
          color: #0F172A; display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 14px; flex-shrink: 0;
        }
        .benefit-text { font-size: 13px; line-height: 1.5; color: #E2E8F0; }
        .benefit-text strong { color: #fff; font-size: 14px; }

        .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .step {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(238,118,102,0.3);
          border-radius: 14px; padding: 14px 12px; position: relative;
        }
        .step-num {
          position: absolute; top: -12px; left: 14px;
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #EE7666 0%, #FFD37A 100%);
          color: #0F172A; font-weight: 900;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
        }
        .step-emoji { font-size: 28px; line-height: 1; }
        .step-title { font-size: 14px; font-weight: 800; margin-top: 6px; color: #fff; }
        .step-desc { font-size: 11px; color: #94A3B8; line-height: 1.5; margin-top: 4px; }

        .qr-box {
          width: 110px; height: 110px;
          border: 2.5px dashed #FFD37A; border-radius: 14px;
          background: rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          color: #FFD37A; font-weight: 700; font-size: 11px; text-align: center;
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
        <div className="grid-bg" />
        <div className="glow1" />
        <div className="glow2" />

        {/* === HEADER === */}
        <div style={{ padding: '32px 40px 0', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="badge">🏪 飲食店オーナー様へ</span>
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>初期費用・月額0円</span>
          </div>
        </div>

        {/* === HERO === */}
        <div style={{ padding: '24px 40px 0', position: 'relative', zIndex: 2 }}>
          <h1 className="h1">
            その廃棄、<br/>
            <span className="accent">売上に変えませんか?</span>
          </h1>
          <p className="sub">
            閉店前の余り在庫を、半額で販売。<br/>
            廃棄コスト削減 × 新規顧客獲得を、同時に実現します。
          </p>
        </div>

        {/* === PAIN POINT === */}
        <div style={{ padding: '20px 40px 0', position: 'relative', zIndex: 2 }}>
          <div className="pain">
            <strong>毎日の食品廃棄、見ないふりしていませんか?</strong><br/>
            日本の事業系食品ロスは年間 <span style={{ color: '#fff', fontWeight: 800 }}>約279万トン</span>。<br/>
            1店舗あたり年間 <span style={{ color: '#fff', fontWeight: 800 }}>数十万円</span>規模の損失に。
          </div>
        </div>

        {/* === STATS === */}
        <div style={{ padding: '20px 40px 0', position: 'relative', zIndex: 2 }}>
          <div className="stat-row">
            <div className="stat">
              <div className="stat-num">¥0</div>
              <div className="stat-label">初期費用・月額</div>
            </div>
            <div className="stat">
              <div className="stat-num">10<small>%</small></div>
              <div className="stat-label">成果報酬のみ</div>
            </div>
            <div className="stat">
              <div className="stat-num">5<small>分</small></div>
              <div className="stat-label">で出品開始</div>
            </div>
          </div>
        </div>

        {/* === BENEFITS === */}
        <div style={{ padding: '20px 40px 0', position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            💡 おすそわけで、こう変わります
          </div>
          <div className="benefit">
            <div className="check">✓</div>
            <div className="benefit-text">
              <strong>廃棄コスト削減</strong> ── 捨てるはずの食材が売上に
            </div>
          </div>
          <div className="benefit">
            <div className="check">✓</div>
            <div className="benefit-text">
              <strong>新規顧客獲得</strong> ── アプリ経由で初来店のお客様が増加
            </div>
          </div>
          <div className="benefit">
            <div className="check">✓</div>
            <div className="benefit-text">
              <strong>SDGs/環境貢献</strong> ── 食品ロス削減の取組をPR可能
            </div>
          </div>
          <div className="benefit" style={{ borderBottom: 'none' }}>
            <div className="check">✓</div>
            <div className="benefit-text">
              <strong>運営は超カンタン</strong> ── スマホで在庫登録・自動決済
            </div>
          </div>
        </div>

        {/* === STEPS === */}
        <div style={{ padding: '24px 40px 0', position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 18 }}>
            🚀 出店までは3ステップ
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-emoji">📝</div>
              <div className="step-title">無料で店舗登録</div>
              <div className="step-desc">アプリから5分で申込・即日審査</div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-emoji">📦</div>
              <div className="step-title">余り食材を出品</div>
              <div className="step-desc">写真・価格・受取時間を入れるだけ</div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-emoji">💰</div>
              <div className="step-title">売上を受け取る</div>
              <div className="step-desc">決済はアプリ内で自動・週次振込</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* === FOOTER === */}
        <div className="footer-band" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="qr-box" style={{ background: '#fff', borderColor: '#fff', color: '#EE7666' }}>
              QR<br/>(公開後)
            </div>
            <div>
              <div className="logo">
                おすそわけ
                <small>OSUSOWAKE for Business</small>
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
              廃棄ゼロ、<br/>売上アップ。
            </div>
            <div style={{ fontSize: 11, marginTop: 6, opacity: 0.95 }}>
              まずは無料登録から。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
