# 📋 Спецификация улучшений функционала Снабженца и Финансиста

**Дата:** 2026-04-18  
**Статус:** Ready for Development  
**Автор:** Ахат Саламов

---

## 📌 Обзор задач

Расширить функционал **Снабженца (Snabjenec)** и **Финансиста (Financier)** для более точного отслеживания доставок товаров.

### Основные изменения:
1. ✅ Снабженец может отмечать даты получения товаров от поставщика
2. ✅ Отслеживание что привезли / что не привезли
3. ✅ Архивирование заказов напрямую из Snabjenec вида
4. ✅ Детальный отчет у Финансиста с разбивкой на привезенные/непривезенные товары

---

## 🗂️ Структура данных (БД)

### Новые поля в таблице `orders`:

```sql
ALTER TABLE orders ADD COLUMN (
  -- Дата отправки списка поставщику
  sent_to_supplier_at DATETIME,
  
  -- Дата получения списка от поставщика с ценами
  received_from_supplier_at DATETIME,
  
  -- JSON объект: отслеживание доставленных товаров
  -- { "product_id": { "ordered_qty": 10, "received_qty": 8, "status": "partial" } }
  delivery_tracking JSON DEFAULT '{}',
  
  -- Флаг: поставщик ответил с ценами/датами
  supplier_responded BOOLEAN DEFAULT FALSE,
  
  -- Дополнительные товары, привезенные без заказа
  -- { "product_id": 5 } - кол-во привезли сверх
  extra_items_delivered JSON DEFAULT '{}'
);
```

### Значения в `delivery_tracking`:
- `ordered_qty` - заказанное количество
- `received_qty` - полученное количество (может редактироваться)
- `status` - одно из: `pending`, `partial`, `delivered`, `not_delivered`

---

## 🔄 Новые состояния и переходы

### Текущее состояние заказа:
```
sent_to_chef 
  ↓
review_snabjenec (Снабженец проверяет)
  ↓
sent_to_supplier (Отправлено поставщику)
  ↓
waiting_snabjenec_receive (Ждем приёмку)
  ↓
sent_to_financier (Отправлено финансисту)
  ↓
archived
```

**Флаг `supplier_responded`:**
- FALSE: Поставщик еще не ответил
- TRUE: Поставщик ответил (установить дату `received_from_supplier_at`)

---

## 🎯 Функциональность Снабженца (SnabjenecDetailView)

### 1️⃣ Отмечание даты получения от поставщика

**Когда:** После перехода в статус `sent_to_supplier`

**Добавить:**
- Поле для ввода даты: "Дата получения от поставщика" (DD.MM.YYYY)
- Кнопка "Отметить получено от поставщика"
- При клике: 
  - Установить `received_from_supplier_at` = текущая дата
  - Установить `supplier_responded = TRUE`
  - Перейти в режим "Приёмка товаров"

---

### 2️⃣ Режим приёмки товаров

**Когда:** После того как `supplier_responded = TRUE`

**Интерфейс:**
```
📦 ПРИЁМКА ТОВАРОВ
┌─────────────────────────────────────────────┐
│ ☐ Помидоры (10 кг)                          │
│   Заказано: 10 кг                           │
│   Получено: [8] ← editable input            │
│   Статус: Частичная доставка                │
│                                             │
│ ☐ Огурцы (5 кг)                             │
│   Заказано: 5 кг                            │
│   Получено: [0]                             │
│   Статус: НЕ доставлено                     │
│                                             │
│ ☐ Лук (3 кг)                                │
│   Заказано: 3 кг                            │
│   Получено: [3]                             │
│   Статус: Доставлено полностью              │
│                                             │
│ [+ Добавить доп. товар]  [Сохранить]       │
└─────────────────────────────────────────────┘
```

**Функции в режиме приёмки:**

#### ✅ Отметить полученное
- Checkbox для каждого товара
- Input поле для редактирования количества (если привезли не все)
- Автоматический расчет статуса:
  - `delivered` - если received_qty == ordered_qty
  - `partial` - если 0 < received_qty < ordered_qty
  - `not_delivered` - если received_qty == 0

#### ➕ Добавить доп. товар
- Кнопка "Добавить доп. товар"
- Модальное окно с выбором товара из master_products
- Input для количества
- При добавлении: сохранить в `extra_items_delivered`

#### 💾 Сохранить приёмку
- Обновить `delivery_tracking` с новыми значениями
- Сохранить изменения в БД (POST `/orders/update_delivery`)
- Показать confirmation: "✅ Приёмка сохранена"

---

### 3️⃣ Множественные приёмки (дозаказы)

**Сценарий:** Поставщик привез товар в несколько этапов

**Реализация:**
- После первой приёмки кнопка "Получено, но может быть еще" (остаться в режиме приёмки)
- При повторной приёмке: можно снова редактировать количество
- Версионирование приёмок (опционально):
  - `delivery_events`: Array[{date, items_received, qty_changes}]

---

### 4️⃣ Отправка в архив

**Когда:** Снабженец считает, что приёмка завершена

**Условия архивирования:**
- ✅ Можно в архив в ЛЮ­БОЙ момент
- ✅ Даже если что-то не привезли
- ✅ Можно после первого привоза (без ожидания остальных товаров)

**Кнопка "Отправить в архив":**
- Условия: заказ должен быть в статусе `waiting_snabjenec_receive` или позже
- При клике: `status = archived`
- Отправить на финансиста для финальной проверки

---

## 📊 Функциональность Финансиста (FinancierDetailView)

### Новый режим: "Итоговый отчет по доставкам"

**Содержание:**

#### 1. Сводка по товарам (уровень товара)

```
📦 ТОВАРЫ: Что привезли / Не привезли

ПРИВЕЗЛИ:
┌─────────────────────────┐
│ Помидоры                │
│ Заказано: 10 кг         │
│ Привезено: 8 кг         │
│ Статус: Частично        │
│ Цена: 1200 UZS/кг       │
└─────────────────────────┘

НЕ ПРИВЕЗЛИ:
┌─────────────────────────┐
│ Огурцы                  │
│ Заказано: 5 кг          │
│ Привезено: 0 кг         │
│ Статус: Не поступило    │
│ Цена: 800 UZS/кг        │
└─────────────────────────┘
```

#### 2. Сводка по заказам (уровень заказа)

