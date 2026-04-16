-- News: title, image (path), body
CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  image_path TEXT,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Single row for site visit count
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  count INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO visits (id, count) VALUES (1, 0);
