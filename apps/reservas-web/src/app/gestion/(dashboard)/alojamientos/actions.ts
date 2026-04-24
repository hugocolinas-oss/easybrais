"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@easybrais/utils";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/gestion/auth";

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
  internal_notes?: string;
  reservation_notes?: string;
}): Promise<{ ok: true; id: string } | { error: string }> {
  try {
    await requireAuth();
    const name = fields.name.trim();
    if (!name || name.length < 2) return { error: "El nombre es obligatorio (mín. 2 caracteres)." };
    if (name.length > 200) return { error: "El nombre es demasiado largo." };

    const displayName = fields.display_name.trim() || name;
    const externalCode = fields.external_code?.trim() || null;
    const town = fields.town?.trim() || null;

    const supabase = await getServerSupabase();

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- migration 010 columns
    const { data: created, error: insertErr } = await supabase
      .from("accommodations")
      .insert({
        name,
        display_name: displayName,
        external_code: externalCode,
        stage_name: fields.stage_name?.trim() || null,
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
      } as any)
      .select("id")
      .single();

    if (insertErr || !created) {
      console.error("[alojamientos] createAccommodation insert error:", insertErr?.message);
      return { error: "Error al guardar el alojamiento. Inténtalo de nuevo." };
    }

    revalidatePath("/gestion/alojamientos");
    return { ok: true, id: created.id };
  } catch (err) {
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
    display_name?: string;
    external_code?: string | null;
    active?: boolean;
    visible_in_reservations?: boolean;
    internal_notes?: string | null;
    reservation_notes?: string | null;
    sort_order?: number;
    contact_phone?: string | null;
    contact_email?: string | null;
    address?: string | null;
    last_verified_at?: string | null;
  },
): Promise<{ ok: true } | { error: string }> {
  try {
    await requireAuth();
    const supabase = await getServerSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- new columns from migration 010 not in generated types
    const { error } = await supabase
      .from("accommodations")
      .update(fields as any)
      .eq("id", id);

    if (error) {
      console.error("[alojamientos] updateAccommodation error:", error.message);
      return { error: "No se pudo actualizar el alojamiento." };
    }

    revalidatePath("/gestion/alojamientos");
    revalidatePath(`/gestion/alojamientos/${id}`);
    return { ok: true };
  } catch (err) {
    console.error("[alojamientos] updateAccommodation unexpected:", err);
    return { error: "Error inesperado al actualizar." };
  }
}

export async function toggleActive(
  id: string,
  active: boolean,
): Promise<{ ok: true } | { error: string }> {
  try {
    await requireAuth();
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
    console.error("[alojamientos] toggleActive unexpected:", err);
    return { error: "Error inesperado." };
  }
}

export async function toggleVisibility(
  id: string,
  visible: boolean,
): Promise<{ ok: true } | { error: string }> {
  try {
    await requireAuth();
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from("accommodations")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- migration 010
      .update({ visible_in_reservations: visible } as any)
      .eq("id", id);

    if (error) {
      console.error("[alojamientos] toggleVisibility error:", error.message);
      return { error: "No se pudo cambiar la visibilidad." };
    }

    revalidatePath("/gestion/alojamientos");
    return { ok: true };
  } catch (err) {
    console.error("[alojamientos] toggleVisibility unexpected:", err);
    return { error: "Error inesperado." };
  }
}

export async function markVerified(
  id: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    await requireAuth();
    const supabase = await getServerSupabase();
    const { error } = await supabase
      .from("accommodations")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- migration 010
      .update({ last_verified_at: new Date().toISOString() } as any)
      .eq("id", id);

    if (error) {
      console.error("[alojamientos] markVerified error:", error.message);
      return { error: "No se pudo marcar como verificado." };
    }

    revalidatePath("/gestion/alojamientos");
    revalidatePath(`/gestion/alojamientos/${id}`);
    return { ok: true };
  } catch (err) {
    console.error("[alojamientos] markVerified unexpected:", err);
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
    await requireAuth();
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
    await requireAuth();
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
    console.error("[alojamientos] toggleStageActive unexpected:", err);
    return { error: "Error inesperado." };
  }
}

export async function toggleStageVisibility(
  stageName: string,
  visible: boolean,
): Promise<{ ok: true; count: number } | { error: string }> {
  try {
    await requireAuth();
    const supabase = await getServerSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from("accommodations")
      .update({ visible_in_reservations: visible } as any)
      .eq("stage_name", stageName)
      .select("id");

    if (error) {
      console.error("[alojamientos] toggleStageVisibility error:", error.message);
      return { error: "No se pudo cambiar la visibilidad de la etapa." };
    }

    revalidatePath("/gestion/alojamientos");
    return { ok: true, count: data?.length ?? 0 };
  } catch (err) {
    console.error("[alojamientos] toggleStageVisibility unexpected:", err);
    return { error: "Error inesperado." };
  }
}