```
📋 ЗАКАЗЫ: Статус выполнения

ЗАКАЗ #1 (2026-04-18)
├─ Помидоры: 8/10 кг ✓ (80%)
├─ Огурцы: 0/5 кг ✗ (0%)
├─ Лук: 3/3 кг ✓ (100%)
└─ Итого: 11/18 кг (61%)

ЗАКАЗ #2 (2026-04-19)
├─ Сыр: 2/2 кг ✓ (100%)
└─ Итого: 2/2 кг (100%)
```

---

## 🔌 API endpoints

### Backend (FastAPI)

#### 1. Обновление дат и флагов

```python
POST /orders/{order_id}/mark_supplier_received
Request:
{
  "received_date": "2026-04-18"  # DD.MM.YYYY
}
Response:
{
  "status": "success",
  "order_id": 1,
  "supplier_responded": true,
  "received_from_supplier_at": "2026-04-18T10:00:00"
}
```

#### 2. Обновление приёмки товаров

```python
POST /orders/{order_id}/update_delivery
Request:
{
  "delivery_tracking": {
    "1": {"ordered_qty": 10, "received_qty": 8, "status": "partial"},
    "2": {"ordered_qty": 5, "received_qty": 0, "status": "not_delivered"},
    "3": {"ordered_qty": 3, "received_qty": 3, "status": "delivered"}
  },
  "extra_items": {
    "4": 5  # product_id: quantity
  }
}
Response:
{
  "status": "success",
  "message": "Приёмка обновлена"
}
```

#### 3. Отправить в архив (из Snabjenec)

```python
POST /orders/{order_id}/archive
Request:
{
  "archived_by": "snabjenec"
}
Response:
{
  "status": "success",
  "order_id": 1,
  "status": "archived"
}
```

#### 4. Получить отчет финансиста

```python
GET /orders/financier/delivery_report?branch={branch}
Response:
{
  "summary": {
    "total_orders": 5,
    "total_items_ordered": 25,
    "total_items_received": 22,
    "completion_rate": "88%"
  },
  "by_items": [
    {
      "product_id": 1,
      "product_name": "Помидоры",
      "unit": "кг",
      "ordered_qty": 30,
      "received_qty": 25,
      "status": "partial"
    }
  ],
  "by_orders": [
    {
      "order_id": 1,
      "created_at": "2026-04-18",
      "items": [...],
      "completion_rate": "80%"
    }
  ]
}
```

#### 5. Получить все заказы для Financier Desktop

```python
GET /orders/financier/all?branch={branch}&status={status}&limit={limit}&offset={offset}
Query Params:
  - branch: строка (филиал)
  - status: comma-separated (sent_to_supplier,waiting_snabjenec_receive,sent_to_financier)
  - snabjenec_id: опционально
  - created_from: опционально (ISO date)
  - created_to: опционально (ISO date)
  - min_completion: опционально (0-100)
  - max_completion: опционально (0-100)
  - sort: created_desc, completion_asc, completion_desc
  - limit: 10-100 (default 20)
  - offset: 0

Response:
{
  "total": 47,
  "orders": [
    {
      "id": 1,
      "created_at": "2026-04-18T10:00:00",
      "status": "waiting_snabjenec_receive",
      "snabjenec_name": "Ахрор",
      "total_items_ordered": 10,
      "total_items_received": 8,
      "completion_rate": 80,
      "sent_to_supplier_at": "2026-04-18T10:00:00",
      "received_from_supplier_at": "2026-04-19T11:00:00",
      "extra_items_count": 1,
      "archived_at": null
    }
  ]
}
```

#### 6. Получить детали заказа для Financier

```python
GET /orders/{order_id}/financier/details
Response:
{
  "order": {
    "id": 1,
    "created_at": "2026-04-18",
    "status": "waiting_snabjenec_receive",
    "snabjenec_name": "Ахрор"
  },
  "delivery": {
    "sent_to_supplier_at": "2026-04-18",
    "received_from_supplier_at": "2026-04-19",
    "completion_rate": "80%"
  },
  "delivered_items": [
    {
      "product_id": 1,
      "product_name": "Помидоры",
      "unit": "кг",
      "ordered_qty": 10,
      "received_qty": 8,
      "status": "partial"
    }
  ],
  "not_delivered_items": [
    {
      "product_id": 2,
      "product_name": "Огурцы",
      "unit": "кг",
      "ordered_qty": 5,
      "received_qty": 0,
      "status": "not_delivered"
    }
  ],
  "extra_items": [
    {
      "product_id": 7,
      "product_name": "Петрушка",
      "unit": "пучок",
      "qty": 1
    }
  ]
}
```

#### 7. Получить статистику для Financier Desktop

```python
GET /orders/financier/statistics?branch={branch}&period={period}&from={from}&to={to}
Query Params:
  - branch: строка
  - period: week, month, quarter, year, custom
  - from: ISO date (если custom)
  - to: ISO date (если custom)

Response:
{
  "summary": {
    "total_orders": 50,
    "fully_delivered": 40,
    "partially_delivered": 8,
    "not_delivered": 2,
    "average_completion_rate": 85.5
  },
  "by_snabjenec": [
    {
      "snabjenec_id": 1,
      "snabjenec_name": "Ахрор",
      "total_orders": 15,
      "average_completion_rate": 92
    }
  ],
  "delivery_timeline": [
    {
      "date": "2026-04-01",
      "orders_count": 5,
      "average_completion_rate": 85
    }
  ],
  "metrics": {
    "fulfillment_rate": 85.5,
    "average_delivery_days": 2.3,
    "non_delivery_count": 45,
    "extra_items_percentage": 3.2
  }
}
```

#### 8. Получить архивированные заказы

```python
GET /orders/financier/archive?branch={branch}&limit={limit}&offset={offset}
Query Params:
  - branch: строка
  - from: опционально
  - to: опционально
  - snabjenec_id: опционально
  - sort: archived_desc (по дате архивирования)

Response:
{
  "total": 45,
  "archived_orders": [
    {
      "id": 1,
      "created_at": "2026-04-10",
      "archived_at": "2026-04-15",
      "archived_by": "snabjenec",
      "snabjenec_name": "Ахрор",
      "completion_rate": 80
    }
  ]
}
```

---

## 📱 UI/UX изменения

### SnabjenecDetailView (мобильная версия)

**Текущая структура:**
```
[Статус заказа] → [Дата доставки] → [Редактирование товаров]
```

