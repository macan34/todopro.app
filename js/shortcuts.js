// ===== KEYBOARD SHORTCUTS =====

let selectedTasks = new Set();
let shortcutsEnabled = true;

// Initialize keyboard shortcuts
function initShortcuts() {
  document.addEventListener("keydown", handleKeyboardShortcut);
  
  // Load shortcuts preference
  const saved = localStorage.getItem("shortcutsEnabled");
  if (saved !== null) {
    shortcutsEnabled = saved === "true";
  }
}

// Handle keyboard shortcuts
function handleKeyboardShortcut(event) {
  if (!shortcutsEnabled) return;
  
  // Don't trigger shortcuts when typing in inputs
  if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
    // Exception: ESC key should work in inputs too
    if (event.key === "Escape") {
      event.target.blur();
      clearSelection();
    }
    return;
  }
  
  const { ctrlKey, metaKey, shiftKey, key } = event;
  const cmdOrCtrl = ctrlKey || metaKey;
  
  // Prevent default browser shortcuts when our shortcuts are triggered
  let preventDefault = false;
  
  switch (key.toLowerCase()) {
    case "n":
      if (cmdOrCtrl) {
        if (role === "mentor") {
          focusAddTodoForm();
          preventDefault = true;
        }
      }
      break;
      
    case "f":
      if (cmdOrCtrl) {
        focusSearch();
        preventDefault = true;
      }
      break;
      
    case "a":
      if (cmdOrCtrl) {
        if (shiftKey) {
          clearSelection();
        } else {
          selectAllTasks();
        }
        preventDefault = true;
      }
      break;
      
    case "delete":
    case "backspace":
      if (selectedTasks.size > 0 && role === "mentor") {
        bulkDelete();
        preventDefault = true;
      }
      break;
      
    case "enter":
      if (selectedTasks.size > 0) {
        bulkComplete();
        preventDefault = true;
      }
      break;
      
    case "escape":
      clearSelection();
      closeModals();
      break;
      
    case "?":
      toggleShortcutsHelp();
      preventDefault = true;
      break;
      
    case "d":
      if (cmdOrCtrl) {
        toggleDarkMode();
        preventDefault = true;
      }
      break;
      
    case "e":
      if (cmdOrCtrl && shiftKey) {
        exportData();
        preventDefault = true;
      }
      break;
      
    case "1":
    case "2":
    case "3":
      if (cmdOrCtrl) {
        const priority = ["high", "medium", "low"][parseInt(key) - 1];
        setPriorityFilter(priority);
        preventDefault = true;
      }
      break;
      
    case " ":
      if (selectedTasks.size === 1) {
        const todoId = Array.from(selectedTasks)[0];
        toggleTodoDetails(todoId);
        preventDefault = true;
      }
      break;
  }
  
  if (preventDefault) {
    event.preventDefault();
    event.stopPropagation();
  }
}

// Focus functions
function focusAddTodoForm() {
  const titleInput = document.getElementById("todoTitle");
  if (titleInput && !titleInput.closest(".hidden")) {
    titleInput.focus();
    showToast("📝 Add new task mode activated", "info", 1500);
  }
}

function focusSearch() {
  const searchInput = document.getElementById("searchTasks");
  if (searchInput) {
    searchInput.focus();
    showToast("🔍 Search mode activated", "info", 1500);
  }
}

// Task selection functions
function selectAllTasks() {
  const todoItems = document.querySelectorAll(".todo-item");
  todoItems.forEach(item => {
    const todoId = parseInt(item.id.replace("todo-", ""));
    selectedTasks.add(todoId);
    item.classList.add("selected");
    
    // Add selection checkbox if not exists
    addSelectionCheckbox(item);
  });
  
  updateBulkOperations();
  showToast(`Selected ${selectedTasks.size} tasks`, "info", 1500);
}

function clearSelection() {
  selectedTasks.clear();
  document.querySelectorAll(".todo-item").forEach(item => {
    item.classList.remove("selected");
    const checkbox = item.querySelector(".select-checkbox");
    if (checkbox) {
      checkbox.checked = false;
    }
  });
  
  updateBulkOperations();
}

function toggleTaskSelection(todoId) {
  const todoItem = document.getElementById(`todo-${todoId}`);
  if (!todoItem) return;
  
  if (selectedTasks.has(todoId)) {
    selectedTasks.delete(todoId);
    todoItem.classList.remove("selected");
  } else {
    selectedTasks.add(todoId);
    todoItem.classList.add("selected");
  }
  
  updateBulkOperations();
}

