using System;
using System.Collections.Generic;
using System.Configuration;
using System.Web;
using System.Web.Mvc;
using backend.Models;
using MySql.Data.MySqlClient;

namespace backend.Controllers
{
    public class ContabilidadController : Controller
    {
        [HttpGet]
        public JsonResult Diario()
        {
            Response.Cache.SetNoStore();
            try
            {
                using (var connection = new MySqlConnection(ConfigurationManager.ConnectionStrings["ConexionMySQL"].ConnectionString))
                {
                    connection.Open();
                    SessionAccess.RequireUser(Request, connection,
                        "administrador", "administradora", "admin", "contador", "contadora");
                    var accounts = new List<object>();
                    var periods = new List<object>();
                    var entries = new List<JournalEntry>();
                    // Las tres lecturas comparten la misma vista de datos confirmados.
                    using (var transaction = connection.BeginTransaction(System.Data.IsolationLevel.RepeatableRead))
                    {
                        using (var command = new MySqlCommand("SELECT codigo_cuenta, nombre, tipo FROM CUENTA_CONTABLE ORDER BY codigo_cuenta", connection, transaction))
                        using (var reader = command.ExecuteReader())
                            while (reader.Read()) accounts.Add(new {
                                code = reader["codigo_cuenta"].ToString(), name = reader["nombre"].ToString(), type = reader["tipo"].ToString()
                            });
                        using (var command = new MySqlCommand("SELECT anio, mes, estado FROM PERIODO_CONTABLE ORDER BY anio DESC, mes DESC", connection, transaction))
                        using (var reader = command.ExecuteReader())
                            while (reader.Read())
                            {
                                var date = new DateTime(Convert.ToInt32(reader["anio"]), Convert.ToInt32(reader["mes"]), 1);
                                periods.Add(new { value = date.ToString("yyyy-MM"),
                                    label = date.ToString("MMMM yyyy", System.Globalization.CultureInfo.GetCultureInfo("es-CL")),
                                    status = reader["estado"].ToString() });
                            }
                        using (var command = new MySqlCommand(@"SELECT a.id_asiento, a.fecha, a.glosa, a.origen, a.id_documento,
                            v.folio, v.tipo_documento, d.codigo_cuenta, d.debe, d.haber
                            FROM ASIENTO a LEFT JOIN DETALLE_ASIENTO d ON d.id_asiento = a.id_asiento
                            LEFT JOIN VENTA v ON a.origen = 'ventas' AND v.id_venta = a.id_documento
                            ORDER BY a.fecha DESC, a.id_asiento DESC, d.id_detalle", connection, transaction))
                        using (var reader = command.ExecuteReader())
                        {
                            JournalEntry entry = null;
                            while (reader.Read())
                            {
                                var code = "AS-" + Convert.ToInt32(reader["id_asiento"]).ToString("D6");
                                if (entry == null || entry.code != code)
                                {
                                    var origin = reader["origen"].ToString();
                                    var folio = Convert.ToString(reader["folio"]);
                                    entry = new JournalEntry {
                                        code = code, date = Convert.ToDateTime(reader["fecha"]).ToString("yyyy-MM-dd"),
                                        description = Convert.ToString(reader["glosa"]),
                                        source = origin == "ventas" ? "Ventas" : origin == "compras" ? "Compras" : "Manual",
                                        document = !string.IsNullOrEmpty(folio) ? folio :
                                            origin == "ventas" ? reader["tipo_documento"] + " #" + reader["id_documento"] :
                                            Convert.ToString(reader["id_documento"])
                                    };
                                    entries.Add(entry);
                                }
                                if (reader["codigo_cuenta"] != DBNull.Value)
                                    entry.lines.Add(new { account = reader["codigo_cuenta"].ToString(),
                                        debit = Convert.ToDecimal(reader["debe"]), credit = Convert.ToDecimal(reader["haber"]) });
                            }
                        }
                        transaction.Commit();
                    }
                    return Json(new { success = true, accounts, periods, entries }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (HttpException ex) { return Error(ex.GetHttpCode(), ex.Message); }
            catch (Exception ex)
            {
                System.Diagnostics.Trace.TraceError("Error al consultar contabilidad: {0}", ex.GetType().Name);
                return Error(503, "No se pudo consultar el libro diario.");
            }
        }

        private JsonResult Error(int status, string message)
        {
            Response.StatusCode = status;
            Response.TrySkipIisCustomErrors = true;
            return Json(new { error = message }, JsonRequestBehavior.AllowGet);
        }

        private class JournalEntry
        {
            public string code { get; set; }
            public string date { get; set; }
            public string description { get; set; }
            public string source { get; set; }
            public string document { get; set; }
            public List<object> lines = new List<object>();
        }
    }
}
