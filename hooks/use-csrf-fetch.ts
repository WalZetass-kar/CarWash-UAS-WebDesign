"use client";

function getCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

export function useCsrfFetch() {
  return async function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}) {
    const csrfToken = getCookie("cleanride_csrf");
    const isFormData = init.body instanceof FormData;
    return fetch(input, {
      ...init,
      headers: {
        ...(!isFormData ? { "Content-Type": "application/json" } : {}),
        ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}),
        ...init.headers,
      },
    });
  };
}
