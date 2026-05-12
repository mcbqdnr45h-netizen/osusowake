import { QRCodeSVG } from 'qrcode.react';

const base = import.meta.env.BASE_URL;

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

      {/* 名刺本体 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '72vw',
          height: '43.5vw',
          background: '#FEFCFA',
          borderRadius: '0.8vw',
          boxShadow: '0 3vw 8vw rgba(0,0,0,0.6), 0 0.5vw 1.5vw rgba(0,0,0,0.4), inset 0 0 0 0.06vw rgba(0,0,0,0.08)',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* 左アクセントバー */}
        <div style={{ width: '0.7vw', background: '#E8786C', flexShrink: 0 }} />

        {/* 左エリア - 情報 */}
        <div
          style={{
            flex: '0 0 56%',
            display: 'flex',
            flexDirection: 'column',
            padding: '3.2vw 3vw 2.8vw 3vw',
            position: 'relative',
          }}
        >
          {/* ブランド名 */}
          <div style={{ marginBottom: '2.4vw' }}>
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
              marginBottom: '2.4vw',
            }}
          />

          {/* 名前 */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: 'Noto Sans JP, sans-serif',
                fontSize: '3.8vw',
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
                fontSize: '0.95vw',
                fontWeight: 400,
                color: '#9A9290',
                letterSpacing: '0.15em',
                marginTop: '0.9vw',
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
                  fontSize: '0.65vw',
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
                  fontSize: '1.1vw',
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
                  fontSize: '0.65vw',
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
                  fontSize: '1.1vw',
                  fontWeight: 400,
                  color: '#2A2522',
                  letterSpacing: '0.02em',
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
              width: '5vw',
              height: '5vw',
              background: 'linear-gradient(135deg, transparent 50%, #FDF0EE 50%)',
            }}
          />
        </div>

        {/* 縦の仕切り */}
        <div
          style={{
            width: '0.06vw',
            background: 'linear-gradient(180deg, transparent 8%, #EDE8E4 30%, #EDE8E4 70%, transparent 92%)',
            flexShrink: 0,
            alignSelf: 'stretch',
          }}
        />

        {/* 右エリア - QRコード */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2vw',
            padding: '2.5vw 2vw',
          }}
        >
          {/* App Store QR */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6vw' }}>
            <div
              style={{
                background: '#fff',
                border: '0.08vw solid #EDE8E4',
                borderRadius: '0.5vw',
                padding: '0.6vw',
                width: '8.5vw',
                height: '8.5vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={`${base}qr-appstore.jpeg`}
                crossOrigin="anonymous"
                alt="App Store QR"
                style={{ width: '7.3vw', height: '7.3vw', display: 'block' }}
              />
            </div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.7vw',
                fontWeight: 600,
                color: '#6A6360',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              App Store
            </div>
          </div>

          {/* 点線 */}
          <div
            style={{
              width: '2vw',
              height: '0.06vw',
              background: '#DDD8D4',
            }}
          />

          {/* Web QR */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6vw' }}>
            <div
              style={{
                background: '#fff',
                border: '0.08vw solid #EDE8E4',
                borderRadius: '0.5vw',
                padding: '0.6vw',
                width: '8.5vw',
                height: '8.5vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QRCodeSVG
                value="https://osusowakejapan.org/"
                size={999}
                style={{ width: '7.3vw', height: '7.3vw', display: 'block' }}
                bgColor="#ffffff"
                fgColor="#1A1512"
                level="M"
              />
            </div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.7vw',
                fontWeight: 600,
                color: '#6A6360',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              Website
            </div>
          </div>
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
