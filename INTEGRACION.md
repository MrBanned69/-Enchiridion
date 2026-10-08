# Integración de Frontend-pantallas(L)

La integración se realiza en `Frontend-pantallas(L)` y conserva `main` como base. Inicio, inventario, ventas, reportes y contabilidad mantienen la implementación de main. La extensión aporta el catálogo Web API y los scripts de inicio.

La única autenticación es `/api/auth` de Next.js, que llama a `/Login/Ingresar` y valida contraseñas BCrypt. La cookie HttpOnly `erp_session` se transmite como Bearer desde el servidor de Next.js. Se retiró el login duplicado que aceptaba una contraseña fija y no generaba sesión.

Todos los módulos usan `ERP_BACKEND_URL` exclusivamente en el servidor. Su valor predeterminado es `http://localhost:5000`, igual que `start-dev.ps1`. Para usar IIS Express desde Visual Studio con otro puerto, establecer `ERP_BACKEND_URL` en `frontend/.env.local` y reiniciar Next.js. No establecer `NEXT_PUBLIC_API_URL`.

El catálogo se consulta con `/api/libros` en Next.js y `/api/libros` en ASP.NET. Exige una sesión activa, muestra libros activos y devuelve errores sin detalles internos. Los clientes pueden usar `fetchLibros` de `src/lib/api.js`.

`backend/ConnectionStrings.config` debe contener la entrada `ConexionMySQL`. Este archivo contiene credenciales y no se publica. Las consultas de inventario usan `stock_actual` y `precio_venta` del esquema SQL.

Validación desde frontend:

```powershell
node --experimental-vm-modules --test tests/*.test.cjs tests/*.test.mjs
npm run lint
npm run build -- --webpack
```

Compilar el backend con MSBuild y ejecutar las pruebas de integración descritas en `backend/tests/README.md` para comprobar MySQL. Las pruebas de rutas simulan ASP.NET y no sustituyen las pruebas de base de datos.
