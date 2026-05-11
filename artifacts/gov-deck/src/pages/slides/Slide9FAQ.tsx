export default function Slide9FAQ() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "#FFFFFF", fontFamily: "'Inter', 'Noto Sans JP', sans-serif", position: "relative", boxSizing: "border-box", padding: "5vh 5vw", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "5vh" }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "-1vw", top: "1.5vh", width: "10vw", height: "3vh", backgroundColor: "#0A1628", opacity: 0.08, zIndex: 0 }} />
          <h2 style={{ fontSize: "3.5vw", fontWeight: 900, color: "#0A1628", margin: 0, lineHeight: 1, letterSpacing: "-0.03em", position: "relative", zIndex: 1 }}>よくある質問</h2>
        </div>
        <div style={{ fontSize: "1.2vw", fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>おすそわけ</div>
      </div>

      <div style={{ display: "flex", gap: "4vw", flex: 1 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2.8vh" }}>
          <div style={{ borderLeft: "3px solid #0A1628", paddingLeft: "1.5vw" }}>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.5vh" }}>予算措置は必要ですか？</div>
            <p style={{ fontSize: "1.2vw", color: "#4A5568", lineHeight: 1.5, margin: 0 }}>不要です。自治体から当社への支払いは一切発生しません。広報・周知への協力のみでご連携いただけます。</p>
          </div>
          <div style={{ borderLeft: "3px solid #E2E8F0", paddingLeft: "1.5vw" }}>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.5vh" }}>食品安全に関する行政責任はどうなりますか？</div>
            <p style={{ fontSize: "1.2vw", color: "#4A5568", lineHeight: 1.5, margin: 0 }}>出品・販売の主体は各店舗です。自治体は広報協力の立場であり、行政責任は発生しません。当社が規約・審査を担います。</p>
          </div>
          <div style={{ borderLeft: "3px solid #E2E8F0", paddingLeft: "1.5vw" }}>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.5vh" }}>現在のサービスエリアはどこですか？</div>
            <p style={{ fontSize: "1.2vw", color: "#4A5568", lineHeight: 1.5, margin: 0 }}>現在は大阪府・兵庫県を中心に展開中。連携自治体エリアへの優先展開が可能です。詳細はお問い合わせください。</p>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2.8vh" }}>
          <div style={{ borderLeft: "3px solid #E2E8F0", paddingLeft: "1.5vw" }}>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.5vh" }}>削減量データはどの形式で提供されますか？</div>
            <p style={{ fontSize: "1.2vw", color: "#4A5568", lineHeight: 1.5, margin: 0 }}>月次・四半期のPDFレポートおよびCSVデータで提供。削減kg・件数・CO2換算値・参加店舗数を記載します。</p>
          </div>
          <div style={{ borderLeft: "3px solid #E2E8F0", paddingLeft: "1.5vw" }}>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.5vh" }}>議会・監査への説明資料は用意できますか？</div>
            <p style={{ fontSize: "1.2vw", color: "#4A5568", lineHeight: 1.5, margin: 0 }}>はい。連携の位置づけ・費用負担なしの根拠・法的整理を含む資料を担当者向けに別途ご用意します。</p>
          </div>
          <div style={{ borderLeft: "3px solid #E2E8F0", paddingLeft: "1.5vw" }}>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.5vh" }}>連携をやめたい場合は？</div>
            <p style={{ fontSize: "1.2vw", color: "#4A5568", lineHeight: 1.5, margin: 0 }}>1ヶ月前の通知で連携解消が可能です。違約金等は一切発生しません。</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: "5vh", left: "5vw", right: "5vw", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E2E8F0", paddingTop: "2vh" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#A0AEC0" }}>よくある質問 / おすそわけ 自治体連携提案資料</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#0A1628", fontWeight: 600 }}>09</div>
      </div>
    </div>
  );
}
