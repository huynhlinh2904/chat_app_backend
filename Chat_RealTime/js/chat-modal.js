var modal_Main = {
  selectedUserIds: [],
  users: [],
  currentConversationId: null,
  currentEmployee: null,
  messagePage: 1,
  currentUser: infoUser.ID_USER,
  isLoadingMessages: false,
  allMessagesLoaded: false,
  isLoadingUser: false,
  isLoadingGroup: false,
  pageIndex: 1,
  pageSize: 10,
  pageIndexGroup: 1,
  pageSizeGroup: 10,
  replyingMessageId: null,
  MAX_OPENED_CHATS: 3,
  openedChats: [],
  minimizedChats: [],

  init: function () {

    // Kiểm tra có dữ liệu không
    if (!infoUser || !token) {
      alert("Phiên đăng nhập đã hết, vui lòng đăng nhập lại.");
      window.location.href = "../../Login/Login.html"; // hoặc route login của bạn
    }

  },

  // INIT TABLE
  initTable: function () {
    modal_Main.syncUserToChatServer();
    modal_Main.loaddata_NVtheoPB();

    $(".dataTables_filter input").attr("placeholder", "Tìm kiếm...");
  },


  syncUserToChatServer: async function () {
    const usersFromERP = await modal_Main.getData_NVtheoPB();

    if (usersFromERP.length === 0) {
      util.ShowMess("Không có user để đồng bộ", "Warning");
      return;
    }

    const mappedUsers = usersFromERP.map((user) => ({
      userId: user.ID_USER,
      fullName: user.FULLNAME_USER,
      avatar: user.IMAGE_NAME ? user.IMAGE_NAME : null,
    }));

    const distinctUsers = mappedUsers.filter(
      (v, i, self) => self.findIndex((u) => u.userId === v.userId) === i
    ); // loại trùng userId

    try {
      const response = await fetch("https://localhost:44333/api/v1/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(distinctUsers),
      });

      const result = await response.json();
      console.log("Đồng bộ user thành công:", result);
    } catch (error) {
      console.error("Lỗi sync:", error);
      util.ShowMess("Lỗi khi gửi dữ liệu lên chat server", "Error");
    }
  },
  getData_NVtheoPB: async function () {
    const link = "api/CongViec/CV_get_NV_theo_PB";
    const param = {
      IDDV: infoUser.IDDV,
      SM1: infoUser.SM1,
      SM2: infoUser.SM2,
      TYPE: 0,
    };

    const data = await util.sendRequest(link, param);
    if (
      data.TYPE === "SUCCESS" &&
      data.MESSAGE &&
      Array.isArray(data.MESSAGE)
    ) {
      const uniqueEmployees = data.MESSAGE.filter(
        (employee, index, self) =>
          employee.ID_USER &&
          self.findIndex((e) => e.ID_USER === employee.ID_USER) === index &&
          employee.ID_USER !== infoUser.ID_USER // Loại bỏ người dùng hiện tại
      );
      return uniqueEmployees;
    } else {
      console.error("❌ Lỗi lấy danh sách từ ERP:", data);
      util.ShowMess("Lỗi lấy danh sách user từ hệ thống ERP", "Error");
      return [];
    }
  },
  getData_User: async function () {
    if (modal_Main.isLoadingUser || modal_Main.allUser) return [];

    modal_Main.isLoadingUser = true;
    try {
      const response = await fetch(`https://localhost:44333/api/v1/users?pageIndex=${modal_Main.pageIndex}&pageSize=${modal_Main.pageSize}`);
      const data = await response.json();

      const validUsers = (data || []).filter(user =>
        user && user.userId && user.fullName
      );

      if (validUsers.length < modal_Main.pageSize) {
        modal_Main.allUser = true;
      }

      modal_Main.pageIndex++;
      return validUsers;
    } catch (error) {
      console.error("Lỗi tải user:", error);
      return [];
    } finally {
      modal_Main.isLoadingUser = false;
    }
  },
  gen_NVtheoPB: function (keyword = "") {
    const employeeList = document.getElementById("chat-list")
    const container = document.getElementById("employee-container")
    employeeList.innerHTML = ""

    // Gắn 1 lần duy nhất (nếu chưa gắn)
    if (!container.hasScrollListener) {
      container.addEventListener("scroll", async () => {
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 50) {
          await modal_Main.loaddata_NVtheoPB()
        }
      })
      container.hasScrollListener = true // tránh gắn lại
    }

    if (!this._list_NVtheoPB || this._list_NVtheoPB.length === 0) {
      employeeList.innerHTML = "<p>Không có nhân viên nào để hiển thị.</p>"
      return;
    }

    const filteredList = this._list_NVtheoPB.filter(employee => {
      if (employee.userId === infoUser.ID_USER) return false;
      const name = (employee.fullName || "").toLowerCase()
      return name.includes(keyword);
    })

    if (filteredList.length === 0) {
      employeeList.innerHTML = "<p>Không tìm thấy nhân viên phù hợp.</p>"
      return;
    }

    filteredList.forEach((employee) => {
      const employeeItem = document.createElement("div")
      employeeItem.classList.add("employee-item")

      const avatarSrc = employee.avatar
        ? `${MainHost}/${ROOT}/${infoUser.SM1}/${infoUser.SM2}/USER/IMG/${employee.avatar}`
        : "./img/avatar-default.jpg"

      employeeItem.innerHTML = `
        <div class="chat-item">
          <div class="chat-avatar">
            <img src="${avatarSrc}" alt="Avatar" class="avatar-img" />
          </div>
          <div class="chat-info">
          <div class="ml-4">
            <div class="chat-name font-semibold text-gray-800">${employee.fullName}</div>
            <div class="chat-details">
              <span>
                ${employee.senderName && employee.lastMessage
          ? `<strong>${employee.senderName}:</strong> ${employee.lastMessage}`
          : "Chưa có tin nhắn"
        }
              </span>
              <span style="font-size:15px">
            ${employee.lastMessageTime ? ` - ${timeAgo(employee.lastMessageTime)}` : ""}
            </span>
            </div>
          </div>
          </div>
        </div>
      `

      employeeItem.addEventListener("click", () => {
        this.openChatWith(employee)
      })

      employeeList.appendChild(employeeItem)
    })
  },

  loaddata_NVtheoPB: async function () {
    if (modal_Main.isLoadingUser || modal_Main.allUser) return;

    util.ShowLoading();
    const obj = await modal_Main.getData_User();

    if (obj.length > 0) {
      // Thêm chứ không ghi đè
      if (!modal_Main._list_NVtheoPB) {
        modal_Main._list_NVtheoPB = []
      }
      modal_Main._list_NVtheoPB = modal_Main._list_NVtheoPB.concat(obj)

      modal_Main.gen_NVtheoPB(document.getElementById("custom-filter").value.toLowerCase().trim());
    } else {
      modal_Main.allUser = true;
      util.ShowMess("Không có dữ liệu", "Warning");
    }
    util.HideLoading();
  },

  // Khi click user
  openChatWith: async function (employee) {
    currentEmployee = employee;
    const userId = employee.userId;

    const response = await fetch(
      "https://localhost:44333/api/v1/chat/start-conversation",
      {
        method: "POST",
        body: JSON.stringify({
          currentUserId: infoUser.ID_USER,
          targetUserId: userId,
        }),
        headers: { "Content-Type": "application/json" },
      }
    );

    const result = await response.json();
    const conversationId = result.conversationId;

    if (modal_Main.currentConversationId) {
      await modal_Main.leaveConversation(modal_Main.currentConversationId);
    }

    modal_Main.currentConversationId = conversationId;

    // An toàn DOM
    const fileDisplay = document.getElementById("file-image-display");
    if (fileDisplay) fileDisplay.innerHTML = "";

    const memberList = document.getElementById("member-list");
    if (memberList) memberList.innerHTML = "";

    await modal_Main.joinConversation(conversationId);

    const btnAddUser = document.getElementById("btn-add-user");
    if (btnAddUser) btnAddUser.style.display = "none";

    modal_Main.pageIndex = 1;
    modal_Main.allMessagesLoaded = false;

    const chatLoading = document.getElementById("chat-loading");
    if (chatLoading) chatLoading.style.display = "block";

    const fullName = employee.fullName;
    const avatarUrl = employee.avatar
      ? `${MainHost}/${ROOT}/${infoUser.SM1}/${infoUser.SM2}/USER/IMG/${employee.avatar}`
      : "./img/avatar-default.jpg";

    // Giao diện người nhận
    const updateEl = (id, prop, value) => {
      const el = document.getElementById(id);
      if (el) el[prop] = value;
    };

    updateEl("chat-user-name", "textContent", fullName);
    updateEl("chat-user-avatar", "src", avatarUrl);
    updateEl("user-fullname", "textContent", fullName);
    updateEl("user-avatar-img", "src", avatarUrl);

    // Load tin nhắn & mở popup
    await modal_Main.get_Message(conversationId);

    if (chatLoading) chatLoading.style.display = "none";

    openChatPopup(
      conversationId,
      fullName,
      avatarUrl,
      false,
      async () => {
        await modal_Main.get_Message(conversationId);
      }
    );
  },

  get_Message: async function (conversationId) {
    modal_Main.isLoadingMessages = true;
    document.getElementById("chat-loading").style.display = "block";

    try {
      const msgResponse = await fetch(
        `https://localhost:44333/api/v1/chat/get-messages/${conversationId}/${modal_Main.pageIndex}/${modal_Main.pageSize}`
      );

      const messages = await msgResponse.json();

      if (messages.length === 0 || messages.length < modal_Main.pageSize) {
        modal_Main.allMessagesLoaded = true;
      }
      if (modal_Main.pageIndex === 1) {
        document.querySelector(".chat-box").innerHTML = "";
      }

      modal_Main.renderMessages(messages);
      modal_Main.pageIndex++;
    } catch (error) {
      console.error("Lỗi tải tin nhắn:", error);
    } finally {
      modal_Main.isLoadingMessages = false;
      document.getElementById("chat-loading").style.display = "none";
    }
  },
  // Tham gia phòng chat
  joinConversation: async function (conversationId) {
    try {
      await connection.invoke("JoinConversation", conversationId.toString());
      console.log("🎯 Tham gia phòng:", conversationId);
    } catch (err) {
      console.error("❌ Lỗi JoinConversation:", err);
    }
  },
  leaveConversation: async function (conversationId) {
    try {
      await connection.invoke("LeaveConversation", conversationId.toString());
      console.log("🚪 Rời phòng:", conversationId);
    } catch (err) {
      console.error("❌ Lỗi LeaveConversation:", err);
    }
  },

  joinGroup: async function (conversationId) {
    const infoUser = JSON.parse(localStorage.getItem("DEMOinfoUser"));
    const currentUser = infoUser?.ID_USER;

    try {
      const response = await fetch(
        "https://localhost:44333/api/v1/chat/join-group",
        {
          method: "POST",
          body: JSON.stringify({
            userId: currentUser,
            conversationId: conversationId,
          }),
          headers: { "Content-Type": "application/json" },
        }
      );
      const result = await response.json();
      const newConversationId = result.conversationId;

      if (modal_Main.currentConversationId) {
        await modal_Main.leaveConversation(modal_Main.currentConversationId);
      }

      modal_Main.currentConversationId = newConversationId;

      const groupName = result.groupName || "Unknown Group";
      const groupAvatar = result.imageURL || "./img/anh-avatar-nhom.jpg";

      // Cập nhật giao diện
      const updateEl = (id, prop, value) => {
        const el = document.getElementById(id);
        if (el) el[prop] = value;
      };

      updateEl("chat-user-name", "textContent", groupName);
      updateEl("user-fullname", "textContent", groupName);
      updateEl("chat-user-avatar", "src", groupAvatar);
      updateEl("user-avatar-img", "src", groupAvatar);

      await modal_Main.joinConversation(newConversationId);

      modal_Main.pageIndex = 1;
      modal_Main.allMessagesLoaded = false;

      const fileDisplay = document.getElementById("file-image-display");
      if (fileDisplay) fileDisplay.innerHTML = "";

      await modal_Main.get_Message(newConversationId);

      const btnAddUser = document.getElementById("btn-add-user");
      if (btnAddUser) btnAddUser.style.display = "block";

      openChatPopup(
        newConversationId,
        groupName,
        groupAvatar,
        true,
        async () => {
          await modal_Main.get_Message(newConversationId);
        }
      );
    } catch (error) {
      console.error("Lỗi tham gia nhóm:", error);
      showToast("Không thể tham gia nhóm: " + error.message);
    }
  },
  get_Group: async function (currentUser) {
    const resultGroup = document.getElementById("resultGroup");

    if (modal_Main.isLoadingGroup) return;
    modal_Main.isLoadingGroup = true;

    try {
      const response = await fetch(
        `https://localhost:44333/api/v1/chat/groups/${modal_Main.currentUser}/${modal_Main.pageIndexGroup}/${modal_Main.pageSizeGroup}`,
        { method: "GET" }
      );

      if (!response.ok) throw new Error("Không thể lấy danh sách nhóm.");

      const data = await response.json();

      // Nếu là lần đầu load => reset danh sách
      if (modal_Main.pageIndexGroup === 1) {
        modal_Main._listGroup = [];
        resultGroup.innerHTML = ""; // Clear danh sách
      }

      if (data.length === 0 && modal_Main.pageIndexGroup === 1) {
        modal_Main.render_GroupList([]);
        return;
      }

      if (data.length === 0) return; // hết dữ liệu

      // Gộp thêm vào danh sách đã có
      modal_Main._listGroup = [...(modal_Main._listGroup || []), ...data];

      // Render danh sách mới thêm
      modal_Main.render_GroupList(data); // chỉ render phần mới

      modal_Main.pageIndexGroup++;
    } catch (error) {
      resultGroup.innerHTML = `<span style="color:red;">${error.message}</span>`;
    } finally {
      modal_Main.isLoadingGroup = false;
    }
  },

  renderMessages: function (messages) {
    const chatBox = document.querySelector(".chat-box");
    if (modal_Main.pageIndex === 1) {
      chatBox.innerHTML = ""; // Clear old messages if first load
    }

    const oldScrollHeight = chatBox.scrollHeight;

    messages.forEach((msg) => {
      const isOutgoing = msg.senderId === infoUser.ID_USER;
      const li = document.createElement("li");
      li.className = isOutgoing ? "chat-message outgoing" : "chat-message incoming";
      li.setAttribute("data-message-id", msg.messageId)

      let contentHtml = "";

      const fileExt = msg.fileName?.split(".").pop()?.toLowerCase();
      const isImage = ["png", "jpg", "jpeg", "gif", "bmp", "webp"].includes(fileExt);
      const isAutoGeneratedFileLabel = ["[hình ảnh]", "[file]"].includes(msg.content?.trim().toLowerCase());

      // CASE: Tin nhắn đã xoá & là ảnh/file cũng đã xoá
      if (
        msg.messageStatus === false &&
        msg.fileUrl && msg.fileName &&
        msg.attachFileStatus === false
      ) {
        contentHtml = `<div class="text-muted fst-italic" style="min-height: 40px">${isImage ? "Ảnh đã bị xoá" : "File đã bị xoá"}</div>`;
        li.innerHTML = `<div class="chat-bubble">${contentHtml}</div>`;
        chatBox.insertBefore(li, chatBox.firstChild);
        return;
      }

      // Tên người gửi (nếu là tin nhắn đến)
      if (!isOutgoing) {
        contentHtml += `<div><strong>${msg.fullName_Sender}</strong></div>`;
      }

      // Tin nhắn trả lời
      if (msg.originalContent && msg.originalSenderName) {
        contentHtml += `
        <div class="reply-preview">
          <strong>${msg.originalSenderName}:</strong> ${msg.originalContent}
        </div>
      `;
      }

      //  Nội dung văn bản
      if (
        msg.messageStatus === false &&
        !(msg.fileUrl && msg.fileName && msg.attachFileStatus === false)
      ) {
        contentHtml += `<div class="text-muted fst-italic">[tin nhắn đã xóa]</div>`;
      } else if (
        msg.content &&
        !(isAutoGeneratedFileLabel && msg.attachFileStatus === false)
      ) {
        contentHtml += `<div>${msg.content}</div>`;
      }

      // Hiển thị file/ảnh nếu hợp lệ
      if (
        msg.messageStatus === true &&
        msg.fileUrl && msg.fileName &&
        msg.attachFileStatus === true
      ) {
        contentHtml += isImage
          ? `<div class="chat-image-wrapper">
        <a href="${msg.fileUrl}">
        <br><img src="${msg.fileUrl}" style="max-width: 200px; border-radius: 10px;">
        </a>
        </div>`
          : `<div><a href="${msg.fileUrl}" target="_blank">${msg.fileName}</a></div>`;
      }

      //  Thời gian gửi
      contentHtml += `<div class="text-right small">${new Date(msg.sentAt).toLocaleString()}</div>`;

      // Icon thao tác
      const safeContent = msg.content ? msg.content.replace(/`/g, "\\`") : "";
      li.innerHTML = `
      <div class="chat-bubble">
        ${contentHtml}
         <div class="reaction-display"></div>
        ${msg.messageStatus !== false ? `
        <div class="chat-icons">
          <div class="reply-action text-right">
            <span onclick="modal_Main.setReply(${msg.messageId}, '${msg.fullName_Sender}', \`${safeContent}\`)">↩️ Trả lời</span>
          </div>
          <span class="emoji-trigger" data-message-id="${msg.messageId}">😊</span>
          <span class="options-toggle" onclick="modal_Main.toggleOptionsMenu(this)">⋮</span>
          <div class="options-menu" style="display: none;">
            <div onclick="modal_Main.deleteMessage(${msg.messageId})">Gỡ</div>
            <div onclick="modal_Main.pinMessage(${msg.messageId})">Ghim</div>
          </div>
        </div>` : ''}
      </div>
    `;

      chatBox.insertBefore(li, chatBox.firstChild);
    });

    const newScrollHeight = chatBox.scrollHeight;
    chatBox.scrollTop = newScrollHeight - oldScrollHeight;
  },


  render_GroupList: function (groups) {
    const resultGroup = document.getElementById("resultGroup");

    if (!groups || groups.length === 0) {
      if (modal_Main.pageIndexGroup === 1) {
        resultGroup.innerHTML = `<p>Không tìm thấy nhóm nào.</p>`;
      }
      return;
    }

    // Clear nội dung cũ
    resultGroup.innerHTML = "";

    const html = groups
      .map(group => `
      <div class="list-group" onclick="modal_Main.joinGroup(${group.conversationId})">
        <img 
          src="${group.imageURL || "./img/anh-avatar-nhom.jpg"}" 
          alt="GroupAvatar"
          style="width: 60px; height: 60px; object-fit: cover; border-radius: 50%; border: 1px solid #aaa;" 
        />
        <div>
          <p style="margin: 0; font-size:20px;"><strong>${group.groupName}</strong></p>
          <span style="font-size:15px">
            ${group.lastMessage
          ? `<strong>${group.senderName || "Không rõ"}:</strong> ${group.lastMessage}`
          : "Chưa có tin nhắn"
        }
          </span>
          <span style="font-size:15px">
            ${group.lastMessageTime ? ` - ${timeAgo(group.lastMessageTime)}` : ""}
          </span>
        </div>
      </div>
    `)
      .join("");

    resultGroup.innerHTML = html;
  },
}
const toggleBtn = document.getElementById("messenger-toggle");
const chatPopup = document.getElementById("chat-popup");
const closeBtn = document.getElementById("close-chat");


