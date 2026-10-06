"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ErpIcon from "@/components/ErpIcon";
import { useAuth } from "@/components/AuthProvider";
import "../erp.css";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setMessage("");

    try {
      await login(form.get("email"), form.get("password"));
      router.replace("/");
    } catch (error) {
      setMessage(error.message || "No se pudo iniciar sesión.");
    } finally {
      setSubmitting(false);
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
          <div className="erp-book-illustration" aria-hidden="true">
            <div className="erp-illustration-circle" />
            <div className="erp-illustrated-book book-one">
              <span>
                HISTORIAS
                <br />
                QUE CRECEN
              </span>
              <ErpIcon name="book" />
            </div>
            <div className="erp-illustrated-book book-two">
              <span>
                UN NUEVO
                <br />
                CAPÍTULO
              </span>
              <span className="erp-book-orbit" />
            </div>
            <div className="erp-illustrated-book book-three">
              <span>
                EL ARTE
                <br />
                DE LEER
              </span>
              <ErpIcon name="book" />
            </div>
            <div className="erp-book-shelf" />
          </div>
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
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
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
            <button
              className="erp-primary-button"
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? "Ingresando…" : "Ingresar"}
              <ErpIcon name="arrow" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
