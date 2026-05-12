export default function Post8Area() {
  const font = "'Noto Sans JP', sans-serif";
  return (
    <div style={{
      width: "1080px", height: "1080px", background: "#44A836",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: font, position: "relative", overflow: "hidden"
    }}>
      <div style={{
        position: "absolute", top: "-180px", right: "-180px",
        width: "550px", height: "550px", borderRadius: "50%",
        background: "rgba(255,255,255,0.08)"
      }} />
      <div style={{
        position: "absolute", bottom: "-120px", left: "-120px",
        width: "400px", height: "400px", borderRadius: "50%",
        background: "rgba(255,255,255,0.06)"
      }} />

      <div style={{
        background: "rgba(255,255,255,0.15)", borderRadius: "50px", padding: "16px 48px", marginBottom: "60px"
      }}>
        <p style={{ fontSize: "28px", fontWeight: 700, color: "#FBF8F4", letterSpacing: "0.15em" }}>
          📍 活動エリア宣言
        </p>
      </div>

      <p style={{ fontSize: "120px", fontWeight: 900, color: "#FBF8F4", lineHeight: 1.0, marginBottom: "8px" }}>
        まず
      </p>
      <p style={{ fontSize: "80px", fontWeight: 900, color: "#FBF8F4", lineHeight: 1.0, marginBottom: "8px" }}>
        高槻から。
      </p>

      <div style={{ width: "100px", height: "4px", background: "rgba(251,248,244,0.4)", margin: "48px auto", borderRadius: "2px" }} />

      <p style={{ fontSize: "30px", color: "rgba(251,248,244,0.85)", textAlign: "center", lineHeight: 2.0, padding: "0 80px" }}>
        駅前カフェ、町のパン屋さん、定食屋——<br />
        毎日少しずつ余ってしまう食品を<br />
        地元のみんなに届けます。
      </p>

      <div style={{ marginTop: "60px", textAlign: "center" }}>
        <p style={{ fontSize: "24px", color: "rgba(251,248,244,0.65)", letterSpacing: "0.06em" }}>
          加盟店募集中 📩
        </p>
        <p style={{ fontSize: "26px", fontWeight: 700, color: "rgba(251,248,244,0.85)", letterSpacing: "0.03em" }}>
          hello@osusowakejapan.org
        </p>
      </div>

      <p style={{ position: "absolute", bottom: "40px", fontSize: "22px", color: "rgba(251,248,244,0.4)", letterSpacing: "0.1em" }}>
        @osusowake_japan
      </p>
    </div>
  );
}
