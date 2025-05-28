using System;

namespace ChatApp.DTO
{
    public class UpdateGroupDTO
    {
        public int conversationId { get; set; }
        public string groupName { get; set; }
        public string imageName { get; set; }
        public string imageURL { get; set; }
        public DateTime updateAt { get; set; }
    }
}
