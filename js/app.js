// ===== MAIN APP INITIALIZATION =====

window.addEventListener("load", () => {
  const session = loadSession();
  if (session) {
    userName = session.userName;
    roomId = session.roomId;
    role = session.role;
    
    if (role === "mentor") {
      autoCreateRoom();
    } else if (role === "member") {
      autoJoinRoom();
    }
  }
  
  // Hanya load todos jika sudah ada session dan role sudah di-set
  if (role) {
    loadLocalTodos();
  }
});