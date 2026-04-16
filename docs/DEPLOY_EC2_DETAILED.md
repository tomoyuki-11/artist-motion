# ドメイン取得後のデプロイ手順（EC2 への公開）

ドメインを Route 53 で取得したあと、EC2 に artist-motion-web をデプロイするまでの詳細手順です。

---

## 全体の流れ

1. **環境変数を本番用に修正**（ローカルで実施）
2. **本番ビルドを実行**
3. **EC2 を用意**（まだの場合）
4. **ビルド成果物を EC2 にアップロード**
5. **EC2 上でサーバーを起動**
6. **Route 53 で DNS を設定**
7. **HTTPS（SSL証明書）を設定**

---

## 前提

- ドメインは Route 53 で取得済み（例: `artist-motion.com`）
- EC2 は Ubuntu 22.04 などの Linux（Amazon Linux 2 でも可）
- 1台の EC2 に「フロント（Node）＋ API（Rust）」を両方載せる構成を想定

---

## 1. 環境変数を本番用に修正

### 1-1. ルートの `.env`（フロント用・ビルド時に埋め込まれる）

取得したドメインに合わせて設定します。

| 変数 | 説明 | 本番の例 |
|------|------|----------|
| `VITE_ADMIN_API_URL` | API の URL | `https://api.artist-motion.com` または `https://artist-motion.com/api` |
| `VITE_SITE_URL` | サイトの URL（OGP・canonical） | `https://artist-motion.com` |

**例（サブドメインで API を分ける場合）**
```
VITE_ADMIN_API_URL=https://api.artist-motion.com
VITE_SITE_URL=https://artist-motion.com
```

**例（同一ドメインで /api にまとめる場合）**
```
VITE_ADMIN_API_URL=https://artist-motion.com/api
VITE_SITE_URL=https://artist-motion.com
```

※ `VITE_*` は **ビルド時** に埋め込まれるため、変更したら必ず再ビルドが必要です。

---

### 1-2. `api/.env`（API 用・EC2 上の実行時に読み込む）

| 変数 | 説明 | 本番でやること |
|------|------|----------------|
| `ADMIN_PASSWORD` | 管理画面ログイン | **必ず** 強いパスワードに変更 |
| `JWT_SECRET` | JWT 署名 | **必ず** 長いランダム文字列に変更（32文字以上推奨） |
| `API_BASE_URL` | 画像 URL のベース | 本番の API の URL（例: `https://api.artist-motion.com`） |
| `CONTACT_EMAIL_USER` | お問い合わせ送信元 Gmail | 本番で使う Gmail |
| `CONTACT_EMAIL_APP_PASSWORD` | Gmail アプリパスワード | 本番で使うもの |
| `PORT` | API の待ち受けポート | デフォルト `3002` のままで可 |

**例**
```
DATABASE_URL=sqlite:./data.db
ADMIN_PASSWORD=あなたの強いパスワード
JWT_SECRET=ランダムな長い文字列32文字以上
API_BASE_URL=https://api.artist-motion.com
PORT=3002
CONTACT_EMAIL_USER=fuburyukodokai@gmail.com
CONTACT_EMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
```

---

## 2. 本番ビルドを実行

### ローカルでやること（フロントのみ）

プロジェクトルートで実行します。

```bash
# フロント + Node サーバーをビルド
npm run build
```

生成される成果物：`dist/`（フロント `dist/public` と Node サーバー `dist/index.js`）

### API は EC2 でビルドする

Rust は **Mac でビルドしたバイナリは Linux（EC2）では動きません**（Exec format error）。  
**API のバイナリは EC2 上で `cargo build --release` して作成**します。ローカルでは API のビルドは不要です。

---

## 3. EC2 を用意（まだの場合）

1. AWS マネジメントコンソール → EC2 → インスタンスを起動
2. 例: **Ubuntu Server 22.04**、t2.micro 以上
3. セキュリティグループで以下を許可：
   - **22**（SSH）
   - **80**（HTTP）
   - **443**（HTTPS）
   - （内側で Node/Rust を使う場合は 3000, 3002 は外部開放不要）
4. キーペアをダウンロードし、`chmod 400 your-key.pem` で権限を設定

---

## 4. EC2 に必要なソフトをインストール

SSH で EC2 に接続し、以下をインストールします。

