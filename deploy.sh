#!/bin/bash

# Останавливаем скрипт при любой ошибке
set -e

echo "🚀 Начинаем деплой проекта..."

# Получаем последние изменения из ветки и принудительно перезаписываем (Force Pull)
echo "📥 Выполняем принудительный git pull (сброс локальных изменений)..."
git fetch --all
git reset --hard origin/main

# Проверяем наличие docker-compose.yml (может быть docker-compose.yml или docker-compose.yaml)
if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
    echo "🛑 Останавливаем текущие контейнеры..."
    docker-compose down

    echo "🏗  Собираем новые образы и запускаем контейнеры..."
    docker-compose up -d --build
else
    # На случай если используется новый Docker Compose V2 плагин (через дефис или без)
    echo "🛑 Останавливаем текущие контейнеры (Docker Compose V2)..."
    docker compose down

    echo "🏗  Собираем новые образы и запускаем контейнеры (Docker Compose V2)..."
    docker compose up -d --build
fi

echo "✅ Деплой успешно завершен! Контейнеры запущены в фоновом режиме."
