
// ===== TODO MANAGEMENT =====

function addTodo() {
  // Hanya mentor yang bisa menambah todo
  if (role !== "mentor") {
    alert("Hanya mentor yang dapat menambah tugas!");
    return;
  }
  
  const title = document.getElementById("todoTitle").value.trim();
  const desc = document.getElementById("todoDesc").value.trim();
  if (!title) return alert("Judul tidak boleh kosong");
  const todo = { 
    type: "todo", 
    id: Date.now(), 
    title, 
    desc, 
    user: userName, 
    comments: [],
    completed: false,
    completedBy: [],
    completedAt: null,
    memberChecks: {} // Track which members have checked this todo
  };
  renderTodo(todo);
  saveTodos();
  broadcast(todo);
  document.getElementById("todoTitle").value = "";
  document.getElementById("todoDesc").value = "";
  updateEmptyState();
}

function renderTodo(todo) {
  if (document.getElementById("todo-" + todo.id)) return;
  
  const div = document.createElement("div");
  div.className = `todo-item ${todo.completed ? 'completed' : ''}`;
  div.id = "todo-" + todo.id;
  
  // Check completion status
  const memberList = Array.from(roomMembers);
  const members = memberList.filter(m => role === "mentor" ? m !== userName : true); // Exclude mentor from completion check
  const checkedMembers = Object.keys(todo.memberChecks || {}).filter(m => todo.memberChecks[m]);
  const isUserChecked = todo.memberChecks && todo.memberChecks[userName];
  const allMembersChecked = members.length > 0 && members.every(m => todo.memberChecks && todo.memberChecks[m]);
  
  // Status completion
  let completionStatusHtml = '';
  if (todo.completed && allMembersChecked) {
    completionStatusHtml = `
      <div class="completion-status">
        <div class="completed-title">✅ Tugas Selesai!</div>
        <div class="completion-time">Diselesaikan pada ${new Date(todo.completedAt).toLocaleString('id-ID')}</div>
        <div class="member-checks">Semua member: ${members.join(', ')}</div>
      </div>
    `;
  } else if (checkedMembers.length > 0) {
    const progress = members.length > 0 ? (checkedMembers.length / members.length) * 100 : 0;
    completionStatusHtml = `
      <div class="partial-completion-status">
        <div class="progress-title">📊 Progress: ${checkedMembers.length}/${members.length} member</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="member-list-small">
          ${members.map(m => 
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
  
  div.innerHTML = `
    <strong>${escapeHtml(todo.title)}</strong>
    <span>${escapeHtml(todo.desc)}</span>
    <div class="todo-meta">👤 ${escapeHtml(todo.user)}</div>
    ${completionStatusHtml}
    <div class="todo-actions">
      ${role === "member" ? `
        <button class="${checkboxClass}" onclick="toggleMemberCheck(${todo.id})">
          <input type="checkbox" ${isUserChecked ? 'checked' : ''} onchange="event.preventDefault()">
          <span>${checkboxText}</span>
        </button>
      ` : ''}
      <button class="comment-toggle-btn" onclick="toggleComment(${todo.id})">💬 Komentar</button>
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
  updateEmptyState();

  // jika todo sudah punya komentar, render komentar dari data
  if (todo.comments) todo.comments.forEach(c => appendComment(c, false));
}

function toggleMemberCheck(todoId) {
  if (role !== "member") return;
  
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
  
  // Check if all members have checked
  const memberList = Array.from(roomMembers);
  const members = memberList.filter(m => role === "mentor" ? m !== userName : true);
  const allMembersChecked = members.length > 0 && members.every(m => todos[todoIndex].memberChecks[m]);
  
  if (allMembersChecked && !todos[todoIndex].completed) {
    // Mark as completed
    todos[todoIndex].completed = true;
    todos[todoIndex].completedAt = Date.now();
    todos[todoIndex].completedBy = members;
    
    // Broadcast completion
    if (role === "mentor") {
      broadcast({
        type: "todoCompleted",
        todoId: data.todoId,
        completedAt: todos[todoIndex].completedAt,
        completedBy: members
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