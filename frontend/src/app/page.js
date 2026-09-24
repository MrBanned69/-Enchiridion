import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Encabezado */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Resumen general de la librería
            </p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Ventas del día"
              value="$1.250.000"
              description="+12,5% respecto a ayer"
              icon="💰"
            />

            <StatCard
              title="Stock crítico"
              value="24"
              description="Títulos requieren reposición"
              icon="📦"
            />

            <StatCard
              title="Cuentas por pagar"
              value="$850.000"
              description="Vencimientos próximos"
              icon="💳"
            />

            <StatCard
              title="Recepciones"
              value="7"
              description="Pendientes de validación"
              icon="🚚"
            />
          </div>

          {/* Gráfico + órdenes */}
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Gráfico */}
            <div className="rounded-xl bg-white p-6 shadow-sm xl:col-span-2">
              <div className="mb-5">
                <h2 className="font-semibold text-slate-800">
                  Ventas últimos 30 días
                </h2>

                <p className="text-sm text-slate-500">
                  Evolución de las ventas de la librería
                </p>
              </div>

              <div className="flex h-64 items-end gap-2">
                {[35, 48, 42, 60, 55, 72, 65, 80, 68, 90, 75, 85, 70, 95].map(
                  (height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-md bg-blue-600"
                      style={{ height: `${height}%` }}
                    />
                  )
                )}
              </div>
            </div>

            {/* Aprobaciones */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="font-semibold text-slate-800">
                  Órdenes pendientes
                </h2>

                <p className="text-sm text-slate-500">
                  Requieren aprobación
                </p>
              </div>

              <div className="space-y-4">
                <Order
                  code="OC-00124"
                  supplier="Editorial Planeta"
                  amount="$485.000"
                />

                <Order
                  code="OC-00125"
                  supplier="Editorial SM"
                  amount="$320.000"
                />
              </div>
            </div>
          </div>

          {/* Libros + actividad */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Libros */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-800">
                📚 Libros más vendidos
              </h2>

              <p className="mb-5 text-sm text-slate-500">
                Títulos con mayor rotación del mes
              </p>

              <div className="space-y-4">
                {[
                  ["El Principito", "Antoine de Saint-Exupéry", "128 ventas"],
                  ["1984", "George Orwell", "104 ventas"],
                  [
                    "Cien años de soledad",
                    "Gabriel García Márquez",
                    "97 ventas",
                  ],
                  ["Harry Potter", "J. K. Rowling", "89 ventas"],
                  ["El Hobbit", "J. R. R. Tolkien", "76 ventas"],
                ].map(([title, author, sales], index) => (
                  <div
                    key={title}
                    className="flex items-center gap-4 border-b border-slate-100 pb-3 last:border-0"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                      {index + 1}
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-slate-700">
                        {title}
                      </p>

                      <p className="text-xs text-slate-400">
                        {author}
                      </p>
                    </div>

                    <span className="text-sm font-medium text-slate-600">
                      {sales}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actividad */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-800">
                🕐 Actividad reciente
              </h2>

              <p className="mb-5 text-sm text-slate-500">
                Últimos eventos registrados
              </p>

              <div className="space-y-5">
                <Activity
                  title="Venta registrada"
                  description="Boleta #B-002341"
                  time="Hace 5 minutos"
                />

                <Activity
                  title="Stock actualizado"
                  description="El Principito +20 unidades"
                  time="Hace 18 minutos"
                />

                <Activity
                  title="Recepción registrada"
                  description="Editorial Planeta"
                  time="Hace 32 minutos"
                />

                <Activity
                  title="Orden aprobada"
                  description="OC-00120"
                  time="Hace 1 hora"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Order({ code, supplier, amount }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-700">{code}</span>

        <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
          Pendiente
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-500">{supplier}</p>

      <p className="mt-1 font-semibold text-slate-700">{amount}</p>

      <div className="mt-3 flex gap-2">
        <button className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
          Aprobar
        </button>

        <button className="flex-1 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200">
          Rechazar
        </button>
      </div>
    </div>
  );
}

function Activity({ title, description, time }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-blue-600" />

      <div>
        <p className="font-medium text-slate-700">{title}</p>

        <p className="text-sm text-slate-500">{description}</p>

        <p className="mt-1 text-xs text-slate-400">{time}</p>
      </div>
    </div>
  );
}