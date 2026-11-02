#!/usr/bin/env bash
# Bansal Geo Solutions - Production Server 1-Click Deployment Script
set -e

echo "========================================================"
echo "🚀 Deploying Bansal Geo HRMS & Attendance to Production"
echo "========================================================"

APP_DIR="${1:-/var/www/bansalgeo-hrms}"
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
fi

echo "📥 Fetching latest code from prod branch..."
git fetch origin prod
git checkout prod
git reset --hard origin/prod

echo "📦 Installing npm dependencies..."
npm install --production=false

echo "🔨 Building optimized frontend..."
VITE_API_URL=https://bansalgeo-api.geoplanetsolution.in/api npm run build

echo "🔄 Restarting API backend..."
if pm2 describe bansalgeo-api > /dev/null 2>&1; then
  pm2 restart bansalgeo-api --update-env
else
  pm2 start server/server.js --name "bansalgeo-api"
fi
pm2 save

echo "🌐 Reloading Nginx..."
if command -v systemctl > /dev/null 2>&1; then
  sudo systemctl reload nginx || true
fi

echo "========================================================"
echo "✅ Bansal Geo HRMS is LIVE on Production!"
echo "   Frontend: https://bansalgeo.geoplanetsolution.in"
echo "   Backend:  https://bansalgeo-api.geoplanetsolution.in/api/health"
echo "========================================================"
