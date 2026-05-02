# Testing Dashboard Institution Selection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the testing dashboard to allow selection of institution type (Land/School) and filter branches accordingly based on the user's choice.

**Architecture:** Add `instType` state to each mocked "phone" container. Update constants to include all real branches from `bot.py`. Implement a UI toggle for Land/School and a dynamic branch dropdown.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide Icons.

---

### Task 1: Update Constants and Types in `TestingDashboard.tsx`

**Files:**
- Modify: `frontend/src/app/TestingDashboard.tsx`

**Step 1: Update imports, types and constants**
Add `Sprout` and `GraduationCap` icons. Replace `Role` and `Branch` types, and `ROLES` and `BRANCHES` constants. Add `InstitutionType`, `LAND_BRANCHES`, and `SCHOOL_BRANCHES`.

**Step 2: Update `PhoneState` interface and initial state**
Modify `PhoneState` to include `instType`. Update the `useState` hook with initial values including the new type.

**Step 3: Commit**
```bash
git add frontend/src/app/TestingDashboard.tsx
git commit -m "refactor: update constants and types for testing dashboard"
```

### Task 2: Implement UI for Institution Type Selection and Branch Filtering

**Files:**
- Modify: `frontend/src/app/TestingDashboard.tsx`

**Step 1: Update `handleUpdatePhone` logic**
Enhance `handleUpdatePhone` to handle `instType` changes by resetting the `branch` if necessary. Also, ensure roles like `snabjenec` default to `all` branches if appropriate.

**Step 2: Update JSX for the registration form**
Replace the single branch select with a "Type Toggle" (Land/School) and a "Branch Dropdown" that displays branches relevant to the selected type. Use `Sprout` and `GraduationCap` icons for the toggle.

**Step 3: Commit**
```bash
git add frontend/src/app/TestingDashboard.tsx
git commit -m "feat: add institution type selection and branch filtering to testing dashboard"
```

### Task 3: Verification

**Step 1: Verify URL generation**
Ensure `handleStart` correctly picks up the selected `branch` and `role` to construct the iframe URL.

**Step 2: Manual Check**
Select 'Школа' and verify that 'Белтепа-Land' is no longer visible, but 'Новза-School' is.

**Step 3: Commit**
```bash
git add frontend/src/app/TestingDashboard.tsx
git commit -m "test: verify testing dashboard functionality"
```
