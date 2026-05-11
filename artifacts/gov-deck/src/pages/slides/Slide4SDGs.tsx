export default function Slide4SDGs() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "#FFFFFF", fontFamily: "'Inter', 'Noto Sans JP', sans-serif", position: "relative", boxSizing: "border-box", padding: "5vh 5vw", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4vh" }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "-1vw", top: "1.5vh", width: "24vw", height: "3vh", backgroundColor: "#0A1628", opacity: 0.08, zIndex: 0 }} />
          <h2 style={{ fontSize: "3.5vw", fontWeight: 900, color: "#0A1628", margin: 0, lineHeight: 1, letterSpacing: "-0.03em", position: "relative", zIndex: 1 }}>法的根拠とSDGs</h2>
        </div>
        <div style={{ fontSize: "1.2vw", fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>おすそわけ</div>
      </div>

      <div style={{ display: "flex", gap: "3vw", flex: 1, minHeight: 0 }}>
        {/* Left: legal basis */}
        <div style={{ flex: 1.1, display: "flex", flexDirection: "column", gap: "2vh", overflow: "hidden" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#718096" }}>法的根拠</div>
          <div style={{ border: "1px solid #E2E8F0", padding: "2.2vh 2vw" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0", marginBottom: "0.8vh" }}>令和元年（2019年）施行</div>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.8vh" }}>食品ロスの削減の推進に関する法律</div>
            <p style={{ fontSize: "1.2vw", color: "#4A5568", lineHeight: 1.6, margin: 0 }}>第4条：自治体は食品ロス削減推進計画を策定し、必要な施策を実施する責務を有する。民間との連携推進が明示されている。</p>
          </div>
          <div style={{ border: "1px solid #E2E8F0", padding: "2.2vh 2vw" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0", marginBottom: "0.8vh" }}>第四次循環型社会形成推進基本計画</div>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.8vh" }}>食品ロス削減 数値目標</div>
            <p style={{ fontSize: "1.2vw", color: "#4A5568", lineHeight: 1.6, margin: 0 }}>2030年度までに食品ロスを489万トン以下（2000年度比半減）に削減する目標を閣議決定。</p>
          </div>
          <div style={{ width: "100%", height: "1px", backgroundColor: "#E2E8F0" }} />
          <p style={{ fontSize: "1.25vw", color: "#4A5568", lineHeight: 1.6, margin: 0 }}>「おすそわけ」の導入は、自治体が策定する食品ロス削減推進計画における民間連携施策として直接位置づけることができます。</p>
        </div>

        {/* Right: SDGs */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2vh", overflow: "hidden" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#718096" }}>SDGs貢献ゴール</div>
          <div style={{ backgroundColor: "#0A1628", padding: "2.2vh 2vw", display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "2.5vw", fontWeight: 900, color: "#FFFFFF", minWidth: "4vw" }}>12</div>
            <div>
              <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.6vh" }}>つくる責任 つかう責任</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.95vw", color: "#A0AEC0" }}>目標12.3 — 2030年までに小売・消費段階の食料廃棄を半減</div>
            </div>
          </div>
          <div style={{ border: "1px solid #E2E8F0", padding: "2.2vh 2vw", display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "2.5vw", fontWeight: 900, color: "#0A1628", minWidth: "4vw" }}>11</div>
            <div>
              <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.6vh" }}>住み続けられるまちづくりを</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.95vw", color: "#718096" }}>地域の飲食店・住民をつなぐプラットフォームとして地域コミュニティを強化</div>
            </div>
          </div>
          <div style={{ border: "1px solid #E2E8F0", padding: "2.2vh 2vw", display: "flex", gap: "1.5vw", alignItems: "flex-start" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "2.5vw", fontWeight: 900, color: "#0A1628", minWidth: "4vw" }}>17</div>
            <div>
              <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.6vh" }}>パートナーシップで目標を達成しよう</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.95vw", color: "#718096" }}>自治体・事業者・住民・プラットフォームの四者連携モデル</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "2vh", paddingTop: "2vh", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#A0AEC0" }}>法的根拠・SDGs / おすそわけ 自治体連携提案資料</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#0A1628", fontWeight: 600 }}>04</div>
      </div>
    </div>
  );
}
