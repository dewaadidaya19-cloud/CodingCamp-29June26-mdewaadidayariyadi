(function () {
  'use strict';

  // ── Preset links ───────────────────────────────────────────────
  const PRESET_LINKS = [
    { label: 'Gmail',     url: 'https://mail.google.com' },
    { label: 'YouTube',   url: 'https://www.youtube.com' },
    { label: 'GitHub',    url: 'https://github.com' },
    { label: 'Wikipedia', url: 'https://wikipedia.org' },
  ];

  // ── Storage ────────────────────────────────────────────────────
  const Storage = {
    load(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw);
      } catch (e) {
        console.warn('[Storage] Failed to parse "' + key + '":', e);
        return fallback;
      }
    },
    save(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
  };

  // ── Theme ──────────────────────────────────────────────────────
  const Theme = {
    apply(dark) {
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      const btn = document.getElementById('theme-toggle');
      if (btn) btn.textContent = dark ? '☀️' : '🌙';
    },
    toggle() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const next = !isDark;
      Theme.apply(next);
      Storage.save('theme', next ? 'dark' : 'light');
    },
    init() {
      const saved = Storage.load('theme', null);
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      Theme.apply(saved ? saved === 'dark' : prefersDark);
    },
  };

  // ── User Name ──────────────────────────────────────────────────
  const UserName = {
    get() {
      return Storage.load('user-name', null);
    },
    save(name) {
      Storage.save('user-name', name);
    },
    showModal(isFirstVisit) {
      const modal = document.getElementById('name-modal');
      const input = document.getElementById('name-input');
      const title = document.getElementById('modal-title');
      title.textContent = isFirstVisit ? "Welcome! What's your name?" : 'Change your name';
      input.value = isFirstVisit ? '' : (UserName.get() || '');
      modal.removeAttribute('hidden');
      setTimeout(function () { input.focus(); }, 50);
    },
    hideModal() {
      document.getElementById('name-modal').setAttribute('hidden', '');
    },
    init() {
      const name = UserName.get();
      if (!name) {
        UserName.showModal(true);
      }

      // Save button
      document.getElementById('name-save-btn').addEventListener('click', function () {
        UserName.handleSave();
      });
      // Enter key inside modal input
      document.getElementById('name-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') UserName.handleSave();
        if (e.key === 'Escape') {
          // Only allow closing if a name is already saved
          if (UserName.get()) UserName.hideModal();
        }
      });
      // Click outside modal closes it (only if name already exists)
      document.getElementById('name-modal').addEventListener('click', function (e) {
        if (e.target === document.getElementById('name-modal') && UserName.get()) {
          UserName.hideModal();
        }
      });
      // Edit name button
      document.getElementById('name-edit-btn').addEventListener('click', function () {
        UserName.showModal(false);
      });
    },
    handleSave() {
      const input = document.getElementById('name-input');
      const name = input.value.trim();
      if (!name) {
        input.focus();
        return;
      }
      UserName.save(name);
      UserName.hideModal();
      HeaderRenderer.render();   // refresh greeting with new name
    },
  };

  // ── Utilities ──────────────────────────────────────────────────
  const Utils = {
    generateId() {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },

    formatDate(date) {
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    },

    formatTime(h, m, s) {
      return [h, m, s].map(function (n) { return String(n).padStart(2, '0'); }).join(':');
    },

    getGreeting(hour) {
      if (hour >= 5 && hour <= 11) return 'Good Morning';
      if (hour >= 12 && hour <= 17) return 'Good Afternoon';
      return 'Good Evening';
    },

    formatTimer(seconds) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    },

    isValidUrl(url) {
      return typeof url === 'string' &&
        (url.startsWith('http://') || url.startsWith('https://'));
    },
  };

  // ── Header ─────────────────────────────────────────────────────
  const HeaderRenderer = {
    render() {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const s = now.getSeconds();
      document.getElementById('header-date').textContent  = Utils.formatDate(now);
      document.getElementById('header-clock').textContent = Utils.formatTime(h, m, s);
      const name = UserName.get();
      const greeting = Utils.getGreeting(h) + (name ? ', ' + name : '');
      document.getElementById('header-greeting').textContent = greeting;
    },
  };

  let clockIntervalId = null;

  function startClock() {
    HeaderRenderer.render();
    clockIntervalId = setInterval(function () { HeaderRenderer.render(); }, 1000);
    return clockIntervalId;
  }

  function stopClock() {
    clearInterval(clockIntervalId);
    clockIntervalId = null;
  }

  // ── Focus Timer ────────────────────────────────────────────────
  const timerState = {
    remaining: 1500,   // 25 minutes in seconds
    isRunning: false,
    intervalId: null,
  };

  const TimerRenderer = {
    render() {
      document.getElementById('timer-display').textContent = Utils.formatTimer(timerState.remaining);
      const msg = document.getElementById('timer-message');
      if (timerState.remaining === 0) {
        msg.removeAttribute('hidden');
      } else {
        msg.setAttribute('hidden', '');
      }
    },
  };

  const TimerHandlers = {
    onStart() {
      if (timerState.isRunning) return;
      timerState.isRunning = true;
      timerState.intervalId = setInterval(function () { TimerHandlers.onTick(); }, 1000);
      TimerRenderer.render();
    },
    onStop() {
      if (!timerState.isRunning) return;
      clearInterval(timerState.intervalId);
      timerState.intervalId = null;
      timerState.isRunning = false;
      TimerRenderer.render();
    },
    onReset() {
      clearInterval(timerState.intervalId);
      timerState.remaining = 1500;
      timerState.isRunning = false;
      timerState.intervalId = null;
      document.getElementById('timer-message').setAttribute('hidden', '');
      TimerRenderer.render();
    },
    onTick() {
      timerState.remaining -= 1;
      if (timerState.remaining <= 0) {
        timerState.remaining = 0;
        TimerHandlers.onStop();
        document.getElementById('timer-message').textContent = '🎉 Focus session complete! Take a break.';
        document.getElementById('timer-message').removeAttribute('hidden');
        return;
      }
      TimerRenderer.render();
    },
  };

  // ── To-Do List ─────────────────────────────────────────────────
  const state = { tasks: [], links: [] };

  const TodoRenderer = {
    render() {
      const list = document.getElementById('todo-list');
      list.innerHTML = '';

      if (state.tasks.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'todo__empty';
        empty.textContent = 'No tasks yet. Add one above!';
        list.appendChild(empty);
        return;
      }

      state.tasks.forEach(function (task) {
        const li = document.createElement('li');
        li.className = 'task' + (task.completed ? ' task--completed' : '');
        li.dataset.id = task.id;

        const span = document.createElement('span');
        span.className = 'task__text';
        span.textContent = task.text;

        const completeBtn = document.createElement('button');
        completeBtn.className = 'task__complete';
        completeBtn.type = 'button';
        completeBtn.title = task.completed ? 'Mark incomplete' : 'Mark complete';
        completeBtn.textContent = task.completed ? '↺' : '✓';

        const editBtn = document.createElement('button');
        editBtn.className = 'task__edit';
        editBtn.type = 'button';
        editBtn.title = 'Edit task';
        editBtn.textContent = '✎';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'task__delete';
        deleteBtn.type = 'button';
        deleteBtn.title = 'Delete task';
        deleteBtn.textContent = '✕';

        li.appendChild(span);
        li.appendChild(completeBtn);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        list.appendChild(li);
      });
    },
  };

  const TodoHandlers = {
    onAdd() {
      const input = document.getElementById('todo-input');
      const errorEl = document.getElementById('todo-error');
      const text = input.value.trim();
      if (!text) {
        input.focus();
        return;
      }

      // Duplicate check — only against unfinished tasks
      const duplicate = state.tasks.some(function (t) {
        return !t.completed && t.text.toLowerCase() === text.toLowerCase();
      });
      if (duplicate) {
        errorEl.textContent = '⚠️ You already have that task.';
        errorEl.removeAttribute('hidden');
        input.focus();
        return;
      }
      errorEl.setAttribute('hidden', '');
      errorEl.textContent = '';

      state.tasks.push({ id: Utils.generateId(), text: text, completed: false, createdAt: Date.now() });
      try { Storage.save('todo-tasks', state.tasks); }
      catch (e) { errorEl.removeAttribute('hidden'); }
      input.value = '';
      input.focus();
      TodoRenderer.render();
    },

    onComplete(id) {
      const task = state.tasks.find(function (t) { return t.id === id; });
      if (!task) return;
      task.completed = !task.completed;
      try { Storage.save('todo-tasks', state.tasks); } catch (e) { /* ignore */ }
      TodoRenderer.render();
    },

    onEdit(id) {
      const task = state.tasks.find(function (t) { return t.id === id; });
      if (!task) return;
      const li = document.querySelector('#todo-list li[data-id="' + id + '"]');
      if (!li) return;

      li.innerHTML = '';

      const input = document.createElement('input');
      input.className = 'task__edit-input';
      input.type = 'text';
      input.maxLength = 500;
      input.value = task.text;

      const saveBtn = document.createElement('button');
      saveBtn.className = 'task__save';
      saveBtn.type = 'button';
      saveBtn.textContent = 'Save';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'task__cancel';
      cancelBtn.type = 'button';
      cancelBtn.textContent = '✕';
      cancelBtn.title = 'Cancel edit';

      li.appendChild(input);
      li.appendChild(saveBtn);
      li.appendChild(cancelBtn);
      input.focus();
      input.select();
    },

    onSave(id) {
      const task = state.tasks.find(function (t) { return t.id === id; });
      if (!task) return;
      const li = document.querySelector('#todo-list li[data-id="' + id + '"]');
      if (!li) return;
      const input = li.querySelector('.task__edit-input');
      if (!input) return;
      const newText = input.value.trim();
      if (newText) task.text = newText;
      try { Storage.save('todo-tasks', state.tasks); } catch (e) { /* ignore */ }
      TodoRenderer.render();
    },

    onDelete(id) {
      state.tasks = state.tasks.filter(function (t) { return t.id !== id; });
      try { Storage.save('todo-tasks', state.tasks); } catch (e) { /* ignore */ }
      TodoRenderer.render();
    },
  };

  // Event delegation on the list
  function attachTodoListeners() {
    const input = document.getElementById('todo-input');
    const addBtn = document.getElementById('todo-add');
    const list = document.getElementById('todo-list');

    addBtn.addEventListener('click', function () { TodoHandlers.onAdd(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') TodoHandlers.onAdd();
    });

    list.addEventListener('click', function (e) {
      const btn = e.target.closest('button');
      if (!btn) return;
      const li = btn.closest('li[data-id]');
      if (!li) return;
      const id = li.dataset.id;

      if (btn.classList.contains('task__complete'))  { TodoHandlers.onComplete(id); return; }
      if (btn.classList.contains('task__edit'))      { TodoHandlers.onEdit(id);     return; }
      if (btn.classList.contains('task__save'))      { TodoHandlers.onSave(id);     return; }
      if (btn.classList.contains('task__cancel'))    { TodoRenderer.render();       return; }
      if (btn.classList.contains('task__delete'))    { TodoHandlers.onDelete(id);   return; }
    });

    list.addEventListener('keydown', function (e) {
      const li = e.target.closest('li[data-id]');
      if (!li) return;
      const id = li.dataset.id;
      if (e.target.classList.contains('task__edit-input')) {
        if (e.key === 'Enter')  { TodoHandlers.onSave(id); }
        if (e.key === 'Escape') { TodoRenderer.render(); }
      }
    });
  }

  // ── Quick Links ────────────────────────────────────────────────
  const QuickLinksRenderer = {
    renderPresets() {
      const container = document.getElementById('links-preset');
      container.innerHTML = '';
      PRESET_LINKS.forEach(function (link) {
        const a = document.createElement('a');
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = link.label;
        container.appendChild(a);
      });
    },
    render() {
      const container = document.getElementById('links-user');
      container.innerHTML = '';
      state.links.forEach(function (link) {
        const wrapper = document.createElement('span');
        wrapper.className = 'link__wrapper';

        const a = document.createElement('a');
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = link.label;
        a.dataset.id = link.id;

        const del = document.createElement('button');
        del.className = 'link__delete';
        del.type = 'button';
        del.title = 'Remove link';
        del.textContent = '✕';
        del.dataset.id = link.id;

        wrapper.appendChild(a);
        wrapper.appendChild(del);
        container.appendChild(wrapper);
      });
    },
  };

  const QuickLinksHandlers = {
    onAdd() {
      const labelInput = document.getElementById('link-label');
      const urlInput   = document.getElementById('link-url');
      const errorEl    = document.getElementById('links-error');
      const label = labelInput.value.trim();
      const url   = urlInput.value.trim();

      errorEl.setAttribute('hidden', '');
      errorEl.textContent = '';

      if (!label) {
        errorEl.textContent = 'Please enter a label.';
        errorEl.removeAttribute('hidden');
        labelInput.focus();
        return;
      }
      if (!Utils.isValidUrl(url)) {
        errorEl.textContent = 'URL must start with http:// or https://';
        errorEl.removeAttribute('hidden');
        urlInput.focus();
        return;
      }
      if (state.links.length >= 20) {
        errorEl.textContent = 'Maximum 20 links reached.';
        errorEl.removeAttribute('hidden');
        return;
      }

      state.links.push({ id: Utils.generateId(), label: label, url: url, createdAt: Date.now() });
      try { Storage.save('quick-links', state.links); } catch (e) { /* ignore */ }
      QuickLinksRenderer.render();
      labelInput.value = '';
      urlInput.value = '';
      labelInput.focus();
    },

    onDelete(id) {
      state.links = state.links.filter(function (l) { return l.id !== id; });
      try { Storage.save('quick-links', state.links); } catch (e) { /* ignore */ }
      QuickLinksRenderer.render();
    },
  };

  function attachLinksListeners() {
    document.getElementById('link-add').addEventListener('click', function () {
      QuickLinksHandlers.onAdd();
    });
    document.getElementById('link-url').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') QuickLinksHandlers.onAdd();
    });
    document.getElementById('links-user').addEventListener('click', function (e) {
      const btn = e.target.closest('.link__delete');
      if (btn) QuickLinksHandlers.onDelete(btn.dataset.id);
    });
  }

  // ── init ───────────────────────────────────────────────────────
  function init() {
    // Theme
    Theme.init();
    document.getElementById('theme-toggle').addEventListener('click', function () { Theme.toggle(); });

    // User name
    UserName.init();

    // Header clock
    startClock();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stopClock(); } else { startClock(); }
    });

    // Focus Timer
    TimerRenderer.render();
    document.getElementById('timer-start').addEventListener('click', function () { TimerHandlers.onStart(); });
    document.getElementById('timer-stop').addEventListener('click',  function () { TimerHandlers.onStop();  });
    document.getElementById('timer-reset').addEventListener('click', function () { TimerHandlers.onReset(); });

    // To-Do List
    state.tasks = Storage.load('todo-tasks', []);
    TodoRenderer.render();
    attachTodoListeners();

    // Quick Links
    state.links = Storage.load('quick-links', []);
    QuickLinksRenderer.renderPresets();
    QuickLinksRenderer.render();
    attachLinksListeners();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
