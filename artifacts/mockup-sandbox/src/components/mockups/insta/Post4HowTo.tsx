export default function Post4HowTo() {
  const font = "'Noto Sans JP', sans-serif";
  const steps = [
    { num: "01", icon: "🔍", title: "お店を探す", desc: "近くの加盟店の\n余り物をチェック" },
    { num: "02", icon: "🛒", title: "購入する", desc: "特別価格でアプリから\n簡単に購入" },
    { num: "03", icon: "🏪", title: "受け取る", desc: "指定時間にお店へ\nピックアップ！" },
  ];
  return (
    <div style={{
      width: "1080px", height: "1080px", background: "#FBF8F4",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: font, position: "relative", overflow: "hidden", padding: "80px"
    }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "10px", background: "#44A836" }} />

      <p style={{ fontSize: "26px", fontWeight: 700, color: "#44A836", letterSpacing: "0.2em", marginBottom: "24px" }}>
        HOW TO USE
      </p>
      <h2 style={{ fontSize: "56px", fontWeight: 900, color: "#2A2623", marginBottom: "16px" }}>
        使い方は超シンプル
      </h2>
      <p style={{ fontSize: "28px", color: "rgba(42,38,35,0.5)", marginBottom: "72px" }}>
        📱 たった3ステップ
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
        {steps.map((s) => (
          <div key={s.num} style={{
            display: "flex", alignItems: "center", gap: "36px",
            background: "#fff", borderRadius: "20px", padding: "36px 48px",
            boxShadow: "0 2px 20px rgba(42,38,35,0.07)"
          }}>
            <div style={{
              width: "90px", height: "90px", borderRadius: "50%", background: "#44A836",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <span style={{ fontSize: "48px" }}>{s.icon}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "#44A836", letterSpacing: "0.2em", marginBottom: "8px" }}>
                STEP {s.num}
              </p>
              <p style={{ fontSize: "34px", fontWeight: 800, color: "#2A2623", marginBottom: "6px" }}>{s.title}</p>
              <p style={{ fontSize: "24px", color: "rgba(42,38,35,0.55)", lineHeight: 1.5, whiteSpace: "pre-line" }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p style={{ position: "absolute", bottom: "32px", fontSize: "20px", color: "rgba(42,38,35,0.3)", letterSpacing: "0.1em" }}>
        @osusowake_japan
      </p>
    </div>
  );
}
