# Implementation Plan: To-Do Life Dashboard

## Overview

Implement a self-contained, single-page productivity dashboard using plain HTML5, CSS3, and Vanilla JavaScript (ES6+). All behaviour lives in a single IIFE in `js/script.js`; no build tools or external dependencies are required for the main app. Testing uses Vitest + fast-check.

---

## Tasks

- [x] 1. Scaffold project structure and create skeleton files
  - Create `index.html`, `css/style.css`, and `js/script.js` at the project root
  - `index.html` must reference `css/style.css` via `<link>` and `js/script.js` via `<script defer>`; no inline `<style>` or `<script>` blocks
  - `js/script.js` must contain an empty IIFE skeleton with a `DOMContentLoaded` listener calling `init()`
  - `css/style.css` must exist (can be empty at this stage)
  - _Requirements: 9.7_

- [x] 2. Write semantic HTML structure in `index.html`
  - [x] 2.1 Implement `<header>` markup with `id="header-date"`, `id="header-clock"`, and `id="header-greeting"` elements
    - Use class names `header__date`, `header__clock`, `header__greeting`
    - _Requirements: 1.1, 1.2, 2.1, 9.1_

  - [x] 2.2 Implement `<main>` with three `<section>` cards: Focus Timer, To-Do List, and Quick Links
    - Timer card: `id="timer-card"` with `id="timer-display"`, `id="timer-start"`, `id="timer-stop"`, `id="timer-reset"`, `id="timer-message"` (`hidden` attribute)
    - Todo card: `id="todo-card"` with `id="todo-input"` (`maxlength="500"`), `id="todo-add"`, `id="todo-error"` (`hidden`), `id="todo-list"`
    - Links card: `id="links-card"` with `id="links-preset"`, `id="links-user"`, `id="link-label"` (`maxlength="50"`), `id="link-url"` (`maxlength="2048"`), `id="link-add"`, `id="links-error"` (`hidden`)
    - All three sections use class `card`
    - _Requirements: 3.1, 3.2, 4.1, 5.1, 7.1, 8.1, 9.1, 9.2_

