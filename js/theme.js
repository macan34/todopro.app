// ===== THEME SYSTEM =====

let currentTheme = 'light';

// Initialize theme system
function initTheme() {
  // Check for saved theme preference or default to 'light'
  const savedTheme = localStorage.getItem('theme');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  
  currentTheme = savedTheme || systemTheme;
  applyTheme(currentTheme);
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme')) {
      currentTheme = e.matches ? 'dark' : 'light';
      applyTheme(currentTheme);
    }
  });
}

// Apply theme
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeToggleButton();
  currentTheme = theme;
}

// Toggle theme
function toggleTheme() {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  localStorage.setItem('theme', newTheme);
  
  showToast(
    `Switched to ${newTheme} mode`,
    'info',
    2000
  );
}

// Update theme toggle button
function updateThemeToggleButton() {
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.textContent = currentTheme === 'light' ? '🌙' : '☀️';
    themeToggle.title = `Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`;
  }
}

// Get current theme
function getCurrentTheme() {
  return currentTheme;
}

// Set specific theme
function setTheme(theme) {
  if (theme === 'light' || theme === 'dark') {
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }
}
// ===== END THEME SYSTEM =====