export default function Slide1Front() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0E0C0B 0%, #1A1612 50%, #0E0C0B 100%)' }}
    >
      {/* 背景グリッド */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(232,120,108,0.06) 1px, transparent 0)',
          backgroundSize: '4vw 4vw',
        }}
      />

      {/* 上部ラベル */}
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
          boxShadow: '0 3vw 8vw rgba(0,0,0,0.6), 0 0.5vw 1.5vw rgba(0,0,0,0.4), inset 0 0 0 0.06vw rgba(0,0,0,0.08)',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* 左アクセントバー */}
        <div style={{ width: '0.7vw', background: '#E8786C', flexShrink: 0 }} />

        {/* メインエリア */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '3.5vw 4vw 3vw 3.5vw',
            position: 'relative',
          }}
        >
          {/* ブランド名 */}
          <div style={{ marginBottom: '2.8vw' }}>
            <div
              style={{
                fontFamily: 'Noto Sans JP, sans-serif',
                fontSize: '1.5vw',
                fontWeight: 700,
                color: '#E8786C',
                letterSpacing: '0.12em',
                lineHeight: 1,
              }}
            >
              おすそわけ
            </div>
          </div>

          {/* 仕切り線 */}
          <div
            style={{
              height: '0.06vw',
              background: 'linear-gradient(90deg, #E8C8C5 0%, transparent 100%)',
              marginBottom: '2.8vw',
            }}
          />

          {/* 名前 */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: 'Noto Sans JP, sans-serif',
                fontSize: '4.2vw',
                fontWeight: 700,
                color: '#1A1512',
                letterSpacing: '0.12em',
                lineHeight: 1,
              }}
            >
              佐藤&nbsp;&nbsp;勇飛
            </div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '1vw',
                fontWeight: 400,
                color: '#9A9290',
                letterSpacing: '0.15em',
                marginTop: '1vw',
              }}
            >
              代表&nbsp;&nbsp;/&nbsp;&nbsp;Representative
            </div>
          </div>

          {/* 連絡先 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55vw' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8vw' }}>
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '0.7vw',
                  fontWeight: 700,
                  color: '#E8786C',
                  letterSpacing: '0.1em',
                  width: '2.2vw',
                  flexShrink: 0,
                }}
              >
                TEL
              </span>
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '1.15vw',
                  fontWeight: 400,
                  color: '#2A2522',
                  letterSpacing: '0.06em',
                }}
              >
                080-9579-0336
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8vw' }}>
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '0.7vw',
                  fontWeight: 700,
                  color: '#E8786C',
                  letterSpacing: '0.1em',
                  width: '2.2vw',
                  flexShrink: 0,
                }}
              >
                MAIL
              </span>
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '1.15vw',
                  fontWeight: 400,
                  color: '#2A2522',
                  letterSpacing: '0.03em',
                }}
              >
                hello@osusowakejapan.org
              </span>
            </div>
          </div>

          {/* 右下の装飾三角 */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '7vw',
              height: '7vw',
              background: 'linear-gradient(135deg, transparent 50%, #FDF0EE 50%)',
            }}
          />
        </div>
      </div>

      {/* 下部ラベル */}
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
