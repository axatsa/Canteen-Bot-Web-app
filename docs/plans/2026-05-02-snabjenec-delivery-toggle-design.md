# Design Doc: Snabjenec Product Delivery Toggle

## Overview
Add a checkmark toggle to each product in the Snabjenec reception view. This toggle allows marking a product as "fully received" with a single click, setting the received quantity to match the ordered quantity.

## Requirements
- Each product card in the delivery tracking mode must have a checkmark icon/button.
- Clicking the toggle when not full: Set `received_qty` = `ordered_qty`.
- Clicking the toggle when already full: Set `received_qty` = `0`.
- The toggle must provide visual feedback (e.g., green when full).
- The manual input for "Received" quantity must remain functional and override the toggle state.
- The financier view should reflect the value entered (or toggled) in the snabjenec form.

## Architecture & Components
- **Component**: `frontend/src/app/components/snabjenec/SnabjenecDetailView.tsx`
- **Function**: `renderDeliveryTrackingCard`
- **State Management**: Existing `localDeliveryTracking` state and `handleReceivedQtyChange` handler.

## Implementation Details
1.  **Icon**: Use `CheckSquare` or `CheckCircle2` from `lucide-react`.
2.  **UI Layout**:
    - Update the product header inside `renderDeliveryTrackingCard` to be a `flex` container.
    - Add a button containing the icon next to (or before) the product name.
3.  **Logic**:
    ```tsx
    const isFull = tracking.received_qty === tracking.ordered_qty;
    const toggleFull = () => {
        const newQty = isFull ? 0 : tracking.ordered_qty;
        handleReceivedQtyChange(product.id, tracking.ordered_qty, newQty);
    };
    ```
4.  **Styling**:
    - Button: `active:scale-90`, `transition-all`.
    - Icon: Green (`text-[#2E7D32]`) when `isFull`, gray (`text-gray-300`) otherwise.
