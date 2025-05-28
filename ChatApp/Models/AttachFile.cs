using System;
using System.Collections.Generic;

#nullable disable

namespace ChatApp.Models
{
    public partial class AttachFile
    {
        public int AttachFileId { get; set; }
        public string FileName { get; set; }
        public string FileUrl { get; set; }
        public DateTime? SendingTime { get; set; }
        public int MessageId { get; set; }
        public bool? Status { get; set; }
        public string FileType { get; set; }

        public virtual Message Message { get; set; }
    }
}
