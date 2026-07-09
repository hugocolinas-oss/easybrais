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

export function canAccessBookings(role: StaffRole): boolean {
  return role !== "chofer";
}

export function canAccessOperative(role: StaffRole): boolean {
  return role === "chofer" || canOpenDashboard(role);
}

export function canAccessRoutes(role: StaffRole): boolean {
  return role === "chofer" || canOpenDashboard(role);
}

export function getDefaultGestionPath(role: StaffRole): string {
  return role === "chofer" ? "/gestion/operativa" : "/gestion";
}

export function ensureDashboardAccess(role: StaffRole): void {
  if (!canOpenDashboard(role)) redirect(getDefaultGestionPath(role));
}

export function ensureBookingsAccess(role: StaffRole): void {
  if (!canAccessBookings(role)) redirect(getDefaultGestionPath(role));
}

export function ensureOperativeAccess(role: StaffRole): void {
  if (!canAccessOperative(role)) redirect(getDefaultGestionPath(role));
}

export function ensureRoutesAccess(role: StaffRole): void {
  if (!canAccessRoutes(role)) redirect(getDefaultGestionPath(role));
}

export function ensureClosuresAccess(role: StaffRole): void {
  if (!canAccessClosures(role)) redirect(getDefaultGestionPath(role));
}

export function ensureAccommodationsAccess(role: StaffRole): void {
  if (!canManageAccommodations(role)) redirect(getDefaultGestionPath(role));
}

export function assertDashboardAccess(role: StaffRole): void {
  if (!canOpenDashboard(role)) throw new PermissionError();
}

export function assertBookingsAccess(role: StaffRole): void {
  if (!canAccessBookings(role)) throw new PermissionError();
}

export function assertOperativeAccess(role: StaffRole): void {
  if (!canAccessOperative(role)) throw new PermissionError();
}

export function assertRoutesAccess(role: StaffRole): void {
  if (!canAccessRoutes(role)) throw new PermissionError();
}

export function assertClosuresAccess(role: StaffRole): void {
  if (!canAccessClosures(role)) throw new PermissionError();
}

export function assertAccommodationsAccess(role: StaffRole): void {
  if (!canManageAccommodations(role)) throw new PermissionError();
}
