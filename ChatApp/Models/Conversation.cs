using System;
using System.Collections.Generic;

#nullable disable

namespace ChatApp.Models
{
    public partial class Conversation
    {
        public Conversation()
        {
            ConversationMembers = new HashSet<ConversationMember>();
            Messages = new HashSet<Message>();
        }

        public int ConversationId { get; set; }
        public string Name { get; set; }
        public bool? IsGroup { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string Imagename { get; set; }
        public string ImageUrl { get; set; }

        public virtual ICollection<ConversationMember> ConversationMembers { get; set; }
        public virtual ICollection<Message> Messages { get; set; }
    }
}
