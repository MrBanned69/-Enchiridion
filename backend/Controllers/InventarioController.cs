using System;
using System.Collections.Generic;
using System.Configuration;
using System.Web.Mvc;
using MySql.Data.MySqlClient;

namespace backend.Controllers
{
    public class InventarioController : Controller
    {
        [HttpGet]
        public JsonResult ListarInventario()
        {
            // Permiso vital para que Next.js pueda leer esto
            Response.AppendHeader("Access-Control-Allow-Origin", "*");

            var inventario = new List<object>();

            try
            {
                using (var conexion = new MySqlConnection(ConfigurationManager.ConnectionStrings["ConexionMySQL"].ConnectionString))
                using (var comando = new MySqlCommand(
                    "SELECT isbn, titulo, autor, categoria, estante, stock, stock_minimo AS minimo, precio FROM LIBRO", conexion))
                {
                    conexion.Open();
                    using (var lector = comando.ExecuteReader())
                    {
                        while (lector.Read())
                        {
                            inventario.Add(new
                            {
                                isbn = lector["isbn"].ToString(),
                                titulo = lector["titulo"].ToString(),
                                autor = lector["autor"].ToString(),
                                categoria = lector["categoria"].ToString(),
                                estante = lector["estante"].ToString(),
                                stock = Convert.ToInt32(lector["stock"]),
                                minimo = Convert.ToInt32(lector["minimo"]),
                                precio = Convert.ToDecimal(lector["precio"])
                            });
                        }
                    }
                }

                // Retornamos los datos en formato JSON para el frontend
                return Json(inventario, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                // En caso de error (ej. base de datos caída), devolvemos el error
                Response.StatusCode = 500;
                return Json(new { success = false, error = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }
    }
}