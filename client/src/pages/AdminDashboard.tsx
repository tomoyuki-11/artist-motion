import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  clearStoredToken,
  createNews,
  deleteNews,
  fetchNews,
  fetchVisits,
  getStoredToken,
  updateNews,
  type NewsItem,
} from "@/lib/adminApi";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [visits, setVisits] = useState<number | null>(null);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredToken()) {
      setLocation("/admin/login");
      return;
    }
    Promise.all([fetchVisits(), fetchNews()])
      .then(([v, n]) => {
        setVisits(v.count);
        setNewsList(n);
      })
      .catch(() => toast.error("データの取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [setLocation]);

  const handleLogout = () => {
    clearStoredToken();
    setLocation("/admin/login");
    toast.success("ログアウトしました");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || submitting) return;
    setSubmitting(true);
    try {
      const created = await createNews({
        title: title.trim(),
        body: body.trim(),
        image: image || undefined,
      });
      setNewsList((prev) => [created, ...prev]);
      setTitle("");
      setBody("");
      setImage(null);
      toast.success("お知らせを投稿しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item: NewsItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditBody(item.body);
    setEditImage(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditBody("");
    setEditImage(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editTitle.trim() || !editBody.trim() || submittingEdit) return;
    setSubmittingEdit(true);
    try {
      const updated = await updateNews(editingId, {
        title: editTitle.trim(),
        body: editBody.trim(),
        image: editImage || undefined,
      });
      setNewsList((prev) =>
        prev.map((n) => (n.id === editingId ? updated : n))
      );
      cancelEdit();
      toast.success("お知らせを更新しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("このお知らせを削除しますか？")) return;
    setDeletingId(id);
    try {
      await deleteNews(id);
      setNewsList((prev) => prev.filter((n) => n.id !== id));
      toast.success("削除しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">読み込み中…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">管理画面</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleLogout}>
            ログアウト
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-10">
        <section>
          <h2 className="text-lg font-semibold text-slate-200 mb-2">
            HP 訪問人数
          </h2>
          <p className="text-4xl font-bold text-white">
            {visits != null ? visits.toLocaleString() : "—"}
            <span className="text-lg font-normal text-slate-400 ml-2">人</span>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">
            お知らせを投稿
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="タイトル"
                className="bg-slate-800 border-slate-600 text-white"
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">本文</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="本文"
                className="bg-slate-800 border-slate-600 text-white min-h-[120px]"
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">画像（任意）</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                className="bg-slate-800 border-slate-600 text-white"
                disabled={submitting}
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "投稿中…" : "投稿する"}
            </Button>
          </form>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">
            投稿済みお知らせ（{newsList.length}件）
          </h2>
          <ul className="space-y-4">
            {newsList.length === 0 ? (
              <li className="text-slate-500">まだ投稿がありません</li>
            ) : (
              newsList.map((n) => (
                <li
                  key={n.id}
                  className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                >
                  {editingId === n.id ? (
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>タイトル</Label>
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="タイトル"
                          className="bg-slate-700 border-slate-600 text-white"
                          required
                          disabled={submittingEdit}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>本文</Label>
                        <Textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          placeholder="本文"
                          className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                          required
                          disabled={submittingEdit}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>画像（差し替え時のみ選択）</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setEditImage(e.target.files?.[0] ?? null)
                          }
                          className="bg-slate-700 border-slate-600 text-white"
                          disabled={submittingEdit}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={submittingEdit}
                          size="sm"
                        >
                          {submittingEdit ? "更新中…" : "更新"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={cancelEdit}
                          disabled={submittingEdit}
                        >
                          キャンセル
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white">{n.title}</p>
                          <p className="text-sm text-slate-400 mt-1">
                            {n.created_at}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(n)}
                          >
                            編集
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(n.id)}
                            disabled={deletingId === n.id}
                          >
                            {deletingId === n.id ? "削除中…" : "削除"}
                          </Button>
                        </div>
                      </div>
                      {n.image_url && (
                        <img
                          src={n.image_url}
                          alt=""
                          className="mt-2 rounded max-h-40 object-cover"
                        />
                      )}
                      <p className="text-slate-300 mt-2 whitespace-pre-wrap text-sm">
                        {n.body}
                      </p>
                    </>
                  )}
                </li>
              ))
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}
