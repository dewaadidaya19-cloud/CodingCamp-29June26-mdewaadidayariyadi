# Design Document: To-Do Life Dashboard

## Overview

The To-Do Life Dashboard is a self-contained, single-page web application built with plain HTML5, CSS3, and Vanilla JavaScript (ES6+). It requires no build tools, no package manager, and no network connection to function. The application acts as a personal productivity hub, combining a live header, a Pomodoro focus timer, a persistent to-do list, and a quick-access links panel into one cohesive interface.

The architecture is deliberately minimal: one HTML file, one CSS file, one JavaScript file. All state lives in memory during a session and is synced to `localStorage` after every mutation. There is no virtual DOM, no reactive framework, and no module bundler — the JavaScript file is a single IIFE (Immediately Invoked Function Expression) that initialises the application on `DOMContentLoaded`.

### Design Goals

- Zero external dependencies — works offline, loads instantly.
- Clear separation of concerns — structure (HTML), presentation (CSS), behaviour (JS) in dedicated files.
- Predictable data flow — every user action follows the pattern: validate → mutate state → persist → re-render.
- Defensive Local Storage handling — corrupted or missing data never crashes the app.


---

## Architecture

### High-Level Component Diagram

```
index.html
├── <header>          — HeaderComponent
├── <main>
│   ├── <section>     — TimerComponent
│   ├── <section>     — TodoComponent
│   └── <section>     — QuickLinksComponent
└── <footer> (optional attribution)
```

### File Structure

```
project-root/
├── index.html          # Semantic HTML shell; no inline <style> or <script>
├── css/
│   └── style.css       # All styling, design tokens, responsive layout
└── js/
    └── script.js       # All application behaviour in a single IIFE
```

### JavaScript Module Organisation (within `script.js`)

The entire script is wrapped in a single IIFE to avoid polluting the global scope. Internal modules are plain objects or factory functions:

```
(function () {
  // ── Storage module ─────────────────────────────────────────────
  const Storage = { load, save }

  // ── State ──────────────────────────────────────────────────────
  let state = { tasks: [], links: [], timer: {...} }

  // ── Utilities ──────────────────────────────────────────────────
  const Utils = { formatDate, formatTime, formatTimer, getGreeting, isValidUrl, generateId }

  // ── Render functions ───────────────────────────────────────────
  const HeaderRenderer   = { render }
  const TimerRenderer    = { render }
  const TodoRenderer     = { render }
  const QuickLinksRenderer = { render }

  // ── Event handlers ─────────────────────────────────────────────
  const TimerHandlers    = { onStart, onStop, onReset, onTick }
  const TodoHandlers     = { onAdd, onComplete, onEdit, onSave, onDelete, onKeydown }
  const QuickLinksHandlers = { onAdd, onDelete }

  // ── Initialisation ─────────────────────────────────────────────
  function init() { ... }
  document.addEventListener('DOMContentLoaded', init)
})();
```

### Data Flow Pattern

Every user interaction follows this consistent pipeline:

```
User Action
    │
    ▼
Handler validates input
    │ (invalid) → show inline error → stop
    ▼ (valid)
Mutate in-memory state
    │
    ▼
Persist to localStorage (Storage.save)
    │ (quota/access error) → show inline error → keep in-memory state
    ▼
Re-render affected component
```


---

## Components and Interfaces

### 1. HeaderComponent

Responsible for rendering the date string, the live clock, and the contextual greeting.

**DOM structure:**
```html
<header>
  <div class="header__date" id="header-date"></div>
  <div class="header__clock" id="header-clock"></div>
  <div class="header__greeting" id="header-greeting"></div>
</header>
```

**Interface:**

| Function | Signature | Description |
|---|---|---|
| `Utils.formatDate(date)` | `Date → string` | Returns locale-aware date string (e.g., "Tuesday, July 1, 2026") |
| `Utils.formatTime(h, m, s)` | `(number, number, number) → string` | Returns zero-padded `HH:MM:SS` |
| `Utils.getGreeting(hour)` | `number → string` | Maps 0–23 to one of three greetings |
| `HeaderRenderer.render()` | `() → void` | Updates the three DOM elements |
| `startClock()` | `() → number` | Calls `setInterval(tick, 1000)`, returns interval ID |
| `stopClock(id)` | `(number) → void` | Calls `clearInterval(id)` |