**Новая структура:**
```
[Статус заказа] 
  ↓
[Отметить дату получения от поставщика] (если sent_to_supplier)
  ↓
[Режим приёмки товаров] (если supplier_responded)
  ├─ Список товаров с чекбоксами
  ├─ Input поля для редактирования кол-ва
  ├─ [Добавить доп. товар]
  └─ [Сохранить приёмку]
  ↓
[Отправить в архив]
```

### FinancierDetailView (мобильная версия)

**Добавить новую вкладку:**
```
[Все заказы] [Детали приёмки] ← НОВАЯ ВКЛАДКА
```

**Вкладка "Детали приёмки":**
- Два раздела: "Привезли" / "Не привезли"
- Таблица с колонками: Товар | Заказано | Получено | % | Статус
- Графики доставки по товарам и заказам

---

## 🖥️ Архитектура Financier Desktop

### Структура файлов

```
frontend/src/
├── app/
│   ├── App.tsx (обновить с новым маршрутом /financier)
│   ├── pages/
│   │   ├── FinancierDesktop.tsx (entry point)
│   │   └── (существующие страницы остаются)
│   │
│   └── components/
│       ├── financierDesktop/
│       │   ├── Layout.tsx (sidebar + main content)
│       │   ├── Navigation.tsx (tabs: Заявки / Архив / Статистика)
│       │   │
│       │   ├── RequestsTab/
│       │   │   ├── RequestsTable.tsx (основная таблица)
│       │   │   ├── RequestsFilters.tsx (фильтры и поиск)
│       │   │   ├── SummaryCards.tsx (Всего / На приемке / Готовых / %)
│       │   │   ├── RequestDetailModal.tsx (детали заказа)
│       │   │   └── ExportButton.tsx
│       │   │
│       │   ├── ArchiveTab/
│       │   │   ├── ArchiveTable.tsx
│       │   │   ├── ArchiveFilters.tsx
│       │   │   ├── ArchiveSummaryCards.tsx
│       │   │   └── ArchiveDetailView.tsx
│       │   │
│       │   └── StatisticsTab/
│       │       ├── StatisticsSummary.tsx (карточка)
│       │       ├── SnabjenecRatings.tsx (таблица)
│       │       ├── DeliveryChart.tsx (график)
│       │       ├── MetricsCards.tsx (5 метрик)
│       │       ├── PeriodSelector.tsx
│       │       └── ExportStatistics.tsx
│       │
│       └── (существующие компоненты остаются)
│
└── lib/
    └── api.ts (обновить с новыми endpoints)
```

### Компоненты для разработки

#### 1. FinancierDesktop.tsx (Entry Point)
```typescript
// Главный компонент для /financier маршрута
// Загружает заказы, управляет состоянием вкладок
// Кэширует данные для производительности
```

#### 2. Layout.tsx
```typescript
// Сайдбар (слева) + Content Area (справа)
// Логотип, профиль, выход
// Три основные вкладки
```

#### 3. RequestsTable.tsx
```typescript
// Таблица с фиксированным header (sticky)
// Сортируемые колонки
// Строки с hover эффектом
// Progress bar для % доставки
// Клик → открыть детали
```

#### 4. RequestDetailModal.tsx
```typescript
// Модальное окно с тремя секциями
// Привезли (зеленая таблица)
// Не привезли (красная таблица)
// Доп. товары (желтая таблица)
```

#### 5. StatisticsSummary.tsx
```typescript
// Карточка с 4 метриками
// Прогресс бары
// Цветные индикаторы
```

#### 6. DeliveryChart.tsx
```typescript
// Используем Recharts (уже в проекте)
// Линейный график по дням
// Tooltip с информацией
```

### Стилизация

```
- Используем Tailwind CSS 4 (уже есть в проекте)
- Radix UI компоненты для модалей, дропдаунов
- Lucide Icons для иконок
- Custom CSS для специфических элементов
```

### Responsive

- Desktop First подход
- Минимум 1280px ширина
- Не адаптировать для мобилей (только desktop)
- При меньшей ширине показать сообщение "Требуется большой экран"

---

## 📄 ЭКСПОРТ В ШАБЛОН ДОКУМЕНТА (⭐ КЛЮЧЕВАЯ ФУНКЦИЯ)

### Концепция

Финансист может экспортировать полный отчет о доставке в готовый документ (DOCX/PDF шаблон) с автоматическим заполнением данных о продуктах.

**Сценарий использования:**
1. Финансист выбирает заказ в детальном виде
2. Нажимает кнопку "Экспорт в документ"
3. Выбирает загруженный шаблон
4. Система заполняет шаблон данными
5. Скачивает готовый документ (DOCX или PDF)

---

### Шаблон документа (DOCX) - РЕАЛЬНЫЙ ФОРМАТ

**Ваш текущий шаблон:**

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          Акт приема-передачи Продуктов для Кухни № ____  ║
║                                                            ║
║          Дата: « __ » _____________ 2026 г Время: ______  ║
║                                                            ║
║          LAND Филиал: _____________________________        ║
║          (или SCHOOL Филиал для второго варианта)         ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║  No │ Наименование товара     │ Ед.  │ Кол-во │ Кол-во    ║
║     │                         │ изм. │ Заказа │ Принял    ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  🥛 Молочные продукты и жиры                              ║
║                                                            ║
║  1  │ Молоко (Sut)            │ л    │ {{ordered_1}} │ {{received_1}} ║
║  2  │ Кефир (Kefir)           │ л    │ {{ordered_2}} │ {{received_2}} ║
║  3  │ Сметана (Smetana)       │ кг   │ {{ordered_3}} │ {{received_3}} ║
║  4  │ Творог (Tvorog)         │ кг   │ {{ordered_4}} │ {{received_4}} ║
║  5  │ Кайма (Qaymoq)          │ кг   │ {{ordered_5}} │ {{received_5}} ║
║  ... (остальные товары по категориям)                    ║
║                                                            ║
║  🥚 Яйца                                                   ║
║                                                            ║
║  17 │ Яйца куриные (Tovuq)    │ дюж. │ {{ordered_17}}│ {{received_17}}║
║  18 │ Яйца перепелиные        │ дюж. │ {{ordered_18}}│ {{received_18}}║
║                                                            ║
║  ... (остальные категории)                                ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  ИТОГО товаров:          Заказано: ___  Принято: ___     ║
║                                                            ║
║  Получатель: _____________________  Подпись: _______     ║
║                                                            ║
║  Передающий: _____________________  Подпись: _______     ║
║                                                            ║
║  Дата: _____________________                              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