- [x] 3. Implement CSS design tokens and global styles in `css/style.css`
  - [x] 3.1 Declare all CSS custom properties on `:root`
    - Include color palette (`--color-bg`, `--color-surface`, `--color-primary`, `--color-primary-hover`, `--color-danger`, `--color-success`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-error`)
    - Include spacing scale (`--space-xs` through `--space-xl`)
    - Include card tokens (`--card-padding: 20px`, `--card-radius: 8px`, `--card-shadow`)
    - Include typography (`--font-family`, `--font-size-sm` through `--font-size-xl`)
    - Include `--transition-fast: 150ms ease`
    - _Requirements: 9.2_

  - [x] 3.2 Implement layout styles: `<header>`, `<main>` CSS Grid, `.card`, responsive media query
    - `main`: `display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-lg); padding: var(--space-lg)`
    - `.card`: `background`, `border-radius` (≥ 4px), `box-shadow`, `padding` (≥ 12px)
    - `@media (max-width: 767px)`: force `grid-template-columns: 1fr`
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

  - [x] 3.3 Implement component-specific styles
    - `.header__clock`: `font-size: clamp(2rem, 5vw, 4rem); font-variant-numeric: tabular-nums`
    - `.task--completed .task__text`: `text-decoration: line-through; color: var(--color-text-muted)`
    - Timer display, button hover/focus states, inline error message visibility (use `hidden` attribute or `display: none`)
    - _Requirements: 3.6, 5.2, 9.2_

- [x] 4. Implement the `Storage` module inside the IIFE in `js/script.js`
  - [x] 4.1 Write `Storage.load(key, fallback)`
    - Wraps `localStorage.getItem` + `JSON.parse` in try/catch
    - Returns `fallback` when key is absent or JSON is invalid; logs `console.warn` on parse error
    - _Requirements: 6.3, 6.5, 8.9_

  - [x] 4.2 Write `Storage.save(key, value)`
    - Calls `localStorage.setItem(key, JSON.stringify(value))`
    - Does NOT catch errors — lets callers handle `QuotaExceededError`
    - _Requirements: 6.1, 6.4, 8.7_

  - [ ]* 4.3 Write property test — P15: Corrupted localStorage data produces a safe empty fallback
    - File: `tests/storage.test.js`
    - **Property 15: Corrupted data → empty fallback**
    - **Validates: Requirements 6.5**
    - Use `fc.string()` filtered to non-JSON-array values; assert `Storage.load` returns `[]` and does not throw

- [x] 5. Implement the `Utils` module inside the IIFE
  - [x] 5.1 Write `Utils.generateId()`
    - Returns a UUID v4 string (use `crypto.randomUUID()` or a fallback implementation)
    - _Requirements: 4.2, 8.2_

  - [x] 5.2 Write `Utils.formatDate(date)`
    - Uses `Date.prototype.toLocaleDateString` with options `{ weekday:'long', year:'numeric', month:'long', day:'numeric' }`
    - _Requirements: 1.1_

  - [ ]* 5.3 Write property test — P1: Date format contains all required components
    - File: `tests/utils.test.js`
    - **Property 1: Date format contains all required components**
    - **Validates: Requirements 1.1**
    - Use `fc.date()` arbitrary; assert returned string contains full weekday, month name, numeric day, and 4-digit year

  - [x] 5.4 Write `Utils.formatTime(h, m, s)`
    - Returns zero-padded `HH:MM:SS` string
    - _Requirements: 1.2_

  - [ ]* 5.5 Write property test — P2: Time formatting produces zero-padded HH:MM:SS
    - File: `tests/utils.test.js`
    - **Property 2: Time formatting produces zero-padded HH:MM:SS**
    - **Validates: Requirements 1.2**
    - Use three `fc.integer` arbitraries (h: [0,23], m: [0,59], s: [0,59]); assert result matches `/^\d{2}:\d{2}:\d{2}$/`

  - [x] 5.6 Write `Utils.getGreeting(hour)`
    - Returns `"Good Morning"` for [5,11], `"Good Afternoon"` for [12,17], `"Good Evening"` for [0,4] and [18,23]
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [ ]* 5.7 Write property test — P3: Greeting correctly maps all 24 hours
    - File: `tests/utils.test.js`
    - **Property 3: Greeting correctly maps all 24 hours**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.5**
    - Use `fc.integer({ min: 0, max: 23 })`; assert correct greeting for each hour range

  - [x] 5.8 Write `Utils.formatTimer(seconds)`
    - Returns zero-padded `MM:SS` for any integer in [0, 1500]
    - _Requirements: 3.6_

  - [ ]* 5.9 Write property test — P4: Timer formatter produces zero-padded MM:SS
    - File: `tests/utils.test.js`
    - **Property 4: Timer formatter produces zero-padded MM:SS**
    - **Validates: Requirements 3.6**
    - Use `fc.integer({ min: 0, max: 1500 })`; assert result matches `/^\d{2}:\d{2}$/` and `MM * 60 + SS === input`

  - [x] 5.10 Write `Utils.isValidUrl(url)`
    - Returns `true` iff `url` starts with `"http://"` or `"https://"`
    - _Requirements: 8.4_

  - [ ]* 5.11 Write property test — P17: Valid URL detection accepts only http and https schemes
    - File: `tests/utils.test.js`
    - **Property 17: Valid URL detection accepts only http and https schemes**
    - **Validates: Requirements 8.4**
    - Use `fc.string()`; assert `isValidUrl` returns `true` iff string starts with `http://` or `https://`

- [x] 6. Implement the Header component
  - [x] 6.1 Write `HeaderRenderer.render()`
    - Populates `#header-date` using `Utils.formatDate(new Date())`
    - Populates `#header-clock` using `Utils.formatTime(h, m, s)` from `new Date()`
    - Populates `#header-greeting` using `Utils.getGreeting(hour)`
    - _Requirements: 1.1, 1.2, 2.1, 2.4_

  - [x] 6.2 Write `startClock()` and `stopClock(id)` functions; attach `visibilitychange` listener
    - `startClock()`: calls `setInterval(tick, 1000)`, stores and returns interval ID; `tick` calls `HeaderRenderer.render()`
    - `stopClock(id)`: calls `clearInterval(id)`
    - `visibilitychange`: stop clock when `document.hidden === true`, restart when visible
    - _Requirements: 1.3, 1.4, 1.5_

