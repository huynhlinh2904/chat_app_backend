using System;

namespace ChatApp.DTO
{
    public class MessageWithAttachmentDTO
    {
        public int MessageId { get; set; }
        public int ConversationId { get; set; }
        public int SenderId { get; set; }
        public int? ReceiverId { get; set; }
        public string? Content { get; set; }
        public DateTime SentAt { get; set; }
        public int? ReplyMessageId { get; set; }
        public bool MessageStatus { get; set; }
        public DateTime? DeleteAt { get; set; }
        public bool IsRevoked { get; set; }
        public string? MessageLogs { get; set; }

        // File đính kèm
        public string? FileName { get; set; }
        public string? FileUrl { get; set; }
        public DateTime? SendingTime { get; set; }
        public bool? FileStatus { get; set; }
        public string? FileType { get; set; }

        // Người gửi
        public string? FullName_Sender { get; set; }

        // Trả lời tin nhắn
        public string? OriginalContent { get; set; }
        public string? OriginalSenderName { get; set; }


    }
}
