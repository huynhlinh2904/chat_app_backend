let currentEmployee = null;
const currentUser = JSON.parse(localStorage.getItem(infoUser));
const currentUserId = currentUser?.infoUser.USER_ID;
const connection = new signalR.HubConnectionBuilder()
  .withUrl("https://localhost:44333/chathub")
  .withAutomaticReconnect()
  .configureLogging(signalR.LogLevel.Information)
  .build();

// const currentUser = JSON.parse(localStorage.getItem("DEMOinfoUser"));

// Kết nối tới Hub
async function startConnection() {
  try {
    await connection.start();
    console.log("✅ Đã kết nối SignalR");
  } catch (err) {
    console.error("❌ Lỗi kết nối SignalR:", err);
    setTimeout(startConnection, 3000);
  }
}
startConnection();

// Handle receiving messages
connection.on("ReceiveMessage", (message) => {
  console.log("New message received:", message);
  // Update the UI with the new message
  modal_Main.appendMessage(message);
});
connection.on('JoinedConversation', function (conversationId) {
  console.log('Đã tham gia phòng:', conversationId)
  // Bạn có thể xử lý gì đó thêm ở đây nếu cần
})

connection.on('LeftConversation', function (conversationId) {
  console.log('Đã rời phòng:', conversationId)
})
connection.on("RefreshConversations", (senderId) => {
  if (senderId !== currentUserId) {

    // Reset biến phân trang và danh sách
    modal_Main._list_NVtheoPB = [];
    modal_Main.pageIndexUser = 1;
    modal_Main.allUser = false;

    // Gọi lại để load nhóm và danh sách user mới nhất
    modal_Main.loaddata_NVtheoPB();
  }
});

connection.on("RefreshConversationsGroup", (senderId) => {
  if (senderId !== currentUserId) {

    modal_Main.pageIndexGroup = 1; // reset lại về trang đầu
    modal_Main.isLoadingGroup = false; // cho phép gọi lại

    // Gọi lại để load nhóm và danh sách user mới nhất
    modal_Main.get_Group(modal_Main.currentUser);
  }
});

connection.on("ReceiveDeletedMessage", function (messageId) {
  console.log("🧹 Nhận sự kiện xóa:", messageId)

  const msgElement = document.getElementById(`message-${messageId}`);
  if (!msgElement) {
    console.warn("❗ Không tìm thấy message DOM với ID:", messageId)
    return;
  }

  const bubble = msgElement.querySelector(".chat-bubble");
  if (bubble) {
    bubble.innerHTML = `<div class="text-muted fst-italic">[tin nhắn đã xóa]</div>`;
  }
});

function timeAgo(dateString) {
  const now = new Date();
  const messageTime = new Date(dateString);
  const diffMs = now - messageTime;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 30) return `${days} ngày trước`;
  if (months < 12) return `${months} tháng trước`;
  return `${years} năm trước`;
}
