// ===== UI HELPER FUNCTIONS =====

function initApp(title, info) {
  document.getElementById("authSection").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("roomTitle").innerText = title;
  document.getElementById("userRole").innerText = info;
  
  // Pastikan semua form di-hide dulu
  document.getElementById("addTodoForm").classList.add("hidden");
  document.getElementById("memberInfo").classList.add("hidden");
  
  // Tampilkan form add todo hanya untuk mentor
  if (role === "mentor") {
    document.getElementById("addTodoForm").classList.remove("hidden");
    updateMemberCheckboxes();
  } else if (role === "member") {
    document.getElementById("memberInfo").classList.remove("hidden");
  }
  
  // Initialize all components
  initTemplates();
  initActivity();
  updateDashboard();
  updateEmptyState();
}

function updateMemberCheckboxes() {
  const container = document.getElementById("memberCheckboxes");
  if (!container) return;
  
  container.innerHTML = "";
  
  // Add checkboxes for all members except mentor
  Array.from(roomMembers).forEach(member => {
    if (member !== userName) { // Don't include mentor in assignment options
      const label = document.createElement("label");
      label.className = "member-checkbox";
      
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = member;
      checkbox.id = `assign-${member}`;
      
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(member));
      
      container.appendChild(label);
    }
  });
  
  // If no members to assign, show message
  if (container.children.length === 0) {
    container.innerHTML = '<p style="color: #6b7280; font-size: 0.875rem;">No members to assign</p>';
  }
}

function updateEmptyState() {
  const todoList = document.getElementById("todoList");
  const todos = todoList.querySelectorAll(".todo-item:not([style*='display: none'])"); // Only count visible todos
  const emptyState = todoList.querySelector(".empty-state");
  
  if (todos.length === 0) {
    if (!emptyState) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "empty-state";
      if (role === "mentor") {
        emptyDiv.innerHTML = `
          <p>Belum ada tugas</p>
          <small>Tambahkan tugas pertama Anda!</small>
        `;
      } else {
        emptyDiv.innerHTML = `
          <p>Belum ada tugas</p>
          <small>Mentor akan menambahkan tugas untuk Anda!</small>
        `;
      }
      todoList.appendChild(emptyDiv);
    }
  } else {
    if (emptyState) {
      emptyState.remove();
    }
  }
}

function logout() {
  // Log activity
  if (userName && roomId) {
    logActivity("member_left", { userName: userName });
  }
  
  // Stop any active time tracking
  const todos = getAllTodos();
  todos.forEach(todo => {
    stopTimeTracking(todo.id);
  });
  
  clearAllData();
  location.reload();
}

function escapeHtml(str) {
  if (!str && str !== "") return "";
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Data export/import functions
function exportData() {
  const exportData = {
    version: "2.0",
    exportedAt: new Date().toISOString(),
    roomInfo: {
      roomId: roomId,
      members: Array.from(roomMembers)
    },
    todos: getAllTodos(),
    templates: getAllTemplates(),
    activityLog: getActivityLog(),
    analytics: {
      totalTasks: getAllTodos().length,
      completedTasks: getAllTodos().filter(t => t.completed).length,
      memberPerformance: getMemberPerformance()
    }
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `todopro-export-${roomId}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast("Data exported successfully!", "success");
  logActivity("data_exported", { exportedBy: userName });
}

function importData() {
  const fileInput = document.getElementById("importFile");
  const file = fileInput.files[0];
  
  if (!file) {
    showToast("Please select a file to import", "error");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importData = JSON.parse(e.target.result);
      
      if (!importData.version) {
        showToast("Invalid file format", "error");
        return;
      }
      
      let imported = 0;
      
      // Import todos
      if (importData.todos && Array.isArray(importData.todos)) {
        const currentTodos = getAllTodos();
        importData.todos.forEach(todo => {
          const exists = currentTodos.find(t => t.id === todo.id);
          if (!exists) {
            renderTodo(todo);
            imported++;
          }
        });
        saveTodos();
      }
      
      // Import templates
      if (importData.templates && Array.isArray(importData.templates)) {
        const currentTemplates = getAllTemplates();
        importData.templates.forEach(template => {
          const exists = currentTemplates.find(t => t.name === template.name);
          if (!exists) {
            addTemplate(template);
          }
        });
      }
      
      // Import activity log
      if (importData.activityLog && Array.isArray(importData.activityLog)) {
        importData.activityLog.forEach(activity => {
          handleActivity(activity);
        });
      }
      
      updateEmptyState();
      updateDashboard();
      showToast(`Import completed! ${imported} items imported`, "success");
      logActivity("data_imported", { importedBy: userName, itemsCount: imported });
      
    } catch (error) {
      showToast("Error importing data: " + error.message, "error");
    }
  };
  
  reader.readAsText(file);
  fileInput.value = ""; // Clear the input
}

// Member management functions
function kickMember(memberName) {
  if (role !== "mentor") {
    showToast("Only mentors can kick members", "error");
    return;
  }
  
  if (confirm(`Kick ${memberName} from the room?`)) {
    roomMembers.delete(memberName);
    updateMemberList();
    updateMemberCheckboxes();
    
    // Broadcast member removal
    broadcast({
      type: "memberKicked",
      memberName: memberName,
      kickedBy: userName
    });
    
    logActivity("member_kicked", { memberName: memberName, kickedBy: userName });
    showToast(`${memberName} has been kicked from the room`, "success");
  }
}

// Handle member being kicked
function handleMemberKicked(data) {
  if (data.memberName === userName) {
    showToast("You have been kicked from the room", "error");
    setTimeout(() => {
      logout();
    }, 2000);
  } else {
    roomMembers.delete(data.memberName);
    updateMemberList();
    if (role === "mentor") {
      updateMemberCheckboxes();
    }
    showToast(`${data.memberName} was kicked from the room`, "info");
  }
}

// Bulk operations
function selectAllVisibleTasks() {
  document.querySelectorAll(".todo-item:not([style*='display: none'])").forEach(item => {
    const todoId = parseInt(item.id.replace("todo-", ""));
    selectedTasks.add(todoId);
    item.classList.add("selected");
    
    const checkbox = item.querySelector(".select-checkbox");
    if (checkbox) {
      checkbox.checked = true;
    }
  });
  
  updateBulkOperations();
}

// Member status indicators
function updateMemberStatus(memberName, isOnline) {
  const memberElements = document.querySelectorAll(`.member-item`);
  memberElements.forEach(el => {
    if (el.textContent.includes(memberName)) {
      if (isOnline) {
        el.classList.remove('offline');
      } else {
        el.classList.add('offline');
      }
    }
  });
}

// Mobile responsiveness helpers
function isMobile() {
  return window.innerWidth <= 768;
}

function adjustForMobile() {
  if (isMobile()) {
    // Adjust UI for mobile
    const todoControls = document.querySelector('.todo-controls');
    if (todoControls) {
      todoControls.style.flexDirection = 'column';
    }
    
    const searchContainer = document.querySelector('.search-filter-container');
    if (searchContainer) {
      searchContainer.style.flexDirection = 'column';
    }
  }
}

// Initialize mobile adjustments
window.addEventListener('resize', adjustForMobile);
window.addEventListener('load', adjustForMobile);