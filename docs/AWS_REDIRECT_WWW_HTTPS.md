# AWS で www → 非www と http → https のリダイレクト設定

検索エンジンの表示URLを `https://artist-motion.com` に統一するため、次のリダイレクトを設定します。

- **http** → **https**（301）
- **www.artist-motion.com** → **artist-motion.com**（301）

構成に応じて、該当する方法だけ実施してください。

---

## 方法1: EC2 + Nginx（いまの構成で一番想定しやすい）

フロントを EC2 上の Node で動かし、Nginx をリバースプロキシにしている場合の手順です。

### 手順 1. 現在の Nginx 設定を確認

EC2 に SSH して、設定ファイルを開きます。

```bash
sudo nano /etc/nginx/sites-available/artist-motion
```

`server_name` に `www.artist-motion.com` と `artist-motion.com` の**両方**が入っている場合は、このあと「www 用のリダイレクト専用サーバー」を追加します。

---

### 手順 2. www と http をリダイレクトするサーバーブロックを追加

**ファイルの先頭付近**（既存の `server { ... }` より前）に、次の 2 つの `server` ブロックを追加します。

```nginx
# 1) http でアクセスされた場合 → https へ 301 リダイレクト
server {
    listen 80;
    listen [::]:80;
    server_name artist-motion.com www.artist-motion.com;
    return 301 https://artist-motion.com$request_uri;
}

# 2) https で www でアクセスされた場合 → 非www へ 301 リダイレクト
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.artist-motion.com;
    ssl_certificate /etc/letsencrypt/live/artist-motion.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/artist-motion.com/privkey.pem;
    return 301 https://artist-motion.com$request_uri;
}
```

- 1つ目: すべての **http** アクセスを `https://artist-motion.com` へ 301 リダイレクトします。
- 2つ目: **https かつ www** のアクセスを `https://artist-motion.com` へ 301 リダイレクトします。

---

### 手順 3. メインのサーバーブロックから www を外す

既存の「フロント用」の `server` ブロックで、`server_name` から `www.artist-motion.com` を**削除**し、`artist-motion.com` だけにします。

**変更前の例:**
```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name artist-motion.com www.artist-motion.com;   # ← 両方ある
    ...
}
```

**変更後:**
```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name artist-motion.com;   # ← 非www のみ
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
```

※ API 用（`api.artist-motion.com`）の `server` ブロックはそのままで問題ありません。

---

### 手順 4. 設定のテストと Nginx の再読み込み

```bash
sudo nginx -t
```

エラーが表示されなければ:

```bash
sudo systemctl reload nginx
```

---

### 手順 5. 動作確認

| アクセスするURL | 期待する結果 |
|-----------------|--------------|
| `http://artist-motion.com` | `https://artist-motion.com` に 301 リダイレクト |
| `http://www.artist-motion.com` | `https://artist-motion.com` に 301 リダイレクト |
| `https://www.artist-motion.com` | `https://artist-motion.com` に 301 リダイレクト |
| `https://artist-motion.com` | そのまま表示（リダイレクトなし） |

ブラウザで上記の URL を開き、アドレスバーが最終的に `https://artist-motion.com` になることを確認してください。  
（シークレットウィンドウや別ブラウザで試すと、キャッシュの影響を避けられます。）

---

### 補足: 証明書に www が含まれているか

Let's Encrypt 取得時に `www` を含めている場合（例: `certbot --nginx -d artist-motion.com -d www.artist-motion.com`）、上記の「www 用 443 サーバー」で同じ証明書をそのまま使えます。  
まだ取得していない場合は、次のようにして両方のドメインを取得してください。

```bash
sudo certbot --nginx -d artist-motion.com -d www.artist-motion.com
```

---

## 方法2: CloudFront を前面に置いている場合

オリジンが S3 または EC2 で、**CloudFront** で配信している場合は、**CloudFront Function** でリダイレクトします。

### 手順 1. CloudFront Function を作成

1. AWS マネジメントコンソールで **CloudFront** を開く
2. 左メニュー **「関数」** をクリック
3. **「関数の作成」** をクリック
4. **名前**: 例として `redirect-www-to-non-www`
5. **「関数の作成」** をクリック

---

### 手順 2. 関数のコードを入力

エディタに次のコードを貼り付けます。

```javascript
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    var qs = request.querystring || {};
    var parts = [];
    for (var key in qs) {
        var arr = qs[key];
        for (var i = 0; i < arr.length; i++) {
            parts.push(encodeURIComponent(arr[i].key) + "=" + encodeURIComponent(arr[i].value));
        }
    }
    var qsStr = parts.length > 0 ? "?" + parts.join("&") : "";
    var newUrl = "https://artist-motion.com" + uri + qsStr;
    var host = request.headers.host ? request.headers.host.value : "";
    var proto = request.headers["cloudfront-forwarded-proto"] ? request.headers["cloudfront-forwarded-proto"].value : "";

    if (host.indexOf("www.") === 0 || proto === "http") {
        return {
            statusCode: 301,
            statusDescription: "Moved Permanently",
            headers: { "location": { value: newUrl } }
        };
    }
    return request;
}
```

- **www** のホストなら 301 で `https://artist-motion.com` へリダイレクト
- **http** で来た場合も 301 で `https://artist-motion.com` へリダイレクト

**「変更の保存」** をクリックします。

---

### 手順 3. 関数をテスト（任意）

CloudFront の「関数」画面で、該当関数の **「テスト」** タブを開き、次のようなテストイベントで動作確認できます。

- **イベント名**: 例 `test-www`
- **イベントオブジェクト**（`host` を www にした例）:

