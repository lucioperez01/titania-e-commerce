"use client";

import { useActionState } from "react";
import { registerAction } from "./actions";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [state, formAction] = useActionState(registerAction, null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className=" flex items-center justify-center bg-transparent self-baseline h-full">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6">Crear cuenta</h1>

        {state?.error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {state.error}
          </div>
        )}

        <form
          action={formAction}
          onSubmit={() => setIsSubmitting(true)}
          className="space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-md font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              disabled={isSubmitting}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-md font-medium text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={8}
              disabled={isSubmitting}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-gray-500">Mínimo 8 caracteres</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-md font-medium text-gray-700">
                Nombre
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                disabled={isSubmitting}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-md font-medium text-gray-700">
                Apellido
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                disabled={isSubmitting}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-purple-600 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
