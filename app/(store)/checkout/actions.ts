"use server";

import { prisma } from "@/infrastructure/db/prismaClient";
import { revalidatePath } from "next/cache";

export interface ConsentResult {
  success: boolean;
  error?: string;
}

export async function saveConsent(mailing: boolean): Promise<ConsentResult> {
  try {
    // Get the current session to find the user
    const { auth } = await import("@/lib/auth");
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Debe iniciar sesión para guardar preferencias",
      };
    }

    const userId = Number(session.user.id);

    await prisma.user.update({
      where: { id: userId },
      data: { mailing },
    });

    revalidatePath("/checkout");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Error al guardar preferencias",
    };
  }
}
