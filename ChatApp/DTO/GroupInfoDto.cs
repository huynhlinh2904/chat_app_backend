namespace ChatApp.DTO
{
    public class GroupInfoDto
    {
        public int ConversationId { get; set; }
        public string GroupName { get; set; }
        public bool IsGroup { get; set; }
        public string ImageName { get; set; }
        public string ImageURL { get; set; }
        public int UserId { get; set; }
        public bool IsAdmin { get; set; }
    }
}
