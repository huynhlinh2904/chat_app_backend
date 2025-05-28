using ChatApp.DTO;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;

namespace ChatApp.Repository
{
    public interface IChatRepository
    {
        Task<MessageWithAttachmentDTO> sp_SendMessageWithAttachment( int senderId, int? receiverId, int conversationId, string? content, DateTime? sentAt, string fileName, string fileUrl, DateTime? sendingTime, int? ReplyMessageId);
        Task<int> StartConversationAsync(int currentUserId, int targetUserId);
        Task<List<GetMessageWithAttachmentDTO>> GetMessagesWithAttachments(int conversationId, int pageIndex, int pageSize);
        Task<bool> AddUserToGroupAsync(AddUserToGroupRequest request);
        Task<List<UserGroupDto>> GetGroupsByUserIdAsync(int userId, int pageIndex, int pageSize);
        Task<GroupInfoDto> JoinConversationGroupAsync(int userId, int conversationId);
        Task<int> CreateGroupConversationAsync(string GroupName, int CreatedByUserId, string ImageName, string ImageURL, List<int> MemberUserIds);
        Task<GetUserByConversationResponse> GetUserByConversationIdDTO(int conversationId);
        Task<List<GetFileByConversationDTO>> getImageByConversationId(int conversationId);
        Task<List<GetFileByConversationDTO>> getDocumentByConversationId(int conversationId);
        Task<List<GetListUser>> getListUsers(int pageIndex, int pageSize);
        Task <bool> deleteMessage(int messageId, int userId, int conversationId);
        Task<bool> deleteMemberInGroup(int adminUserId, int memberUserId, int conversationId);
        Task<bool> transferAdmin (int conversationId, int newAdminUserId, int adminUserId);
        Task<UpdateGroupDTO> UpdateGroup(int conversationId, string groupName, string imageName, string imageUrl, int userId);

    }
}
