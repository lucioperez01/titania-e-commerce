"use server";

import { signIn } from "@/lib/auth";

export async function loginAction(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes("CredentialsSignin")) {
      return { error: "Credenciales inválidas" };
    }
    return { error: "Error al iniciar sesión" };
  }
}

export async function googleSignIn() {
  "use server";
  await signIn("google", { redirectTo: "/" });
}
