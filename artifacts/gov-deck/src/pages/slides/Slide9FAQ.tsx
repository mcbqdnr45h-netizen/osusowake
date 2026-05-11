export default function Slide9FAQ() {
  const faqs = [
    { q: "予算措置は必要ですか？", a: "不要です。自治体から当社への支払いは一切発生しません。広報・周知への協力のみでご連携いただけます。" },
    { q: "食品安全に関する行政責任はどうなりますか？", a: "出品・販売の主体は各店舗です。自治体は広報協力の立場であり、行政責任は発生しません。当社が規約・審査を担います。" },
    { q: "現在のサービスエリアはどこですか？", a: "現在は大阪府・兵庫県を中心に展開中。連携自治体エリアへの優先展開が可能です。詳細はお問い合わせください。" },
    { q: "削減量データはどの形式で提供されますか？", a: "月次・四半期のPDFレポートおよびCSVデータで提供。削減kg・件数・CO2換算値・参加店舗数を記載します。" },
    { q: "議会・監査への説明資料は用意できますか？", a: "はい。連携の位置づけ・費用負担なしの根拠・法的整理を含む資料を担当者向けに別途ご用意します。" },
    { q: "連携をやめたい場合は？", a: "1ヶ月前の通知で連携解消が可能です。違約金等は一切発生しません。" },
  ];

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "#FFFFFF", fontFamily: "'Inter', 'Noto Sans JP', sans-serif", position: "relative", boxSizing: "border-box", padding: "4vh 5vw", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3vh" }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "-1vw", top: "1.5vh", width: "10vw", height: "3vh", backgroundColor: "#0A1628", opacity: 0.08, zIndex: 0 }} />
          <h2 style={{ fontSize: "3.5vw", fontWeight: 900, color: "#0A1628", margin: 0, lineHeight: 1, letterSpacing: "-0.03em", position: "relative", zIndex: 1 }}>よくある質問</h2>
        </div>
        <div style={{ fontSize: "1.2vw", fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>おすそわけ</div>
      </div>

      <div style={{ display: "flex", gap: "3vw", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          {faqs.slice(0, 3).map((faq, i) => (
            <div key={i} style={{ borderLeft: `3px solid ${i === 0 ? "#0A1628" : "#CBD5E0"}`, paddingLeft: "1.5vw" }}>
              <div style={{ fontSize: "1.35vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.6vh" }}>{faq.q}</div>
              <p style={{ fontSize: "1.2vw", color: "#4A5568", lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          {faqs.slice(3, 6).map((faq, i) => (
            <div key={i} style={{ borderLeft: "3px solid #CBD5E0", paddingLeft: "1.5vw" }}>
              <div style={{ fontSize: "1.35vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.6vh" }}>{faq.q}</div>
              <p style={{ fontSize: "1.2vw", color: "#4A5568", lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "2vh", paddingTop: "2vh", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#A0AEC0" }}>よくある質問 / おすそわけ 自治体連携提案資料</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#0A1628", fontWeight: 600 }}>09</div>
      </div>
    </div>
  );
}
