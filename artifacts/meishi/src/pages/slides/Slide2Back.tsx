import { QRCodeSVG } from 'qrcode.react';

const base = import.meta.env.BASE_URL;

export default function Slide2Back() {
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

      {/* 名刺本体 - 裏面 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '66vw',
          height: '40vw',
          background: 'linear-gradient(135deg, #E8786C 0%, #D4655A 55%, #BE5148 100%)',
          borderRadius: '0.8vw',
          boxShadow: '0 3vw 8vw rgba(0,0,0,0.6), 0 0.5vw 1.5vw rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* 右上の装飾円 */}
        <div
          style={{
            position: 'absolute',
            top: '-6vw',
            right: '-6vw',
            width: '18vw',
            height: '18vw',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
          }}
        />
        {/* 左下の装飾円 */}
        <div
          style={{
            position: 'absolute',
            bottom: '-4vw',
            left: '-4vw',
            width: '14vw',
            height: '14vw',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }}
        />

        {/* ブランド名 */}
        <div
          style={{
            fontFamily: 'Noto Sans JP, sans-serif',
            fontSize: '2.4vw',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '0.2em',
            marginBottom: '1vw',
          }}
        >
          おすそわけ
        </div>

        {/* 細い仕切り */}
        <div
          style={{
            width: '4vw',
            height: '0.1vw',
            background: 'rgba(255,255,255,0.35)',
            marginBottom: '2.5vw',
          }}
        />

        {/* QRコード 2枚 */}
        <div
          style={{
            display: 'flex',
            gap: '5vw',
            alignItems: 'flex-start',
          }}
        >
          {/* App Store QR */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8vw' }}>
            <div
              style={{
                background: '#ffffff',
                padding: '0.8vw',
                borderRadius: '0.6vw',
                boxShadow: '0 0.4vw 1.2vw rgba(0,0,0,0.25)',
                width: '10vw',
                height: '10vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={`${base}qr-appstore.jpeg`}
                crossOrigin="anonymous"
                alt="App Store QR"
                style={{ width: '8.4vw', height: '8.4vw', display: 'block' }}
              />
            </div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.85vw',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.9)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              App Store
            </div>
            <div
              style={{
                fontFamily: 'Noto Sans JP, sans-serif',
                fontSize: '0.7vw',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.05em',
              }}
            >
              iPhoneアプリ
            </div>
          </div>

          {/* Web QR */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8vw' }}>
            <div
              style={{
                background: '#ffffff',
                padding: '0.8vw',
                borderRadius: '0.6vw',
                boxShadow: '0 0.4vw 1.2vw rgba(0,0,0,0.25)',
                width: '10vw',
                height: '10vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QRCodeSVG
                value="https://osusowakejapan.org/"
                size={999}
                style={{ width: '8.4vw', height: '8.4vw', display: 'block' }}
                bgColor="#ffffff"
                fgColor="#1A1512"
                level="M"
              />
            </div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.85vw',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.9)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Website
            </div>
            <div
              style={{
                fontFamily: 'Noto Sans JP, sans-serif',
                fontSize: '0.7vw',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.05em',
              }}
            >
              osusowakejapan.org
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
        BACK &nbsp;/&nbsp; 裏面
      </div>
    </div>
  );
}
