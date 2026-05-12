export default function Post9Download() {
  const font = "'Noto Sans JP', sans-serif";
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <div style={{
      width: "1080px", height: "1080px", background: "#FBF8F4",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: font, position: "relative", overflow: "hidden", padding: "80px"
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "10px", background: "#E8786C" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "10px", background: "#44A836" }} />

      <p style={{ fontSize: "80px", marginBottom: "24px" }}>🎉</p>

      <p style={{ fontSize: "26px", fontWeight: 700, color: "#E8786C", letterSpacing: "0.2em", marginBottom: "20px" }}>
        APP RELEASE
      </p>
      <h2 style={{ fontSize: "62px", fontWeight: 900, color: "#2A2623", textAlign: "center", lineHeight: 1.2, marginBottom: "16px" }}>
        アプリ、<br />リリースしました！
      </h2>
      <p style={{ fontSize: "26px", color: "rgba(42,38,35,0.5)", marginBottom: "56px" }}>
        App Storeで無料ダウンロード
      </p>

      <div style={{ display: "flex", gap: "48px", alignItems: "center", marginBottom: "48px" }}>
        <div style={{
          background: "#fff", borderRadius: "24px", padding: "24px",
          boxShadow: "0 4px 30px rgba(42,38,35,0.10)"
        }}>
          <img src={`${basePath}/qr-appstore.jpeg`} alt="App Store QR" style={{ width: "200px", height: "200px", display: "block" }} />
          <p style={{ fontSize: "20px", color: "rgba(42,38,35,0.5)", textAlign: "center", marginTop: "12px" }}>App Store</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {["✅ 会員登録 無料", "✅ 高槻エリアに対応", "✅ 余り物をお得にゲット"].map(t => (
            <div key={t} style={{
              background: "#F0F7EE", borderRadius: "16px", padding: "20px 36px",
              fontSize: "28px", color: "#2A2623", fontWeight: 600
            }}>{t}</div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: "26px", color: "rgba(42,38,35,0.5)", textAlign: "center", lineHeight: 1.8 }}>
        フォロー＆シェアも大歓迎です🌿<br />一緒に食品ロスをなくしましょう
      </p>

      <p style={{ position: "absolute", bottom: "28px", fontSize: "20px", color: "rgba(42,38,35,0.3)", letterSpacing: "0.1em" }}>
        @osusowake_japan
      </p>
    </div>
  );
}
