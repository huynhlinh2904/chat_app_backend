using System;
using System.Collections.Generic;

#nullable disable

namespace ChatApp.Models
{
    public partial class User
    {
        public User()
        {
            ConversationMembers = new HashSet<ConversationMember>();
            MessageReceivers = new HashSet<Message>();
            MessageSenders = new HashSet<Message>();
        }

        public int UserId { get; set; }
        public string FullName { get; set; }
        public string Avatar { get; set; }
        public bool? IsActive { get; set; }

        public virtual ICollection<ConversationMember> ConversationMembers { get; set; }
        public virtual ICollection<Message> MessageReceivers { get; set; }
        public virtual ICollection<Message> MessageSenders { get; set; }
    }
}
