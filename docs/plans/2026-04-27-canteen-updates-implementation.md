# Canteen Bot Web App Updates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement product updates, UI improvements for the Chef, and branding consistency.

**Architecture:** Update the database seeding logic for new products and modify the frontend Stepper component to support 0.1 increments.

**Tech Stack:** FastAPI, React, SQLite, Lucide React.

---

### Task 1: Backend - Add New Products to Database

**Files:**
- Modify: `/Users/axat/Projects/Canteen-Bot-Web-app/backend/app/database.py`

**Step 1: Modify `migrate_products` function**
Add the following items to the `products` list:
```python
        ('91', 'Петрушка', '🥕 Овощи и зелень', 'пучки'),
        ('92', 'Зеленый лук', '🥕 Овощи и зелень', 'пучки'),
        ('93', 'Райхон', '🥕 Овощи и зелень', 'пучки')
```

**Step 2: Run migration script to update DB**
Run: `python3 backend/migrate_db.py`
Expected: Success message or no error, and products added/updated in `database.db`.

**Step 3: Verify with sqlite3**
Run: `sqlite3 backend/database.db "SELECT * FROM master_products WHERE id IN ('91', '92', '93');"`
Expected: 3 rows with the new products.

**Step 4: Commit**
```bash
git add backend/app/database.py
git commit -m "feat(backend): add parsley, green onion and basil to products"
```

---

### Task 2: Frontend - Update Stepper Step to 0.1

**Files:**
- Modify: `/Users/axat/Projects/Canteen-Bot-Web-app/frontend/src/app/components/ChefView.tsx`

**Step 1: Update Stepper component logic**
Change the increment/decrement step to 0.1 and use `toFixed(1)` to avoid floating point precision issues.
```tsx
// Around line 22
onClick={() => onChange(Math.max(0, Number((value - 0.1).toFixed(1))))}

// Around line 50
onClick={() => onChange(Number((value + 0.1).toFixed(1)))}
```

**Step 2: Verify in browser**
Use `read_browser_page` (or ask user to check) to verify that clicking + increases by 0.1.

**Step 3: Commit**
```bash
git add frontend/src/app/components/ChefView.tsx
git commit -m "feat(frontend): change stepper step to 0.1 for chef view"
```

---

### Task 3: Frontend - Verify Favicon and Branding

**Files:**
- Modify: `/Users/axat/Projects/Canteen-Bot-Web-app/frontend/index.html`

**Step 1: Ensure Favicon link is correct**
Check if `<link rel="icon" type="image/png" href="/favicon.png" />` is in the `<head>`.
(Already exists, but good to double check if any other tags interfere).

**Step 2: Verify favicon file existence**
Run: `ls -l frontend/public/favicon.png`
Expected: File exists and size is 6397 bytes.

**Step 3: Commit (if changes made)**
```bash
git add frontend/index.html
git commit -m "chore(frontend): verify favicon and branding"
```
