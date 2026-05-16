---
name: "Refactor UI Client"
description: "[Client] Safe UI Refactoring for React JS. Replaces UI based on design (e.g., from Stitch/Figma) while strictly preserving all business logic, state, and API calls."
---

# Workflow: UI Refactoring for React JS Client

**Goal:** Integrate new UI designs (like from Google Stitch or Figma) into existing React components WITHOUT altering any underlying business logic, state management, or API integrations.

## 🛠 Prerequisites

- The user provides the target file path and the raw UI code (HTML/CSS/JSX).
- **CRITICAL RULE:** DO NOT change, rename, or delete any existing `useState`, `useEffect`, `useSelector`, Redux actions, API hooks, or event handler functions (e.g., `onSubmit`, `onClick`).

## 🔄 Execution Phases

### Phase 1: Preserve Logic (Analysis)

1. Read the target component file using `view_file`.
2. Explicitly list out all preserved elements in your thought process:
   - State variables (`useState`, custom hooks)
   - Redux/Zustand bindings (`useSelector`, `useDispatch`)
   - API calls (Axios, RTK Query, React Query)
   - Event handler functions
   - Component Props
3. Identify the bounds of the `return (...)` block where the UI is rendered.

### Phase 2: UI Mapping & Integration

1. Analyze the provided Stitch/Figma UI code.
2. Translate standard HTML/CSS into the project's standard MUI v7 components and design tokens (`react-ui-tokens`).
3. Map the preserved logic (from Phase 1) onto the new UI elements:
   - Attach `onChange`, `value`, `onSubmit` to the new form inputs and buttons.
   - Attach conditional rendering rules based on existing loading/error states.

### Phase 3: Safe Code Replacement

1. Use `replace_file_content` or `multi_replace_file_content` to swap the old JSX with the new JSX.
2. Ensure imports for MUI components are updated at the top of the file.
3. **Double Check:** Verify that no logic outside the `return` statement was accidentally modified or removed.

## 🎯 Completion

- Confirm the update and remind the user to run `/review-client` to verify visual consistency and design system adherence.
