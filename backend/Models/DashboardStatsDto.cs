using System.Collections.Generic;

namespace backend.Models
{
    public class MetricDto
    {
        public string Title { get; set; }
        public string Value { get; set; }
        public string Detail { get; set; }
        public string Icon { get; set; }
        public string Tone { get; set; }
    }

    public class DashboardStatsDto
    {
        public List<MetricDto> Metrics { get; set; }
        public int TotalLibros { get; set; }
        public int StockCriticoCount { get; set; }
        public decimal VentasTotal { get; set; }
        public int RecepcionesPendientes { get; set; }
    }
}
