# Requirements Document

## Introduction

The To-Do Life Dashboard is a single-page web application built with plain HTML, CSS, and Vanilla JavaScript. It serves as a personal productivity hub with four main sections: a header displaying live date/time and a greeting, a Pomodoro-style focus timer, a persistent to-do list, and a quick-access links panel. All user data is persisted in the browser's Local Storage. The application uses no external frameworks or libraries.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Header**: The top section of the Dashboard showing date, time, and greeting.
- **Focus_Timer**: The card component implementing a 25-minute countdown timer.
- **Todo_List**: The card component managing the user's task items.
- **Task**: A single item in the Todo_List with text, completion state, and action controls.
- **Quick_Links**: The card component providing pre-set and user-defined URL shortcuts.
- **Link**: A single entry in the Quick_Links card with a label and a URL.
- **Local_Storage**: The browser's `localStorage` API used to persist Tasks and Links across sessions.
- **Clock**: The live time display in the Header that updates every second.
- **Greeting**: A contextual salutation displayed in the Header based on the current hour.

---

## Requirements

### Requirement 1: Header — Live Date and Time Display

**User Story:** As a user, I want to see the current date and a live clock in the header, so that I always know the current time without switching applications.

#### Acceptance Criteria

1. THE Header SHALL display the current date in a human-readable format using the user's locale (e.g., "Tuesday, July 1, 2026" for en-US), including the full weekday name, month name, day, and year.
2. THE Clock SHALL display the current local time in 24-hour HH:MM:SS format, with each component zero-padded to two digits.
3. WHEN the Dashboard page loads, THE Clock SHALL begin updating the displayed time at least once per second so that the displayed seconds always reflect the current local time.
4. WHILE the Dashboard page is open, THE Clock SHALL remain accurate to within 1 second of the actual local time.
5. WHEN the user navigates away from or closes the Dashboard page, THE Dashboard SHALL stop all active clock update timers to release resources.

---

### Requirement 2: Header — Contextual Greeting

**User Story:** As a user, I want to see a greeting that changes based on the time of day, so that the dashboard feels personal and contextually aware.

#### Acceptance Criteria

1. WHEN the current local hour is between 5 and 11 (inclusive), THE Header SHALL display the greeting "Good Morning".
2. WHEN the current local hour is between 12 and 17 (inclusive), THE Header SHALL display the greeting "Good Afternoon".
3. WHEN the current local hour is between 18 and 23 (inclusive), OR between 0 and 4 (inclusive), THE Header SHALL display the greeting "Good Evening".
4. WHEN the Dashboard page loads, THE Header SHALL evaluate the current local hour and render the appropriate greeting within 500 milliseconds, without requiring a page refresh.
5. IF the current local hour falls outside the ranges defined in criteria 1–3 due to an unexpected value, THEN THE Header SHALL default to displaying the greeting "Good Evening".

---

### Requirement 3: Focus Timer — Countdown Display and Controls

**User Story:** As a user, I want a Pomodoro-style countdown timer, so that I can manage focused work sessions of 25 minutes.

#### Acceptance Criteria

1. THE Focus_Timer SHALL display a default countdown value of 25 minutes 00 seconds (25:00) on page load.
2. THE Focus_Timer SHALL provide a Start button, a Stop button, and a Reset button.
3. WHEN the Start button is activated, THE Focus_Timer SHALL begin decrementing the countdown display by one second every 1000 milliseconds.
4. WHEN the Stop button is activated, THE Focus_Timer SHALL pause the countdown at the current value without resetting it.
5. WHEN the Reset button is activated, THE Focus_Timer SHALL stop the countdown and restore the display to 25:00.
6. WHILE the countdown is running, THE Focus_Timer SHALL display the remaining time in MM:SS format.
7. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a visible on-page message indicating the session is complete.
8. IF the Start button is activated while the timer is already running, THEN THE Focus_Timer SHALL ignore the duplicate activation and continue the current session.
9. IF the Stop button is activated while the timer is not running, THEN THE Focus_Timer SHALL ignore the activation and preserve the current displayed countdown value.
10. WHEN the countdown has reached 00:00, THE Focus_Timer SHALL allow the user to start a new 25:00 session by activating the Start button.

---

### Requirement 4: To-Do List — Task Creation

**User Story:** As a user, I want to add tasks to a list, so that I can track what I need to accomplish.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a text input field (maximum 500 characters) and an Add button for creating new Tasks.
2. WHEN the Add button is activated and the input field contains one or more non-whitespace characters, THE Todo_List SHALL create a new Task using the trimmed input text and append it to the task list.
3. WHEN a new Task is created, THE Todo_List SHALL clear the input field and retain focus on the input field.
4. IF the Add button is activated and the input field is empty or contains only whitespace, THEN THE Todo_List SHALL not create a Task and SHALL retain focus on the input field.
5. WHEN the user presses the Enter key while the input field is focused, THE Todo_List SHALL trigger the same behavior as activating the Add button.
6. IF the user attempts to enter more than 500 characters in the input field, THEN THE Todo_List SHALL prevent input beyond 500 characters.

---

### Requirement 5: To-Do List — Task Actions (Edit, Complete, Delete)

**User Story:** As a user, I want to edit, complete, and delete tasks, so that I can keep my list accurate and up to date.

#### Acceptance Criteria

