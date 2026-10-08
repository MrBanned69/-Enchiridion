# Integración de Ventas y Contabilidad

## Usuarios y clientes

Administración consulta usuarios reales y permite crear, editar, asignar perfiles,
restablecer contraseñas, desactivar y reactivar cuentas. Solo los administradores
pueden usar estos endpoints. La desactivación conserva las referencias históricas.
No se permite quitar el acceso a la propia cuenta administradora ni al último
administrador activo.

El registro público crea exclusivamente cuentas Cliente y una ficha en CLIENTE
con nombre, RUT validado y tipo Persona. Solo Administración puede cambiar el tipo
a Persona, Colegio o Empresa. Ambas se guardan en una
transacción. Un RUT ya registrado requiere revisión administrativa; el registro
público no se apropia de fichas existentes. Catálogo y Mi perfil son los únicos
módulos visibles para clientes. Actualizar datos personales exige la contraseña
actual y usa siempre la identidad de la sesión.

Las instalaciones existentes requieren las migraciones de MySql/migrations.
La migración local puede aplicarse con la prueba de integración en modo --migrate;
ese modo crea el rol Cliente si falta y agrega el vínculo USUARIO.id_cliente solo
si no existe. No modifica las cuentas existentes.

```powershell
& backend/bin/roslyn/csc.exe /nologo /target:exe /out:backend/bin/UserManagementIntegrationTest.exe /reference:backend/bin/backend.dll /reference:backend/bin/MySql.Data.dll /reference:backend/bin/Newtonsoft.Json.dll /reference:System.Data.dll /reference:System.Web.dll backend/tests/UserManagementIntegrationTest.cs
& backend/bin/UserManagementIntegrationTest.exe (Resolve-Path backend).Path --migrate
# Con backend en http://localhost:5000 y frontend en http://localhost:3000:
& backend/bin/UserManagementIntegrationTest.exe (Resolve-Path backend).Path
```

La prueba crea cuentas y fichas de cliente temporales con correos exclusivos,
verifica registro, edición, desactivación, reactivación, cookies y aislamiento
entre perfiles; después elimina únicamente esos registros de prueba. Los datos
de la librería permanecen intactos.

Pruebas de rutas y permisos del frontend, desde frontend:

```powershell
node --experimental-vm-modules --test tests/user-management.test.cjs tests/auth-route.test.cjs
```

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

## Inicio conectado a MySQL

`/Dashboard/Resumen` requiere una sesión activa y consulta una vista consistente de los datos. Ventas del día y del gráfico suman el total de ventas pagadas, incluyendo las históricas; excluyen pendientes, anuladas y fechas futuras. El gráfico muestra los siete días hasta hoy y compara con los siete anteriores. El ranking mensual suma unidades vendidas hasta hoy. Los días se determinan con la zona horaria de Chile.

Stock crítico cuenta libros activos con stock igual o inferior al mínimo. Cuentas por pagar suma facturas de proveedores pendientes. Recepciones pendientes cuenta órdenes aprobadas sin recepción. El inicio muestra hasta cinco órdenes pendientes y seis movimientos recientes. Las notificaciones usan los mismos conteos.

La página vuelve a consultar al abrirse, recuperar el foco, volver a una pestaña visible y cada minuto mientras está visible. También tiene un botón Actualizar. Ante un error muestra un mensaje y no sustituye los registros con datos de ejemplo.

Prueba de los cálculos con tablas temporales privadas:

```powershell
& backend/bin/roslyn/csc.exe /nologo /target:exe /out:backend/bin/DashboardDataTest.exe /reference:backend/bin/backend.dll /reference:backend/bin/MySql.Data.dll /reference:System.Data.dll backend/tests/DashboardDataTest.cs
& backend/bin/DashboardDataTest.exe (Resolve-Path backend).Path
```

Comprueba bases vacías, estados de venta, límites de semana/mes/año, ranking, stock, facturas, recepciones y actividad. Desde `frontend`, incluir `tests/dashboard.test.cjs` en el comando de pruebas de Node para verificar la ruta y la presentación de fechas y comparaciones.
