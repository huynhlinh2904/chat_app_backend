using ChatApp.DTO;
using ChatApp.Models;
using ChatApp.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace ChatApp.Controllers
{
    [ApiController]
    [Route("api/v1/")]
    public class UserController : ControllerBase
    {
        private readonly Chat_CopyContext _dbContext;
        private readonly IChatService _ChatService;
        private readonly HttpClient _httpClient;

        public UserController(Chat_CopyContext dbContext, IChatService chatService, IHttpClientFactory httpClientFactory)
        {
            _dbContext = dbContext;
            _ChatService = chatService;
            _httpClient = httpClientFactory.CreateClient();
        }

        [HttpPost("sync")]
        public async Task<IActionResult> SyncUsers([FromBody] List<UserDTO> users)
        {
            if (users == null || users.Count == 0)
                return BadRequest("User list is empty.");

            // Loại bỏ userId trùng nhau
            var distinctUsers = users
                .GroupBy(u => u.UserId)
                .Select(g => g.First())
                .ToList();

            var userIds = distinctUsers.Select(u => u.UserId).ToList();

            var existingUsers = await _dbContext.Users
                .Where(u => userIds.Contains(u.UserId))
                .AsNoTracking()
                .ToListAsync();

            var existingUserIds = existingUsers.Select(u => u.UserId).ToHashSet();
            var addList = new List<User>();

            foreach (var u in users)
            {
                var user = new User
                {
                    UserId = u.UserId,
                    FullName = u.FullName,
                    Avatar = u.Avatar,
                    IsActive = true
                };

                if (existingUserIds.Contains(u.UserId))
                {
                    _dbContext.Users.Attach(user);
                    _dbContext.Entry(user).State = EntityState.Modified;
                }
                else
                {
                    addList.Add(user);
                }
            }

            if (addList.Count > 0)
                _dbContext.Users.AddRange(addList);

            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Users synced successfully" });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(int pageIndex, int pageSize)
        {
          var result = await _ChatService.getListUsers(pageIndex, pageSize);
            if (result == null)
            {
                return NotFound("No users found.");
            }
            return Ok(result);
        }
        [ApiExplorerSettings(IgnoreApi = true)]
        [HttpPost("upload")]
        public async Task<IActionResult> UploadCCCD([FromForm] IFormFile frontImage, [FromForm] IFormFile backImage)
        {
            var apiUrl = "https://api.ehub.com.vn";
            var token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwidXNlcm5hbWUiOiJidmMtMDMxODc3Njg5MSIsImVtYWlsIjoibWVnYWNkZS52bkBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJDw5RORyBUWSBD4buUIFBI4bqmTiBHSeG6okkgUEjDgVAgQlZDIFZJ4buGVE5BTSIsImxhc3ROYW1lIjoiIiwiYWRtaW4iOmZhbHNlLCJhY3RpdmUiOnRydWUsInBhcnRuZXJUeXBlIjoicHJlX3BhaWRfYWdlbnQiLCJpYXQiOjE3NDY3NjAwMjMsImV4cCI6MTc0Njc2MDkyMywiaXNzIjoiNiJ9.knn54v5GEQ68qQ-_0Lw_BHeCiqpUGUOzcvzUAjg43tg";
            var apiKey = "jyfv3wJwDQAdf9pLO8bcnnLJ9neEyXbR";

            using var formData = new MultipartFormDataContent();

            if (frontImage != null)
            {
                var frontContent = new StreamContent(frontImage.OpenReadStream());
                frontContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(frontImage.ContentType);
                formData.Add(frontContent, "frontImage", frontImage.FileName);
            }

            if (backImage != null)
            {
                var backContent = new StreamContent(backImage.OpenReadStream());
                backContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(backImage.ContentType);
                formData.Add(backContent, "backImage", backImage.FileName);
            }

            var client = new HttpClient();
            var request = new HttpRequestMessage(HttpMethod.Post, apiUrl);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token); // tách chuỗi Bearer
            request.Headers.Add("x-api-key", apiKey);
            request.Content = formData;

            var response = await client.SendAsync(request);

            var content = await response.Content.ReadAsStringAsync();
            return Content(content, "application/json");
        }

    }
}

