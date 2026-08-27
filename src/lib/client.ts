export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; code?: string };
  if (!res.ok) {
    const error = new Error(data.error ?? "The request could not be completed.");
    (error as Error & { status: number; code?: string }).status = res.status;
    (error as Error & { code?: string }).code = data.code;
    throw error;
  }
  return data;
}