```json
{
  "version": "1.0",
  "context": {
    "eventType": "viewer-request"
  },
  "viewer": {
    "ip": "1.2.3.4"
  },
  "request": {
    "method": "GET",
    "uri": "/",
    "querystring": {},
    "headers": {
      "host": {"value": "www.artist-motion.com"},
      "cloudfront-forwarded-proto": {"value": "https"}
    },
    "cookies": {}
  }
}
```

実行結果で `statusCode: 301` と `location: https://artist-motion.com/` が返れば問題ありません。

---

### 手順 4. ディストリビューションに紐づける

1. **CloudFront** → **「ディストリビューション」** を開く
2. 対象のディストリビューション（artist-motion.com 用）の **ID** をクリック
3. **「ビヘイビア」** タブで、デフォルトのビヘイビア（0）を選択 → **「編集」**
4. **「ビューワーリクエスト」** の「関数の関連付け」で:
   - **関数タイプ**: ビューワーリクエスト
   - **関数ARN**: 先ほど作成した `redirect-www-to-non-www` を選択
5. **「変更の保存」** をクリック

反映まで数分かかることがあります。  
**「一般」** タブの **「代替ドメイン名 (CNAME)」** に `artist-motion.com` と `www.artist-motion.com` の両方が含まれていることを確認してください。

---

## 方法3: AWS Amplify でホスティングしている場合

Amplify の「リダイレクト」でルールを追加します。

### 手順 1. アプリを開く

1. AWS マネジメントコンソールで **Amplify** を開く
2. 対象のアプリ（artist-motion 用）をクリック

---

### 手順 2. リダイレクトルールを追加

1. 左メニュー **「ホスティング」** の **「リダイレクトとリライト」** をクリック（または **「アプリの設定」** → **「リダイレクト」**）
2. **「リダイレクトルールを編集」** をクリック
3. 既存ルールの下に、次の 2 行を**追加**（既存の `https` リダイレクトはそのままにしてよいです）:

| ソースアドレス | ターゲットアドレス | タイプ |
|----------------|--------------------|--------|
| `https://www.artist-motion.com/<*>` | `https://artist-motion.com/<*>` | 301 (永久的なリダイレクト) |
| `http://www.artist-motion.com/<*>` | `https://artist-motion.com/<*>` | 301 (永久的なリダイレクト) |

※ `<*>` は「すべてのパス」を表す Amplify の記法です。画面の表記に合わせて入力してください。

4. **「保存」** をクリック

デプロイが走り、数分で反映されます。

---

## 方法4: Application Load Balancer (ALB) の前段の場合

EC2 の前に **ALB** を置いている場合は、**リスナールール**でリダイレクトします。

### 手順 1. リスナーを開く

1. **EC2** コンソール → 左メニュー **「ロードバランサー」**
2. 対象の ALB を選択
3. **「リスナー」** タブをクリック
4. **HTTPS:443** のリスナーで **「ルールを表示/編集」** をクリック

---

### 手順 2. www 用のリダイレクトルールを追加

1. **「ルールの追加」** をクリック
2. **「ルールの挿入」** で、**「ルールの追加」** を選択
3. **条件**:
   - **「ホストヘッダーを追加」** → `www.artist-motion.com`
4. **アクション**:
   - **「リダイレクト」** を選択
   - **プロトコル**: HTTPS
   - **ポート**: 443
   - **ホスト**: `artist-motion.com`
   - **パス**: `#{path}`
   - **クエリ**: `#{query}`
   - **ステータスコード**: 301
5. **「保存」** をクリック

同様に **HTTP:80** のリスナーでも、  
「ホストが `www.artist-motion.com` または `artist-motion.com`」のときは `https://artist-motion.com#{path}#{query}` へ 301 リダイレクトするルールを追加すると、http → https もまとめて扱えます。

---

## Route 53 の確認（共通）

どの方法でも、**www** のアクセスを**同じサーバー（または CloudFront / ALB）に届ける**必要があります。

1. **Route 53** → **「ホストゾーン」** → ドメインを選択
2. **www.artist-motion.com** 用のレコードがあるか確認
   - **A レコード** または **CNAME** で、EC2 の IP または CloudFront/ALB のドメイン名を指している必要があります
3. ない場合は **「レコードを作成」** で追加
   - 名前: `www`
   - タイプ: A（エイリアスで CloudFront や ALB を指す）または A（EC2 の IP）

これで、`www.artist-motion.com` へのアクセスがサーバーに届き、そこで 301 リダイレクトされます。

---

## 設定後の確認と検索エンジンについて

- 上記のいずれかで 301 を設定したあと、ブラウザで  
  `http://www.artist-motion.com` と `https://www.artist-motion.com` が  
  どちらも `https://artist-motion.com` に変わることを確認してください。
- 検索結果の表示URLが `https://artist-motion.com` に変わるまでには、Google の再クロールの関係で**数日〜数週間**かかることがあります。
- **Google Search Console** で `https://artist-motion.com` をプロパティに登録し、**URL 検査**でトップページの「インデックス登録をリクエスト」をすると、更新が促されます。

---

## まとめ

| 構成 | 設定する場所 |
|------|----------------|
| EC2 + Nginx | Nginx の `server` ブロック（本ドキュメント 方法1） |
| CloudFront + S3/EC2 | CloudFront Function（方法2） |
| AWS Amplify | リダイレクトとリライト（方法3） |
| ALB + EC2 | リスナールール（方法4） |

いずれも **www → 非www** と **http → https** を 301 で統一すれば、検索結果も `https://artist-motion.com` に寄せていけます。
