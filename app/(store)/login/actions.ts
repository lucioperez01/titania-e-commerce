"use server";

import { signIn, auth } from "@/lib/auth";

export async function loginAction(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const callbackUrl = (formData.get("callbackUrl") as string) || "";

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: callbackUrl || undefined,
    });

    // When redirect: false, NextAuth v5 returns an object with `url` on success.
    if (result && (result as { error?: string }).error) {
      return { error: "Credenciales inválidas" };
    }

    // Fetch session to determine role-based redirect
    const session = await auth();
    const role = (session?.user as { role?: string } | undefined)?.role;

    // Prefer explicit callbackUrl; fall back to role-based default
    const redirectTo = callbackUrl || (role === "ADMIN" ? "/dashboard" : "/");

    return { success: true, role, callbackUrl: redirectTo };
  } catch (error) {
    if (error instanceof Error && error.message.includes("CredentialsSignin")) {
      return { error: "Credenciales inválidas" };
    }
    return { error: "Error al iniciar sesión" };
  }
}

export async function googleSignIn(formData: FormData) {
  const callbackUrl = (formData.get("callbackUrl") as string) || "";

  // Google OAuth requires a browser redirect; signIn() with default redirect: true
  // will issue the redirect to Google, then back to callbackUrl after consent.
  await signIn("google", {
    callbackUrl: callbackUrl || undefined,
  });
}