1. THE Todo_List SHALL render each Task with an Edit button, a Complete button, and a Delete button.
2. WHEN the Complete button of a Task is activated, THE Todo_List SHALL toggle the Task's completion state; completed Tasks SHALL display with strikethrough text and incomplete Tasks SHALL display without strikethrough.
3. WHEN the Edit button of a Task is activated, THE Todo_List SHALL replace the Task's text display with a single-line text input pre-filled with the current Task text, and focus SHALL be placed on the input.
4. WHEN the user confirms an edit (via a Save button or the Enter key), THE Todo_List SHALL update the Task's text to the trimmed new value and restore the standard display mode.
5. IF the user confirms an edit with an empty or whitespace-only value, THEN THE Todo_List SHALL not update the Task and SHALL restore the original text in standard display mode.
6. WHEN the user presses the Escape key while in edit mode, THE Todo_List SHALL cancel the edit and restore the original Task text in standard display mode.
7. WHEN the Delete button of a Task is activated, THE Todo_List SHALL remove the Task from the list immediately; remaining Tasks SHALL shift up to fill the gap without reordering.

---

### Requirement 6: To-Do List — Local Storage Persistence

**User Story:** As a user, I want my tasks to be saved between browser sessions, so that I do not lose my list when I close or refresh the page.

#### Acceptance Criteria

1. WHEN a Task is created, edited, completed, or deleted, THE Todo_List SHALL write the updated task array to Local_Storage under the key `"todo-tasks"` before the UI update renders.
2. WHEN the Dashboard page loads, THE Todo_List SHALL read the task array from Local_Storage under the key `"todo-tasks"` and render all previously saved Tasks within 500 milliseconds.
3. IF no task data exists in Local_Storage on page load, THEN THE Todo_List SHALL render an empty list without error.
4. IF a Local_Storage write operation fails (e.g., quota exceeded or access denied), THEN THE Todo_List SHALL display an inline error message and retain the current in-memory task list.
5. IF the data read from Local_Storage under the key `"todo-tasks"` is corrupted or cannot be parsed as a valid task array, THEN THE Todo_List SHALL discard the corrupted data, log a console warning, and render an empty list without error.

---

### Requirement 7: Quick Links — Pre-set Links

**User Story:** As a user, I want quick-access buttons for common sites, so that I can navigate to them in one click.

#### Acceptance Criteria

1. WHEN the Dashboard page loads, THE Quick_Links card SHALL display exactly four pre-set link buttons: "Gmail" (https://mail.google.com), "YouTube" (https://www.youtube.com), "GitHub" (https://github.com), and "ChatGPT" (https://chat.openai.com).
2. WHEN a pre-set link button is activated, THE Dashboard SHALL open the corresponding URL in a new browser tab without navigating away from the Dashboard.
3. THE Quick_Links card SHALL render all four pre-set link buttons regardless of whether any user-defined Links exist.
4. IF the URL associated with a pre-set link button is unreachable, THEN THE Dashboard SHALL still open the tab with the stored URL and SHALL NOT display an error message on the Dashboard itself.

---

### Requirement 8: Quick Links — User-Defined Links

**User Story:** As a user, I want to add my own custom links to the Quick Links card, so that I can access my most-used sites quickly.

#### Acceptance Criteria

1. THE Quick_Links card SHALL provide a text input for a link label (maximum 50 characters) and a text input for a URL (maximum 2048 characters), along with an Add Link button.
2. WHEN the Add Link button is activated and both the label and URL fields contain non-whitespace characters and the URL begins with "http://" or "https://", THE Quick_Links card SHALL create a new Link and display it as a button.
3. IF the Add Link button is activated and either field is empty or whitespace-only, THEN THE Quick_Links card SHALL not create a Link and SHALL display an inline error message indicating which field is missing.
4. IF the Add Link button is activated and the URL does not begin with "http://" or "https://", THEN THE Quick_Links card SHALL not create a Link and SHALL display an inline error message indicating the URL format is invalid.
5. WHEN a user-defined Link button is activated, THE Dashboard SHALL open the stored URL in a new browser tab without navigating away from the Dashboard.
6. IF the Add Link button is activated and the number of user-defined Links already stored equals 20, THEN THE Quick_Links card SHALL not create the new Link and SHALL display an inline error message indicating the maximum limit has been reached.
7. WHEN a user-defined Link is successfully added and the total stored links are fewer than 20, THE Quick_Links card SHALL write the updated link array to Local_Storage under the key `"quick-links"`.
8. WHEN the Dashboard page loads, THE Quick_Links card SHALL read the link array from Local_Storage under the key `"quick-links"` and render all previously saved user-defined Links before any user interaction.
9. IF no link data exists in Local_Storage on page load, THEN THE Quick_Links card SHALL render only the pre-set links without error.

---

### Requirement 9: Layout and Visual Design

**User Story:** As a user, I want the dashboard to be visually clean, organized, and responsive, so that it is comfortable to use on any screen size.

#### Acceptance Criteria

1. THE Dashboard SHALL use semantic HTML elements (`<header>`, `<main>`, `<section>`, `<article>`) for structural markup.
2. THE Dashboard SHALL organize the Focus_Timer, Todo_List, and Quick_Links into distinct card components, each with a border-radius of at least 4px, a visible drop shadow, and internal padding of at least 12px on all sides.
3. THE Dashboard SHALL use a CSS layout (CSS Grid or Flexbox) that adapts the card arrangement to the available viewport width.
4. WHEN the viewport width is less than 768px, THE Dashboard SHALL display cards in a single-column stacked layout with no horizontal scrolling at viewport widths of 320px or wider.
5. WHEN the viewport width is 768px or greater, THE Dashboard SHALL display cards in a multi-column layout.
6. THE Dashboard SHALL render correctly with no network connection, confirming it does not depend on any external CSS framework, JavaScript library, or CDN resource.
7. THE Dashboard SHALL separate all styling into `css/style.css` and all behavior into `js/script.js`, referenced from `index.html`; `index.html` SHALL contain no inline `<style>` blocks and no inline `<script>` blocks.
