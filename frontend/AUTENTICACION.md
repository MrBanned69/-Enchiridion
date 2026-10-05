# Login y sesión del ERP

El navegador consulta `/api/auth` en Next.js. Next.js se comunica con
`LoginController` de ASP.NET, que valida el correo y el hash BCrypt en MySQL.
El usuario se obtiene de las tablas existentes USUARIO y ROL; no se modificó el SQL.

## Ejecución local

1. Inicia el proyecto backend en Visual Studio con IIS Express.
2. Inicia el frontend con `npm run dev` y abre `/login`.
3. Usa una cuenta activa existente en USUARIO, con un password_hash BCrypt válido
   y un rol registrado en ROL.

La dirección predeterminada del backend es `https://localhost:44379`, igual que
en el login anterior. Si cambia, crea `frontend/.env.local` con:

```env
ERP_BACKEND_URL=https://localhost:44379
```

Reinicia Next.js después de cambiar esta configuración.

Para HTTPS local, Node debe confiar en el certificado de IIS Express. Con Node
24 y un certificado ya confiable en Windows, puedes iniciar Next.js desde PowerShell:

```powershell
$env:NODE_USE_SYSTEM_CA = "1"
npm run dev
```

También puedes definir NODE_EXTRA_CA_CERTS con la ruta de un certificado confiable.
No desactives la validación TLS. Si IIS Express ofrece un puerto HTTP local,
puedes usarlo en ERP_BACKEND_URL durante el desarrollo.

## Uso desde otras pantallas

AuthProvider está montado en el layout raíz y comparte la sesión en todo el frontend:

```jsx
"use client";
import { useAuth } from "@/components/AuthProvider";

export default function Perfil() {
  const { usuario, loading } = useAuth();
  if (loading || !usuario) return null;
  return (
    <p>
      {usuario.nombre} · {usuario.rol}
    </p>
  );
}
```

El comprobante cifrado de ASP.NET dura ocho horas y se guarda en una cookie
HttpOnly, SameSite=Lax, Secure en producción. No se guarda la contraseña ni se
confía en localStorage para autenticar. Cada consulta de sesión vuelve a verificar
que la cuenta esté activa y obtiene el nombre y rol actuales de MySQL.

El home comprueba la sesión al cargar y al volver a la ventana; sin sesión,
redirige a /login. Cerrar sesión elimina la cookie y el usuario del contexto.
Los indicadores del dashboard siguen siendo datos de demostración.

Los futuros endpoints de negocio deberán validar el comprobante y los permisos
en el backend; mostrar un rol en la interfaz no autoriza operaciones.

## Verificación

Desde frontend:

```powershell
npm run lint
npm run build
node --experimental-vm-modules --test tests/auth-route.test.cjs
```

Las pruebas ejercitan la ruta de Next.js con respuestas simuladas del backend:
validación, cookie HttpOnly, recuperación del perfil, expiración, indisponibilidad
y cierre de sesión. Para verificar el acceso completo a MySQL hace falta iniciar
IIS Express y usar una cuenta activa de la base de datos.
