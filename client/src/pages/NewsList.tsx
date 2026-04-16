import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchNews, fetchNewsComments, submitNewsComment } from "@/lib/adminApi";
import type { NewsItem, NewsCommentItem } from "@/lib/adminApi";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { toast } from "sonner";

export default function NewsList() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [newsComments, setNewsComments] = useState<NewsCommentItem[]>([]);
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [newsImageLoading, setNewsImageLoading] = useState<Record<string, boolean>>({});
  const [modalImageLoading, setModalImageLoading] = useState(false);

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

  // 一覧の「お知らせ」画像: 読み込み中スピナー表示用
  useEffect(() => {
    setNewsImageLoading((prev) => {
      const next = { ...prev };
      for (const item of news) {
        if (!item.image_url) continue;
        const key = String(item.id);
        if (next[key] === undefined) next[key] = true;
      }
      return next;
    });
  }, [news]);

  // モーダル画像: 開くたびに読み込み状態をリセット
  useEffect(() => {
    if (!selectedNews?.image_url) {
      setModalImageLoading(false);
      return;
    }
    setModalImageLoading(true);
  }, [selectedNews?.image_url]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Helmet>
        <title>お知らせ一覧 | ARTIST MOTION</title>
      </Helmet>
      <Navbar />

      <section className="py-16 md:py-24">
        <div className="container max-w-5xl">
          <div className="mb-8">
            <div className="accent-line bg-slate-400 mb-4 w-16" />
            <h1 className="text-2xl md:text-4xl font-bold text-slate-800 tracking-tight">
              お知らせ一覧
            </h1>
          </div>

          {news.length === 0 ? (
            <p className="text-lg text-slate-600 leading-relaxed">
              お知らせはありません
            </p>
          ) : (
            <ul className="list-none m-0 p-0 space-y-0 border-t border-slate-200">
              {news.map((item) => (
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
                    <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-1">
                      {item.title}
                    </h2>
                    <p className="text-sm md:text-base text-slate-600 leading-relaxed line-clamp-2">
                      {item.body}
                    </p>
                  </div>
                  {item.image_url && (
                    <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
                      {newsImageLoading[String(item.id)] && (
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
                        onLoad={() =>
                          setNewsImageLoading((prev) => ({ ...prev, [String(item.id)]: false }))
                        }
                        onError={() =>
                          setNewsImageLoading((prev) => ({ ...prev, [String(item.id)]: false }))
                        }
                        className={`w-20 h-20 md:w-24 md:h-24 rounded-lg object-cover border border-slate-200 ${
                          newsImageLoading[String(item.id)] ? "opacity-0" : "opacity-100"
                        }`}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8">
            <Link
              href="/#news"
              className="inline-flex items-center text-slate-600 hover:text-slate-800 font-medium text-sm"
            >
              ← トップページのお知らせへ
            </Link>
          </div>
        </div>
      </section>

      {/* お知らせモーダル（コメント付き） */}
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
    </div>
  );
}
