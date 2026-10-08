using System;
using System.Collections.Generic;
using System.Web;
using System.Web.Mvc;
using backend.Data;
using backend.Models;
using MySql.Data.MySqlClient;

namespace backend.Controllers
{
    public class AdministracionController : Controller
    {
        [HttpGet]
        public JsonResult Listar()
        {
            return Execute(connection => {
                SessionAccess.RequireUser(Request, connection, UserAccounts.AdminRoles);
                var users = new List<object>();
                var roles = new List<object>();
                using (var command = new MySqlCommand(@"SELECT u.id_usuario, u.nombre, u.correo, u.id_rol,
                    r.nombre AS rol, u.estado, u.fecha_creacion, c.rut, c.tipo_cliente FROM USUARIO u
                    INNER JOIN ROL r ON r.id_rol = u.id_rol LEFT JOIN CLIENTE c ON c.id_cliente=u.id_cliente
                    ORDER BY u.nombre, u.id_usuario", connection))
                using (var reader = command.ExecuteReader())
                    while (reader.Read()) users.Add(new {
                        id = Convert.ToInt32(reader["id_usuario"]), nombre = reader["nombre"].ToString(),
                        correo = reader["correo"].ToString(), idRol = Convert.ToInt32(reader["id_rol"]),
                        rol = reader["rol"].ToString(), estado = reader["estado"].ToString(),
                        fechaCreacion = Convert.ToDateTime(reader["fecha_creacion"]).ToString("yyyy-MM-dd"),
                        rut = reader["rut"].ToString(), tipoCliente = reader["tipo_cliente"].ToString()
                    });
                using (var command = new MySqlCommand("SELECT id_rol, nombre FROM ROL ORDER BY id_rol", connection))
                using (var reader = command.ExecuteReader())
                    while (reader.Read()) {
                        var role = reader["nombre"].ToString();
                        if (Array.IndexOf(UserAccounts.StaffRoles, role.ToLowerInvariant()) >= 0 || role.Equals("cliente", StringComparison.OrdinalIgnoreCase))
                            roles.Add(new { id = Convert.ToInt32(reader["id_rol"]), nombre = role });
                    }
                return new { usuarios = users, perfiles = roles };
            });
        }

        [HttpPost]
        public JsonResult Guardar(int? id, string nombre, string correo, string password, int idRol, string estado, string rut, string tipoCliente)
        {
            return Execute(connection => {
                var actor = SessionAccess.RequireUser(Request, connection, UserAccounts.AdminRoles);
                UserAccounts.Validate(nombre, correo, password, !id.HasValue);
                if (estado != "activo" && estado != "inactivo") throw new HttpException(400, "Estado no válido.");
                if (id.HasValue && id.Value <= 0) throw new HttpException(400, "Usuario no válido.");
                using (var transaction = connection.BeginTransaction())
                {
                    // Serialize changes that could remove the last active administrator.
                    var admins = new List<int>();
                    using (var command = new MySqlCommand(@"SELECT u.id_usuario FROM USUARIO u INNER JOIN ROL r ON r.id_rol=u.id_rol
                        WHERE u.estado='activo' AND LOWER(r.nombre) IN ('administrador','administradora','admin')
                        ORDER BY u.id_usuario FOR UPDATE", connection, transaction))
                    using (var reader = command.ExecuteReader())
                        while (reader.Read()) admins.Add(reader.GetInt32(0));
                    using (var command = new MySqlCommand("SELECT estado, id_rol FROM USUARIO WHERE id_usuario=@id FOR UPDATE", connection, transaction)) {
                        command.Parameters.AddWithValue("@id", actor);
                        using (var reader = command.ExecuteReader()) {
                            if (!reader.Read() || reader.GetString(0) != "activo") throw new HttpException(403, "Tu cuenta ya no tiene permisos.");
                        }
                    }
                    if (!admins.Contains(actor)) throw new HttpException(403, "Tu cuenta ya no tiene permisos.");
                    string role;
                    using (var command = new MySqlCommand("SELECT nombre FROM ROL WHERE id_rol=@role", connection, transaction)) {
                        command.Parameters.AddWithValue("@role", idRol);
                        role = Convert.ToString(command.ExecuteScalar()).ToLowerInvariant();
                    }
                    if (Array.IndexOf(UserAccounts.StaffRoles, role) < 0 && role != "cliente") throw new HttpException(400, "Perfil no válido.");
                    var remainsAdmin = estado == "activo" && Array.IndexOf(UserAccounts.AdminRoles, role) >= 0;
                    if (id == actor && !remainsAdmin) throw new HttpException(400, "No puedes desactivar tu cuenta ni quitarte el perfil de administrador.");
                    if (id.HasValue && admins.Contains(id.Value) && admins.Count <= 1 && !remainsAdmin)
                        throw new HttpException(400, "Debe existir al menos un administrador activo.");
                    int savedId;
                    if (!id.HasValue) savedId = UserAccounts.Create(connection, transaction, nombre, correo, password, idRol, estado);
                    else {
                        using (var command = new MySqlCommand("SELECT id_usuario FROM USUARIO WHERE id_usuario=@id FOR UPDATE", connection, transaction)) {
                            command.Parameters.AddWithValue("@id", id.Value);
                            if (command.ExecuteScalar() == null) throw new HttpException(404, "El usuario no existe.");
                        }
                        var passwordSql = string.IsNullOrEmpty(password) ? "" : ", password_hash=@hash, fecha_ultimo_cambio_pass=CURRENT_DATE()";
                        using (var command = new MySqlCommand("UPDATE USUARIO SET nombre=@name, correo=@email, id_rol=@role, estado=@status" + passwordSql + " WHERE id_usuario=@id", connection, transaction)) {
                            command.Parameters.AddWithValue("@name", nombre.Trim());
                            command.Parameters.AddWithValue("@email", correo.Trim().ToLowerInvariant());
                            command.Parameters.AddWithValue("@role", idRol);
                            command.Parameters.AddWithValue("@status", estado);
                            command.Parameters.AddWithValue("@id", id.Value);
                            if (!string.IsNullOrEmpty(password)) command.Parameters.AddWithValue("@hash", BCrypt.Net.BCrypt.HashPassword(password, 11));
                            command.ExecuteNonQuery();
                        }
                        savedId = id.Value;
                    }
                    if (role == "cliente") UserAccounts.SaveCustomer(connection, transaction, savedId, nombre, rut, tipoCliente);
                    transaction.Commit();
                    return new { success = true, id = savedId };
                }
            });
        }

        private JsonResult Execute(Func<MySqlConnection, object> action)
        {
            Response.Cache.SetNoStore();
            try { using (var connection = DbConnectionFactory.CreateConnection()) return Json(action(connection), JsonRequestBehavior.AllowGet); }
            catch (HttpException ex) { return Error(ex.GetHttpCode(), ex.Message); }
            catch (MySqlException ex) when (ex.Number == 1062) { return Error(409, "Ya existe un usuario con ese correo."); }
            catch (Exception ex) { System.Diagnostics.Trace.TraceError("Administración: {0}", ex.GetType().Name); return Error(503, "No se pudo completar la operación de usuarios."); }
        }
        private JsonResult Error(int status, string message) {
            Response.StatusCode = status; Response.TrySkipIisCustomErrors = true;
            return Json(new { error = message }, JsonRequestBehavior.AllowGet);
        }
    }
}
