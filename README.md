# Optimizer Web-App & Telegram Bot

Комплексное решение для управления заказами и продуктами через Telegram Mini App и Telegram Bot.

## Структура проекта

Проект разделен на две основные части:

### 1. [Backend](./backend) (Python / FastAPI + Telegram Bot)
- **FastAPI**: REST API для взаимодействия с фронтендом.
- **Telegram Bot**: Бот для регистрации пользователей и доступа к Mini App.
- **SQLite**: Легкая база данных для хранения заказов, продуктов и пользователей.

**Файловая структура:**
- `app/api.py`: Маршруты и логика FastAPI.
- `app/bot.py`: Обработчики команд и диалогов Telegram бота.
- `app/crud.py`: Операции с базой данных (Create, Read, Update, Delete).
- `app/database.py`: Настройка и инициализация БД.
- `app/schemas.py`: Pydantic модели для валидации данных.
- `main.py`: Единая точка входа для запуска API и/или Бота.

### 2. [Frontend](./frontend) (React + Vite + TypeScript)
- **Mini App**: Клиентская часть, работающая внутри Telegram.
- **Vite**: Быстрая сборка и разработка.

## Как запустить

### Предварительные условия
- Установленный [Docker](https://www.docker.com/) и [Docker Compose](https://docs.docker.com/compose/).
- Созданный Telegram бот через [@BotFather](https://t.me/BotFather).

### Настройка переменных окружения
1. Скопируйте файл `.env.example` в `.env`:
   ```bash
   cp .env.example .env
   ```
2. Заполните необходимые переменные в `.env`:
   - `BOT_TOKEN`: Токен вашего бота.
   - `WEBAPP_URL`: URL, по которому будет доступен фронтенд.

### Запуск через Docker Compose
Запустите все сервисы одной командой:
```bash
docker-compose up -d --build
```

Это запустит:
- **API** на порту `8000`
- **Telegram Bot** (в фоновом режиме)
- **Frontend** (Nginx) на порту `80` (настроен через Traefik или напрямую)

### Разработка без Docker

#### Backend:
```bash
cd backend
pip install -r requirements.txt
python main.py both
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Развертывание
Проект настроен для работы с **Traefik** в качестве обратного прокси. Настройки роутинга для домена `canteen.thompson.uz` находятся в `docker-compose.yml`.
