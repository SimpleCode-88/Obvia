
import { safeLocalStorageGetItem, safeLocalStorageSetItem } from './utils.js';

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
