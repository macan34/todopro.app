// ===== ANALYTICS & DASHBOARD =====

// Update dashboard statistics
function updateDashboard() {
  const todos = getAllTodos();
  const now = new Date().getTime();
  
  // Calculate statistics
  const totalTasks = todos.length;
  const completedTasks = todos.filter(t => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueTasks = todos.filter(t => {
    if (!t.deadline || t.completed) return false;
    return new Date(t.deadline).getTime() < now;
  }).length;
  
  // Update DOM
  document.getElementById("totalTasks").textContent = totalTasks;
  document.getElementById("completedTasks").textContent = completedTasks;
  document.getElementById("completionRate").textContent = completionRate + "%";
  document.getElementById("overdueTasks").textContent = overdueTasks;
  
  // Update completion rate color
  const completionElement = document.getElementById("completionRate");
  if (completionRate >= 80) {
    completionElement.style.color = "#10b981";
  } else if (completionRate >= 50) {
    completionElement.style.color = "#f59e0b";
  } else {
    completionElement.style.color = "#ef4444";
  }
  
  // Update overdue tasks color
  const overdueElement = document.getElementById("overdueTasks");
  if (overdueTasks > 0) {
    overdueElement.style.color = "#ef4444";
    overdueElement.parentElement.classList.add("urgent");
  } else {
    overdueElement.style.color = "#10b981";
    overdueElement.parentElement.classList.remove("urgent");
  }
}

// Member performance metrics
function getMemberPerformance() {
  const todos = getAllTodos();
  const memberStats = {};
  
  // Initialize member stats
  roomMembers.forEach(member => {
    memberStats[member] = {
      assigned: 0,
      completed: 0,
      overdue: 0,
      averageCompletionTime: 0,
      totalCompletionTime: 0,
      completedCount: 0
    };
  });
  
  // Calculate stats
  todos.forEach(todo => {
    if (todo.assignedTo && todo.assignedTo.length > 0) {
      todo.assignedTo.forEach(member => {
        if (memberStats[member]) {
          memberStats[member].assigned++;
          
          if (todo.completed) {
            memberStats[member].completed++;
            memberStats[member].completedCount++;
            
            // Calculate completion time
            if (todo.createdAt && todo.completedAt) {
              const completionTime = todo.completedAt - todo.createdAt;
              memberStats[member].totalCompletionTime += completionTime;
              memberStats[member].averageCompletionTime = 
                memberStats[member].totalCompletionTime / memberStats[member].completedCount;
            }
          } else if (todo.deadline && new Date(todo.deadline).getTime() < Date.now()) {
            memberStats[member].overdue++;
          }
        }
      });
    }
  });
  
  return memberStats;
}

// Export analytics data
function exportAnalytics() {
  const analytics = {
    generatedAt: new Date().toISOString(),
    roomId: roomId,
    totalMembers: roomMembers.size,
    dashboard: {
      totalTasks: getAllTodos().length,
      completedTasks: getAllTodos().filter(t => t.completed).length,
      overdueTasks: getAllTodos().filter(t => {
        if (!t.deadline || t.completed) return false;
        return new Date(t.deadline).getTime() < Date.now();
      }).length,
      completionRate: getAllTodos().length > 0 ? 
        Math.round((getAllTodos().filter(t => t.completed).length / getAllTodos().length) * 100) : 0
    },
    memberPerformance: getMemberPerformance(),
    activityLog: getActivityLog()
  };

  const blob = new Blob([JSON.stringify(analytics, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-${roomId}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast("Analytics exported successfully!", "success");
}

// Time tracking
function startTimeTracking(todoId) {
  const startTime = Date.now();
  localStorage.setItem(`time_tracking_${todoId}`, startTime.toString());
}

function stopTimeTracking(todoId) {
  const startTime = localStorage.getItem(`time_tracking_${todoId}`);
  if (startTime) {
    const endTime = Date.now();
    const duration = endTime - parseInt(startTime);
    localStorage.removeItem(`time_tracking_${todoId}`);
    
    // Save time spent
    const todos = getAllTodos();
    const todoIndex = todos.findIndex(t => t.id === todoId);
    if (todoIndex !== -1) {
      if (!todos[todoIndex].timeSpent) {
        todos[todoIndex].timeSpent = 0;
      }
      todos[todoIndex].timeSpent += duration;
      localStorage.setItem("todos", JSON.stringify(todos));
    }
    
    return duration;
  }
  return 0;
}

// Format duration for display
function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Priority-based scoring
function calculatePriorityScore(todo) {
  let score = 0;
  
  // Base score by priority
  switch (todo.priority) {
    case 'high': score += 100; break;
    case 'medium': score += 50; break;
    case 'low': score += 25; break;
    default: score += 50;
  }
  
  // Deadline urgency
  if (todo.deadline) {
    const now = new Date().getTime();
    const deadline = new Date(todo.deadline).getTime();
    const timeUntilDeadline = deadline - now;
    const daysUntilDeadline = timeUntilDeadline / (1000 * 60 * 60 * 24);
    
    if (timeUntilDeadline < 0) {
      // Overdue - highest priority
      score += 200;
    } else if (daysUntilDeadline <= 1) {
      // Due within 24 hours
      score += 150;
    } else if (daysUntilDeadline <= 3) {
      // Due within 3 days
      score += 100;
    } else if (daysUntilDeadline <= 7) {
      // Due within a week
      score += 50;
    }
  }
  
  return score;
}