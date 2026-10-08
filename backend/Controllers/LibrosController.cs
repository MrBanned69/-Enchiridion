using System;
using System.Collections.Generic;
using System.Web.Http;
using backend.Data;
using backend.Models;
using MySql.Data.MySqlClient;

namespace backend.Controllers
{
    [RoutePrefix("api/libros")]
    public class LibrosController : ApiController
    {
        [HttpGet]
        [Route("")]
        public IHttpActionResult GetAll()
        {
            var libros = new List<LibroDto>();
            try
            {
                using (var conn = DbConnectionFactory.CreateConnection())
                {
                    const string sql = @"
                        SELECT l.isbn, l.titulo, l.autor, l.categoria, l.precio_venta, 
                               l.stock_actual, l.stock_minimo, l.activo, e.nombre AS editorial_nombre
                        FROM LIBRO l
                        LEFT JOIN EDITORIAL e ON l.id_editorial = e.id_editorial
                        ORDER BY l.stock_actual DESC";

                    using (var cmd = new MySqlCommand(sql, conn))
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            libros.Add(new LibroDto
                            {
                                Isbn = reader["isbn"].ToString(),
                                Titulo = reader["titulo"].ToString(),
                                Autor = reader["autor"] != DBNull.Value ? reader["autor"].ToString() : "",
                                Categoria = reader["categoria"] != DBNull.Value ? reader["categoria"].ToString() : "",
                                Editorial = reader["editorial_nombre"] != DBNull.Value ? reader["editorial_nombre"].ToString() : "",
                                PrecioVenta = Convert.ToDecimal(reader["precio_venta"]),
                                StockActual = Convert.ToInt32(reader["stock_actual"]),
                                StockMinimo = Convert.ToInt32(reader["stock_minimo"]),
                                Activo = Convert.ToBoolean(reader["activo"])
                            });
                        }
                    }
                }
                return Ok(libros);
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}
