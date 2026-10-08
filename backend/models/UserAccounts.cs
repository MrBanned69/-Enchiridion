using System;
using System.Net.Mail;
using System.Text;
using System.Web;
using MySql.Data.MySqlClient;

namespace backend.Models
{
    public static class UserAccounts
    {
        public static readonly string[] StaffRoles = { "administrador", "administradora", "admin", "comprador", "compradora", "vendedor", "vendedora", "contador", "contadora" };
        public static readonly string[] AdminRoles = { "administrador", "administradora", "admin" };

        public static void Validate(string name, string email, string password, bool requirePassword)
        {
            if (string.IsNullOrWhiteSpace(name) || name.Trim().Length > 100)
                throw new HttpException(400, "Ingresa un nombre de hasta 100 caracteres.");
            try {
                if (string.IsNullOrWhiteSpace(email) || email.Trim().Length > 100 || new MailAddress(email.Trim()).Address != email.Trim())
                    throw new FormatException();
            } catch { throw new HttpException(400, "Ingresa un correo electrónico válido."); }
            if ((requirePassword || !string.IsNullOrEmpty(password)) &&
                (string.IsNullOrEmpty(password) || password.Length < 8 || Encoding.UTF8.GetByteCount(password) > 72))
                throw new HttpException(400, "La contraseña debe tener al menos 8 caracteres y no ser demasiado larga.");
        }

        public static int Create(MySqlConnection connection, MySqlTransaction transaction, string name, string email, string password, int roleId, string status)
        {
            Validate(name, email, password, true);
            using (var command = new MySqlCommand(@"INSERT INTO USUARIO
                (id_rol, nombre, correo, password_hash, fecha_ultimo_cambio_pass, estado)
                VALUES (@role, @name, @email, @hash, CURRENT_DATE(), @status)", connection, transaction))
            {
                command.Parameters.AddWithValue("@role", roleId);
                command.Parameters.AddWithValue("@name", name.Trim());
                command.Parameters.AddWithValue("@email", email.Trim().ToLowerInvariant());
                command.Parameters.AddWithValue("@hash", BCrypt.Net.BCrypt.HashPassword(password, 11));
                command.Parameters.AddWithValue("@status", status);
                command.ExecuteNonQuery();
                return checked((int)command.LastInsertedId);
            }
        }

        public static string ValidateCustomer(string rut, string type)
        {
            var normalized = (rut ?? "").Replace(".", "").Replace("-", "").Trim().ToUpperInvariant();
            if (normalized.Length < 2 || normalized.Length > 9) throw new HttpException(400, "Ingresa un RUT válido.");
            var body = normalized.Substring(0, normalized.Length - 1);
            int number;
            if (!int.TryParse(body, out number) || number <= 0) throw new HttpException(400, "Ingresa un RUT válido.");
            var digits = number.ToString();
            int sum = 0, factor = 2;
            for (int index = digits.Length - 1; index >= 0; index--) {
                sum += (digits[index] - '0') * factor;
                factor = factor == 7 ? 2 : factor + 1;
            }
            var check = 11 - sum % 11;
            var expected = check == 11 ? "0" : check == 10 ? "K" : check.ToString();
            if (expected != normalized.Substring(normalized.Length - 1)) throw new HttpException(400, "El dígito verificador del RUT no es válido.");
            if (type != "persona" && type != "colegio" && type != "empresa") throw new HttpException(400, "Tipo de cliente no válido.");
            return digits + "-" + expected;
        }

        public static void SaveCustomer(MySqlConnection connection, MySqlTransaction transaction, int userId, string name, string rut, string type)
        {
            var normalized = ValidateCustomer(rut, type);
            object linkedId;
            using (var command = new MySqlCommand("SELECT id_cliente FROM USUARIO WHERE id_usuario=@id FOR UPDATE", connection, transaction)) {
                command.Parameters.AddWithValue("@id", userId);
                linkedId = command.ExecuteScalar();
            }
            // Compare canonical RUTs, including the dotted format used by existing sales records.
            using (var command = new MySqlCommand(@"SELECT id_cliente FROM CLIENTE
                WHERE UPPER(REPLACE(REPLACE(rut,'.',''),'-',''))=@rut AND id_cliente<>@linked LIMIT 1 FOR UPDATE", connection, transaction)) {
                command.Parameters.AddWithValue("@rut", normalized.Replace("-", ""));
                command.Parameters.AddWithValue("@linked", linkedId == null || linkedId == DBNull.Value ? 0 : linkedId);
                if (command.ExecuteScalar() != null) throw new HttpException(409, "Ese RUT ya está registrado como cliente. Solicita al administrador revisar tu cuenta.");
            }
            var exists = linkedId != null && linkedId != DBNull.Value;
            using (var command = new MySqlCommand(exists ? "UPDATE CLIENTE SET nombre=@name,rut=@rut,tipo_cliente=@type WHERE id_cliente=@id" :
                "INSERT INTO CLIENTE(nombre,rut,tipo_cliente) VALUES(@name,@rut,@type)", connection, transaction)) {
                command.Parameters.AddWithValue("@name", name.Trim());
                command.Parameters.AddWithValue("@rut", normalized);
                command.Parameters.AddWithValue("@type", type);
                if (exists) command.Parameters.AddWithValue("@id", linkedId);
                command.ExecuteNonQuery();
                if (!exists) linkedId = command.LastInsertedId;
            }
            using (var command = new MySqlCommand("UPDATE USUARIO SET id_cliente=@customer WHERE id_usuario=@id", connection, transaction)) {
                command.Parameters.AddWithValue("@customer", linkedId);
                command.Parameters.AddWithValue("@id", userId);
                command.ExecuteNonQuery();
            }
        }
    }
}
