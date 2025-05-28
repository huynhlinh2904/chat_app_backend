using Microsoft.Extensions.Configuration;
using Microsoft.Practices.EnterpriseLibrary.Data;
using Microsoft.Practices.EnterpriseLibrary.Data.Sql;
using System;
using System.Data;

namespace ChatApp.Business
{
    public class BusChat
    {
        private readonly Database db;

        public BusChat(IConfiguration config)
        {
            var connectionString = config.GetConnectionString("ChatAppContext");

            if (!string.IsNullOrEmpty(connectionString))
                db = new SqlDatabase(connectionString);
            else
                throw new Exception("Connection string 'ChatAppContext' is missing or empty.");
        }

        public IDataReader DeleteMessage(int MESSAGE_ID, int USER_ID, int CONVERSATION_ID)
        {
            try
            {
                return db.ExecuteReader("sp_DeleteMessage", MESSAGE_ID, USER_ID, CONVERSATION_ID);
            }
            catch (Exception ex)
            {
                Console.WriteLine("[BUS ERROR] DeleteMessage: " + ex);
                return null;
            }
        }
    }
}