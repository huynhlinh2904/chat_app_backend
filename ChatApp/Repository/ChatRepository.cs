using ChatApp.DTO;
using ChatApp.Models;
using Microsoft.Data.SqlClient;
using System.Threading.Tasks;
using System;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Data;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.SignalR;
using ChatApp.Hubs;

namespace ChatApp.Repository
{
    public class ChatRepository : IChatRepository
    {
        private readonly Chat_CopyContext _context;
        private readonly IHubContext<ChatHub> _chatHub;


        public ChatRepository(Chat_CopyContext context, IConfiguration configuration, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _chatHub = hubContext;
        }

        public async Task<MessageWithAttachmentDTO> sp_SendMessageWithAttachment(int senderId, int? receiverId, int conversationId, string? content, DateTime? sentAt, string? fileName, string? fileUrl, DateTime? sendingTime, int? replyMessageId)
        {
            var query = "EXEC sp_SendMessageWithAttachment @SenderId, @ReceiverId, @ConversationId, @Content, @SentAt, @FileName, @FileUrl, @SendingTime, @ReplyMessageId";

            var parameters = new[]
            {
                new SqlParameter("@SenderId", senderId),
                new SqlParameter("@ReceiverId", receiverId ?? (object)DBNull.Value),
                new SqlParameter("@ConversationId", conversationId),
                new SqlParameter("@Content", string.IsNullOrWhiteSpace(content) ? (object)DBNull.Value : content),
                new SqlParameter("@SentAt", sentAt ?? (object)DBNull.Value),
                new SqlParameter("@FileName", string.IsNullOrWhiteSpace(fileName) ? (object)DBNull.Value : fileName),
                new SqlParameter("@FileUrl", string.IsNullOrWhiteSpace(fileUrl) ? (object)DBNull.Value : fileUrl),
                new SqlParameter("@SendingTime", sendingTime ?? (object)DBNull.Value),
                new SqlParameter("@ReplyMessageId", replyMessageId ?? (object)DBNull.Value),
            };


            var result = await _context.Set<MessageWithAttachmentDTO>()
                .FromSqlRaw(query, parameters)
                .AsNoTracking()
                .ToListAsync();

            var message = result.FirstOrDefault() ?? throw new Exception("Failed to send message.");

            return message;
        }
        public async Task<int> StartConversationAsync(int currentUserId, int targetUserId)
        {
            var query = "EXEC sp_StartConversation @CurrentUserId, @TargetUserId, @ConversationId OUTPUT";
            var parameters = new[]
            {
                new SqlParameter("@CurrentUserId", currentUserId),
                new SqlParameter("@TargetUserId", targetUserId),
                new SqlParameter("@ConversationId", SqlDbType.Int)
                {
                    Direction = ParameterDirection.Output
                }
            };

            await _context.Database.ExecuteSqlRawAsync(query, parameters);


            // Execute the stored procedure and get the output parameter
            var conversationId = (int)parameters[2].Value;
            if (conversationId == 0)
            {
                throw new Exception("Failed to start conversation: No conversation ID returned.");
            }

            return conversationId;
        }

        public async Task<List<GetMessageWithAttachmentDTO>> GetMessagesWithAttachments(int conversationId, int pageIndex, int pageSize)
        {
            var messages = new List<GetMessageWithAttachmentDTO>();

            // Lấy chuỗi kết nối từ DbContext
            var connectionString = _context.Database.GetConnectionString();

            using (var connection = new SqlConnection(connectionString))
            using (var command = new SqlCommand("sp_GetMessagesWithAttachments", connection))
            {
                command.CommandType = CommandType.StoredProcedure;

                // Thêm tham số
                command.Parameters.AddWithValue("@ConversationId", conversationId);
                command.Parameters.AddWithValue("@PageIndex", pageIndex);
                command.Parameters.AddWithValue("@PageSize", pageSize);

                await connection.OpenAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        var message = new GetMessageWithAttachmentDTO
                        {
                            MessageId = reader.GetInt32(reader.GetOrdinal("MessageId")),
                            SenderId = reader.GetInt32(reader.GetOrdinal("SenderId")),
                            ReceiverId = reader.IsDBNull(reader.GetOrdinal("ReceiverId")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("ReceiverId")),
                            fullName_Sender = reader["FullName_Sender"]?.ToString(),
                            fullName_Receiver = reader["FullName_Receiver"]?.ToString(),
                            Content = reader["Content"]?.ToString(),
                            SentAt = reader.GetDateTime(reader.GetOrdinal("SentAt")),
                            FileName = reader["FileName"]?.ToString(),
                            FileUrl = reader["FileUrl"]?.ToString(),
                            SendingTime = reader.IsDBNull(reader.GetOrdinal("SendingTime")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("SendingTime")),
                            ReplyMessageId = reader.IsDBNull(reader.GetOrdinal("ReplyMessageId")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("ReplyMessageId")),
                            OriginalContent = reader["OriginalContent"]?.ToString(),
                            OriginalSenderName = reader["OriginalSenderName"]?.ToString(),
                            MessageStatus = reader.GetBoolean(reader.GetOrdinal("MessageStatus")),
                            AttachFileStatus = reader.GetBoolean(reader.GetOrdinal("AttachFileStatus"))
                        };

                        messages.Add(message);
                    }
                }
            }

