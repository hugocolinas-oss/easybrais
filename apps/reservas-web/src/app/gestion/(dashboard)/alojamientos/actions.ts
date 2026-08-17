"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@easybrais/utils/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/gestion/auth";
import { assertAccommodationsAccess, assertSeasonClosuresAccess, PermissionError } from "@/lib/gestion/permissions";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function getStageCode(externalCode: string | null): number | null {
  if (!externalCode) return null;
  const match = externalCode.match(/^(\d+)\./);
  if (!match) return null;
  const code = Number.parseInt(match[1] ?? "", 10);
  return Number.isNaN(code) ? null : code;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createAccommodation(fields: {
  name: string;
  display_name: string;
  external_code?: string;
  stage_name?: string;
  town?: string;
  route_name?: string;
  address?: string;
  contact_phone?: string;
  contact_email?: string;
  active: boolean;
  visible_in_reservations: boolean;
  sort_order: number;
  extra_cost: number;
  internal_notes?: string;
  reservation_notes?: string;
}): Promise<{ ok: true; id: string } | { error: string }> {
  try {
    const { profile } = await requireAuth();
    assertAccommodationsAccess(profile.role);
    const name = fields.name.trim();
    if (!name || name.length < 2) return { error: "El nombre es obligatorio (mín. 2 caracteres)." };
    if (name.length > 200) return { error: "El nombre es demasiado largo." };
    if (!Number.isFinite(fields.extra_cost) || fields.extra_cost < 0) {
      return { error: "El extra por desplazamiento no es válido." };
    }

    const displayName = fields.display_name.trim() || name;
    const externalCode = fields.external_code?.trim() || null;
    const town = fields.town?.trim() || null;

    const supabase = await getServerSupabase();
    const stageCode = getStageCode(externalCode);
    const { data: routeStage } = stageCode === null
      ? { data: null }
      : await supabase.from("route_stages").select("id, name").eq("code", stageCode).maybeSingle();

    // Duplicate check: same name + same town
    const { data: dup } = await supabase
      .from("accommodations")
      .select("id")
      .ilike("name", name)
      .limit(1);

    if (dup && dup.length > 0) {
      return { error: `Ya existe un alojamiento con el nombre "${name}". Revisa antes de duplicar.` };
    }

    // Duplicate check: same external_code
    if (externalCode) {
      const { data: codeDup } = await supabase
        .from("accommodations")
        .select("id")
        .eq("external_code", externalCode)
        .limit(1);

      if (codeDup && codeDup.length > 0) {
        return { error: `El código externo "${externalCode}" ya está asignado a otro alojamiento.` };
      }
    }

    const { data: created, error: insertErr } = await supabase
      .from("accommodations")
      .insert({
        name,
        display_name: displayName,
        external_code: externalCode,
        stage_name: fields.stage_name?.trim() || routeStage?.name || null,
        town,
        route_name: fields.route_name?.trim() || null,
        address: fields.address?.trim() || null,
        contact_phone: fields.contact_phone?.trim() || null,
        contact_email: fields.contact_email?.trim() || null,
        active: fields.active,
        visible_in_reservations: fields.visible_in_reservations,
        sort_order: fields.sort_order,
        internal_notes: fields.internal_notes?.trim() || null,
        reservation_notes: fields.reservation_notes?.trim() || null,
        route_stage_id: routeStage?.id ?? null,
      })
      .select("id")
      .single();

    if (insertErr || !created) {
      console.error("[alojamientos] createAccommodation insert error:", insertErr?.message);
      return { error: "Error al guardar el alojamiento. Inténtalo de nuevo." };
    }

    const { error: costErr } = await supabase
      .from("accommodation_internal_costs")
      .upsert({ accommodation_id: created.id, extra_cost: fields.extra_cost });

    if (costErr) {
      console.error("[alojamientos] createAccommodation cost error:", costErr.message);
      return { error: "El alojamiento se creó, pero no se pudo guardar el coste interno." };
    }

    revalidatePath("/gestion/alojamientos");
    return { ok: true, id: created.id };
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[alojamientos] createAccommodation unexpected:", err);
    return { error: "Error inesperado al crear el alojamiento." };
  }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateAccommodation(
  id: string,
  fields: {
    name?: string;
    display_name?: string;
    external_code?: string | null;
    stage_name?: string | null;
    town?: string | null;
    route_name?: string | null;
    active?: boolean;
    visible_in_reservations?: boolean;
    internal_notes?: string | null;
    reservation_notes?: string | null;
    sort_order?: number;
    contact_phone?: string | null;
    contact_email?: string | null;
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
    extra_cost?: number;
  },
): Promise<{ ok: true } | { error: string }> {
  try {
    const { profile } = await requireAuth();
    assertAccommodationsAccess(profile.role);
    const supabase = await getServerSupabase();

    const normalizedName = fields.name?.trim();
    if (normalizedName != null && normalizedName.length < 2) {
      return { error: "El nombre interno debe tener al menos 2 caracteres." };
    }
    if (normalizedName != null && normalizedName.length > 200) {
      return { error: "El nombre interno es demasiado largo." };
    }

    const normalizedDisplayName = fields.display_name?.trim();
    const normalizedExternalCode = fields.external_code?.trim() || null;
    const normalizedStageName = fields.stage_name?.trim() || null;
    const normalizedTown = fields.town?.trim() || null;
    const normalizedRouteName = fields.route_name?.trim() || null;
    const normalizedAddress = fields.address?.trim() || null;
    const normalizedPhone = fields.contact_phone?.trim() || null;
    const normalizedEmail = fields.contact_email?.trim() || null;
    const stageCode = getStageCode(normalizedExternalCode);
    const { data: routeStage } = stageCode === null
      ? { data: null }
      : await supabase.from("route_stages").select("id, name").eq("code", stageCode).maybeSingle();

    if (normalizedExternalCode) {
      const { data: codeDup } = await supabase
        .from("accommodations")
        .select("id")
        .eq("external_code", normalizedExternalCode)
        .neq("id", id)
        .limit(1);

      if (codeDup && codeDup.length > 0) {
        return { error: `El código externo "${normalizedExternalCode}" ya está asignado a otro alojamiento.` };
      }
    }

    if (normalizedName) {
      const { data: nameDup } = await supabase
        .from("accommodations")
        .select("id")
        .ilike("name", normalizedName)
        .neq("id", id)
        .limit(1);

      if (nameDup && nameDup.length > 0) {
        return { error: `Ya existe otro alojamiento con el nombre "${normalizedName}".` };
      }
    }

    if (fields.lat != null && !Number.isFinite(fields.lat)) {
      return { error: "La latitud no es válida." };
    }
    if (fields.lng != null && !Number.isFinite(fields.lng)) {
      return { error: "La longitud no es válida." };
    }
    if (fields.extra_cost != null && (!Number.isFinite(fields.extra_cost) || fields.extra_cost < 0)) {
      return { error: "El extra por desplazamiento no es válido." };
    }

    const { extra_cost: extraCost, ...accommodationFields } = fields;
    const updates = {
      ...accommodationFields,
      name: normalizedName,
      display_name: normalizedDisplayName || normalizedName || undefined,
      external_code: normalizedExternalCode,
      town: normalizedTown,
      route_name: normalizedRouteName,
      address: normalizedAddress,
      contact_phone: normalizedPhone,
      contact_email: normalizedEmail,
      route_stage_id: routeStage?.id ?? null,
      stage_name: normalizedStageName || routeStage?.name || null,
    };

    const { error } = await supabase
      .from("accommodations")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("[alojamientos] updateAccommodation error:", error.message);
      return { error: "No se pudo actualizar el alojamiento." };
    }

    if (extraCost != null) {
      const { error: costError } = await supabase
        .from("accommodation_internal_costs")
        .upsert({ accommodation_id: id, extra_cost: extraCost });

      if (costError) {
        console.error("[alojamientos] updateAccommodation cost error:", costError.message);
        return { error: "El alojamiento se actualizó, pero no se pudo guardar el coste interno." };
      }
    }

    revalidatePath("/gestion/alojamientos");
    revalidatePath(`/gestion/alojamientos/${id}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[alojamientos] updateAccommodation unexpected:", err);
    return { error: "Error inesperado al actualizar." };
  }
}

export async function toggleActive(
  id: string,
  active: boolean,
): Promise<{ ok: true } | { error: string }> {
  try {
    const { profile } = await requireAuth();
    assertAccommodationsAccess(profile.role);
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from("accommodations")
      .update({ active })
      .eq("id", id);

    if (error) {
      console.error("[alojamientos] toggleActive error:", error.message);
      return { error: "No se pudo cambiar el estado." };
    }

    revalidatePath("/gestion/alojamientos");
    return { ok: true };
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[alojamientos] toggleActive unexpected:", err);
    return { error: "Error inesperado." };
  }
}

export async function toggleVisibility(
  id: string,
  visible: boolean,
): Promise<{ ok: true } | { error: string }> {
  try {
    const { profile } = await requireAuth();
    assertAccommodationsAccess(profile.role);
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from("accommodations")
      .update({ visible_in_reservations: visible })
      .eq("id", id);

    if (error) {
      console.error("[alojamientos] toggleVisibility error:", error.message);
      return { error: "No se pudo cambiar la visibilidad." };
    }

    revalidatePath("/gestion/alojamientos");
    return { ok: true };
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[alojamientos] toggleVisibility unexpected:", err);
    return { error: "Error inesperado." };
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteAccommodation(
  id: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const { profile } = await requireAuth();
    assertAccommodationsAccess(profile.role);
    const supabase = createAdminClient();

    const { data: refs } = await supabase
      .from("booking_items")
      .select("id")
      .or(`pickup_accommodation_id.eq.${id},dropoff_accommodation_id.eq.${id}`)
      .limit(1);

    if (refs && refs.length > 0) {
      return { error: "No se puede eliminar: este alojamiento tiene reservas asociadas. Desactívalo en su lugar." };
    }

    const { error } = await supabase
      .from("accommodations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[alojamientos] deleteAccommodation error:", error.message);
      return { error: "No se pudo eliminar el alojamiento." };
    }

    revalidatePath("/gestion/alojamientos");
    return { ok: true };
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[alojamientos] deleteAccommodation unexpected:", err);
    return { error: "Error inesperado al eliminar." };
  }
}

// ---------------------------------------------------------------------------
// Bulk stage toggle
// ---------------------------------------------------------------------------

export async function toggleStageActive(
  stageName: string,
  active: boolean,
): Promise<{ ok: true; count: number } | { error: string }> {
  try {
    const { profile } = await requireAuth();
    assertAccommodationsAccess(profile.role);
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from("accommodations")
      .update({ active })
      .eq("stage_name", stageName)
      .select("id");

    if (error) {
      console.error("[alojamientos] toggleStageActive error:", error.message);
      return { error: "No se pudo cambiar el estado de la etapa." };
    }

    revalidatePath("/gestion/alojamientos");
    return { ok: true, count: data?.length ?? 0 };
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[alojamientos] toggleStageActive unexpected:", err);
    return { error: "Error inesperado." };
  }
}

export async function toggleStageVisibility(
  stageName: string,
  visible: boolean,
): Promise<{ ok: true; count: number } | { error: string }> {
  try {
    const { profile } = await requireAuth();
    assertAccommodationsAccess(profile.role);
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from("accommodations")
      .update({ visible_in_reservations: visible })
      .eq("stage_name", stageName)
      .select("id");

    if (error) {
      console.error("[alojamientos] toggleStageVisibility error:", error.message);
      return { error: "No se pudo cambiar la visibilidad de la etapa." };
    }

    revalidatePath("/gestion/alojamientos");
    return { ok: true, count: data?.length ?? 0 };
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[alojamientos] toggleStageVisibility unexpected:", err);
    return { error: "Error inesperado." };
  }
}

// ---------------------------------------------------------------------------
// Public booking season closures
// ---------------------------------------------------------------------------

export async function createServiceClosure(input: {
  startsOn: string;
  endsOn: string;
  reason?: string;
}): Promise<{ ok: true } | { error: string }> {
  try {
    const { profile } = await requireAuth();
    assertSeasonClosuresAccess(profile.role);

    if (!isValidDate(input.startsOn) || !isValidDate(input.endsOn)) {
      return { error: "Selecciona un rango de fechas válido." };
    }
    if (input.startsOn > input.endsOn) {
      return { error: "La fecha final no puede ser anterior a la inicial." };
    }
    const reason = input.reason?.trim() || null;
    if (reason && reason.length > 200) return { error: "El motivo no puede superar 200 caracteres." };

    const admin = createAdminClient();
    const { data: overlap, error: overlapError } = await admin
      .from("service_closures")
      .select("id")
      .lte("starts_on", input.endsOn)
      .gte("ends_on", input.startsOn)
      .limit(1);

    if (overlapError) {
      console.error("[alojamientos] service closure overlap check failed:", overlapError.message);
      return { error: "No se pudo comprobar el calendario de temporada." };
    }
    if (overlap && overlap.length > 0) {
      return { error: "Ese rango coincide con otro cierre. Elimina el anterior o elige otras fechas." };
    }

    const { error } = await admin.from("service_closures").insert({
      starts_on: input.startsOn,
      ends_on: input.endsOn,
      reason,
      created_by: profile.id,
    });
    if (error) {
      console.error("[alojamientos] create service closure failed:", error.message);
      return { error: "No se pudo cerrar el rango de fechas." };
    }

    revalidatePath("/gestion/alojamientos");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[alojamientos] create service closure unexpected:", err);
    return { error: "Error inesperado al cerrar las fechas." };
  }
}

export async function deleteServiceClosure(id: string): Promise<{ ok: true } | { error: string }> {
  try {
    const { profile } = await requireAuth();
    assertSeasonClosuresAccess(profile.role);
    if (!UUID_RE.test(id)) return { error: "Cierre no válido." };

    const admin = createAdminClient();
    const { error } = await admin.from("service_closures").delete().eq("id", id);
    if (error) {
      console.error("[alojamientos] delete service closure failed:", error.message);
      return { error: "No se pudo reabrir el rango." };
    }

    revalidatePath("/gestion/alojamientos");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    if (err instanceof PermissionError) return { error: err.message };
    console.error("[alojamientos] delete service closure unexpected:", err);
    return { error: "Error inesperado al reabrir las fechas." };
  }
}
