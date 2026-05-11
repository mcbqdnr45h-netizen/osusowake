const base = import.meta.env.BASE_URL;

export default function Slide1Title() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "#FFFFFF", fontFamily: "'Inter', 'Noto Sans JP', sans-serif", position: "relative", boxSizing: "border-box", padding: "5vh 5vw" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: "1.6vw", fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>おすそわけ</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#4A5568", display: "flex", flexDirection: "column", gap: "0.8vh", textAlign: "right" }}>
          <div><span style={{ color: "#A0AEC0", marginRight: "1vw" }}>提出先:</span>各自治体 ご担当部署</div>
          <div><span style={{ color: "#A0AEC0", marginRight: "1vw" }}>作成:</span>おすそわけ運営事務局</div>
          <div><span style={{ color: "#A0AEC0", marginRight: "1vw" }}>連絡先:</span>hello@osusowakejapan.org</div>
          <div><span style={{ color: "#A0AEC0", marginRight: "1vw" }}>区分:</span>連携提案資料</div>
        </div>
      </div>

      {/* Hero image strip */}
      <div style={{ position: "absolute", top: 0, right: 0, width: "40vw", height: "100vh", overflow: "hidden" }}>
        <img src={`${base}hero-city.png`} crossOrigin="anonymous" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.18 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #FFFFFF 0%, transparent 40%)" }} />
      </div>

      {/* Title block */}
      <div style={{ position: "absolute", bottom: "14vh", left: "5vw", width: "62vw" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.1vw", color: "#A0AEC0", letterSpacing: "0.1em", marginBottom: "2.5vh" }}>PARTNERSHIP PROPOSAL — 自治体連携提案</div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "-2vw", top: "2.5vh", width: "28vw", height: "6vh", backgroundColor: "#0A1628", opacity: 0.07, zIndex: 0 }} />
          <h1 style={{ fontSize: "5.5vw", fontWeight: 900, color: "#0A1628", margin: 0, lineHeight: 1.05, letterSpacing: "-0.03em", position: "relative", zIndex: 1 }}>
            食品ロス削減と<br />地域活性化を<br />同時に実現する
          </h1>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "5vh" }}>
          <p style={{ fontSize: "1.8vw", fontWeight: 500, color: "#4A5568", margin: 0, maxWidth: "45vw", lineHeight: 1.5 }}>
            スマートフォンアプリ「おすそわけ」を活用した<br />自治体・地域事業者との連携モデルのご提案
          </p>
          <div style={{ width: "20vw", height: "1px", backgroundColor: "#E2E8F0" }} />
        </div>
      </div>
    </div>
  );
}
