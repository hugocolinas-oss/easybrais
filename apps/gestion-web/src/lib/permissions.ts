import { redirect } from "next/navigation";
import type { StaffRole } from "@easybrais/types";

export class PermissionError extends Error {
  constructor(message = "No tienes permisos para realizar esta acción.") {
    super(message);
    this.name = "PermissionError";
  }
}

export function canAccessDashboard(role: StaffRole): boolean {
  return role !== "chofer";
}

export function canAccessBookings(role: StaffRole): boolean {
  return role !== "chofer";
}

export function canManageAccommodations(role: StaffRole): boolean {
  return role !== "chofer";
}

export function canAccessClosures(role: StaffRole): boolean {
  return role !== "chofer";
}

export function assertBookingsAccess(role: StaffRole): void {
  if (!canAccessBookings(role)) throw new PermissionError();
}

export function assertAccommodationsAccess(role: StaffRole): void {
  if (!canManageAccommodations(role)) throw new PermissionError();
}

export function assertClosuresAccess(role: StaffRole): void {
  if (!canAccessClosures(role)) throw new PermissionError();
}

export function ensureDashboardAccess(role: StaffRole): void {
  if (!canAccessDashboard(role)) redirect("/operativa");
}

export function ensureBookingsAccess(role: StaffRole): void {
  if (!canAccessBookings(role)) redirect("/operativa");
}

export function ensureAccommodationsAccess(role: StaffRole): void {
  if (!canManageAccommodations(role)) redirect("/operativa");
}

export function ensureClosuresAccess(role: StaffRole): void {
  if (!canAccessClosures(role)) redirect("/operativa");
}
