const base = import.meta.env.BASE_URL;

export default function Slide1Front() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0E0C0B 0%, #1A1612 50%, #0E0C0B 100%)' }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(232,120,108,0.06) 1px, transparent 0)',
          backgroundSize: '4vw 4vw',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '4vh',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'Outfit, sans-serif',
          fontSize: '1.1vw',
          fontWeight: 400,
          color: 'rgba(245,240,235,0.25)',
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
        }}
      >
        Business Card &nbsp;/&nbsp; 名刺
      </div>

      {/* 名刺本体 - 表面 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '66vw',
          height: '40vw',
          background: '#FEFCFA',
          borderRadius: '0.8vw',
          boxShadow: '0 3vw 8vw rgba(0,0,0,0.6), 0 0.5vw 1.5vw rgba(0,0,0,0.4), inset 0 0 0 0.06vw rgba(0,0,0,0.06)',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* 左アクセントバー */}
        <div style={{ width: '0.7vw', background: 'linear-gradient(180deg, #E8786C 0%, #D4655A 100%)', flexShrink: 0 }} />

        {/* メインエリア */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '3vw 3.8vw 3vw 3.2vw',
            position: 'relative',
          }}
        >
          {/* 上部: ロゴ + ブランド名 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2vw' }}>
            <div
              style={{
                width: '5vw',
                height: '5vw',
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: '0 0.2vw 0.6vw rgba(232,120,108,0.25)',
              }}
            >
              <img
                src={`${base}logo.jpg`}
                crossOrigin="anonymous"
                alt="おすそわけ"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'Noto Sans JP, sans-serif',
                  fontSize: '2vw',
                  fontWeight: 700,
                  color: '#E8786C',
                  letterSpacing: '0.12em',
                  lineHeight: 1,
                }}
              >
                おすそわけ
              </div>
              <div
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '0.7vw',
                  fontWeight: 400,
                  color: '#C0B8B5',
                  letterSpacing: '0.18em',
                  marginTop: '0.4vw',
                  textTransform: 'uppercase',
                }}
              >
                Food Rescue App
              </div>
            </div>
          </div>

          {/* 中部: 名前エリア */}
          <div>
            <div
              style={{
                height: '0.06vw',
                background: 'linear-gradient(90deg, #E8C8C5 0%, transparent 80%)',
                marginBottom: '2.4vw',
              }}
            />
            <div
              style={{
                fontFamily: 'Noto Sans JP, sans-serif',
                fontSize: '4.4vw',
                fontWeight: 900,
                color: '#1A1512',
                letterSpacing: '0.14em',
                lineHeight: 1,
              }}
            >
              佐藤&nbsp;&nbsp;勇飛
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.8vw',
                marginTop: '1.1vw',
              }}
            >
              <div
                style={{
                  width: '2vw',
                  height: '0.06vw',
                  background: '#E8786C',
                }}
              />
              <div
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '0.9vw',
                  fontWeight: 400,
                  color: '#9A9290',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Representative
              </div>
            </div>
          </div>

          {/* 下部: 連絡先 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5vw' }}>
            {[
              { label: 'TEL', value: '080-9579-0336' },
              { label: 'MAIL', value: 'hello@osusowakejapan.org' },
              { label: 'WEB', value: 'osusowakejapan.org' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: '1vw' }}>
                <span
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '0.62vw',
                    fontWeight: 700,
                    color: '#E8786C',
                    letterSpacing: '0.08em',
                    width: '2.4vw',
                    flexShrink: 0,
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '1.05vw',
                    fontWeight: 400,
                    color: '#2A2522',
                    letterSpacing: '0.04em',
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* 右下装飾 */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '8vw',
              height: '8vw',
              background: 'linear-gradient(135deg, transparent 50%, #FEF0EE 50%)',
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '4vh',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'Outfit, sans-serif',
          fontSize: '1vw',
          fontWeight: 400,
          color: 'rgba(245,240,235,0.18)',
          letterSpacing: '0.3em',
        }}
      >
        FRONT &nbsp;/&nbsp; 表面
      </div>
    </div>
  );
}
