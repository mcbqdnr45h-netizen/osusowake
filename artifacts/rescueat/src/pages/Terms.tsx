import React from 'react';
import { Layout } from '@/components/Layout';
import { Link } from 'wouter';
import { ChevronLeft } from 'lucide-react';

export default function Terms() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-5 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          トップへ戻る
        </Link>

        <article>
          <h1 className="text-2xl font-black text-foreground mb-1">利用規約</h1>
          <p className="text-xs text-muted-foreground mb-8">最終更新日：2025年6月1日</p>

          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            食べロス（以下「本サービス」）をご利用いただくにあたり、以下の利用規約（以下「本規約」）をよくお読みください。本サービスを利用することで、本規約に同意したものとみなします。
          </p>

          <Section title="第1条（定義）">
            <p>本規約において使用する用語の定義は以下のとおりです。</p>
            <ul>
              <li>「利用者」とは、本サービスを利用するすべての方を指します。</li>
              <li>「出品者」とは、本サービスを通じてサプライズバッグを販売する飲食店・食料品店等の事業者を指します。</li>
              <li>「サプライズバッグ」とは、出品者が廃棄予定の食品をまとめて販売する商品を指します。</li>
              <li>「運営者」とは、本サービスを運営する食べロス運営事務局を指します。</li>
            </ul>
          </Section>

          <Section title="第2条（サービスの内容）">
            <p>本サービスは、フードロス削減を目的として、飲食店・食料品店等の出品者が余剰食品をサプライズバッグとして販売できるプラットフォームを提供します。利用者は本サービスを通じてサプライズバッグを予約・購入し、指定時間内に店舗で受け取ることができます。</p>
          </Section>

          <Section title="第3条（利用登録）">
            <p>本サービスの利用にあたり、利用者は正確な情報を提供するものとします。虚偽の情報を登録した場合、運営者は事前通知なく当該アカウントを停止・削除できるものとします。</p>
          </Section>

          <Section title="第4条（禁止事項）">
            <p>利用者は以下の行為を行ってはなりません。</p>
            <ul>
              <li>法令または本規約に違反する行為</li>
              <li>運営者や第三者の権利・利益を侵害する行為</li>
              <li>本サービスの運営を妨害する行為</li>
              <li>不正な方法でサービスを利用する行為</li>
              <li>その他、運営者が不適切と判断する行為</li>
            </ul>
          </Section>

          <Section title="第5条（購入・キャンセル）">
            <p>サプライズバッグの購入確定後のキャンセル・返品は原則としてお受けできません。ただし、出品者の都合により商品提供が不可能となった場合は、全額返金いたします。商品の内容はサプライズとなるため、内容に関するクレームはお受けできません。</p>
          </Section>

          <Section title="第6条（ノーショーに関する取扱い）">
            <p>利用者が出品者の定める受取時間内に来店せず、サプライズバッグを受け取らなかった場合（以下「ノーショー」）、当該商品は出品者の判断により廃棄されることがあります。</p>
            <p>ノーショーが発生した場合であっても、購入代金の返金は行いません。また、ノーショーが繰り返し確認された利用者に対しては、運営者は事前通知なく本サービスの利用を制限または停止できるものとします。</p>
            <p>なお、やむを得ない事情がある場合は、受取時間前に出品店舗へ直接ご連絡いただくようお願いします。対応は各出品者の判断に委ねられるものとし、運営者はその結果について一切の責任を負いません。</p>
          </Section>

          <Section title="第7条（アレルギー情報および食品衛生に関する免責）">
            <p>本サービスを通じて販売されるサプライズバッグに含まれる食品のアレルギー情報、原材料、栄養成分、調理方法、衛生管理等に関する情報の提供および管理は、すべて出品者の責任において行われます。</p>
            <p>運営者は、各商品に含まれるアレルギー物質その他の食品成分について、事前に確認・保証する立場にありません。食物アレルギーをお持ちの方、食事制限のある方（宗教上の理由を含む）は、購入前に必ず出品店舗に直接お問い合わせください。</p>
            <p>アレルギー反応、食中毒、その他食品に起因する健康被害が発生した場合、運営者は一切の責任を負いません。これらに関するすべての責任は出品者に帰属します。</p>
          </Section>

          <Section title="第8条（免責事項）">
            <p>運営者は、本サービスを通じて提供される商品の品質・安全性について、出品者が責任を負うものとし、運営者は一切の責任を負いません。システム障害・天災等、運営者の管理範囲外の事由による損害について、運営者は責任を負いません。</p>
            <p>本サービスは現状有姿で提供されるものとし、運営者はサービスの継続性・正確性・完全性について明示または黙示を問わず何ら保証しません。</p>
          </Section>

          <Section title="第9条（知的財産権）">
            <p>本サービス上に掲載されるすべてのコンテンツ（テキスト、画像、ロゴ、アイコン、デザイン、ソースコード等を含みますが、これらに限りません）に関する著作権、商標権その他一切の知的財産権は、運営者または正当な権利者に帰属します。</p>
            <p>利用者は、私的使用の範囲を超えて、運営者の事前の書面による許諾なく、これらのコンテンツを複製・転載・改変・頒布・公衆送信する行為を行ってはなりません。</p>
            <p>出品者が本サービスに登録した店舗情報・商品画像等については、本サービスの運営・宣伝・改善を目的として、運営者が無償で使用できるものとします。</p>
          </Section>

          <Section title="第10条（反社会的勢力の排除）">
            <p>利用者および出品者は、現在または将来にわたり、以下のいずれにも該当しないことを表明し、保証するものとします。</p>
            <ul>
              <li>暴力団、暴力団員、暴力団員でなくなった時から5年を経過しない者</li>
              <li>暴力団準構成員、暴力団関係企業、総会屋、社会運動標榜ゴロ、特殊知能暴力集団等</li>
              <li>その他これらに準ずる者（以下、上記各号をまとめて「反社会的勢力」という）</li>
            </ul>
            <p>利用者または出品者が反社会的勢力に該当すると判明した場合、または反社会的勢力と関係を有すると判明した場合、運営者は事前通知なく本サービスの利用を停止し、契約を解除できるものとします。これにより相手方に損害が生じても、運営者は一切の責任を負いません。</p>
          </Section>

          <Section title="第11条（規約の変更）">
            <p>運営者は必要に応じて本規約を変更することがあります。変更後の規約はサービス上で通知し、通知後も本サービスを継続利用した場合は変更後の規約に同意したものとみなします。</p>
          </Section>

          <Section title="第12条（準拠法・管轄）">
            <p>本規約は日本法に準拠し、本サービスに関する紛争は大阪地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
          </Section>

          <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground text-center">
            <p>食べロス運営事務局</p>
            <p className="mt-1">
              お問い合わせ：
              <a href="https://forms.gle/uhMoXjjF9YzkR52a6" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 ml-1">
                お問い合わせフォーム
              </a>
            </p>
          </div>
        </article>
      </div>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-black text-foreground mb-3 pb-2 border-b border-border">{title}</h2>
      <div className="text-sm text-foreground/80 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </section>
  );
}
