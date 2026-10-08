using System;
using System.Collections;
using System.IO;
using System.Reflection;
using System.Xml;
using MySql.Data.MySqlClient;
using backend.Models;

// Tablas temporales por conexión: los registros reales no se modifican.
class DashboardDataTest
{
    static object Get(object value, string name) { return value.GetType().GetProperty(name).GetValue(value, null); }
    static decimal Number(object value, string name) { return Convert.ToDecimal(Get(value, name)); }
    static void Check(bool condition, string message) { if (!condition) throw new Exception(message); }
    static void Sql(MySqlConnection c, string sql) { using (var cmd = new MySqlCommand(sql, c)) cmd.ExecuteNonQuery(); }
    static int Count(object value) { int count = 0; foreach (var item in (IEnumerable)value) count++; return count; }

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
        var builder = new MySqlConnectionStringBuilder(config.SelectSingleNode("/connectionStrings/add[@name='ConexionMySQL']").Attributes["connectionString"].Value) { ConnectionTimeout = 5 };
        using (var c = new MySqlConnection(builder.ConnectionString))
        {
            c.Open();
            Sql(c, @"CREATE TEMPORARY TABLE VENTA (id_venta INT PRIMARY KEY,fecha DATETIME,total DECIMAL(12,2),estado VARCHAR(20),tipo_documento VARCHAR(20),folio VARCHAR(30)) ENGINE=InnoDB;
                CREATE TEMPORARY TABLE LIBRO (isbn VARCHAR(20) PRIMARY KEY,titulo VARCHAR(200),autor VARCHAR(150),activo BOOLEAN,stock_actual INT,stock_minimo INT) ENGINE=InnoDB;
                CREATE TEMPORARY TABLE DETALLE_VENTA (id_venta INT,isbn VARCHAR(20),cantidad INT) ENGINE=InnoDB;
                CREATE TEMPORARY TABLE FACTURA_PROVEEDOR (monto_total DECIMAL(12,2),estado_pago VARCHAR(20)) ENGINE=InnoDB;
                CREATE TEMPORARY TABLE ORDEN_COMPRA (id_oc INT PRIMARY KEY,id_proveedor INT,fecha DATE,total DECIMAL(12,2),estado VARCHAR(20)) ENGINE=InnoDB;
                CREATE TEMPORARY TABLE PROVEEDOR (id_proveedor INT PRIMARY KEY,razon_social VARCHAR(150)) ENGINE=InnoDB;
                CREATE TEMPORARY TABLE RECEPCION (id_recepcion INT PRIMARY KEY,id_oc INT,nro_doc VARCHAR(50),fecha DATETIME) ENGINE=InnoDB;
                CREATE TEMPORARY TABLE MOVIMIENTO_STOCK (id_movimiento INT PRIMARY KEY,isbn VARCHAR(20),tipo_movimiento VARCHAR(20),cantidad INT,fecha DATETIME) ENGINE=InnoDB;
                CREATE TEMPORARY TABLE ASIENTO (id_asiento INT PRIMARY KEY,glosa VARCHAR(255),fecha DATE) ENGINE=InnoDB;");
            var today = new DateTime(2026,10,8);
            var empty = DashboardData.Load(c,today);
            Check(Number(empty,"salesToday") == 0 && Number(empty,"payable") == 0 && Number(empty,"criticalStock") == 0, "Vacíos incorrectos");
            Check(Count(Get(empty,"days")) == 7 && Count(Get(empty,"activity")) == 0, "Período vacío incorrecto");
            Sql(c, @"INSERT INTO VENTA VALUES
                (1,'2026-10-08 10:00:00',100,'pagado','boleta',NULL),
                (2,'2026-10-07 10:00:00',50,'pagado','boleta','B-2'),
                (3,'2026-10-08 11:00:00',900,'anulado','boleta',NULL),
                (4,'2026-10-08 11:00:00',800,'pendiente','boleta',NULL),
                (5,'2026-10-09 11:00:00',700,'pagado','boleta',NULL),
                (6,'2026-09-25 10:00:00',40,'pagado','boleta',NULL),
                (7,'2026-10-01 10:00:00',30,'pagado','boleta',NULL);
                INSERT INTO LIBRO VALUES ('A','Libro A',NULL,TRUE,2,2),('B','Libro B','Autor',TRUE,9,2),('C','Inactivo',NULL,FALSE,0,3);
                INSERT INTO DETALLE_VENTA VALUES (1,'A',2),(2,'B',1),(3,'B',100),(4,'B',100),(5,'B',100),(6,'A',50),(7,'B',3);
                INSERT INTO FACTURA_PROVEEDOR VALUES (1000,'pendiente'),(2000,'pagada');
                INSERT INTO PROVEEDOR VALUES (1,'Editorial');
                INSERT INTO ORDEN_COMPRA VALUES (1,1,'2026-10-01',100,'pendiente'),(2,1,'2026-10-02',200,'aprobada'),(3,1,'2026-10-02',200,'aprobada');
                INSERT INTO RECEPCION VALUES (1,3,'R-1','2026-10-08 09:00:00');
                INSERT INTO MOVIMIENTO_STOCK VALUES (1,'A','salida',2,'2026-10-08 10:01:00');
                INSERT INTO ASIENTO VALUES (1,'Venta #1','2026-10-08');");
            var data = DashboardData.Load(c,today);
            Check(Number(data,"salesToday") == 100 && Number(data,"salesYesterday") == 50, "Estados/fecha incorrectos");
            Check(Number(data,"weekTotal") == 150 && Number(data,"previousWeekTotal") == 70, "Límites semanales incorrectos");
            Check(Number(data,"criticalStock") == 1 && Number(data,"payable") == 1000, "Stock/facturas incorrectos");
            Check(Number(data,"pendingOrders") == 1 && Number(data,"pendingReceipts") == 1, "Órdenes/recepciones incorrectas");
            var books = (IList)Get(data,"books");
            Check((string)Get(books[0],"isbn") == "B" && Number(books[0],"sales") == 4, "Ranking mensual incorrecto");
            var days = (IList)Get(data,"days");
            Check((string)Get(days[0],"date") == "2026-10-02" && (string)Get(days[6],"date") == "2026-10-08", "Días incorrectos");
            Check(Number(days[0],"total") == 0 && Number(days[6],"total") == 100, "Huecos incorrectos");
            foreach (var item in (IEnumerable)Get(data,"activity"))
                Check((string)Get(item,"id") != "venta-3" && (string)Get(item,"id") != "venta-4" && (string)Get(item,"id") != "venta-5", "Actividad incluye venta inválida");
            Check(Count(Get(data,"activity")) == 6, "Límite de actividad incorrecto");
            Sql(c, "DELETE FROM VENTA; INSERT INTO VENTA VALUES (1,'2025-12-31 23:59:59',100,'pagado','boleta',NULL),(2,'2026-01-01 00:00:00',50,'pagado','boleta',NULL)");
            var january = DashboardData.Load(c,new DateTime(2026,1,1));
            Check(Number(january,"salesToday") == 50 && Number(january,"salesYesterday") == 100 && Number(january,"weekTotal") == 150, "Cambio de año incorrecto");
            Check(Number(((IList)Get(january,"books"))[0],"sales") == 1, "Cambio de mes incorrecto");
            Console.WriteLine("PASS: inicio vacío, ventas, fechas, stock, facturas, recepciones, ranking y actividad.");
            return 0;
        }
    }
}
