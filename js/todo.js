// ===== TODO MANAGEMENT =====

function addTodo() {
  // Hanya mentor yang bisa menambah todo
  if (role !== "mentor") {
    alert("Hanya mentor yang dapat menambah tugas!");
    return;
  }
  
  const title = document.getElementById("todoTitle").value.trim();
  const desc = document.getElementById("todoDesc").value.trim();
  const priority = document.getElementById("todoPriority").value;
  const deadline = document.getElementById("todoDeadline").value;
  
  if (!title) return alert("Judul tidak boleh kosong");
  
  // Get assigned members
  const assignedTo = [];
  document.querySelectorAll('#memberCheckboxes input[type="checkbox"]:checked').forEach(checkbox => {
    assignedTo.push(checkbox.value);
  });
  
  const todo = { 
    type: "todo", 
    id: Date.now(), 
    title, 
    desc, 
    priority,
    deadline: deadline || null,
    assignedTo,
    user: userName, 
    comments: [],
    completed: false,
    completedBy: [],
    completedAt: null,
    createdAt: Date.now(),
    memberChecks: {},
    timeSpent: 0
  };
  
  renderTodo(todo);
  saveTodos();
  broadcast(todo);
  
  // Log activity
  logActivity("todo_added", { user: userName, title: todo.title });
  
  // Notify about new task
  notifyActivity("todo_added", { user: userName, title: todo.title });
  
  // Clear form
  document.getElementById("todoTitle").value = "";
  document.getElementById("todoDesc").value = "";
  document.getElementById("todoDeadline").value = "";
  document.getElementById("todoPriority").value = "medium";
  
  // Clear member checkboxes
  document.querySelectorAll('#memberCheckboxes input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
  
  updateEmptyState();
  updateDashboard();
}

function renderTodo(todo) {
  if (document.getElementById("todo-" + todo.id)) return;
  
  const div = document.createElement("div");
  let priorityClass = todo.priority ? `priority-${todo.priority}` : 'priority-medium';
  
  // Check if overdue
  const isOverdue = todo.deadline && !todo.completed && new Date(todo.deadline).getTime() < Date.now();
  if (isOverdue) {
    div.classList.add('overdue');
  }
  
  div.className = `todo-item ${todo.completed ? 'completed' : ''} ${priorityClass}`;
  div.id = "todo-" + todo.id;
  
  // Check completion status
  const memberList = Array.from(roomMembers);
  const assignedMembers = todo.assignedTo && todo.assignedTo.length > 0 ? todo.assignedTo : memberList.filter(m => m !== userName);
  const checkedMembers = Object.keys(todo.memberChecks || {}).filter(m => todo.memberChecks[m]);
  const isUserChecked = todo.memberChecks && todo.memberChecks[userName];
  const allMembersChecked = assignedMembers.length > 0 && assignedMembers.every(m => todo.memberChecks && todo.memberChecks[m]);
  
  // Priority badge
  const priorityBadge = `<span class="priority-badge ${todo.priority || 'medium'}">${(todo.priority || 'medium').toUpperCase()}</span>`;
  
  // Deadline info
  let deadlineInfo = '';
  if (todo.deadline) {
    const deadline = new Date(todo.deadline);
    const now = new Date();
    const timeDiff = deadline.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    let countdownClass = 'normal';
    let countdownText = '';
    
    if (timeDiff < 0) {
      countdownClass = 'urgent';
      countdownText = `Overdue by ${Math.abs(daysDiff)} days`;
    } else if (timeDiff < 3600000) { // Less than 1 hour
      countdownClass = 'urgent';
      countdownText = `${Math.ceil(timeDiff / 60000)} minutes left`;
    } else if (daysDiff <= 1) {
      countdownClass = 'urgent';
      countdownText = 'Due today';
    } else if (daysDiff <= 3) {
      countdownClass = 'warning';
      countdownText = `${daysDiff} days left`;
    } else {
      countdownText = `${daysDiff} days left`;
    }
    
    deadlineInfo = `
      <div class="deadline-info">
        ⏰ ${deadline.toLocaleDateString('id-ID', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })}
        <span class="countdown-timer ${countdownClass}">${countdownText}</span>
      </div>
    `;
  }
  
  // Assignment info
  let assignmentInfo = '';
  if (todo.assignedTo && todo.assignedTo.length > 0) {
    const isAssignedToMe = todo.assignedTo.includes(userName);
    assignmentInfo = `
      <div class="assignment-info">
        👥 Assigned to: 
        ${todo.assignedTo.map(member => 
          `<span class="assigned-member ${member === userName ? 'assigned-to-me' : ''}">${member}</span>`
        ).join('')}
      </div>
    `;
  }
  
  // Status completion
  let completionStatusHtml = '';
  if (todo.completed && allMembersChecked) {
    completionStatusHtml = `
      <div class="completion-status">
        <div class="completed-title">✅ Tugas Selesai!</div>
        <div class="completion-time">Diselesaikan pada ${new Date(todo.completedAt).toLocaleString('id-ID')}</div>
        <div class="member-checks">Semua assigned member: ${assignedMembers.join(', ')}</div>
      </div>
    `;
  } else if (checkedMembers.length > 0) {
    const progress = assignedMembers.length > 0 ? (checkedMembers.length / assignedMembers.length) * 100 : 0;
    completionStatusHtml = `
      <div class="partial-completion-status">
        <div class="progress-title">📊 Progress: ${checkedMembers.length}/${assignedMembers.length} member</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="member-list-small">
          ${assignedMembers.map(m => 
            `<span class="${todo.memberChecks && todo.memberChecks[m] ? 'checked' : 'unchecked'}">${m}${todo.memberChecks && todo.memberChecks[m] ? ' ✓' : ''}</span>`
          ).join(', ')}
        </div>
      </div>
    `;
  }
  
  // Checkbox status class
  let checkboxClass = 'completion-checkbox';
  if (isUserChecked && !allMembersChecked) {
    checkboxClass += ' user-checked';
  } else if (allMembersChecked) {
    checkboxClass += ' all-checked';
  }
  
  // Checkbox text
  let checkboxText = 'Tandai Selesai';
  if (isUserChecked && !allMembersChecked) {
    checkboxText = '⏳ Menunggu yang lain';
  } else if (allMembersChecked) {
    checkboxText = '✅ Selesai';
  }
  
  // Time spent info
  let timeSpentInfo = '';
  if (todo.timeSpent && todo.timeSpent > 0) {
    timeSpentInfo = `<div class="time-spent">⏱️ Time spent: ${formatDuration(todo.timeSpent)}</div>`;
  }
  
  div.innerHTML = `
    <strong>${escapeHtml(todo.title)}</strong>
    <span>${escapeHtml(todo.desc)}</span>
    <div class="todo-meta">👤 ${escapeHtml(todo.user)} ${priorityBadge}</div>
    ${deadlineInfo}
    ${assignmentInfo}
    ${timeSpentInfo}
    ${completionStatusHtml}
    <div class="todo-actions">
      ${(role === "member" && (todo.assignedTo?.includes(userName) || todo.assignedTo?.length === 0)) ? `
        <button class="${checkboxClass}" onclick="toggleMemberCheck(${todo.id})">
          <input type="checkbox" ${isUserChecked ? 'checked' : ''} onchange="event.preventDefault()">
          <span>${checkboxText}</span>
        </button>
      ` : ''}
      <button class="comment-toggle-btn" onclick="toggleComment(${todo.id})">💬 Komentar</button>
      ${role === "mentor" ? `
        <button onclick="createTemplateFromTask(${JSON.stringify(todo).replace(/"/g, '&quot;')})" class="template-btn" style="font-size: 0.875rem; padding: 0.5rem 1rem; background: #6b7280;">📋 Template</button>
      ` : ''}
    </div>
    ${role === "mentor" ? `<button class="delete-btn" onclick="deleteTodo(${todo.id})" title="Hapus tugas">🗑️</button>` : ""}
    <div class="comment-box hidden" id="commentBox-${todo.id}">
      <h4>💬 Komentar</h4>
      <div class="comment-list"></div>
      <div class="comment-input-section">
        <div class="comment-input-row">
          <input type="text" id="commentInput-${todo.id}" placeholder="Tulis komentar..." onkeypress="if(event.key==='Enter') sendComment(${todo.id})">
          <button onclick="sendComment(${todo.id})">Kirim</button>
        </div>
        <input type="file" id="photoInput-${todo.id}" accept="image/*" onchange="previewPhoto(${todo.id})">
        <div id="preview-${todo.id}" class="preview-box hidden"></div>
      </div>
    </div>`;
  
  document.getElementById("todoList").appendChild(div);
  
  // Add click handlers for selection
  addTaskClickHandlers();
  
  updateEmptyState();

  // jika todo sudah punya komentar, render komentar dari data
  if (todo.comments) todo.comments.forEach(c => appendComment(c, false));
  
  // Start time tracking for active tasks
  if (!todo.completed && todo.assignedTo?.includes(userName)) {
    startTimeTracking(todo.id);
  }
}

