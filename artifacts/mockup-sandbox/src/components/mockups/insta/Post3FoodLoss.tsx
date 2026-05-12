export default function Post3FoodLoss() {
  const font = "'Noto Sans JP', sans-serif";
  return (
    <div style={{
      width: "1080px", height: "1080px", background: "#1E3A2F",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: font, position: "relative", overflow: "hidden", padding: "80px"
    }}>
      <div style={{
        position: "absolute", top: "-100px", left: "-100px",
        width: "400px", height: "400px", borderRadius: "50%",
        background: "rgba(68,168,54,0.12)"
      }} />
      <div style={{
        position: "absolute", bottom: "-100px", right: "-100px",
        width: "350px", height: "350px", borderRadius: "50%",
        background: "rgba(68,168,54,0.08)"
      }} />

      <p style={{ fontSize: "24px", fontWeight: 700, color: "#44A836", letterSpacing: "0.25em", marginBottom: "48px" }}>
        😳 知ってましたか？
      </p>

      <p style={{ fontSize: "32px", color: "rgba(251,248,244,0.6)", letterSpacing: "0.06em", marginBottom: "16px" }}>
        日本では毎年
      </p>
      <p style={{ fontSize: "128px", fontWeight: 900, color: "#FBF8F4", lineHeight: 1.0, marginBottom: "8px" }}>
        472
      </p>
      <p style={{ fontSize: "48px", fontWeight: 700, color: "#44A836", letterSpacing: "0.12em", marginBottom: "40px" }}>
        万トン
      </p>
      <p style={{ fontSize: "28px", color: "rgba(251,248,244,0.7)", letterSpacing: "0.06em", marginBottom: "64px" }}>
        の食品が捨てられています。
      </p>

      <div style={{
        background: "rgba(68,168,54,0.15)", border: "1px solid rgba(68,168,54,0.3)",
        borderRadius: "20px", padding: "36px 60px", marginBottom: "40px", textAlign: "center"
      }}>
        <p style={{ fontSize: "26px", color: "#44A836", fontWeight: 700, lineHeight: 1.8 }}>
          これは日本人1人が毎日<br />
          <span style={{ fontSize: "38px", color: "#FBF8F4" }}>お茶碗1杯分</span>のご飯を<br />
          捨てているのと同じ量。
        </p>
      </div>

      <p style={{ fontSize: "26px", color: "rgba(251,248,244,0.5)", letterSpacing: "0.06em", textAlign: "center" }}>
        「なんかもったいない」その感覚、正解です。
      </p>

      <p style={{ position: "absolute", bottom: "40px", fontSize: "22px", color: "rgba(251,248,244,0.3)", letterSpacing: "0.1em" }}>
        @osusowake_japan
      </p>
    </div>
  );
}