- [x] 7. Implement the Focus Timer component
  - [x] 7.1 Write the `timerState` object and `TimerRenderer.render(state)`
    - Initial state: `{ remaining: 1500, isRunning: false, intervalId: null }`
    - Renderer: updates `#timer-display` via `Utils.formatTimer(remaining)`; shows/hides `#timer-message` when `remaining === 0`
    - _Requirements: 3.1, 3.6, 3.7_

  - [x] 7.2 Write `TimerHandlers.onStart()`, `onStop()`, `onReset()`, and `onTick()`
    - `onStart()`: no-op if `isRunning`; else set `isRunning = true`, create interval calling `onTick`, render
    - `onStop()`: no-op if `!isRunning`; else clear interval, set `isRunning = false`, render
    - `onReset()`: clear interval, set `remaining = 1500`, `isRunning = false`, `intervalId = null`, hide message, render
    - `onTick()`: decrement `remaining`; if `remaining <= 0` call `onStop()` and show completion message; render
    - _Requirements: 3.3, 3.4, 3.5, 3.7, 3.8, 3.9, 3.10_

  - [ ]* 7.3 Write property test — P5: Timer reset is total
    - File: `tests/timer.test.js`
    - **Property 5: Timer reset is total — any state returns to 25:00**
    - **Validates: Requirements 3.5**
    - Use `fc.record({ remaining: fc.integer({ min:0, max:1500 }), isRunning: fc.boolean() })`; assert post-reset state

  - [ ]* 7.4 Write property test — P6: Start is idempotent on a running timer
    - File: `tests/timer.test.js`
    - **Property 6: Start is idempotent on a running timer**
    - **Validates: Requirements 3.8**
    - Set `isRunning = true`; call `onStart()` multiple times; assert state unchanged

  - [ ]* 7.5 Write property test — P7: Stop is idempotent on a non-running timer
    - File: `tests/timer.test.js`
    - **Property 7: Stop is idempotent on a non-running timer**
    - **Validates: Requirements 3.9**
    - Set `isRunning = false`; call `onStop()` multiple times; assert state unchanged

  - [x] 7.6 Wire timer buttons: attach click listeners on `#timer-start`, `#timer-stop`, `#timer-reset`
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [~] 8. Checkpoint — Core utilities and timer
  - Ensure all tests pass so far, ask the user if questions arise.