function toggleMemberCheck(todoId) {
  const todos = getAllTodos();
  const todo = todos.find(t => t.id === todoId);
  
  // Check if user is assigned to this task
  if (todo.assignedTo && todo.assignedTo.length > 0 && !todo.assignedTo.includes(userName)) {
    showToast("You are not assigned to this task", "warning");
    return;
  }
  
  if (role !== "member" && role !== "mentor") return;
  
  const checkData = {
    type: "memberCheck",
    todoId: todoId,
    userName: userName,
    checked: true
  };
  
  // Update local state
  handleMemberCheck(checkData);
  
  // Broadcast to mentor and other members
  broadcast(checkData);
  saveTodos();
  updateDashboard();
  
  // Stop time tracking when completed
  const updatedTodos = getAllTodos();
  const updatedTodo = updatedTodos.find(t => t.id === todoId);
  if (updatedTodo.completed) {
    const timeSpent = stopTimeTracking(todoId);
    if (timeSpent > 0) {
      showToast(`Task completed! Time spent: ${formatDuration(timeSpent)}`, "success");
    }
  }
}

function handleMemberCheck(data) {
  const todoDiv = document.getElementById("todo-" + data.todoId);
  if (!todoDiv) return;
  
  // Get current todo data from localStorage
  const todos = JSON.parse(localStorage.getItem("todos") || "[]");
  const todoIndex = todos.findIndex(t => t.id === data.todoId);
  if (todoIndex === -1) return;
  
  // Initialize memberChecks if not exists
  if (!todos[todoIndex].memberChecks) {
    todos[todoIndex].memberChecks = {};
  }
  
  // Toggle member check
  const currentlyChecked = todos[todoIndex].memberChecks[data.userName] || false;
  todos[todoIndex].memberChecks[data.userName] = !currentlyChecked;
  
  // Check if all assigned members have checked
  const assignedMembers = todos[todoIndex].assignedTo && todos[todoIndex].assignedTo.length > 0 
    ? todos[todoIndex].assignedTo 
    : Array.from(roomMembers).filter(m => m !== userName);
    
  const allMembersChecked = assignedMembers.length > 0 && 
    assignedMembers.every(m => todos[todoIndex].memberChecks[m]);
  
  if (allMembersChecked && !todos[todoIndex].completed) {
    // Mark as completed
    todos[todoIndex].completed = true;
    todos[todoIndex].completedAt = Date.now();
    todos[todoIndex].completedBy = assignedMembers;
    
    // Log activity
    logActivity("todo_completed", { title: todos[todoIndex].title, members: assignedMembers });
    
    // Notify completion
    notifyActivity("todo_completed", { title: todos[todoIndex].title });
    
    // Broadcast completion
    if (role === "mentor") {
      broadcast({
        type: "todoCompleted",
        todoId: data.todoId,
        completedAt: todos[todoIndex].completedAt,
        completedBy: assignedMembers
      });
    }
  } else if (!allMembersChecked && todos[todoIndex].completed) {
    // Unmark as completed
    todos[todoIndex].completed = false;
    todos[todoIndex].completedAt = null;
    todos[todoIndex].completedBy = [];
    
    // Broadcast un-completion
    if (role === "mentor") {
      broadcast({
        type: "todoUncompleted",
        todoId: data.todoId
      });
    }
  }
  
  // Save to localStorage
  localStorage.setItem("todos", JSON.stringify(todos));
  
  // Re-render the todo item
  todoDiv.remove();
  renderTodo(todos[todoIndex]);
  updateDashboard();
}

