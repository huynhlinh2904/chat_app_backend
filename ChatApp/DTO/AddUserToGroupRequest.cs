using System.Collections.Generic;

namespace ChatApp.DTO
{
    public class AddUserToGroupRequest
    {
        public int AdminUserId { get; set; }
        public int ConversationId { get; set; }
        public List<int> MemberIDs { get; set; } = new List<int>();

    }
}
