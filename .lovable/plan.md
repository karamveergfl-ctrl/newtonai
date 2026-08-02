## What's actually wrong

Two confirmed issues:

1. **There is no "Add Board" action on /admin/smartboards.** The page only has *Add school*, *Admins*, and *Suspend/Reactivate*. Boards (and therefore activation codes and credential PDFs) can currently only be created from the school portal at `/smartboard-admin/dashboard`. My earlier instructions were wrong.

2. **The activation code shown after creating a board is blank.** `AddBoardModal` reads `result.activation_code` and `result.board_name`, but the `sb_create_board` function returns the new row nested under `board` (`{ success: true, board: { activation_code, board_name, ... } }`). So the success screen shows an empty code and the credential PDF is generated with an empty code too.

## Fix

**A. Correct the modal's response parsing** (`src/components/smartboard-admin/AddBoardModal.tsx`)
- Read the code and name from `result.board.activation_code` / `result.board.board_name`, keeping a fallback to the flat fields.
- Map the `limit_reached` / `not_authorized` / `institution_not_found` error codes to plain-English toasts instead of raw codes.

**B. Add board management to the platform admin page** (`src/pages/admin/SmartBoards.tsx`)
- Add a **Boards** button to each school row that opens a dialog listing that school's boards: name, grade, activated/awaiting status, last active, plus per-board **Download PDF** and **New code** actions (same handlers already used in the school dashboard).
- Add **Add board** inside that dialog, reusing the existing `AddBoardModal` component with the selected school's id and name, so the activation code + credential PDF appear right after creation.
- Disable *Add board* when the school has reached `max_smartboards`, with a message pointing at raising the plan limit.
- Refresh the board list after create/reissue so counts in the table stay accurate.

No database changes are needed: `sb_create_board` and `sb_reissue_board_code` already authorize platform admins via `has_role(auth.uid(), 'admin')`.

## Verification
- Create a board from `/admin/smartboards` and confirm a non-empty code like `DPS-6A-X9F2` appears and the downloaded PDF contains it.
- Reissue a code and confirm the list updates.