function handleTodoCompletion(data) {
  const todos = JSON.parse(localStorage.getItem("todos") || "[]");
  const todoIndex = todos.findIndex(t => t.id === data.todoId);
  if (todoIndex === -1) return;
  
  if (data.type === "todoCompleted") {
    todos[todoIndex].completed = true;
    todos[todoIndex].completedAt = data.completedAt;
    todos[todoIndex].completedBy = data.completedBy;
  } else if (data.type === "todoUncompleted") {
    todos[todoIndex].completed = false;
    todos[todoIndex].completedAt = null;
    todos[todoIndex].completedBy = [];
  }
  
  localStorage.setItem("todos", JSON.stringify(todos));
  
  // Re-render the todo
  const todoDiv = document.getElementById("todo-" + data.todoId);
  if (todoDiv) {
    todoDiv.remove();
    renderTodo(todos[todoIndex]);
  }
  updateDashboard();
}

function deleteTodo(todoId) {
  if (!confirm("Yakin hapus tugas ini?")) return;
  
  // Stop time tracking
  stopTimeTracking(todoId);
  
  const todo = getAllTodos().find(t => t.id === todoId);
  if (todo) {
    logActivity("todo_deleted", { user: userName, title: todo.title });
  }
  
  document.getElementById("todo-" + todoId)?.remove();
  saveTodos();
  broadcast({ type: "deleteTodo", todoId });
  updateEmptyState();
  updateDashboard();
  
  showToast("Task deleted", "success");
}