**Две версии (как у вас):**
1. LAND Филиал версия (текущая)
2. SCHOOL Филиал версия (идентичная, но со словом SCHOOL)

---

### Переменные (Merge Fields) для шаблона - РЕАЛЬНЫЕ

```
ЗАГОЛОВОК ДОКУМЕНТА:
├─ {{order_id}} - Номер заказа (Кухни №)
├─ {{day}} - День (для даты « __ »)
├─ {{month_name}} - Месяц (словом)
├─ {{year}} - Год (2026)
├─ {{time}} - Время приёмки
└─ {{branch}} - Филиал (LAND или SCHOOL)

ДАННЫЕ ТОВАРОВ (по каждому товару в таблице):
├─ {{product_number}} - № в таблице (1, 2, 3...)
├─ {{product_name}} - Название товара (Молоко, Кефир и т.д.)
├─ {{product_name_latin}} - Название на латинице (Sut, Kefir)
├─ {{unit}} - Единица измерения (л, кг, дюж., шт и т.д.)
├─ {{ordered_qty}} - Кол-во Заказа (что было заказано)
├─ {{received_qty}} - Кол-во Принял (что пришло)
└─ {{category}} - Категория (Молочные, Яйца, Крупы и т.д.)

ИТОГИ:
├─ {{total_ordered}} - Всего заказано (сумма по Кол-во Заказа)
└─ {{total_received}} - Всего принято (сумма по Кол-во Принял)

ПОДПИСИ:
├─ {{recipient_name}} - Получатель (Снабженец)
├─ {{sender_name}} - Передающий (Финансист или Поставщик)
└─ {{signature_date}} - Дата подписания

ПРИМЕЧАНИЕ:
└─ {{completion_rate}} - % доставки (опционально, для информации)
```

**Структура для каждого товара в таблице:**
```
Позиция №1:  Молоко (Sut)
├─ Кол-во Заказа: {{ordered_qty_milk}}  например 10 л
├─ Кол-во Принял: {{received_qty_milk}} например 8 л
└─ Статус: Частичная доставка (вычисляется системой)

Позиция №2:  Кефир (Kefir)
├─ Кол-во Заказа: {{ordered_qty_kefir}}
├─ Кол-во Принял: {{received_qty_kefir}}
└─ Статус: (зависит от кол-ва)
```

---

### Управление шаблонами (Backend)

#### Загрузка шаблона
```python
POST /templates/upload
Request:
  - file: DOCX file (multipart)
  - template_name: "Отчет о приеме товаров"
  - description: "Шаблон для экспорта отчетов о доставке"

Response:
{
  "template_id": "template_1",
  "name": "Отчет о приеме товаров",
  "uploaded_at": "2026-04-18T10:00:00",
  "file_path": "templates/template_1.docx"
}
```

#### Список шаблонов
```python
GET /templates/list?role=financier
Response:
{
  "templates": [
    {
      "template_id": "template_1",
      "name": "Отчет о приеме товаров",
      "description": "...",
      "uploaded_at": "2026-04-18T10:00:00",
      "file_size": "45KB"
    }
  ]
}
```

#### Удаление шаблона
```python
DELETE /templates/{template_id}
Response:
{
  "status": "success",
  "message": "Шаблон удален"
}
```

#### Экспорт заказа в шаблон
```python
POST /orders/{order_id}/export/template
Request:
{
  "template_id": "template_1",
  "format": "docx"  # или "pdf"
}

Response:
{
  "file_path": "exports/order_1_report.docx",
  "download_url": "/api/download/exports/order_1_report.docx",
  "file_name": "order_1_report.docx"
}
```

---

### UI для управления шаблонами

#### В FinancierDesktop: новая вкладка "Настройки"

```
[Заявки] [Архив] [Статистика] [Настройки] ← НОВАЯ

НАСТРОЙКИ ДОКУМЕНТОВ
═══════════════════════════════════════════════

📄 ШАБЛОНЫ ДОКУМЕНТОВ

Загруженные шаблоны:
┌─────────────────────────────────────────┐
│ Отчет о приеме товаров                  │
│ Размер: 45 KB                           │
│ Загружен: 18.04.2026                    │
│ [Скачать] [Предпросмотр] [Удалить]    │
│                                         │
│ Отчет финансиста                        │
│ Размер: 32 KB                           │
│ Загружен: 15.04.2026                    │
│ [Скачать] [Предпросмотр] [Удалить]    │
└─────────────────────────────────────────┘

[+ Загрузить новый шаблон]

ℹ️ Поддерживаемые переменные:
{{order_id}}, {{snabjenec_name}}, {{branch}},
{{#delivered_items}}...{{/delivered_items}},
...
[Показать все переменные]
```

#### При клике на заказ: кнопка "Экспорт в документ"

```
ORDER #1 - ДЕТАЛЬНЫЙ ОТЧЕТ
═══════════════════════════════════════════════

[Экспорт в Excel] [Печать] [Экспорт в документ ▼]
                                      │
                                      ├─ Отчет о приеме товаров
                                      ├─ Отчет финансиста
                                      └─ [Управление шаблонами]
```

---

### Технологии для заполнения шаблонов

#### Backend (Python)

**Для DOCX:**
```python
# Использовать python-docx или docxtpl
from docxtpl import DocxTemplate

template = DocxTemplate("template.docx")
context = {
    'order_id': 1,
    'snabjenec_name': 'Ахрор',
    'delivered_items': [
        {'product_name': 'Помидоры', 'ordered_qty': 10, 'received_qty': 8, ...}
    ],
    'not_delivered_items': [...],
    'extra_items': [...]
}
template.render(context)
template.save("output.docx")
```

**Для PDF (опционально):**
```python
# Использовать reportlab или weasyprint
from weasyprint import HTML, CSS

html_content = render_template('report.html', context)
HTML(string=html_content).write_pdf("output.pdf")
```

#### Frontend

- Кнопка для выбора шаблона (dropdown)
- Модальное окно с выбором формата (DOCX / PDF)
- Показать loading при обработке
- Скачать готовый файл

---

### Хранение шаблонов

