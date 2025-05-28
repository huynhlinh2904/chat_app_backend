

namespace ChatApp.APIResponse
{
    public class ApiResponse
    {
        public static class eType
        {
            public const string
                SUCCESS = "SUCCESS",
                ERROR = "ERROR";
        }
        public ApiResponse(string type, object message)
        {
            TYPE = type;
            MESSAGE = message;
        }
        public string TYPE { set; get; } = "SUCCESS";
        public object MESSAGE { set; get; }
    }
}
