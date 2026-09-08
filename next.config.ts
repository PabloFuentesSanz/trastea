import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /**
     * Cuánto reutiliza el router del cliente una página ya visitada antes de
     * volver a pedirla. Por defecto las páginas con datos de usuario se
     * repiden en cada ida y vuelta (0 s): al volver de un ejercicio a la
     * lección, otra espera. Medio minuto es suficiente para que ir y venir
     * sea instantáneo; lo que cambia de verdad (completar un bloque) refresca
     * a mano.
     */
    staleTimes: { dynamic: 30, static: 300 },
  },
};

export default nextConfig;
