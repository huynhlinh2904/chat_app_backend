namespace ChatApp.DTO
{
    public class GroupCreationResponse
    {
        public int ConversationId { get; set; }
        public int UserId { get; set; }
        public string GroupName { get; set; }
        public bool IsAdmin { get; set; }
    }
}