```bash
# Node.js（LTS）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Rust とビルド用パッケージ（API を EC2 でビルドするため必須）
sudo apt install -y build-essential pkg-config libssl-dev libsqlite3-dev
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

# Nginx（リバースプロキシ・HTTPS 用）
sudo apt update
sudo apt install -y nginx

# PM2 で Node/Rust を常時起動
sudo npm install -g pm2
```

---

## 5. ビルド成果物を EC2 にアップロード

### 5-1. アップロードするもの

| 対象 | ローカル | EC2 上の配置先（例） |
|------|----------|----------------------|
| フロント＋Node サーバー | `dist/` 全体 | `/home/ubuntu/artist-motion-web/dist/` |
| Rust API バイナリ | `api/target/release/api` | `/home/ubuntu/artist-motion-web/api/` |
| API の .env | `api/.env` | `/home/ubuntu/artist-motion-web/api/.env` |
| package.json | `package.json` | `/home/ubuntu/artist-motion-web/`（Node 起動用） |

### 5-2. SCP でアップロードする例

```bash
# EC2 のホスト名（例: ec2-xx-xx-xx-xx.ap-northeast-1.compute.amazonaws.com）
EC2_HOST=ec2-xx-xx-xx-xx.ap-northeast-1.compute.amazonaws.com
KEY=your-key.pem
USER=ubuntu

# ディレクトリ作成
ssh -i "$KEY" $USER@$EC2_HOST "mkdir -p artist-motion-web/api"

# フロント＋Node サーバー
scp -i "$KEY" -r dist package.json $USER@$EC2_HOST:~/artist-motion-web/

# Rust API バイナリ
scp -i "$KEY" api/target/release/api $USER@$EC2_HOST:~/artist-motion-web/api/

# API の .env
scp -i "$KEY" api/.env $USER@$EC2_HOST:~/artist-motion-web/api/
```

### 5-3. rsync を使う例

```bash
EC2_HOST=ec2-xx-xx-xx-xx.ap-northeast-1.compute.amazonaws.com
KEY=your-key.pem
USER=ubuntu

rsync -avz -e "ssh -i $KEY" \
  dist/ package.json \
  $USER@$EC2_HOST:~/artist-motion-web/

rsync -avz -e "ssh -i $KEY" \
  api/target/release/api api/.env \
  $USER@$EC2_HOST:~/artist-motion-web/api/
```

### 5-4. コードだけ EC2 にアップロード（EC2 でビルドする場合）

API のバイナリは EC2 上で `cargo build --release` するため、**ソースコードだけ**をアップロードする方法です。  
`node_modules`・`dist`・`api/target` は除外して転送量を抑えます。

#### rsync でコードだけ送る

プロジェクトルート（`artist-motion-web` のひとつ上）で実行します。

```bash
EC2_HOST=ec2-xx-xx-xx-xx.ap-northeast-1.compute.amazonaws.com
KEY=your-key.pem
USER=ubuntu

# 除外しながらプロジェクト全体を同期（.env は含めない＝EC2 側で別管理を推奨）
rsync -avz --delete \
  -e "ssh -i $KEY" \
  --exclude 'node_modules' \
  --exclude 'client/node_modules' \
  --exclude 'dist' \
  --exclude 'api/target' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude 'api/.env' \
  --exclude 'api/uploads' \
  --exclude '*.db' \
  --exclude '*.sqlite' \
  --exclude '*.sqlite3' \
  . \
  $USER@$EC2_HOST:~/artist-motion-web/
```

- **`api/.env` を EC2 に置く場合**（初回や変更時のみ）  
  `--exclude 'api/.env'` を外し、ローカルの `api/.env` を同期するか、別途 `scp -i "$KEY" api/.env $USER@$EC2_HOST:~/artist-motion-web/api/` で送ります。
- 既に EC2 に `api/.env` がある場合は除外のままで問題ありません。

#### SCP で API のコードだけ送る

SCP には `--exclude` がないため、**API に必要なファイルだけ**を指定して送ります。  
プロジェクトルートで実行します。

