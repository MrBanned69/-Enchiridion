"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ErpIcon from "@/components/ErpIcon";
import "../erp.css";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("Conectando con el servidor...");

    const params = new URLSearchParams();
    params.append('email', event.target.email.value);
    params.append('password', event.target.password.value);

    try {
      const response = await fetch("https://localhost:44379/Login/Ingresar", {
        method: "POST",
        body: params
      });

      const result = await response.json();

      if (result.success) {
        setMessage("¡Acceso concedido! Redirigiendo...");
        
        // Guardamos el rol y el nombre en el navegador
        localStorage.setItem("id_rol", result.id_rol);
        localStorage.setItem("nombre_usuario", result.nombre); 

        // Te manda a la página principal / dashboard
        router.push("/"); 
      } else {
        setMessage(result.error);
      }
    } catch (error) {
      setMessage("Error: No se pudo conectar con el backend de C#.");
    }
  }

  return (
    <main className="erp-screen erp-login" lang="es">
      <section className="erp-login-story" aria-label="Librería ERP">
        <Link href="/" className="erp-brand">
          <span className="erp-brand-icon">
            <ErpIcon name="book" />
          </span>
          <span>
            Librería <b>ERP</b>
            <small>SISTEMA DE GESTIÓN</small>
          </span>
        </Link>
        <div className="erp-story-content">
          <p className="erp-eyebrow">
            CADA LIBRO CUENTA. CADA DETALLE TAMBIÉN.
          </p>
          <h1>
            Todo lo que tu
            <br />
            librería necesita,
            <br />
            <em>en un solo lugar.</em>
          </h1>
          <p>
            Conecta tus compras, ventas, inventario y contabilidad. Más tiempo
            para las historias, menos para los pendientes.
          </p>
        </div>
      </section>
      <section className="erp-login-form-panel" aria-labelledby="login-title">
        <div className="erp-login-form-wrap">
          <span className="erp-login-emblem">
            <ErpIcon name="book" />
          </span>
          <p className="erp-eyebrow">BIENVENIDO DE NUEVO</p>
          <h2 id="login-title">Inicia sesión</h2>
          <p className="erp-login-intro">
            Ingresa tus datos para acceder a tu espacio de trabajo.
          </p>
          <form onSubmit={handleSubmit} className="erp-login-form">
            <label htmlFor="email">Correo electrónico</label>
            <div className="erp-input-wrap">
              <ErpIcon name="mail" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="tu.correo@libreria.cl"
                autoComplete="username"
                maxLength={100}
                required
                onChange={() => setMessage("")}
              />
            </div>
            <label htmlFor="password">Contraseña</label>
            <div className="erp-input-wrap">
              <ErpIcon name="lock" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                required
                onChange={() => setMessage("")}
              />
              <button
                type="button"
                className="erp-password-toggle"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
              >
                <ErpIcon name={showPassword ? "eyeOff" : "eye"} />
              </button>
            </div>
            {message && (
              <p id="login-message" className="erp-login-message" role="status">
                {message}
              </p>
            )}
            <button className="erp-primary-button" type="submit">
              Ingresar
              <ErpIcon name="arrow" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}