import React from 'react';

const QA_ITEMS = [
  {
    q: '手数料がかかるんちゃうの？',
    a: '初期費用・月額料金は完全無料です。販売が成立した時だけ15%をいただきます。売れなければ一切かかりません。',
    color: '#E8786C',
    bg: '#FDF0EE',
    tag: '費用について',
  },
  {
    q: '操作が難しそう…うちには無理かも',
    a: '写真を撮って、個数を入れて、ボタンを押すだけ。慣れたら1分以内で完了します。登録後に使い方を一緒に確認するので安心です。',
    color: '#44A836',
    bg: '#F5FAF4',
    tag: '操作・使い方',
  },
  {
    q: '誰が買いに来てくれるの？',
    a: '出品すると近くのアプリユーザーに自動で通知が届きます。高槻・摂津・茨木エリアのユーザーが購入します。',
    color: '#E8786C',
    bg: '#FDF0EE',
    tag: '集客について',
  },
  {
    q: '毎日出品しないといけないの？',
    a: '余った時だけ出品すればOKです。義務はありません。1個からでも出品でき、当日のキャンセルも可能です。',
    color: '#44A836',
    bg: '#F5FAF4',
    tag: '運用ルール',
  },
];

export default function SlideQA() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#2A2623' }}>
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(232,120,108,0.07) 1px, transparent 1px)',
          backgroundSize: '3vw 3vw',
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(160deg, rgba(42,38,35,0.95) 0%, rgba(42,38,35,0.85) 60%, rgba(68,168,54,0.12) 100%)' }}
      />

      <div className="absolute inset-0 flex flex-col" style={{ padding: '5vh 7vw' }}>
        {/* Header */}
        <div style={{ marginBottom: '4vh' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.14em', marginBottom: '1vh' }}>
            Q &amp; A
          </p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3.8vw', fontWeight: 900, color: '#FBF8F4', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            よくあるご不安に<br />
            <span style={{ color: '#E8786C' }}>正直にお答えします</span>
          </h2>
        </div>

        {/* Q&A Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2vw', flex: 1 }}>
          {QA_ITEMS.map((item, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(251,248,244,0.05)',
                border: `1px solid ${item.color}40`,
                borderRadius: '1.4vw',
                padding: '2.5vh 2.5vw',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5vh',
                backdropFilter: 'blur(6px)',
              }}
            >
              {/* Tag */}
              <span style={{
                fontFamily: 'Noto Sans JP, sans-serif',
                fontSize: '1.1vw',
                fontWeight: 700,
                color: item.color,
                background: `${item.color}18`,
                border: `1px solid ${item.color}40`,
                borderRadius: '100px',
                padding: '0.3vh 1vw',
                alignSelf: 'flex-start',
              }}>
                {item.tag}
              </span>

              {/* Q */}
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'flex-start' }}>
                <div style={{
                  width: '2.8vh', height: '2.8vh', borderRadius: '50%',
                  background: item.color, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0, marginTop: '0.2vh',
                }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vh', fontWeight: 900, color: '#fff' }}>Q</span>
                </div>
                <p style={{
                  fontFamily: 'Noto Sans JP, sans-serif',
                  fontSize: '1.65vw',
                  fontWeight: 900,
                  color: '#FBF8F4',
                  lineHeight: 1.4,
                }}>
                  {item.q}
                </p>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(251,248,244,0.1)' }} />

              {/* A */}
              <div style={{ display: 'flex', gap: '0.8vw', alignItems: 'flex-start' }}>
                <div style={{
                  width: '2.8vh', height: '2.8vh', borderRadius: '50%',
                  background: 'rgba(251,248,244,0.12)',
                  border: `1px solid ${item.color}60`,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0, marginTop: '0.2vh',
                }}>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4vh', fontWeight: 900, color: item.color }}>A</span>
                </div>
                <p style={{
                  fontFamily: 'Noto Sans JP, sans-serif',
                  fontSize: '1.55vw',
                  color: 'rgba(251,248,244,0.82)',
                  lineHeight: 1.7,
                }}>
                  {item.a}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom message */}
        <div style={{ marginTop: '2.5vh', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            background: 'rgba(232,120,108,0.15)',
            border: '1px solid rgba(232,120,108,0.35)',
            borderRadius: '100px',
            padding: '1vh 2.5vw',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1vw',
          }}>
            <span style={{ fontSize: '1.6vw' }}>💬</span>
            <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', fontWeight: 700, color: 'rgba(251,248,244,0.85)' }}>
              他にご不安な点は、何でもその場でお答えします！
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
