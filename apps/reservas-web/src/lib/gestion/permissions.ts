import { redirect } from "next/navigation";
import type { StaffRole } from "@easybrais/types";

export class PermissionError extends Error {
  constructor(message = "No tienes permisos para realizar esta accion.") {
    super(message);
    this.name = "PermissionError";
  }
}

export function canViewFinancialInfo(role: StaffRole): boolean {
  return role !== "chofer";
}

export function canAccessClosures(role: StaffRole): boolean {
  return role !== "chofer";
}

export function canManageAccommodations(role: StaffRole): boolean {
  return role !== "chofer";
}

export function canDeleteBookings(role: StaffRole): boolean {
  return role !== "chofer";
}

export function canResendReservationEmails(role: StaffRole): boolean {
  return role !== "chofer";
}

export function canEditBookingPricing(role: StaffRole): boolean {
  return role !== "chofer";
}

export function canOpenDashboard(role: StaffRole): boolean {
  return role !== "chofer";
}

export function ensureDashboardAccess(role: StaffRole): void {
  if (!canOpenDashboard(role)) redirect("/gestion/reservas");
}

export function ensureClosuresAccess(role: StaffRole): void {
  if (!canAccessClosures(role)) redirect("/gestion/reservas");
}

export function ensureAccommodationsAccess(role: StaffRole): void {
  if (!canManageAccommodations(role)) redirect("/gestion/reservas");
}

export function assertDashboardAccess(role: StaffRole): void {
  if (!canOpenDashboard(role)) throw new PermissionError();
}

export function assertClosuresAccess(role: StaffRole): void {
  if (!canAccessClosures(role)) throw new PermissionError();
}

export function assertAccommodationsAccess(role: StaffRole): void {
  if (!canManageAccommodations(role)) throw new PermissionError();
}
