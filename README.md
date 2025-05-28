# chat_app_backend

🚀 **ChatApp** là hệ thống nhắn tin thời gian thực dành cho doanh nghiệp và người dùng, sử dụng **ASP.NET Core** và **SignalR** để hỗ trợ giao tiếp nhanh chóng và ổn định. Dự án này được thiết kế theo kiến trúc nhiều lớp, dễ bảo trì và mở rộng.

---

## 🛠 Công nghệ sử dụng

- ASP.NET Core 6+
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
## 🔌 Danh sách API chính

### 🗨️ Chat API (`ChatController`)
| Phương thức | Endpoint                                      | Mô tả |
|------------|-----------------------------------------------|------|
| GET        | `/api/v1/chat/groups/{userId}/{pageIndex}/{pageSize}` | Lấy danh sách nhóm chat theo người dùng |
| POST       | `/api/v1/chat/add-user-to-group`              | Thêm người dùng vào nhóm |
| POST       | `/api/v1/chat/send-message`                   | Gửi tin nhắn (hỗ trợ đính kèm file) |
| GET        | `/api/v1/chat/get-messages/{conversationId}`  | Lấy danh sách tin nhắn trong cuộc trò chuyện |

### 👤 Người dùng (`UserController`)
| Phương thức | Endpoint                          | Mô tả |
|------------|-----------------------------------|------|
| GET        | `/api/v1/user/{id}`              | Lấy thông tin người dùng |
| GET        | `/api/v1/user/search/{keyword}`  | Tìm kiếm người dùng |
| GET        | `/api/v1/user/groups/{id}`       | Lấy danh sách nhóm người dùng tham gia |

### 🏢 Doanh nghiệp (`BusChatController`)
| Phương thức | Endpoint                          | Mô tả |
|------------|-----------------------------------|------|
| GET        | `/api/v1/bus/users/{id}`         | Lấy danh sách user trong doanh nghiệp |
| GET        | `/api/v1/bus/groups/{id}`        | Lấy danh sách nhóm trong doanh nghiệp |
