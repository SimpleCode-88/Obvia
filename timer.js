
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

// == Timer Controls ==
let interval = null;
let isPaused = false;
let timer = WORK_DURATION; // Ensure WORK_DURATION is defined and initialized

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

// Export necessary functions
export { renderTimer, updateSessionDisplay, startTimer, pauseTimer, resetTimer };
