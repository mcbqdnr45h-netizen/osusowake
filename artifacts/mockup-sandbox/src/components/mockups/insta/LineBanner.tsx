export default function LineBanner() {
  const font = "'Noto Sans JP', sans-serif";
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <div style={{
      width: "2500px", height: "843px", background: "#FBF8F4",
      display: "flex", alignItems: "center",
      fontFamily: font, position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "10px",
        background: "linear-gradient(90deg, #44A836 0%, #44A836 50%, #E8786C 50%, #E8786C 100%)"
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "10px",
        background: "linear-gradient(90deg, #E8786C 0%, #E8786C 50%, #44A836 50%, #44A836 100%)"
      }} />

      <div style={{
        position: "absolute", right: "-100px", top: "-100px",
        width: "600px", height: "600px", borderRadius: "50%",
        background: "rgba(68,168,54,0.06)"
      }} />
      <div style={{
        position: "absolute", left: "40%", bottom: "-150px",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "rgba(232,120,108,0.05)"
      }} />

      <div style={{
        display: "flex", alignItems: "center", gap: "80px",
        padding: "0 160px", width: "100%"
      }}>
        <div style={{
          width: "300px", height: "300px", borderRadius: "50%", overflow: "hidden",
          border: "8px solid #44A836", flexShrink: 0,
          boxShadow: "0 12px 60px rgba(68,168,54,0.20)"
        }}>
          <img
            src={`${basePath}/logo.jpg`}
            alt="logo"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        <div style={{ flexShrink: 0 }}>
          <p style={{ fontSize: "36px", fontWeight: 700, color: "#44A836", letterSpacing: "0.2em", marginBottom: "16px" }}>
            FOOD SHARING APP
          </p>
          <p style={{ fontSize: "110px", fontWeight: 900, color: "#2A2623", letterSpacing: "0.15em", lineHeight: 1.0, marginBottom: "24px" }}>
            おすそわけ
          </p>
          <div style={{
            background: "#44A836", borderRadius: "60px",
            padding: "18px 60px", display: "inline-block"
          }}>
            <p style={{ fontSize: "42px", fontWeight: 700, color: "#FBF8F4", letterSpacing: "0.06em" }}>
              もったいないを、おいしいに。
            </p>
          </div>
        </div>

        <div style={{
          marginLeft: "auto", display: "flex", flexDirection: "column",
          gap: "28px", flexShrink: 0
        }}>
          {[
            { icon: "🌿", label: "食品ロス削減" },
            { icon: "💰", label: "半額〜1/3価格" },
            { icon: "📱", label: "5ステップで完了" },
          ].map(item => (
            <div key={item.label} style={{
              display: "flex", alignItems: "center", gap: "20px",
              background: "#fff", borderRadius: "20px", padding: "20px 48px",
              boxShadow: "0 4px 30px rgba(42,38,35,0.07)"
            }}>
              <span style={{ fontSize: "48px" }}>{item.icon}</span>
              <span style={{ fontSize: "38px", fontWeight: 700, color: "#2A2623" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
