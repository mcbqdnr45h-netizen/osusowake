export default function Slide7Privacy() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "#FFFFFF", fontFamily: "'Inter', 'Noto Sans JP', sans-serif", position: "relative", boxSizing: "border-box", padding: "5vh 5vw", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4vh" }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "-1vw", top: "1.5vh", width: "22vw", height: "3vh", backgroundColor: "#0A1628", opacity: 0.08, zIndex: 0 }} />
          <h2 style={{ fontSize: "3.5vw", fontWeight: 900, color: "#0A1628", margin: 0, lineHeight: 1, letterSpacing: "-0.03em", position: "relative", zIndex: 1 }}>安全性・信頼性</h2>
        </div>
        <div style={{ fontSize: "1.2vw", fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>おすそわけ</div>
      </div>

      <div style={{ display: "flex", gap: "4vw", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2.5vh", overflow: "hidden" }}>
          <p style={{ fontSize: "1.55vw", fontWeight: 500, color: "#4A5568", lineHeight: 1.6, margin: 0 }}>公共機関との連携において重要な安全性・セキュリティ・コンプライアンスへの取り組みです。</p>
          <div style={{ width: "100%", height: "1px", backgroundColor: "#E2E8F0" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "2.2vh" }}>
            <div style={{ display: "flex", gap: "2vw" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.2vw", color: "#A0AEC0", fontWeight: 600, minWidth: "2vw" }}>01</div>
              <div>
                <h3 style={{ fontSize: "1.4vw", fontWeight: 700, color: "#0A1628", margin: "0 0 0.5vh 0" }}>決済セキュリティ（Stripe）</h3>
                <p style={{ fontSize: "1.25vw", color: "#4A5568", lineHeight: 1.5, margin: 0 }}>国際基準PCI DSS準拠の決済代行会社Stripeを採用。店舗の口座情報・個人情報はStripeが厳重に管理。</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "2vw" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.2vw", color: "#A0AEC0", fontWeight: 600, minWidth: "2vw" }}>02</div>
              <div>
                <h3 style={{ fontSize: "1.4vw", fontWeight: 700, color: "#0A1628", margin: "0 0 0.5vh 0" }}>個人情報保護法への準拠</h3>
                <p style={{ fontSize: "1.25vw", color: "#4A5568", lineHeight: 1.5, margin: 0 }}>収集するユーザー情報はプライバシーポリシーに基づき適切に管理。第三者提供は行いません。</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "2vw" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.2vw", color: "#A0AEC0", fontWeight: 600, minWidth: "2vw" }}>03</div>
              <div>
                <h3 style={{ fontSize: "1.4vw", fontWeight: 700, color: "#0A1628", margin: "0 0 0.5vh 0" }}>食品衛生・表示基準の遵守</h3>
                <p style={{ fontSize: "1.25vw", color: "#4A5568", lineHeight: 1.5, margin: 0 }}>出品できる商品は当日調理・製造品に限定。食品衛生法に基づく飲食店営業許可取得店舗のみ登録可。</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ backgroundColor: "#F7FAFC", border: "1px solid #E2E8F0", padding: "3vh 2.5vw", height: "100%" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#718096", marginBottom: "2.5vh" }}>リスク管理</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2vh" }}>
              <div style={{ borderLeft: "3px solid #0A1628", paddingLeft: "1.5vw" }}>
                <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.5vh" }}>食品事故への対応</div>
                <p style={{ fontSize: "1.15vw", color: "#4A5568", lineHeight: 1.5, margin: 0 }}>万一の場合は当社サポートが一次対応を担当。店舗との連絡・記録保持を支援。</p>
              </div>
              <div style={{ borderLeft: "3px solid #E2E8F0", paddingLeft: "1.5vw" }}>
                <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.5vh" }}>不適切出品の排除</div>
                <p style={{ fontSize: "1.15vw", color: "#4A5568", lineHeight: 1.5, margin: 0 }}>出品物の審査機能・報告機能を整備。不適切な出品は即時非表示・アカウント停止で対応。</p>
              </div>
              <div style={{ borderLeft: "3px solid #E2E8F0", paddingLeft: "1.5vw" }}>
                <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.5vh" }}>行政からの照会対応</div>
                <p style={{ fontSize: "1.15vw", color: "#4A5568", lineHeight: 1.5, margin: 0 }}>自治体担当者からのデータ照会・取引記録の提供に対応する窓口を設置。</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "2vh", paddingTop: "2vh", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#A0AEC0" }}>安全性・信頼性 / おすそわけ 自治体連携提案資料</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#0A1628", fontWeight: 600 }}>07</div>
      </div>
    </div>
  );
}
