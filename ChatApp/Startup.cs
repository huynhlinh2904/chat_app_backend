
using ChatApp.APIResponse;
using ChatApp.AppSetting;
using ChatApp.Business;
using ChatApp.Hubs;
using ChatApp.Models;
using ChatApp.Repository;
using ChatApp.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json.Serialization;
using System.Text;


namespace ChatApp
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            Common.connectionString_ChatApp = Configuration.GetConnectionString("ChatAppContext");

            // ĐĂNG KÝ DbContext để tránh lỗi
            services.AddDbContext<Chat_CopyContext>(options =>
                options.UseSqlServer(Configuration.GetConnectionString("ChatAppContext")));


            services.AddControllers().AddNewtonsoftJson(options =>
            {
                options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
                options.SerializerSettings.ContractResolver = new DefaultContractResolver();
            });
            //services.AddScoped<BusChat>(); 

            services.AddScoped<IChatRepository, ChatRepository>();
            services.AddScoped<IChatService, ChatService>();
            services.AddScoped<BusChat>();

            // Thêm CORS service với chính sách cho phép tất cả
            services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", builder =>
                {
                    builder.SetIsOriginAllowed(_ => true) //  frontend có thể kết nối, kể cả khi không biết trước domain.
                          //.AllowAnyOrigin()   // Cho phép tất cả các origin
                           .AllowAnyMethod()    // Cho phép tất cả các HTTP methods (GET, POST, PUT, etc.)
                           .AllowAnyHeader()   // Cho phép tất cả các headers
                           .AllowCredentials(); 
                });
            });
            services.AddHttpContextAccessor();

            var SecretKey = Configuration["ApiSettings:SecretKey"];
            var SecretKeyBytes = Encoding.ASCII.GetBytes("EVNITHCM90123456");

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(SecretKeyBytes),
                    
                    ClockSkew = System.TimeSpan.Zero
                };
            });
            services.AddAuthorization();
           
            services.AddHttpClient();

            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "ChatApp", Version = "v1" });
            });
            services.AddSignalR(); // Thêm SignalR
            // Đăng ký ApiSettings từ appsettings.json
            services.Configure<APISetting>(Configuration.GetSection("ApiSettings"));
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseSwagger();
                app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "ChatApp v1"));
            }
            
            app.UseHttpsRedirection();
            // Thêm middleware CORS trước UseRouting
            app.UseCors("AllowAll");
            
            app.UseRouting();

            app.UseAuthentication();
            app.UseAuthorization();
            app.UseStaticFiles();

            app.UseEndpoints(endpoints =>
            {
                // Tạo endpoint để frontend lấy BaseUrl
                endpoints.MapGet("/api/config", async context =>
                { 
                    var settings = context.RequestServices.GetRequiredService<IOptions<APISetting>>();
                    await context.Response.WriteAsJsonAsync(new { ApiBaseUrl = settings.Value.BaseURL });
                });
                endpoints.MapControllers();
                endpoints.MapHub<ChatHub>("/chatHub"); // Định nghĩa endpoint cho Hub
            });
        }
    }
}
