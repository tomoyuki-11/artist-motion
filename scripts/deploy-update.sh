#!/bin/bash
# 変更を公開するときの更新デプロイ用スクリプト
# 使い方: EC2_HOST と KEY を設定して ./scripts/deploy-update.sh

set -e

# ========== ここをあなたの環境に合わせて変更 ==========
EC2_HOST=ec2-xx-xx-xx-xx.ap-northeast-1.compute.amazonaws.com
KEY=your-key.pem
USER=ubuntu
# =====================================================

echo "1. ビルド中..."
npm run build
cd api && cargo build --release && cd ..

echo "2. EC2 にアップロード中..."
rsync -avz -e "ssh -i $KEY" \
  dist/ package.json \
  $USER@$EC2_HOST:~/artist-motion-web/

rsync -avz -e "ssh -i $KEY" \
  api/target/release/api \
  $USER@$EC2_HOST:~/artist-motion-web/api/

# api/.env を更新した場合だけコメントを外して使う
# rsync -avz -e "ssh -i $KEY" api/.env $USER@$EC2_HOST:~/artist-motion-web/api/

echo "3. EC2 上でサービスを再起動..."
ssh -i "$KEY" $USER@$EC2_HOST "cd ~/artist-motion-web && pm2 restart frontend api || (echo 'PM2 未使用の場合は手動で Node と API を再起動してください')"

echo "完了しました。"
