import { useState, useEffect } from "react";
import { Menu, X, Instagram, MessageCircle, Youtube } from "lucide-react";
import { Link, useLocation } from "wouter";

/**
 * Navigation Bar Component
 * Sticky header with smooth scrolling navigation
 * ナイキ風: 下スクロールで隠す・上スクロールで表示
 */
export function Navbar() {
  const [location, setLocation] = useLocation();
  const isHome = location === "/";
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y < 80) {
        setVisible(true);
      } else if (y > lastScrollY) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setLastScrollY(y);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // ボタンを押したら該当セクションへ移動し、URLのハッシュも更新（/#services のまま別セクションへ飛ばないようにする）
  const scrollToSection = (id: string) => {
    window.history.pushState(null, "", `#${id}`);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="container flex items-center justify-between py-4">
        {/* Logo: 他ページなら / へ遷移、トップならハッシュを消して先頭へスクロール */}
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => {
            if (location !== "/") {
              setLocation("/");
            } else {
              window.history.pushState(null, "", "/");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
            setIsOpen(false);
          }}
        >
          <img
            src="/images/ロゴ背景なし.png"
            alt="ARTIST MOTION Logo"
            className="w-12 h-12 object-contain"
          />
          <span className="text-xl font-bold text-slate-800">
            ARTISTMOTION
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden xl:flex items-center space-x-8">
          {isHome ? (
            <button
              onClick={() => scrollToSection("news")}
              className="text-slate-700 hover:text-slate-900 transition font-semibold"
            >
              お知らせ
            </button>
          ) : (
            <Link
              href="/#news"
              className="text-slate-700 hover:text-slate-900 transition font-semibold"
            >
              お知らせ
            </Link>
          )}
          {isHome ? (
            <button
              onClick={() => scrollToSection("services")}
              className="text-slate-700 hover:text-slate-900 transition font-semibold"
            >
              事業内容
            </button>
          ) : (
            <Link
              href="/#services"
              className="text-slate-700 hover:text-slate-900 transition font-semibold"
            >
              事業内容
            </Link>
          )}
          <Link
            href="/column"
            className="text-slate-700 hover:text-slate-900 transition font-semibold"
          >
            子育てコラム
          </Link>
          {isHome ? (
            <button
              onClick={() => scrollToSection("testimonials")}
              className="text-slate-700 hover:text-slate-900 transition font-semibold"
            >
              お客様の声
            </button>
          ) : (
            <Link
              href="/testimonials"
              className="text-slate-700 hover:text-slate-900 transition font-semibold"
            >
              お客様の声
            </Link>
          )}
          <Link
            href="/faq"
            className="text-slate-700 hover:text-slate-900 transition font-semibold"
          >
            よくある質問
          </Link>

          {/* Instagram / LINE */}
          <a
            href="https://www.instagram.com/artist.motion_fuburyu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-orange-500 hover:bg-orange-100 transition p-1.5 rounded-full"
            aria-label="Instagram"
          >
            <Instagram className="w-6 h-6 text-orange-500" />
          </a>
          <a
            href="https://line.me/R/ti/p/@548udakm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-[#06C755] hover:bg-[#BBF7D0] transition p-1.5 rounded-full"
            aria-label="LINE"
          >
            <MessageCircle className="w-6 h-6 text-[#06C755]" />
          </a>
          <a
            href="https://www.youtube.com/@%E9%A2%A8%E8%88%9E%E6%B5%81%E6%9B%B2%E6%8A%80%E5%A4%AA%E9%BC%93%E8%B0%B7%E5%8F%A3%E7%9C%9F"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-[#FF0000] hover:bg-[#FECACA] transition p-1.5 rounded-full"
            aria-label="YouTube"
          >
            <Youtube className="w-6 h-6 text-[#FF0000]" />
          </a>

          {/* お問い合わせ（CTA） */}
          {isHome ? (
            <button
              onClick={() => scrollToSection("contact")}
              className="px-6 py-2 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 transition"
            >
              お問い合わせ
            </button>
          ) : (
            <Link
              href="/#contact"
              className="px-6 py-2 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 transition inline-block"
            >
              お問い合わせ
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="xl:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-slate-100 transition text-slate-800"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="xl:hidden bg-white border-t border-slate-200">
          <div className="container py-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 space-y-2">
              {isHome ? (
                <button
                  onClick={() => scrollToSection("news")}
                  className="block w-full text-left rounded-xl px-4 py-3 text-slate-800 hover:bg-slate-50 transition font-semibold"
                >
                  お知らせ
                </button>
              ) : (
                <Link
                  href="/#news"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-left rounded-xl px-4 py-3 text-slate-800 hover:bg-slate-50 transition font-semibold"
                >
                  お知らせ
                </Link>
              )}
              {isHome ? (
                <button
                  onClick={() => scrollToSection("services")}
                  className="block w-full text-left rounded-xl px-4 py-3 text-slate-800 hover:bg-slate-50 transition font-semibold"
                >
                  事業内容
                </button>
              ) : (
                <Link
                  href="/#services"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-left rounded-xl px-4 py-3 text-slate-800 hover:bg-slate-50 transition font-semibold"
                >
                  事業内容
                </Link>
              )}
              <Link
                href="/column"
                onClick={() => setIsOpen(false)}
                className="block w-full text-left rounded-xl px-4 py-3 text-slate-800 hover:bg-slate-50 transition font-semibold"
              >
                子育てコラム
              </Link>
              {isHome ? (
                <button
                  onClick={() => scrollToSection("testimonials")}
                  className="block w-full text-left rounded-xl px-4 py-3 text-slate-800 hover:bg-slate-50 transition font-semibold"
                >
                  お客様の声
                </button>
              ) : (
                <Link
                  href="/testimonials"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-left rounded-xl px-4 py-3 text-slate-800 hover:bg-slate-50 transition font-semibold"
                >
                  お客様の声
                </Link>
              )}
              <Link
                href="/faq"
                onClick={() => setIsOpen(false)}
                className="block w-full text-left rounded-xl px-4 py-3 text-slate-800 hover:bg-slate-50 transition font-semibold"
              >
                よくある質問
              </Link>

              <div className="flex gap-3 py-2">
                <a
                  href="https://www.instagram.com/artist.motion_fuburyu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-slate-100 text-slate-700 hover:bg-orange-100 transition gap-1"
                  aria-label="Instagram"
                >
                  <Instagram className="w-7 h-7 text-orange-500" />
                  <span className="text-[10px] font-medium text-slate-600">
                    Instagram
                  </span>
                </a>
                <a
                  href="https://line.me/R/ti/p/@548udakm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-slate-100 text-slate-700 hover:bg-[#BBF7D0] hover:text-white transition gap-1"
                  aria-label="LINE"
                >
                  <MessageCircle className="w-7 h-7 text-[#06C755]" />
                  <span className="text-[10px] font-medium text-slate-600">
                    LINE
                  </span>
                </a>
                <a
                  href="https://www.youtube.com/@%E9%A2%A8%E8%88%9E%E6%B5%81%E6%9B%B2%E6%8A%80%E5%A4%AA%E9%BC%93%E8%B0%B7%E5%8F%A3%E7%9C%9F"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-slate-100 text-slate-700 hover:bg-[#FECACA] hover:text-white transition gap-1"
                  aria-label="YouTube"
                >
                  <Youtube className="w-7 h-7 text-[#FF0000]" />
                  <span className="text-[10px] font-medium text-slate-600">
                    YouTube
                  </span>
                </a>
              </div>

              {isHome ? (
                <button
                  onClick={() => scrollToSection("contact")}
                  className="w-full rounded-xl bg-slate-800 px-4 py-3 font-bold text-white hover:bg-slate-700 transition"
                >
                  お問い合わせ
                </button>
              ) : (
                <Link
                  href="/#contact"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center rounded-xl bg-slate-800 px-4 py-3 font-bold text-white hover:bg-slate-700 transition"
                >
                  お問い合わせ
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
