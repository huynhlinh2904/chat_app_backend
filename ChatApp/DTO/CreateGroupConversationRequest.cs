using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace ChatApp.DTO
{
    public class CreateGroupConversationRequest
    {
        public string GroupName { get; set; }
        public int CreatedByUserId { get; set; }
        public string? ImageName { get; set;}
        public IFormFile? ImageURL { get; set; }
        public List<int> MemberUserIds { get; set; } = new List<int>();
    }
}
