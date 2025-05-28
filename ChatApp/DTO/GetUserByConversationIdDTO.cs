using System.Collections.Generic;

namespace ChatApp.DTO
{
    public class GetUserByConversationIdDTO
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public string? Avatar { get; set; }
        public bool IsAdmin { get; set; }
    }

    public class GetUserByConversationResponse
    {
        public List<GetUserByConversationIdDTO> Members { get; set; } = new();
        public int TotalMembers { get; set; }
    }
}
