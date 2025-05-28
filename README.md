# chat_app_backend

🚀 **ChatApp** là hệ thống nhắn tin thời gian thực dành cho doanh nghiệp và người dùng, sử dụng **ASP.NET Core** và **SignalR** để hỗ trợ giao tiếp nhanh chóng và ổn định. Dự án này được thiết kế theo kiến trúc nhiều lớp, dễ bảo trì và mở rộng.

---

## 🛠 Công nghệ sử dụng

- ASP.NET Core 5+
- SignalR cho real-time communication
- Entity Framework Core
- SQL Server
- RESTful API
- Repository Pattern & Dependency Injection
- Docker support

---

## 📁 Cấu trúc thư mục
- ChatApp/
- ├── Controllers/ # Các API controller
- ├── DTO/ # Định nghĩa dữ liệu truyền tải
- ├── Models/ # Entity và cấu trúc dữ liệu
- ├── Repository/ # Truy xuất cơ sở dữ liệu
- ├── Services/ # Xử lý logic nghiệp vụ
- ├── Hubs/ # SignalR hub cho nhắn tin real-time
- ├── APISetting/ # Enum & Config setting
- ├── APIResponse/ # Response chuẩn hóa
- ├── Startup.cs # Khởi tạo middleware, DI, SignalR
- ├── Program.cs # Entry point
- └── appsettings.json # File cấu hình ứng dụng
---
## 🔌 Danh sách API 

### 🗨️ Chat API (`ChatController`)
| Phương thức | Endpoint                                      | Mô tả |
|------------|-----------------------------------------------|------|
| GET        | `/api/v1/chat/groups/{userId}/{pageIndex}/{pageSize}` | Lấy danh sách nhóm chat theo người dùng |
| POST       | `/api/v1/chat/add-user-to-group`              | Thêm người dùng vào nhóm |
| POST       | `/api/v1/chat/send-message`                   | Gửi tin nhắn (hỗ trợ đính kèm file) |
| GET        | `/api/v1/chat/get-messages/{conversationId}/{pageIndex}/{pageSize}`  | Lấy danh sách tin nhắn trong cuộc trò chuyện |
| POST       | `/api/v1/chat/start-conversation`                   | Tham gia chat 1 : 1 |
| POST       | `/api/v1/chat/join-group`                   | Tham gia nhóm chat  |
| POST       | `/api/v1/chat/create-group-conversation`                   | Tạo nhóm chat |
| GET        | `/api/v1/chat/get-users-by-conversation/{conversationId}`  | Lấy danh sách người dùng trong nhóm chat |
| GET        | `/api/v1/chat/get-images-by-conversation/{conversationId}` | Lấy danh sách ảnh trong nhóm chat |
| GET        | `/api​/v1​/chat​/get-documents-by-conversation​/{conversationId}`  | Lấy danh sách file trong nhóm |
| POST       | `/api/v1/chat/delete-message`                   | Xóa tin nhắn bản thân đã gửi  |
| POST       | `/api/v1/chat/deleteMemberInGroup`                   | Kích người dùng ra khỏi nhóm |
| POST       | `/api/v1/chat/transferAdmin`                   | Chuyển quyền admin nhóm chat  |  
| POST       | `/api/v1/chat/updateGroup`                   | Cập nhật lại nhóm chat  |

### 👤 Người dùng (`UserController`)
| Phương thức | Endpoint                          | Mô tả |
|------------|-----------------------------------|------|
| GET        | `/api/v1/users`              | Lấy thông tin người dùng |

