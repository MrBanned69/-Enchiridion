using System;
using System.Configuration;
using System.Web;
using System.Web.Mvc;
using backend.Models;
using MySql.Data.MySqlClient;

namespace backend.Controllers
{
    public class DashboardController : Controller
    {
        [HttpGet]
        public JsonResult Resumen()
        {
            Response.Cache.SetNoStore();
            try
            {
                using (var connection = new MySqlConnection(ConfigurationManager.ConnectionStrings["ConexionMySQL"].ConnectionString))
                {
                    connection.Open();
                    SessionAccess.RequireUser(Request, connection, UserAccounts.StaffRoles);
                    var today = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow,
                        TimeZoneInfo.FindSystemTimeZoneById("Pacific SA Standard Time")).Date;
                    return Json(DashboardData.Load(connection, today), JsonRequestBehavior.AllowGet);
                }
            }
            catch (HttpException ex) { return Error(ex.GetHttpCode(), ex.Message); }
            catch (Exception ex)
            {
                System.Diagnostics.Trace.TraceError("Error al consultar inicio: {0}", ex.GetType().Name);
                return Error(503, "No se pudieron consultar los datos del inicio.");
            }
        }
        private JsonResult Error(int status, string message)
        {
            Response.StatusCode = status;
            Response.TrySkipIisCustomErrors = true;
            return Json(new { error = message }, JsonRequestBehavior.AllowGet);
        }
    }
}
