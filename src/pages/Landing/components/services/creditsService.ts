const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function fetchUserCredits(clerkUserId: string, getToken :string) {
  try {
    const token = getToken;
    const resp = await fetch(`${BASE_URL}/api/credits/getUserCredits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ clerkId: clerkUserId }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const total =
      typeof data === "object" && data !== null
        ? (data.total as number | undefined)
        : undefined;
    const value = typeof total === "number" ? total : 0;
    return { value, data };
  } catch (e) {
    throw e;
  }
}
