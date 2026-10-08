using System.Collections.Generic;
using Newtonsoft.Json;

namespace backend.Models
{
    public class ProveedorHistoricoFilaDto
    {
        public int IdProveedor { get; set; }
        public string RazonSocial { get; set; }
        public int NumeroOrdenes { get; set; }
        public int UnidadesCompradas { get; set; }
        public decimal MontoAcumulado { get; set; }
        public decimal TicketPromedio { get; set; }
        public string PrimeraCompra { get; set; }
        public string UltimaCompra { get; set; }
        public decimal OrdenesPorMes { get; set; }
        public decimal? DiasPromedioEntreOrdenes { get; set; }

        [JsonProperty("id_proveedor")]
        public int IdProveedorSnake => IdProveedor;

        [JsonProperty("razon_social")]
        public string RazonSocialSnake => RazonSocial;

        [JsonProperty("numero_ordenes")]
        public int NumeroOrdenesSnake => NumeroOrdenes;

        [JsonProperty("unidades_compradas")]
        public int UnidadesCompradasSnake => UnidadesCompradas;

        [JsonProperty("monto_acumulado")]
        public decimal MontoAcumuladoSnake => MontoAcumulado;

        [JsonProperty("ticket_promedio")]
        public decimal TicketPromedioSnake => TicketPromedio;

        [JsonProperty("primera_compra")]
        public string PrimeraCompraSnake => PrimeraCompra;

        [JsonProperty("ultima_compra")]
        public string UltimaCompraSnake => UltimaCompra;

        [JsonProperty("ordenes_por_mes")]
        public decimal OrdenesPorMesSnake => OrdenesPorMes;

        [JsonProperty("dias_promedio_entre_ordenes")]
        public decimal? DiasPromedioEntreOrdenesSnake => DiasPromedioEntreOrdenes;

        public bool ShouldSerializeIdProveedorSnake() => true;
        public bool ShouldSerializeRazonSocialSnake() => true;
        public bool ShouldSerializeNumeroOrdenesSnake() => true;
        public bool ShouldSerializeUnidadesCompradasSnake() => true;
        public bool ShouldSerializeMontoAcumuladoSnake() => true;
        public bool ShouldSerializeTicketPromedioSnake() => true;
        public bool ShouldSerializePrimeraCompraSnake() => true;
        public bool ShouldSerializeUltimaCompraSnake() => true;
        public bool ShouldSerializeOrdenesPorMesSnake() => true;
        public bool ShouldSerializeDiasPromedioEntreOrdenesSnake() => true;
    }

    public class ReporteHistoricoResponseDto
    {
        public string Desde { get; set; }
        public string Hasta { get; set; }
        public int TotalOrdenes { get; set; }
        public int TotalUnidades { get; set; }
        public decimal TotalMonto { get; set; }
        public List<ProveedorHistoricoFilaDto> Proveedores { get; set; } = new List<ProveedorHistoricoFilaDto>();

        [JsonProperty("total_ordenes")]
        public int TotalOrdenesSnake => TotalOrdenes;

        [JsonProperty("total_unidades")]
        public int TotalUnidadesSnake => TotalUnidades;

        [JsonProperty("total_monto")]
        public decimal TotalMontoSnake => TotalMonto;

        public bool ShouldSerializeTotalOrdenesSnake() => true;
        public bool ShouldSerializeTotalUnidadesSnake() => true;
        public bool ShouldSerializeTotalMontoSnake() => true;
    }
}
