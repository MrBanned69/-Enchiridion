using System;
using System.Web;
using System.Web.Security;
using MySql.Data.MySqlClient;

namespace backend.Models
{
    public static class SessionAccess
    {
        public static int RequireUser(HttpRequestBase request, MySqlConnection connection, params string[] roles)
        {
            var header = request.Headers["Authorization"];
            FormsAuthenticationTicket ticket = null;
            try
            {
                if (header != null && header.StartsWith("Bearer ", StringComparison.Ordinal))
                    ticket = FormsAuthentication.Decrypt(header.Substring(7));
            }
            catch { }
            int userId;
            if (ticket == null || ticket.Expired || !int.TryParse(ticket.Name, out userId) || userId <= 0)
                throw new HttpException(401, "Debes iniciar sesión nuevamente.");

            using (var command = new MySqlCommand(@"SELECT r.nombre FROM USUARIO u
                INNER JOIN ROL r ON r.id_rol = u.id_rol
                WHERE u.id_usuario = @id AND u.estado = 'activo'", connection))
            {
                command.Parameters.AddWithValue("@id", userId);
                var role = Convert.ToString(command.ExecuteScalar()).Trim().ToLowerInvariant();
                if (string.IsNullOrEmpty(role)) throw new HttpException(401, "La sesión no es válida.");
                if (roles.Length > 0 && Array.IndexOf(roles, role) < 0) throw new HttpException(403, "Tu perfil no tiene acceso a este módulo.");
            }
            return userId;
        }
    }
}