function toggleComment(todoId) {
  document.getElementById("commentBox-" + todoId).classList.toggle("hidden");
}

// Search and filter functions
function filterTasks() {
  const searchTerm = document.getElementById("searchTasks").value.toLowerCase();
  const priorityFilter = document.getElementById("filterPriority").value;
  const statusFilter = document.getElementById("filterStatus").value;
  
  document.querySelectorAll(".todo-item").forEach(item => {
    const todoId = parseInt(item.id.replace("todo-", ""));
    const todo = getAllTodos().find(t => t.id === todoId);
    
    let showItem = true;
    
    // Text search
    if (searchTerm && !todo.title.toLowerCase().includes(searchTerm) && 
        !todo.desc.toLowerCase().includes(searchTerm)) {
      showItem = false;
    }
    
    // Priority filter
    if (priorityFilter && todo.priority !== priorityFilter) {
      showItem = false;
    }
    
    // Status filter
    if (statusFilter) {
      switch (statusFilter) {
        case 'completed':
          if (!todo.completed) showItem = false;
          break;
        case 'overdue':
          if (!todo.deadline || todo.completed || new Date(todo.deadline).getTime() >= Date.now()) {
            showItem = false;
          }
          break;
        case 'assigned-to-me':
          if (!todo.assignedTo?.includes(userName)) showItem = false;
          break;
      }
    }
    
    item.style.display = showItem ? 'block' : 'none';
  });
  
  updateEmptyState();
}

// Sort tasks
function sortTasks() {
  const sortBy = document.getElementById("sortBy").value;
  const todoList = document.getElementById("todoList");
  const todos = Array.from(todoList.querySelectorAll(".todo-item"));
  
  todos.sort((a, b) => {
    const todoIdA = parseInt(a.id.replace("todo-", ""));
    const todoIdB = parseInt(b.id.replace("todo-", ""));
    const todoA = getAllTodos().find(t => t.id === todoIdA);
    const todoB = getAllTodos().find(t => t.id === todoIdB);
    
    if (!todoA || !todoB) return 0;
    
    switch (sortBy) {
      case 'priority-deadline':
        const scoreA = calculatePriorityScore(todoA);
        const scoreB = calculatePriorityScore(todoB);
        return scoreB - scoreA;
        
      case 'deadline':
        if (!todoA.deadline && !todoB.deadline) return 0;
        if (!todoA.deadline) return 1;
        if (!todoB.deadline) return -1;
        return new Date(todoA.deadline) - new Date(todoB.deadline);
        
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[todoB.priority] || 2) - (priorityOrder[todoA.priority] || 2);
        
      case 'created':
        return (todoB.createdAt || 0) - (todoA.createdAt || 0);
        
      default:
        return 0;
    }
  });
  
  // Re-append sorted todos
  todos.forEach(todo => todoList.appendChild(todo));
} {
    // Unmark as completed
    todos[todoIndex].completed = false;
    todos[todoIndex].completedAt = null;
    todos[todoIndex].completedBy = [];
    
    // Broadcast un-completion
    if (role === "mentor") {
      broadcast({
        type: "todoUncompleted",
        todoId: data.todoId
      });
    }
  }
  
  
  // Save to localStorage
  {
  localStorage.setItem("todos", JSON.stringify(todos));
  
  // Re-render the todo item
  todoDiv.remove();
  renderTodo(todos[todoIndex]);
}

function handleTodoCompletion(data) {
  const todos = JSON.parse(localStorage.getItem("todos") || "[]");
  const todoIndex = todos.findIndex(t => t.id === data.todoId);
  if (todoIndex === -1) return;
  
  if (data.type === "todoCompleted") {
    todos[todoIndex].completed = true;
    todos[todoIndex].completedAt = data.completedAt;
    todos[todoIndex].completedBy = data.completedBy;
  } else if (data.type === "todoUncompleted") {
    todos[todoIndex].completed = false;
    todos[todoIndex].completedAt = null;
    todos[todoIndex].completedBy = [];
  }
  
  localStorage.setItem("todos", JSON.stringify(todos));
  
  // Re-render the todo
  const todoDiv = document.getElementById("todo-" + data.todoId);
  if (todoDiv) {
    todoDiv.remove();
    renderTodo(todos[todoIndex]);
  }
}

function deleteTodo(todoId) {
  if (!confirm("Yakin hapus tugas ini?")) return;
  document.getElementById("todo-" + todoId)?.remove();
  saveTodos();
  broadcast({ type: "deleteTodo", todoId });
  updateEmptyState();
}

function toggleComment(todoId) {
  document.getElementById("commentBox-" + todoId).classList.toggle("hidden");
}
