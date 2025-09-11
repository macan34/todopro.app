// ===== COMMENT SYSTEM =====

function previewPhoto(todoId) {
  const fileInput = document.getElementById("photoInput-" + todoId);
  const previewBox = document.getElementById("preview-" + todoId);
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      previewBox.innerHTML = `<img src="${reader.result}" alt="Preview Foto">`;
      previewBox.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  } else {
    previewBox.innerHTML = "";
    previewBox.classList.add("hidden");
  }
}

function sendComment(todoId) {
  const text = document.getElementById("commentInput-" + todoId).value.trim();
  const file = document.getElementById("photoInput-" + todoId).files[0];
  if (!text && !file) return;

  if (text) {
    const msg = { type: "comment", todoId, text, user: userName };
    appendComment(msg);
    saveTodos();
    broadcast(msg);
    document.getElementById("commentInput-" + todoId).value = "";
  }

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const msg = { type: "photo", todoId, data: reader.result, user: userName };
      appendComment(msg);
      saveTodos();
      broadcast(msg);
      document.getElementById("photoInput-" + todoId).value = "";
      document.getElementById("preview-" + todoId).innerHTML = "";
      document.getElementById("preview-" + todoId).classList.add("hidden");
    };
    reader.readAsDataURL(file);
  }
}

function appendComment(msg, save = true) {
  const list = document.querySelector(`#todo-${msg.todoId} .comment-list`);
  if (!list) return;

  const div = document.createElement("div");
  div.className = "comment";

  const left = document.createElement("div");
  left.className = "left";

  const strongEl = document.createElement("strong");
  strongEl.textContent = msg.user + ":";

  left.appendChild(strongEl);

  if (msg.type === "comment") {
    const span = document.createElement("span");
    span.className = "comment-text";
    span.textContent = msg.text || "";
    left.appendChild(span);
  } else if (msg.type === "photo") {
    const img = document.createElement("img");
    img.src = msg.data;
    img.alt = "photo";
    left.appendChild(document.createElement("br"));
    left.appendChild(img);
  }

  div.appendChild(left);

  if (role === "mentor") {
    const del = document.createElement("button");
    del.className = "delete-comment-btn";
    del.title = "Hapus komentar";
    del.innerHTML = "✖";
    del.onclick = () => {
      div.remove();
      saveTodos();
    };
    div.appendChild(del);
  }

  list.appendChild(div);
  if (save) saveTodos();
}