The interval ID is stored in the module scope. A `visibilitychange` listener calls `stopClock` when the page becomes hidden and restarts on `visible` to avoid drift when the tab is backgrounded.

---

### 2. TimerComponent

Implements a 25-minute Pomodoro countdown with Start, Stop, and Reset controls.

**DOM structure:**
```html
<section id="timer-card" class="card">
  <h2>Focus Timer</h2>
  <div class="timer__display" id="timer-display">25:00</div>
  <div class="timer__controls">
    <button id="timer-start">Start</button>
    <button id="timer-stop">Stop</button>
    <button id="timer-reset">Reset</button>
  </div>
  <p class="timer__message" id="timer-message" hidden></p>
</section>
```

**Timer State object:**
```js
{
  totalSeconds: 1500,  // 25 * 60
  remaining: 1500,
  isRunning: false,
  intervalId: null
}
```

**Interface:**

| Function | Signature | Description |
|---|---|---|
| `Utils.formatTimer(seconds)` | `number → string` | Returns `MM:SS` with zero-padding |
| `TimerHandlers.onStart()` | `() → void` | If not running: set isRunning, start interval |
| `TimerHandlers.onStop()` | `() → void` | If running: clear interval, set isRunning false |
| `TimerHandlers.onReset()` | `() → void` | Clear interval, restore remaining to 1500, isRunning false |
| `TimerHandlers.onTick()` | `() → void` | Decrement remaining; if 0, stop and show message |
| `TimerRenderer.render(state)` | `(TimerState) → void` | Update display and message visibility |

---

### 3. TodoComponent

Manages task creation, editing, completion toggling, deletion, and Local Storage persistence.

**DOM structure:**
```html
<section id="todo-card" class="card">
  <h2>To-Do List</h2>
  <div class="todo__input-row">
    <input type="text" id="todo-input" maxlength="500" placeholder="Add a task…" />
    <button id="todo-add">Add</button>
  </div>
  <p class="todo__error" id="todo-error" hidden></p>
  <ul id="todo-list"></ul>
</section>
```

Each rendered task item:
```html
<li class="task" data-id="<uuid>">
  <span class="task__text">Task description</span>
  <!-- OR in edit mode: -->
  <input class="task__edit-input" type="text" maxlength="500" />
  <button class="task__complete">Complete</button>
  <button class="task__edit">Edit</button>
  <button class="task__delete">Delete</button>
</li>
```

**Interface:**

| Function | Signature | Description |
|---|---|---|
| `TodoHandlers.onAdd()` | `() → void` | Validate, create task, persist, render |
| `TodoHandlers.onComplete(id)` | `(string) → void` | Toggle completed, persist, render |
| `TodoHandlers.onEdit(id)` | `(string) → void` | Switch task to edit mode |
| `TodoHandlers.onSave(id)` | `(string) → void` | Validate edit value, update, persist, render |
| `TodoHandlers.onDelete(id)` | `(string) → void` | Remove task, persist, render |
| `TodoHandlers.onKeydown(e)` | `(KeyboardEvent) → void` | Enter → onAdd or onSave; Escape → cancel edit |
| `TodoRenderer.render(tasks)` | `(Task[]) → void` | Re-render the full `<ul>` |

Event delegation is used on `<ul id="todo-list">` for complete/edit/save/delete buttons rather than attaching listeners to each item, avoiding memory leaks as items are added/removed.

---

### 4. QuickLinksComponent

Displays four pre-set links and manages user-defined links.

**DOM structure:**
```html
<section id="links-card" class="card">
  <h2>Quick Links</h2>
  <div class="links__preset" id="links-preset">
    <!-- 4 static <a> buttons rendered by JS -->
  </div>
  <div class="links__user" id="links-user">
    <!-- User-defined link buttons -->
  </div>
  <div class="links__add-form">
    <input type="text" id="link-label" maxlength="50" placeholder="Label" />
    <input type="text" id="link-url"   maxlength="2048" placeholder="https://…" />
    <button id="link-add">Add Link</button>
  </div>
  <p class="links__error" id="links-error" hidden></p>
</section>
```

**Interface:**

