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
          overflow: 'hidden',
          padding: '3.2vw 4vw',
        }}
      >
        {/* 装飾円 右上 */}
        <div
          style={{
            position: 'absolute',
            top: '-5vw',
            right: '-5vw',
            width: '16vw',
            height: '16vw',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        {/* 装飾円 左下 */}
        <div
          style={{
            position: 'absolute',
            bottom: '-4vw',
            left: '-3vw',
            width: '12vw',
            height: '12vw',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />

        {/* 上部: ブランド名 + キャッチコピー */}
        <div style={{ marginBottom: '2vw' }}>
          <div
            style={{
              fontFamily: 'Noto Sans JP, sans-serif',
              fontSize: '1.3vw',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.15em',
              marginBottom: '1vw',
            }}
          >
            おすそわけ
          </div>
          <div
            style={{
              fontFamily: 'Noto Sans JP, sans-serif',
              fontSize: '2.5vw',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '0.05em',
              lineHeight: 1.25,
            }}
          >
            食品廃棄を、おトクに救おう。
          </div>
        </div>

        {/* 説明文 */}
        <div
          style={{
            fontFamily: 'Noto Sans JP, sans-serif',
            fontSize: '1vw',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.75)',
            letterSpacing: '0.04em',
            lineHeight: 1.8,
            marginBottom: '2.4vw',
          }}
        >
          飲食店の余剰フードを、閉店前に特別価格でご提供。<br />
          お店も、お客様も、地球も嬉しいフードロス削減アプリです。
        </div>

        {/* 仕切り線 */}
        <div
          style={{
            height: '0.06vw',
            background: 'rgba(255,255,255,0.2)',
            marginBottom: '2vw',
          }}
        />

        {/* QRコード 2枚 + URL */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '3vw' }}>
          {/* App Store QR */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7vw' }}>
            <div
              style={{
                background: '#ffffff',
                padding: '0.6vw',
                borderRadius: '0.5vw',
                boxShadow: '0 0.3vw 1vw rgba(0,0,0,0.2)',
                width: '8vw',
                height: '8vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={`${base}qr-appstore.jpeg`}
                crossOrigin="anonymous"
                alt="App Store QR"
                style={{ width: '6.8vw', height: '6.8vw', display: 'block' }}
              />
            </div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.75vw',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.9)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              App Store
            </div>
            <div
              style={{
                fontFamily: 'Noto Sans JP, sans-serif',
                fontSize: '0.65vw',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              iPhoneアプリ無料
            </div>
          </div>

          {/* Web QR */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7vw' }}>
            <div
              style={{
                background: '#ffffff',
                padding: '0.6vw',
                borderRadius: '0.5vw',
                boxShadow: '0 0.3vw 1vw rgba(0,0,0,0.2)',
                width: '8vw',
                height: '8vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QRCodeSVG
                value="https://osusowakejapan.org/"
                size={999}
                style={{ width: '6.8vw', height: '6.8vw', display: 'block' }}
                bgColor="#ffffff"
                fgColor="#1A1512"
                level="M"
              />
            </div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.75vw',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.9)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Website
            </div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.65vw',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: '0.02em',
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
