export default function Slide5Partnership() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "#FFFFFF", fontFamily: "'Inter', 'Noto Sans JP', sans-serif", position: "relative", boxSizing: "border-box", padding: "5vh 5vw", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6vh" }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "-1vw", top: "1.5vh", width: "24vw", height: "3vh", backgroundColor: "#0A1628", opacity: 0.08, zIndex: 0 }} />
          <h2 style={{ fontSize: "3.5vw", fontWeight: 900, color: "#0A1628", margin: 0, lineHeight: 1, letterSpacing: "-0.03em", position: "relative", zIndex: 1 }}>自治体との連携モデル</h2>
        </div>
        <div style={{ fontSize: "1.2vw", fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>おすそわけ</div>
      </div>

      <div style={{ display: "flex", gap: "2.5vw", flex: 1 }}>
        {/* Four partnership models */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2.5vh" }}>
          <div style={{ backgroundColor: "#0A1628", padding: "3vh 2.5vw", flex: 1 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0", marginBottom: "1.2vh" }}>MODEL — 01</div>
            <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1vh" }}>広報・周知協力</div>
            <p style={{ fontSize: "1.2vw", color: "#E2E8F0", lineHeight: 1.6, margin: 0 }}>
              市報・公式ウェブサイト・SNS・公共施設への掲示物を通じた住民・事業者への周知。費用負担なし。
            </p>
          </div>
          <div style={{ border: "1px solid #E2E8F0", padding: "3vh 2.5vw", flex: 1 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0", marginBottom: "1.2vh" }}>MODEL — 02</div>
            <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#0A1628", marginBottom: "1vh" }}>食品ロス削減計画への組み込み</div>
            <p style={{ fontSize: "1.2vw", color: "#4A5568", lineHeight: 1.6, margin: 0 }}>
              推進計画における民間連携施策として明記し、削減実績の数値を行政報告に活用。
            </p>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2.5vh" }}>
          <div style={{ border: "1px solid #E2E8F0", padding: "3vh 2.5vw", flex: 1 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0", marginBottom: "1.2vh" }}>MODEL — 03</div>
            <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#0A1628", marginBottom: "1vh" }}>地域事業者への導入支援</div>
            <p style={{ fontSize: "1.2vw", color: "#4A5568", lineHeight: 1.6, margin: 0 }}>
              商工会議所・商店街組合と連携し、地域の飲食店・食料品店へのアプリ導入を共同で促進。
            </p>
          </div>
          <div style={{ border: "1px solid #E2E8F0", padding: "3vh 2.5vw", flex: 1 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0", marginBottom: "1.2vh" }}>MODEL — 04</div>
            <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#0A1628", marginBottom: "1vh" }}>データ共有・実績レポート</div>
            <p style={{ fontSize: "1.2vw", color: "#4A5568", lineHeight: 1.6, margin: 0 }}>
              管轄エリア内の食品ロス削減量・参加店舗数・利用者数を定期レポートとして提供。
            </p>
          </div>
        </div>

        {/* Right: key message */}
        <div style={{ width: "22vw", backgroundColor: "#F7FAFC", border: "1px solid #E2E8F0", padding: "3.5vh 2.5vw", display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#718096", marginBottom: "2.5vh" }}>自治体負担</div>
          <div style={{ fontSize: "4vw", fontWeight: 900, color: "#0A1628", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "1.5vh" }}>ゼロ</div>
          <div style={{ width: "100%", height: "1px", backgroundColor: "#E2E8F0", marginBottom: "2vh" }} />
          <p style={{ fontSize: "1.3vw", color: "#4A5568", lineHeight: 1.6, margin: "0 0 auto 0" }}>
            補助金・助成金の支出は不要。広報協力のみで食品ロス削減の実績を積み上げられます。
          </p>
          <div style={{ marginTop: "3vh", paddingTop: "2vh", borderTop: "1px solid #E2E8F0" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0" }}>連携形態は段階的に拡張可能</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: "5vh", left: "5vw", right: "5vw", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E2E8F0", paddingTop: "2vh" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#A0AEC0" }}>連携モデル / おすそわけ 自治体連携提案資料</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#0A1628", fontWeight: 600 }}>05</div>
      </div>
    </div>
  );
}
