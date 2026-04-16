-- お知らせへの訪問者コメント（投稿者名・本文・日時）
CREATE TABLE IF NOT EXISTS news_comments (
  id TEXT PRIMARY KEY,
  news_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_news_comments_news_id ON news_comments(news_id);
