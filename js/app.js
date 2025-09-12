// ===== MAIN APP INITIALIZATION =====

window.addEventListener("load", () => {
  // Initialize theme system first
  initTheme();
  
  // Initialize notifications system
  initNotifications();
  loadSoundPreference();
  
  // Initialize keyboard shortcuts
  initShortcuts();
  
  // Load session and auto-login
  const session = loadSession();
  if (session) {
    userName = session.userName;
    roomId = session.roomId;
    role = session.role;
    
    if (role === "mentor") {
      autoCreateRoom();
    } else if (role === "member") {
      autoJoinRoom();
    }
  }
  
  // Load todos if session exists
  if (role) {
    loadLocalTodos();
  }
  
  // Initialize periodic updates
  setInterval(() => {
    updateDashboard();
    checkDeadlines();
  }, 30000); // Update every 30 seconds
  
  // Add mobile responsiveness
  adjustForMobile();
});

// Handle visibility change for notifications
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Page became visible, update dashboard
    updateDashboard();
  }
});

// Global error handler
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  showToast('Something went wrong. Please try again.', 'error');
});

// Service worker registration for offline support (optional)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(err => {
    console.log('Service Worker registration failed:', err);
  });
}