export default function Post1Logo() {
  const font = "'Noto Sans JP', sans-serif";
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <div style={{
      width: "1080px", height: "1080px", background: "#FBF8F4",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: font, position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "8px", background: "#44A836" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "8px", background: "#E8786C" }} />

      <div style={{
        width: "220px", height: "220px", borderRadius: "50%", overflow: "hidden",
        border: "6px solid #44A836", marginBottom: "48px",
        boxShadow: "0 8px 40px rgba(68,168,54,0.18)"
      }}>
        <img src={`${basePath}/logo.jpg`} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      <p style={{ fontSize: "68px", fontWeight: 900, color: "#2A2623", letterSpacing: "0.18em", marginBottom: "16px" }}>
        おすそわけ
      </p>
      <p style={{ fontSize: "28px", fontWeight: 400, color: "#44A836", letterSpacing: "0.08em", marginBottom: "60px" }}>
        osusowake
      </p>

      <div style={{
        background: "#44A836", borderRadius: "60px", padding: "20px 60px", marginBottom: "40px"
      }}>
        <p style={{ fontSize: "32px", fontWeight: 700, color: "#FBF8F4", letterSpacing: "0.06em" }}>
          もったいないを、おいしいに。
        </p>
      </div>

      <p style={{ fontSize: "24px", color: "rgba(42,38,35,0.5)", letterSpacing: "0.06em", textAlign: "center", lineHeight: 1.8 }}>
        フードシェアリングアプリ<br />飲食店の余った食品をお得に救おう
      </p>

      <p style={{ position: "absolute", bottom: "28px", fontSize: "20px", color: "rgba(42,38,35,0.3)", letterSpacing: "0.1em" }}>
        @osusowake_japan
      </p>
    </div>
  );
}
