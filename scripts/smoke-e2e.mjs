import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { loadEnvConfig } from "@next/env";
import postgres from "postgres";

loadEnvConfig(process.cwd());

if (!existsSync(".next/BUILD_ID")) {
  console.error("Production build belum ada. Jalankan npm run build sebelum npm run smoke:e2e.");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL / POSTGRES_URL_NON_POOLING / POSTGRES_URL belum diatur.");
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  max: 1,
  prepare: false,
  connect_timeout: 10,
  idle_timeout: 5,
});

const smokePackage = {
  id: crypto.randomUUID(),
  name: `Smoke Package ${Date.now()}`,
  description: "Paket sementara untuk smoke test",
  price: 35000,
  estimatedMinutes: 25,
  isActive: true,
};
const smokeBooking = {
  name: `Smoke Test ${Date.now()}`,
  phone: `0812${String(Date.now()).slice(-8)}`,
  licensePlate: `B ${String(Date.now()).slice(-4)} E2E`,
  vehicleType: "mobil",
  notes: "smoke e2e",
};

await sql`
  insert into wash_packages (
    id,
    name,
    description,
    price,
    estimated_minutes,
    is_active
  )
  values (
    ${smokePackage.id},
    ${smokePackage.name},
    ${smokePackage.description},
    ${smokePackage.price},
    ${smokePackage.estimatedMinutes},
    ${smokePackage.isActive}
  )
  on conflict (id) do update set
    name = excluded.name,
    description = excluded.description,
    price = excluded.price,
    estimated_minutes = excluded.estimated_minutes,
    is_active = excluded.is_active,
    updated_at = now(),
    deleted_at = null
`;

const port = 3200 + Math.floor(Math.random() * 400);
const baseUrl = `http://127.0.0.1:${port}`;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const server = spawn(npmCommand, ["run", "start", "--", "-p", String(port)], {
  env: {
    ...process.env,
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
let queueNumberForCleanup = null;

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

async function cleanupSmokeData(queueNumber) {
  try {
    if (queueNumber) {
      const rows = await sql`
        select q.id as queue_id, q.customer_id, t.id as transaction_id, p.id as payment_id
        from queues q
        left join transactions t on t.queue_id = q.id
        left join payments p on p.transaction_id = t.id
        where q.queue_number = ${queueNumber}
        order by t.created_at desc
        limit 1
      `;

      const row = rows[0];
      if (row?.payment_id) {
        await sql`delete from payments where id = ${row.payment_id}`;
      } else if (row?.transaction_id) {
        await sql`delete from payments where transaction_id = ${row.transaction_id}`;
      }

      if (row?.transaction_id) {
        await sql`delete from transactions where id = ${row.transaction_id}`;
      }

      if (row?.queue_id) {
        await sql`delete from queues where id = ${row.queue_id}`;
      }

      if (row?.customer_id) {
        await sql`delete from customers where id = ${row.customer_id}`;
      }
    }
  } finally {
    await sql`delete from wash_packages where id = ${smokePackage.id}`;
  }
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
      name: smokeBooking.name,
      phone: smokeBooking.phone,
      licensePlate: smokeBooking.licensePlate,
      vehicleType: smokeBooking.vehicleType,
      packageId: smokePackage.id,
      scheduledAt,
      notes: smokeBooking.notes,
    }),
  });
  if (booking.status !== 201) {
    throw new Error(`Booking expected 201, got ${booking.status}: ${await booking.text()}`);
  }

  const bookingBody = await booking.json();
  queueNumberForCleanup = bookingBody?.booking?.queueNumber ?? null;

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
  await cleanupSmokeData(queueNumberForCleanup).catch((error) => {
    console.error("Smoke cleanup failed", error);
  });
  await sql.end({ timeout: 1 }).catch(() => undefined);
}
