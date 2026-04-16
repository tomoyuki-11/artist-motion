import { Navbar } from "@/components/Navbar";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { type ReactNode, useState } from "react";

type FAQItemProps = {
  question: string;
  children: ReactNode;
};

function FAQItem({ question, children }: FAQItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 pb-4 last:border-b-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full text-left"
      >
        <p className="text-sm font-semibold text-orange-600 mb-1">Q.</p>
        <p className="font-semibold text-slate-800">
          {question}
        </p>
      </button>
      {open && (
        <div className="mt-3 text-slate-700 leading-relaxed">
          <p className="text-sm font-semibold text-sky-600 mb-1">A.</p>
          <div>{children}</div>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Helmet>
        <title>よくある質問 | ARTIST MOTION</title>
      </Helmet>
      <Navbar />

      <main className="py-16 md:py-24">
        <div className="container max-w-5xl">
          <header className="mb-8">
            <div className="accent-line bg-slate-400 mb-4 w-16" />
            <h1 className="text-2xl md:text-4xl font-bold text-slate-800 tracking-tight">
              よくある質問
            </h1>
            <p className="mt-3 text-slate-600 leading-relaxed">
              事業内容に関するよくあるご質問をまとめています。
            </p>
          </header>

          <div className="space-y-10">
            {/* 風舞流曲技太鼓（和太鼓教室） */}
            <section className="bg-white/80 border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">
                風舞流曲技太鼓（和太鼓教室）
              </h2>
              <div className="space-y-6">
                <FAQItem question="何歳から入門可能ですか？">
                  小学生から可能となります。年齢の上限はございません。
                </FAQItem>
                <FAQItem question="太鼓の出演依頼をしたいのですが。。。">
                  ご相談により対応いたします。詳細については直接ご連絡をお願いします。出演日の2か月以上前からご相談いただけると助かります。
                </FAQItem>
                <FAQItem question="風舞流に興味があるのですが、ついていけるか心配です。。">
                  ご安心ください。その方に合わせたペースで稽古を進行し、様々なことを学んでいただけると思います。
                </FAQItem>
              </div>
            </section>

            {/* 器械体操教室 */}
            <section className="bg-white/80 border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">
                器械体操教室
              </h2>
              <div className="space-y-6">
                <FAQItem question="うちの子本当に運動が苦手なのですが大丈夫でしょうか？">
                  問題ありません。むしろそういったことを事前に伝えていただけるとこちらとしましても進めやすくなりますので、些細なことでもスタッフに伝えていただけた方がお子様のペースに寄り添いやすいです。
                </FAQItem>
                <FAQItem question="何年生まで通えますか？">
                  基本的には小学生までとなりますが、相談に応じて中学生でも続けていただけます。
                </FAQItem>
              </div>
            </section>

            {/* ベースボールクラブ */}
            <section className="bg-white/80 border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">
                ベースボールクラブ
              </h2>
              <div className="space-y-6">
                <FAQItem question="何歳から通えますか？">
                  年長さんから小学2年生を基本としていますが、野球をこれから知って行きたいお子様や少年野球に入るには勇気のいる方も対象になります。
                </FAQItem>
                <FAQItem question="少年野球との違いは何ですか？">
                  野球指導はもちろんのこと、お子様の心身に関する専門家が指導しますので、技術以外のご相談もしていただけます。また、体育館での実施となるので、天候に流されることなく実施できます。お茶当番等もありません。
                </FAQItem>
              </div>
            </section>

            {/* フィットネスクラス */}
            <section className="bg-white/80 border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">
                フィットネスクラス
              </h2>
              <div className="space-y-6">
                <FAQItem question="筋トレを始めたいのですが何からしていいのか。。。">
                  まずはお気軽ご相談ください。自宅トレーニングをお伝えすることもできますし、提携しているジムで直接指導することが可能です。
                </FAQItem>
                <FAQItem question="エアロビクスをしたいのですが。。。">
                  5名以上のお友達を集めていただきましたら出張指導することも可能です。
                </FAQItem>
              </div>
            </section>
          </div>

          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex items-center text-slate-600 hover:text-slate-800 font-medium text-sm"
            >
              ← トップページへ
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

