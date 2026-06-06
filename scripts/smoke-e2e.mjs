import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

if (!existsSync(".next/BUILD_ID")) {
  console.error("Production build belum ada. Jalankan npm run build sebelum npm run smoke:e2e.");
  process.exit(1);
}

const port = 3200 + Math.floor(Math.random() * 400);
const baseUrl = `http://127.0.0.1:${port}`;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const server = spawn(npmCommand, ["run", "start", "--", "-p", String(port)], {
  env: {
    ...process.env,
    ENABLE_DEMO_MODE: "true",
    DATABASE_URL: "",
    POSTGRES_URL: "",
    POSTGRES_URL_NON_POOLING: "",
    NEXT_PUBLIC_SUPABASE_URL: "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    SUPABASE_ANON_KEY: "",
    SUPABASE_SERVICE_ROLE_KEY: "",
    SUPABASE_SECRET_KEY: "",
    NEXT_PUBLIC_APP_URL: baseUrl,
  },
  stdio: ["ignore", "pipe", "pipe"],
  detached: process.platform !== "win32",
});

let output = "";
server.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

const cookies = new Map();

function rememberCookies(response) {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) return;

  for (const part of setCookie.split(/,\s*(?=[^=;,]+=[^=;,]+)/)) {
    const [pair] = part.split(";");
    const [name, value] = pair.split("=");
    if (name && value) cookies.set(name.trim(), value.trim());
  }
}

function cookieHeader() {
  return Array.from(cookies.entries()).map(([name, value]) => `${name}=${value}`).join("; ");
}

async function request(path, init = {}) {
  const headers = new Headers(init.headers);
  const currentCookies = cookieHeader();
  if (currentCookies) headers.set("cookie", currentCookies);
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers, redirect: "manual" });
  rememberCookies(response);
  return response;
}

async function expectText(path, expected) {
  const response = await request(path);
  const text = await response.text();
  if (response.status !== 200 || !text.includes(expected)) {
    throw new Error(`${path} expected 200 and text "${expected}", got ${response.status}`);
  }
}

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/login`);
      if (response.ok) {
        rememberCookies(response);
        return;
      }
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server tidak siap. Output:\n${output}`);
}

async function main() {
  await waitForServer();

  await expectText("/", "Kilap Kendaraan");
  await expectText("/booking", "Booking Tanpa Login");

  const csrfToken = cookies.get("kilapkendaraan_csrf");
  if (!csrfToken) throw new Error("CSRF cookie tidak tersedia");

  const scheduledAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const booking = await request("/api/bookings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify({
      name: "Smoke Test",
      phone: "081234567899",
      licensePlate: "B 1234 E2E",
      vehicleType: "mobil",
      packageId: "20000000-0000-4000-8000-000000000001",
      scheduledAt,
      notes: "smoke e2e",
    }),
  });
  if (booking.status !== 201) {
    throw new Error(`Booking expected 201, got ${booking.status}: ${await booking.text()}`);
  }

  const login = await request("/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify({
      email: "admin@kilapkendaraan.my.id",
      password: "admin123",
    }),
  });
  if (login.status !== 200) {
    throw new Error(`Login expected 200, got ${login.status}: ${await login.text()}`);
  }

  await expectText("/dashboard", "Dashboard Operasional");

  const reportJson = await request("/api/reports?format=json&status=belum_bayar");
  if (reportJson.status !== 200) {
    throw new Error(`Report JSON expected 200, got ${reportJson.status}`);
  }

  const reportXlsx = await request("/api/reports?format=xlsx");
  const reportType = reportXlsx.headers.get("content-type") ?? "";
  if (reportXlsx.status !== 200 || !reportType.includes("spreadsheetml.sheet")) {
    throw new Error(`Report XLSX expected 200 spreadsheet, got ${reportXlsx.status} ${reportType}`);
  }

  console.log("Smoke e2e passed.");
}

try {
  await main();
} finally {
  if (server.pid) {
    if (process.platform === "win32") {
      server.kill("SIGTERM");
    } else {
      process.kill(-server.pid, "SIGTERM");
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}


