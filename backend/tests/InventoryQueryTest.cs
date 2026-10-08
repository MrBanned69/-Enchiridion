using System;
using System.IO;
using System.Xml;
using System.Text.RegularExpressions;
using MySql.Data.MySqlClient;

// Solo consulta la base real; no escribe registros.
class InventoryQueryTest
{
    static int Main(string[] args)
    {
        var root = Path.GetFullPath(args[0]);
        var config = new XmlDocument();
        config.Load(Path.Combine(root,"ConnectionStrings.config"));
        var connectionString = config.SelectSingleNode("/connectionStrings/add[@name='ConexionMySQL']").Attributes["connectionString"].Value;
        var source = File.ReadAllText(Path.Combine(root,"Controllers","InventarioController.cs"));
        var query = Regex.Match(source,"\"(SELECT isbn[^\"]+)\"").Groups[1].Value;
        if (query.Length == 0) throw new Exception("No se encontró la consulta.");
        using (var c = new MySqlConnection(connectionString))
        using (var cmd = new MySqlCommand(query,c))
        {
            c.Open();
            using (var reader = cmd.ExecuteReader())
                while (reader.Read()) {
                    Convert.ToInt32(reader["stock"]);
                    Convert.ToInt32(reader["minimo"]);
                    Convert.ToDecimal(reader["precio"]);
                }
        }
        Console.WriteLine("PASS: la consulta de Inventario usa columnas válidas y devuelve stock, mínimo y precio.");
        return 0;
    }
}
