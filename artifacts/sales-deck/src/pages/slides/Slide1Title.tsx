const base = import.meta.env.BASE_URL;

export default function Slide1Title() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#2A2623' }}>
      <img
        src={`${base}slide-hero.png`}
        crossOrigin="anonymous"
        alt="Food hero"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.35 }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(42,38,35,0.92) 0%, rgba(42,38,35,0.6) 60%, rgba(42,38,35,0.3) 100%)' }}
      />
      <div className="absolute inset-0 flex flex-col justify-between" style={{ padding: '7vh 8vw' }}>
        <div className="flex items-center gap-[1.2vw]">
          <div style={{ width: '0.4vw', height: '3.5vh', background: '#E8786C', borderRadius: '2px' }} />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.6vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.08em' }}>
            おすそわけ
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '4vw' }}>
          <div>
            <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '1.6vw', fontWeight: 400, color: 'rgba(251,248,244,0.65)', marginBottom: '2.5vh', letterSpacing: '0.04em' }}>
              店舗様向けご提案資料
            </p>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '6.5vw', fontWeight: 900, color: '#FBF8F4', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: '3vh' }}>
              食品廃棄を、<br />売上に変える
            </h1>
            <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '2vw', fontWeight: 400, color: 'rgba(251,248,244,0.75)', lineHeight: 1.7 }}>
              売れ残り食品を地域のお客様へお届けする<br />フードロス削減プラットフォーム
            </p>
          </div>
          <div style={{
            background: 'rgba(251,248,244,0.07)',
            border: '1px solid rgba(251,248,244,0.15)',
            borderRadius: '1.4vw',
            padding: '3.5vh 2.8vw',
            backdropFilter: 'blur(8px)',
            flexShrink: 0,
            maxWidth: '28vw',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8vw', marginBottom: '2vh' }}>
              <div style={{ width: '0.35vw', height: '3vh', background: '#44A836', borderRadius: '2px' }} />
              <span style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '1.1vw', fontWeight: 700, color: '#44A836', letterSpacing: '0.1em' }}>
                私たちについて
              </span>
            </div>
            <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '1.8vw', fontWeight: 900, color: '#FBF8F4', lineHeight: 1.6, marginBottom: '2.5vh' }}>
              高槻が地元の<br />大学生で結成した<br />組織です
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2vh' }}>
              {['📍 高槻・摂津・茨木エリア密着', '🎓 複数大学の学生チーム', '🌱 フードロスゼロを目指して'].map((item) => (
                <span key={item} style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '1.3vw', color: 'rgba(251,248,244,0.72)', lineHeight: 1.5 }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2vw' }}>
          <div style={{ width: '4vw', height: '0.15vh', background: 'rgba(251,248,244,0.25)' }} />
          <span style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: '1.5vw', color: 'rgba(251,248,244,0.4)' }}>
            osusowakejapan.org
          </span>
        </div>
      </div>
    </div>
  );
}
