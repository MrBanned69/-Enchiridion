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
                    // Agregamos 'nombre' a la consulta para llevárnoslo al frontend
                    string query = "SELECT id_usuario, id_rol, nombre, password_hash FROM USUARIO WHERE correo = @user AND estado = 'activo'";

                    using (MySqlCommand comando = new MySqlCommand(query, conexion))
                    {
                        comando.Parameters.AddWithValue("@user", email.Trim());

                        conexion.Open();
                        using (MySqlDataReader lector = comando.ExecuteReader())
                        {
                            if (lector.HasRows)
                            {
                                lector.Read();
                                string hashGuardado = lector["password_hash"].ToString().Trim();

                                bool claveCorrecta = BCrypt.Net.BCrypt.Verify(password, hashGuardado);

                                if (claveCorrecta)
                                {
                                    return Json(new
                                    {
                                        success = true,
                                        id_usuario = lector["id_usuario"].ToString(),
                                        id_rol = lector["id_rol"].ToString(),
                                        nombre = lector["nombre"].ToString() // <-- Mandamos el nombre aquí
                                    });
                                }
                            }

                            return Json(new { success = false, error = "Correo o contraseña incorrectos." });
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