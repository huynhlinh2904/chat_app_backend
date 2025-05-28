using ChatApp.DTO;
using ChatApp.Hubs;
using ChatApp.Repository;
using Microsoft.AspNetCore.SignalR;
using System.IO;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using ChatApp.Models;

namespace ChatApp.Services
{
    public class ChatService : IChatService
    {
        private readonly IChatRepository _chatRepository;
        private readonly IWebHostEnvironment _environment;
        private readonly IHubContext<ChatHub> _chatHubContext;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ChatService(IChatRepository chatRepository, IWebHostEnvironment environment, IHubContext<ChatHub> hubContext, IHttpContextAccessor httpContextAccessor)
        {
            _chatRepository = chatRepository;
            _environment = environment;
            _chatHubContext = hubContext;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<UserGroupDto>> GetGroupsByUserIdAsync(int userId, int pageIndex, int pageSize)
        {
            return await _chatRepository.GetGroupsByUserIdAsync(userId, pageIndex, pageSize);
        }

        public async Task<List<GetMessageWithAttachmentDTO>> GetMessageWithAttachments(int conversationId, int pageIndex, int pageSize)
        {
            if (conversationId <= 0)
            {
                throw new ArgumentException("ConversationId phải là kiểu int.", nameof(conversationId));
            }

            var messages = await _chatRepository.GetMessagesWithAttachments(conversationId, pageIndex, pageSize);
            return messages;
        }

        public async Task<MessageWithAttachmentDTO> sp_SendMessageWithAttachment(SendMessageDTO dto)
        {
            string? fileUrl = null;
            string? generatedFileName = null;

            if (dto.File != null && dto.File.Length > 0)
            {
                var extension = Path.GetExtension(dto.File.FileName).ToLower();
                generatedFileName = $"{Guid.NewGuid()}{extension}";

                var uploadFolder = Path.Combine(_environment.WebRootPath, "Uploads");
                Directory.CreateDirectory(uploadFolder);

                var filePath = Path.Combine(uploadFolder, generatedFileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.File.CopyToAsync(stream);
                }

                var request = _httpContextAccessor.HttpContext.Request;
                var baseUrl = $"{request.Scheme}://{request.Host}";
                fileUrl = $"{baseUrl}/Uploads/{generatedFileName}";
            }

            var result = await _chatRepository.sp_SendMessageWithAttachment(
                senderId: dto.SenderId,
                receiverId: dto.ReceiverId,
                conversationId: dto.ConversationId,
                content: dto.Content,
                sentAt: dto.SentAt,
                fileName: generatedFileName,
                fileUrl: fileUrl,
                sendingTime: dto.SendingTime, // có thể null → SQL xử lý GETDATE()
                ReplyMessageId: dto.ReplyMessageId
            );

            // Notify via SignalR
            var groupId = result.ConversationId.ToString();
            await _chatHubContext.Clients.Group(groupId).SendAsync("ReceiveMessage", result);
            await _chatHubContext.Clients.Group(groupId).SendAsync("RefreshConversations", result.SenderId);
            await _chatHubContext.Clients.Group(groupId).SendAsync("RefreshConversationsGroup", result.SenderId);

            return result;
        }


        public async Task<StartConversationResponseDTO> StartConversationAsync(StartConversationDTO dto)
        {

            // Basic validation
            if (dto.CurrentUserId <= 0 || dto.TargetUserId <= 0)
            {
                throw new ArgumentException("User IDs must be greater than zero.");
            }

            if (dto.CurrentUserId == dto.TargetUserId)
            {
                throw new ArgumentException("Cannot start a conversation with yourself.");
            }

            // Call the repository to start the conversation
            var conversationId = await _chatRepository.StartConversationAsync(dto.CurrentUserId, dto.TargetUserId);

            // Map to response DTO
            return new StartConversationResponseDTO
            {
                ConversationId = conversationId
            };
        }

        public async Task<GroupInfoDto> JoinConversationGroupAsync(int userId, int conversationId)
        {
            return await _chatRepository.JoinConversationGroupAsync(userId, conversationId);
        }


        public async Task<int> CreateGroupConversationAsync(CreateGroupConversationRequest request)
        {
            string fileUrl = null;

            // 1. Upload ảnh (nếu có)
            if (request.ImageURL != null && request.ImageURL.Length > 0)
            {
                var extension = Path.GetExtension(request.ImageURL.FileName).ToLower();
                var fileName = $"{Guid.NewGuid()}{extension}";

                var uploadFolder = Path.Combine(_environment.WebRootPath, "Uploads");
                if (!Directory.Exists(uploadFolder))
                    Directory.CreateDirectory(uploadFolder);

                var filePath = Path.Combine(uploadFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await request.ImageURL.CopyToAsync(stream);
                }

                var httpRequest = _httpContextAccessor.HttpContext.Request;
                var baseUrl = $"{httpRequest.Scheme}://{httpRequest.Host}";
                fileUrl = $"{baseUrl}/Uploads/{fileName}";

                request.ImageName = fileName;
            }

            // 2. Validate
            if (string.IsNullOrWhiteSpace(request.GroupName))
                throw new ArgumentException("Group name cannot be empty.");
            if (request.MemberUserIds == null || request.MemberUserIds.Count == 0)
                throw new ArgumentException("You must select at least one member.");

            // 3. Gọi Repository
            var conversationId = await _chatRepository.CreateGroupConversationAsync(
                request.GroupName,
                request.CreatedByUserId,
                request.ImageName,
                fileUrl, // ✅ Đây là string đã xử lý
                request.MemberUserIds
            );


            // 4. Gửi thông báo SignalR
            await _chatHubContext.Clients.Group(conversationId.ToString()).SendAsync("GroupCreated", request.GroupName);

            return conversationId;
        }

        public async Task<bool> AddUserToGroupAsync(AddUserToGroupRequest request)
        {
            return await _chatRepository.AddUserToGroupAsync(request);
        }

        //public async Task<GetUserByConversationResponse> GetUserByConversationIdDTO(int conversationId);
        //{
        //    return await _chatRepository.GetUserByConversationIdDTO(conversationId);
        //}
        public Task<List<GetFileByConversationDTO>> getImageByConversationId(int conversationId)
        {
            return _chatRepository.getImageByConversationId(conversationId);
        }
        public Task<List<GetFileByConversationDTO>> getDocumentByConversationId(int conversationId)
        {
            return _chatRepository.getDocumentByConversationId(conversationId);
        }

        public Task<List<GetListUser>> getListUsers(int pageIndex, int pageSize)
        {
            return _chatRepository.getListUsers(pageIndex, pageSize);
        }

        public Task<bool> deleteMesesage(int messageId, int userId, int conversationId)
        {
           return _chatRepository.deleteMessage(messageId, userId, conversationId);
        }

        public Task<bool> deleteMemberInGroup(int adminUserId, int memberUserId, int conversationId)
        {
            return _chatRepository.deleteMemberInGroup(adminUserId, memberUserId, conversationId);
        }

        public async Task<GetUserByConversationResponse> GetUserByConversationIdDTO(int conversationId)
        {
            return await _chatRepository.GetUserByConversationIdDTO(conversationId);
        }

        public async Task<bool> transferAdmin(int conversationId, int newAdminUserId, int adminUserId)
        {
            return await _chatRepository.transferAdmin(conversationId, newAdminUserId, adminUserId);
        }

        public async Task<UpdateGroupDTO> UpdateGroup(int conversationId, string? groupName, string? imageName, string? imageUrl, int userId)
        {
            return await _chatRepository.UpdateGroup(conversationId, groupName, imageName, imageUrl, userId);
        }
    }
}
