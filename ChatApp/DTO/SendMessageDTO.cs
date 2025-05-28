using Microsoft.AspNetCore.Http;
using System;

namespace ChatApp.DTO
{
    public class SendMessageDTO
    {
        public int SenderId { get; set; }
        public int? ReceiverId { get; set; }
        public int ConversationId { get; set; }
        public string? Content { get; set; }
        public DateTime? SentAt { get; set; }
        public IFormFile? File { get; set; }
        public DateTime? SendingTime { get; set; }
        public int? ReplyMessageId { get; set; }
    }
}
