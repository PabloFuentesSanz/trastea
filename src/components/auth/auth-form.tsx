"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export function AuthForm({ mode }: { mode: "login" | "registro" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!isSupabaseConfigured()) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Modo demo</CardTitle>
          <CardDescription>
            Supabase no está configurado, así que no hay cuentas. Puedes explorar
            la app igualmente; el progreso no se guardará.
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

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
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
            Te hemos enviado un enlace de confirmación. Al pulsarlo podrás iniciar
            sesión.
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email && (
              <p role="alert" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            {errors.password && (
              <p role="alert" className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          {serverError && (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Un momento…"
              : mode === "login"
                ? "Entrar"
                : "Crear cuenta"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              ¿Sin cuenta?{" "}
              <Link href="/registro" className="text-primary underline-offset-4 hover:underline">
                Regístrate
              </Link>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                Entra
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
