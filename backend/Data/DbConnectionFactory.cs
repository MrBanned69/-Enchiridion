using System.Configuration;
using MySql.Data.MySqlClient;

namespace backend.Data
{
    public static class DbConnectionFactory
    {
        private static readonly string ConnectionString = 
            ConfigurationManager.ConnectionStrings["ConexionMySQL"].ConnectionString;

        public static MySqlConnection CreateConnection()
        {
            var conn = new MySqlConnection(ConnectionString);
            conn.Open();
            return conn;
        }
    }
}