| Function | Signature | Description |
|---|---|---|
| `Utils.isValidUrl(url)` | `string → boolean` | Returns true if url starts with `http://` or `https://` |
| `QuickLinksHandlers.onAdd()` | `() → void` | Validate, create link, persist, render |
| `QuickLinksRenderer.render(links)` | `(Link[]) → void` | Re-render user links section |
| `QuickLinksRenderer.renderPresets()` | `() → void` | Render the four static preset anchors once on init |


---

## Data Models

### Task Object

Stored in `localStorage` under the key `"todo-tasks"` as a JSON array of Task objects.

```js
/**
 * @typedef {Object} Task
 * @property {string}  id         - UUID v4 generated at creation time
 * @property {string}  text       - Trimmed task description (1–500 chars)
 * @property {boolean} completed  - false by default; toggled by Complete action
 * @property {number}  createdAt  - Unix timestamp (Date.now()) at creation
 */
```

Example serialised value:
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "text": "Read chapter 5",
    "completed": false,
    "createdAt": 1751234567890
  }
]
```

**Invariants:**
- `id` is unique across all tasks in the array.
- `text` is never empty or whitespace-only after trimming.
- `completed` is always a boolean.
- Array order reflects insertion order; tasks are never auto-sorted.

---

### Link Object

Stored in `localStorage` under the key `"quick-links"` as a JSON array of Link objects.

```js
/**
 * @typedef {Object} Link
 * @property {string} id       - UUID v4 generated at creation time
 * @property {string} label    - Trimmed display label (1–50 chars)
 * @property {string} url      - Validated URL starting with http:// or https:// (max 2048 chars)
 * @property {number} createdAt - Unix timestamp at creation
 */
```

Example serialised value:
```json
[
  {
    "id": "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
    "label": "My Portfolio",
    "url": "https://example.com",
    "createdAt": 1751234999000
  }
]
```

**Invariants:**
- Array length is 0–20 (user-defined links only; presets are not persisted).
- `url` always begins with `http://` or `https://`.
- `label` is never empty after trimming.

---

### Preset Links (hard-coded, not persisted)

```js
const PRESET_LINKS = [
  { label: 'Gmail',   url: 'https://mail.google.com' },
  { label: 'YouTube', url: 'https://www.youtube.com' },
  { label: 'GitHub',  url: 'https://github.com' },
  { label: 'ChatGPT', url: 'https://chat.openai.com' },
];
```

---

### Timer State (in-memory only, not persisted)

```js
/**
 * @typedef {Object} TimerState
 * @property {number}      remaining   - Seconds remaining (0–1500)
 * @property {boolean}     isRunning   - Whether the interval is active
 * @property {number|null} intervalId  - setInterval handle or null
 */
const timerState = {
  remaining: 1500,
  isRunning: false,
  intervalId: null,
};
```

---

### Storage Module

```js
const Storage = {
  /**
   * Loads JSON from localStorage. Returns fallback on any error.
   * @param {string} key
   * @param {*} fallback
   * @returns {*}
   */
  load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[Storage] Failed to parse "${key}":`, e);
      return fallback;
    }
  },

  /**
   * Saves value as JSON to localStorage.
   * @param {string} key
   * @param {*} value
   * @throws {Error} Re-throws storage errors so callers can display inline errors
   */
  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};
