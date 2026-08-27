"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  validateCredentials,
  type CredentialErrors,
  type Credentials,
} from "@/lib/auth/credentials";

export function AuthForm({ mode }: { mode: "login" | "registro" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const [values, setValues] = useState<Credentials>({ email: "", password: "" });
  const [errors, setErrors] = useState<CredentialErrors>({});
  const [submitting, setSubmitting] = useState(false);
  /** hasta el primer envío no se corrige nada: molesta escribir con el error puesto */
  const [tocado, setTocado] = useState(false);

  const cambiar = (campo: keyof Credentials) => (e: ChangeEvent<HTMLInputElement>) => {
    const siguientes = { ...values, [campo]: e.target.value };
    setValues(siguientes);
    if (tocado) setErrors(validateCredentials(siguientes));
  };

  if (!isSupabaseConfigured()) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Modo demo</CardTitle>
          <CardDescription>
            Supabase no está configurado, así que no hay cuentas. Puedes explorar la app
            igualmente; el progreso no se guardará.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/">Entrar en modo demo</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTocado(true);
    setServerError(null);

    const encontrados = validateCredentials(values);
    setErrors(encontrados);
    if (encontrados.email || encontrados.password) return;

    setSubmitting(true);
    try {
      await enviar();
    } finally {
      setSubmitting(false);
    }
  };

  const enviar = async () => {
    const supabase = createClient();

    if (mode === "registro") {
      const { data, error } = await supabase.auth.signUp(values);
      if (error) return setServerError(error.message);
      if (!data.session) return setNeedsConfirm(true);
      router.push("/onboarding");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setServerError(
        error.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos"
          : error.message,
      );
      return;
    }
    router.push(searchParams.get("next") ?? "/");
    router.refresh();
  };

  if (needsConfirm) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Revisa tu correo 📬</CardTitle>
          <CardDescription>
            Te hemos enviado un enlace de confirmación. Al pulsarlo podrás iniciar sesión.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Entrar" : "Crear cuenta"}</CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Tu progreso te espera donde lo dejaste."
            : "Una cuenta, todo tu progreso guardado."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={cambiar("email")}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="text-destructive text-sm">
                {errors.email}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={values.password}
              onChange={cambiar("password")}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <p id="password-error" role="alert" className="text-destructive text-sm">
                {errors.password}
              </p>
            )}
          </div>
          {serverError && (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Un momento…" : mode === "login" ? "Entrar" : "Crear cuenta"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              ¿Sin cuenta?{" "}
              <Link
                href="/registro"
                className="text-primary underline-offset-4 hover:underline"
              >
                Regístrate
              </Link>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                Entra
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
