# Snabjenec Delivery Toggle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a checkmark toggle to each product in the Snabjenec reception view to mark it as fully received with one click.

**Architecture:** Modify `renderDeliveryTrackingCard` in `SnabjenecDetailView.tsx` to include a "Mark Full" toggle button. The button will use the existing `handleReceivedQtyChange` to update the state.

**Tech Stack:** React, Tailwind CSS, Lucide React icons.

---

### Task 1: Update SnabjenecDetailView.tsx UI

**Files:**
- Modify: `frontend/src/app/components/snabjenec/SnabjenecDetailView.tsx`

**Step 1: Locate renderDeliveryTrackingCard and add the toggle logic**

```tsx
// Inside renderDeliveryTrackingCard (around line 343+)
const isFull = tracking.received_qty === tracking.ordered_qty;
const toggleFull = () => {
    const newQty = isFull ? 0 : tracking.ordered_qty;
    handleReceivedQtyChange(product.id, tracking.ordered_qty, newQty);
};
```

**Step 2: Update the JSX to include the toggle button**

```tsx
// Inside the return of renderDeliveryTrackingCard (around line 359+)
return (
    <div key={product.id} className="bg-white p-4 rounded-3xl shadow-md border border-gray-100">
        <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-gray-900">{product.name}</p>
            <button
                onClick={toggleFull}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                    isFull ? 'bg-[#2E7D32]/10 text-[#2E7D32]' : 'bg-gray-50 text-gray-300'
                }`}
            >
                <CheckSquare className={isFull ? "w-5 h-5 fill-current" : "w-5 h-5"} />
            </button>
        </div>
        {/* ... existing grid and status ... */}
```

**Step 3: Verification**
- Code review: Ensure `CheckSquare` is imported and used correctly.
- Ensure `handleReceivedQtyChange` correctly updates the status to 'delivered' when toggled on.

**Step 4: Commit**

```bash
git add frontend/src/app/components/snabjenec/SnabjenecDetailView.tsx
git commit -m "feat: add delivery completion toggle to snabjenec product cards"
```
