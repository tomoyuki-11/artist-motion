import { SITE_BASE_URL } from "@/const";
import { Navbar } from "@/components/Navbar";
import { Link, useParams } from "wouter";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { Helmet } from "react-helmet-async";

/** サービスごとの開催概要（あれば表示） */
type ScheduleInfo = {
  dayOfWeek?: string;
  venueName?: string;
  time?: string;
  target?: string;
};

export const SERVICES: Record<
  string,
  {
    title: string;
    /** タグの下に表示する説明文 */
    bodyText: string;
    metaDescription: string;
    keywords: string;
    image: string;
    imageAlt: string;
    schedule?: ScheduleInfo;
  }
> = {
  taiko: {
    title: "風舞流曲技太鼓(ふうぶりゅうきょくぎだいこ)",
    bodyText:
      "鼓道会、鼓蝶会、鼓粋会を中心に芸術性を重視した唯一無二の曲技太鼓。様々な方が在籍されております。一緒に和太鼓を始めませんか？",
    metaDescription:
      "風舞流曲技太鼓（和太鼓・太鼓）の教室です。芸術性を重視した曲技太鼓。太鼓を始めたい方、アーティストモーションで一緒に和太鼓を楽しみませんか。只今準備中、しばらくお待ちください。",
    keywords: "風舞流曲技太鼓,太鼓,和太鼓,曲技太鼓,太鼓 教室,和太鼓 教室,アーティストモーション",
    image: "/images/taiko/shinichi_shihan1.jpeg",
    imageAlt: "風舞流曲技太鼓（和太鼓・太鼓）集合写真",
    schedule: {
      dayOfWeek: "日曜日、火曜日",
      venueName: "神戸市北区神田道場、丹波市山南町やまなみホール",
      time: "",
      target: "大人",
    },
  },
  baseball: {
    title: "ベースボールクラブ",
    bodyText:
      "低学年を中心にこれから野球を始めたいお子様を対象にしております。野球の楽しさが詰まった新しい形の野球スクールです。",
    metaDescription:
      "野球・ベースボールクラブ（野球クラブ）です。低学年を中心にこれから野球を始めたいお子様向け。野球の楽しさが詰まった野球スクール。アーティストモーション、只今準備中、しばらくお待ちください。",
    keywords: "ベースボールクラブ,野球クラブ,野球,野球 教室,ベースボール,少年野球,アーティストモーション",
    image: "/images/baseball/baseball_swing.jpeg",
    imageAlt: "野球・ベースボールクラブ",
    schedule: {
      dayOfWeek: "木曜日",
      venueName: "丹波市立山南中学校",
      time: "18:30〜20:00",
      target: "年長〜小学2年生&野球初心者",
    },
  },
  taiso: {
    title: "器械体操教室",
    bodyText:
      "「回る、逆さになる」といった体操要素はもちろん様々な運動を取り入れた教室。保護者と三位一体でお子様の心身の成長をサポートします。",
    metaDescription:
      "器械体操教室です。回る・逆さになるといった体操要素と様々な運動を取り入れ、お子様の心身の成長をサポート。体操教室をお探しならアーティストモーション。只今準備中、しばらくお待ちください。",
    keywords: "器械体操,器械体操教室,体操教室,体操,アーティストモーション",
    image: "/images/taiso/taiso1.jpeg",
    imageAlt: "器械体操教室",
    schedule: {
      dayOfWeek: "月〜木曜日",
      venueName: "三田市狭間が丘教室\n丹波市やまなみ教室\nスポーツクラブNAS教室",
      time: "",
      target: "",
    },
  },
  fitness: {
    title: "フィットネスクラス",
    bodyText:
      "パーソナルトレーニング（個別指導）からエアロビクス（グループレッスン）まで対応。「運動を始めたい」「筋肉をつけたい」「シェイプアップしたい」という方、まずはご相談を！",
    metaDescription:
      "フィットネスクラスです。パーソナルトレーニングからエアロビクスまで。運動を始めたい・筋肉をつけたい・シェイプアップしたい方、アーティストモーションでご相談ください。只今準備中、しばらくお待ちください。",
    keywords: "フィットネス,フィットネスクラス,パーソナルトレーニング,エアロビクス,アーティストモーション",
    image: "/images/fitness/image.jpg",
    imageAlt: "フィットネスクラス",
    schedule: {
      dayOfWeek: "",
      venueName: "西脇NIBBジム、久下自治会館",
      time: "",
      target: "",
    },
  },
};

