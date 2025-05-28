using System;

namespace ChatApp.DTO
{
    public class UserGroupDto
    {
        public int UserId { get; set; }
        public int ConversationId { get; set; }
        public string GroupName { get; set; }
        public string ImageName { get; set; }
        public bool IsAdmin { get; set; }
        public string imageURL { get;set; }
        public bool IsGroup { get; set; }
        public int? SenderId { get; set; }
        public string? SenderName { get; set; }
        public string? LastMessage { get; set; }
        public DateTime? LastMessageTime { get; set; }

    }
}
