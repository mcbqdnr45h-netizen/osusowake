import React from 'react';

export default function SlideLegalTax() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#FBF8F4' }}>
      {/* Subtle pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(42,38,35,0.04) 1px, transparent 1px)',
          backgroundSize: '3vw 3vw',
        }}
      />

      <div className="absolute inset-0 flex flex-col" style={{ padding: '4vh 6vw' }}>
        {/* Header */}
        <div style={{ marginBottom: '3vh' }}>
          <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1vw', fontWeight: 700, color: '#E8786C', letterSpacing: '0.14em', marginBottom: '0.5vh' }}>
            LEGAL &amp; TAX
          </p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '3vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            契約・税務まわりの<span style={{ color: '#E8786C' }}>ご質問</span>
          </h2>
        </div>

        {/* 2-column content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2vw', flex: 1, minHeight: 0 }}>
          {/* LEFT: 法的根拠 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid rgba(232,120,108,0.25)',
            borderRadius: '1.2vw',
            padding: '3vh 2.2vw',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.8vh',
            boxShadow: '0 4px 20px rgba(232,120,108,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8vw' }}>
              <div style={{
                width: '3vh', height: '3vh', borderRadius: '50%',
                background: '#E8786C', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '1.6vh' }}>⚖️</span>
              </div>
              <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1vw', fontWeight: 700, color: '#E8786C', background: 'rgba(232,120,108,0.1)', padding: '0.3vh 1vw', borderRadius: '100px' }}>
                法的根拠
              </span>
            </div>

            <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.4 }}>
              購入後キャンセル不可は<br />
              <span style={{ color: '#E8786C' }}>合法です</span>
            </p>

            <div style={{ height: '1px', background: 'rgba(42,38,35,0.1)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2vh' }}>
              {[
                { title: '通信販売はクーリングオフ対象外', desc: '特定商取引法上、アプリ販売はそもそも適用除外' },
                { title: '「返品特約」を明示', desc: '当社の特商法表記・利用規約に明確に記載済み' },
                { title: '食品の業界標準', desc: 'Too Good To Go等、世界の同種サービスと同じ運用' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.8vw', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '2vh', height: '2vh', borderRadius: '50%',
                    background: '#E8786C', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: '0.3vh',
                  }}>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1vh', fontWeight: 900, color: '#fff' }}>✓</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.1vw', fontWeight: 700, color: '#2A2623', lineHeight: 1.4 }}>
                      {item.title}
                    </p>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.95vw', color: 'rgba(42,38,35,0.65)', lineHeight: 1.5, marginTop: '0.2vh' }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: 税務処理 */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid rgba(68,168,54,0.25)',
            borderRadius: '1.2vw',
            padding: '3vh 2.2vw',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.8vh',
            boxShadow: '0 4px 20px rgba(68,168,54,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8vw' }}>
              <div style={{
                width: '3vh', height: '3vh', borderRadius: '50%',
                background: '#44A836', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '1.6vh' }}>📊</span>
              </div>
              <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1vw', fontWeight: 700, color: '#44A836', background: 'rgba(68,168,54,0.1)', padding: '0.3vh 1vw', borderRadius: '100px' }}>
                税務処理
              </span>
            </div>

            <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.5vw', fontWeight: 900, color: '#2A2623', lineHeight: 1.4 }}>
              売上は<span style={{ color: '#44A836' }}>販売額の100%</span>で<br />
              店舗様の売上に計上
            </p>

            <div style={{ height: '1px', background: 'rgba(42,38,35,0.1)' }} />

            {/* 仕訳例テーブル */}
            <div style={{
              background: 'rgba(68,168,54,0.05)',
              borderRadius: '0.6vw',
              padding: '1.5vh 1.2vw',
            }}>
              <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.9vw', fontWeight: 700, color: 'rgba(42,38,35,0.55)', marginBottom: '0.8vh', letterSpacing: '0.05em' }}>
                例：500円で販売した場合
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5vh' }}>
                {[
                  { label: '店舗売上（計上額）', value: '500円', color: '#2A2623', bold: true },
                  { label: 'おすそわけ手数料（経費）', value: '▲ 125円', color: '#E8786C' },
                  { label: '実際の振込額', value: '375円', color: '#44A836', bold: true, border: true },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingTop: row.border ? '0.6vh' : 0,
                    borderTop: row.border ? '1px solid rgba(42,38,35,0.15)' : 'none',
                  }}>
                    <span style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1vw', color: 'rgba(42,38,35,0.75)' }}>
                      {row.label}
                    </span>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.2vw', fontWeight: row.bold ? 900 : 700, color: row.color }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8vh' }}>
              {[
                { title: 'インボイス対応済み', desc: '当社は適格請求書発行事業者として登録済み' },
                { title: '軽減税率8%対応', desc: 'テイクアウト食品の消費税を自動計算' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.8vw', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '2vh', height: '2vh', borderRadius: '50%',
                    background: '#44A836', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: '0.3vh',
                  }}>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1vh', fontWeight: 900, color: '#fff' }}>✓</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '1.05vw', fontWeight: 700, color: '#2A2623', lineHeight: 1.4 }}>
                      {item.title}
                    </p>
                    <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.9vw', color: 'rgba(42,38,35,0.65)', lineHeight: 1.5 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop: '2vh', display: 'flex', justifyContent: 'center' }}>
          <p style={{ fontFamily: 'Noto Sans JP, sans-serif', fontSize: '0.95vw', color: 'rgba(42,38,35,0.55)', textAlign: 'center' }}>
            ※ 個別の税務処理については、念のため顧問税理士へのご確認をおすすめします
          </p>
        </div>
      </div>
    </div>
  );
}