            return messages;
        }

        public async Task<List<UserGroupDto>> GetGroupsByUserIdAsync(int userId, int pageIndex, int pageSize)
        {
           

            var parameters = new[]
           {
            new SqlParameter("@UserId", userId),
            new SqlParameter("@PageIndex", pageIndex),
            new SqlParameter("@PageSize", pageSize)
            };

            var result = await _context.Set<UserGroupDto>()
                .FromSqlRaw("EXEC sp_GetGroupsByUserId @UserId, @PageIndex, @PageSize", parameters)
                .ToListAsync();

            return result;
        }
        public async Task<GroupInfoDto> JoinConversationGroupAsync(int userId, int conversationId)
        {
            var userIdParam = new SqlParameter("@CurrentUserId", userId);
            var convIdParam = new SqlParameter("@ConversationId", conversationId);

            var result = await _context.Set<GroupInfoDto>()
                .FromSqlRaw("EXEC [dbo].[sp_JoinConversationGroup] @CurrentUserId, @ConversationId", userIdParam, convIdParam)
                .ToListAsync();

            return result.FirstOrDefault();
        }

        public async Task<int> CreateGroupConversationAsync(string GroupName, int CreatedByUserId, string ImageName, string ImageURL, List<int> MemberUserIds)
        {
            var query = "EXEC sp_CreateGroupConversation @GroupName, @CreatedByUserId, @ImageName, @ImageURL, @MemberUserIds";

            var parameters = new[]
            {
        new SqlParameter("@GroupName", GroupName),
        new SqlParameter("@CreatedByUserId", CreatedByUserId),
        new SqlParameter("@ImageName", string.IsNullOrEmpty(ImageName) ? DBNull.Value : ImageName),
        new SqlParameter("@ImageURL", string.IsNullOrEmpty(ImageURL) ? DBNull.Value : ImageURL),
        new SqlParameter("@MemberUserIds", string.Join(",", MemberUserIds))
    };

            var result = await _context.Set<CreateConversationIdDTO>()
                .FromSqlRaw(query, parameters)
                .AsNoTracking()
                .ToListAsync();

            return result.FirstOrDefault()?.conversationId ?? 0;
        }

        public async Task<bool> AddUserToGroupAsync(AddUserToGroupRequest request)
        {
            var parameters = new[]
            {
            new SqlParameter("@AdminUserId", request.AdminUserId),
            new SqlParameter("@ConversationId", request.ConversationId),
            new SqlParameter("@MemberIDs", string.Join(",", request.MemberIDs))
            };

            try
            {
                await _context.Database.ExecuteSqlRawAsync("EXEC sp_AddUserToGroup @AdminUserId, @ConversationId, @MemberIDs", parameters);
                return true;
            }
            catch (SqlException ex)
            {
                // Nếu THROW từ SQL thì mã lỗi bạn tạo là 50002
                if (ex.Number == 50002)
                    throw new InvalidOperationException(ex.Message);

                throw;
            }
        }

        public async Task<GetUserByConversationResponse> GetUserByConversationIdDTO(int conversationId)
        {
            var result = new GetUserByConversationResponse();

            var connectionString = _context.Database.GetConnectionString();
            using (var connection = new SqlConnection(connectionString))
            using (var cmd = new SqlCommand("sp_GetListUserByConversationId", connection))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@ConversationId", conversationId);

                await connection.OpenAsync();
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    // Đọc danh sách thành viên
                    while (await reader.ReadAsync())
                    {
                        result.Members.Add(new GetUserByConversationIdDTO
                        {
                            UserId = reader.GetInt32(0),
                            FullName = reader.GetString(1),
                            Avatar = reader.IsDBNull(2) ? null : reader.GetString(2),
                            IsAdmin = reader.GetBoolean(3)
                        });
                    }

                    // Đọc result set thứ 2: tổng số thành viên
                    if (await reader.NextResultAsync() && await reader.ReadAsync())
                    {
                        result.TotalMembers = reader.GetInt32(0);
                    }
                }
            }

            return result;
        }


        public Task<List<GetFileByConversationDTO>> getImageByConversationId(int conversationId)
        {
            var query = "EXEC sp_GetImagesByConversation @ConversationId";
            var parameters = new[]
            {
                new SqlParameter("@ConversationId", conversationId)
            };
            var result = _context.Set<GetFileByConversationDTO>()
                .FromSqlRaw(query, parameters)
                .AsNoTracking()
                .ToListAsync();
            return result;
        }
        public Task<List<GetFileByConversationDTO>> getDocumentByConversationId(int conversationId)
        {
            var query = "EXEC sp_GetDocumentsByConversation @ConversationId";
            var parameters = new[]
            {
                new SqlParameter("@ConversationId", conversationId)
            };
            var result = _context.Set<GetFileByConversationDTO>()
                .FromSqlRaw(query, parameters)
                .AsNoTracking()
                .ToListAsync();
            return result;
        }

        public Task<List<GetListUser>> getListUsers(int pageIndex, int pageSize)
        {
            var query = "EXEC sp_GetAllEmployees @PageIndex, @PageSize";
            var parameters = new[]
            {
                new SqlParameter("@PageIndex", pageIndex),
                new SqlParameter("@PageSize", pageSize)
            };
            var result = _context.Set<GetListUser>()
                .FromSqlRaw(query, parameters)
                .AsNoTracking()
                .ToListAsync();
            return result;
        }

        public async Task<bool> deleteMessage(int messageId, int userId, int conversationId)
        {
            var connectionString = _context.Database.GetConnectionString();

            using (var connection = new SqlConnection(connectionString))
            using (var command = new SqlCommand("sp_DeleteMessage", connection))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@MessageId", messageId);
                command.Parameters.AddWithValue("@UserId", userId);
                command.Parameters.AddWithValue("@ConversationId", conversationId);

                try
                {
                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();

                    // Gửi thông báo realtime sau khi xóa thành công
                    await _chatHub.Clients.Group($"conversation_{conversationId}")
                        .SendAsync("ReceiveDeletedMessage", messageId);

                    return true; // xử lý thành công
                }
                catch (SqlException ex)
                {
                    // Nếu lỗi do RAISERROR từ proc
                    if (ex.Number == 50000)
                    {
                        Console.WriteLine($"[DeleteMessage Error] {ex.Message}");
                        return false;
                    }

                    throw;
                }
            }
        }

        public async Task<bool> deleteMemberInGroup(int adminUserId, int memberUserId, int conversationId)
        {
            var connectionString = _context.Database.GetConnectionString();
            using (var connection = new SqlConnection(connectionString))
            using (var command = new SqlCommand(
            "sp_RemoveUserFromConversation", connection))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@AdminUserId", adminUserId);
                command.Parameters.AddWithValue("@MemberUserId", memberUserId);
                command.Parameters.AddWithValue("@ConversationId", conversationId);
                try
                {
                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();
                    return true;
                }
                catch (SqlException ex)
                {
                    // Nếu lỗi do RAISERROR từ proc
                    if (ex.Number == 50000)
                    {
                        Console.WriteLine($"[DeleteMemberInGroup Error] {ex.Message}");
                        return false;
                    }
                    throw;
                }
            }
        }

        public Task<bool> transferAdmin(int conversationId, int newAdminUserId, int adminUserId)
        {
            var connectionString = _context.Database.GetConnectionString();
            using (var connection = new SqlConnection(connectionString))
            using (var command = new SqlCommand(
            "sp_TransferAdmin", connection))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@ConversationId", conversationId);
                command.Parameters.AddWithValue("@NewAdminUserId", newAdminUserId);
                command.Parameters.AddWithValue("@AdminUserId", adminUserId);
                try
                {
                    connection.Open();
                    command.ExecuteNonQuery();
                    return Task.FromResult(true);
                }
                catch (SqlException ex)
                {
                    // Nếu lỗi do RAISERROR từ proc
                    if (ex.Number == 50000)
                    {
                        Console.WriteLine($"[TransferAdmin Error] {ex.Message}");
                        return Task.FromResult(false);
                    }
                    throw;
                }
            }
        }
        public async Task<UpdateGroupDTO> UpdateGroup(int conversationId, string? groupName, string? imageName, string? imageUrl, int userId)
        {
            var connectionString = _context.Database.GetConnectionString();
            using (var connection = new SqlConnection(connectionString))
            using (var command = new SqlCommand(
            "sp_UpdateGroupConversationInfo", connection))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@ConversationId", conversationId);
                command.Parameters.AddWithValue("@GroupName", groupName ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@ImageName", imageName ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@ImageURL", imageUrl ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@UserId", userId);

                await connection.OpenAsync();

                await command.ExecuteNonQueryAsync();
                return new UpdateGroupDTO
                {
                    conversationId = conversationId,
                    groupName = groupName,
                    imageName = imageName,
                    imageURL = imageUrl,
                    updateAt = DateTime.Now
                };
            }
        }
    }
}
