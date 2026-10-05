using System;
using System.Web.Mvc;
using MySql.Data.MySqlClient;
using System.Configuration;
using BCrypt.Net;

namespace backend.Controllers
{
    public class LoginController : Controller
    {
        [HttpPost]
        public JsonResult Ingresar(string email, string password)
        {
            Response.AppendHeader("Access-Control-Allow-Origin", "*");
            string cadenaConexion = ConfigurationManager.ConnectionStrings["ConexionMySQL"].ConnectionString;

            using (MySqlConnection conexion = new MySqlConnection(cadenaConexion))
            {
                try
                {
                    string query = "SELECT id_usuario, id_rol, password_hash FROM USUARIO WHERE correo = @user AND estado = 'activo'";

                    using (MySqlCommand comando = new MySqlCommand(query, conexion))
                    {
                        comando.Parameters.AddWithValue("@user", email.Trim());

                        conexion.Open();
                        using (MySqlDataReader lector = comando.ExecuteReader())
                        {
                            if (lector.HasRows)
                            {
                                lector.Read();
                                // Aplicamos Trim() por si se guardó con espacios accidentales en MySQL
                                string hashGuardado = lector["password_hash"].ToString().Trim();

                                try
                                {
                                    bool claveCorrecta = BCrypt.Net.BCrypt.Verify(password, hashGuardado);

                                    if (claveCorrecta)
                                    {
                                        return Json(new
                                        {
                                            success = true,
                                            id_usuario = lector["id_usuario"].ToString(),
                                            id_rol = lector["id_rol"].ToString()
                                        });
                                    }
                                    else
                                    {
                                        // Si falla aquí, significa que la clave Password123! no es la dueña de ese Hash
                                        return Json(new { success = false, error = $"Falla BCrypt: La clave '{password}' no coincide con el hash guardado." });
                                    }
                                }
                                catch (Exception bcEx)
                                {
                                    // Si falla aquí, el formato del hash en la base de datos está corrupto
                                    return Json(new { success = false, error = "Error de formato Hash: " + bcEx.Message });
                                }
                            }
                            else
                            {
                                // Si falla aquí, el correo no está llegando bien o no existe
                                return Json(new { success = false, error = $"BD: No se encontró el correo '{email}' en estado activo." });
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    return Json(new { success = false, error = "Error del servidor: " + ex.Message });
                }
            }
        }
    }
}