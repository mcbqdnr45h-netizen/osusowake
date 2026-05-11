export default function Slide8Roadmap() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "#FFFFFF", fontFamily: "'Inter', 'Noto Sans JP', sans-serif", position: "relative", boxSizing: "border-box", padding: "4vh 5vw", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3vh" }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: "-1vw", top: "1.5vh", width: "22vw", height: "3vh", backgroundColor: "#0A1628", opacity: 0.08, zIndex: 0 }} />
          <h2 style={{ fontSize: "3.5vw", fontWeight: 900, color: "#0A1628", margin: 0, lineHeight: 1, letterSpacing: "-0.03em", position: "relative", zIndex: 1 }}>導入ロードマップ</h2>
        </div>
        <div style={{ fontSize: "1.2vw", fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>おすそわけ</div>
      </div>

      <p style={{ fontSize: "1.45vw", fontWeight: 500, color: "#4A5568", lineHeight: 1.5, margin: "0 0 2.5vh 0" }}>ご担当者様のご負担を最小限に抑えながら、段階的に連携を深めていきます。</p>

      <div style={{ display: "flex", gap: "2vw", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, backgroundColor: "#0A1628", padding: "3vh 2.5vw", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5vh" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0" }}>PHASE 01</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0" }}>〜1ヶ月</div>
          </div>
          <div style={{ fontSize: "2vw", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em", marginBottom: "1.5vh" }}>ご説明・合意</div>
          <div style={{ width: "100%", height: "1px", backgroundColor: "rgba(255,255,255,0.15)", marginBottom: "2vh" }} />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
            {[
              { title: "担当部署との詳細ヒアリング", desc: "食品ロス削減の現状・課題・ニーズを共有" },
              { title: "連携内容・範囲の合意形成", desc: "広報協力の範囲・データ提供の頻度を確認" },
              { title: "覚書（MOU）締結", desc: "双方の役割・責任範囲を文書化" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "1vw" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.1vw", color: "#4A5568", marginTop: "0.2vh" }}>—</div>
                <div>
                  <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "0.3vh" }}>{item.title}</div>
                  <p style={{ fontSize: "1.05vw", color: "#A0AEC0", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, border: "1px solid #E2E8F0", padding: "3vh 2.5vw", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5vh" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0" }}>PHASE 02</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0" }}>1〜3ヶ月</div>
          </div>
          <div style={{ fontSize: "2vw", fontWeight: 900, color: "#0A1628", letterSpacing: "-0.02em", marginBottom: "1.5vh" }}>試験導入</div>
          <div style={{ width: "100%", height: "1px", backgroundColor: "#E2E8F0", marginBottom: "2vh" }} />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
            {[
              { title: "市報・ウェブへの掲載開始", desc: "住民向けに「おすそわけ」を周知" },
              { title: "商工会議所・商店街への周知", desc: "地域事業者への参加促進" },
              { title: "参加店舗の初期登録サポート", desc: "当社スタッフが登録手続きを支援" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "1vw" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.1vw", color: "#A0AEC0", marginTop: "0.2vh" }}>—</div>
                <div>
                  <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.3vh" }}>{item.title}</div>
                  <p style={{ fontSize: "1.05vw", color: "#4A5568", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, border: "1px solid #E2E8F0", padding: "3vh 2.5vw", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5vh" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0" }}>PHASE 03</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1vw", color: "#A0AEC0" }}>3ヶ月〜</div>
          </div>
          <div style={{ fontSize: "2vw", fontWeight: 900, color: "#0A1628", letterSpacing: "-0.02em", marginBottom: "1.5vh" }}>本格展開</div>
          <div style={{ width: "100%", height: "1px", backgroundColor: "#E2E8F0", marginBottom: "2vh" }} />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
            {[
              { title: "推進計画への正式組み込み", desc: "民間連携施策として行政文書に記載" },
              { title: "四半期ごとの実績レポート提供", desc: "削減量・店舗数・CO2換算を定期報告" },
              { title: "連携エリア・店舗数の拡大", desc: "隣接自治体・商業施設への波及展開" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "1vw" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.1vw", color: "#A0AEC0", marginTop: "0.2vh" }}>—</div>
                <div>
                  <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#0A1628", marginBottom: "0.3vh" }}>{item.title}</div>
                  <p style={{ fontSize: "1.05vw", color: "#4A5568", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "2vh", paddingTop: "2vh", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#A0AEC0" }}>導入ロードマップ / おすそわけ 自治体連携提案資料</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.9vw", color: "#0A1628", fontWeight: 600 }}>08</div>
      </div>
    </div>
  );
}
