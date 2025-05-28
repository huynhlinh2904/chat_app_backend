using System;
using ChatApp.DTO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

#nullable disable

namespace ChatApp.Models
{
    public partial class Chat_CopyContext : DbContext
    {
        public Chat_CopyContext()
        {
        }

        public virtual DbSet<MessageWithAttachmentDTO> MessageWithAttachmentDTO { get; set; }
        public virtual DbSet<GroupInfoDto> ConversationIdDTO { get; set; }
        public virtual DbSet<GetFileByConversationDTO> FileByConversationDTO { get; set; }
        public virtual DbSet<GetUserByConversationIdDTO> GetUserByConversationIdDTO { get; set; }
        public virtual DbSet<GetMessageWithAttachmentDTO> StartConversationDTO { get; set; }
        public virtual DbSet<UserGroupDto> UserGroupDto { get; set; }
        public virtual DbSet<GetListUser> GetListUsers { get; set; }
        public virtual DbSet<CreateConversationIdDTO> CreateConversationIdDTOs { get; set; }
        public Chat_CopyContext(DbContextOptions<Chat_CopyContext> options)
            : base(options)
        {
        }

        public virtual DbSet<AttachFile> AttachFiles { get; set; }
        public virtual DbSet<Conversation> Conversations { get; set; }
        public virtual DbSet<ConversationMember> ConversationMembers { get; set; }
        public virtual DbSet<Message> Messages { get; set; }
        public virtual DbSet<User> Users { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see http://go.microsoft.com/fwlink/?LinkId=723263.
                optionsBuilder.UseSqlServer("Data Source=DESKTOP-DFAHC83\\HUYNHLINH;Initial Catalog=Chat_Copy;Persist Security Info=True;User ID=sa;Password=123456;Encrypt=True;Trust Server Certificate=True");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasAnnotation("Relational:Collation", "SQL_Latin1_General_CP1_CI_AS");


            // ----------------------------------------------
            modelBuilder.Entity<MessageWithAttachmentDTO>()
                .HasNoKey()
                .ToView("MessageWithAttachmentDTO");
            modelBuilder.Entity<GroupInfoDto>()
                .HasNoKey()
                .ToView("GroupInfoDTO");
            modelBuilder.Entity<GetFileByConversationDTO>()
                .HasNoKey()
                .ToView("GetFileByConversationDTO");
            modelBuilder.Entity<GetUserByConversationIdDTO>()
                .HasNoKey()
                .ToView("GetUserByConversationIdDTO");
            modelBuilder.Entity<GetMessageWithAttachmentDTO>()
                .HasNoKey()
                .ToView("StartConversationDTO");
            modelBuilder.Entity<UserGroupDto>()
                .HasNoKey()
                .ToView("UserGroupDTO");
            modelBuilder.Entity<GetListUser>()
                .HasNoKey()
                .ToView("GetListUser");
            modelBuilder.Entity<CreateConversationIdDTO>()
                .HasNoKey()
                .ToView("CreateConversationIdDTO");
            //-------------------------------------------------

            modelBuilder.Entity<AttachFile>(entity =>
            {
                entity.ToTable("AttachFile");

                entity.Property(e => e.FileName)
                    .HasMaxLength(200)
                    .HasColumnName("fileName");

                entity.Property(e => e.FileType)
                    .HasMaxLength(50)
                    .IsUnicode(false)
                    .HasColumnName("fileType");

                entity.Property(e => e.FileUrl)
                    .HasMaxLength(255)
                    .HasColumnName("fileUrl");

                entity.Property(e => e.SendingTime)
                    .HasColumnType("datetime")
                    .HasColumnName("sendingTime");

                entity.HasOne(d => d.Message)
                    .WithMany(p => p.AttachFiles)
                    .HasForeignKey(d => d.MessageId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_AttachFile_Messages");
            });

            modelBuilder.Entity<Conversation>(entity =>
            {
                entity.Property(e => e.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.ImageUrl).HasColumnName("imageURL");

                entity.Property(e => e.Imagename).HasMaxLength(200);

                entity.Property(e => e.IsGroup).HasDefaultValueSql("((0))");

                entity.Property(e => e.Name).HasMaxLength(255);
            });

            modelBuilder.Entity<ConversationMember>(entity =>
            {
                entity.HasKey(e => new { e.ConversationId, e.UserId })
                    .HasName("PK__Conversa__112854B3B2DC3F2E");

                entity.Property(e => e.IsAdmin).HasDefaultValueSql("((0))");

                entity.HasOne(d => d.Conversation)
                    .WithMany(p => p.ConversationMembers)
                    .HasForeignKey(d => d.ConversationId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Conversat__Conve__5C6CB6D7");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.ConversationMembers)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK__Conversat__UserI__5D60DB10");
            });

            modelBuilder.Entity<Message>(entity =>
            {
                entity.Property(e => e.DeleteAt)
                    .HasColumnType("datetime")
                    .HasColumnName("deleteAt");

                entity.Property(e => e.MessageLogs)
                    .HasMaxLength(50)
                    .IsUnicode(false);

                entity.Property(e => e.SentAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.HasOne(d => d.Conversation)
                    .WithMany(p => p.Messages)
                    .HasForeignKey(d => d.ConversationId)
                    .HasConstraintName("FK__Messages__Conver__61316BF4");

                entity.HasOne(d => d.Receiver)
                    .WithMany(p => p.MessageReceivers)
                    .HasForeignKey(d => d.ReceiverId)
                    .HasConstraintName("FK_Messages_Users");

                entity.HasOne(d => d.ReplyMessage)
                    .WithMany(p => p.InverseReplyMessage)
                    .HasForeignKey(d => d.ReplyMessageId)
                    .HasConstraintName("FK_Messages_Messages");

                entity.HasOne(d => d.Sender)
                    .WithMany(p => p.MessageSenders)
                    .HasForeignKey(d => d.SenderId)
                    .HasConstraintName("FK__Messages__Sender__6225902D");
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(e => e.UserId).ValueGeneratedNever();

                entity.Property(e => e.Avatar).HasMaxLength(255);

                entity.Property(e => e.FullName).HasMaxLength(100);

                entity.Property(e => e.IsActive).HasDefaultValueSql("((1))");
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
