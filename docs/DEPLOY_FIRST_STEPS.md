# 公開するにはまず何からすればいい？？

公開までの「最初の一歩」を順番にまとめています。

---

## 1. 本番用の環境変数を決める（まずここ）

公開先のURLが決まっていなくても、**本番用の値**を先に用意しておきます。

### フロント（ルートの `.env` に本番用で設定）

| 変数 | 説明 | 例（本番） |
|------|------|-------------|
| `VITE_ADMIN_API_URL` | Rust API のURL（本番ドメイン） | `https://api.artist-motion.com` など |
| `VITE_SITE_URL` | サイトのURL（OGP・canonical用） | `https://artist-motion.com` |

※ ビルド時にこれらの値がフロントに埋め込まれます。後から変えるには再ビルドが必要です。

### API（`api/.env` に本番用で設定）

| 変数 | 説明 | 本番でやること |
|------|------|----------------|
| `ADMIN_PASSWORD` | 管理画面ログイン | **必ず**開発用以外の強いパスワードに変更 |
| `JWT_SECRET` | JWT署名 | **必ず**長いランダム文字列に変更 |
| `API_BASE_URL` | 画像などの絶対URLのベース | 本番のAPIのURL（例: `https://api.artist-motion.com`） |
| `CONTACT_EMAIL_USER` / `CONTACT_EMAIL_APP_PASSWORD` | お問い合わせ送信（Gmail） | 本番でも使うGmail・アプリパスワードを設定 |

---

## 2. 本番ビルドが通るか確認する（ローカルで）

URLは仮のまま（例: `https://example.com`）でよいので、**本番と同じ手順**でビルドと起動ができるか確認します。

```bash
# 1) フロント＋Nodeサーバーをビルド
npm run build

# 2) Rust API はリリースビルド（本番用）
cd api && cargo build --release
```

起動確認（別ターミナル2つ）：

```bash
# ターミナル1: フロント（Node）
npm start

# ターミナル2: API（Rust）
cd api && ./target/release/api   # または cargo run --release
```

- フロント: `http://localhost:3000`
- API: デフォルトで `http://localhost:3002`

ブラウザで 3000 にアクセスし、表示・お知らせ取得・管理画面ログインなどが動けばOKです。

---

## 3. 公開先を決める

| 役割 | 候補 | 備考 |
|------|------|------|
| フロント | AWS Amplify / S3+CloudFront | 静的＋Nodeで配信するなら EC2 にまとめも可 |
| API（Rust） | EC2 / ECS | 1台でよいなら EC2 が簡単 |
| DB | 現状のSQLite（APIと同じサーバー） | 小規模ならこのままで可 |

※ リージョンが米国で日本から表示が遅い場合は [SPEED_AND_CDN.md](./SPEED_AND_CDN.md) を参照（CDN・フロント最適化）。

「まずは1台のサーバーに全部載せたい」場合は、**1台のEC2** に  
Node（フロント配信）＋ Rust API の両方を入れる構成も可能です。

---

## 4. このあとやること（順番の目安）

1. **ドメイン**を取得（例: artist-motion.com）
2. **サーバーを1台用意**（AWSならEC2など）
3. そのサーバーに **Rust API** と **Node（フロント）** をデプロイ
4. **本番のURL**で上記の環境変数を設定し、もう一度ビルド
5. **HTTPS** を設定（Let's Encrypt または AWSの証明書）
6. フロントの `VITE_ADMIN_API_URL` と `VITE_SITE_URL` を本番URLにし、再ビルドしてデプロイ

---

## まとめ：今日やるなら

1. **本番用の `ADMIN_PASSWORD` と `JWT_SECRET` を決めて `api/.env` に書く**
2. **`npm run build` と `cargo build --release` が通るか確認する**
3. **公開先（AWSのどのサービスか、1台にまとめるか）を決める**

ここまでできたら、次の「サーバーにどう置くか」「HTTPSの付け方」に進めます。
