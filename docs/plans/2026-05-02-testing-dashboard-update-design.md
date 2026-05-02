# Testing Dashboard Update Design - 2026-05-02

## Objective
Update the `TestingDashboard.tsx` to allow users to test different roles across all available branches, categorized by institution type (Kindergartens/Land and Schools).

## Proposed Changes

### 1. Data Model
- Introduce `InstitutionType` ('land' | 'school').
- Define constants for `LAND_BRANCHES` and `SCHOOL_BRANCHES` based on `bot.py`:
    - **Land:** `beltepa_land`, `uchtepa_land`, `rakat_land`, `mukumiy_land`, `yunusabad_land`, `novoi_land`.
    - **School:** `novza_school`, `uchtepa_school`, `almazar_school`, `general_uzakov_school`, `namangan_school`, `novoi_school`.
- Update `PhoneState` to include `instType`.

### 2. User Interface
- **Institution Type Toggle:** Add a segmented control (tabs) to each phone registration form to switch between 'land' and 'school'.
- **Dynamic Branch Select:** Filter the branch dropdown based on the selected institution type.
- **Role Integration:**
    - For `chef`, the branch selection is mandatory.
    - For `snabjenec`, `financier`, and `suppliers`, allow selecting `all` branches (default) or a specific branch.

### 3. Components
- Use `lucide-react` icons: `Sprout` for Land/Kindergartens and `GraduationCap` for Schools.
- Maintain consistency with the existing dark/premium aesthetic.

### 4. Implementation Details
- Update `TestingDashboard.tsx` state management to handle type/branch synchronization.
- Ensure `handleStart` correctly passes the updated parameters to the backend and the iframe URL.

## Approval
- [x] User approved Approach 1 (Toggle + Dropdown) via chat.
