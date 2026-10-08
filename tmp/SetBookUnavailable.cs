using System;
using System.IO;
using System.Xml;
using System.Collections.Generic;
using MySql.Data.MySqlClient;
using Newtonsoft.Json.Linq;
class SetBookUnavailable {
  static void Main(string[] args) {
    var root = Path.GetFullPath(args[0]);
    var config = new XmlDocument(); config.Load(Path.Combine(root, "ConnectionStrings.config"));
    using (var connection = new MySqlConnection(config.SelectSingleNode("/connectionStrings/add[@name='ConexionMySQL']").Attributes["connectionString"].Value)) {
      connection.Open();
      using (var transaction = connection.BeginTransaction()) {
        var available = new List<Tuple<string,string,int>>();
        var unavailable = new List<string>();
        using (var command = new MySqlCommand("SELECT isbn,titulo,stock_actual FROM LIBRO WHERE activo=TRUE ORDER BY stock_actual,isbn FOR UPDATE", connection, transaction))
        using (var reader = command.ExecuteReader()) {
          while (reader.Read()) {
            if (reader.GetInt32(2)<=0) unavailable.Add(reader.GetString(1));
            else available.Add(Tuple.Create(reader.GetString(0),reader.GetString(1),reader.GetInt32(2)));
          }
        }
        int remaining = 3 - unavailable.Count;
        if (remaining < 0) throw new Exception("Ya hay más de tres libros sin stock; no se modificaron datos.");
        if (available.Count < remaining) throw new Exception("No hay suficientes libros disponibles.");
        int user;
        using (var command = new MySqlCommand("SELECT u.id_usuario FROM USUARIO u JOIN ROL r ON r.id_rol=u.id_rol WHERE u.estado='activo' AND LOWER(r.nombre) IN ('administrador','administradora','admin') ORDER BY u.id_usuario LIMIT 1", connection, transaction)) {
          var value = command.ExecuteScalar(); if (value == null) throw new Exception("No hay un administrador activo para registrar el ajuste.");
          user = Convert.ToInt32(value);
        }
        var changes = new JArray();
        for (int index=0; index<remaining; index++) {
          var book = available[index]; string isbn=book.Item1, title=book.Item2; int stock=book.Item3;
        using (var command = new MySqlCommand("UPDATE LIBRO SET stock_actual=0 WHERE isbn=@isbn AND stock_actual=@stock", connection, transaction)) {
          command.Parameters.AddWithValue("@isbn", isbn); command.Parameters.AddWithValue("@stock", stock);
          if (command.ExecuteNonQuery()!=1) throw new Exception("El stock cambió durante el ajuste.");
        }
        using (var command = new MySqlCommand("INSERT INTO MOVIMIENTO_STOCK(isbn,id_usuario,tipo_movimiento,motivo,cantidad) VALUES(@isbn,@user,'ajuste','No disponible a solicitud del usuario',@quantity)", connection, transaction)) {
          command.Parameters.AddWithValue("@isbn", isbn); command.Parameters.AddWithValue("@user", user); command.Parameters.AddWithValue("@quantity", -stock); command.ExecuteNonQuery();
        }
        changes.Add(new JObject { ["isbn"] = isbn, ["titulo"] = title, ["stockAnterior"] = stock, ["stockActual"] = 0 });
        unavailable.Add(title);
        }
        var backup = new JObject { ["cambios"] = changes, ["sinStock"] = new JArray(unavailable), ["fechaUTC"] = DateTime.UtcNow.ToString("o") };
        Directory.CreateDirectory(Path.Combine(root,"..","artifacts"));
        File.WriteAllText(Path.Combine(root,"..","artifacts","tres-libros-no-disponibles.json"), backup.ToString());
        transaction.Commit();
        Console.WriteLine(backup.ToString());
      }
    }
  }
}
