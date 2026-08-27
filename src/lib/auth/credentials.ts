/**
 * Validación del formulario de acceso. Pura y sin librería: son dos campos, y
 * traerse zod + react-hook-form costaba 74 kB en las dos páginas que ve
 * primero quien acaba de llegar.
 *
 * Quien decide de verdad si el email existe es Supabase; esto sólo evita el
 * viaje al servidor cuando el error se ve a simple vista.
 */

export interface Credentials {
  email: string;
  password: string;
}

export type CredentialErrors = Partial<Record<keyof Credentials, string>>;

export const MIN_PASSWORD = 8;

// algo@algo.tld, sin espacios, sin puntos pegados y con tld de dos letras o más
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;

export function validateCredentials({ email, password }: Credentials): CredentialErrors {
  const errors: CredentialErrors = {};

  const limpio = email.trim();
  if (limpio === "") errors.email = "Escribe tu email";
  else if (!EMAIL.test(limpio)) errors.email = "Email inválido";

  // la contraseña no se recorta: un espacio es un carácter como otro cualquiera
  if (password.length < MIN_PASSWORD)
    errors.password = `Mínimo ${MIN_PASSWORD} caracteres`;

  return errors;
}
