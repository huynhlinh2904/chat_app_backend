using System.Collections.Generic;
using System;

namespace ChatApp.DTO
{
    public class GetMessageWithAttachmentDTO
    {
        public int MessageId { get; set; }
        public int SenderId { get; set; }
        public int? ReceiverId { get; set; }
        public string fullName_Sender { get; set; } // Match the exact column alias
        public string? fullName_Receiver { get; set; } // Match the exact column alias
        public string? Content { get; set; }
        public DateTime SentAt { get; set; }
        public string? FileName { get; set; }
        public string? FileUrl { get; set; }
        public DateTime? SendingTime { get; set; }
        public int? ReplyMessageId { get; set; }
        public string? OriginalContent { get; set; }
        public string? OriginalSenderName { get; set; }
        public bool MessageStatus { get; set; }
        public bool AttachFileStatus { get; set; }
    }


    
}
