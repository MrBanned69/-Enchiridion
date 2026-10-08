using System;
using System.Configuration;
using System.Diagnostics;
using System.Globalization;
using System.Web.Security;
using System.Web.Mvc;
using MySql.Data.MySqlClient;

namespace backend.Controllers
{
    public class LoginController : Controller
    {
        private const int DuracionSesionHoras = 8;

        [HttpPost]
        public JsonResult Ingresar(string email, string password)
        {
            // Permitir conexión con el frontend (CORS)
            Response.AppendHeader("Access-Control-Allow-Origin", "*");

            Response.Cache.SetCacheability(System.Web.HttpCacheability.NoCache);
            Response.Cache.SetNoStore();

            if (string.IsNullOrWhiteSpace(email) || email.Trim().Length > 100 ||
                string.IsNullOrEmpty(password))
            {
                return Error(400, "Ingresa el correo y la contraseña.");
            }

            try
            {
                using (var conexion = CrearConexion())
                using (var comando = new MySqlCommand(
                    @"SELECT u.id_usuario, u.id_rol, u.nombre, u.correo,
                             u.password_hash, r.nombre AS rol
                      FROM USUARIO u
                      INNER JOIN ROL r ON r.id_rol = u.id_rol
                      WHERE u.correo = @correo AND u.estado = 'activo'
                      LIMIT 1", conexion))
                {
                    comando.Parameters.AddWithValue("@correo", email.Trim());
                    conexion.Open();

                    using (var lector = comando.ExecuteReader())
                    {
                        if (!lector.Read())
                        {
                            return Error(401, "USUARIO NO ENCONTRADO");
                        }

                        var hash = lector["password_hash"].ToString().Trim();

                        var passwordOk = BCrypt.Net.BCrypt.Verify(password, hash);

                        if (!passwordOk)
                        {
                            return Error(401, "BCrypt FALLÓ");
                        }

                        var usuario = LeerUsuario(lector);
                        var ahora = DateTime.Now;
                        var ticket = new FormsAuthenticationTicket(
                            1, usuario.id_usuario, ahora,
                            ahora.AddHours(DuracionSesionHoras), false, "");

                        return Json(new
                        {
                            success = true,
                            usuario,
                            sessionToken = FormsAuthentication.Encrypt(ticket),
                            expiresIn = DuracionSesionHoras * 60 * 60
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                Trace.TraceError("No se pudo iniciar sesión: {0}", ex.GetType().Name);
                return Error(503, "El servicio de acceso no está disponible. Intenta nuevamente.");
            }
        }

        [HttpGet]
        public JsonResult Sesion()
        {
            // Permitir conexión con el frontend (CORS)
            Response.AppendHeader("Access-Control-Allow-Origin", "*");

            Response.Cache.SetCacheability(System.Web.HttpCacheability.NoCache);
            Response.Cache.SetNoStore();

            string cabecera = Request.Headers["Authorization"];
            if (string.IsNullOrEmpty(cabecera) ||
                !cabecera.StartsWith("Bearer ", StringComparison.Ordinal))
            {
                return Error(401, "Debes iniciar sesión.");
            }

            FormsAuthenticationTicket ticket;
            int idUsuario;

            try
            {
                ticket = FormsAuthentication.Decrypt(cabecera.Substring(7));
                if (ticket == null || ticket.Expired ||
                    !int.TryParse(ticket.Name, out idUsuario) || idUsuario <= 0)
                {
                    return Error(401, "Tu sesión ha vencido. Inicia sesión nuevamente.");
                }
            }
            catch (Exception)
            {
                return Error(401, "La sesión no es válida.");
            }

            try
            {
                using (var conexion = CrearConexion())
                using (var comando = new MySqlCommand(
                    @"SELECT u.id_usuario, u.id_rol, u.nombre, u.correo, r.nombre AS rol
                      FROM USUARIO u
                      INNER JOIN ROL r ON r.id_rol = u.id_rol
                      WHERE u.id_usuario = @id AND u.estado = 'activo'
                      LIMIT 1", conexion))
                {
                    comando.Parameters.AddWithValue("@id", idUsuario);
                    conexion.Open();

                    using (var lector = comando.ExecuteReader())
                    {
                        if (!lector.Read())
                        {
                            return Error(401, "Tu cuenta no tiene acceso al sistema.");
                        }

                        return Json(new { success = true, usuario = LeerUsuario(lector) },
                            JsonRequestBehavior.AllowGet);
                    }
                }
            }
            catch (Exception ex)
            {
                Trace.TraceError("No se pudo comprobar la sesión: {0}", ex.GetType().Name);
                return Error(503, "No se pudo comprobar tu sesión. Intenta nuevamente.");
            }
        }

        private static MySqlConnection CrearConexion()
        {
            return new MySqlConnection(
                ConfigurationManager.ConnectionStrings["ConexionMySQL"].ConnectionString);
        }

        private static UsuarioSesion LeerUsuario(MySqlDataReader lector)
        {
            return new UsuarioSesion
            {
                id_usuario = Convert.ToString(lector["id_usuario"], CultureInfo.InvariantCulture),
                id_rol = Convert.ToString(lector["id_rol"], CultureInfo.InvariantCulture),
                nombre = lector["nombre"].ToString(),
                correo = lector["correo"].ToString(),
                rol = lector["rol"].ToString()
            };
        }

        private JsonResult Error(int estado, string mensaje)
        {
            Response.AppendHeader("Access-Control-Allow-Origin", "*");
            Response.StatusCode = estado;
            Response.TrySkipIisCustomErrors = true;
            return Json(new { success = false, error = mensaje }, JsonRequestBehavior.AllowGet);
        }

        private sealed class UsuarioSesion
        {
            public string id_usuario { get; set; }
            public string id_rol { get; set; }
            public string nombre { get; set; }
            public string correo { get; set; }
            public string rol { get; set; }
        }
    }
}