```

The caller (handler function) wraps `Storage.save` in a `try/catch` and shows an inline error message if the save fails (e.g., `QuotaExceededError`).


---

## CSS Architecture

### Design Tokens

All visual constants are declared as CSS custom properties on `:root` in `css/style.css`:

```css
:root {
  /* Color palette */
  --color-bg:          #f0f2f5;
  --color-surface:     #ffffff;
  --color-primary:     #4361ee;
  --color-primary-hover: #3a56d4;
  --color-danger:      #ef476f;
  --color-success:     #06d6a0;
  --color-text:        #212529;
  --color-text-muted:  #6c757d;
  --color-border:      #dee2e6;
  --color-error:       #ef476f;

  /* Spacing scale */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  32px;

  /* Card styling */
  --card-padding:       20px;
  --card-radius:        8px;
  --card-shadow:        0 2px 8px rgba(0, 0, 0, 0.10);

  /* Typography */
  --font-family:        system-ui, -apple-system, sans-serif;
  --font-size-sm:       0.875rem;
  --font-size-base:     1rem;
  --font-size-lg:       1.25rem;
  --font-size-xl:       2rem;

  /* Transition */
  --transition-fast:    150ms ease;
}
```

### Layout Strategy

The `<main>` element uses CSS Grid with `auto-fit` columns:

```css
main {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-lg);
  padding: var(--space-lg);
}
```

At viewport widths below 768px, `minmax(300px, 1fr)` collapses to a single column automatically. An explicit media query reinforces the single-column requirement:

```css
@media (max-width: 767px) {
  main {
    grid-template-columns: 1fr;
  }
}
```

### Card Component Class

```css
.card {
  background: var(--color-surface);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  padding: var(--card-padding);
}
```

### Responsive Typography

The clock display in the header uses `clamp()` to scale gracefully:

```css
.header__clock {
  font-size: clamp(2rem, 5vw, 4rem);
  font-variant-numeric: tabular-nums; /* prevents layout shift as digits change */
}
```

### Completion Strikethrough

```css
.task--completed .task__text {
  text-decoration: line-through;
  color: var(--color-text-muted);
}
```


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Date format contains all required components

*For any* `Date` object, `formatDate(date)` should return a string that contains the full weekday name, the full month name, the numeric day of the month, and the 4-digit year.

**Validates: Requirements 1.1**

---

### Property 2: Time formatting produces zero-padded HH:MM:SS

*For any* valid triple of integers (hours in [0, 23], minutes in [0, 59], seconds in [0, 59]), `formatTime(h, m, s)` should return a string matching the pattern `HH:MM:SS` where each component is zero-padded to exactly 2 digits.

**Validates: Requirements 1.2**

---

### Property 3: Greeting correctly maps all 24 hours

*For any* integer hour in [0, 23], `getGreeting(hour)` should return exactly `"Good Morning"` for hours in [5, 11], `"Good Afternoon"` for hours in [12, 17], and `"Good Evening"` for hours in [0, 4] and [18, 23]. No other return value is permissible.

**Validates: Requirements 2.1, 2.2, 2.3, 2.5**

---

### Property 4: Timer formatter produces zero-padded MM:SS

*For any* integer in [0, 1500], `formatTimer(seconds)` should return a string matching the pattern `MM:SS` where each component is zero-padded to exactly 2 digits, and `MM * 60 + SS === seconds`.

**Validates: Requirements 3.6**

---

### Property 5: Timer reset is total — any state returns to 25:00

*For any* timer state (any value of `remaining`, any value of `isRunning`), calling `reset()` should produce a state where `remaining === 1500`, `isRunning === false`, and `intervalId === null`.

**Validates: Requirements 3.5**

---

### Property 6: Start is idempotent on a running timer

*For any* timer state where `isRunning === true`, calling `start()` should leave the timer state unchanged (same `remaining`, still `isRunning`, same `intervalId`).

**Validates: Requirements 3.8**

---

### Property 7: Stop is idempotent on a non-running timer

*For any* timer state where `isRunning === false`, calling `stop()` should leave the timer state unchanged (same `remaining`, still not running).

**Validates: Requirements 3.9**

---

### Property 8: Adding a valid task grows the list by one

*For any* task list of length N and any string containing at least one non-whitespace character, calling `addTask(text)` should produce a task list of length N + 1 whose last item has `text` equal to the trimmed input.

**Validates: Requirements 4.2**

---

### Property 9: Whitespace-only input is always rejected

*For any* string composed entirely of whitespace characters (including the empty string), calling `addTask(text)` should not modify the task list and should not write a new entry to `localStorage`.

**Validates: Requirements 4.4**

---

### Property 10: Complete toggles exactly the targeted task

*For any* task list and any task ID in that list, calling `toggleComplete(id)` should flip the `completed` field of exactly that task and leave all other tasks unchanged. Calling `toggleComplete(id)` twice should restore the original state (round-trip).

**Validates: Requirements 5.2**

---

### Property 11: Edit with valid text updates exactly the targeted task

*For any* task list and any non-whitespace edit value, calling `saveEdit(id, newText)` should update `task.text` to `newText.trim()` for only the identified task and leave all other tasks unchanged.

**Validates: Requirements 5.4**

---

### Property 12: Edit with whitespace-only value does not modify the task

*For any* task and any whitespace-only string, calling `saveEdit(id, whitespaceText)` should leave `task.text` unchanged.

**Validates: Requirements 5.5**

---

### Property 13: Delete removes exactly the targeted task

*For any* task list of length N > 0 and any task ID in that list, calling `deleteTask(id)` should produce a list of length N − 1, should not contain a task with the given ID, and should preserve the relative order of all remaining tasks.

**Validates: Requirements 5.7**

---

### Property 14: Every task mutation is reflected in localStorage

*For any* sequence of task mutations (add, complete, edit, delete), after each mutation `JSON.parse(localStorage.getItem("todo-tasks"))` should equal the current in-memory task array (deep equality).

**Validates: Requirements 6.1**

---

### Property 15: Corrupted localStorage data produces a safe empty fallback

*For any* string in `localStorage["todo-tasks"]` that is not valid JSON or does not parse to an array of valid Task objects, `Storage.load("todo-tasks", [])` should return `[]` and log a console warning rather than throwing.

**Validates: Requirements 6.5**

---

### Property 16: Preset links are always exactly four, regardless of user links

*For any* array of user-defined links (length 0–20), the rendered Quick Links section should always contain exactly four preset link buttons with the correct labels (Gmail, YouTube, GitHub, ChatGPT).

**Validates: Requirements 7.1, 7.3**

---

### Property 17: Valid URL detection accepts only http and https schemes

*For any* string, `isValidUrl(str)` should return `true` if and only if the string starts with `"http://"` or `"https://"`. All other strings (including `ftp://`, `//`, relative paths, and empty strings) should return `false`.

