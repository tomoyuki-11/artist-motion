#!/bin/bash
# コードだけ EC2 にアップロードし、EC2 上でビルド・再起動するスクリプト
# 使い方: プロジェクトルートで EC2_HOST と KEY を設定して ./scripts/deploy-code-only.sh

set -e

# ========== ここをあなたの環境に合わせて変更 ==========
EC2_HOST=ec2-xx-xx-xx-xx.ap-northeast-1.compute.amazonaws.com
KEY=your-key.pem
USER=ubuntu
# =====================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "1. コードを EC2 にアップロード中（node_modules / dist / api/target は除外）..."
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

echo "2. EC2 上で npm install / npm run build / cargo build --release / PM2 再起動..."
ssh -i "$KEY" $USER@$EC2_HOST "cd ~/artist-motion-web && npm install && npm run build && cd api && cargo build --release && cd .. && pm2 restart frontend api || (echo 'PM2 未使用の場合は手動で Node と API を再起動してください')"

echo "完了しました。"
