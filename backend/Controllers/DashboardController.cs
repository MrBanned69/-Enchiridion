using System;
using System.Collections.Generic;
using System.Globalization;
using System.Web.Http;
using backend.Data;
using backend.Models;
using MySql.Data.MySqlClient;

namespace backend.Controllers
{
    [RoutePrefix("api/dashboard")]
    public class DashboardController : ApiController
    {
        [HttpGet]
        [Route("stats")]
        public IHttpActionResult GetStats()
        {
            try
            {
                var clCulture = new CultureInfo("es-CL");
                decimal ventasTotal = 0;
                int stockCriticoCount = 0;
                decimal cuentasPorPagar = 0;
                int recepcionesPendientes = 0;
                int totalLibros = 0;

                using (var conn = DbConnectionFactory.CreateConnection())
                {
                    // 1. Ventas
                    using (var cmd = new MySqlCommand("SELECT COALESCE(SUM(total), 0) FROM VENTA WHERE estado != 'anulado'", conn))
                    {
                        ventasTotal = Convert.ToDecimal(cmd.ExecuteScalar());
                    }

                    // 2. Stock crítico
                    using (var cmd = new MySqlCommand("SELECT COUNT(*) FROM LIBRO WHERE stock_actual <= stock_minimo AND activo = 1", conn))
                    {
                        stockCriticoCount = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    // 3. Cuentas por pagar
                    using (var cmd = new MySqlCommand("SELECT COALESCE(SUM(monto_total), 0) FROM FACTURA_PROVEEDOR WHERE estado_pago = 'pendiente'", conn))
                    {
                        cuentasPorPagar = Convert.ToDecimal(cmd.ExecuteScalar());
                    }

                    // 4. Recepciones pendientes (OC pendientes o aprobadas que aún no se completan)
                    using (var cmd = new MySqlCommand("SELECT COUNT(*) FROM ORDEN_COMPRA WHERE estado IN ('pendiente', 'aprobada')", conn))
                    {
                        recepcionesPendientes = Convert.ToInt32(cmd.ExecuteScalar());
                    }

                    // 5. Total de libros en catálogo
                    using (var cmd = new MySqlCommand("SELECT COUNT(*) FROM LIBRO WHERE activo = 1", conn))
                    {
                        totalLibros = Convert.ToInt32(cmd.ExecuteScalar());
                    }
                }

                var metrics = new List<MetricDto>
                {
                    new MetricDto
                    {
                        Title = "Ventas acumuladas",
                        Value = "$" + ventasTotal.ToString("N0", clCulture),
                        Detail = "Total registrado en sistema",
                        Icon = "sales",
                        Tone = "success"
                    },
                    new MetricDto
                    {
                        Title = "Stock crítico",
                        Value = stockCriticoCount + " títulos",
                        Detail = "Requieren reposición",
                        Icon = "inventory",
                        Tone = stockCriticoCount > 0 ? "danger" : "neutral"
                    },
                    new MetricDto
                    {
                        Title = "Cuentas por pagar",
                        Value = "$" + cuentasPorPagar.ToString("N0", clCulture),
                        Detail = "Facturas pendientes",
                        Icon = "accounting",
                        Tone = "warning"
                    },
                    new MetricDto
                    {
                        Title = "Recepciones pendientes",
                        Value = recepcionesPendientes.ToString(),
                        Detail = "Órdenes de compra por recibir",
                        Icon = "purchases",
                        Tone = "neutral"
                    }
                };

                return Ok(new DashboardStatsDto
                {
                    Metrics = metrics,
                    TotalLibros = totalLibros,
                    StockCriticoCount = stockCriticoCount,
                    VentasTotal = ventasTotal,
                    RecepcionesPendientes = recepcionesPendientes
                });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}
