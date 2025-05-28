using System;
using System.Collections.Generic;

#nullable disable

namespace ChatApp.Models
{
    public partial class Message
    {
        public Message()
        {
            AttachFiles = new HashSet<AttachFile>();
            InverseReplyMessage = new HashSet<Message>();
        }

        public int MessageId { get; set; }
        public int? ConversationId { get; set; }
        public int? SenderId { get; set; }
        public int? ReceiverId { get; set; }
        public string Content { get; set; }
        public DateTime? SentAt { get; set; }
        public int? ReplyMessageId { get; set; }
        public bool? Status { get; set; }
        public DateTime? DeleteAt { get; set; }
        public bool? IsRevoked { get; set; }
        public string MessageLogs { get; set; }

        public virtual Conversation Conversation { get; set; }
        public virtual User Receiver { get; set; }
        public virtual Message ReplyMessage { get; set; }
        public virtual User Sender { get; set; }
        public virtual ICollection<AttachFile> AttachFiles { get; set; }
        public virtual ICollection<Message> InverseReplyMessage { get; set; }
    }
}
