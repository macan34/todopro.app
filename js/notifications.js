// ===== NOTIFICATION SYSTEM =====

let notificationsEnabled = false;
let soundEnabled = true;

// Request notification permission
function requestNotificationPermission() {
  if ("Notification" in window) {
    Notification.requestPermission().then(permission => {
      notificationsEnabled = permission === "granted";
      if (notificationsEnabled) {
        showToast("Notifikasi diaktifkan!", "success");
      }
    });
  }
}

// Show browser notification
function showNotification(title, body, icon = "📝") {
  if (notificationsEnabled && "Notification" in window) {
    const notification = new Notification(title, {
      body: body,
      icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${icon}</text></svg>`,
      requireInteraction: false,
      silent: !soundEnabled
    });

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Play sound
    if (soundEnabled) {
      playNotificationSound();
    }
  }
}

// Play notification sound
function playNotificationSound() {
  try {
    const audio = document.getElementById("notificationSound");
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Ignore play errors (usually due to user interaction requirements)
      });
    }
  } catch (error) {
    console.log("Could not play notification sound:", error);
  }
}

// Show toast notification
function showToast(message, type = "info", duration = 3000) {
  const toast = document.createElement("div");
  toast.className = `notification-toast ${type}`;
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <span>${getToastIcon(type)}</span>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, duration);

  // Remove on click
  toast.addEventListener("click", () => {
    if (toast.parentNode) {
      toast.remove();
    }
  });
}

function getToastIcon(type) {
  switch (type) {
    case "success": return "✅";
    case "error": return "❌";
    case "warning": return "⚠️";
    case "info": return "ℹ️";
    default: return "📝";
  }
}

// Deadline notifications
function checkDeadlines() {
  const todos = getAllTodos();
  const now = new Date().getTime();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;

  todos.forEach(todo => {
    if (todo.deadline && !todo.completed) {
      const deadlineTime = new Date(todo.deadline).getTime();
      const timeUntilDeadline = deadlineTime - now;

      // Notify 1 hour before deadline
      if (timeUntilDeadline > 0 && timeUntilDeadline <= oneHour) {
        const lastNotified = localStorage.getItem(`deadline_notified_${todo.id}`);
        if (!lastNotified || (now - parseInt(lastNotified)) > oneHour) {
          showNotification(
            "⏰ Deadline Mendekat!",
            `Tugas "${todo.title}" akan berakhir dalam 1 jam`,
            "⏰"
          );
          localStorage.setItem(`deadline_notified_${todo.id}`, now.toString());
        }
      }

      // Notify when overdue
      if (timeUntilDeadline < 0) {
        const lastOverdueNotified = localStorage.getItem(`overdue_notified_${todo.id}`);
        if (!lastOverdueNotified || (now - parseInt(lastOverdueNotified)) > oneDay) {
          showNotification(
            "🚨 Tugas Terlambat!",
            `Tugas "${todo.title}" sudah melewati deadline`,
            "🚨"
          );
          localStorage.setItem(`overdue_notified_${todo.id}`, now.toString());
        }
      }
    }
  });
}

// Activity notifications
function notifyActivity(type, data) {
  let title, body, icon;

  switch (type) {
    case "todo_added":
      title = "📝 Tugas Baru";
      body = `${data.user} menambahkan tugas: ${data.title}`;
      icon = "📝";
      break;
    case "todo_completed":
      title = "✅ Tugas Selesai";
      body = `Tugas "${data.title}" telah diselesaikan`;
      icon = "✅";
      break;
    case "comment_added":
      title = "💬 Komentar Baru";
      body = `${data.user} menambahkan komentar`;
      icon = "💬";
      break;
    case "member_joined":
      title = "👋 Member Baru";
      body = `${data.userName} bergabung ke room`;
      icon = "👋";
      break;
    case "deadline_approaching":
      title = "⏰ Deadline Mendekat";
      body = `Tugas "${data.title}" deadline dalam ${data.timeLeft}`;
      icon = "⏰";
      break;
    default:
      return;
  }

  // Only notify if user is not the one who performed the action
  if (data.user !== userName) {
    showNotification(title, body, icon);
    showToast(`${icon} ${body}`, "info");
  }
}

// Initialize notifications
function initNotifications() {
  // Request permission on first interaction
  document.addEventListener("click", function requestOnFirstClick() {
    requestNotificationPermission();
    document.removeEventListener("click", requestOnFirstClick);
  }, { once: true });

  // Check deadlines every 5 minutes
  setInterval(checkDeadlines, 5 * 60 * 1000);
  
  // Initial deadline check
  setTimeout(checkDeadlines, 2000);
}

// Toggle sound notifications
function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem("soundEnabled", soundEnabled.toString());
  showToast(
    soundEnabled ? "🔊 Sound notifications enabled" : "🔇 Sound notifications disabled",
    "info"
  );
}

// Load sound preference
function loadSoundPreference() {
  const saved = localStorage.getItem("soundEnabled");
  if (saved !== null) {
    soundEnabled = saved === "true";
  }
}