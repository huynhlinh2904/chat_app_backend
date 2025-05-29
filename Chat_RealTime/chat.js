var modal_Main = {
  selectedUserIds: [],
  users: [],
  _listGroup: [],
  currentConversationId: null,
  currentEmployee: null,
  currentUser: infoUser.ID_USER,
  messagePage: 1,
  isLoadingMessages: false,
  allMessagesLoaded: false,
  isLoadingUser: false,
  pageIndex: 1,
  pageSize: 10,
  pageIndexGroup: 1,
  pageSizeGroup: 7,
  pageIndexUser: 1,
  pageSizeUser: 8,
  isLoadingGroup: false,
  replyingMessageId: null,

  init: function () {
    // Kiểm tra có dữ liệu không
    if (!infoUser || !token) {
      showToast("Phiên đăng nhập đã hết, vui lòng đăng nhập lại.");
      window.location.href = "../Login/Login.html"; // hoặc route login của bạn
    }
  },

  // INIT TABLE
  initTable: function () {
    modal_Main.syncUserToChatServer();
    modal_Main.loaddata_NVtheoPB();
    modal_Main.setupClickOutsideHandler();

    $(".dataTables_filter input").attr("placeholder", "Tìm kiếm...");
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

    // 👉 Rời phòng cũ nếu có
    if (modal_Main.currentConversationId) {
      await this.leaveConversation(modal_Main.currentConversationId);
    }

    modal_Main.currentConversationId = conversationId;
    document.getElementById("file-image-display").innerHTML = "";
    document.getElementById("member-list").innerHTML = "";
    await modal_Main.joinConversation(conversationId);
    $("#btn-add-user").hide();
    modal_Main.pageIndex = 1;
    modal_Main.allMessagesLoaded = false;
    document.getElementById("chat-loading").style.display = "block"; // 👉 Hiện loading

    // Update giao diện người nhận
    document.getElementById("chat-user-name").textContent =
      employee.fullName;
    document.getElementById("chat-user-avatar").src = employee.avatar
      ? `${MainHost}/${ROOT}/${infoUser.SM1}/${infoUser.SM2}/USER/IMG/${employee.avatar}`
      : "./img/avatar-default.jpg";

    // thông tin người nhận
    document.getElementById("user-fullname").textContent =
      employee.fullName;
    document.getElementById("user-avatar-img").src = employee.avatar
      ? `${MainHost}/${ROOT}/${infoUser.SM1}/${infoUser.SM2}/USER/IMG/${employee.avatar}`
      : "./img/avatar-default.jpg";

    // Load & render messages
    await modal_Main.get_Message(conversationId);
    document.getElementById("chat-loading").style.display = "none"; // 👉 Ẩn loading
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
  getListUserByConversation: async function () {
    const memberList = document.getElementById('member-list')
    const memberTitle = document.getElementById('member-title') // để hiển thị tổng thành viên

    memberList.innerHTML = ''

    try {
      const response = await fetch(
        `https://localhost:44333/api/v1/chat/get-users-by-conversation/${modal_Main.currentConversationId}`
      )
      const result = await response.json()

      // Cập nhật tổng thành viên
      if (memberTitle) {
        memberTitle.innerHTML = `<strong>Thành viên nhóm (${result.totalMembers})</strong>`
      }

      result.members.forEach(user => {
        const li = document.createElement('li')
        li.style.padding = '10px'
        li.style.borderBottom = '1px solid #ccc'
        li.style.display = 'flex'
        li.style.alignItems = 'center'
        li.style.justifyContent = 'space-between'

        const isAdmin = user.isAdmin === true || user.isAdmin === 1

        li.innerHTML = `
        <div style="display: flex; align-items: center;">
          <img src="${user.avatar ? `/uploads/${user.avatar}` : '../../../assets/image-resources/gravatar.jpg'}" 
               alt="avatar" 
               width="30" height="30" 
               style="border-radius: 50%; object-fit: cover; margin-right: 10px;">
          <div>
            <div style="font-weight: 500;">${user.fullName}</div>
            ${isAdmin ? '<div style="font-size: 12px; color: #777;">Trưởng nhóm</div>' : ''}
          </div>
        </div>
        <div class="dropdown" style="cursor: pointer; position: relative;">
          <span>⋮</span>
          <div class="member-action-menu">
          <button class="btn btn-sm btn-danger" onclick="modal_Main.removeUserFromGroup('${user.userId}')">
            Xóa khỏi nhóm
          </button>
          <button class="btn btn-sm btn-danger" onclick="modal_Main.leaveGroup('${user.userId}')">
            Rời khỏi nhóm
          </button>
          <button class="btn btn-sm btn-danger" onclick="modal_Main.transferAdmin('${user.userId}')">
            Chuyển quyền admin
          </button>
        </div>
      </div>
      `
        memberList.appendChild(li)
      })
    } catch (err) {
      console.log(err)
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

  // lấy danh sách nhân viên

  gen_NVtheoPB: function (keyword = "") {
    const employeeList = document.getElementById("employee-list")
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
      const response = await fetch(`https://localhost:44333/api/v1/users?pageIndex=${modal_Main.pageIndexUser}&pageSize=${modal_Main.pageSizeUser}`);
      const data = await response.json();

      const validUsers = (data || []).filter(user =>
        user && user.userId && user.fullName
      );

      if (validUsers.length < modal_Main.pageSizeUser) {
        modal_Main.allUser = true;
      }

      modal_Main.pageIndexUser++;
      return validUsers;
    } catch (error) {
      console.error("Lỗi tải user:", error);
      return [];
    } finally {
      modal_Main.isLoadingUser = false;
    }
  },

  loaddata_NVtheoPB: async function () {
    util.ShowLoading();

    const newUsers = await modal_Main.getData_User();

    if (newUsers.length > 0) {
      if (!modal_Main._list_NVtheoPB || modal_Main.pageIndexUser === 2) {
        modal_Main._list_NVtheoPB = [];
      }

      modal_Main._list_NVtheoPB.push(...newUsers);
      modal_Main.gen_NVtheoPB();
    } else if (modal_Main.pageIndexUser === 1) {
      util.ShowMess("Không có dữ liệu", "Warning");
    }

    util.HideLoading();
  },


  sendMessage: async function () {
    const userId = currentEmployee?.ID_USER ?? ""
    const content = document.getElementById("chat-input").value.trim()
    const fileInput = document.getElementById("chat-attachment")
    const files = fileInput.files
    if (!content && files.length === 0) return

    try {
      // 1. Gửi nội dung văn bản (nếu có)
      if (content !== "") {
        const textFormData = new FormData()
        textFormData.append("SenderId", infoUser.ID_USER)
        textFormData.append("ReceiverId", userId)
        textFormData.append("ConversationId", modal_Main.currentConversationId)
        textFormData.append("Content", content)
        if (modal_Main.replyingMessageId !== null) {
          textFormData.append("ReplyMessageId", modal_Main.replyingMessageId)
        }

        await fetch("https://localhost:44333/api/v1/chat/send-message", {
          method: "POST",
          body: textFormData
        })
      }

      // 2. Gửi từng ảnh (mỗi ảnh là 1 message riêng)
      for (let i = 0; i < files.length; i++) {
        const imageFormData = new FormData()
        imageFormData.append("SenderId", infoUser.ID_USER)
        imageFormData.append("ReceiverId", userId)
        imageFormData.append("ConversationId", modal_Main.currentConversationId)
        imageFormData.append("File", files[i])

        await fetch("https://localhost:44333/api/v1/chat/send-message", {
          method: "POST",
          body: imageFormData
        })
      }

      // 3. Clear input
      document.getElementById("chat-input").value = ""
      document.getElementById("chat-attachment").value = ""
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error)
    }
  },

  renderUsers: async function (modalId) {
    let userListElement;
    let search = "";

    if (modalId === 'createGroupModal') {
      userListElement = document.getElementById("userList");
      search = document.getElementById("searchUser").value.toLowerCase();
    } else if (modalId === 'addGroupModal') {
      userListElement = document.getElementById("userList-add");
      search = document.getElementById("searchUser-add").value.toLowerCase();
    }

    if (!userListElement) return;

    userListElement.innerHTML = "";

    const employees = await modal_Main.getData_NVtheoPB();

    // Lấy danh sách thành viên đã trong nhóm
    let existingMemberIds = [];
    if (modalId === 'addGroupModal') {
      const response = await fetch(`https://localhost:44333/api/v1/chat/get-users-by-conversation/${modal_Main.currentConversationId}`);
      const currentMembers = await response.json();
      existingMemberIds = currentMembers.members.map(member => member.userId); // chuẩn field từ API backend của bạn
    }

    if (!employees || employees.length === 0) {
      userListElement.innerHTML = "<p>Không có nhân viên nào để hiển thị.</p>";
      return;
    }

    employees
      .filter((employee) =>
        employee.FULLNAME_USER.toLowerCase().includes(search)
      )
      .forEach((employee) => {
        const checked = modal_Main.selectedUserIds.includes(employee.ID_USER) ? "checked" : "";
        const isMember = existingMemberIds.includes(employee.ID_USER); // kiểm tra có trong nhóm không
        const disabled = isMember ? "disabled" : "";
        const avatarSrc = employee.IMAGE_NAME
          ? `${MainHost}/${ROOT}/${infoUser.SM1}/${infoUser.SM2}/USER/IMG/${employee.IMAGE_NAME}`
          : "./img/avatar-default.jpg";

        userListElement.innerHTML += `
          <div class="user-item" style="display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
            <input type="checkbox" id="user-${employee.ID_USER}" value="${employee.ID_USER}" ${checked} ${disabled} onchange="modal_Main.toggleSelect(${employee.ID_USER})" />
            <img src="${avatarSrc}" alt="${employee.FULLNAME_USER}" style="width: 40px; height: 40px; border-radius: 50%; margin: 0 10px;" />
            <label for="user-${employee.ID_USER}" style="cursor: pointer;">${employee.FULLNAME_USER} ${isMember ? '<span class="text-muted">(đã trong nhóm)</span>' : ''}</label>
          </div>
        `;
      });
  },
  toggleSelect: function (userId) {
    const index = modal_Main.selectedUserIds.indexOf(userId);
    if (index > -1) {
      modal_Main.selectedUserIds.splice(index, 1); // Bỏ chọn
    } else {
      modal_Main.selectedUserIds.push(userId); // Chọn
    }
  },
  filterUsers: function () {
    modal_Main.renderUsers();
  },
  createGroup: async function () {
    const groupName = document.getElementById("groupName").value.trim();
    const imageFileInput = document.getElementById("groupImage");
    const files = imageFileInput.files;

    if (!groupName) {
      showToast("Vui lòng nhập tên nhóm");
      return;
    }

    if (modal_Main.selectedUserIds.length === 0) {
      showToast("Vui lòng chọn ít nhất một thành viên");
      return;
    }

    const formData = new FormData();
    formData.append("GroupName", groupName);
    formData.append("CreatedByUserId", modal_Main.currentUser);
    if (files.length > 0) {
      formData.append("ImageURL", files[0]); // chỉ gửi 1 ảnh
    }
    modal_Main.selectedUserIds.forEach((id) => {
      formData.append("MemberUserIds", id);
    }); // backend expects comma-separated string

    try {
      const response = await fetch(
        "https://localhost:44333/api/v1/chat/create-group-conversation",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        showToast("Tạo nhóm thành công!");
        modal_Main.closeModal("createGroupModal");
        modal_Main.joinGroup(result.conversationId);

        // Reset nhóm để load lại từ đầu
        modal_Main.pageIndexGroup = 1;
        document.getElementById("resultGroup").innerHTML = "";
        await modal_Main.get_Group(modal_Main.currentUser);
      } else {
        throw new Error(result.error || "Tạo nhóm thất bại");
      }
    } catch (err) {
      console.error("Lỗi khi tạo nhóm:", err);
      showToast("Lỗi khi tạo nhóm: " + err.message);
    }
  },
  addUserToGroup: async function () {
    if (modal_Main.selectedUserIds.length === 0) {
      showToast("Vui lòng chọn ít nhất một thành viên");
      return;
    }

    const payload = {
      adminUserId: infoUser.ID_USER,
      ConversationId: modal_Main.currentConversationId,
      MemberIDs: modal_Main.selectedUserIds,
    };

    try {
      const response = await fetch(
        "https://localhost:44333/api/v1/chat/add-user-to-group",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        showToast("Thêm nhân viên vào nhóm thành công!");
        modal_Main.closeModal("addGroupModal");
        modal_Main.getListUserByConversation();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Thêm thất bại");
      }
    } catch (err) {
      showToast("Lỗi thêm nhân viên vào nhóm: " + err);
    }
  },
  get_UserInConversation: async function () {
    try {
      const response = await fetch(
        `https://localhost:44333/api/v1/chat/get-users-by-conversation/${modal_Main.currentConversationId}`,
        {
          method: "GET",
        }
      );

      const data = await response.json();

      if (!data || data.length === 0) {
        document.getElementById("userListContainer").innerHTML =
          "<p>Không có thành viên nào trong cuộc trò chuyện này.</p>";
        return;
      }

      let html = "<ul>";
      data.forEach((user) => {
        html += `<li>${user.fullName} (${user.userName})</li>`;
      });
      html += "</ul>";

      document.getElementById("userListContainer").innerHTML = html;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
      document.getElementById("userListContainer").innerHTML =
        "<p>Lỗi khi lấy danh sách người dùng.</p>";
    }
  },

  closeModal: function (modalId) {
    if (!modalId) return;

    modal_Main.selectedUserIds = [];

    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      modalElement.style.display = "none";
    }
  },

  openModal: async function (modalId) {
    if (!modalId) return;

    modal_Main.selectedUserIds = [];

    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      modalElement.style.display = "block";
    }

    if (modalId === "createGroupModal") {
      document.getElementById("groupName").value = "";
      document.getElementById("searchUser").value = "";
    }

    if (modalId === "addGroupModal") {
      document.getElementById("searchUser-add").value = "";
    }

    await modal_Main.renderUsers(modalId);
  },
  get_Group: async function (currentUser) {
    const resultGroup = document.getElementById("resultGroup");

    if (modal_Main.isLoadingGroup) return;
    modal_Main.isLoadingGroup = true;

    try {
      const response = await fetch(
        `https://localhost:44333/api/v1/chat/groups/${currentUser}/${modal_Main.pageIndexGroup}/${modal_Main.pageSizeGroup}`,
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

      // Rời phòng cũ nếu có
      if (modal_Main.currentConversationId) {
        await this.leaveConversation(modal_Main.currentConversationId);
      }

      modal_Main.currentConversationId = newConversationId;

      const groupName = result.groupName;
      if (groupName) {
        document.getElementById("chat-user-name").textContent = groupName;
        document.getElementById("user-fullname").textContent = groupName;
      } else {
        console.error("groupName not found in response");
        document.getElementById("chat-user-name").textContent = "Unknown Group";
      }
      document.getElementById("chat-user-avatar").src = result.imageURL
        ? result.imageURL
        : "./img/anh-avatar-nhom.jpg";
      document.getElementById("user-avatar-img").src = result.imageURL
        ? result.imageURL
        : "./img/anh-avatar-nhom.jpg";

      await this.joinConversation(newConversationId);

      modal_Main.pageIndex = 1;
      modal_Main.allMessagesLoaded = false;

      // Sửa điều kiện so sánh
      if (modal_Main.currentConversationId !== newConversationId) return;
      document.getElementById("file-image-display").innerHTML = "";
      await modal_Main.get_Message(newConversationId);
      $("#btn-add-user").show();
    } catch (error) {
      console.error("Lỗi tham gia nhóm:", error);
      showToast("Không thể tham gia nhóm: " + error.message);
    }
  },
  addUserinGroup: async function (employee) {
    const infoUser = JSON.parse(localStorage.getItem("DEMOinfoUser"));
    const currentUser = infoUser?.ID_USER;
    const targetUserId = employee.ID_USER;

    if (!modal_Main.currentConversationId) {
      showToast("Bạn chưa chọn nhóm để thêm thành viên.");
      return;
    }

    try {
      const response = await fetch(
        "https://localhost:44333/api/v1/chat/add-user-to-group",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminUserId: currentUser,
            targetUserId: targetUserId,
            conversationId: modal_Main.currentConversationId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Thêm thành viên thất bại");
      }

      showToast("Đã thêm thành viên vào nhóm thành công!");
      await this.get_Message(modal_Main.currentConversationId); // Load lại tin nhắn nếu cần
    } catch (error) {
      console.error("Lỗi thêm thành viên:", error);
      showToast("Lỗi: " + error.message);
    }
  },


  deleteMessage: async function (messageId) {
    try {
      const response = await fetch(
        `https://localhost:44333/api/v1/chat/delete-message?messageId=${messageId}&userId=${modal_Main.currentUser}&conversationId=${modal_Main.currentConversationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      const result = await response.json();

      if (response.ok) {

        showToast(result.message, 3000);
        modal_Main.pageIndex = 1;
        // await modal_Main.get_Message(modal_Main.currentConversationId)
        return true;
      } else {
        showToast(result.message, 3000);
        return false;
      }
    } catch (error) {
      console.error("❌ Lỗi Server:", error);
      return false;
    }
  },


  renderEmployeesForGroupSelection: function () {
    const container = document.getElementById("employee-list-to-add");
    container.innerHTML = ""; // Clear cũ

    const infoUser = JSON.parse(localStorage.getItem("DEMOinfoUser"));
    const filteredList = modal_Main._list_NVtheoPB.filter(
      (e) => e.ID_USER !== infoUser.ID_USER
    );

    filteredList.forEach((employee) => {
      const div = document.createElement("div");
      div.className = "employee-item";
      div.innerHTML = `
                <label style="display: flex; align-items: center; margin-bottom: 5px;">
                    <input type="checkbox" class="employee-checkbox" value="${employee.ID_USER}" />
                    <span style="margin-left: 8px;">${employee.FULLNAME_USER}</span>
                </label>
            `;
      container.appendChild(div);
    });
  },

  // xử lý khi input mới tin nhắn
  appendMessage: function (msg) {
    const chatBox = document.querySelector(".chat-box")
    const isOutgoing = msg.senderId === infoUser.ID_USER
    const li = document.createElement("li")
    li.className = isOutgoing ? "chat-message outgoing" : "chat-message incoming"
    li.setAttribute("data-message-id", msg.messageId)
    li.id = `message-${msg.messageId}`

    let contentHtml = ""

    // Tên người gửi (nếu là incoming)
    if (!isOutgoing && msg.fullName_Sender) {
      contentHtml += `<div><strong>${msg.fullName_Sender}</strong></div>`
    }

    const safeContent = msg.content ? msg.content.replace(/`/g, "\\`") : ""

    // Tin nhắn trả lời
    if (msg.originalContent && msg.originalSenderName) {
      contentHtml += `
      <div class="reply-preview">
        <strong>${msg.originalSenderName}:</strong> ${msg.originalContent}
      </div>
    `
    }

    // Nội dung tin nhắn (hoặc đã xóa)
    if (
      msg.messageStatus === false &&
      !(msg.fileUrl && msg.fileName && msg.attachFileStatus === 0)
    ) {
      contentHtml += `<div class="text-muted fst-italic">[tin nhắn đã xóa]</div>`;
    } else if (msg.content) {
      contentHtml += `<div>${msg.content}</div>`
    }

    // File đính kèm
    if (msg.fileUrl && msg.fileName) {
      const ext = msg.fileName.split(".").pop().toLowerCase()
      const isImage = ["png", "jpg", "jpeg", "gif", "bmp", "webp"].includes(ext)
      contentHtml += isImage
        ? `
         <div class="chat-image-wrapper">
         <a href="${msg.fileUrl}">
        <br><img src="${msg.fileUrl}" style="max-width: 200px; border-radius: 10px;">
        </a>
        </div>
        `
        : `<br><a href="${msg.fileUrl}" target="_blank">📄 ${msg.fileName}</a>`
    }

    // Thời gian gửi
    contentHtml += `<div class="text-right small">${new Date(msg.sentAt).toLocaleString()}</div>`

    // Icon hành động (nếu chưa bị xóa)
    if (msg.messageStatus !== false) {
      contentHtml += `
      <div class="chat-icons">
       <div class="reaction-display"></div>
        <div class="reply-action text-right">
          <span onclick="modal_Main.setReply(${msg.messageId}, '${msg.fullName_Sender}', \`${safeContent}\`)">↩️ Trả lời</span>
        </div>
        <span class="emoji-trigger" data-message-id="${msg.messageId}">😊</span>
        <span class="options-toggle" onclick="modal_Main.toggleOptionsMenu(this)">⋮</span>
        <div class="options-menu" style="display: none;">
        <div onclick="modal_Main.deleteMessage(${msg.messageId})">Gỡ</div>
        <div onclick="modal_Main.pinMessage(${msg.messageId})">Ghim</div>
        </div>
      </div>
    `
    }

    li.innerHTML = `<div class="chat-bubble">${contentHtml}</div>`
    chatBox.appendChild(li)

    // Auto scroll
    requestAnimationFrame(() => {
      chatBox.scrollTop = chatBox.scrollHeight
    })

    const lastEmoji = li.querySelector('.emoji-trigger')
    if (lastEmoji) {
      tippy(lastEmoji, {
        content: `
      <div class="emoji-reactions">
        <button onclick="modal_Main.reactToMessage(this, '❤️')">❤️</button>
        <button onclick="modal_Main.reactToMessage(this, '😂')">😂</button>
        <button onclick="modal_Main.reactToMessage(this, '😮')">😮</button>
        <button onclick="modal_Main.reactToMessage(this, '😢')">😢</button>
        <button onclick="modal_Main.reactToMessage(this, '👍')">👍</button>
      </div>
    `,
        allowHTML: true,
        interactive: true,
        trigger: 'click',
        placement: 'top'
      })
    }

    modal_Main.cancelReply()
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
      li.id = `message-${msg.messageId}`

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

    document.querySelectorAll('.emoji-trigger').forEach(trigger => {
      if (!trigger._tippy) { // 👉 Kiểm tra chưa khởi tạo
        tippy(trigger, {
          content: `
        <div class="emoji-reactions">
          <button onclick="modal_Main.reactToMessage(this, '❤️')">❤️</button>
          <button onclick="modal_Main.reactToMessage(this, '😂')">😂</button>
          <button onclick="modal_Main.reactToMessage(this, '😮')">😮</button>
          <button onclick="modal_Main.reactToMessage(this, '😢')">😢</button>
          <button onclick="modal_Main.reactToMessage(this, '👍')">👍</button>
        </div>
      `,
          allowHTML: true,
          interactive: true,
          trigger: 'click',
          placement: 'top'
        })
      }
    })
  },


  reactToMessage: function (btn, emoji) {
    const msgId = btn.closest('.tippy-box')?._tippy?.reference?.dataset?.messageId;
    if (!msgId) return;

    const li = document.querySelector(`li[data-message-id="${msgId}"]`);
    const display = li?.querySelector('.reaction-display');
    if (display) {
      const emojiSet = new Set(display.textContent.split(' ').filter(e => e)); // loại bỏ rỗng
      emojiSet.add(emoji);
      display.textContent = Array.from(emojiSet).join(' ');
    }
  },

  // phần này hiển thị của thông tin người chat
  selectFile: async function () {
    const res = await fetch(
      `https://localhost:44333/api/v1/chat/get-documents-by-conversation/${modal_Main.currentConversationId}`
    );
    const data = await res.json();
    this.renderFiles(data);
  },

  selectImage: async function () {
    const res = await fetch(
      `https://localhost:44333/api/v1/chat/get-images-by-conversation/${modal_Main.currentConversationId}`
    );
    const data = await res.json();
    this.renderImages(data);
  },
  renderFiles: function (files) {
    const container = document.getElementById("file-image-display")
    container.innerHTML = "<h2>Danh sách file:</h2>"

    if (!files.length) {
      container.innerHTML += "<p>Không có file nào.</p>"
      return
    }

    // Nhóm files theo monthGroup
    const groupedByMonth = files.reduce((groups, file) => {
      const month = file.monthGroup
      if (!groups[month]) {
        groups[month] = []
      }
      groups[month].push(file)
      return groups
    }, {})

    // Hiển thị theo thứ tự tháng mới nhất trước
    Object.keys(groupedByMonth)
      .sort((a, b) => {
        const [ma, ya] = a.split('-').map(Number)
        const [mb, yb] = b.split('-').map(Number)
        return yb !== ya ? yb - ya : mb - ma
      })
      .forEach(month => {
        const monthHeader = document.createElement("h4")
        monthHeader.textContent = `Tháng ${month}`
        container.appendChild(monthHeader)

        const list = document.createElement("ul")
        list.style.listStyleType = "none"
        list.style.paddingLeft = "0"

        groupedByMonth[month].forEach(file => {
          const li = document.createElement("li")
          li.innerHTML = `
          <a style="font-size:16px; color: black;" href="${file.fileUrl}" target="_blank">${file.fileName}</a> 
          <small class="text-muted" style="font-size:16px;">(${new Date(file.sendingTime).toLocaleString()})</small>
        `
          list.appendChild(li)
        })

        container.appendChild(list)
      })
  },

  renderImages: function (files) {
    const container = document.getElementById("file-image-display");
    container.innerHTML = "<h2>Danh sách ảnh:</h2>";

    if (!files.length) {
      container.innerHTML += "<p>Không có ảnh nào.</p>";
      return;
    }

    // Nhóm ảnh theo monthGroup
    const groupedByMonth = files.reduce((groups, file) => {
      const month = file.monthGroup
      if (!groups[month]) {
        groups[month] = []
      }
      groups[month].push(file)
      return groups
    }, {})

    // Hiển thị ảnh theo tháng
    Object.keys(groupedByMonth)
      .sort((a, b) => b.localeCompare(a)) // tháng mới nhất lên trên
      .forEach(month => {
        const monthHeader = document.createElement("h3")
        monthHeader.textContent = `Tháng ${month}`
        container.appendChild(monthHeader)

        const grid = document.createElement("div")
        grid.style.display = "flex"
        grid.style.flexWrap = "wrap"
        grid.style.gap = "20px"
        grid.style.marginBottom = "20px"

        groupedByMonth[month].forEach(file => {
          const img = document.createElement("img")
          img.src = file.fileUrl
          img.alt = file.fileName
          img.style.width = "100px"
          img.style.borderRadius = "8px"
          img.style.boxShadow = "0 0 5px rgba(0,0,0,0.2)"
          grid.appendChild(img)
        })

        container.appendChild(grid)
      })
  },

  viewProfile: function () {
    showToast("Hồ sơ cá nhân - đang phát triển");
  },

  previewImage: function () {
    const input = document.getElementById("groupImage");
    const preview = document.getElementById("imagePreview");

    if (input.files && input.files[0]) {
      const reader = new FileReader();

      reader.onload = function (e) {
        preview.src = e.target.result;
        preview.style.display = "block";
      };

      reader.readAsDataURL(input.files[0]);
    } else {
      preview.src = "#";
      preview.style.display = "none";
    }
  },

  // phần reply message
  setReply: function (messageId, senderName, content) {
    modal_Main.replyingMessageId = messageId;

    const preview = document.getElementById("reply-preview-box");
    preview.innerHTML = `
      <div class="replying-to">
        <strong>${senderName}:</strong> ${content}
        <span class="cancel-reply" onclick="modal_Main.cancelReply()">❌</span>
      </div>
    `;
    preview.style.display = "block";
  },
  cancelReply: function () {
    modal_Main.replyingMessageId = null;
    const preview = document.getElementById("reply-preview-box");
    preview.style.display = "none";
    preview.innerHTML = "";
  },
  toggleOptionsMenu: function (el) {
    // Ẩn tất cả menu khác
    document.querySelectorAll(".options-menu").forEach(menu => {
      if (menu !== el.nextElementSibling) menu.style.display = "none"
    })


    const menu = el.nextElementSibling
    if (menu.style.display === "none" || !menu.style.display) {
      menu.style.display = "block"
    } else {
      menu.style.display = "none"
    }
  },
  toggleMemberMenu: function (el) {
    // Ẩn tất cả các menu khác
    document.querySelectorAll('.member-action-menu').forEach(menu => menu.style.display = 'none')

    // Hiển thị menu của phần tử hiện tại
    const menu = el.nextElementSibling
    if (menu) {
      menu.style.display = 'block'
    }
  },
  updateGroup: async function (){
    try{
      var api = await fetch(`https://localhost:44333/api/v1/chat/updateGroup?conversationId=${modal_Main.currentConversationId}&groupName=1&imageName=1&imageUrl=1&userId=1`)
    }catch(err){
      console.log(err);
    }
  },

  removeUserFromGroup: function (userId) {
    if (confirm('Bạn có chắc muốn xóa người này khỏi nhóm?')) {
      // TODO: Gọi API xóa và cập nhật lại danh sách
      console.log('Xóa userId:', userId)

      // Gợi ý gọi API xóa

      fetch(`https://localhost:44333/api/v1/chat/deleteMemberInGroup?adminUserId=${modal_Main.currentUser}&memberUserId=${userId}&conversationId=${modal_Main.currentConversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then(res => {
        if (res.ok) modal_Main.getListUserByConversation()
      })

    }
  },

  leaveGroup: function (userId) {
    if (confirm('Bạn có chắc muốn rời khỏi nhóm?')) {
      // TODO: Gọi API xóa và cập nhật lại danh sách
      console.log('Xóa userId:', userId)

      // Gợi ý gọi API xóa

      fetch(`https://localhost:44333/api/v1/chat/deleteMemberInGroup?adminUserId=${modal_Main.currentUser}&memberUserId=${userId}&conversationId=${modal_Main.currentConversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then(res => {
        if (res.ok) 
          modal_Main.getListUserByConversation();
          modal_Main.get_Group();
      })

    }
  },

  transferAdmin: function (userId) {
    if (confirm('Bạn có chắc chắn muốn chuyển quyền admin cho người này?')) {
      // TODO: Gọi API xóa và cập nhật lại danh sách
      console.log('Xóa userId:', userId)

      // Gợi ý gọi API xóa

      fetch(`https://localhost:44333/api/v1/chat/transferAdmin?conversationId=${modal_Main.currentConversationId}&newAdminUserId=${userId}&adminUserId=${modal_Main.currentUser}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then(res => {
        if (res.ok) modal_Main.getListUserByConversation()
      })

    }
  },

  // Ẩn menu khi click ra ngoài
  setupClickOutsideHandler: function () {
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".chat-icons")) {
        document.querySelectorAll(".options-menu").forEach(menu => {
          menu.style.display = "none"
        })
      }
    })
  }
};
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

// Khởi tạo lightGallery cho tất cả ảnh mới thêm vào
document.querySelectorAll('.chat-image-wrapper').forEach((el) => {
  if (!el.classList.contains('lg-initialized')) {
    const instance = lightGallery(el, {
      selector: 'a',
      plugins: [lgZoom],
      speed: 300,
      download: false
    })
    el.galleryInstance = instance // gán vào phần tử
    el.classList.add('lg-initialized')
  }
})
const openedGallery = document.querySelector('.lg-container.lg-show-in')
if (openedGallery) {
  const wrapper = openedGallery.closest('.chat-image-wrapper')
  if (wrapper && wrapper.galleryInstance) {
    wrapper.galleryInstance.close()
  }
}

function toggleUserInfoPanel() {
  const panel = document.getElementById('user-info-panel')
  const container = document.getElementById('cv-container')
  const btn = document.getElementById('toggle-user-info-btn')

  const isHidden = panel.classList.toggle('hidden') // toggle class ẩn
  container.classList.toggle('expanded-right', isHidden)

  btn.innerText = isHidden ? 'Thông tin nhóm' : 'Ẩn thông tin'

  // Trên mobile: scroll vào info
  if (window.innerWidth < 768 && !isHidden) {
    showPane('user-info-panel')
  }
}



function showPane(paneId) {
  document.querySelectorAll('.cv-panel.pane').forEach(el => el.classList.remove('active'))
  const selected = document.getElementById(paneId)
  if (selected) selected.classList.add('active')
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", async function () {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    this.classList.add("active");

    document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));
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

let searchTimeout;
document.getElementById("custom-filter").addEventListener("input", function (e) {
  clearTimeout(searchTimeout);

  const keyword = e.target.value.trim().toLowerCase();
  const activeTab = document.querySelector(".tab-pane.active")?.id;

  searchTimeout = setTimeout(() => {
    if (activeTab === "employees-tab") {
      modal_Main.gen_NVtheoPB(keyword);
    } else if (activeTab === "groups-tab") {
      const filtered = modal_Main._listGroup?.filter(group =>
        (group.groupName || "").toLowerCase().includes(keyword)
      ) || [];
      modal_Main.render_GroupList(filtered);
    }
  }, 300);
});

document.getElementById("searchUser").addEventListener("input", function () {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    modal_Main.renderUsers('createGroupModal')
  }, 300)
})

document.getElementById("searchUser-add").addEventListener("input", function () {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    modal_Main.renderUsers('addGroupModal')
  }, 300)
})


const chatBox = document.querySelector(".chat-box");

chatBox.addEventListener("scroll", function () {
  if (chatBox.scrollTop === 0) {
    if (!modal_Main.currentConversationId) return;
    modal_Main.get_Message(modal_Main.currentConversationId);
  }
});


document.getElementById("chat-input").addEventListener("keypress", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    modal_Main.sendMessage();
  }
});

document.getElementById('member-title')?.addEventListener('click', function () {
  const memberList = document.getElementById('member-list')
  const isHidden = memberList.style.display === 'none'

  memberList.style.display = isHidden ? 'block' : 'none'
})
document.addEventListener("DOMContentLoaded", () => {
  const resultGroup = document.getElementById("resultGroup");

  resultGroup.addEventListener("scroll", () => {
    const { scrollTop, scrollHeight, clientHeight } = resultGroup;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      modal_Main.get_Group(modal_Main.currentUser);
    }
  });
});
$(function () {
  setTimeout(function () {
    $(".scrollable-slim").slimScroll({
      color: "#8da0aa",
      size: "10px",
      alwaysVisible: true,
    });

    $(".scrollable-slim-sidebar").slimScroll({
      color: "#8da0aa",
      size: "10px",
      height: "100%",
      alwaysVisible: true,
    });

    $(".scrollable-slim-box").slimScroll({
      color: "#8da0aa",
      size: "6px",
      alwaysVisible: false,
    });
  }, 1000);
});
