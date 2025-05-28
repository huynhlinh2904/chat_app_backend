using ChatApp.DTO;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System;
using ChatApp.Services;

namespace ChatApp.Controllers
{
    [ApiController]
    [Route("api/v1/chat/")]
    public class ChatController : Controller
    {
        private readonly IChatService _chatService;

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpGet("groups/{userId}/{pageIndex}/{pageSize}")]
        public async Task<IActionResult> GetGroupsByUserId(int userId, int pageIndex, int pageSize)
        {
            var result = await _chatService.GetGroupsByUserIdAsync(userId, pageIndex, pageSize);
            return Ok(result);
        }
        [HttpPost("add-user-to-group")]
        public async Task<IActionResult> AddUserToGroup([FromBody] AddUserToGroupRequest request)
        {
            try
            {
                var success = await _chatService.AddUserToGroupAsync(request);
                if (success)
                {
                    return Ok(new { message = "Thêm thành viên vào nhóm thành công." });
                }
                return BadRequest("Không thể thêm thành viên vào nhóm.");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpPost("send-message")]
        public async Task<IActionResult> SendMessage([FromForm] SendMessageDTO dto)
        {
            try
            {
                var result = await _chatService.sp_SendMessageWithAttachment(dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        [HttpGet("get-messages/{conversationId}/{pageIndex}/{pageSize}")]
        public async Task<IActionResult> GetMessagesWithAttachments(int conversationId, int pageIndex, int pageSize)
        {
            try
            {
                var messages = await _chatService.GetMessageWithAttachments(conversationId, pageIndex, pageSize);
                return Ok(messages);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPost("start-conversation")]
        public async Task<IActionResult> StartConversation([FromBody] StartConversationDTO dto)
        {
            try
            {
                var response = await _chatService.StartConversationAsync(dto);
                return Ok(response);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An unexpected error occurred: " + ex.Message });
            }
        }
        [HttpPost("join-group")]
        public async Task<IActionResult> JoinGroup([FromBody] JoinGroupRequest request)
        {
            var result = await _chatService.JoinConversationGroupAsync(request.UserId, request.ConversationId);
            if (result == null)
            {
                return NotFound("Không thể tham gia nhóm hoặc nhóm không tồn tại.");
            }

            return Ok(result);
        }
        [HttpPost("create-group-conversation")]
        public async Task<IActionResult> CreateGroupConversation([FromForm] CreateGroupConversationRequest request)
        {
            try
            {
                var conversationId = await _chatService.CreateGroupConversationAsync(request);
                return Ok(new { ConversationId = conversationId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
        [HttpGet("get-users-by-conversation/{conversationId}")]
        public async Task<IActionResult> GetUsersByConversationId(int conversationId)
        {
            try
            {
                var users = await _chatService.GetUserByConversationIdDTO(conversationId);
                return Ok(users);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
        [HttpGet("get-images-by-conversation/{conversationId}")]
        public async Task<IActionResult> GetImagesByConversationId(int conversationId)
        {
            try
            {
                var images = await _chatService.getImageByConversationId(conversationId);
                return Ok(images);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
        [HttpGet("get-documents-by-conversation/{conversationId}")]
        public async Task<IActionResult> GetDocumentsByConversationId(int conversationId)
        {
            try
            {
                var documents = await _chatService.getDocumentByConversationId(conversationId);
                return Ok(documents);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
        [HttpPost("delete-message")]
        public async Task<IActionResult> DeleteMessage(int messageId, int userId, int conversationId)
        {
            try
            {
                var delete = await _chatService.deleteMesesage(messageId, userId, conversationId);

                if (delete)
                    return Ok(new { success = true, message = "Đã xoá tin nhắn" });
                else
                    return BadRequest(new { success = false, message = "Không có quyền xoá hoặc tin nhắn không tồn tại" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("deleteMemberInGroup")]
        public async Task<IActionResult> DeleteMemberInGroup(int adminUserId, int memberUserId, int conversationId)
        {
            try
            {
                var deleteUser = await _chatService.deleteMemberInGroup(adminUserId, memberUserId, conversationId);

                if (deleteUser)
                    return Ok(new { success = true, message = "Đã xoá khỏi nhóm chat" });
                else
                    return BadRequest(new { success = false, message = "Không có quyền xoá" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpPost("transferAdmin")]
        public async Task<IActionResult> TransferAdmin(int conversationId, int newAdminUserId, int adminUserId)
        {
            try
            {
                var transfer = await _chatService.transferAdmin(conversationId, newAdminUserId, adminUserId);
                if (transfer)
                    return Ok(new { success = true, message = "Đã chuyển quyền quản trị" });
                else
                    return BadRequest(new { success = false, message = "Không có quyền chuyển quyền quản trị" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpPost("updateGroup")]
        public async Task<IActionResult> UpdateGroup(int conversationId, string? groupName, string? imageName, string? imageUrl, int userId)
        {
            try
            {
                var updateGroup = await _chatService.UpdateGroup(conversationId, groupName, imageName, imageUrl, userId);
                if (updateGroup != null)
                    return Ok(new { success = true, message = "Cập nhật nhóm thành công" });
                else
                    return BadRequest(new { success = false, message = "Không có quyền cập nhật nhóm" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
