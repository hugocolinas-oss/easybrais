create or replace function public.set_runtime_secret(
  secret_name text,
  secret_value text,
  secret_description text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if secret_name is null or secret_name !~ '^[a-z0-9_]{3,80}$' then
    raise exception 'Invalid runtime secret name';
  end if;

  if secret_value is null or length(secret_value) < 8 or length(secret_value) > 10000 then
    raise exception 'Invalid runtime secret value';
  end if;

  delete from vault.secrets where name = secret_name;
  perform vault.create_secret(secret_value, secret_name, secret_description);
end;
$$;

revoke all on function public.set_runtime_secret(text, text, text) from public;
revoke all on function public.set_runtime_secret(text, text, text) from anon;
revoke all on function public.set_runtime_secret(text, text, text) from authenticated;
grant execute on function public.set_runtime_secret(text, text, text) to service_role;
