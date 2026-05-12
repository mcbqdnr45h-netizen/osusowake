export default function Post7Benefits() {
  const font = "'Noto Sans JP', sans-serif";
  const benefits = [
    { emoji: "💰", color: "#E8786C", bg: "#FDF0EE", title: "最大50%オフ", desc: "閉店前の余り物を特別価格で\nお財布にも地球にも優しい" },
    { emoji: "♻️", color: "#44A836", bg: "#F0F7EE", title: "食品ロス削減に直接貢献", desc: "1回の購入が1食分のゴミを救う\n一緒に食品ロスをなくそう" },
    { emoji: "🏪", color: "#2A6CB8", bg: "#EEF3FB", title: "地元のお店を応援", desc: "近所の大好きなお店の売上に\n新しい形の地域応援" },
  ];
  return (
    <div style={{
      width: "1080px", height: "1080px", background: "#FBF8F4",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: font, position: "relative", overflow: "hidden", padding: "80px"
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "10px", background: "linear-gradient(90deg, #44A836, #E8786C)" }} />

      <p style={{ fontSize: "26px", fontWeight: 700, color: "#44A836", letterSpacing: "0.2em", marginBottom: "20px" }}>
        BENEFITS
      </p>
      <h2 style={{ fontSize: "58px", fontWeight: 900, color: "#2A2623", marginBottom: "16px", textAlign: "center" }}>
        おすそわけの3つのメリット
      </h2>
      <p style={{ fontSize: "28px", color: "rgba(42,38,35,0.4)", marginBottom: "60px" }}>
        いいことしか、ない。🌿
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
        {benefits.map((b, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: "32px",
            background: b.bg, borderRadius: "20px", padding: "32px 44px",
            border: `1px solid ${b.color}22`
          }}>
            <div style={{
              width: "90px", height: "90px", borderRadius: "50%", background: b.color,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <span style={{ fontSize: "44px" }}>{b.emoji}</span>
            </div>
            <div>
              <p style={{ fontSize: "32px", fontWeight: 800, color: "#2A2623", marginBottom: "8px" }}>{b.title}</p>
              <p style={{ fontSize: "22px", color: "rgba(42,38,35,0.55)", lineHeight: 1.6, whiteSpace: "pre-line" }}>{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p style={{ position: "absolute", bottom: "30px", fontSize: "20px", color: "rgba(42,38,35,0.3)", letterSpacing: "0.1em" }}>
        @osusowake_japan
      </p>
    </div>
  );
}
