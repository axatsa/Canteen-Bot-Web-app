# Extended Testing Suite Design

**Goal:** Implement comprehensive automated testing for the Bot (dialogues), Frontend (components), and Export (document integrity).

## 1. Bot Dialogue Testing (Mocking)
- **Framework:** `pytest`, `pytest-asyncio`.
- **Approach:** 
    - Mock the Telegram `Update` and `ContextTypes.DEFAULT_TYPE` objects.
    - Directly invoke the handler functions (e.g., `start`, `language_selected`) with mocked updates.
    - Assert that the response text and `reply_markup` match expectations.
    - Check that the `crud` operations (saving users to DB) are performed correctly during the conversation.

## 2. Frontend Unit & Component Tests
- **Framework:** `Vitest`, `React Testing Library`, `jsdom`.
- **Approach:**
    - Configure Vitest in `vite.config.ts`.
    - Create `setupTests.ts` to extend Matchers (e.g., `toBeInTheDocument`).
    - Focus on critical components:
        - `RoleSelector`: Verify role selection buttons and logic.
        - `OrderForms`: Verify that inputs correctly update state.
        - `API integration`: Mock `fetch` or `api.ts` calls to verify UI response to data.

## 3. Export Integrity Tests (Snapshot-like)
- **Framework:** `pytest`, `python-docx`.
- **Approach:**
    - Create a dedicated test `backend/tests/test_document_export.py`.
    - Generate a `.docx` file using existing templates and dummy data.
    - Use `python-docx` to iterate through the document paragraphs and tables.
    - Assert that:
        - The branch name is present.
        - The product list in the table matches the order data.
        - Totals are calculated correctly in the document text.

---
**Approved by User:** 2026-04-21
