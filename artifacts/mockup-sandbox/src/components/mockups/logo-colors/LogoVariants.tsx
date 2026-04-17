
const variants = [
  {
    id: 1,
    label: "案①: Warm Orange",
    bg: "#F26419",
    textColor: "#FFFFFF",
    handsFill: "#FFFFFF",
    handsStroke: "#C44E10",
    shadowColor: "rgba(194,78,16,0.35)",
    desc: "背景: オレンジ / 文字: 白",
  },
  {
    id: 2,
    label: "案②: Navy & Gold",
    bg: "#1B3A6B",
    textColor: "#F6AE2D",
    handsFill: "#FFFFFF",
    handsStroke: "#0F2144",
    shadowColor: "rgba(15,33,68,0.40)",
    desc: "背景: ネイビー / 文字: ゴールド",
  },
  {
    id: 3,
    label: "案③: Dark Charcoal",
    bg: "#2C2C2C",
    textColor: "#F26419",
    handsFill: "#EFEFEF",
    handsStroke: "#111111",
    shadowColor: "rgba(0,0,0,0.45)",
    desc: "背景: チャコール / 文字: オレンジ",
  },
  {
    id: 4,
    label: "案④: Sage & Cream",
    bg: "#4A7C59",
    textColor: "#F5EDD3",
    handsFill: "#F5EDD3",
    handsStroke: "#2E5038",
    shadowColor: "rgba(46,80,56,0.35)",
    desc: "背景: セージグリーン / 文字: クリーム",
  },
  {
    id: 5,
    label: "案⑤: Deep Plum",
    bg: "#4A1A6B",
    textColor: "#F6AE2D",
    handsFill: "#FFFFFF",
    handsStroke: "#2B0A40",
    shadowColor: "rgba(43,10,64,0.40)",
    desc: "背景: プラム / 文字: ゴールド",
  },
];

function HandsIcon({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg viewBox="0 0 120 110" width="90" height="82" xmlns="http://www.w3.org/2000/svg">
      {/* Left hand */}
      <g>
        {/* palm */}
        <path
          d="M10 85 Q8 60 20 42 Q26 30 34 26 Q38 22 43 26 Q47 18 52 22 Q56 15 61 20 Q65 13 70 19 L70 60 Q60 56 52 62 Q42 68 30 75 Z"
          fill={fill} stroke={stroke} strokeWidth="3.5" strokeLinejoin="round"
        />
        {/* finger lines */}
        <line x1="43" y1="26" x2="43" y2="52" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <line x1="52" y1="22" x2="52" y2="50" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <line x1="61" y1="20" x2="61" y2="50" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <line x1="70" y1="22" x2="70" y2="55" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Right hand (mirrored) */}
      <g transform="translate(120,0) scale(-1,1)">
        <path
          d="M10 85 Q8 60 20 42 Q26 30 34 26 Q38 22 43 26 Q47 18 52 22 Q56 15 61 20 Q65 13 70 19 L70 60 Q60 56 52 62 Q42 68 30 75 Z"
          fill={fill} stroke={stroke} strokeWidth="3.5" strokeLinejoin="round"
        />
        <line x1="43" y1="26" x2="43" y2="52" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <line x1="52" y1="22" x2="52" y2="50" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <line x1="61" y1="20" x2="61" y2="50" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <line x1="70" y1="22" x2="70" y2="55" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function LogoCard({ v }: { v: typeof variants[0] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      {/* Icon */}
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: 36,
          background: v.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          boxShadow: `0 8px 32px ${v.shadowColor}`,
        }}
      >
        {/* Layered shadow effect behind hands */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: 4, left: 4, opacity: 0.18, filter: "blur(4px)" }}>
            <HandsIcon fill={v.handsStroke} stroke={v.handsStroke} />
          </div>
          <div style={{ position: "relative" }}>
            <HandsIcon fill={v.handsFill} stroke={v.handsStroke} />
          </div>
        </div>
        <span
          style={{
            color: v.textColor,
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontWeight: 900,
            fontSize: 18,
            lineHeight: 1.1,
            textAlign: "center",
            letterSpacing: "-0.5px",
          }}
        >
          Osuso<br/>wake
        </span>
      </div>

      {/* Label */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 700, fontSize: 13, color: "#111", margin: 0 }}>{v.label}</p>
        <p style={{ fontSize: 11, color: "#666", margin: "2px 0 6px" }}>{v.desc}</p>
        {/* Color chips */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: v.bg, border: "1px solid #ddd" }} />
            <span style={{ fontSize: 10, color: "#888" }}>{v.bg}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: v.textColor, border: "1px solid #ddd" }} />
            <span style={{ fontSize: 10, color: "#888" }}>{v.textColor}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LogoVariants() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8F8F8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#333", marginBottom: 32, letterSpacing: "0.05em" }}>
        ロゴ カラーバリエーション
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "center" }}>
        {variants.map((v) => (
          <LogoCard key={v.id} v={v} />
        ))}
      </div>
    </div>
  );
}
