type JsonLike = Record<string, unknown>;

export async function readJsonResponse<T extends JsonLike>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return {
      message: response.ok
        ? "Respons server tidak valid."
        : "Server sedang bermasalah. Coba lagi beberapa saat.",
    } as unknown as T;
  }
}
