export default function Post5Story() {
  const font = "'Noto Sans JP', sans-serif";
  return (
    <div style={{
      width: "1080px", height: "1080px", background: "#2A2623",
      display: "flex", flexDirection: "column", alignItems: "flex-start",
      justifyContent: "center", fontFamily: font, position: "relative", overflow: "hidden", padding: "100px"
    }}>
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: "500px", height: "500px", borderRadius: "0 0 0 100%",
        background: "rgba(232,120,108,0.12)"
      }} />

      <p style={{ fontSize: "26px", fontWeight: 700, color: "#E8786C", letterSpacing: "0.2em", marginBottom: "48px" }}>
        STORY
      </p>

      <div style={{
        fontSize: "56px", lineHeight: 1.0, fontWeight: 900, color: "#FBF8F4", marginBottom: "56px"
      }}>
        <span style={{ color: "#E8786C" }}>「</span>なんでこの<br />
        アプリ作ったの？<span style={{ color: "#E8786C" }}>」</span>
      </div>

      <div style={{
        borderLeft: "4px solid #E8786C", paddingLeft: "40px", marginBottom: "56px"
      }}>
        <p style={{ fontSize: "28px", color: "rgba(251,248,244,0.75)", lineHeight: 2.0 }}>
          閉店間際のパン屋さんで<br />
          大量のパンが袋にまとめられているのを見て、<br />
          <span style={{ color: "#FBF8F4", fontWeight: 700 }}>「これ、誰かに届けられへんかな」</span><br />
          と思ったのが始まりです。
        </p>
      </div>

      <p style={{ fontSize: "26px", color: "rgba(251,248,244,0.5)", lineHeight: 1.9 }}>
        地元・高槻から始めた、<br />小さいけど本気のプロジェクト。
      </p>

      <div style={{ position: "absolute", bottom: "80px", right: "100px", textAlign: "right" }}>
        <p style={{ fontSize: "24px", color: "rgba(251,248,244,0.4)", marginBottom: "6px" }}>代表</p>
        <p style={{ fontSize: "34px", fontWeight: 700, color: "rgba(251,248,244,0.7)" }}>佐藤 勇飛</p>
      </div>

      <p style={{ position: "absolute", bottom: "40px", left: "100px", fontSize: "20px", color: "rgba(251,248,244,0.2)", letterSpacing: "0.1em" }}>
        @osusowake_japan
      </p>
    </div>
  );
}