- [ ] 9. Implement the To-Do List component
  - [x] 9.1 Write `TodoRenderer.render(tasks)`
    - Clears and re-renders `<ul id="todo-list">` from the `tasks` array
    - Each `<li>` has `class="task"` (add `task--completed` when `completed === true`) and `data-id="<id>"`
    - Task view: `<span class="task__text">`, Complete button (`class="task__complete"`), Edit button (`class="task__edit"`), Delete button (`class="task__delete"`)
    - Edit mode: replaces `<span>` with `<input class="task__edit-input" maxlength="500">` pre-filled with current text, plus a Save button
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 9.2 Write `TodoHandlers.onAdd()`
    - Reads `#todo-input`, trims, rejects empty/whitespace (no-op, retain focus)
    - Creates `{ id: generateId(), text, completed: false, createdAt: Date.now() }`, pushes to `state.tasks`
    - Calls `Storage.save('todo-tasks', state.tasks)` in try/catch; shows `#todo-error` on failure
    - Clears input, refocuses input, calls `TodoRenderer.render`
    - _Requirements: 4.2, 4.3, 4.4, 6.1, 6.4_

  - [ ]* 9.3 Write property test — P8: Adding a valid task grows the list by one
    - File: `tests/todo.test.js`
    - **Property 8: Adding a valid task grows the list by one**
    - **Validates: Requirements 4.2**
    - Use `fc.string().filter(s => s.trim().length > 0)`; assert list length increases by 1 and last item text equals `input.trim()`

  - [ ]* 9.4 Write property test — P9: Whitespace-only input is always rejected
    - File: `tests/todo.test.js`
    - **Property 9: Whitespace-only input is always rejected**
    - **Validates: Requirements 4.4**
    - Use `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))`; assert task list unchanged and localStorage not written

  - [-] 9.5 Write `TodoHandlers.onComplete(id)`, `onEdit(id)`, `onSave(id)`, `onDelete(id)`, and `onKeydown(e)`
    - `onComplete`: toggle `task.completed` for matching id, persist, render
    - `onEdit`: re-render that task item in edit mode, focus the edit input
    - `onSave`: trim new value; if empty restore original; else update `task.text`, persist, render
    - `onDelete`: filter out task by id, persist, render
    - `onKeydown` on `#todo-input`: Enter → `onAdd`; on `<ul>` in edit mode: Enter → `onSave`, Escape → cancel edit and restore
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 4.5_

  - [ ]* 9.6 Write property test — P10: Complete toggles exactly the targeted task
    - File: `tests/todo.test.js`
    - **Property 10: Complete toggles exactly the targeted task**
    - **Validates: Requirements 5.2**
    - Use `fc.array(taskArbitrary, { minLength: 1 })`; assert only targeted task changes and double-toggle restores original

  - [ ]* 9.7 Write property test — P11: Edit with valid text updates exactly the targeted task
    - File: `tests/todo.test.js`
    - **Property 11: Edit with valid text updates exactly the targeted task**
    - **Validates: Requirements 5.4**
    - Use `fc.array(taskArbitrary, { minLength: 1 })` + `fc.string().filter(s => s.trim().length > 0)`; assert only targeted task text changes

  - [ ]* 9.8 Write property test — P12: Edit with whitespace-only value does not modify the task
    - File: `tests/todo.test.js`
    - **Property 12: Edit with whitespace-only value does not modify the task**
    - **Validates: Requirements 5.5**
    - Use whitespace string arbitrary; assert task text unchanged after save attempt

  - [ ]* 9.9 Write property test — P13: Delete removes exactly the targeted task
    - File: `tests/todo.test.js`
    - **Property 13: Delete removes exactly the targeted task**
    - **Validates: Requirements 5.7**
    - Use `fc.array(taskArbitrary, { minLength: 1 })`; assert length N-1, targeted id absent, order preserved

  - [ ]* 9.10 Write property test — P14: Every task mutation is reflected in localStorage
    - File: `tests/todo.test.js`
    - **Property 14: Every task mutation is reflected in localStorage**
    - **Validates: Requirements 6.1**
    - Mock localStorage; after each mutation assert `JSON.parse(localStorage.getItem('todo-tasks'))` equals in-memory array

  - [~] 9.11 Attach event delegation listener on `<ul id="todo-list">` for complete/edit/save/delete buttons
    - Use a single `click` listener on the `<ul>`; delegate to handlers by inspecting `event.target.className`
    - Also attach `keydown` listener for Enter/Escape on the list (edit mode) and on `#todo-input`
    - Load initial tasks: `state.tasks = Storage.load('todo-tasks', [])` and call `TodoRenderer.render`
    - _Requirements: 5.1, 5.5, 5.6, 6.2, 6.3_

- [~] 10. Checkpoint — To-Do List complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement the Quick Links component
  - [x] 11.1 Write `QuickLinksRenderer.renderPresets()` and `QuickLinksRenderer.render(links)`
    - `renderPresets()`: renders exactly 4 `<a target="_blank">` buttons into `#links-preset` from `PRESET_LINKS`
    - `render(links)`: re-renders `#links-user` with user-defined link buttons (each `<a target="_blank">`)
    - _Requirements: 7.1, 7.2, 7.3, 8.5_

  - [ ]* 11.2 Write property test — P16: Preset links are always exactly four
    - File: `tests/quicklinks.test.js`
    - **Property 16: Preset links are always exactly four, regardless of user links**
    - **Validates: Requirements 7.1, 7.3**
    - Use `fc.array(linkArbitrary, { maxLength: 20 })`; assert rendered preset area always contains exactly 4 anchors with correct labels

  - [x] 11.3 Write `QuickLinksHandlers.onAdd()`
    - Read `#link-label` and `#link-url`, trim both
    - Validate: label non-empty; URL non-empty and passes `Utils.isValidUrl`; `state.links.length < 20`
    - Show specific `#links-error` message for each validation failure; do not create link
    - On success: create `{ id: generateId(), label, url, createdAt: Date.now() }`, push to `state.links`
    - Persist: `Storage.save('quick-links', state.links)` in try/catch
    - Call `QuickLinksRenderer.render(state.links)`; clear inputs
    - _Requirements: 8.2, 8.3, 8.4, 8.6, 8.7_

  - [ ]* 11.4 Write property test — P17: Valid URL detection (covered by Utils — reference here)
    - File: `tests/quicklinks.test.js`
    - **Property 17: Valid URL detection accepts only http and https schemes**
    - **Validates: Requirements 8.4**
    - Integration check: call `QuickLinksHandlers.onAdd()` with various URL schemes; assert only `http://` and `https://` create links

  - [ ]* 11.5 Write property test — P18: Adding a valid link is reflected in localStorage
    - File: `tests/quicklinks.test.js`
    - **Property 18: Adding a valid link is reflected in localStorage**
    - **Validates: Requirements 8.7**
    - Use valid label/URL arbitraries; after `addLink` assert `JSON.parse(localStorage.getItem('quick-links'))` contains entry with trimmed label and URL

  - [-] 11.6 Attach click listener on `#link-add`; load initial links from localStorage and render
    - `state.links = Storage.load('quick-links', [])` on init
    - Call `QuickLinksRenderer.render(state.links)` on init
    - _Requirements: 8.8, 8.9_

