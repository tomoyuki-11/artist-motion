# リリース準備ガイド

本番リリース前に確認・実施する項目です。

## 1. リリース前チェックリスト

- [ ] **型チェック**: `pnpm run check` が通ること
- [ ] **ビルド**: `pnpm run build` が成功すること
- [ ] **本番用環境変数**: 下記「本番環境変数」をすべて設定済みであること
- [ ] **シークレット**: `.env` をリポジトリにコミットしていないこと（`.gitignore` 済み）
- [ ] **API**: api の `JWT_SECRET` と `ADMIN_PASSWORD` を本番用に変更済みであること
- [ ] **メール**: お問い合わせフォーム用 Gmail アプリパスワードが有効であること
- [ ] **地図**: Google Maps / Forge の API キーが本番ドメインで有効であること（使用している場合）

---

## 2. ビルド手順

### フロント＋Node サーバ（メインサイト）

```bash
pnpm install
pnpm run build
```

- 成果物: `dist/public/`（静的ファイル）、`dist/index.js`（Express サーバ）
- 本番起動: `pnpm run start`（`NODE_ENV=production node dist/index.js`）
- サーバは `PORT` 未設定時は 3000 で待ち受けます。本番では `PORT=80` やリバースプロキシで 3000 を公開してください。

### サイト用 API（Rust・任意）

お問い合わせ・お知らせ・管理画面を使う場合にビルド・デプロイします。

```bash
cd api
cargo build --release
```

- 成果物: `api/target/release/` に実行ファイル（プロジェクト名と同名）
- 起動: `./target/release/api` または `cargo run --release`
- デフォルトでポート 3002。本番では `PORT` と `API_BASE_URL` を設定してください。

---

## 3. 本番環境変数

### ルート（Node サーバ・Vite ビルド時）

| 変数 | 必須 | 説明 |
|------|------|------|
| `CONTACT_EMAIL_USER` | ✅ | お問い合わせ送信元 Gmail アドレス |
| `CONTACT_EMAIL_APP_PASSWORD` | ✅ | 上記の Gmail アプリパスワード |
| `VITE_SITE_URL` | 推奨 | 本番の絶対URL（例: `https://artist-motion.com`）。OGP・canonical・sitemap で使用 |
| `VITE_ADMIN_API_URL` | お知らせ・問い合わせ・管理画面利用時 | API の URL（例: `https://api.artistmotion.jp`） |
| `VITE_OAUTH_PORTAL_URL` | 管理ログインで OAuth 利用時 | OAuth ポータル URL |
| `VITE_APP_ID` | 同上 | アプリID |
| `VITE_FRONTEND_FORGE_API_KEY` | 地図利用時 | Forge 地図用 API キー |
| `VITE_FRONTEND_FORGE_API_URL` | 地図利用時 | Forge 地図用 API URL |
| `PORT` | 任意 | Node サーバのポート（未設定時 3000） |

**注意**: `VITE_*` はビルド時にクライアントに埋め込まれます。本番用の値で `pnpm run build` を実行してください。

### api（Rust）

| 変数 | 必須 | 説明 |
|------|------|------|
| `ADMIN_PASSWORD` | ✅ | 管理画面ログイン用パスワード（本番では強固なものに変更） |
| `JWT_SECRET` | ✅ | JWT 署名用（本番では長いランダム文字列に変更） |
| `DATABASE_URL` | 任意 | SQLite 接続文字列（既定: `sqlite:./data.db`） |
| `UPLOAD_DIR` | 任意 | アップロード保存先（既定: `uploads`） |
| `API_BASE_URL` | 推奨 | お知らせ画像などの絶対URLベース（例: `https://api.artistmotion.jp`） |
| `PORT` | 任意 | 待ち受けポート（既定: 3002） |

---

## 4. 本番での起動例

### パターン A: 同一サーバで Node のみ（管理画面を使わない場合）

```bash
export NODE_ENV=production
export PORT=3000
# .env に CONTACT_EMAIL_* と VITE_SITE_URL を設定済みとして
pnpm run start
```

### パターン B: Node（サイト）＋ api（別プロセス or 別ホスト）

1. **メインサイト**
   ```bash
   export NODE_ENV=production
   export PORT=3000
   # .env に VITE_ADMIN_API_URL=https://api.artistmotion.jp など
   pnpm run start
   ```

2. **API（Rust）**
   ```bash
   cd api
   export ADMIN_PASSWORD="強固なパスワード"
   export JWT_SECRET="長いランダム文字列"
   export API_BASE_URL=https://api.artistmotion.jp
   ./target/release/api
   ```

リバースプロキシ（nginx 等）で `/api` を Node に、API 用のパスや別サブドメインを Rust API に振り分ける構成を推奨します。

---

## 5. その他

- **バージョン**: `package.json` の `version` をリリース前に更新してください。
- **sitemap / robots**: `client/public/sitemap.xml` と `client/public/robots.txt` はビルドに含まれます。本番ドメインに合わせて内容を確認してください。
- **CORS**: api は本番オリジンで CORS を許可するよう必要に応じて設定してください（`api/src/main.rs` の CorsLayer）。
