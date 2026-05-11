export default function Slide2Problem() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "#FFFFFF", fontFamily: "'Inter', 'Noto Sans JP', sans-serif", position: "relative", boxSizing: "border-box", padding: "4vh 5vw", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3vh" }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "-1vw", top: "1.5vh", width: "22vw", height: "3vh", backgroundColor: "#0A1628", opacity: 0.08, zIndex: 0 }} />
          <h2 style={{ fontSize: "3.5vw", fontWeight: 900, color: "#0A1628", margin: 0, lineHeight: 1, letterSpacing: "-0.03em", position: "relative", zIndex: 1 }}>日本の食品ロス問題</h2>
        </div>
        <div style={{ fontSize: "1.2vw", fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>おすそわけ</div>
      </div>

      <div style={{ display: "flex", gap: "2vw", flex: 1, minHeight: 0, marginBottom: "2.5vh" }}>
        <div style={{ flex: 1.1, backgroundColor: "#0A1628", color: "#FFFFFF", padding: "3.5vh 2.5vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0", marginBottom: "1.5vh" }}>年間食品ロス量（令和3年度）</div>
            <div style={{ fontSize: "6vw", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.04em" }}>472<span style={{ fontSize: "2.2vw", fontWeight: 700 }}>万トン</span></div>
          </div>
          <div>
            <div style={{ width: "100%", height: "1px", backgroundColor: "rgba(255,255,255,0.15)", marginBottom: "2vh" }} />
            <div style={{ fontSize: "1.3vw", color: "#E2E8F0", lineHeight: 1.6 }}>国民1人あたり毎日おにぎり約<strong>1個分（103g）</strong>を廃棄している計算です。</div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2vh" }}>
          <div style={{ flex: 1, border: "1px solid #E2E8F0", padding: "2.5vh 2vw", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "2vw" }}>
              <div style={{ fontSize: "3.8vw", fontWeight: 900, color: "#0A1628", letterSpacing: "-0.04em", minWidth: "8vw" }}>半減</div>
              <div>
                <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.6vh" }}>国の目標（2030年度）</div>
                <div style={{ fontSize: "1.15vw", color: "#4A5568", lineHeight: 1.5 }}>2000年比で食品ロスを半減させる数値目標を設定。自治体にも推進計画の策定が求められる。</div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, border: "1px solid #E2E8F0", padding: "2.5vh 2vw", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "2vw" }}>
              <div style={{ fontSize: "3.8vw", fontWeight: 900, color: "#0A1628", letterSpacing: "-0.04em", minWidth: "8vw" }}>2019</div>
              <div>
                <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.6vh" }}>食品ロス削減推進法 施行</div>
                <div style={{ fontSize: "1.15vw", color: "#4A5568", lineHeight: 1.5 }}>国・自治体・事業者・消費者の連携が法的に義務付けられた。民間サービスとの協力が推奨される。</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: "#F7FAFC", border: "1px solid #E2E8F0", padding: "2.2vh 2.5vw" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#718096", marginBottom: "0.8vh" }}>自治体に求められる役割</div>
        <p style={{ fontSize: "1.55vw", fontWeight: 600, color: "#0A1628", margin: 0, lineHeight: 1.5 }}>
          食品ロス削減推進計画の策定・実施において、地域の飲食店・消費者を巻き込む具体的な施策が急務となっています。
        </p>
      </div>

      <div style={{ marginTop: "2vh", paddingTop: "2vh", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#A0AEC0" }}>課題 / おすそわけ 自治体連携提案資料</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#0A1628", fontWeight: 600 }}>02</div>
      </div>
    </div>
  );
}