- [ ] 12. Wire everything together in `init()`
  - [~] 12.1 Write the `init()` function to call all module setup functions in order
    - Load `state.tasks` and `state.links` from Storage
    - Call `HeaderRenderer.render()` then `startClock()`
    - Call `TimerRenderer.render(timerState)`; attach timer button listeners
    - Call `TodoRenderer.render(state.tasks)`; attach todo listeners (delegation + keydown)
    - Call `QuickLinksRenderer.renderPresets()` and `QuickLinksRenderer.render(state.links)`; attach link-add listener
    - Attach `visibilitychange` listener for clock management
    - _Requirements: 1.3, 1.5, 2.4, 6.2, 8.8, 9.6_

- [x] 13. Set up test infrastructure (Vitest + fast-check)
  - [x] 13.1 Create `package.json` with `vitest` and `fast-check` dev dependencies and a `"test"` script
    - `"test": "vitest --run"` for single-pass CI execution
    - Pin exact versions (e.g., `"vitest": "2.x.x"`, `"fast-check": "3.x.x"`)
    - _Requirements: (testing infrastructure)_

  - [x] 13.2 Create `vitest.config.js` (or equivalent config) and a test setup file that calls `fc.configureGlobal({ numRuns: 100 })`
    - Ensure test environment is `node` or `jsdom` as needed
    - Create `tests/` directory with placeholder test files referencing the utility functions exported from the IIFE
    - Note: utility functions must be exported for testing (either via `globalThis` or by restructuring as CommonJS/ESM module for the test build)
    - _Requirements: (testing infrastructure)_

- [~] 14. Checkpoint — All tests pass
  - Run `npm test` (i.e., `vitest --run`) and ensure all property-based and unit tests pass; ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build
- All property tests reference specific design properties (P1–P18) for full traceability to requirements
- The single-IIFE constraint means utility functions need to be accessible to test files — expose them on `globalThis` during testing or use a conditional export block
- Checkpoints (tasks 8, 10, 14) are integration gates; do not proceed past them with failing tests
- localStorage is mocked in Node test environment (e.g., using a plain object or `jest-localstorage-mock` equivalent for Vitest)
- The `visibilitychange` listener (task 6.2) is critical for avoiding clock drift on backgrounded tabs

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["3.1", "4.1", "4.2", "5.1"] },
    { "id": 3, "tasks": ["3.2", "4.3", "5.2", "5.4", "5.6", "5.8", "5.10"] },
    { "id": 4, "tasks": ["3.3", "5.3", "5.5", "5.7", "5.9", "5.11", "6.1", "7.1"] },
    { "id": 5, "tasks": ["6.2", "7.2", "9.1"] },
    { "id": 6, "tasks": ["7.3", "7.4", "7.5", "7.6", "9.2", "11.1"] },
    { "id": 7, "tasks": ["9.3", "9.4", "9.5", "11.2", "11.3"] },
    { "id": 8, "tasks": ["9.6", "9.7", "9.8", "9.9", "9.10", "9.11", "11.4", "11.5", "11.6"] },
    { "id": 9, "tasks": ["12.1"] },
    { "id": 10, "tasks": ["13.1"] },
    { "id": 11, "tasks": ["13.2"] }
  ]
}
```