```
backend/
├── templates/
│   ├── template_1.docx (Отчет о приеме товаров)
│   └── template_2.docx (Отчет финансиста)
│
└── exports/
    ├── order_1_report.docx (временные файлы)
    └── order_2_report.docx
```

**Политика хранения:**
- Шаблоны: постоянно в /templates/
- Экспорты: удалять каждые 7 дней (временные)
- Максимум 5 шаблонов на систему

---

### API в БД

```sql
-- Таблица для шаблонов
CREATE TABLE templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(255) NOT NULL,
  file_size INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для истории экспортов (опционально)
CREATE TABLE export_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  template_id INTEGER,
  format VARCHAR(10),  -- 'docx', 'pdf', 'excel'
  file_name VARCHAR(255),
  exported_by VARCHAR(255),
  exported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (template_id) REFERENCES templates(id)
);
```

---

## 🖥️ Браузерная версия для Финансиста (Desktop Only)

### 📍 Отдельный URL/Маршрут

```
Текущий Financier (мобильный): /app?role=financier
Новый Desktop Financier: /financier или /financier/dashboard
```

### 🎨 Макет страницы

```
┌─────────────────────────────────────────────────────────────────┐
│  ФИНАНСИСТ DASHBOARD                           [Выход] [⚙️]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Заявки]  [Архив]  [Статистика]                               │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    ЗАЯВКИ (АКТИВНЫЕ)                       │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ ID │ Дата  │ Статус │ Снабженец │ Товаров │ % Доставки   │ │
│  ├────┼───────┼────────┼───────────┼─────────┼─────────────┤ │
│  │ #1 │ 18.04 │ Приемка│ Ахрор    │ 8/10   │ 80% ▓▓▓▓░░   │ │
│  │ #2 │ 19.04 │ Финанс│ Улугбек  │ 3/3    │ 100% ▓▓▓▓▓▓ │ │
│  │ #3 │ 20.04 │ Приемка│ Фарход   │ 5/7    │ 71% ▓▓▓░░░   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 📑 ВКЛ. 1: ЗАЯВКИ (REQUESTS)

**Содержание:** Активные и незавершённые заказы

#### Таблица Заявок
```
Колонки:
├─ № Заказа (Order ID)
├─ Дата создания
├─ Статус
│  ├─ 🔵 Создана (created)
│  ├─ 🟡 На приемке (in_receiving)
│  ├─ 🟠 На финансировании (review)
│  └─ 🟢 Готова (ready)
├─ Имя Снабженца
├─ Кол-во товаров (заказано)
├─ % Доставки (визуальный бар)
│  └─ Привезли / Заказано
├─ Дата отправки поставщику
├─ Дата получения от поставщика
└─ [Actions] - Открыть детали
```

#### Фильтры и сортировка
```
Фильтры:
├─ По статусу (dropdown)
├─ По Снабженцу (dropdown)
├─ По дате (от/до)
├─ По % доставки (< 50% | 50-80% | > 80%)
└─ [Очистить фильтры]

Сортировка:
├─ По дате (новые/старые)
├─ По % доставки (по возрастанию)
└─ По ID заказа
```

#### Быстрые статистики (Summary Cards)
```
┌─────────────┬──────────────┬──────────────┬──────────────┐
│ Всего       │ На приемке   │ Готовых      │ Среднее %    │
│ заявок: 12  │ 5            │ 4            │ доставки: 82%│
└─────────────┴──────────────┴──────────────┴──────────────┘
```

---

### 📦 Клик на заказ → DETAIL VIEW

```
ORDER #1 - ДЕТАЛЬНЫЙ ОТЧЕТ
═══════════════════════════════════════════════════════════

📋 ИНФОРМАЦИЯ
├─ ID: #1
├─ Дата создания: 18.04.2026
├─ Снабженец: Ахрор
├─ Статус: Ожидание приёмки товаров
├─ Дата отправки поставщику: 18.04.2026
├─ Дата получения от поставщика: 19.04.2026
└─ Дата архивирования: -

📊 СТАТИСТИКА ДОСТАВКИ
├─ Всего товаров: 10
├─ Привезено: 8
├─ Не привезено: 2
├─ Привезено дополнительно: 1
└─ Процент доставки: 80%

🟢 ПРИВЕЗЛИ (8 товаров)
┌──────────────┬──────┬─────────┬──────┐
│ Товар        │ Ед.  │ Заказ.  │ Прив.│
├──────────────┼──────┼─────────┼──────┤
│ Помидоры     │ кг   │ 10      │ 8    │
│ Лук          │ шт   │ 5       │ 5    │
│ Чеснок       │ кг   │ 2       │ 2    │
└──────────────┴──────┴─────────┴──────┘

🔴 НЕ ПРИВЕЗЛИ (2 товара)
┌──────────────┬──────┬─────────┐
│ Товар        │ Ед.  │ Заказ.  │
├──────────────┼──────┼─────────┤
│ Огурцы       │ кг   │ 5       │
│ Укроп        │ пучок│ 3       │
└──────────────┴──────┴─────────┘

⭐ ПРИВЕЗЛИ ДОПОЛНИТЕЛЬНО (1 товар)
┌──────────────┬──────┬─────────┐
│ Товар        │ Ед.  │ Кол-во  │
├──────────────┼──────┼─────────┤
│ Петрушка     │ пучок│ 1       │
└──────────────┴──────┴─────────┘

