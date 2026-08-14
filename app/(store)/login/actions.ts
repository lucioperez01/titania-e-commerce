"use server";

import { signIn } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function loginAction(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
    revalidatePath("/");
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