/** サービス共通テーマ（スレートで統一） */
const SERVICE_THEME = {
  badge: "bg-slate-800",
  bar: "bg-slate-700",
  ring: "ring-slate-300 shadow-slate-900/5",
  overlay: "from-slate-900/30",
  border: "border-slate-200",
  bg: "bg-slate-50",
  bgLight: "border-slate-100",
  icon: "text-slate-600",
  link: "text-slate-700",
  linkHover: "hover:text-slate-900",
} as const;

const SERVICE_BADGE_LABEL: Record<string, string> = {
  taiko: "和太鼓",
  baseball: "野球",
  taiso: "体操",
  fitness: "フィットネス",
};

export default function ServiceDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const service = slug ? SERVICES[slug] : null;
  const theme = slug && SERVICE_BADGE_LABEL[slug] ? SERVICE_THEME : null;

  if (!service) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container max-w-2xl mx-auto pt-28 pb-16 px-4">
          <p className="text-slate-600 mb-6">サービスが見つかりません。</p>
          <Link href="/#services" className="inline-flex items-center gap-2 text-slate-800 font-semibold hover:underline">
            <ArrowLeft className="w-4 h-4" />
            事業内容一覧へ
          </Link>
        </div>
      </div>
    );
  }

  const pageUrl = `${SITE_BASE_URL}/services/${slug}`;
  const imageUrl = service.image.startsWith("http") ? service.image : `${SITE_BASE_URL}${service.image}`;

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.metaDescription,
    url: pageUrl,
    image: imageUrl,
    provider: {
      "@type": "Organization",
      name: "アーティストモーション",
      alternateName: "ARTIST MOTION",
      url: SITE_BASE_URL,
    },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{service.title} | ARTIST MOTION - アーティストモーション</title>
        <meta name="description" content={service.metaDescription} />
        <meta name="keywords" content={service.keywords} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={`${service.title} | ARTIST MOTION - アーティストモーション`} />
        <meta property="og:description" content={service.metaDescription} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:alt" content={service.imageAlt} />
        <meta property="og:locale" content="ja_JP" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${service.title} | ARTIST MOTION - アーティストモーション`} />
        <meta name="twitter:description" content={service.metaDescription} />
        <meta name="twitter:image" content={imageUrl} />
        <script type="application/ld+json">{JSON.stringify(serviceJsonLd)}</script>
      </Helmet>
      <Navbar />
      <main className="container max-w-4xl mx-auto pt-28 pb-20 px-4">
        <Link href="/#services" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          事業内容一覧へ
        </Link>

        <article>
          <div className={`aspect-[16/10] rounded-2xl overflow-hidden bg-slate-200 mb-10 relative ${theme ? `ring-2 shadow-lg ${theme.ring}` : ""}`}>
            <img
              src={service.image}
              alt={service.imageAlt}
              className="w-full h-full object-cover"
            />
            {theme && (
              <div className={`absolute inset-0 bg-gradient-to-t ${theme.overlay} to-transparent pointer-events-none`} />
            )}
          </div>
          <div className="mb-2">
            <h1 className={`text-3xl md:text-4xl font-bold text-slate-800 mb-2 ${theme ? "flex items-center gap-3" : ""}`}>
              {theme && <span className={`w-1.5 h-10 ${theme.bar} rounded-full shrink-0`} aria-hidden />}
              {service.title}
            </h1>
          </div>
          <p className="text-lg md:text-xl text-slate-700 leading-relaxed mb-6">
            {service.bodyText}
          </p>

          {/* 開催概要（スケジュールがある場合のみ） */}
          {service.schedule && (
            <section className={`mt-12 pt-10 border-t ${theme ? theme.border : "border-slate-200"}`}>
              <h2 className={`text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 ${theme ? `text-slate-800 ${theme.bg} -mx-4 px-4 py-3 rounded-xl border ${theme.bgLight}` : "text-slate-800"}`}>
                <Calendar className={`w-6 h-6 shrink-0 ${theme ? theme.icon : "text-slate-600"}`} />
                開催概要
              </h2>
              <dl className={`space-y-3 ${theme ? `${theme.bg}/70 rounded-2xl p-6 border ${theme.bgLight}` : "text-slate-700"}`}>
                <div className="flex gap-4">
                  <dt className={`font-semibold w-20 shrink-0 ${theme ? theme.icon : "text-slate-600"}`}>曜日</dt>
                  <dd className={theme ? "text-slate-800 font-medium" : ""}>{service.schedule.dayOfWeek || "—"}</dd>
                </div>
                <div className="flex gap-4">
                  <dt className={`font-semibold w-20 shrink-0 ${theme ? theme.icon : "text-slate-600"}`}>場所</dt>
                  <dd className={`${theme ? "text-slate-800 font-medium" : ""} whitespace-pre-line`}>
                    {(service.schedule.venueName || "—").replace(/、/g, "\n")}
                  </dd>
                </div>
                <div className="flex gap-4">
                  <dt className={`font-semibold w-20 shrink-0 ${theme ? theme.icon : "text-slate-600"}`}>時間</dt>
                  <dd className={theme ? "text-slate-800 font-medium" : ""}>{service.schedule.time || "—"}</dd>
                </div>
                <div className="flex gap-4">
                  <dt className={`font-semibold w-20 shrink-0 ${theme ? theme.icon : "text-slate-600"}`}>対象</dt>
                  <dd className={theme ? "text-slate-800 font-medium" : ""}>{service.schedule.target || "—"}</dd>
                </div>
              </dl>
            </section>
          )}

          {/* 場所の詳細（ベースボールクラブ） */}
          {slug === "baseball" && (
            <section className={`mt-12 pt-10 border-t ${theme ? theme.border : "border-slate-200"}`}>
              <h2 className={`text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 ${theme ? `text-slate-800 ${theme.bg} -mx-4 px-4 py-3 rounded-xl border ${theme.bgLight}` : "text-slate-800"}`}>
                <MapPin className={`w-6 h-6 shrink-0 ${theme ? theme.icon : "text-slate-600"}`} />
                場所の詳細
              </h2>
              <p className={`mb-4 ${theme ? "text-slate-600" : "text-slate-600"} text-base font-medium`}>丹波市立山南中学校</p>
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6530.76269051374!2d135.02994289977903!3d35.07220337196108!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x600009e60978c7c9%3A0xf10559d21b1e55fb!2z5Li55rOi5biC56uL5bGx5Y2X5Lit5a2m5qCh!5e0!3m2!1sja!2sjp!4v1773465328355!5m2!1sja!2sjp"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="丹波市立山南中学校の地図"
                />
              </div>
            </section>
          )}

          {/* 場所の詳細（風舞流曲技太鼓） */}
          {slug === "taiko" && (
            <section className={`mt-12 pt-10 border-t ${theme ? theme.border : "border-slate-200"}`}>
              <h2 className={`text-xl md:text-2xl font-bold mb-1 flex items-center gap-2 ${theme ? `text-slate-800 ${theme.bg} -mx-4 px-4 py-3 rounded-xl border ${theme.bgLight}` : "text-slate-800"}`}>
                <MapPin className={`w-6 h-6 shrink-0 ${theme ? theme.icon : "text-slate-600"}`} />
                場所の詳細
              </h2>
              <p className={`mb-4 ${theme ? "text-slate-600" : "text-slate-600"} text-base font-medium`}>
                神戸市北区神田道場 <span className="text-slate-500 text-sm font-normal">（調整中）</span>
              </p>
              <p className={`mb-4 ${theme ? "text-slate-600" : "text-slate-600"} text-base font-medium`}>丹波市山南町やまなみホール</p>
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2969.5226965774636!2d135.0333403824969!3d35.07214028363336!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60000981f2c3a619%3A0x8ede0b5c4fa02c5e!2z5bGx5Y2X5L2P5rCR44K744Oz44K_44O8!5e0!3m2!1sja!2sjp!4v1773465783862!5m2!1sja!2sjp"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="山南町やまなみホールの地図"
                />
              </div>
            </section>
          )}

          {/* 場所の詳細（器械体操教室） */}
          {slug === "taiso" && (
            <section className={`mt-12 pt-10 border-t ${theme ? theme.border : "border-slate-200"}`}>
              <h2 className={`text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 ${theme ? `text-slate-800 ${theme.bg} -mx-4 px-4 py-3 rounded-xl border ${theme.bgLight}` : "text-slate-800"}`}>
                <MapPin className={`w-6 h-6 shrink-0 ${theme ? theme.icon : "text-slate-600"}`} />
                場所の詳細
              </h2>
              <p className={`mb-4 ${theme ? "text-slate-600" : "text-slate-600"} text-base font-medium`}>
                三田市狭間が丘教室 <span className="text-slate-500 text-sm font-normal">（調整中）</span>
              </p>
              <p className={`mb-4 ${theme ? "text-slate-600" : "text-slate-600"} text-base font-medium`}>丹波市山南町やまなみホール</p>
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2969.5226965774636!2d135.0333403824969!3d35.07214028363336!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60000981f2c3a619%3A0x8ede0b5c4fa02c5e!2z5bGx5Y2X5L2P5rCR44K744Oz44K_44O8!5e0!3m2!1sja!2sjp!4v1773465783862!5m2!1sja!2sjp"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="山南町やまなみホールの地図"
                />
              </div>
              <p className={`mt-8 mb-4 ${theme ? "text-slate-600" : "text-slate-600"} text-base font-medium`}>スポーツクラブNAS教室</p>
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3272.176156114061!2d135.18849767711407!3d34.90202857238159!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x600065a8d98580e9%3A0xfc4a4d51e62b56dd!2z44K544Od44O844OE44Kv44Op44OWTkFT44Km44OD44OH44Kj44K_44Km44Oz!5e0!3m2!1sja!2sjp!4v1773466377995!5m2!1sja!2sjp"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="スポーツクラブNASの地図"
                />
              </div>
            </section>
          )}

          {/* 場所の詳細（フィットネスクラス） */}
          {slug === "fitness" && (
            <section className={`mt-12 pt-10 border-t ${theme ? theme.border : "border-slate-200"}`}>
              <h2 className={`text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 ${theme ? `text-slate-800 ${theme.bg} -mx-4 px-4 py-3 rounded-xl border ${theme.bgLight}` : "text-slate-800"}`}>
                <MapPin className={`w-6 h-6 shrink-0 ${theme ? theme.icon : "text-slate-600"}`} />
                場所の詳細
              </h2>
              <p className={`mb-4 ${theme ? "text-slate-600" : "text-slate-600"} text-base font-medium`}>西脇NIBBジム</p>
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3268.592388536083!2d134.96139977711587!3d34.991873367531845!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x355535784173dcaf%3A0x312e9c789f84e7f4!2zTklCQuODiOODrOODvOODi-ODs-OCsOOCuOODoA!5e0!3m2!1sja!2sjp!4v1773466846904!5m2!1sja!2sjp"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="NIBBジムの地図"
                />
              </div>
              <p className={`mt-8 mb-4 ${theme ? "text-slate-600" : "text-slate-600"} text-base font-medium`}>久下自治会館</p>
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3265.2210851160094!2d135.0370340771177!3d35.076208362969794!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60000978d55f4fc7%3A0x2604bb7824120387!2z5LmF5LiL6Ieq5rK75Lya6aSo!5e0!3m2!1sja!2sjp!4v1773466993033!5m2!1sja!2sjp"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="久下自治会館の地図"
                />
              </div>
            </section>
          )}
        </article>
      </main>
    </div>
  );
}
