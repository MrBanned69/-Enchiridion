using System;
using System.Web;
using MySql.Data.MySqlClient;

namespace backend.Models
{
    public static class VentaAccounting
    {
        // Todo se ejecuta en la misma transacción que VENTA y MOVIMIENTO_STOCK.
        public static int Register(MySqlConnection connection, MySqlTransaction transaction,
            int saleId, int userId, string payment, decimal net, decimal tax, decimal total, decimal cost)
        {
            using (var command = new MySqlCommand(@"INSERT IGNORE INTO PERIODO_CONTABLE (anio, mes, estado)
                SELECT YEAR(fecha), MONTH(fecha), 'abierto' FROM VENTA WHERE id_venta = @sale", connection, transaction))
            {
                command.Parameters.AddWithValue("@sale", saleId);
                command.ExecuteNonQuery();
            }
            int periodId;
            using (var command = new MySqlCommand(@"SELECT p.id_periodo, p.estado FROM PERIODO_CONTABLE p
                INNER JOIN VENTA v ON p.anio = YEAR(v.fecha) AND p.mes = MONTH(v.fecha)
                WHERE v.id_venta = @sale FOR UPDATE", connection, transaction))
            {
                command.Parameters.AddWithValue("@sale", saleId);
                using (var reader = command.ExecuteReader())
                {
                    if (!reader.Read()) throw new InvalidOperationException("Período contable no disponible.");
                    if (reader["estado"].ToString() != "abierto")
                        throw new HttpException(409, "El período contable está cerrado. No se puede registrar la venta.");
                    periodId = Convert.ToInt32(reader["id_periodo"]);
                }
            }
            using (var command = new MySqlCommand(@"INSERT IGNORE INTO CUENTA_CONTABLE (codigo_cuenta, nombre, tipo) VALUES
                ('1.1.01', 'Caja', 'activo'), ('1.1.02', 'Banco', 'activo'),
                ('1.1.04', 'Inventario de libros', 'activo'), ('2.1.02', 'IVA débito fiscal', 'pasivo'),
                ('4.1.01', 'Ingresos por ventas', 'ingreso'), ('5.1.01', 'Costo de ventas', 'gasto')", connection, transaction))
                command.ExecuteNonQuery();

            int entryId;
            using (var command = new MySqlCommand(@"INSERT INTO ASIENTO
                (id_periodo, id_usuario, fecha, glosa, origen, id_documento)
                SELECT @period, @user, DATE(fecha), CONCAT('Venta #', id_venta), 'ventas', id_venta
                FROM VENTA WHERE id_venta = @sale; SELECT LAST_INSERT_ID();", connection, transaction))
            {
                command.Parameters.AddWithValue("@period", periodId);
                command.Parameters.AddWithValue("@user", userId);
                command.Parameters.AddWithValue("@sale", saleId);
                entryId = Convert.ToInt32(command.ExecuteScalar());
            }
            using (var command = new MySqlCommand(@"INSERT INTO DETALLE_ASIENTO (id_asiento, codigo_cuenta, debe, haber) VALUES
                (@entry, @payment, @total, 0), (@entry, '4.1.01', 0, @net),
                (@entry, '2.1.02', 0, @tax), (@entry, '5.1.01', @cost, 0),
                (@entry, '1.1.04', 0, @cost)", connection, transaction))
            {
                command.Parameters.AddWithValue("@entry", entryId);
                command.Parameters.AddWithValue("@payment", payment == "efectivo" ? "1.1.01" : "1.1.02");
                command.Parameters.AddWithValue("@total", total);
                command.Parameters.AddWithValue("@net", net);
                command.Parameters.AddWithValue("@tax", tax);
                command.Parameters.AddWithValue("@cost", cost);
                command.ExecuteNonQuery();
            }
            return entryId;
        }
    }
}
