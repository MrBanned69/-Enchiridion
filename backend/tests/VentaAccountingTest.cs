using System;
using System.IO;
using System.Reflection;
using System.Xml;
using System.Web;
using MySql.Data.MySqlClient;
using backend.Models;

// Usa tablas temporales privadas de esta conexión; no modifica datos del ERP.
class VentaAccountingTest
{
    static void Check(bool condition, string message) { if (!condition) throw new Exception(message); }
    static void Sql(MySqlConnection c, string sql, MySqlTransaction t = null)
    { using (var cmd = new MySqlCommand(sql, c, t)) cmd.ExecuteNonQuery(); }
    static decimal Value(MySqlConnection c, string sql, MySqlTransaction t = null)
    { using (var cmd = new MySqlCommand(sql, c, t)) return Convert.ToDecimal(cmd.ExecuteScalar()); }

    static int Main(string[] args)
    {
        var root = Path.GetFullPath(args[0]);
        AppDomain.CurrentDomain.AssemblyResolve += (s, e) => {
            var file = Path.Combine(root, "bin", new AssemblyName(e.Name).Name + ".dll");
            return File.Exists(file) ? Assembly.LoadFrom(file) : null;
        };
        return Run(root);
    }
    static int Run(string root)
    {
        var config = new XmlDocument();
        config.Load(Path.Combine(root, "ConnectionStrings.config"));
        var connectionString = config.SelectSingleNode("/connectionStrings/add[@name='ConexionMySQL']").Attributes["connectionString"].Value;
        var builder = new MySqlConnectionStringBuilder(connectionString) { ConnectionTimeout = 5 };
        using (var c = new MySqlConnection(builder.ConnectionString))
        {
            try { c.Open(); }
            catch (Exception ex) { Console.WriteLine("MySQL no disponible: " + ex.GetType().Name); return 2; }
            Sql(c, @"CREATE TEMPORARY TABLE VENTA (
                id_venta INT AUTO_INCREMENT PRIMARY KEY, id_cliente INT, id_usuario INT,
                canal VARCHAR(30), forma_pago VARCHAR(30), tipo_documento VARCHAR(20),
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP, neto DECIMAL(12,2) DEFAULT 0,
                iva DECIMAL(12,2) DEFAULT 0, total DECIMAL(12,2) DEFAULT 0, estado VARCHAR(20)) ENGINE=InnoDB");
            Sql(c, @"CREATE TEMPORARY TABLE PERIODO_CONTABLE (
                id_periodo INT AUTO_INCREMENT PRIMARY KEY, anio INT, mes INT,
                estado VARCHAR(20), UNIQUE(anio,mes)) ENGINE=InnoDB");
            Sql(c, @"CREATE TEMPORARY TABLE CUENTA_CONTABLE (
                codigo_cuenta VARCHAR(20) PRIMARY KEY, nombre VARCHAR(100), tipo VARCHAR(20)) ENGINE=InnoDB");
            Sql(c, @"CREATE TEMPORARY TABLE ASIENTO (
                id_asiento INT AUTO_INCREMENT PRIMARY KEY, id_periodo INT, id_usuario INT,
                fecha DATE, glosa VARCHAR(255), origen VARCHAR(20), id_documento INT) ENGINE=InnoDB");
            Sql(c, @"CREATE TEMPORARY TABLE DETALLE_ASIENTO (
                id_detalle INT AUTO_INCREMENT PRIMARY KEY, id_asiento INT, codigo_cuenta VARCHAR(20),
                debe DECIMAL(12,2) DEFAULT 0, haber DECIMAL(12,2) DEFAULT 0) ENGINE=InnoDB");
            foreach (var payment in new[] { "efectivo", "tarjeta", "transferencia" })
            {
                int entry;
                using (var t = c.BeginTransaction())
                {
                    Sql(c, "INSERT INTO VENTA (id_cliente,id_usuario,canal,forma_pago,tipo_documento,neto,iva,total,estado) VALUES (1,1,'tienda fisica','" + payment + "','boleta',10000,1900,11900,'pagado')", t);
                    int sale = (int)Value(c, "SELECT LAST_INSERT_ID()", t);
                    entry = VentaAccounting.Register(c, t, sale, 1, payment, 10000m, 1900m, 11900m, 5000m);
                    t.Commit();
                }
                Check(Value(c, "SELECT SUM(debe)-SUM(haber) FROM DETALLE_ASIENTO WHERE id_asiento=" + entry) == 0, "Asiento descuadrado");
                string account = payment == "efectivo" ? "1.1.01" : "1.1.02";
                Check(Value(c, "SELECT debe FROM DETALLE_ASIENTO WHERE id_asiento=" + entry + " AND codigo_cuenta='" + account + "'") == 11900, "Cuenta de cobro incorrecta");
                Check(Value(c, "SELECT haber FROM DETALLE_ASIENTO WHERE id_asiento=" + entry + " AND codigo_cuenta='2.1.02'") == 1900, "IVA incorrecto");
                Check(Value(c, "SELECT debe FROM DETALLE_ASIENTO WHERE id_asiento=" + entry + " AND codigo_cuenta='5.1.01'") == 5000, "Costo incorrecto");
            }
            Sql(c, "UPDATE PERIODO_CONTABLE SET estado='cerrado'");
            var salesBefore = Value(c, "SELECT COUNT(*) FROM VENTA");
            using (var t = c.BeginTransaction())
            {
                Sql(c, "INSERT INTO VENTA (id_cliente,id_usuario,canal,forma_pago,tipo_documento,estado) VALUES (1,1,'tienda fisica','efectivo','boleta','pagado')", t);
                try {
                    VentaAccounting.Register(c, t, (int)Value(c, "SELECT LAST_INSERT_ID()", t), 1, "efectivo", 100m, 19m, 119m, 50m);
                    throw new Exception("Aceptó período cerrado");
                } catch (HttpException ex) { Check(ex.GetHttpCode() == 409, "Estado incorrecto"); t.Rollback(); }
            }
            Check(Value(c, "SELECT COUNT(*) FROM VENTA") == salesBefore, "No revirtió la venta");
            Sql(c, "UPDATE PERIODO_CONTABLE SET estado='abierto'");
            Sql(c, "ALTER TABLE DETALLE_ASIENTO DROP COLUMN haber");
            var entriesBefore = Value(c, "SELECT COUNT(*) FROM ASIENTO");
            using (var t = c.BeginTransaction())
            {
                Sql(c, "INSERT INTO VENTA (id_cliente,id_usuario,canal,forma_pago,tipo_documento,estado) VALUES (1,1,'tienda fisica','efectivo','boleta','pagado')", t);
                try {
                    VentaAccounting.Register(c, t, (int)Value(c, "SELECT LAST_INSERT_ID()", t), 1, "efectivo", 100m, 19m, 119m, 50m);
                    throw new Exception("No detectó fallo de detalle");
                } catch (MySqlException) { t.Rollback(); }
            }
            Check(Value(c, "SELECT COUNT(*) FROM VENTA") == salesBefore, "Venta sin asiento");
            Check(Value(c, "SELECT COUNT(*) FROM ASIENTO") == entriesBefore, "Asiento parcial");
            Console.WriteLine("PASS: cobros, IVA, costo, cuadre y rollback en tablas temporales.");
            return 0;
        }
    }
}