```bash
EC2_HOST=ec2-xx-xx-xx-xx.ap-northeast-1.compute.amazonaws.com
KEY=your-key.pem
USER=ubuntu

# API 用ディレクトリを用意（初回のみ）
ssh -i "$KEY" $USER@$EC2_HOST "mkdir -p artist-motion-web/api/src artist-motion-web/api/migrations"

# API のソースだけ送る（target / .env は送らない）
scp -i "$KEY" api/Cargo.toml api/Cargo.lock $USER@$EC2_HOST:~/artist-motion-web/api/
scp -i "$KEY" -r api/src $USER@$EC2_HOST:~/artist-motion-web/api/
scp -i "$KEY" -r api/migrations $USER@$EC2_HOST:~/artist-motion-web/api/
```

- `.env` は含めていません。EC2 にまだ無い場合は別途  
  `scp -i "$KEY" api/.env $USER@$EC2_HOST:~/artist-motion-web/api/` で送るか、EC2 上で作成してください。
- フロント（`client/` や `dist/`）も更新する場合は、上記に加えて 5-2 のフロント用 scp を実行するか、rsync（5-4 上段）でプロジェクト全体を送ってください。

#### スクリプトで一括実行する場合

プロジェクトルートで以下を実行すると、コードのアップロードと EC2 上でのビルド・再起動まで一括で行えます。  
`scripts/deploy-code-only.sh` 内の `EC2_HOST` と `KEY` を環境に合わせて編集してから実行してください。

```bash
./scripts/deploy-code-only.sh
```

#### EC2 上でやること（アップロード後の初回 or 更新時）

SSH で EC2 に入り、以下を実行します。

```bash
cd ~/artist-motion-web

# Node の依存関係とフロントビルド
npm install   # または pnpm install
npm run build

# API を EC2 でビルド
cd api && cargo build --release && cd ..

# サービス再起動（PM2 の場合）
pm2 restart frontend api
# 未使用なら手動で Node と API を起動
```

---

## 6. EC2 上でサーバーを起動

### 6-1. 手動で起動して動作確認

```bash
ssh -i "$KEY" $USER@$EC2_HOST

cd ~/artist-motion-web

# Node（フロント）を 3000 番で起動
PORT=3000 NODE_ENV=production node dist/index.js &

# Rust API を 3002 番で起動（api ディレクトリで .env を読む）
cd api && ./api &

# ローカルで確認（EC2 の 3000, 3002 にアクセスできるよう一時的にセキュリティグループで開放した場合）
curl http://localhost:3000
curl http://localhost:3002/api/visits
```

### 6-2. PM2 で常時起動する場合

```bash
cd ~/artist-motion-web

# フロント
pm2 start dist/index.js --name frontend --env NODE_ENV=production

# API（api ディレクトリで .env を読む）
cd api && pm2 start ./api --name api

pm2 save
pm2 startup  # 指示に従い、起動スクリプトを有効化
```

---

## 7. Route 53 で DNS を設定

1. Route 53 コンソール → **ホストゾーン** → あなたのドメイン（例: `artist-motion.com`）を選択
2. **レコードを作成**

#### パターン A: メイン＋API をサブドメインで分ける

| タイプ | 名前 | 値 | 備考 |
|--------|------|-----|------|
| A | （空） | EC2 のパブリック IP | `artist-motion.com` → フロント |
| A | api | EC2 のパブリック IP | `api.artist-motion.com` → API |
| A | www | EC2 のパブリック IP | （任意）`www.artist-motion.com` |

※ 後で Elastic IP を付ける場合は、その IP を「値」に指定します。

#### パターン B: 同一ドメインで /api にまとめる

| タイプ | 名前 | 値 |
|--------|------|-----|
| A | （空） | EC2 のパブリック IP |
| A | www | EC2 のパブリック IP |

この場合、Nginx で `/api` を 3002 番にプロキシします（後述）。

---

## 8. Nginx + HTTPS の設定

※ **www → 非www と http → https の 301 リダイレクト** をまとめて設定する手順は [AWS_REDIRECT_WWW_HTTPS.md](./AWS_REDIRECT_WWW_HTTPS.md) にあります。検索結果のURLを `https://artist-motion.com` に統一したい場合はあわせて参照してください。