[↩ Назад] [🔄 Обновить] [Экспорт в Excel] [Печать]
```

---

### 📑 ВКЛ. 2: АРХИВ (ARCHIVE)

**Содержание:** Завершённые (архивированные) заказы

#### Таблица Архива
```
Колонки (аналогично Заявкам, плюс):
├─ ... (все как в Заявках)
├─ Дата архивирования
├─ Архивирован кем (Снабженец / Финансист)
└─ [View] - Посмотреть финальный отчет
```

#### Функции
```
├─ Поиск по ID заказа
├─ Фильтр по дате архивирования
├─ Фильтр по % доставки
├─ Сортировка (новые/старые)
└─ Экспорт в Excel (все архивы или выбранные)
```

#### Быстрые статистики (Summary)
```
┌──────────────┬──────────────┬─────────────────┐
│ Всего        │ Среднее %    │ Последняя дата  │
│ архивов: 45  │ доставки: 85%│ 15.04.2026      │
└──────────────┴──────────────┴─────────────────┘
```

---

### 📊 ВКЛ. 3: СТАТИСТИКА (STATISTICS)

#### Графики и метрики

```
┌─────────────────────────────────────────────┐
│ 📈 СТАТИСТИКА ПО ДОСТАВКАМ               │
├─────────────────────────────────────────────┤
│                                             │
│ Общая статистика (месяц):                  │
│ ┌─────────────────────────────────────────┐
│ │ Всего заказов: 50                       │
│ │ Полностью доставлено: 40 (80%)  ███░   │
│ │ Частично доставлено: 8 (16%)    ██░░   │
│ │ Не доставлено: 2 (4%)           ░░░░   │
│ └─────────────────────────────────────────┘
│
│ По Снабженцам (таблица):
│ ┌──────────┬───────┬────────┬──────┐
│ │ Снабженец│ Заказ.│ Приемка│ %    │
│ ├──────────┼───────┼────────┼──────┤
│ │ Ахрор    │ 15    │ 15     │ 100% │
│ │ Улугбек  │ 12    │ 10     │ 83%  │
│ │ Фарход   │ 18    │ 15     │ 83%  │
│ │ Мирали   │ 5     │ 5      │ 100% │
│ └──────────┴───────┴────────┴──────┘
│
│ График доставок по дням (20 дней):
│ │
│ │        ╱╲
│ │      ╱  ╲    ╱╲
│ │    ╱    ╲  ╱  ╲
│ │  ╱      ╲╱    ╲
│ └─────────────────────────────────
│   01    05   10   15   20
│
│ [Период] [Экспорт PDF] [Печать]
└─────────────────────────────────────────────┘
```

#### Детальная статистика

**Метрики:**
```
1️⃣ Коэффициент доставки (Fulfillment Rate)
   Формула: (Привезено / Заказано) × 100%
   Цель: > 95%

2️⃣ Среднее время доставки
   От даты отправки до даты приемки
   Среднее: 2-3 дня

3️⃣ Частота недопоставок
   Кол-во товаров, которые не привезли
   Нужно минимизировать

4️⃣ Дополнительные поставки
   Товары, которые привезли без заказа
   Процент от заказа

5️⃣ Эффективность по Снабженцам
   Рейтинг Снабженцов по % доставки
```

**Периоды анализа:**
```
├─ Неделя
├─ Месяц
├─ Квартал
├─ Год
└─ Кастомный период
```

---

### 🌐 Интеграция с мобильной версией

**Текущая Financier (мобильная):**
- Остается в /app?role=financier
- Для телефона
- Упрощённый интерфейс

**Новая Financier (браузер):**
- /financier (новый маршрут)
- Для компьютера (desktop only)
- Расширенные возможности

**Синхронизация данных:**
- Оба интерфейса используют один API
- Данные обновляются в реальном времени
- Можно открыть оба одновременно

---

---

## 🗄️ Миграция БД

```sql
-- 1. Добавить новые колонки к orders
ALTER TABLE orders ADD COLUMN (
  sent_to_supplier_at DATETIME,
  received_from_supplier_at DATETIME,
  delivery_tracking JSON DEFAULT '{}',
  supplier_responded BOOLEAN DEFAULT FALSE,
  extra_items_delivered JSON DEFAULT '{}'
);

-- 2. Создать индексы для performance
CREATE INDEX idx_orders_supplier_responded ON orders(supplier_responded);
CREATE INDEX idx_orders_status_delivery ON orders(status, delivery_tracking);

-- 3. (Опционально) Создать таблицу delivery_events для истории приёмок
CREATE TABLE delivery_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  event_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  event_type TEXT,  -- 'initial', 'partial', 'correction'
  delivery_snapshot JSON,
  created_by TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

---

## 📝 Чек-лист реализации

> **Последнее обновление:** 2026-04-18 — ветка `feature/delivery-tracking`

### Backend
- [x] Добавить миграцию БД (новые поля в orders) — `backend/app/database.py`
- [x] Создать таблицы для шаблонов и истории экспортов — `backend/app/database.py`
- [x] Реализовать `POST /orders/{order_id}/mark_supplier_received` — `backend/app/api.py`
- [x] Реализовать `POST /orders/{order_id}/update_delivery` — `backend/app/api.py`
- [x] Реализовать `POST /orders/{order_id}/archive` (для snabjenec) — `backend/app/api.py`
- [x] Реализовать `GET /orders/financier/delivery_report` — `backend/app/api.py`
- [x] **Реализовать `POST /templates/upload` (загрузка шаблона)** — `backend/app/api.py`
- [x] **Реализовать `GET /templates/list` (список шаблонов)** — `backend/app/api.py`
- [x] **Реализовать `DELETE /templates/{template_id}` (удаление)** — `backend/app/api.py`
- [x] **Реализовать `POST /orders/{order_id}/export/template` (экспорт в шаблон)** — `backend/app/api.py`
- [x] Добавить зависимость `docxtpl` в requirements.txt — `backend/requirements.txt`
- [x] Обновить CRUD операции для новых полей — `backend/app/crud.py` (12 новых функций)
- [x] Реализовать логику заполнения шаблона данными — `backend/app/export.py` (новый файл)
- [x] Настроить хранилище для шаблонов и экспортов — `backend/templates/`, `backend/exports/`

### Frontend (Мобильная версия - Snabjenec)
- [x] SnabjenecDetailView: добавить UI для отметки дат — режим `sent_to_supplier`
- [x] SnabjenecDetailView: реализовать режим приёмки товаров — `isDeliveryTrackingMode`
- [x] SnabjenecDetailView: checkboxes + input поля для кол-ва — `renderDeliveryTrackingCard`
- [x] SnabjenecDetailView: функция "Добавить доп. товар" — модальное окно + `ExtraItemRow`
- [x] SnabjenecDetailView: кнопка "Отправить в архив" — `handleArchive` → `POST /archive`

### Frontend (Браузерная версия - Financier Desktop)
#### Структура
- [x] Создать новый маршрут `/financier` — `frontend/src/main.tsx`
- [x] Создать layout для desktop версии — `FinancierDesktop.tsx` (header + nav + main)
- [x] Создать routing для вкладок (Заявки / Архив / Статистика / Настройки) — tab state
- [x] Обновить API клиент в `lib/api.ts` новыми endpoints — все новые функции добавлены

