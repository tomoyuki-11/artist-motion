# サイト用 API（Rust）

**お問い合わせフォーム送信**、お知らせの投稿・取得、HP 訪問人数の計測、管理画面認証を扱う API です。

## 必要な環境

- Rust（未導入の場合は [rustup](https://rustup.rs/) で `rustup default stable` を実行）

## 開発時の起動

```bash
# プロジェクトルートから
npm run dev:api

# または api ディレクトリで
cargo run
```

デフォルトで **http://localhost:3002** で待ち受けます。

## 環境変数

**`api/.env` に置けば OK** です。API は `cargo run` 時にカレントディレクトリ（= `api/`）の `.env` を読みます。ルートの `.env` は読みません。

| 変数 | 必須？ | 説明 | 既定値 |
|------|--------|------|--------|
| `DATABASE_URL` | 任意 | SQLite の接続文字列 | 未設定時は `data/data.db` |
| `ADMIN_PASSWORD` | 任意 | 管理画面ログイン用パスワード（本番では必ず変更） | `admin` |
| `JWT_SECRET` | 任意 | JWT 署名用（本番では必ず変更） | `change-me-in-production` |
| `UPLOAD_DIR` | 任意 | 画像アップロード先 | `uploads` |
| `API_BASE_URL` | 任意 | 画像 URL のベース（本番ドメインなど） | `http://localhost:3002` |
| `PORT` | 任意 | 待ち受けポート | `3002` |
| `CONTACT_EMAIL_USER` | お問い合わせのみ | 送信元 Gmail アドレス | 未設定時はお問い合わせ送信不可 |
| `CONTACT_EMAIL_APP_PASSWORD` | お問い合わせのみ | Gmail アプリ パスワード | 未設定時はお問い合わせ送信不可 |

**必須なのは「お問い合わせフォームで送信したいとき」の 2 つだけ**（`CONTACT_EMAIL_USER` と `CONTACT_EMAIL_APP_PASSWORD`）です。それ以外は既定値で動きます。本番では `ADMIN_PASSWORD` と `JWT_SECRET` の変更を強く推奨します。

## フロント側の設定

お問い合わせ・お知らせ・管理画面でこの API を呼ぶため、ルートの `.env` に次を設定してください（開発時）。

```
VITE_ADMIN_API_URL=http://localhost:3002
```

未設定の場合はフロントは `http://localhost:3002` を参照します。

## 動作フロー

1. **HP 訪問数**: トップページ表示時に `POST /api/visits` で 1 加算。管理画面で `GET /api/visits` により件数を表示。
2. **お知らせ**: 管理画面でタイトル・画像・本文を投稿（`POST /api/news`）。トップの「お知らせ」欄は `GET /api/news` で取得して表示。
3. **認証**: 管理画面ログインは `POST /api/admin/login` でパスワード送信し、JWT を取得。投稿時は `Authorization: Bearer <token>` を付与。
4. **お問い合わせ**: トップのフォーム送信で `POST /api/contact`（JSON: name, email, message）。`CONTACT_EMAIL_USER` / `CONTACT_EMAIL_APP_PASSWORD` を設定すると Gmail で fuburyukodokai@gmail.com に転送されます。
