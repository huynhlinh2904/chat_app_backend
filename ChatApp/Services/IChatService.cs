using ChatApp.DTO;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ChatApp.Services
{
    public interface IChatService
    {
       Task<MessageWithAttachmentDTO> sp_SendMessageWithAttachment(SendMessageDTO dto);
       Task<StartConversationResponseDTO> StartConversationAsync(StartConversationDTO dto);
       Task<List<GetMessageWithAttachmentDTO>> GetMessageWithAttachments(int conversationId, int pageIndex, int pageSize);
       Task<List<UserGroupDto>> GetGroupsByUserIdAsync(int userId, int pageIndex, int pageSize);
       Task<GroupInfoDto> JoinConversationGroupAsync(int userId, int conversationId);
       Task<bool> AddUserToGroupAsync(AddUserToGroupRequest request);
       Task<int> CreateGroupConversationAsync(CreateGroupConversationRequest request);
       Task<GetUserByConversationResponse> GetUserByConversationIdDTO(int conversationId);
        Task<List<GetFileByConversationDTO>> getImageByConversationId(int conversationId);
       Task<List<GetFileByConversationDTO>> getDocumentByConversationId(int conversationId);
       Task<List<GetListUser>> getListUsers(int pageIndex, int pageSize);
       Task<bool> deleteMesesage(int messageId, int userId, int conversationId);
       Task<bool> deleteMemberInGroup(int adminUserId, int memberUserId, int conversationId);
       Task<bool> transferAdmin(int conversationId, int newAdminUserId, int adminUserId);
       Task<UpdateGroupDTO> UpdateGroup(int conversationId, string? groupName, string? imageName, string? imageUrl, int userId);
    }

}