#### Вкладка "Заявки" (Requests)
- [x] Таблица активных заказов с колонками — `RequestsTable.tsx`
- [x] Фильтры (по статусу, филиалу) — `RequestsFilters.tsx`
- [x] Сортировка (по дате, % доставки, ID) — в `RequestsTable.tsx`
- [x] Summary cards (Всего / На приёмке / Готовых / Среднее %) — `SummaryCards.tsx`
- [x] Клик на заказ → Detail View с 3 секциями (Привезли/Не привезли/Доп.) — `RequestDetailModal.tsx`
- [ ] Export в Excel (выбранные или все) — не реализовано
- [ ] Pagination (если много заказов) — не реализовано (limit=100)

#### Вкладка "Архив" (Archive)
- [x] Таблица архивированных заказов — `ArchiveTable.tsx`
- [ ] Фильтры (по дате архивирования, % доставки) — не реализовано
- [x] Summary cards для архива — 3 карточки (всего / среднее % / последняя дата)
- [ ] Search по ID заказа — не реализовано
- [x] View final report — клик на заказ открывает `RequestDetailModal`
- [ ] Export архива в Excel — не реализовано

#### Вкладка "Статистика" (Statistics)
- [x] Карточка "Общая статистика" (всего / полностью / частично / не доставлено) — `statistics` tab
- [ ] Таблица "По Снабженцам" с рейтингом — не реализовано (нет данных snabjenec_name в API)
- [x] График доставок по дням (линейный график) — `DeliveryChart.tsx` (Recharts)
- [ ] 5 метрик (Fulfillment Rate, среднее время, недопоставки, доп. товары, рейтинг) — частично
- [ ] Выбор периода (неделя / месяц / квартал / год / кастомный) — не реализовано
- [ ] Export статистики в PDF/Excel — не реализовано
- [ ] Печать отчета — не реализовано

#### Мобильная версия Financier
- [ ] FinancierDetailView: новая вкладка "Детали приёмки" — не реализовано
- [ ] FinancierDetailView: два раздела (привезли/не привезли) — не реализовано
- [ ] FinancierDetailView: таблицы с товарами и заказами — не реализовано
- [x] Сохранить мобильный интерфейс как есть (/app?role=financier) — не тронуто

#### Экспорт в шаблоны документов (⭐ КЛЮЧЕВАЯ ФУНКЦИЯ)
- [x] Backend: создать endpoints для управления шаблонами
  - [x] POST /templates/upload (загрузка шаблона)
  - [x] GET /templates/list (список шаблонов)
  - [x] DELETE /templates/{template_id} (удаление)
  - [x] POST /orders/{order_id}/export/template (экспорт в шаблон)
- [x] Backend: интеграция с docxtpl для заполнения DOCX — `backend/app/export.py`
- [x] Backend: таблицы в БД для шаблонов и истории — `templates`, `export_history`
- [x] Frontend: новая вкладка "Настройки" в FinancierDesktop — `SettingsTab/`
- [x] Frontend: UI для загрузки/управления шаблонами — `TemplateManager.tsx`
- [x] Frontend: кнопка "Экспорт в документ" в деталях заказа — в `RequestDetailModal.tsx`
- [x] Frontend: модальное окно для выбора шаблона и формата — выбор через select
- [x] Frontend: скачивание готового документа — `URL.createObjectURL` + `<a>.click()`
- [ ] Тестирование: заполнение шаблона с реальными данными — требует ручного теста

### Тестирование
- [ ] Проверить workflow: sent_to_supplier → mark_received → delivery_tracking
- [ ] Проверить редактирование кол-ва товаров
- [ ] Проверить добавление доп. товаров
- [ ] Проверить архивирование из snabjenec
- [ ] Проверить отчет финансиста
- [ ] Проверить валидацию данных
- [ ] Проверить экспорт в шаблон DOCX
  - [ ] Все переменные заполнены корректно
  - [ ] Таблицы заполнены правильно
  - [ ] Условные блоки работают
- [ ] Проверить экспорт в PDF (если реализуется)
- [ ] Проверить скачивание готового документа
- [ ] Проверить управление шаблонами (upload/delete)
- [ ] Проверить историю экспортов

### 🚧 Что осталось сделать (Фаза 2)
- [ ] Таблица "По Снабженцам" в статистике (нужен `snabjenec_name` в orders или join с users)
- [ ] Фильтры для Архива (дата, % доставки)
- [ ] Поиск по ID в Архиве
- [ ] Pagination в таблицах (сейчас limit=100)
- [ ] Export в Excel (frontend → xlsx)
- [ ] Выбор периода для статистики
- [ ] Мобильный FinancierDetailView: вкладка "Детали приёмки"
- [ ] Ручное тестирование DOCX экспорта с реальным шаблоном

---

## 📚 Примеры данных

### Пример delivery_tracking:
```json
{
  "1": {
    "ordered_qty": 10,
    "received_qty": 8,
    "status": "partial"
  },
  "2": {
    "ordered_qty": 5,
    "received_qty": 0,
    "status": "not_delivered"
  },
  "3": {
    "ordered_qty": 3,
    "received_qty": 3,
    "status": "delivered"
  }
}
```

### Пример extra_items_delivered:
```json
{
  "4": 5,
  "7": 2
}
```

---

## 🔗 Маршрутизация (Routing)

### Текущая архитектура
```
/app
├─ ?role=chef → ChefView
├─ ?role=snabjenec → SnabjenecListView/SnabjenecDetailView
├─ ?role=financier → FinancierListView/FinancierDetailView (мобильная)
├─ ?role=supplier → SupplierView
└─ ?branch={branch}&language={language}
```

### Новая маршрутизация
```
/financier ← НОВЫЙ МАРШРУТ (браузерная версия)
├─ /financier/requests (Заявки)
├─ /financier/archive (Архив)
├─ /financier/statistics (Статистика)
└─ Автоматическое определение branch из user context

/app (существующая)
├─ ... (остается как есть для мобильных)
└─ ?role=financier → FinancierListView (мобильная версия)
```

### Логика маршрутизации

**При заходе финансиста в приложение:**
1. Если с мобилки (userAgent mobile) → /app?role=financier
2. Если с компьютера (desktop) → /financier
3. Или добавить кнопку "Открыть desktop версию"

**Пример в App.tsx:**
```typescript
const isDesktop = window.innerWidth >= 1280 && 
                  !isMobileDevice(navigator.userAgent);

if (role === 'financier' && isDesktop) {
  return <Navigate to="/financier" />;
}
```

