# Extended Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement automated tests for Frontend components, Bot dialogues, and Export document contents.

**Architecture:** 
- Frontend: Vitest + RTL for DOM testing.
- Bot: Pytest + Mocks for dialogue flow.
- Export: Pytest + python-docx for document content verification.

**Tech Stack:** Vitest, React Testing Library, Pytest, python-docx.

---

### Task 1: Setup Frontend Testing Infrastructure

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Create: `frontend/src/setupTests.ts`

**Step 1: Install dependencies**
Run: `cd frontend && npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event`

**Step 2: Update vite.config.ts**
Add `test` configuration to Vite config.

**Step 3: Create setupTests.ts**
Add `import '@testing-library/jest-dom'` to global setup.

### Task 2: Implement Frontend Component Tests

**Files:**
- Create: `frontend/src/app/components/__tests__/RoleSelector.test.tsx`

**Step 1: Write tests for RoleSelector**
Verify that all 4 roles are rendered and clicking on them calls the appropriate handler.

### Task 3: Setup & Implement Bot Dialogue Tests

**Files:**
- Create: `backend/tests/test_bot_dialogue.py`

**Step 1: Install bot testing dependencies**
Run: `pip install pytest-asyncio pytest-mock`

**Step 2: Implement mock bot environment**
Create fixtures to mock `Update` and `Context`.

**Step 3: Test Start and Language flow**
Verify that `/start` sends the welcome message and language buttons. Verify that clicking a language button proceeds to FIO state.

### Task 4: Implement Export Content Verification Tests

**Files:**
- Create: `backend/tests/test_export_content.py`

**Step 1: Install python-docx if missing**
Run: `pip install python-docx`

**Step 2: Implement document reader utility**
Write a helper to extract all text from a `.docx` file.

**Step 3: Verify Export Table content**
Generate a document for a test order and assert that the product names and quantities appear in the document tables.

---

### Task 5: Final Execution & Verification

**Step 1: Run all tests**
Run: `cd backend && pytest`
Run: `cd frontend && npm test`
