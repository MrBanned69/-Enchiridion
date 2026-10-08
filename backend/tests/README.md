# Integración de Ventas y Contabilidad

Cada nueva venta genera un asiento con referencia a `VENTA.id_venta`, dentro de la misma transacción que los detalles y el movimiento de stock. Se debita Caja para efectivo o Banco para tarjeta/transferencia; se acreditan ingresos e IVA débito fiscal. El costo de los libros se debita a Costo de ventas y se acredita a Inventario, con el costo vigente al registrar la venta.

El período se determina por la fecha guardada en MySQL. Si no existe, se crea abierto; si está cerrado, se rechaza la operación completa. Las cuentas necesarias se crean si faltan, conservando las existentes.

Contabilidad consulta los asientos guardados, los períodos y el plan de cuentas de MySQL. No usa los asientos de ejemplo del frontend. Permite actualizar, filtrar y exportar el libro diario. La consulta requiere una sesión de administrador o contador; el registro requiere administrador o vendedor.

Los asientos históricos existentes se muestran. Las ventas antiguas sin asiento no se reconstruyen automáticamente, porque sus costos históricos no están guardados en `DETALLE_VENTA`.

## Validación

Desde la raíz del repositorio, compilar el backend y el ejecutable de prueba:

```powershell
& 'C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Current\Bin\MSBuild.exe' backend/backend.csproj /t:Build /p:Configuration=Debug /verbosity:minimal /nologo
& backend/bin/roslyn/csc.exe /nologo /target:exe /out:backend/bin/VentaAccountingTest.exe /reference:backend/bin/backend.dll /reference:backend/bin/MySql.Data.dll /reference:System.Data.dll /reference:System.Web.dll backend/tests/VentaAccountingTest.cs
& backend/bin/VentaAccountingTest.exe (Resolve-Path backend).Path
```

La prueba usa la conexión configurada en `ConnectionStrings.config` y tablas temporales privadas que desaparecen al cerrar la conexión. No modifica los registros del ERP. Comprueba los tres medios de pago, el IVA, el costo, el cuadre y la reversión ante período cerrado o error de inserción contable. Requiere acceso a MySQL y permiso de crear tablas temporales.

Desde `frontend`:

```powershell
node --experimental-vm-modules --test tests/accounting-routes.test.cjs tests/auth-route.test.cjs
```

Para comprobar la interfaz, iniciar sesión como vendedor o administrador, registrar una venta y revisar el número de asiento en la confirmación. Como contador o administrador, abrir Contabilidad, seleccionar el período de esa venta y filtrar por Ventas. El botón Actualizar vuelve a consultar los registros.
