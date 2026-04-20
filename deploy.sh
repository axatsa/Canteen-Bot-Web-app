#!/bin/bash

set -e

echo "🚀 Начинаем деплой..."

echo "📥 Получаем изменения из git..."
git pull origin main

echo "🛑 Останавливаем контейнеры..."
docker compose down

echo "🏗  Собираем и запускаем..."
docker compose up -d --build

echo "✅ Готово!"
