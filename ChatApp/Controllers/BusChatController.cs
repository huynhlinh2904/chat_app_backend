using ChatApp.APIResponse;
using ChatApp.Business;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;
using System;
using System.Data;
using static ChatApp.APIResponse.ApiResponse;

namespace ChatApp.Controllers
{
    [ApiController]
    [Route("api/v1/chat/")]
    public class BusChatController : ControllerBase
    {
        private readonly BusChat _busChat;

        public BusChatController(BusChat busChat)
        {
            _busChat = busChat;
        }

        [HttpPost("delete-message-v1")]
        public IActionResult DeleteMessage([FromBody] JObject inputData)
        {
            try
            {
                int messageId = (int)inputData["MESSAGE_ID"];
                int userId = (int)inputData["USER_ID"];
                int conversationId = (int)inputData["CONVERSATION_ID"];

                var reader = _busChat.DeleteMessage(messageId, userId, conversationId);
                if (reader == null)
                    return BadRequest(new ApiResponse(eType.ERROR, "Không thể load công việc (DB trả về null)"));

                DataTable dt = new DataTable();
                dt.Load(reader);

                return Ok(new ApiResponse(eType.SUCCESS, dt));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse(eType.ERROR, "Lỗi xử lý: " + ex.Message));
            }
        }
    }
}