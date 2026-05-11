const base = import.meta.env.BASE_URL;

export default function Slide3App() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "#FFFFFF", fontFamily: "'Inter', 'Noto Sans JP', sans-serif", position: "relative", boxSizing: "border-box", padding: "5vh 5vw", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6vh" }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "-1vw", top: "1.5vh", width: "18vw", height: "3vh", backgroundColor: "#0A1628", opacity: 0.08, zIndex: 0 }} />
          <h2 style={{ fontSize: "3.5vw", fontWeight: 900, color: "#0A1628", margin: 0, lineHeight: 1, letterSpacing: "-0.03em", position: "relative", zIndex: 1 }}>おすそわけとは</h2>
        </div>
        <div style={{ fontSize: "1.2vw", fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>おすそわけ</div>
      </div>

      <div style={{ display: "flex", gap: "4vw", flex: 1 }}>
        {/* Left: description */}
        <div style={{ flex: 1.1, display: "flex", flexDirection: "column", gap: "3.5vh" }}>
          <p style={{ fontSize: "1.7vw", fontWeight: 500, color: "#4A5568", lineHeight: 1.6, margin: 0 }}>
            飲食店・食料品店の「売れ残り・廃棄予定品」を近隣住民がアプリで購入できるフードシェアリングプラットフォームです。
          </p>
          <div style={{ width: "100%", height: "1px", backgroundColor: "#E2E8F0" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "2.8vh" }}>
            <div style={{ display: "flex", gap: "2vw" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.2vw", color: "#A0AEC0", fontWeight: 600, minWidth: "2vw" }}>01</div>
              <div>
                <h3 style={{ fontSize: "1.5vw", fontWeight: 700, color: "#0A1628", margin: "0 0 0.8vh 0" }}>店舗が「おすそわけ」として出品</h3>
                <p style={{ fontSize: "1.3vw", color: "#4A5568", lineHeight: 1.5, margin: 0 }}>閉店2〜3時間前に廃棄予定の商品をスマホで出品。登録は1分で完了。</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "2vw" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.2vw", color: "#A0AEC0", fontWeight: 600, minWidth: "2vw" }}>02</div>
              <div>
                <h3 style={{ fontSize: "1.5vw", fontWeight: 700, color: "#0A1628", margin: "0 0 0.8vh 0" }}>近隣ユーザーがアプリで発見・購入</h3>
                <p style={{ fontSize: "1.3vw", color: "#4A5568", lineHeight: 1.5, margin: 0 }}>GPS連動で周辺の出品を表示。アプリ内決済で事前支払い。</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "2vw" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.2vw", color: "#A0AEC0", fontWeight: 600, minWidth: "2vw" }}>03</div>
              <div>
                <h3 style={{ fontSize: "1.5vw", fontWeight: 700, color: "#0A1628", margin: "0 0 0.8vh 0" }}>閉店前に来店して受け取り</h3>
                <p style={{ fontSize: "1.3vw", color: "#4A5568", lineHeight: 1.5, margin: 0 }}>廃棄ゼロ・売上確保・新規顧客獲得を同時に実現。</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: image + key points */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2.5vh" }}>
          <div style={{ flex: 1, overflow: "hidden", position: "relative", backgroundColor: "#F7FAFC" }}>
            <img src={`${base}food-hero.png`} crossOrigin="anonymous" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
          </div>
          <div style={{ backgroundColor: "#0A1628", padding: "2.5vh 2vw" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0", marginBottom: "1vh" }}>手数料モデル</div>
            <p style={{ fontSize: "1.5vw", fontWeight: 700, color: "#FFFFFF", margin: 0, lineHeight: 1.4 }}>
              売上成立時のみ25%<br /><span style={{ fontWeight: 400, fontSize: "1.2vw", color: "#E2E8F0" }}>月額固定費なし・初期費用なし</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: "5vh", left: "5vw", right: "5vw", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E2E8F0", paddingTop: "2vh" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#A0AEC0" }}>サービス概要 / おすそわけ 自治体連携提案資料</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#0A1628", fontWeight: 600 }}>03</div>
      </div>
    </div>
  );
}
