// == LocalStorage Keys ==
const WORK_MINUTES_KEY = 'obviaWorkMinutes';
const BREAK_MINUTES_KEY = 'obviaBreakMinutes';
const CYCLE_LENGTH_KEY = 'obviaCycleLength';
const LONG_BREAK_MINUTES_KEY = 'obviaLongBreakMinutes';
const TASKS_KEY = 'obviaTasks';

// == Helpers: Safe Get/Set localStorage ==
function safeLocalStorageGetItem(key, defaultValue) {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch {
    return defaultValue;
  }
}

function safeLocalStorageSetItem(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {}
}

function getWorkMinutes() {
  return Number(safeLocalStorageGetItem(WORK_MINUTES_KEY, '30'));
}

function getBreakMinutes() {
  return Number(safeLocalStorageGetItem(BREAK_MINUTES_KEY, '5'));
}

function getCycleLength() {
  return Number(safeLocalStorageGetItem(CYCLE_LENGTH_KEY, '4'));
}

function getLongBreakMinutes() {
  return Number(safeLocalStorageGetItem(LONG_BREAK_MINUTES_KEY, '15'));
}

// == Audio Chime ==
function playChime() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.value = 880;

  gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.35);
}

// == State ==
let WORK_MINUTES = getWorkMinutes();
let BREAK_MINUTES = getBreakMinutes();
let CYCLE_LENGTH = getCycleLength();
let LONG_BREAK_MINUTES = getLongBreakMinutes();
let WORK_DURATION = WORK_MINUTES * 60;
let BREAK_DURATION = BREAK_MINUTES * 60;
let LONG_BREAK_DURATION = LONG_BREAK_MINUTES * 60;

let isWorkSession = true;
let timer = WORK_DURATION;
let interval = null;
let isPaused = false;
let isTransitioning = false;

let sessionCount = 0;
let cycleLength = CYCLE_LENGTH;
let isLongBreak = false;

let endTime = null;

// == DOM Elements ==
const timerDisplay = document.getElementById('timer-display');
const sessionTypeDisplay = document.getElementById('session-type');
const sessionCounter = document.getElementById('session-counter');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const toast = document.getElementById('toast');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const submitBtn = taskForm.querySelector('button[type="submit"]');
const timerCard = document.querySelector('.glass-card[role="main"]');
const tasksCard = document.querySelector('.glass-card.todo-card');
const navTimerBtn = document.getElementById('nav-home');
const navTasksBtn = document.getElementById('nav-tasks');
const navThemeToggleBtn = document.getElementById('nav-theme-toggle');

// == Theme Functions ==
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  safeLocalStorageSetItem('theme', theme);
}

function updateThemeToggleBtn(theme) {
  const isDark = theme === 'dark';
  const icon = isDark ? '☀️' : '🌙';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  themeToggleBtn.textContent = icon;
  themeToggleBtn.setAttribute('aria-label', label);
  navThemeToggleBtn.textContent = icon;
  navThemeToggleBtn.setAttribute('aria-label', label);
}

const savedTheme = safeLocalStorageGetItem('theme', 'light');
applyTheme(savedTheme);
updateThemeToggleBtn(savedTheme);

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  updateThemeToggleBtn(newTheme);
});

navThemeToggleBtn.addEventListener('click', () => themeToggleBtn.click());

// == Button State Helpers ==
function setAllButtonsDisabled(disabled) {
  [startBtn, pauseBtn, resetBtn].forEach(btn => {
    btn.disabled = disabled;
    btn.classList.toggle('disabled', disabled);
  });
}

// == Toast Notifications ==
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  toast.style.display = 'block';
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.style.display = 'none', 300);
  }, 3000);
}

// == Timer Utilities ==
function formatTime(seconds) {
  const min = Math.floor(seconds / 60).toString().padStart(2, '0');
  const sec = (seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timer);
  sessionTypeDisplay.textContent = isWorkSession ? (isLongBreak ? 'Long Break' : 'Work') : 'Break';
}

function updateSessionDisplay() {
  sessionCounter.textContent = isLongBreak
    ? `On your long break! Cycle complete.`
    : `Session: ${isWorkSession ? sessionCount + 1 : sessionCount} / ${cycleLength}`;
}

// == Session End Handling ==
function handleSessionEnd() {
  setAllButtonsDisabled(true);
  isTransitioning = true;
  clearInterval(interval);
  interval = null;
  playChime();

  setTimeout(() => {
    if (isWorkSession) {
      sessionCount++;
      if (sessionCount >= cycleLength) {
        isLongBreak = true;
        showToast('Cycle complete! Time for a long break.');
        timer = LONG_BREAK_DURATION;
        sessionCount = 0;
      } else {
        showToast(`Work session complete! ${BREAK_MINUTES}-minute break starting.`);
        timer = BREAK_DURATION;
        isLongBreak = false;
      }
      isWorkSession = false;
    } else {
      isWorkSession = true;
      isLongBreak = false;
      showToast('Break over! Time to focus again.');
      timer = WORK_DURATION;
    }
    renderTimer();
    updateSessionDisplay();
    setAllButtonsDisabled(false);
    isTransitioning = false;
    startTimer();
  }, 700);
}

