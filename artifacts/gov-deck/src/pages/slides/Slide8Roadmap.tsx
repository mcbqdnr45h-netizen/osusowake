export default function Slide8Roadmap() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "#FFFFFF", fontFamily: "'Inter', 'Noto Sans JP', sans-serif", position: "relative", boxSizing: "border-box", padding: "5vh 5vw", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6vh" }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "-1vw", top: "1.5vh", width: "22vw", height: "3vh", backgroundColor: "#0A1628", opacity: 0.08, zIndex: 0 }} />
          <h2 style={{ fontSize: "3.5vw", fontWeight: 900, color: "#0A1628", margin: 0, lineHeight: 1, letterSpacing: "-0.03em", position: "relative", zIndex: 1 }}>導入ロードマップ</h2>
        </div>
        <div style={{ fontSize: "1.2vw", fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>おすそわけ</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "3.5vh", flex: 1 }}>
        <p style={{ fontSize: "1.6vw", fontWeight: 500, color: "#4A5568", lineHeight: 1.5, margin: 0 }}>
          ご担当者様のご負担を最小限に抑えながら、段階的に連携を深めていきます。
        </p>

        {/* Timeline */}
        <div style={{ display: "flex", gap: "2vw", flex: 1 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2vh" }}>
            <div style={{ backgroundColor: "#0A1628", padding: "3vh 2.5vw", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5vh" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0" }}>PHASE 01</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0" }}>〜1ヶ月</div>
              </div>
              <div style={{ fontSize: "1.8vw", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em", marginBottom: "1.5vh" }}>ご説明・合意</div>
              <div style={{ width: "100%", height: "1px", backgroundColor: "rgba(255,255,255,0.15)", marginBottom: "1.5vh" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8vh" }}>
                <div style={{ display: "flex", gap: "1vw", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.1vw", color: "#A0AEC0", marginTop: "0.1vh" }}>—</div>
                  <p style={{ fontSize: "1.2vw", color: "#E2E8F0", margin: 0, lineHeight: 1.5 }}>担当部署との詳細ヒアリング</p>
                </div>
                <div style={{ display: "flex", gap: "1vw", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.1vw", color: "#A0AEC0", marginTop: "0.1vh" }}>—</div>
                  <p style={{ fontSize: "1.2vw", color: "#E2E8F0", margin: 0, lineHeight: 1.5 }}>連携内容・範囲の合意形成</p>
                </div>
                <div style={{ display: "flex", gap: "1vw", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.1vw", color: "#A0AEC0", marginTop: "0.1vh" }}>—</div>
                  <p style={{ fontSize: "1.2vw", color: "#E2E8F0", margin: 0, lineHeight: 1.5 }}>覚書（MOU）締結</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2vh" }}>
            <div style={{ border: "1px solid #E2E8F0", padding: "3vh 2.5vw", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5vh" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0" }}>PHASE 02</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0" }}>1〜3ヶ月</div>
              </div>
              <div style={{ fontSize: "1.8vw", fontWeight: 900, color: "#0A1628", letterSpacing: "-0.02em", marginBottom: "1.5vh" }}>試験導入</div>
              <div style={{ width: "100%", height: "1px", backgroundColor: "#E2E8F0", marginBottom: "1.5vh" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8vh" }}>
                <div style={{ display: "flex", gap: "1vw", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.1vw", color: "#A0AEC0", marginTop: "0.1vh" }}>—</div>
                  <p style={{ fontSize: "1.2vw", color: "#4A5568", margin: 0, lineHeight: 1.5 }}>市報・ウェブへの掲載開始</p>
                </div>
                <div style={{ display: "flex", gap: "1vw", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.1vw", color: "#A0AEC0", marginTop: "0.1vh" }}>—</div>
                  <p style={{ fontSize: "1.2vw", color: "#4A5568", margin: 0, lineHeight: 1.5 }}>商工会議所・商店街への周知</p>
                </div>
                <div style={{ display: "flex", gap: "1vw", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.1vw", color: "#A0AEC0", marginTop: "0.1vh" }}>—</div>
                  <p style={{ fontSize: "1.2vw", color: "#4A5568", margin: 0, lineHeight: 1.5 }}>参加店舗の初期登録サポート</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2vh" }}>
            <div style={{ border: "1px solid #E2E8F0", padding: "3vh 2.5vw", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5vh" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0" }}>PHASE 03</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0" }}>3ヶ月〜</div>
              </div>
              <div style={{ fontSize: "1.8vw", fontWeight: 900, color: "#0A1628", letterSpacing: "-0.02em", marginBottom: "1.5vh" }}>本格展開</div>
              <div style={{ width: "100%", height: "1px", backgroundColor: "#E2E8F0", marginBottom: "1.5vh" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8vh" }}>
                <div style={{ display: "flex", gap: "1vw", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.1vw", color: "#A0AEC0", marginTop: "0.1vh" }}>—</div>
                  <p style={{ fontSize: "1.2vw", color: "#4A5568", margin: 0, lineHeight: 1.5 }}>推進計画への正式組み込み</p>
                </div>
                <div style={{ display: "flex", gap: "1vw", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.1vw", color: "#A0AEC0", marginTop: "0.1vh" }}>—</div>
                  <p style={{ fontSize: "1.2vw", color: "#4A5568", margin: 0, lineHeight: 1.5 }}>四半期ごとの実績レポート提供</p>
                </div>
                <div style={{ display: "flex", gap: "1vw", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.1vw", color: "#A0AEC0", marginTop: "0.1vh" }}>—</div>
                  <p style={{ fontSize: "1.2vw", color: "#4A5568", margin: 0, lineHeight: 1.5 }}>連携エリア・店舗数の拡大</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: "5vh", left: "5vw", right: "5vw", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E2E8F0", paddingTop: "2vh" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#A0AEC0" }}>導入ロードマップ / おすそわけ 自治体連携提案資料</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#0A1628", fontWeight: 600 }}>08</div>
      </div>
    </div>
  );
}