// Toggle popup hiển thị / ẩn
toggleBtn.onclick = () => {
  chatPopup.style.display = (chatPopup.style.display === 'none' || chatPopup.style.display === '') ? 'block' : 'none';
};

// Nút đóng popup
closeBtn.onclick = () => {
  chatPopup.style.display = 'none';
};


let searchTimeout;
document.getElementById("custom-filter").addEventListener("input", function () {
  clearTimeout(searchTimeout);
  const keyword = this.value.trim().toLowerCase();
  searchTimeout = setTimeout(() => {
    modal_Main.gen_NVtheoPB(keyword);
  }, 300);
});
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", async function () {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    this.classList.add("active");

    document.querySelectorAll(".tab-btn").forEach(pane => pane.classList.remove("active"));
    const tabId = this.getAttribute("data-tab");
    document.getElementById(tabId).classList.add("active");

    const keyword = document.getElementById("custom-filter").value.trim().toLowerCase();

    // 👉 Ẩn hoặc hiện #group-members tùy theo tab
    const groupMembers = document.getElementById('group-members');
    if (groupMembers) {
      groupMembers.style.display = (tabId === "groups-tab") ? "block" : "none";
    }

    if (tabId === "employees-tab") {
      modal_Main.gen_NVtheoPB(keyword);
    } else if (tabId === "groups-tab") {
      // Nếu chưa load nhóm, gọi API lần đầu
      if (!modal_Main._listGroup || modal_Main._listGroup.length === 0) {
        modal_Main.pageIndexGroup = 1;
        await modal_Main.get_Group(modal_Main.currentUser); // currentUser phải có giá trị
      } else {
        // Nếu đã có dữ liệu => lọc theo từ khóa
        const filtered = modal_Main._listGroup.filter(group =>
          (group.groupName || "").toLowerCase().includes(keyword)
        );
        modal_Main.render_GroupList(filtered);
      }
    }
  });
});

