export default function Post6Store() {
  const font = "'Noto Sans JP', sans-serif";
  return (
    <div style={{
      width: "1080px", height: "1080px", background: "#FBF8F4",
      display: "flex", flexDirection: "column",
      fontFamily: font, position: "relative", overflow: "hidden"
    }}>
      <div style={{
        background: "#44A836", height: "340px", display: "flex", alignItems: "center",
        justifyContent: "center", flexDirection: "column", position: "relative"
      }}>
        <div style={{
          position: "absolute", bottom: "-30px", left: "50%", transform: "translateX(-50%)",
          background: "#E8786C", borderRadius: "40px", padding: "12px 44px",
          whiteSpace: "nowrap"
        }}>
          <p style={{ fontSize: "26px", fontWeight: 700, color: "#FBF8F4", letterSpacing: "0.15em" }}>
            🏪 加盟店さんご紹介 vol.01
          </p>
        </div>
        <p style={{ fontSize: "24px", fontWeight: 700, color: "rgba(251,248,244,0.7)", letterSpacing: "0.2em", marginBottom: "20px" }}>
          PARTNER STORE
        </p>
        <p style={{ fontSize: "90px" }}>🍱</p>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 80px 60px" }}>
        <div style={{
          background: "#fff", borderRadius: "24px", padding: "48px",
          boxShadow: "0 4px 30px rgba(42,38,35,0.08)", marginTop: "24px"
        }}>
          <p style={{ fontSize: "40px", fontWeight: 900, color: "#2A2623", marginBottom: "20px" }}>
            ○○○（テスト加盟店）
          </p>
          <p style={{ fontSize: "24px", color: "rgba(42,38,35,0.5)", marginBottom: "32px" }}>
            📍 高槻市○○
          </p>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {["閉店前のお弁当", "パン・惣菜", "お得価格で出品"].map(tag => (
              <span key={tag} style={{
                background: "#F0F7EE", border: "1px solid rgba(68,168,54,0.3)",
                borderRadius: "30px", padding: "10px 28px", fontSize: "22px",
                color: "#44A836", fontWeight: 700
              }}>{tag}</span>
            ))}
          </div>
        </div>

        <p style={{ fontSize: "24px", color: "rgba(42,38,35,0.5)", lineHeight: 1.9, marginTop: "40px", textAlign: "center" }}>
          おすそわけに賛同いただいた最初の加盟店さんです🙏<br />アプリ公開後はお得に購入できます！
        </p>
      </div>

      <p style={{ position: "absolute", bottom: "28px", left: "50%", transform: "translateX(-50%)", fontSize: "20px", color: "rgba(42,38,35,0.3)", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
        @osusowake_japan
      </p>
    </div>
  );
}
