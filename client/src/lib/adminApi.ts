const getBase = () =>
  (import.meta.env.VITE_ADMIN_API_URL as string) || "http://localhost:3002";

/** レスポンスが空や非JSONでも res.json() で落ちないようにする */
async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export type NewsItem = {
  id: string;
  title: string;
  image_url: string | null;
  body: string;
  created_at: string;
};

export type NewsCommentItem = {
  id: string;
  news_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

export async function sendContact(form: {
  name: string;
  email: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${getBase()}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  const data = await parseJsonSafe<{ ok: boolean; error?: string }>(res);
  if (!res.ok) return { ok: false, error: data?.error ?? "送信に失敗しました。" };
  return data ?? { ok: false, error: "送信に失敗しました。" };
}

export async function fetchNews(): Promise<NewsItem[]> {
  const res = await fetch(`${getBase()}/api/news`);
  if (!res.ok) throw new Error("Failed to fetch news");
  const data = await parseJsonSafe<NewsItem[]>(res);
  return data ?? [];
}

export async function fetchNewsComments(newsId: string): Promise<NewsCommentItem[]> {
  const res = await fetch(`${getBase()}/api/news-comments/${encodeURIComponent(newsId)}`);
  if (!res.ok) throw new Error("Failed to fetch comments");
  const data = await parseJsonSafe<NewsCommentItem[]>(res);
  return data ?? [];
}

export async function submitNewsComment(
  newsId: string,
  form: { author_name: string; body: string }
): Promise<NewsCommentItem> {
  const url = `${getBase()}/api/news-comments/${encodeURIComponent(newsId)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      author_name: form.author_name.trim(),
      body: form.body.trim(),
    }),
  });
  const data = await parseJsonSafe<NewsCommentItem | { error?: string }>(res);
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "error" in data && typeof (data as { error?: string }).error === "string"
        ? (data as { error: string }).error
        : `コメントの送信に失敗しました。（HTTP ${res.status}）`;
    throw new Error(msg);
  }
  if (!data || typeof data !== "object" || !("id" in data)) {
    throw new Error(`コメントの送信に失敗しました。（HTTP ${res.status}）`);
  }
  return data as NewsCommentItem;
}

export async function fetchVisits(): Promise<{ count: number }> {
  const res = await fetch(`${getBase()}/api/visits`);
  if (!res.ok) throw new Error("Failed to fetch visits");
  const data = await parseJsonSafe<{ count: number }>(res);
  return data ?? { count: 0 };
}

export async function incrementVisits(): Promise<{ count: number }> {
  const res = await fetch(`${getBase()}/api/visits`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to increment visits");
  const data = await parseJsonSafe<{ count: number }>(res);
  return data ?? { count: 0 };
}

export async function login(password: string): Promise<{ token: string }> {
  const res = await fetch(`${getBase()}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const data = await parseJsonSafe<{ token: string }>(res);
  if (!res.ok) throw new Error("ログインに失敗しました");
  if (!data?.token) throw new Error("Login failed");
  return data;
}

export function getStoredToken(): string | null {
  return localStorage.getItem("admin_token");
}

export function setStoredToken(token: string): void {
  localStorage.setItem("admin_token", token);
}

export function clearStoredToken(): void {
  localStorage.removeItem("admin_token");
}

export async function createNews(form: {
  title: string;
  body: string;
  image?: File;
}): Promise<NewsItem> {
  const token = getStoredToken();
  if (!token) throw new Error("Not logged in");

  const body = new FormData();
  body.append("title", form.title);
  body.append("body", form.body);
  if (form.image) body.append("image", form.image);

  const res = await fetch(`${getBase()}/api/news`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const data = await parseJsonSafe<NewsItem>(res);
  if (!res.ok) throw new Error("Failed to create news");
  if (!data) throw new Error("Failed to create news");
  return data;
}

export async function updateNews(
  id: string,
  form: { title: string; body: string; image?: File }
): Promise<NewsItem> {
  const token = getStoredToken();
  if (!token) throw new Error("Not logged in");

  const body = new FormData();
  body.append("title", form.title);
  body.append("body", form.body);
  if (form.image) body.append("image", form.image);

  const res = await fetch(`${getBase()}/api/news/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const data = await parseJsonSafe<NewsItem>(res);
  if (!res.ok) throw new Error("Failed to update news");
  if (!data) throw new Error("Failed to update news");
  return data;
}

export async function deleteNews(id: string): Promise<void> {
  const token = getStoredToken();
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${getBase()}/api/news/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(text || "Failed to delete news");
  }
}
