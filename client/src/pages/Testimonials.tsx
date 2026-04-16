import { Navbar } from "@/components/Navbar";
import { AnimatedSection } from "@/components/AnimatedSection";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import {
  TESTIMONIALS,
  TESTIMONIAL_CATEGORIES,
  type TestimonialCategory,
} from "@/data/testimonials";
import { SITE_BASE_URL } from "@/const";

/** カテゴリごとにグループ化 */
const testimonialsByCategory = (): { category: TestimonialCategory; items: typeof TESTIMONIALS }[] => {
  const order: TestimonialCategory[] = ["taiko", "taiso", "baseball", "fitness"];
  return order.map((category) => ({
    category,
    items: TESTIMONIALS.filter((t) => t.category === category),
  }));
};

export default function Testimonials() {
  const grouped = testimonialsByCategory();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Helmet>
        <title>お客様の声 | ARTIST MOTION</title>
        <meta
          name="description"
          content="風舞流曲技太鼓門下生・器械体操教室・ベースボールクラブ・フィットネスクラスの保護者・会員の声をご紹介します。"
        />
        <link rel="canonical" href={`${SITE_BASE_URL}/testimonials`} />
        <meta property="og:url" content={`${SITE_BASE_URL}/testimonials`} />
        <meta property="og:title" content="お客様の声 | ARTIST MOTION" />
      </Helmet>
      <Navbar />

      <section className="py-16 md:py-24">
        <div className="container max-w-4xl">
          <div className="mb-12 md:mb-16">
            <div className="accent-line bg-slate-400 mb-4 w-16" />
            <h1 className="text-2xl md:text-4xl font-bold text-slate-800 tracking-tight">
              保護者及び和太鼓門下生の声
            </h1>
            <p className="mt-3 text-slate-600 leading-relaxed">
              門下生・保護者・会員の皆様からいただいた声を掲載しています。
            </p>
          </div>

          <div className="space-y-14 md:space-y-16">
            {grouped.map(({ category, items }) =>
              items.length > 0 ? (
                <AnimatedSection
                  key={category}
                  animation="fade-up-lg"
                  className="border-b border-slate-200 pb-12 last:border-b-0 last:pb-0"
                >
                  <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-6">
                    【{TESTIMONIAL_CATEGORIES[category]}】
                  </h2>
                  <ul className="list-none m-0 p-0 space-y-5">
                    {items.map((item) => (
                      <li key={item.id}>
                        <p className="text-slate-700 leading-relaxed">
                          ■ {item.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                </AnimatedSection>
              ) : null
            )}
          </div>

          <div className="mt-12">
            <Link
              href="/"
              className="inline-flex items-center text-slate-600 hover:text-slate-800 font-medium text-sm"
            >
              ← トップページへ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