### 8-1. SSL 証明書（Let's Encrypt）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d artist-motion.com -d www.artist-motion.com
# API をサブドメインで分ける場合
sudo certbot --nginx -d artist-motion.com -d www.artist-motion.com -d api.artist-motion.com
```

### 8-2. Nginx 設定例（サブドメインで API を分ける場合）

```bash
sudo nano /etc/nginx/sites-available/artist-motion
```

```nginx
# フロント（artist-motion.com, www.artist-motion.com）
server {
    listen 80;
    listen [::]:80;
    server_name artist-motion.com www.artist-motion.com;
    return 301 https://$server_name$request_uri;
}
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name artist-motion.com www.artist-motion.com;
    ssl_certificate /etc/letsencrypt/live/artist-motion.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/artist-motion.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API（api.artist-motion.com）
server {
    listen 80;
    listen [::]:80;
    server_name api.artist-motion.com;
    return 301 https://$server_name$request_uri;
}
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.artist-motion.com;
    ssl_certificate /etc/letsencrypt/live/artist-motion.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/artist-motion.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

有効化と再読み込み：

```bash
sudo ln -sf /etc/nginx/sites-available/artist-motion /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 8-3. 同一ドメインで /api にまとめる場合

```nginx
server {
    listen 443 ssl http2;
    server_name artist-motion.com www.artist-motion.com;
    ssl_certificate /etc/letsencrypt/live/artist-motion.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/artist-motion.com/privkey.pem;

    location /api {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

この場合、`VITE_ADMIN_API_URL=https://artist-motion.com/api`、`API_BASE_URL=https://artist-motion.com/api` にしておきます。

---

## 9. 動作確認チェックリスト

- [ ] `https://artist-motion.com` でトップページが表示される
- [ ] お知らせが表示される（API 疎通確認）
- [ ] 管理画面にログインできる
- [ ] お問い合わせフォームが送信できる
- [ ] 画像が正しく表示される（`API_BASE_URL` が正しいか）
- [ ] お知らせのコメント送信・一覧が動く（`GET/POST /api/news-comments/:id`）

---

## 10. デプロイの更新手順（今後）

1. ローカルで `api/.env` とルート `.env` を確認
2. フロント: `npm run build`。API: **EC2 上で** `cd api && cargo build --release`（Rust は Mac と Linux でバイナリが違うため）
3. フロント: `dist/` を EC2 にアップロード。API: ソースを EC2 に反映したうえで上記の通り EC2 でビルドし、`api/target/release/api` を利用
4. EC2 上で `pm2 restart frontend api`（または該当プロセスを再起動）

**お知らせコメント機能**（`GET/POST /api/news-comments/:id`）を使う場合も、上記の「API を EC2 で再ビルド・再起動」が必要です。本番で 404 になる場合は、api のバイナリが古い可能性があります。

---

## トラブルシューティング

| 症状 | 確認すること |
|------|--------------|
| 502 Bad Gateway | Node / Rust が起動しているか、ポート番号が合っているか |
| API が呼べない | CORS、`VITE_ADMIN_API_URL`、Nginx の `proxy_pass` 先 |
| 画像が表示されない | `API_BASE_URL` が本番の API URL になっているか |
| お問い合わせが届かない | `CONTACT_EMAIL_*`、Gmail アプリパスワード、迷惑メール |
| **お知らせコメントで 404** | 下記「コメントAPIで404になる場合」を参照 |

### コメントAPIで404になる場合

`GET` / `POST` `https://api.artist-motion.com/api/news-comments/...` が 404 になるのは、**本番サーバーで動いている API バイナリが古い**ためです。Rust は Mac でビルドしたバイナリは Linux では動かないため、**API は必ず本番サーバー（EC2）上でビルドし直し、プロセスを再起動**する必要があります。

1. **今の本番APIが新かどうか確認**
   ```bash
   curl -s https://api.artist-motion.com/api/health
   ```
   - `{"ok":true,"news_comments":true}` が返る → 新APIが動いている。404 なら別原因（URL・Nginx 等）を確認。
   - 404 や別レスポンス → 本番で古いバイナリが動いている。

2. **本番サーバーで API を再ビルド・再起動**
   - EC2 に SSH で入り、プロジェクトの **最新ソース**（git pull など）を反映する。
   - API ディレクトリで **Linux 用にビルド**する。
     ```bash
     cd /path/to/artist-motion-web/api
     cargo build --release
     ```
   - 起動中の API を **再起動**する（例: `pm2 restart api` や systemd の `sudo systemctl restart api`）。
   - 再度 `curl https://api.artist-motion.com/api/health` で `news_comments: true` を確認。
