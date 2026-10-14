"use server"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/infrastructure/db/prismaClient"
import { revalidatePath } from "next/cache"

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProfileData = {
  id: number
  firstName: string | null
  lastName: string | null
  email: string
  phone: string | null
  mailing: boolean
  address: string | null
}

export type AddressData = {
  id: number
  fullName: string
  phone: string
  line1: string
  line2: string | null
  city: string
  province: string
  postalCode: string
  country: string
  isDefault: boolean
}

export type UpdateProfileInput = {
  firstName: string
  lastName: string
  phone?: string
  mailing: boolean
}

export type AddressInput = {
  fullName: string
  phone: string
  line1: string
  line2?: string
  city: string
  province: string
  postalCode: string
  country?: string
  isDefault?: boolean
}

export type ActionResult = {
  success: boolean
  error?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireUserId(): Promise<number> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }
  return Number(session.user.id)
}

// ─── Profile Actions ─────────────────────────────────────────────────────────

export async function getProfile(): Promise<ProfileData> {
  const userId = await requireUserId()

  const user = await prisma.user.findUnique({
    where: { id: userId, isDeleted: false },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      mailing: true,
      address: true,
    },
  })

  if (!user) {
    redirect("/login")
  }

  return user
}

export async function updateProfile(data: UpdateProfileInput): Promise<ActionResult> {
  const userId = await requireUserId()

  // Server-side validation
  const firstName = data.firstName?.trim()
  const lastName = data.lastName?.trim()
  const phone = data.phone?.trim()

  if (!firstName || firstName.length > 100) {
    return { success: false, error: "El nombre es obligatorio y no puede superar los 100 caracteres." }
  }
  if (!lastName || lastName.length > 100) {
    return { success: false, error: "El apellido es obligatorio y no puede superar los 100 caracteres." }
  }
  if (phone && !/^\d{10,15}$/.test(phone)) {
    return { success: false, error: "El telefono debe contener entre 10 y 15 digitos numericos." }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      firstName,
      lastName,
      phone: phone || null,
      mailing: data.mailing,
    },
  })

  revalidatePath("/account/profile")
  return { success: true }
}

// ─── Address Actions ─────────────────────────────────────────────────────────

export async function getAddresses(): Promise<AddressData[]> {
  const userId = await requireUserId()

  const addresses = await prisma.address.findMany({
    where: { userId, isDeleted: false },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  })

  return addresses.map((addr) => ({
    id: addr.id,
    fullName: addr.fullName,
    phone: addr.phone,
    line1: addr.line1,
    line2: addr.line2,
    city: addr.city,
    province: addr.province,
    postalCode: addr.postalCode,
    country: addr.country,
    isDefault: addr.isDefault,
  }))
}

export async function addAddress(data: AddressInput): Promise<ActionResult & { addressId?: number }> {
  const userId = await requireUserId()

  // Validation
  const fullName = data.fullName?.trim()
  const phone = data.phone?.trim()
  const line1 = data.line1?.trim()
  const city = data.city?.trim()
  const province = data.province?.trim()
  const postalCode = data.postalCode?.trim()

  if (!fullName || fullName.length > 200) {
    return { success: false, error: "El nombre completo es obligatorio." }
  }
  if (!phone || !/^\d{10,15}$/.test(phone)) {
    return { success: false, error: "El telefono debe contener entre 10 y 15 digitos numericos." }
  }
  if (!line1 || line1.length > 300) {
    return { success: false, error: "La direccion es obligatoria." }
  }
  if (!city || city.length > 100) {
    return { success: false, error: "La ciudad es obligatoria." }
  }
  if (!province || province.length > 100) {
    return { success: false, error: "La provincia es obligatoria." }
  }
  if (!postalCode || postalCode.length > 20) {
    return { success: false, error: "El codigo postal es obligatorio." }
  }

  // If this address is set as default, clear other defaults first
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDeleted: false, isDefault: true },
      data: { isDefault: false },
    })
  }

  const address = await prisma.address.create({
    data: {
      userId,
      fullName,
      phone,
      line1,
      line2: data.line2?.trim() || null,
      city,
      province,
      postalCode,
      country: data.country?.trim() || "AR",
      isDefault: data.isDefault ?? false,
    },
  })

  revalidatePath("/account/profile")
  return { success: true, addressId: address.id }
}

export async function updateAddress(id: number, data: AddressInput): Promise<ActionResult> {
  const userId = await requireUserId()

  // Verify ownership
  const existing = await prisma.address.findFirst({
    where: { id, userId, isDeleted: false },
  })
  if (!existing) {
    return { success: false, error: "La direccion no existe o no tienes permiso para editarla." }
  }

  // Validation
  const fullName = data.fullName?.trim()
  const phone = data.phone?.trim()
  const line1 = data.line1?.trim()
  const city = data.city?.trim()
  const province = data.province?.trim()
  const postalCode = data.postalCode?.trim()

  if (!fullName || fullName.length > 200) {
    return { success: false, error: "El nombre completo es obligatorio." }
  }
  if (!phone || !/^\d{10,15}$/.test(phone)) {
    return { success: false, error: "El telefono debe contener entre 10 y 15 digitos numericos." }
  }
  if (!line1 || line1.length > 300) {
    return { success: false, error: "La direccion es obligatoria." }
  }
  if (!city || city.length > 100) {
    return { success: false, error: "La ciudad es obligatoria." }
  }
  if (!province || province.length > 100) {
    return { success: false, error: "La provincia es obligatoria." }
  }
  if (!postalCode || postalCode.length > 20) {
    return { success: false, error: "El codigo postal es obligatorio." }
  }

  // If setting as default, clear other defaults
  if (data.isDefault && !existing.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDeleted: false, isDefault: true, id: { not: id } },
      data: { isDefault: false },
    })
  }

  await prisma.address.update({
    where: { id },
    data: {
      fullName,
      phone,
      line1,
      line2: data.line2?.trim() || null,
      city,
      province,
      postalCode,
      country: data.country?.trim() || "AR",
      isDefault: data.isDefault ?? existing.isDefault,
    },
  })

  revalidatePath("/account/profile")
  return { success: true }
}

export async function deleteAddress(id: number): Promise<ActionResult> {
  const userId = await requireUserId()

  // Verify ownership
  const existing = await prisma.address.findFirst({
    where: { id, userId, isDeleted: false },
  })
  if (!existing) {
    return { success: false, error: "La direccion no existe o no tienes permiso para eliminarla." }
  }

  // Soft delete
  await prisma.address.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  })

  revalidatePath("/account/profile")
  return { success: true }
}

export async function setDefaultAddress(id: number): Promise<ActionResult> {
  const userId = await requireUserId()

  // Verify ownership
  const existing = await prisma.address.findFirst({
    where: { id, userId, isDeleted: false },
  })
  if (!existing) {
    return { success: false, error: "La direccion no existe o no tienes permiso para modificarla." }
  }

  // Clear all defaults, then set this one
  await prisma.address.updateMany({
    where: { userId, isDeleted: false },
    data: { isDefault: false },
  })

  await prisma.address.update({
    where: { id },
    data: { isDefault: true },
  })

  revalidatePath("/account/profile")
  return { success: true }
}
