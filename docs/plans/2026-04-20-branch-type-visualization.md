# Branch Type Visualization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add visual badges and metadata to distinguish between Schools and Kindergartens (Land) in the Financier panel.

**Architecture:** Frontend-only update using Tailwind CSS for UI components. Simple string-based logic to determine branch type from ID suffixes (`_land` vs `_school`).

**Tech Stack:** React, Tailwind CSS, Lucide Icons.

---

### Task 1: Update RequestsTable.tsx with Branch Badges

**Files:**
- Modify: `frontend/src/app/components/financierDesktop/RequestsTab/RequestsTable.tsx`

**Step 1: Update Table Cell**
Modify the branch cell to include a badge.

```tsx
<td className="px-5 py-4 text-gray-600 text-sm flex items-center gap-2">
    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
        order.branch.includes('_land') ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
    }`}>
        {order.branch.includes('_land') ? 'Садик' : 'Школа'}
    </span>
    {BRANCH_LABELS[order.branch] ?? order.branch}
</td>
```

**Step 2: Run verification**
Check the table view.

**Step 3: Commit**

```bash
git add frontend/src/app/components/financierDesktop/RequestsTab/RequestsTable.tsx
git commit -m "ui: add branch type badges to requests table"
```

---

### Task 2: Update RequestDetailModal.tsx with Type Card

**Files:**
- Modify: `frontend/src/app/components/financierDesktop/RequestsTab/RequestDetailModal.tsx`

**Step 1: Update metadata grid**
Add the fourth card.

```tsx
{/* Meta */}
<div className="grid grid-cols-4 gap-3">
    {[
        { label: 'Дата', value: details.order.created_at?.slice(0, 10) },
        { label: 'Тип', value: details.order.branch.includes('_land') ? 'Садик' : 'Школа' },
        { label: 'Выполнение', value: `${details.delivery?.completion_rate ?? '—'}%` },
        { label: 'Статус', value: details.order.status },
    ].map(m => (
        <div key={m.label} className="bg-gray-50 rounded-2xl px-4 py-3">
            <p className="text-xs text-gray-400 font-medium mb-1">{m.label}</p>
            <p className="font-bold text-gray-900 text-sm whitespace-nowrap">{m.value}</p>
        </div>
    ))}
</div>
```

**Step 2: Run verification**
Open a modal and check the grid.

**Step 3: Commit**

```bash
git add frontend/src/app/components/financierDesktop/RequestsTab/RequestDetailModal.tsx
git commit -m "ui: add branch type to request detail modal"
```
