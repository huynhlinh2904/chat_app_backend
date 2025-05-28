using System;

namespace ChatApp.DTO
{
    public class GetListUser
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public string Avatar { get; set; }
        public bool IsActive { get; set; }
        public int? SenderId { get; set; }
        public string? SenderName { get; set; }
        public string? LastMessage { get; set; }
        public DateTime? LastMessageTime { get; set; }
    }
}
