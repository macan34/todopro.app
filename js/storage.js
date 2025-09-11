// ===== LOCAL STORAGE MANAGEMENT =====

function saveSession() {
  localStorage.setItem("session", JSON.stringify({ userName, roomId, role }));
}

function clearSession() {
  localStorage.removeItem("session");
}

function loadSession() {
  const savedSession = localStorage.getItem("session");
  if (savedSession) {
    const s = JSON.parse(savedSession);
    return {
      userName: s.userName,
      roomId: s.roomId,
      role: s.role
    };
  }
  return null;
}

function saveTodos() {
  const todos = [];
  document.querySelectorAll(".todo-item").forEach(div => {
    const id = parseInt(div.id.replace("todo-", ""));
    const title = div.querySelector("strong").innerText;
    const desc = div.querySelector("span").innerText;
    const user = div.querySelector(".todo-meta").innerText.replace("👤 ", "");
    const completed = div.classList.contains('completed');
    
    // Ambil data dari localStorage untuk preserve data lainnya
    const existingTodos = JSON.parse(localStorage.getItem("todos") || "[]");
    const existingTodo = existingTodos.find(t => t.id === id);
    
    let completedBy = [];
    let completedAt = null;
    let memberChecks = existingTodo ? existingTodo.memberChecks || {} : {};
    
    if (existingTodo) {
      completedBy = existingTodo.completedBy || [];
      completedAt = existingTodo.completedAt;
    }
    
    const comments = [];
    div.querySelectorAll(".comment").forEach(c => {
      const img = c.querySelector("img");
      const strong = c.querySelector("strong");
      const username = strong ? strong.textContent.replace(":", "").trim() : "";
      if (img) {
        comments.push({
          type: "photo",
          todoId: id,
          user: username,
          data: img.src
        });
      } else {
        const span = c.querySelector(".comment-text");
        const text = span ? span.textContent.trim() : "";
        comments.push({
          type: "comment",
          todoId: id,
          user: username,
          text
        });
      }
    });
    
    todos.push({ 
      type: "todo", 
      id, 
      title, 
      desc, 
      user, 
      comments, 
      completed,
      completedBy,
      completedAt,
      memberChecks
    });
  });
  localStorage.setItem("todos", JSON.stringify(todos));
}

function loadLocalTodos() {
  const saved = localStorage.getItem("todos");
  if (saved) {
    JSON.parse(saved).forEach(todo => renderTodo(todo));
  }
  // Pastikan updateEmptyState dipanggil setelah role sudah di-set
  if (role) {
    updateEmptyState();
  }
}

function getAllTodos() {
  return JSON.parse(localStorage.getItem("todos") || "[]");
}

function clearAllData() {
  clearSession();
  localStorage.removeItem("todos");
}