// == Timer Controls ==
function startTimer() {
  if (interval || isTransitioning) return;
  setAllButtonsDisabled(false);
  endTime = Date.now() + timer * 1000;
  interval = setInterval(() => {
    if (!isPaused) {
      const remaining = Math.round((endTime - Date.now()) / 1000);
      timer = remaining > 0 ? remaining : 0;
      renderTimer();
      if (timer === 0) {
        handleSessionEnd();
      }
    }
  }, 1000);
}

function pauseTimer() {
  if (isTransitioning) return;
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
}

function resetTimer() {
  if (isTransitioning) return;
  clearInterval(interval);
  interval = null;
  isPaused = false;
  pauseBtn.textContent = 'Pause';
  timer = isWorkSession ? (isLongBreak ? LONG_BREAK_DURATION : WORK_DURATION) : BREAK_DURATION;
  renderTimer();
  updateSessionDisplay();
}

// == Task Tracker Logic ==
let task = [];

// Add new task to the array
export function addTask(text) {
  task.unshift({ text, completed: false });
  renderTasks();
}

// Toggle task completion
export function toggleTask(index) {
  task[index].completed = !task[index].completed;
  renderTasks();
}

// Delete task
export function deleteTask(index) {
  task.splice(index, 1);
  renderTasks();
}

function saveTasks() {
  safeLocalStorageSetItem(TASKS_KEY, JSON.stringify(task));
}

function renderTasks() {
  taskList.innerHTML = '';
  task.forEach((task, index) => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.marginBottom = '0.5rem';

    const taskName = document.createElement('span');
    taskName.style.cursor = 'pointer';
    taskName.style.flexGrow = '1';
    taskName.style.outline = 'none';
    taskName.tabIndex = 0;
    taskName.textContent = task.text;
    if (task.completed) {
      taskName.style.textDecoration = 'line-through';
      taskName.style.color = 'gray';
      li.classList.add('completed');
    } else {
      li.classList.remove('completed');
    }

    taskName.addEventListener('click', () => toggleTask(index));
    taskName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleTask(index);
      }
    });

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✕';
    removeBtn.setAttribute('aria-label', `Remove task: ${task.text}`);
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(index);
    });

    li.appendChild(taskName);
    li.appendChild(removeBtn);
    taskList.appendChild(li);
  });
}

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newTaskText = taskInput.value.trim();
  if (!newTaskText) return;

  addTask(newTaskText);
  taskInput.value = '';
  submitBtn.disabled = true;
});

submitBtn.disabled = taskInput.value.trim() === '';
taskInput.addEventListener('input', () => {
  submitBtn.disabled = taskInput.value.trim() === '';
});

// == Bottom Nav Functions ==
function showHomeView() {
  document.querySelector('.glass-card[role="main"]').style.display = 'flex';
  document.querySelector('.glass-card.todo-card').style.display = 'none';
  navTimerBtn.setAttribute('aria-pressed', 'true');
  navTasksBtn.setAttribute('aria-pressed', 'false');
}

function showTasksView() {
  document.querySelector('.glass-card[role="main"]').style.display = 'none';
  document.querySelector('.glass-card.todo-card').style.display = 'flex';
  navTimerBtn.setAttribute('aria-pressed', 'false');
  navTasksBtn.setAttribute('aria-pressed', 'true');
}

// == Event Listeners ==

// Timer control buttons
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// Task form submission
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newTaskText = taskInput.value.trim();
  if (!newTaskText) return;

  addTask(newTaskText);
  taskInput.value = '';
  submitBtn.disabled = true;
});

// Enable/disable submit button based on input
taskInput.addEventListener('input', () => {
  submitBtn.disabled = taskInput.value.trim() === '';
});

// Navigation buttons
navTimerBtn.addEventListener('click', showHomeView);
navTasksBtn.addEventListener('click', showTasksView);

// == Initialize App ==

// Import necessary functions from other modules
import { renderTimer, updateSessionDisplay, startTimer, pauseTimer, resetTimer } from './timer.js';
import { addTask, renderTasks } from './tasks.js';
import { applyTheme, updateThemeToggleBtn } from './theme.js';

// Initialize the app
showHomeView();
renderTimer();
updateSessionDisplay();
renderTasks();

// == Service Worker Registration ==
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.log('ServiceWorker registered with scope:', registration.scope);
    }).catch(error => {
      console.error('ServiceWorker registration failed:', error);
    });
  });
}