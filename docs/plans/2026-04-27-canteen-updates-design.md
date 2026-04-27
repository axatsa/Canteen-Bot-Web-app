# Design Document: Canteen Bot Web App Updates

## Goal
Implement a set of improvements for the Canteen Bot Web App, focusing on product management, UI usability for the Chef, and role-based separation for Suppliers.

## Requirements
1. **Product Management**:
    - Add new products: "Петрушка", "Зеленый лук", "Райхон" (category: "🥕 Овощи и зелень", unit: "пучки").
    - Ensure "Лук (Piyoz)" remains in "кг".
2. **Chef UI Improvements**:
    - Modify the `Stepper` component to support a smaller step (0.1) for quantities.
    - Maintain manual input support for decimal numbers.
3. **Branding**:
    - Ensure `favicon.png` (Thompson logo) is correctly displayed in the browser tab.
4. **Role-Based Logic**:
    - Verify/Polish the separation between `supplier_meat` and `supplier_products`.
5. **Financier Features**:
    - Ensure the Financier can edit units of measurement in order details.

## Proposed Changes

### Backend
#### Database Updates
- Modify `backend/app/database.py`'s `migrate_products` function to include the new greens:
    - `('91', 'Петрушка', '🥕 Овощи и зелень', 'пучки')`
    - `('92', 'Зеленый лук', '🥕 Овощи и зелень', 'пучки')`
    - `('93', 'Райхон', '🥕 Овощи и зелень', 'пучки')`

### Frontend
#### Components
- **`ChefView.tsx`**:
    - Update the `Stepper` function:
        - Change `onChange(Math.max(0, value - 1))` to `onChange(Math.max(0, Number((value - 0.1).toFixed(1))))`.
        - Change `onChange(value + 1)` to `onChange(Number((value + 0.1).toFixed(1)))`.
- **`index.html`**:
    - Verify the `<link rel="icon">` tag points to `/favicon.png`.

#### Styles & Assets
- Ensure `public/favicon.png` is the correct logo (already confirmed size match with `logo.png`).

## Verification Plan
1. **Database**: Run `backend/migrate_db.py` or restart the app and check if new products appear in the `master_products` table.
2. **Chef UI**: Open Chef view, find a product, and use the +/- buttons to verify the 0.1 step. Try typing a decimal number manually.
3. **Supplier View**: Log in as `supplier_meat` and verify only meat products are visible. Log in as `supplier_products` and verify everything else is visible.
4. **Favicon**: Open the app in a browser and check the tab icon.
