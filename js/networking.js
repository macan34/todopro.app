// ===== NETWORKING & P2P CONNECTION =====

let peer, conn, connections = [];
let userName = "", roomId = "", role = "";
let roomMembers = new Set(); // Track all members in room

function createRoom() {
  userName = document.getElementById("userName").value.trim();
  if (!userName) return alert("Isi nama Anda!");
  role = "mentor";
  roomId = "room-" + Math.floor(Math.random() * 10000);
  saveSession();
  autoCreateRoom();
}

function autoCreateRoom() {
  peer = new Peer(roomId);
  peer.on("open", id => {
    // Add mentor to room members
    roomMembers.add(userName);
    initApp("🏠 Room ID: " + id, "🎯 Mentor: " + userName);
    document.getElementById("status").className = "status online";
    updateMemberList();

    let savedTodos = localStorage.getItem("todos");
    if (savedTodos) {
      if (confirm("Data lama ditemukan. Muat data lama?")) {
        JSON.parse(savedTodos).forEach(todo => renderTodo(todo));
        updateEmptyState();
      } else {
        localStorage.removeItem("todos");
      }
    }

    peer.on("connection", c => {
      connections.push(c);
      c.on("open", () => {
        // Send current member list to new member
        c.send({ type: "memberList", members: Array.from(roomMembers) });
        // Send all todos to new member
        c.send({ type: "allTodos", todos: getAllTodos() });
      });
      c.on("data", data => {
        if (data.type === "joinRoom") {
          roomMembers.add(data.userName);
          updateMemberList();
          // Broadcast updated member list to all
          broadcast({ type: "memberList", members: Array.from(roomMembers) });
        } else if (data.type === "requestData") {
          c.send({ type: "allTodos", todos: getAllTodos() });
          c.send({ type: "memberList", members: Array.from(roomMembers) });
        } else {
          handleData(data);
        }
      });
      c.on("close", () => {
        // Remove connection from array when closed
        connections = connections.filter(conn => conn !== c);
      });
    });
  });
}

function joinRoom() {
  userName = document.getElementById("userName").value.trim();
  roomId = document.getElementById("roomIdInput").value.trim();
  if (!userName || !roomId) return alert("Isi nama dan Room ID!");
  role = "member";
  saveSession();
  autoJoinRoom();
}

function autoJoinRoom() {
  peer = new Peer();
  peer.on("open", () => {
    conn = peer.connect(roomId);
    conn.on("open", () => {
      initApp("🏠 Room ID: " + roomId, "🤝 Member: " + userName);
      document.getElementById("status").className = "status online";
      // Tell mentor this member joined
      conn.send({ type: "joinRoom", userName: userName });
      conn.send({ type: "requestData" });
      conn.on("data", handleData);
    });
  });
}

function handleData(data) {
  if (data.type === "todo") {
    renderTodo(data);
    saveTodos();
  }
  if (data.type === "comment" || data.type === "photo") {
    appendComment(data);
    saveTodos();
  }
  if (data.type === "allTodos") {
    data.todos.forEach(todo => renderTodo(todo));
    saveTodos();
  }
  if (data.type === "deleteTodo") {
    document.getElementById("todo-" + data.todoId)?.remove();
    saveTodos();
    updateEmptyState();
  }
  if (data.type === "memberList") {
    roomMembers = new Set(data.members);
    updateMemberList();
  }
  if (data.type === "memberCheck") {
    handleMemberCheck(data);
  }
  if (data.type === "todoCompleted" || data.type === "todoUncompleted") {
    handleTodoCompletion(data);
  }
}

function broadcast(msg) {
  connections.forEach(c => c.send(msg));
  if (conn) conn.send(msg);
}

function updateMemberList() {
  const container = document.getElementById("memberContainer");
  container.innerHTML = "";
  
  roomMembers.forEach(member => {
    const memberEl = document.createElement("span");
    memberEl.className = `member-item ${member === userName && role === "mentor" ? "mentor" : ""}`;
    memberEl.textContent = member + (member === userName && role === "mentor" ? " (Mentor)" : "");
    container.appendChild(memberEl);
  });
}