function closeChat(name) {
  const chatId = "chat-" + name.replace(/\s/g, "");
  const el = document.getElementById(chatId);
  if (el) el.remove();
  modal_Main.openedChats = openedChats.filter(x => x !== name);
  repositionChats();
}

function repositionChats() {
  modal_Main.openedChats.forEach((conversationId, index) => {
    const el = document.getElementById(`chat-${conversationId}`);
    if (el) el.style.right = `${20 + index * 310}px`;
  });
}

function minimizeChat(conversationId, avatarURL, title, isGroup) {
  const chatEl = document.getElementById(`chat-${conversationId}`);
  if (chatEl) {
    chatEl.remove();
    modal_Main.openedChats = openedChats.filter(id => id !== conversationId);

    const mini = document.createElement("div");
    mini.className = "minimized-avatar";
    mini.innerHTML = `<img src="${avatarURL || './img/avatar-default.jpg'}" title="${title}" alt="Avatar">`;
    mini.onclick = () => {
      mini.remove();
      modal_Main.minimizedChats = minimizedChats.filter(id => id !== conversationId);
      if (isGroup) {
        modal_Main.joinGroup(conversationId);
      } else {
        const employee = modal_Main.userMap[conversationId];
        if (employee) modal_Main.openChatWith(employee);
      }
    };

    document.getElementById("minimized-chats").appendChild(mini);
    modal_Main.minimizedChats.push(conversationId);
    repositionChats();
  }
}


