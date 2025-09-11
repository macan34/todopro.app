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
  } else if (role === "member") {
    document.getElementById("memberInfo").classList.remove("hidden");
  }
  
  updateEmptyState();
}

function updateEmptyState() {
  const todoList = document.getElementById("todoList");
  const todos = todoList.querySelectorAll(".todo-item");
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