---

## 🔐 Безопасность

- ✅ Снабженец может редактировать только свои заказы (по branch)
- ✅ Финансист может видеть все заказы его отделения
- ✅ Валидация кол-ва товаров (не может быть отрицательным)
- ✅ Audit логирование: кто и когда изменил delivery_tracking
- ✅ Desktop версия финансиста требует аутентификации
- ✅ CORS проверки для API endpoints
- ✅ Rate limiting на API (если тяжелые запросы)

---

## 📊 Сравнение версий Финансиста

| Функция | Мобильная (/app) | Desktop (/financier) |
|---------|-----------------|---------------------|
| Просмотр заказов | ✅ | ✅ |
| Детали приёмки | ✅ (в вкладке) | ✅ (в модали) |
| Таблица товаров | ✅ Компактная | ✅ Развёрнутая |
| Фильтры | ❌ | ✅ Расширенные |
| Статистика | ❌ | ✅ Подробная |
| Графики | ❌ | ✅ Recharts |
| Архив | ❌ | ✅ Отдельная вкладка |
| Экспорт Excel | ❌ | ✅ |
| PDF отчеты | ❌ | ✅ |
| Печать | ❌ | ✅ |
| Адаптивность | 📱 Mobile | 🖥️ Desktop only |

---

## 📋 Резюме изменений

### Что добавляется:
1. **Backend:**
   - 5 новых полей в БД (sent_to_supplier_at, received_from_supplier_at, delivery_tracking, supplier_responded, extra_items_delivered)
   - 8 новых API endpoints для доставок
   - 4 новых API endpoints для шаблонов и экспорта ⭐
   - Логика отслеживания доставок
   - Логика заполнения шаблонов документов (DOCX) ⭐
   - Таблицы для хранения шаблонов и истории экспортов

2. **Frontend (Мобильная - Snabjenec):**
   - Отметка даты получения от поставщика
   - Режим приёмки товаров с checkboxes
   - Редактирование кол-ва привезённых товаров
   - Добавление дополнительных товаров
   - Архивирование заказов

3. **Frontend (Desktop - Financier):**
   - Полностью новый интерфейс в браузере
   - Три основные вкладки (Заявки / Архив / Статистика)
   - Новая вкладка "Настройки" для управления шаблонами ⭐
   - Таблицы с фильтрами и сортировкой
   - Графики доставок
   - **Экспорт в готовый документ (DOCX) с автоматическим заполнением ⭐**
   - Детальные отчеты

### Что НЕ изменяется:
- Существующая мобильная версия финансиста (/app?role=financier)
- Текущие статусы заказов (добавляем только флаги)
- Chef и Supplier интерфейсы
- Telegram Bot интеграция

---

## 🎯 Приоритет разработки

### Фаза 1 (MVP - 1.5 недели) ⭐ ПРИОРИТЕТ
1. ✅ Миграция БД (новые поля)
2. ✅ Backend endpoints (4 основных + 4 для шаблонов)
3. ✅ SnabjenecDetailView (режим приёмки)
4. ✅ FinancierDesktop Layout + Requests Tab
5. ✅ **Экспорт в шаблон документа (DOCX с заполнением)**

### Фаза 2 (улучшения - 1 неделя)
1. ✅ Archive Tab
2. ✅ Statistics Tab с графиками
3. ✅ Фильтры и сортировка
4. ✅ Настройки (управление шаблонами)
5. ✅ Тестирование и баг-фиксы

### Фаза 3 (полировка - несколько дней)
1. ✅ Экспорт в PDF (опционально, если DOCX достаточно)
2. ✅ Оптимизация performance
3. ✅ Документация для пользователей
4. ✅ Обучение финансистов

---

---

## 📋 Примеры данных для реального документа

### Пример JSON для товаров (delivery_tracking):

```json
{
  "order_id": "12345",
  "branch": "LAND",
  "day": "18",
  "month_name": "Апреля",
  "year": "2026",
  "time": "10:30",
  "recipient_name": "Ахрор Саидов",
  "sender_name": "Поставщик ООО",
  "completion_rate": "82%",
  "total_ordered": 25,
  "total_received": 21,
  
  "items_by_category": {
    "Молочные продукты и жиры": [
      {
        "number": 1,
        "product_name": "Молоко (Sut)",
        "ordered_qty": 10,
        "received_qty": 8,
        "unit": "л",
        "status": "partial"
      },
      {
        "number": 2,
        "product_name": "Кефир (Kefir)",
        "ordered_qty": 5,
        "received_qty": 5,
        "unit": "л",
        "status": "delivered"
      }
    ],
    "Яйца": [
      {
        "number": 17,
        "product_name": "Яйца куриные (Tovuq tuxumi)",
        "ordered_qty": 5,
        "received_qty": 5,
        "unit": "дюж.",
        "status": "delivered"
      }
    ]
  },
  
  "extra_items": [
    {
      "product_name": "Маргарин 'Шедров лето'",
      "qty": 2,
      "unit": "кг"
    }
  ]
}
```

### Результат в документе:

```
Акт приема-передачи Продуктов для Кухни № 12345

Дата: « 18 » Апреля 2026 г Время: 10:30

LAND Филиал: _____________________________

No │ Наименование товара     │ Ед.  │ Кол-во │ Кол-во
   │                         │ изм. │ Заказа │ Принял
───┼─────────────────────────┼──────┼────────┼────────

   🥛 Молочные продукты и жиры

1  │ Молоко (Sut)            │ л    │   10   │   8
2  │ Кефир (Kefir)           │ л    │   5    │   5

   🥚 Яйца

17 │ Яйца куриные (Tovuq)    │ дюж. │   5    │   5

───┼─────────────────────────┼──────┼────────┼────────
ИТОГО товаров:          Заказано: 25     Принято: 21

Получатель: Ахрор Саидов      Подпись: ___________

Передающий: Поставщик ООО     Подпись: ___________

Дата: 18.04.2026
```

---

## 📞 Контакты и вопросы

**По тех. вопросам:** salamovakhat130@gmail.com  
**Дата плана:** 2026-04-18  
**Версия API:** 1.1  
**Версия Frontend:** 2.0  
**Шаблон документа:** Акт приема-передачи Продуктов (LAND/SCHOOL филиалы)

---

**End of Specification**
