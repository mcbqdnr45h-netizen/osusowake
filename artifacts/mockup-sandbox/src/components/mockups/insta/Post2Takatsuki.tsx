export default function Post2Takatsuki() {
  const font = "'Noto Sans JP', sans-serif";
  return (
    <div style={{
      width: "1080px", height: "1080px", background: "#E8786C",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: font, position: "relative", overflow: "hidden"
    }}>
      <div style={{
        position: "absolute", top: "-200px", right: "-200px",
        width: "600px", height: "600px", borderRadius: "50%",
        background: "rgba(255,255,255,0.07)"
      }} />
      <div style={{
        position: "absolute", bottom: "-150px", left: "-150px",
        width: "450px", height: "450px", borderRadius: "50%",
        background: "rgba(255,255,255,0.07)"
      }} />

      <p style={{ fontSize: "26px", fontWeight: 700, color: "rgba(251,248,244,0.7)", letterSpacing: "0.25em", marginBottom: "40px" }}>
        LOCAL × FOOD × TECH
      </p>

      <p style={{ fontSize: "100px", fontWeight: 900, color: "#FBF8F4", lineHeight: 1.0, textAlign: "center", marginBottom: "20px" }}>
        高槻から、
      </p>
      <p style={{ fontSize: "100px", fontWeight: 900, color: "#FBF8F4", lineHeight: 1.0, textAlign: "center", marginBottom: "20px" }}>
        日本の食を
      </p>
      <p style={{ fontSize: "100px", fontWeight: 900, color: "#FBF8F4", lineHeight: 1.0, textAlign: "center", marginBottom: "60px" }}>
        変えていく。
      </p>

      <div style={{
        width: "120px", height: "4px", background: "rgba(251,248,244,0.4)", marginBottom: "60px", borderRadius: "2px"
      }} />

      <p style={{ fontSize: "28px", color: "rgba(251,248,244,0.85)", textAlign: "center", lineHeight: 1.9, letterSpacing: "0.05em" }}>
        地元のお店と一緒に、小さくても確かな一歩を。<br />フードシェアリングアプリ「おすそわけ」
      </p>

      <p style={{ position: "absolute", bottom: "40px", fontSize: "22px", color: "rgba(251,248,244,0.5)", letterSpacing: "0.1em" }}>
        @osusowake_japan
      </p>
    </div>
  );
}