**Validates: Requirements 8.4**

---

### Property 18: Adding a valid link is reflected in localStorage

*For any* valid label and valid http/https URL, after `addLink(label, url)` succeeds, `JSON.parse(localStorage.getItem("quick-links"))` should contain an entry with the trimmed label and the given URL.

**Validates: Requirements 8.7**


---

## Error Handling

### localStorage Write Failures

Every call to `Storage.save` is wrapped by the caller:

```js
try {
  Storage.save('todo-tasks', state.tasks);
} catch (e) {
  showInlineError(todoErrorEl, 'Could not save tasks. Storage may be full.');
  // In-memory state is already updated — UI still reflects the change
}
```

The inline error element is shown for 5 seconds then hidden automatically via `setTimeout`.

### localStorage Read / Parse Failures

`Storage.load` never throws. It catches all exceptions internally, logs a `console.warn`, and returns the provided fallback value. This means the app always has a valid initial state even when the browser's storage contains junk.

### Timer Edge Cases

- **Double Start**: `onStart` checks `timerState.isRunning` before creating an interval. If already running, it returns immediately (idempotent).
- **Stop when idle**: `onStop` checks `timerState.isRunning`; if false it is a no-op.
- **Tick at zero**: `onTick` checks `remaining <= 0` before decrementing. On reaching zero it clears the interval, sets `isRunning = false`, and reveals the completion message.

### Input Validation

All user text inputs are validated before any state mutation:

| Scenario | Validation Rule | User Feedback |
|---|---|---|
| Empty/whitespace task | `text.trim().length === 0` | No-op; input retains focus |
| Whitespace edit value | `newText.trim().length === 0` | Restore original; no error shown |
| Empty link label or URL | Either field is blank | Inline error identifying missing field |
| Invalid URL scheme | `!url.startsWith('http://')` and `!url.startsWith('https://')` | Inline error: "URL must start with http:// or https://" |
| Max links reached | `state.links.length >= 20` | Inline error: "Maximum 20 custom links reached" |

### Graceful Degradation

The app functions correctly with JavaScript disabled only for static content (semantic HTML is readable). All interactive features require JavaScript. No special degradation message is shown since the target environment assumes JS is enabled.


---

## Testing Strategy

### Overview

