# System Verification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Run existing tests and perform a comprehensive system verification (Bot + Backend + Frontend).

**Architecture:** 
1. Run backend unit and contract tests using `pytest`.
2. Verify frontend-backend data transfer via contract tests.
3. Perform a simulated system integration check by running the backend in "both" mode (API + Bot) and verifying endpoint health.

**Tech Stack:** Python, FastAPI, Pytest, Vite.

---

### Task 1: Run Backend Unit Tests

**Files:**
- Test: `backend/tests/`

**Step 1: Execute all backend tests**
Run: `cd backend && pytest`
Expected: ALL tests pass (test_products.py, test_financier.py, test_delivery.py, test_orders.py).

### Task 2: Verify Frontend-Backend Contract

**Files:**
- Test: `backend/tests/test_frontend_contract.py`

**Step 2: Run contract tests specifically**
Run: `cd backend && pytest tests/test_frontend_contract.py -v`
Expected: PASS. This confirms API JSON shapes match `frontend/src/lib/api.ts` expectations (camelCase, ISO dates).

### Task 3: Full System Integration Check (Simulation)

**Files:**
- Run: `backend/main.py`
- Run: `frontend/package.json`

**Step 1: Prepare environment**
Verify `.env` in `backend` has necessary dummy values (e.g., `BOT_TOKEN` for initialization check).

**Step 2: Start Backend (API + Bot simulated)**
Note: Since real BOT_TOKEN might not be available, we verify the startup logic.
Run: `cd backend && python main.py api` (Run API only first to verify health)
Check: `curl http://localhost:8000/products` returns 200 and data.

**Step 3: Verify Frontend Build health**
Run: `cd frontend && npm install && npm run build`
Expected: Build successful (no TS errors).

**Step 4: Summary Report**
Compile all results into a final report.