// Add selection checkbox to task
function addSelectionCheckbox(todoItem) {
  if (todoItem.querySelector(".select-checkbox")) return;
  
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "select-checkbox";
  
  const todoId = parseInt(todoItem.id.replace("todo-", ""));
  checkbox.checked = selectedTasks.has(todoId);
  
  checkbox.addEventListener("change", (e) => {
    e.stopPropagation();
    toggleTaskSelection(todoId);
  });
  
  todoItem.appendChild(checkbox);
}

// Priority filter shortcut
function setPriorityFilter(priority) {
  const filterSelect = document.getElementById("filterPriority");
  if (filterSelect) {
    filterSelect.value = priority;
    filterTasks();
    showToast(`Filtered by ${priority} priority`, "info", 1500);
  }
}

// Toggle todo details
function toggleTodoDetails(todoId) {
  const commentBox = document.getElementById(`commentBox-${todoId}`);
  if (commentBox) {
    commentBox.classList.toggle("hidden");
    const isVisible = !commentBox.classList.contains("hidden");
    showToast(`Task details ${isVisible ? "shown" : "hidden"}`, "info", 1000);
  }
}

// Close modals and overlays
function closeModals() {
  // Close shortcuts help
  const shortcutsHelp = document.getElementById("shortcutsHelp");
  if (shortcutsHelp) {
    shortcutsHelp.classList.add("hidden");
  }
  
  // Close all comment boxes
  document.querySelectorAll(".comment-box").forEach(box => {
    box.classList.add("hidden");
  });
  
  // Remove focus from inputs
  document.activeElement?.blur();
}

// Toggle shortcuts help
function toggleShortcutsHelp() {
  const shortcutsHelp = document.getElementById("shortcutsHelp");
  if (shortcutsHelp) {
    shortcutsHelp.classList.toggle("hidden");
  }
}

// Bulk operations
function bulkComplete() {
  if (selectedTasks.size === 0) return;
  
  let completed = 0;
  selectedTasks.forEach(todoId => {
    if (role === "member") {
      // For members, toggle their check status
      toggleMemberCheck(todoId);
      completed++;
    }
  });
  
  if (completed > 0) {
    showToast(`Marked ${completed} tasks as completed`, "success");
    clearSelection();
  }
}

function bulkDelete() {
  if (selectedTasks.size === 0 || role !== "mentor") return;
  
  const count = selectedTasks.size;
  if (confirm(`Delete ${count} selected tasks? This action cannot be undone.`)) {
    selectedTasks.forEach(todoId => {
      deleteTodo(todoId);
    });
    
    showToast(`Deleted ${count} tasks`, "success");
    clearSelection();
  }
}

// Update bulk operations UI
function updateBulkOperations() {
  const bulkOps = document.getElementById("bulkOperations");
  const selectedCount = document.getElementById("selectedCount");
  
  if (selectedTasks.size > 0) {
    if (bulkOps) bulkOps.classList.remove("hidden");
    if (selectedCount) selectedCount.textContent = `${selectedTasks.size} selected`;
  } else {
    if (bulkOps) bulkOps.classList.add("hidden");
  }
}

// Enable/disable shortcuts
function toggleShortcuts() {
  shortcutsEnabled = !shortcutsEnabled;
  localStorage.setItem("shortcutsEnabled", shortcutsEnabled.toString());
  
  showToast(
    shortcutsEnabled ? "⌨️ Shortcuts enabled" : "⌨️ Shortcuts disabled",
    "info"
  );
}

// Click handler for task selection
function handleTaskClick(event, todoId) {
  // Check if click is on a button or input
  if (event.target.tagName === "BUTTON" || 
      event.target.tagName === "INPUT" || 
      event.target.closest("button")) {
    return;
  }
  
  // Handle selection with Ctrl/Cmd key
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault();
    toggleTaskSelection(todoId);
  }
}

// Add click handlers to existing tasks
function addTaskClickHandlers() {
  document.querySelectorAll(".todo-item").forEach(item => {
    const todoId = parseInt(item.id.replace("todo-", ""));
    
    // Remove existing click handlers
    item.removeEventListener("click", item._clickHandler);
    
    // Add new click handler
    item._clickHandler = (e) => handleTaskClick(e, todoId);
    item.addEventListener("click", item._clickHandler);
    
    // Add selection checkbox
    addSelectionCheckbox(item);
  });
}
