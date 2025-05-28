using System;
using System.Collections.Generic;

#nullable disable

namespace ChatApp.Models
{
    public partial class ConversationMember
    {
        public int ConversationId { get; set; }
        public int UserId { get; set; }
        public bool? IsAdmin { get; set; }

        public virtual Conversation Conversation { get; set; }
        public virtual User User { get; set; }
    }
}
