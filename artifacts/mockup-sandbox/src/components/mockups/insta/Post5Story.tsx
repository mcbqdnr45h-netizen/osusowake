export default function Post5Story() {
  const font = "'Noto Sans JP', sans-serif";
  return (
    <div style={{
      width: "1080px", height: "1080px", background: "#2A2623",
      display: "flex", flexDirection: "column", alignItems: "flex-start",
      justifyContent: "center", fontFamily: font, position: "relative", overflow: "hidden", padding: "90px 100px"
    }}>
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: "500px", height: "500px", borderRadius: "0 0 0 100%",
        background: "rgba(232,120,108,0.10)"
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0,
        width: "300px", height: "300px", borderRadius: "0 100% 0 0",
        background: "rgba(68,168,54,0.08)"
      }} />

      <p style={{ fontSize: "24px", fontWeight: 700, color: "#E8786C", letterSpacing: "0.2em", marginBottom: "36px" }}>
        STORY ― なんでこのアプリ作ったの？
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
        <div style={{ borderLeft: "4px solid #E8786C", paddingLeft: "36px" }}>
          <p style={{ fontSize: "20px", color: "#E8786C", fontWeight: 700, marginBottom: "10px", letterSpacing: "0.08em" }}>
            留学中、お金がなくて限界だった。
          </p>
          <p style={{ fontSize: "26px", color: "rgba(251,248,244,0.80)", lineHeight: 1.85 }}>
            海外留学中、生活費が底をつきかけたとき<br />
            スーパーの廃棄食品をもらって生き延びた。<br />
            <span style={{ color: "#FBF8F4", fontWeight: 700 }}>「食べ物に救われた」</span>、本当にそう思った。
          </p>
        </div>

        <div style={{ borderLeft: "4px solid #44A836", paddingLeft: "36px" }}>
          <p style={{ fontSize: "20px", color: "#44A836", fontWeight: 700, marginBottom: "10px", letterSpacing: "0.08em" }}>
            大学で食品ロスの深刻さを知った。
          </p>
          <p style={{ fontSize: "26px", color: "rgba(251,248,244,0.80)", lineHeight: 1.85 }}>
            環境問題を学ぶ中で、日本の食品ロスが<br />
            年間472万トンにのぼると知り、衝撃を受けた。<br />
            <span style={{ color: "#FBF8F4", fontWeight: 700 }}>捨てられる食品と、困ってる人が同時にいる。</span>
          </p>
        </div>

        <div style={{
          background: "rgba(232,120,108,0.12)", borderRadius: "16px",
          padding: "24px 32px", marginTop: "4px"
        }}>
          <p style={{ fontSize: "26px", color: "#FBF8F4", fontWeight: 700, lineHeight: 1.7 }}>
            日本でも、食で誰かを救いたい。<br />
            それが「おすそわけ」を作った理由です。
          </p>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "60px", right: "100px", textAlign: "right" }}>
        <p style={{ fontSize: "22px", color: "rgba(251,248,244,0.35)", marginBottom: "6px" }}>代表</p>
        <p style={{ fontSize: "32px", fontWeight: 700, color: "rgba(251,248,244,0.65)" }}>佐藤 勇飛</p>
      </div>

      <p style={{ position: "absolute", bottom: "32px", left: "100px", fontSize: "19px", color: "rgba(251,248,244,0.2)", letterSpacing: "0.1em" }}>
        @osusowake_japan
      </p>
    </div>
  );
}
