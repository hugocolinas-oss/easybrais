import { createAdminClient } from "@easybrais/utils/supabase/admin";

const cache = new Map<string, string>();

export async function getRuntimeSecret(
  name: string,
  options: { cache?: boolean } = {},
): Promise<string | null> {
  const shouldCache = options.cache !== false;
  const cached = shouldCache ? cache.get(name) : undefined;
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
  if (shouldCache) cache.set(name, value);
  return value;
}
