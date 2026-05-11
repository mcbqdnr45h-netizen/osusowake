export default function Slide10Contact() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "#0A1628", fontFamily: "'Inter', 'Noto Sans JP', sans-serif", position: "relative", boxSizing: "border-box", padding: "5vh 5vw", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10vh" }}>
        <div style={{ fontSize: "1.5vw", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>おすそわけ</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0", display: "flex", gap: "3vw" }}>
          <div>hello@osusowakejapan.org</div>
          <div>osusowakejapan.org</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", flex: 1 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.1vw", color: "#A0AEC0", letterSpacing: "0.1em", marginBottom: "3vh" }}>NEXT STEPS — 次のステップ</div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "-2vw", top: "2.5vh", width: "35vw", height: "7vh", backgroundColor: "#FFFFFF", opacity: 0.05, zIndex: 0 }} />
          <h2 style={{ fontSize: "5.5vw", fontWeight: 900, color: "#FFFFFF", margin: "0 0 4vh 0", lineHeight: 1.05, letterSpacing: "-0.04em", position: "relative", zIndex: 1 }}>
            まずはお気軽に<br />ご相談ください
          </h2>
        </div>

        <div style={{ display: "flex", gap: "4vw", marginBottom: "6vh" }}>
          <div style={{ borderLeft: "2px solid rgba(255,255,255,0.2)", paddingLeft: "2vw" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0", marginBottom: "0.8vh" }}>メール</div>
            <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#FFFFFF" }}>hello@osusowakejapan.org</div>
          </div>
          <div style={{ borderLeft: "2px solid rgba(255,255,255,0.2)", paddingLeft: "2vw" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0", marginBottom: "0.8vh" }}>ウェブ</div>
            <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#FFFFFF" }}>osusowakejapan.org</div>
          </div>
          <div style={{ borderLeft: "2px solid rgba(255,255,255,0.2)", paddingLeft: "2vw" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0", marginBottom: "0.8vh" }}>対応可能な日程</div>
            <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#FFFFFF" }}>平日 9:00 〜 18:00</div>
          </div>
        </div>

        <div style={{ width: "50vw", height: "1px", backgroundColor: "rgba(255,255,255,0.15)" }} />
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: "5vh", left: "5vw", right: "5vw", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "2vh" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#A0AEC0" }}>お問い合わせ / おすそわけ 自治体連携提案資料</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#FFFFFF", fontWeight: 600 }}>10</div>
      </div>
    </div>
  );
}
