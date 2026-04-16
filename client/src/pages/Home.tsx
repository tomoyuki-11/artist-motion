import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnimatedSection } from "@/components/AnimatedSection";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SITE_BASE_URL } from "@/const";
import { fetchNews, fetchNewsComments, incrementVisits, sendContact, submitNewsComment } from "@/lib/adminApi";
import type { NewsItem, NewsCommentItem } from "@/lib/adminApi";
import { ChevronDown, Instagram, MessageCircle, Youtube, BookOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { Link } from "wouter";
import { SERVICES } from "@/pages/ServiceDetail";
import { getTestimonialsForHome } from "@/data/testimonials";
import { SITE_VIDEOS } from "@/data/videos";

const INSTAGRAM_URL = "https://www.instagram.com/artist.motion_fuburyu";
const INSTAGRAM_REVERSE_URL = "https://www.instagram.com/artist.motion_reverse";

/** 公式Instagramの最新投稿（投稿URLの /p/XXXXX/ の XXXXX 部分を指定） */
const INSTAGRAM_LATEST_POST_SHORTCODES: string[] = [
  // 例: "C1234567890abcdef",
  "DW8CrSVj_sQ","DWyevY9j1fj",
];
const LINE_URL = "https://line.me/R/ti/p/@548udakm";
const YOUTUBE_URL = "https://www.youtube.com/@%E9%A2%A8%E8%88%9E%E6%B5%81%E6%9B%B2%E6%8A%80%E5%A4%AA%E9%BC%93%E8%B0%B7%E5%8F%A3%E7%9C%9F";

/** YouTubeの最新動画（動画URLの v= の後、または youtu.be/ の後のIDを指定） */
const YOUTUBE_LATEST_VIDEO_IDS: string[] = [
  // 例: "dQw4w9WgXcQ",
  "rJLQLoUghSA","4t6s5xG1zfg",
];

const HERO_IMAGES = [
  "/images/IMG_6577.jpeg",
  "/images/baseball/baseball_swing.jpeg",
  "/images/taiso/taiso1.jpeg",
  "/images/fitness/image.jpg",
];

/** 事業内容4ブロックの背景画像: 太鼓・野球・体操・フィットネス */
const SERVICE_IMAGES = [
  "/images/taiko/shinichi_shihan1.jpeg",  // 太鼓
  "/images/baseball/baseball_swing.jpeg",   // 野球
  "/images/taiso/taiso1.jpeg",         // 体操
  "/images/fitness/image.jpg",         // フィットネス
];

const SERVICE_CARDS = [
  {
    slug: "taiko" as const,
    title: "風舞流曲技太鼓",
    href: "/services/taiko",
    imageAlt: "風舞流曲技太鼓（和太鼓・太鼓）",
  },
  {
    slug: "baseball" as const,
    title: "ベースボールクラブ",
    href: "/services/baseball",
    imageAlt: "野球・ベースボールクラブ",
  },
  {
    slug: "taiso" as const,
    title: "器械体操教室",
    href: "/services/taiso",
    imageAlt: "器械体操教室",
  },
  {
    slug: "fitness" as const,
    title: "フィットネスクラス",
    href: "/services/fitness",
    imageAlt: "フィットネスクラス",
  },
] as const;

/**
 * Design: Energetic Dynamism
 * - Full-screen hero with taiko drummer image
 * - Bold black & white with neon yellow accents
 * - Dynamic diagonal section dividers
 * - Parallax scrolling effects
 * - Bebas Neue headings + Roboto body
 * - Scroll-triggered animations
 */

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSending, setContactSending] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [newsComments, setNewsComments] = useState<NewsCommentItem[]>([]);
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const [newsImageLoading, setNewsImageLoading] = useState<Record<string, boolean>>({});
  const [modalImageLoading, setModalImageLoading] = useState(false);
  const [instagramEmbedLoading, setInstagramEmbedLoading] = useState<Record<string, boolean>>({});
  const [instagramEmbedTimedOut, setInstagramEmbedTimedOut] = useState<Record<string, boolean>>({});
  const [youtubeEmbedLoading, setYoutubeEmbedLoading] = useState<Record<string, boolean>>({});
  const [youtubeEmbedTimedOut, setYoutubeEmbedTimedOut] = useState<Record<string, boolean>>({});

  const VISIT_COUNTED_KEY = "artist_motion_visit_counted";
  const newsForHome = useMemo(() => news.slice(0, 3), [news]);

  // Instagram埋め込みは、環境によっては非HTTPS/トラッキング防止でブロックされやすい
  const canEmbedInstagram = useMemo(() => {
    if (typeof window === "undefined") return true;
    return window.location.protocol === "https:";
  }, []);

  // 動画の初期表示が黒くならないよう、先頭フレームを読み込んで停止する
  const primeVideoFirstFrame = (video: HTMLVideoElement) => {
    // 0秒ぴったりは黒になる環境があるので、ほんの少し進める
    const targetTime = Math.min(0.05, Math.max(0.01, (video.duration || 1) * 0.001));
    try {
      if (Number.isFinite(targetTime)) video.currentTime = targetTime;
    } catch {
      // iOS/Safari等でcurrentTimeの変更が拒否される場合があるので無視
    }
  };

  // Instagram/YouTube 埋め込み: 読み込み中スピナー + タイムアウト保険
  useEffect(() => {
    const nextInstagram: Record<string, boolean> = {};
    for (const sc of INSTAGRAM_LATEST_POST_SHORTCODES) nextInstagram[sc] = true;
    setInstagramEmbedLoading(nextInstagram);
    setInstagramEmbedTimedOut({});

    const nextYoutube: Record<string, boolean> = {};
    for (const id of YOUTUBE_LATEST_VIDEO_IDS) nextYoutube[id] = true;
    setYoutubeEmbedLoading(nextYoutube);
    setYoutubeEmbedTimedOut({});

    const timers: number[] = [];
    // 8秒でスピナー停止（ブロック時に永遠に回らないように）
    for (const sc of INSTAGRAM_LATEST_POST_SHORTCODES) {
      const t = window.setTimeout(() => {
        setInstagramEmbedTimedOut((p) => ({ ...p, [sc]: true }));
        setInstagramEmbedLoading((p) => ({ ...p, [sc]: false }));
      }, 8000);
      timers.push(t);
    }
    for (const id of YOUTUBE_LATEST_VIDEO_IDS) {
      const t = window.setTimeout(() => {
        setYoutubeEmbedTimedOut((p) => ({ ...p, [id]: true }));
        setYoutubeEmbedLoading((p) => ({ ...p, [id]: false }));
      }, 8000);
      timers.push(t);
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  // ヒーロー: 4枚とも取得できたら、4枚をふわっと同時表示→その後に文字をふわっと表示
  useEffect(() => {
    let cancelled = false;
    const fallback = setTimeout(() => {
      if (!cancelled) setHeroReady(true);
    }, 5000);
    const promises = HERO_IMAGES.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        })
    );
    Promise.all(promises).then(() => {
      if (!cancelled) {
        clearTimeout(fallback);
        setHeroReady(true);
      }
    });
    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contactSending) return;
    const name = contactName.trim();
    const email = contactEmail.trim();
    const message = contactMessage.trim();
    if (!name || !email || !message) {
      toast.error("名前・メールアドレス・お問い合わせ内容を入力してください。");
      return;
    }
    setContactSending(true);
    try {
      const data = await sendContact({ name, email, message });
      if (!data.ok) {
        toast.error(data.error ?? "送信に失敗しました。");
        return;
      }
      toast.success("送信しました。ご連絡ありがとうございます。");
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    } catch {
      toast.error("送信に失敗しました。しばらくしてからお試しください。");
    } finally {
      setContactSending(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 同一タブ・セッション内で初回アクセス時のみカウント（サービスページから戻っても加算しない）
  // sessionStorage が使えない場合はカウントしない（二重カウント・ボット対策）
  useEffect(() => {
    try {
      if (sessionStorage.getItem(VISIT_COUNTED_KEY)) return;
      sessionStorage.setItem(VISIT_COUNTED_KEY, "1");
      incrementVisits().catch(() => {});
    } catch {
      // シークレットモード等で sessionStorage が使えない場合は加算しない
    }
  }, []);

  useEffect(() => {
    fetchNews()
      .then((items) => {
        setNews(items);
        // 画像付きのお知らせは、モーダルを開く前に事前読み込みしておく
        items
          .filter((item) => item.image_url)
          .forEach((item) => {
            const img = new Image();
            img.src = item.image_url!;
          });
      })
      .catch(() => setNews([]));
  }, []);

  useEffect(() => {
    if (!selectedNews) {
      setNewsComments([]);
      return;
    }
    fetchNewsComments(selectedNews.id)
      .then(setNewsComments)
      .catch(() => setNewsComments([]));
  }, [selectedNews?.id]);

  // トップの「お知らせ」画像: 読み込み中スピナー表示用
  useEffect(() => {
    setNewsImageLoading((prev) => {
      const next = { ...prev };
      for (const item of newsForHome) {
        if (!item.image_url) continue;
        if (next[item.id] === undefined) next[item.id] = true;
      }
      return next;
    });
  }, [newsForHome]);

  // モーダル画像: 開くたびに読み込み状態をリセット
  useEffect(() => {
    if (!selectedNews?.image_url) {
      setModalImageLoading(false);
      return;
    }
    setModalImageLoading(true);
  }, [selectedNews?.image_url]);

  // 他ページから /#news 等で遷移したときに該当セクションへスクロール
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      const rafId = requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "アーティストモーション",
    alternateName: ["ARTIST MOTION", "ARTISTMOTION"],
    description: "風舞流曲技太鼓・ベースボール・器械体操・フィットネスなど、心を豊かにする身体活動を提供しています。",
    url: SITE_BASE_URL,
    logo: `${SITE_BASE_URL}/images/logo.jpeg`,
    image: `${SITE_BASE_URL}/images/logo.jpeg`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+81-90-5464-6904",
      contactType: "customer service",
      email: "fuburyukodokai@gmail.com",
      availableLanguage: "Japanese",
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-white overflow-hidden">
      <Helmet>
        <title>ARTIST MOTION - アーティストモーション - 風舞流曲技太鼓・ベースボール・器械体操・フィットネス</title>
        <meta name="description" content="丹波市・三田市・神戸市北区を中心に活動するARTIST MOTION~アーティストモーション~は、風舞流曲技太鼓・ベースボール・器械体操・フィットネスなど、心を豊かにする身体活動を提供しています。お気軽にお問い合わせください。" />
        <meta name="keywords" content="アーティストモーション,ARTIST MOTION,風舞流曲技太鼓,太鼓,和太鼓,太鼓 教室,曲技太鼓,野球,野球クラブ,野球 教室,ベースボール,ベースボールクラブ,器械体操,体操教室,フィットネス,フィットネスクラス,丹波市,丹波,三田市,三田,筋トレ,ダイエット" />
        <link rel="canonical" href={`${SITE_BASE_URL}/`} />
        <meta property="og:url" content={`${SITE_BASE_URL}/`} />
        <meta property="og:title" content="ARTIST MOTION - アーティストモーション" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <Navbar />
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen w-full overflow-hidden pt-20">
        <div className="absolute inset-0 w-full h-full bg-slate-900" />
        {/* 下部のグラデーションで奥行き感 */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
          style={{
            background: "linear-gradient(to top, rgba(15,23,42,0.85) 0%, transparent 45%, transparent 100%)",
          }}
        />

        {/* 4 Activity Images Grid: 4枚揃いでゆっくりふわっと同時表示→奥→手前でパララックス */}
        <div
          className={`absolute inset-0 w-full h-full p-3 md:p-5 lg:p-6 ${
            heroReady ? "animate-hero-images-reveal" : "opacity-0"
          }`}
        >
          <div className="grid grid-cols-2 gap-2 md:gap-3 lg:gap-4 w-full h-full max-w-7xl mx-auto min-h-0">
            {/* 左上: 一番遅い（奥） */}
            <div
              className="relative overflow-hidden rounded-xl md:rounded-2xl will-change-transform min-h-[40vh] md:min-h-0"
              style={{
                backgroundImage: "url(/images/IMG_6577.jpeg)",
                backgroundSize: "cover",
                backgroundPosition: "50% 30%",
                transform: `translateY(${scrollY * 0.1}px)`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 to-transparent" />
            </div>
            {/* 右上 */}
            <div
              className="relative overflow-hidden rounded-xl md:rounded-2xl will-change-transform min-h-[40vh] md:min-h-0"
              style={{
                backgroundImage: "url(/images/baseball/baseball_swing.jpeg)",
                backgroundSize: "cover",
                backgroundPosition: "50% 40%",
                transform: `translateY(${scrollY * 0.18}px)`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-bl from-slate-900/50 to-transparent" />
            </div>
            {/* 左下 */}
            <div
              className="relative overflow-hidden rounded-xl md:rounded-2xl will-change-transform min-h-[40vh] md:min-h-0"
              style={{
                backgroundImage: "url(/images/taiso/taiso1.jpeg)",
                backgroundSize: "cover",
                backgroundPosition: "50% 30%",
                transform: `translateY(${scrollY * 0.22}px)`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/50 to-transparent" />
            </div>
            {/* 右下: 一番速い（手前） */}
            <div
              className="relative overflow-hidden rounded-xl md:rounded-2xl will-change-transform min-h-[40vh] md:min-h-0"
              style={{
                backgroundImage: "url(/images/fitness/image.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "50% 50%",
                transform: `translateY(${scrollY * 0.28}px)`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-tl from-slate-900/50 to-transparent" />
            </div>
          </div>
        </div>

        {/* Hero Content - 4枚の画像がふわっと出た「後」に、文字をゆっくりふわっと表示 */}
        <div className="absolute inset-0 w-full h-full p-3 md:p-5 lg:p-6 z-10 pointer-events-none">
          <div className="w-full h-full max-w-7xl mx-auto flex items-center justify-center">
            <div className="text-center space-y-4 md:space-y-6 px-4 md:px-8 pointer-events-auto">
            {/* Accent Line */}
            <div className={`flex justify-center ${heroReady ? "animate-hero-text-reveal" : "opacity-0"}`}>
              <div className="accent-line bg-white/90" />
            </div>

            {/* Main Headline - 大きめ */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold leading-[0.95] text-white drop-shadow-2xl tracking-tighter">
              <span className={`block ${heroReady ? "animate-hero-text-reveal-delay-1" : "opacity-0"}`}>
                ARTIST
              </span>
              <span className={`block ${heroReady ? "animate-hero-text-reveal-delay-2" : "opacity-0"}`}>
                MOTION
              </span>
            </h1>

            {/* ARTIST MOTION - アーティストモーション（SEO: 日本語検索用の見出し） */}
            <h2 className={`text-base md:text-xl text-white/90 drop-shadow-lg tracking-widest font-light sr-only ${heroReady ? "animate-hero-text-reveal-delay-3" : "opacity-0"}`}>
              ~ アーティストモーション ~
            </h2>
            <p className={`text-base md:text-xl text-white/90 drop-shadow-lg tracking-widest font-light ${heroReady ? "animate-hero-text-reveal-delay-3" : "opacity-0"}`}>
              ~ アーティストモーション ~
            </p>

            {/* Subheading */}
            <p className={`text-lg md:text-2xl font-light max-w-md mx-auto text-white drop-shadow-lg ${heroReady ? "animate-hero-text-reveal-delay-4" : "opacity-0"}`}>
              心を豊かにする
            </p>

            {/* CTA Button */}
            {/*--<div className="pt-4">
              <Button
                className="btn-bold"
                onClick={() =>
                  document
                    .getElementById("services")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                EXPLORE NOW
              </Button>
            </div>*/}
            </div>
          </div>
        </div>

        {/* Scroll Indicator（脈打つリング＋矢印）- 画像・文字の表示後に表示 */}
        <button
          className={`absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-auto transition-opacity duration-700 delay-[3s] ${heroReady ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={() => {
            document.getElementById("services")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        >
          <span
            className="absolute w-12 h-12 rounded-full border-2 border-white/40 left-1/2 top-1/2 animate-scroll-pulse"
            style={{ transform: "translate(-50%, -50%)" }}
            aria-hidden
          />
          <ChevronDown className="w-8 h-8 text-white/90 group-hover:text-white transition-colors animate-bounce" />
        </button>
      </section>

      {/* 斜めストリップ: スクロール中もビューポート下端に斜めを固定 */}
      <div className="diagonal-strip" aria-hidden="true" />

      <section
        id="news"
        className="bg-slate-50 text-slate-800 py-20 md:py-28"
      >
        <div className="container max-w-5xl">
          <AnimatedSection animation="fade-up-lg" className="text-center">
            <div className="accent-line bg-slate-400 mb-6 mx-auto" />
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-8 text-slate-800 tracking-tight">
              お知らせ
            </h2>
            {newsForHome.length === 0 ? (
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
                お知らせはありません
              </p>
            ) : (
              <>
              <ul className="list-none m-0 p-0 space-y-0 border-t border-slate-200">
                {newsForHome.map((item) => (
                  <li
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedNews(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedNews(item);
                      }
                    }}
                    className="w-full text-left border-b border-slate-200 py-4 md:py-5 px-0 cursor-pointer hover:bg-slate-100/60 transition-colors rounded-none flex gap-4 items-start"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-500 mb-1">
                        {new Date(item.created_at).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm md:text-base text-slate-600 leading-relaxed line-clamp-2">
                        {item.body}
                      </p>
                    </div>
                    {item.image_url && (
                      <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
                        {newsImageLoading[item.id] && (
                          <div
                            className="absolute inset-0 grid place-items-center rounded-lg border border-slate-200 bg-slate-100"
                            aria-label="画像を読み込み中"
                          >
                            <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
                          </div>
                        )}
                        <img
                          src={item.image_url}
                          alt=""
                          loading="lazy"
                          onLoad={() => setNewsImageLoading((prev) => ({ ...prev, [item.id]: false }))}
                          onError={() => setNewsImageLoading((prev) => ({ ...prev, [item.id]: false }))}
                          className={`w-20 h-20 md:w-24 md:h-24 rounded-lg object-cover border border-slate-200 ${
                            newsImageLoading[item.id] ? "opacity-0" : "opacity-100"
                          }`}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {news.length > 3 && (
                <div className="mt-6 text-center">
                  <Link
                    href="/news"
                    className="inline-flex items-center justify-center rounded-lg bg-slate-700 text-white px-6 py-3 text-sm font-medium hover:bg-slate-800 transition-colors"
                  >
                    お知らせ一覧
                  </Link>
                </div>
              )}

              {/* お知らせモーダル（画像・本文・コメント） */}
              <Dialog
                open={!!selectedNews}
                onOpenChange={(open) => {
                  if (!open) {
                    setSelectedNews(null);
                    setNewsComments([]);
                    setCommentAuthor("");
                    setCommentBody("");
                  }
                }}
              >
                <DialogContent
                  className="max-w-2xl w-[calc(100%-2rem)] h-[min(70vh,640px)] flex flex-col overflow-hidden p-0 gap-0 bg-white text-black border-slate-200"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  {selectedNews && (
                    <>
                      <DialogHeader className="flex-shrink-0 p-6 pb-2 pr-12">
                        <p className="text-sm text-slate-500">
                          {new Date(selectedNews.created_at).toLocaleDateString("ja-JP")}
                        </p>
                        <DialogTitle className="text-xl md:text-2xl text-black text-left">
                          {selectedNews.title}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex-shrink-0 px-6">
                        {selectedNews.image_url && (
                          <div className="relative w-full rounded-xl aspect-video overflow-hidden mb-4 bg-slate-100 border border-slate-200">
                            {modalImageLoading && (
                              <div
                                className="absolute inset-0 grid place-items-center"
                                aria-label="画像を読み込み中"
                              >
                                <div className="w-10 h-10 rounded-full border-4 border-slate-300 border-t-slate-700 animate-spin" />
                              </div>
                            )}
                            <img
                              src={selectedNews.image_url}
                              alt=""
                              loading="lazy"
                              onLoad={() => setModalImageLoading(false)}
                              onError={() => setModalImageLoading(false)}
                              className={`w-full h-full object-cover ${
                                modalImageLoading ? "opacity-0" : "opacity-100"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 text-black">
                        <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                          {selectedNews.body}
                        </p>
                        {/* コメント欄 */}
                        <div className="mt-6 pt-6 border-t border-slate-200">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">コメント（{newsComments.length}件）</h4>
                          <ul className="list-none m-0 p-0 space-y-3 mb-4">
                            {newsComments.map((c) => (
                              <li key={c.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                                <p className="font-medium text-slate-800 mb-1">{c.author_name}</p>
                                <p className="text-slate-600 whitespace-pre-wrap">{c.body}</p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {new Date(c.created_at).toLocaleDateString("ja-JP", {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </li>
                            ))}
                          </ul>
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              if (commentSending || !commentAuthor.trim() || !commentBody.trim()) return;
                              setCommentSending(true);
                              try {
                                const newComment = await submitNewsComment(selectedNews.id, {
                                  author_name: commentAuthor,
                                  body: commentBody,
                                });
                                setNewsComments((prev) => [...prev, newComment]);
                                setCommentAuthor("");
                                setCommentBody("");
                                toast.success("コメントを送信しました");
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "送信に失敗しました");
                              } finally {
                                setCommentSending(false);
                              }
                            }}
                            className="space-y-3"
                          >
                            <div>
                              <Label htmlFor="comment-author" className="text-slate-700">お名前</Label>
                              <Input
                                id="comment-author"
                                value={commentAuthor}
                                onChange={(e) => setCommentAuthor(e.target.value)}
                                placeholder="ニックネーム可"
                                className="mt-1"
                                maxLength={100}
                              />
                            </div>
                            <div>
                              <Label htmlFor="comment-body" className="text-slate-700">コメント</Label>
                              <Textarea
                                id="comment-body"
                                value={commentBody}
                                onChange={(e) => setCommentBody(e.target.value)}
                                placeholder="メッセージをどうぞ"
                                className="mt-1 min-h-[80px]"
                                maxLength={2000}
                              />
                            </div>
                            <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
                              <Button
                                type="submit"
                                disabled={
                                  commentSending ||
                                  !commentAuthor.trim() ||
                                  !commentBody.trim()
                                }
                              >
                                {commentSending ? "送信中…" : "コメントを送信"}
                              </Button>
                              <p className="text-xs text-slate-500">
                                ※一度送信したコメントは削除できません。
                              </p>
                            </div>
                          </form>
                        </div>
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>
              </>
            )}
          </AnimatedSection>
        </div>
      </section>

      <section id="videos" className="bg-white text-slate-900 py-16 md:py-20">
        <div className="container max-w-6xl">
          <AnimatedSection animation="fade-up-lg" className="text-center mb-10 md:mb-14">
            <div className="accent-line bg-slate-800 mb-6 mx-auto" />
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 text-slate-800 tracking-tight">
              現場の雰囲気
            </h2>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
              レッスンや活動の「空気感」が伝わる動画をまとめています。
            </p>
          </AnimatedSection>

          {SITE_VIDEOS.length === 0 ? (
            <p className="text-center text-slate-600">動画は準備中です。</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {SITE_VIDEOS.map((v) => (
                <AnimatedSection key={v.id} animation="fade-up" className="text-left">
                  <div className="mb-2">
                    <span className="inline-flex items-center rounded-full bg-slate-900 text-white px-3 py-1 text-xs md:text-sm font-semibold shadow-sm">
                      {v.label}
                    </span>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                    <div className="relative aspect-video bg-black">
                      <video
                        className="w-full h-full object-cover"
                        controls
                        playsInline
                        preload="auto"
                        onLoadedMetadata={(e) => {
                          // poster がある場合は iOS で黒表示になりやすいので触らない
                          if (!v.poster) primeVideoFirstFrame(e.currentTarget);
                        }}
                        onSeeked={(e) => {
                          if (!v.poster) e.currentTarget.pause();
                        }}
                        poster={v.poster}
                      >
                        <source src={v.src} type="video/mp4" />
                        お使いのブラウザは動画再生に対応していません。
                      </video>
                    </div>
                  </div>
                  {v.title && (
                    <p className="mt-3 text-center text-base md:text-lg font-semibold text-slate-800">
                      {v.title}
                    </p>
                  )}
                  {v.description && (
                    <p className="mt-2 text-center text-sm md:text-base text-slate-600 leading-relaxed">
                      {v.description}
                    </p>
                  )}
                  {v.date && (
                    <p className="mt-1 text-center text-xs md:text-sm text-slate-500">
                      {v.date}
                    </p>
                  )}
                </AnimatedSection>
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        id="services"
        className="bg-white text-slate-900 py-20 md:py-28 lg:py-32"
      >
        <div className="container max-w-6xl">
          <AnimatedSection animation="fade-up-lg" className="mb-14 md:mb-20 text-center">
            <div className="accent-line bg-slate-800 mb-6 mx-auto" />
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 text-slate-800 tracking-tight">
              事業内容
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-xl mx-auto">
            ARTIST MOTION〜アーティストモーション〜は、風舞流曲技太鼓・ベースボール・器械体操・フィットネスなど、心を豊かにする身体活動を提供しています。
            </p>
          </AnimatedSection>
        </div>

        {/* 画面いっぱい4枚並び（枠なし・カードなし）。携帯は縦並び */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-0">
            {SERVICE_CARDS.map((card, index) => {
              const bgImage = SERVICE_IMAGES[index];
              return (
                <AnimatedSection
                  key={card.href}
                  animation="fade-up"
                  delay={index * 80}
                  className="group h-full min-h-0"
                >
                  <Link
                    href={card.href}
                    className="block h-full min-h-[40vh] lg:min-h-[60vh]"
                    aria-label={`${card.title} - ${card.imageAlt}の詳細を見る`}
                  >
                    <div
                      className="relative w-full h-full min-h-[40vh] lg:min-h-[60vh] overflow-hidden bg-slate-900"
                      style={{
                        backgroundImage: `url(${bgImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "50% 50%",
                      }}
                    >
                      {/* 半透明の暗いオーバーレイ（テキスト可読性のため） */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.75) 30%, rgba(15,23,42,0.5) 60%, rgba(15,23,42,0.35) 100%)",
                        }}
                      />
                      {/* 事業名は最下部。ホバーで事業名が上にふわっと移動し、その下に説明文を表示 */}
                      <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6 text-left">
                        <div className="flex flex-col justify-end transition-all duration-300 ease-out">
                          <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight drop-shadow-md">
                            {card.title}
                          </h3>
                          {SERVICES[card.slug]?.bodyText && (
                            <p className="text-xs md:text-sm text-white/80 line-clamp-2 mt-2 opacity-100 max-h-[5rem] overflow-hidden transition-all duration-300 ease-out lg:opacity-0 lg:max-h-0 lg:group-hover:opacity-100 lg:group-hover:max-h-[5rem]">
                              {SERVICES[card.slug].bodyText}
                            </p>
                          )}
                          <span className="text-sm text-white/90 font-medium inline-flex items-center gap-1 mt-1 opacity-100 max-h-[2rem] overflow-hidden transition-all duration-300 ease-out lg:opacity-0 lg:max-h-0 lg:group-hover:opacity-100 lg:group-hover:max-h-[2rem]">
                            開催概要
                            <span aria-hidden>&gt;</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </AnimatedSection>
              );
            })}
        </div>

        <div className="container max-w-6xl">
          <div className="mt-16 md:mt-20 grid grid-cols-1 lg:grid-cols-[1.1fr,1.4fr] gap-10 lg:gap-14 items-start">
            {/* 左：代表紹介・事業理念 */}
            <AnimatedSection animation="fade-up-lg" className="max-w-3xl">
              <div className="prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed space-y-4">
                <p className="text-lg md:text-xl">
                  <strong>代表　谷口真一</strong>
                  <br />
                  風舞流曲技太鼓　二代目師範　風谷鼓道
                </p>
                <p>
                  お子様から大人の方と関わらせていただき、「心を豊かにする」を事業理念に2020年に開業しました。
                </p>
                <p>
                  現在、丹波市、三田市、神戸市北区を中心に活動しております。
                  <br />
                  詳しい活動内容はインスタグラム、YouTubeまで遊びに来てください！
                </p>
              </div>
            </AnimatedSection>

            {/* 右：Instagram ＋ YouTube */}
            <div className="space-y-8">
              {INSTAGRAM_LATEST_POST_SHORTCODES.length > 0 && (
                <div className="w-full">
                  <p className="text-sm font-semibold text-slate-600 mb-3">
                    インスタグラム【公式】の投稿
                  </p>
                  {canEmbedInstagram ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                      {INSTAGRAM_LATEST_POST_SHORTCODES.map((shortcode) => (
                        <div key={shortcode}>
                        <div className="relative aspect-square min-h-[260px] sm:min-h-[320px] md:min-h-[360px] lg:min-h-[400px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-sm">
                            {instagramEmbedLoading[shortcode] && (
                              <div
                                className="absolute inset-0 grid place-items-center bg-slate-100"
                                aria-label="Instagramを読み込み中"
                                style={{ position: "absolute" }}
                              >
                                <div className="w-10 h-10 rounded-full border-4 border-slate-300 border-t-slate-700 animate-spin" />
                              </div>
                            )}
                            <iframe
                              src={`https://www.instagram.com/p/${shortcode}/embed/`}
                              title={`Instagram post ${shortcode}`}
                              className="w-full h-full border-0"
                              loading="lazy"
                              allow="clipboard-write; encrypted-media; picture-in-picture; web-share"
                              referrerPolicy="strict-origin-when-cross-origin"
                              onLoad={() => setInstagramEmbedLoading((p) => ({ ...p, [shortcode]: false }))}
                              onError={() => setInstagramEmbedLoading((p) => ({ ...p, [shortcode]: false }))}
                            />
                          </div>
                          {instagramEmbedTimedOut[shortcode] && (
                            <p className="mt-2 text-xs text-slate-500">
                              埋め込みが表示されない場合があります。下のボタンからご覧ください。
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-700">
                      <p className="font-semibold text-slate-800 mb-2">この環境では埋め込みが表示されないことがあります</p>
                      <p className="text-sm leading-relaxed text-slate-600">
                        `http://localhost`（非HTTPS）やブラウザのトラッキング防止設定により、Instagramの埋め込みがブロックされる場合があります。
                        下のボタンからご覧ください。
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <a
                      href={INSTAGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-orange-100 hover:text-orange-500 transition-colors"
                    >
                      <Instagram className="w-5 h-5 text-orange-500" />
                      インスタグラム【公式】を見る
                    </a>
                    <a
                      href={INSTAGRAM_REVERSE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-orange-100 hover:text-orange-500 transition-colors"
                    >
                      <Instagram className="w-5 h-5 text-orange-500" />
                      インスタグラム【現場の裏側】を見る
                    </a>
                  </div>
                </div>
              )}

              {YOUTUBE_LATEST_VIDEO_IDS.length > 0 && (
                <div className="w-full">
                  <p className="text-sm font-semibold text-slate-600 mb-3">
                    風舞流曲技太鼓のYouTubeの動画
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                    {YOUTUBE_LATEST_VIDEO_IDS.map((videoId) => (
                      <div key={videoId}>
                        <div className="relative aspect-video min-h-[200px] sm:min-h-[240px] md:min-h-[260px] lg:min-h-[300px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-sm">
                          {youtubeEmbedLoading[videoId] && (
                            <div
                              className="absolute inset-0 grid place-items-center bg-slate-100"
                              aria-label="YouTubeを読み込み中"
                              style={{ position: "absolute" }}
                            >
                              <div className="w-10 h-10 rounded-full border-4 border-slate-300 border-t-slate-700 animate-spin" />
                            </div>
                          )}
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                            title="YouTube video"
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                            onLoad={() => setYoutubeEmbedLoading((p) => ({ ...p, [videoId]: false }))}
                            onError={() => setYoutubeEmbedLoading((p) => ({ ...p, [videoId]: false }))}
                          />
                        </div>
                        {youtubeEmbedTimedOut[videoId] && (
                          <p className="mt-2 text-xs text-slate-500">
                            埋め込みが表示されない場合があります。ボタンからYouTubeでご覧ください。
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <a
                      href={YOUTUBE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-[#FECACA] transition-colors"
                    >
                      <Youtube className="w-5 h-5 text-[#FF0000]" />
                      風舞流曲技太鼓のYouTubeを見る
                    </a>
                  </div>
                </div>
              )}

              {/* インスタ・YouTubeの投稿がない場合もボタンだけ表示 */}
              {(INSTAGRAM_LATEST_POST_SHORTCODES.length === 0 ||
                YOUTUBE_LATEST_VIDEO_IDS.length === 0) && (
                <div className="mt-2 flex flex-col sm:flex-row flex-wrap gap-3">
                  {INSTAGRAM_LATEST_POST_SHORTCODES.length === 0 && (
                    <>
                      <a
                        href={INSTAGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-orange-100 hover:text-orange-500 transition-colors"
                      >
                        <Instagram className="w-5 h-5 text-orange-500" />
                        インスタグラム【公式】を見る
                      </a>
                      <a
                        href={INSTAGRAM_REVERSE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-orange-100 hover:text-orange-500 transition-colors"
                      >
                        <Instagram className="w-5 h-5 text-orange-500" />
                        インスタグラム【現場の裏側】を見る
                      </a>
                    </>
                  )}
                  {YOUTUBE_LATEST_VIDEO_IDS.length === 0 && (
                    <a
                      href={YOUTUBE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-[#FECACA] transition-colors"
                    >
                      <Youtube className="w-5 h-5 text-[#FF0000]" />
                      風舞流曲技太鼓のYouTubeを見る
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
          <AnimatedSection animation="fade-up-lg" className="max-w-3xl mx-auto mt-16">
            <div className="flex justify-center">
                <AnimatedSection animation="fade-up-lg" delay={450}>
                  <Link
                    href="/column"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-500 text-white font-semibold shadow-lg hover:bg-orange-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-300 focus-visible:ring-offset-slate-50"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>子育てコラムを見る</span>
                  </Link>
                </AnimatedSection>
              </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== お客様の声 ===== */}
      <section
        id="testimonials"
        className="bg-slate-100 text-slate-800 py-20 md:py-28"
      >
        <div className="container max-w-5xl">
          <AnimatedSection animation="fade-up-lg" className="text-center mb-12 md:mb-16">
            <div className="accent-line bg-slate-500 mb-6 mx-auto" />
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 text-slate-800 tracking-tight">
              お客様の声
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-xl mx-auto">
              保護者・門下生・会員の皆様からいただいた声の一部をご紹介します。
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {getTestimonialsForHome(4).map((item, index) => (
              <AnimatedSection
                key={item.id}
                animation="fade-up"
                delay={index * 80}
                className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-6 shadow-sm border border-slate-200/80"
              >
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  {item.categoryLabel}
                </p>
                <p className="text-slate-700 leading-relaxed">
                  「{item.body}」
                </p>
              </AnimatedSection>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/testimonials"
              className="inline-flex items-center justify-center rounded-lg bg-slate-700 text-white px-6 py-3 text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              もっと見る
            </Link>
          </div>
        </div>
      </section>

      {/* ===== お問い合わせフォーム ===== */}
      <section
        id="contact"
        className="relative bg-slate-800 text-white py-24 md:py-32 overflow-hidden"
      >
        {/* 背景の微細なグラデーション */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 60%)",
          }}
        />
        {/* このセクション直前（白背景エリア）に子育てコラムボタンを配置 */}
        <div className="container relative max-w-2xl z-10">
          <AnimatedSection animation="scale" delay={100} className="space-y-10">
            <div className="text-center">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                お問い合わせ
              </h2>
              <p className="text-lg md:text-xl text-slate-300 max-w-xl mx-auto mt-4">
                下記フォームよりお気軽にどうぞ。
              </p>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-6 text-left">
              <div className="space-y-2">
                <Label htmlFor="contact-name" className="text-white">
                  お名前 <span className="text-red-300">*</span>
                </Label>
                <Input
                  id="contact-name"
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="山田 太郎"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email" className="text-white">
                  メールアドレス <span className="text-red-300">*</span>
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-message" className="text-white">
                  お問い合わせ内容 <span className="text-red-300">*</span>
                </Label>
                <Textarea
                  id="contact-message"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="ご質問・ご要望などをご記入ください。"
                  rows={5}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 resize-y min-h-[120px]"
                  required
                />
              </div>
              <div className="pt-2 text-center">
                <Button
                  type="submit"
                  disabled={contactSending}
                  className="btn-bold bg-white text-slate-800 hover:bg-slate-100 px-10 py-5 text-lg rounded-lg disabled:opacity-60"
                >
                  {contactSending ? "送信中..." : "送信する"}
                </Button>
              </div>
            </form>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-slate-900 text-slate-400 py-16 md:py-20">
        <div className="container max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 mb-14">
            <div className="md:col-span-4">
              <h3 className="flex items-baseline gap-3 flex-wrap mb-3">
                <span className="text-white font-bold text-xl tracking-tight">
                  ARTISTMOTION
                </span>
                <span className="text-white text-sm font-medium">
                  アーティストモーション
                </span>
              </h3>
              <p className="text-slate-400 text-base leading-relaxed">
                心を豊かにする
              </p>
            </div>
            <div className="md:col-span-4">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-5 text-slate-300">
                事業内容
              </h4>
              <ul className="space-y-3">
                {["風舞流曲技太鼓", "ベースボールクラブ", "器械体操教室", "フィットネスクラス"].map(
                  (label) => (
                    <li key={label}>
                      <a
                        href="#services"
                        className="hover:text-white transition-colors duration-200"
                      >
                        {label}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-5 text-slate-300">
                コンテンツ
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/news"
                    className="hover:text-white transition-colors duration-200"
                  >
                    お知らせ
                  </a>
                </li>
                <li>
                  <a
                    href="/column"
                    className="hover:text-white transition-colors duration-200"
                  >
                    子育てコラム
                  </a>
                </li>
                <li>
                  <a
                    href="/testimonials"
                    className="hover:text-white transition-colors duration-200"
                  >
                    お客様の声
                  </a>
                </li>
                <li>
                  <a
                    href="/faq"
                    className="hover:text-white transition-colors duration-200"
                  >
                    よくある質問
                  </a>
                </li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-5 text-slate-300">
                お問い合わせ
              </h4>
              <p className="text-sm">Email: fuburyukodokai@gmail.com</p>
              <p className="text-sm mt-1">Phone: 090-5464-6904</p>
              <div className="flex items-center gap-4 mt-4">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-orange-500 hover:bg-orange-100 transition-colors rounded-full"
                  aria-label="Instagram"
                >
                  <Instagram className="w-8 h-8 text-orange-500" />
                </a>
                <a
                  href={LINE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-[#06C755] hover:bg-[#BBF7D0] transition-colors rounded-full"
                  aria-label="LINE"
                >
                  <MessageCircle className="w-8 h-8 text-[#06C755]" />
                </a>
                <a
                  href={YOUTUBE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-[#FF0000] hover:bg-[#FECACA] transition-colors rounded-full"
                  aria-label="YouTube"
                >
                  <Youtube className="w-8 h-8 text-[#FF0000]" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-sm text-slate-500">
            <p>&copy; 2026 ARTISTMOTION. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
