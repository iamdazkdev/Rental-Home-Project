---
name: "Refactor UI Mobile"
description: "[Mobile] Safe UI Refactoring for Flutter. Replaces UI based on design (e.g., from Stitch/Figma) while strictly preserving BLoC logic, routing, and state."
---

# Workflow: UI Refactoring for Flutter Mobile App

**Goal:** Integrate new UI designs (like from Google Stitch or Figma) into existing Flutter widgets WITHOUT altering any underlying Clean Architecture layers, BLoC events/states, or routing logic.

## 🛠 Prerequisites

- The user provides the target file path and the raw UI design/code.
- **CRITICAL RULE:** DO NOT change, rename, or delete any `BlocProvider`, `BlocBuilder`, `context.read<Bloc>()`, navigation methods (`context.go`), or lifecycle hooks (`initState`, `dispose`).

## 🔄 Execution Phases

### Phase 1: Preserve Logic (Analysis)

1. Read the target widget file using `view_file`.
2. Explicitly list out all preserved elements in your thought process:
   - State variables (if `StatefulWidget`)
   - BLoC/Cubit integrations (`BlocBuilder`, `BlocListener` states)
   - Event triggers (functions dispatching BLoC events)
   - Controllers (`TextEditingController`, `ScrollController`)
   - Navigation callbacks
3. Identify the boundaries of the `build(BuildContext context)` method where the UI tree is constructed.

### Phase 2: UI Mapping & Integration

1. Analyze the provided Stitch/Figma UI design.
2. Translate the design into Flutter Widgets following the project's `AppColorScheme` and shared UI components.
3. Map the preserved logic (from Phase 1) onto the new UI widgets:
   - Attach controllers to `TextField`s.
   - Attach `onPressed`/`onTap` to new buttons.
   - Wrap necessary sections in existing `BlocBuilder`s to maintain reactivity.

### Phase 3: Safe Code Replacement

1. Use `replace_file_content` or `multi_replace_file_content` to swap the old widget tree within the `build` method with the new one.
2. Ensure imports for new widgets/colors are updated at the top of the file.
3. **Double Check:** Verify that no BLoC logic, controllers, or class definitions outside the `build` method were accidentally modified or removed.

## 🎯 Completion

- Confirm the update and remind the user to run `/review-mobile` to verify visual consistency, responsive design, and lack of render overflows.
