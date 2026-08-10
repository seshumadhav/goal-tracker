#!/bin/bash
# Deployment script for goat (goal-tracker)
# Run this script from the project directory on EC2: ~/goal-tracker/deploy.sh

set -e  # Exit on error

echo "🚀 Starting deployment..."

cd /home/ec2-user/goal-tracker || { echo "❌ Project directory not found"; exit 1; }

echo "📥 Pulling latest code..."
git fetch origin || { echo "❌ Git fetch failed"; exit 1; }
git reset --hard origin/main || { echo "❌ Git reset failed"; exit 1; }

echo "📦 Installing dependencies..."
npm install --omit=dev || { echo "❌ npm install failed"; exit 1; }

echo "🔄 Restarting backend..."
PORT=3002 pm2 restart goat || { echo "⚠️  PM2 restart failed, trying to start..."; PORT=3002 pm2 start server.js --name goat || true; }
pm2 save

echo "🔧 Syncing Nginx config..."
GENERATED_CONF="$(mktemp)"
cp nginx/goat.conf "$GENERATED_CONF"
sudo cp "$GENERATED_CONF" /etc/nginx/conf.d/goat.conf
rm -f "$GENERATED_CONF"
sudo nginx -t || { echo "❌ Nginx config test failed"; exit 1; }

echo "🌐 Reloading Nginx..."
sudo systemctl reload nginx || { echo "❌ Nginx reload failed"; exit 1; }

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 PM2 Status:"
pm2 list | grep goat || echo "⚠️  Backend not running"
echo ""
echo "🌐 Test your deployment:"
echo "   https://goat.duckdns.org"
echo ""
