// ===== ACTIVITY FEED & LOGGING =====

// Activity log storage
let activityLog = [];

// Initialize activity system
function initActivity() {
  loadActivityLog();
  updateActivityFeed();
}

// Load activity log from localStorage
function loadActivityLog() {
  const saved = localStorage.getItem("activityLog");
  if (saved) {
    try {
      activityLog = JSON.parse(saved);
    } catch (e) {
      console.error("Error loading activity log:", e);
      activityLog = [];
    }
  }
}

// Save activity log to localStorage
function saveActivityLog() {
  // Keep only last 100 activities to prevent storage bloat
  if (activityLog.length > 100) {
    activityLog = activityLog.slice(-100);
  }
  localStorage.setItem("activityLog", JSON.stringify(activityLog));
}

// Log activity
function logActivity(type, data) {
  const activity = {
    id: Date.now(),
    type: type,
    timestamp: new Date().toISOString(),
    user: userName,
    data: data,
    roomId: roomId
  };
  
  activityLog.push(activity);
  saveActivityLog();
  updateActivityFeed();
  
  // Broadcast activity to other users
  broadcast({
    type: "activity",
    activity: activity
  });
}

// Handle received activity
function handleActivity(activity) {
  activityLog.push(activity);
  saveActivityLog();
  updateActivityFeed();
}

// Get activity log
function getActivityLog() {
  return activityLog.filter(a => a.roomId === roomId).slice(-50); // Last 50 activities
}

// Update activity feed UI
function updateActivityFeed() {
  const activityList = document.getElementById("activityList");
  if (!activityList) return;
  
  const activities = getActivityLog().reverse(); // Show newest first
  
  if (activities.length === 0) {
    activityList.innerHTML = '<div class="empty-activity"><p>Belum ada aktivitas</p></div>';
    return;
  }
  
  activityList.innerHTML = activities.map(activity => {
    const timeAgo = getTimeAgo(new Date(activity.timestamp));
    const activityText = formatActivityText(activity);
    
    return `
      <div class="activity-item">
        <div>${activityText}</div>
        <div class="activity-time">${timeAgo}</div>
      </div>
    `;
  }).join('');
}

// Format activity text
function formatActivityText(activity) {
  const user = activity.user;
  const data = activity.data;
  
  switch (activity.type) {
    case "todo_added":
      return `📝 <strong>${user}</strong> added task "<em>${data.title}</em>"`;
      
    case "todo_completed":
      return `✅ Task "<em>${data.title}</em>" completed by ${data.members ? data.members.join(', ') : 'all members'}`;
      
    case "todo_deleted":
      return `🗑️ <strong>${user}</strong> deleted task "<em>${data.title}</em>"`;
      
    case "comment_added":
      return `💬 <strong>${user}</strong> commented on "<em>${data.title}</em>"`;
      
    case "photo_added":
      return `📷 <strong>${user}</strong> shared a photo on "<em>${data.title}</em>"`;
      
    case "member_joined":
      return `👋 <strong>${data.userName}</strong> joined the room`;
      
    case "member_left":
      return `👋 <strong>${data.userName}</strong> left the room`;
      
    case "room_created":
      return `🏠 <strong>${user}</strong> created the room`;
      
    case "deadline_updated":
      return `⏰ <strong>${user}</strong> updated deadline for "<em>${data.title}</em>"`;
      
    case "priority_updated":
      return `📊 <strong>${user}</strong> changed priority of "<em>${data.title}</em>" to ${data.priority}`;
      
    case "assignment_updated":
      return `👥 <strong>${user}</strong> updated assignment for "<em>${data.title}</em>"`;
      
    default:
      return `${user} performed an action`;
  }
}

// Get time ago string
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Toggle activity feed visibility
function toggleActivityFeed() {
  const activityList = document.getElementById("activityList");
  if (activityList) {
    activityList.classList.toggle("hidden");
    const toggleBtn = document.querySelector(".toggle-activity");
    if (toggleBtn) {
      toggleBtn.textContent = activityList.classList.contains("hidden") ? "👁️ Show" : "👁️ Hide";
    }
  }
}

// Export activity log
function exportActivityLog() {
  const activities = getActivityLog();
  const exportData = {
    exportedAt: new Date().toISOString(),
    roomId: roomId,
    totalActivities: activities.length,
    activities: activities.map(activity => ({
      timestamp: activity.timestamp,
      user: activity.user,
      action: formatActivityText(activity).replace(/<[^>]*>/g, ''), // Strip HTML
      type: activity.type,
      data: activity.data
    }))
  };
  
  // Export as CSV
  const csvContent = [
    ['Timestamp', 'User', 'Action', 'Type', 'Details'],
    ...exportData.activities.map(a => [
      a.timestamp,
      a.user,
      a.action,
      a.type,
      JSON.stringify(a.data)
    ])
  ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `activity-log-${roomId}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  showToast("Activity log exported successfully!", "success");
}

// Clear activity log
function clearActivityLog() {
  if (confirm("Clear all activity history? This cannot be undone.")) {
    activityLog = activityLog.filter(a => a.roomId !== roomId);
    saveActivityLog();
    updateActivityFeed();
    showToast("Activity log cleared", "success");
  }
}