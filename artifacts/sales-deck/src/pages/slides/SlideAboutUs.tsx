const base = import.meta.env.BASE_URL;

export default function SlideAboutUs() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#2A2623' }}>
      <img
        src={`${base}slide-hero.png`}
        crossOrigin="anonymous"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.18 }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(120deg, rgba(42,38,35,0.97) 0%, rgba(42,38,35,0.80) 55%, rgba(232,120,108,0.18) 100%)' }}
      />

      <div className="absolute inset-0 flex" style={{ padding: '5vh 8vw' }}>
        {/* Left: story */}
        <div style={{ flex: '1 1 55%', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingRight: '5vw' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.14em', marginBottom: '2.5vh' }}>
            WHO WE ARE
          </p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '4.2vw', fontWeight: 900, color: '#FBF8F4', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '3.5vh' }}>
            高槻のフードロスを<br />ゼロにしたい。
          </h2>
          <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.9vw', color: 'rgba(251,248,244,0.85)', lineHeight: 1.9, marginBottom: '4vh', maxWidth: '46vw' }}>
            私たちは、<strong style={{ color: '#FBF8F4' }}>高槻で育った学生チーム</strong>です。<br />
            大学はバラバラですが、地元高槻への思いは一緒。<br />
            「大好きな地元から変えたい」と立ち上がりました。
          </p>

          {/* Tags */}
          <div style={{ display: 'flex', gap: '1.2vw', flexWrap: 'wrap' }}>
            {['📍 高槻育ち', '🎓 大学はバラバラ', '❤️ 地元愛で動く'].map((tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: 'Noto Sans JP, sans-serif',
                  fontSize: '1.5vw',
                  fontWeight: 700,
                  color: '#FBF8F4',
                  background: 'rgba(232,120,108,0.22)',
                  border: '1px solid rgba(232,120,108,0.45)',
                  borderRadius: '100px',
                  padding: '0.6vh 1.4vw',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Right: quote card */}
        <div style={{ flex: '1 1 40%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2.5vh' }}>
          {/* Quote */}
          <div style={{
            background: 'rgba(251,248,244,0.06)',
            border: '1px solid rgba(251,248,244,0.14)',
            borderRadius: '1.6vw',
            padding: '3.5vh 3vw',
            backdropFilter: 'blur(8px)',
          }}>
            <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.8vw', color: 'rgba(251,248,244,0.9)', lineHeight: 2, marginBottom: '2vh' }}>
              「バイト先でパンを袋ごと捨てるのを見て、<br />なんかもったいないな…って、ずっと思ってた。」
            </p>
            <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.4vw', color: 'rgba(232,120,108,0.85)', fontWeight: 700 }}>
              — チーム発起人 / 高槻在住
            </p>
          </div>

          {/* Location pill */}
          <div style={{
            background: 'rgba(68,168,54,0.15)',
            border: '1px solid rgba(68,168,54,0.35)',
            borderRadius: '1.2vw',
            padding: '2.5vh 2.5vw',
            display: 'flex',
            alignItems: 'center',
            gap: '1.2vw',
          }}>
            <div style={{ width: '3.5vh', height: '3.5vh', borderRadius: '50%', background: '#44A836', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '1.8vh' }}>🌸</span>
            </div>
            <div>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.6vw', fontWeight: 900, color: '#FBF8F4', marginBottom: '0.3vh' }}>
                高槻発・地域密着プロジェクト
              </p>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.3vw', color: 'rgba(251,248,244,0.6)' }}>
                芥川・高槻駅周辺を中心に展開中
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: '0.5vh', background: 'linear-gradient(90deg, #E8786C, #44A836)' }} />
    </div>
  );
}