function openChatPopup(conversationId, title, avatar, isGroup, loadFn) {
  const chatId = `chat-${conversationId}`;
  if (modal_Main.openedChats.includes(conversationId)) return;

  if (modal_Main.openedChats.length >= modal_Main.MAX_OPENED_CHATS) {
    alert("Chỉ mở tối đa 3 cuộc trò chuyện.");
    return;
  }

  const chatWindow = document.createElement("div");
  chatWindow.className = "chatWindow";
  chatWindow.id = chatId;
  chatWindow.style.right = `${20 + modal_Main.openedChats.length * 310}px`;
  chatWindow.innerHTML = `
    <div class="chatHeader">
      <span>${title}</span>
      <span class="closeBtn" onclick="minimizeChat('${conversationId}', '${avatar}', '${title}', ${isGroup})">×</span>
    </div>
    <div class="chatBody" id="chat-body-${conversationId}"></div>
    <div class="chatInput">
      <input type="text" placeholder="Nhập tin nhắn..." onkeypress="handleKeyPress(event, 'chat-body-${conversationId}', '${title}')">
    </div>
  `;

  document.body.appendChild(chatWindow);
  modal_Main.openedChats.push(conversationId);
  repositionChats();

  loadFn(); // gọi API lấy tin nhắn, join room, v.v.
}

function showToast(message, duration = 3000) {
  const toast = document.createElement("div")
  toast.className = "custom-toast"
  toast.textContent = message
  document.body.appendChild(toast)

  // Hiển thị
  setTimeout(() => toast.classList.add("show"), 100)

  // Tự động xoá sau duration
  setTimeout(() => {
    toast.classList.remove("show")
    setTimeout(() => toast.remove(), 300)
  }, duration)
};

function handleKeyPress(e, chatBodyId, senderName) {
  if (e.key === "Enter") {
    const input = e.target;
    const text = input.value.trim();
    if (text !== "") {
      const body = document.getElementById(chatBodyId);
      const msg = document.createElement("div");
      msg.className = "chatBubble";
      msg.style.background = "#0084ff";
      msg.style.color = "#fff";
      msg.style.marginLeft = "auto";
      msg.textContent = text;
      body.appendChild(msg);
      body.scrollTop = body.scrollHeight;
      input.value = "";
    }
  }
}