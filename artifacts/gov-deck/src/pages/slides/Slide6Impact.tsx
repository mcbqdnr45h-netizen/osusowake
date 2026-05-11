export default function Slide6Impact() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "#FFFFFF", fontFamily: "'Inter', 'Noto Sans JP', sans-serif", position: "relative", boxSizing: "border-box", padding: "4vh 5vw", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3vh" }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "-1vw", top: "1.5vh", width: "20vw", height: "3vh", backgroundColor: "#0A1628", opacity: 0.08, zIndex: 0 }} />
          <h2 style={{ fontSize: "3.5vw", fontWeight: 900, color: "#0A1628", margin: 0, lineHeight: 1, letterSpacing: "-0.03em", position: "relative", zIndex: 1 }}>自治体のメリット</h2>
        </div>
        <div style={{ fontSize: "1.2vw", fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>おすそわけ</div>
      </div>

      <div style={{ display: "flex", gap: "2vw", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, backgroundColor: "#0A1628", padding: "3vh 3vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0", marginBottom: "1.5vh" }}>BENEFIT — 01</div>
            <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1.5vh", whiteSpace: "nowrap" }}>食品ロス削減量を数値で可視化</div>
            <p style={{ fontSize: "1.25vw", color: "#E2E8F0", lineHeight: 1.7, margin: 0 }}>エリア内の削減kg・削減件数・CO2換算値をリアルタイムで把握。推進計画の進捗報告・議会答弁・国への報告に活用できます。</p>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "1.5vh" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0" }}>▶ 月次・四半期レポートを無償提供</div>
          </div>
        </div>

        <div style={{ flex: 1, border: "1px solid #E2E8F0", padding: "3vh 3vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0", marginBottom: "1.5vh" }}>BENEFIT — 02</div>
            <div style={{ fontSize: "1.7vw", fontWeight: 700, color: "#0A1628", marginBottom: "1.5vh" }}>SDGs取組として対外発信</div>
            <p style={{ fontSize: "1.25vw", color: "#4A5568", lineHeight: 1.7, margin: 0 }}>SDGsゴール12・11への具体的な取組として、国・メディア・住民に向けた広報コンテンツに活用可能。連携ロゴの使用も可。</p>
          </div>
          <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "1.5vh" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0" }}>▶ 連携ロゴ・実績バナー素材を提供</div>
          </div>
        </div>

        <div style={{ flex: 1, border: "1px solid #E2E8F0", padding: "3vh 3vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0", marginBottom: "1.5vh" }}>BENEFIT — 03</div>
            <div style={{ fontSize: "1.7vw", fontWeight: 700, color: "#0A1628", marginBottom: "1.5vh" }}>地域経済の活性化</div>
            <p style={{ fontSize: "1.25vw", color: "#4A5568", lineHeight: 1.7, margin: 0 }}>廃棄予定品の売上化により地域飲食店の収益改善を後押し。廃業防止・雇用維持にも寄与します。</p>
          </div>
          <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "1.5vh" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0" }}>▶ 商店街・商工会との連携実績を創出</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "2vw", marginTop: "2vh" }}>
        <div style={{ flex: 1, backgroundColor: "#F7FAFC", border: "1px solid #E2E8F0", padding: "2vh 2.5vw", display: "flex", gap: "1.5vw", alignItems: "center" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.85vw", color: "#718096", minWidth: "7vw", whiteSpace: "nowrap" }}>BENEFIT — 04</div>
          <div>
            <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.4vh" }}>住民サービスの向上</div>
            <p style={{ fontSize: "1.1vw", color: "#4A5568", lineHeight: 1.5, margin: 0 }}>低価格で食品を入手できる手段として、子育て世帯・低所得世帯の生活支援にもつながります。</p>
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: "#F7FAFC", border: "1px solid #E2E8F0", padding: "2vh 2.5vw", display: "flex", gap: "1.5vw", alignItems: "center" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.85vw", color: "#718096", minWidth: "7vw", whiteSpace: "nowrap" }}>BENEFIT — 05</div>
          <div>
            <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.4vh" }}>導入コストゼロ</div>
            <p style={{ fontSize: "1.1vw", color: "#4A5568", lineHeight: 1.5, margin: 0 }}>補助金・委託費の拠出不要。広報協力だけで食品ロス削減施策の実績を積み上げられます。</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "2vh", paddingTop: "2vh", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#A0AEC0" }}>自治体メリット / おすそわけ 自治体連携提案資料</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#0A1628", fontWeight: 600 }}>06</div>
      </div>
    </div>
  );
}
