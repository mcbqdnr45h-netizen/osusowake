import { QRCodeSVG } from 'qrcode.react';

const base = import.meta.env.BASE_URL;

export default function Slide2Back() {
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
          flexDirection: 'row',
          overflow: 'hidden',
        }}
      >
        {/* 装飾円 右上 */}
        <div
          style={{
            position: 'absolute',
            top: '-6vw',
            right: '-6vw',
            width: '18vw',
            height: '18vw',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
            pointerEvents: 'none',
          }}
        />
        {/* 装飾円 左下 */}
        <div
          style={{
            position: 'absolute',
            bottom: '-5vw',
            left: '-4vw',
            width: '14vw',
            height: '14vw',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }}
        />

        {/* 左カラム: テキスト */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '3.5vw 3vw 3.5vw 4vw',
          }}
        >
          <div
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '0.7vw',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              marginBottom: '1.2vw',
            }}
          >
            Osusowake Japan
          </div>
          <div
            style={{
              fontFamily: 'Noto Sans JP, sans-serif',
              fontSize: '2.5vw',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '0.03em',
              lineHeight: 1.25,
              marginBottom: '1.6vw',
            }}
          >
            食品廃棄を、<br />おトクに救おう。
          </div>
          <div
            style={{
              height: '0.06vw',
              background: 'rgba(255,255,255,0.22)',
              marginBottom: '1.4vw',
            }}
          />
          <div
            style={{
              fontFamily: 'Noto Sans JP, sans-serif',
              fontSize: '0.9vw',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.78)',
              letterSpacing: '0.03em',
              lineHeight: 1.9,
            }}
          >
            飲食店の余剰フードを、閉店前に特別価格でご提供。<br />
            お店も、お客様も、地球も嬉しい<br />フードロス削減アプリです。
          </div>
        </div>

        {/* 縦の仕切り線 */}
        <div
          style={{
            width: '0.06vw',
            background: 'rgba(255,255,255,0.15)',
            flexShrink: 0,
            margin: '3vw 0',
          }}
        />

        {/* 右カラム: QRコード 2枚 縦並び */}
        <div
          style={{
            width: '22vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2vw',
            padding: '3vw 3.5vw 3vw 3vw',
            flexShrink: 0,
          }}
        >
          {/* App Store QR */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7vw' }}>
            <div
              style={{
                background: '#ffffff',
                padding: '0.7vw',
                borderRadius: '0.6vw',
                boxShadow: '0 0.4vw 1.2vw rgba(0,0,0,0.25)',
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
                style={{ width: '7.1vw', height: '7.1vw', display: 'block', objectFit: 'contain' }}
              />
            </div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.72vw',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              App Store
            </div>
            <div
              style={{
                fontFamily: 'Noto Sans JP, sans-serif',
                fontSize: '0.62vw',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              iPhoneアプリ 無料
            </div>
          </div>

          {/* Web QR */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7vw' }}>
            <div
              style={{
                background: '#ffffff',
                padding: '0.7vw',
                borderRadius: '0.6vw',
                boxShadow: '0 0.4vw 1.2vw rgba(0,0,0,0.25)',
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
                style={{ width: '7.1vw', height: '7.1vw', display: 'block' }}
                bgColor="#ffffff"
                fgColor="#1A1512"
                level="M"
              />
            </div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.72vw',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Website
            </div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.62vw',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.02em',
              }}
            >
              osusowakejapan.org
            </div>
          </div>
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
        BACK &nbsp;/&nbsp; 裏面
      </div>
    </div>
  );
}