The application is pure Vanilla JS with no build system, so testing uses a lightweight setup that can run directly in Node.js or via a zero-config test runner. The recommended library is **[fast-check](https://fast-check.dev/)** for property-based tests, paired with **[Vitest](https://vitest.dev/)** as the test runner (or plain `node:test` if zero-dependency is required). Vitest can run without a bundler and supports ESM/CJS.

PBT is appropriate here because:
- All utility functions (`formatDate`, `formatTime`, `formatTimer`, `getGreeting`, `isValidUrl`) are pure functions with well-defined input/output spaces.
- State mutation functions (`addTask`, `toggleComplete`, `saveEdit`, `deleteTask`, `addLink`) operate on plain JS objects with no I/O.
- `localStorage` is easily mockable in a Node environment (e.g., `localStorage = new Map()`).

### Dual Testing Approach

**Unit tests** cover:
- Specific examples (timer initialises to "25:00")
- Integration points (DOM structure checks)
- Edge cases (timer tick at `remaining === 1`, greeting at boundary hours 5, 12, 18)

**Property tests** cover:
- Universal properties across all valid inputs (Properties 1–18 above)
- Each test runs at minimum 100 iterations (fast-check default is 100)

### Property Test Configuration

```js
// vitest.config.js (or vitest section of package.json)
// fc.configureGlobal({ numRuns: 100 }) — applied in test setup file
```

Each property test is tagged with a comment for traceability:

```js
// Feature: todo-life-dashboard, Property 3: getGreeting correctly maps all 24 hours
it('getGreeting maps all 24 hours correctly', () => {
  fc.assert(
    fc.property(fc.integer({ min: 0, max: 23 }), (hour) => {
      const result = getGreeting(hour);
      if (hour >= 5 && hour <= 11)  expect(result).toBe('Good Morning');
      if (hour >= 12 && hour <= 17) expect(result).toBe('Good Afternoon');
      if (hour <= 4 || hour >= 18)  expect(result).toBe('Good Evening');
    }),
    { numRuns: 100 }
  );
});
```

### Test File Structure

```
tests/
├── utils.test.js         # Unit + property tests for all Utils functions
├── timer.test.js         # Unit + property tests for TimerHandlers and formatTimer
├── todo.test.js          # Unit + property tests for TodoHandlers (mock localStorage)
├── quicklinks.test.js    # Unit + property tests for QuickLinksHandlers (mock localStorage)
└── storage.test.js       # Unit + property tests for Storage.load (corrupted data)
```

### Property Test Coverage Map

| Property | Test file | fast-check arbitraries used |
|---|---|---|
| P1 Date format | utils.test.js | `fc.date()` |
| P2 Time formatting | utils.test.js | `fc.integer({min:0,max:23})` × 3 |
| P3 Greeting mapping | utils.test.js | `fc.integer({min:0,max:23})` |
| P4 Timer formatter | timer.test.js | `fc.integer({min:0,max:1500})` |
| P5 Timer reset | timer.test.js | `fc.record({remaining:fc.integer, isRunning:fc.boolean})` |
| P6 Start idempotent | timer.test.js | running timer state |
| P7 Stop idempotent | timer.test.js | stopped timer state |
| P8 Add task grows list | todo.test.js | `fc.string().filter(s => s.trim().length > 0)` |
| P9 Whitespace rejected | todo.test.js | `fc.stringOf(fc.constantFrom(' ','\t','\n'))` |
| P10 Complete toggle round-trip | todo.test.js | `fc.array(taskArbitrary)` |
| P11 Edit updates text | todo.test.js | non-whitespace string arbitrary |
| P12 Whitespace edit no-op | todo.test.js | whitespace string arbitrary |
| P13 Delete removes task | todo.test.js | `fc.array(taskArbitrary, {minLength:1})` |
| P14 Mutations reflected in localStorage | todo.test.js | mock localStorage |
| P15 Corrupted data → empty fallback | storage.test.js | `fc.string()` filtered to invalid JSON |
| P16 Preset links always 4 | quicklinks.test.js | `fc.array(linkArbitrary, {maxLength:20})` |
| P17 URL validation | quicklinks.test.js | `fc.string()` |
| P18 Valid link in localStorage | quicklinks.test.js | valid label/URL arbitraries |

### Unit Test Coverage (key examples)

- Timer displays "25:00" on init
- Timer displays completion message when `remaining` reaches 0
- Timer ignores Start when already running (no duplicate interval)
- Task input clears and retains focus after successful add
- Escape key during edit restores original task text
- Add Link button shows correct error when label is missing vs URL is missing
- Preset links have `target="_blank"` and correct `href`
- Page load with empty localStorage renders empty task list without errors
- Page load with pre-populated localStorage renders correct number of tasks
- `Storage.save` failure shows inline error, in-memory state unchanged

