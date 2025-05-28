
using ChatApp.DTO;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;
namespace ChatApp.Hubs
{
    public class ChatHub : Hub
    {
        public async Task SendMessage(MessageWithAttachmentDTO message)
        {
            try
            {
                // Broadcast the message to all clients in the conversation group
                await Clients.Group(message.ConversationId.ToString())
                    .SendAsync("ReceiveMessage", message);
            }
            catch (Exception ex)
            {
                // Log the error (you can use a logging framework like Serilog or ILogger)
                Console.WriteLine($"Error broadcasting message: {ex.Message}");
                throw;
            }
        }

        public async Task JoinConversation(string conversationId)
        {
            try
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, conversationId);
                await Clients.Caller.SendAsync("JoinedConversation", conversationId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error joining conversation: {ex.Message}");
                throw;
            }
        }

        public async Task LeaveConversation(string conversationId)
        {
            try
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, conversationId);
                await Clients.Caller.SendAsync("LeftConversation", conversationId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error leaving conversation: {ex.Message}");
                throw;
            }
        }
    
    }
}
