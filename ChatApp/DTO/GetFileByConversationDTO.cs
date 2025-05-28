using System;

namespace ChatApp.DTO
{
    public class GetFileByConversationDTO
    {
        public int AttachFileId { get; set; }
        public string? fileName { get; set; }
        public string? fileUrl { get; set; }
        public DateTime? sendingTime { get; set; }
        public int? MessageId { get; set; }
        public int? SenderId { get; set; }
        public int? ReceiverId { get; set; }
        public DateTime? SentAt { get; set; }
        public string? MonthGroup { get; set; }

    }
}
