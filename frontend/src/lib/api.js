const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Error al iniciar sesión.");
  }
  return data;
}

export async function fetchLibros() {
  const response = await fetch(`${API_BASE_URL}/libros`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("No se pudo obtener el catálogo de libros.");
  }
  return await response.json();
}

export async function fetchDashboardStats() {
  const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("No se pudieron obtener las estadísticas del sistema.");
  }
  return await response.json();
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("erp_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem("erp_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("erp_user");
  }
}
