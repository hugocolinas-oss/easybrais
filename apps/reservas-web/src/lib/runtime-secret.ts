import { createAdminClient } from "@easybrais/utils";

const cache = new Map<string, string>();

export async function getRuntimeSecret(name: string): Promise<string | null> {
  const cached = cache.get(name);
  if (cached) return cached;

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_runtime_secret", {
    secret_name: name,
  });

  if (error) {
    console.error(`[runtime-secret] unable to read "${name}":`, error.message);
    return null;
  }

  if (typeof data !== "string" || !data.trim()) {
    return null;
  }

  const value = data.trim();
  cache.set(name, value);
  return value;
}
