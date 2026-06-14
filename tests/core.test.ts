import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { NextRequest } from "next/server";
import { can } from "../lib/auth/rbac";
import { getJwtSecretValue } from "../lib/auth/jwt-secret";
import { validateCsrf } from "../lib/security/csrf";
import { APP_TIME_ZONE } from "../lib/constants";
import { defaultAppSettings, demoCustomers, demoPackages, demoPayments, demoTransactions } from "../lib/data";
import { sanitizeString } from "../lib/security/sanitize";
import { getDateKey } from "../lib/utils";
import { proxy } from "../proxy";
import { customerSchema } from "../schemas/customer";
import { reportFilterSchema } from "../schemas/report";

delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;
delete process.env.POSTGRES_URL_NON_POOLING;

beforeEach(async () => {
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  delete process.env.POSTGRES_URL_NON_POOLING;
  setNodeEnv("test");
  const { resetDemoState } = await import("../lib/demo-store");
  resetDemoState();
});

function csrfRequest(method: string, cookieToken?: string, headerToken?: string) {
  return {
    method,
    cookies: {
      get: (name: string) =>
        name === "kilapkendaraan_csrf" && cookieToken
          ? { name: "kilapkendaraan_csrf", value: cookieToken }
          : undefined,
    },
    headers: new Headers(headerToken ? { "x-csrf-token": headerToken } : undefined),
  } as unknown as NextRequest;
}

function withEnv<T>(updates: Partial<NodeJS.ProcessEnv>, callback: () => T) {
  const previous = { ...process.env };
  Object.assign(process.env, updates);

  try {
    return callback();
  } finally {
    process.env = previous;
  }
}

function setNodeEnv(value?: string) {
  const env = process.env as NodeJS.ProcessEnv & { NODE_ENV: typeof process.env.NODE_ENV };
  env.NODE_ENV = value as typeof process.env.NODE_ENV;
}

async function createLinkedDemoFixture(prefix: string) {
  const { createCustomer } = await import("../services/customers");
  const { createPackage } = await import("../services/packages");
  const { createQueue } = await import("../services/queues");
  const { createPayment } = await import("../services/payments");
  const { listTransactions } = await import("../services/transactions");

  const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const customer = await createCustomer({
    name: `${prefix} Customer`,
    phone: `08${unique}`,
    licensePlate: `B ${unique.slice(-4).toUpperCase()} ZZ`,
    vehicleType: "mobil",
    notes: null,
  });
  const washPackage = await createPackage({
    name: `${prefix} Package`,
    description: "Paket uji hapus permanen",
    price: 40000,
    estimatedMinutes: 30,
    imageUrl: null,
    isActive: true,
  });
  const scheduledAt = new Date("2099-01-01T10:00:00.000Z");
  const queue = await createQueue({
    customerId: customer.id,
    packageId: washPackage.id,
    scheduledAt,
    status: "menunggu",
    notes: null,
  });
  const transaction = (await listTransactions(queue.queueNumber)).find((item) => item.queueId === queue.id);
  assert.ok(transaction);

  const payment = await createPayment({
    transactionId: transaction.id,
    method: "tunai",
    amount: transaction.total,
    status: "lunas",
  });
  assert.equal(payment.status, "lunas");

  return { customer, washPackage, queue, transaction };
}

test("RBAC membatasi akses admin-only untuk petugas", () => {
  assert.equal(can({ role: "admin" }, "users:manage"), true);
  assert.equal(can({ role: "petugas" }, "users:manage"), false);
  assert.equal(can({ role: "petugas" }, "payments:manage"), true);
  assert.equal(can(null, "reports:read"), false);
});

test("CSRF menerima token cocok dan menolak token kosong atau berbeda", () => {
  assert.equal(validateCsrf(csrfRequest("GET")), true);
  assert.equal(validateCsrf(csrfRequest("POST", "token-a", "token-a")), true);
  assert.equal(validateCsrf(csrfRequest("POST", "token-a", "token-b")), false);
  assert.equal(validateCsrf(csrfRequest("POST")), false);
});

test("JWT secret production wajib ada dan minimal 32 karakter", () => {
  withEnv({ NODE_ENV: "production", JWT_SECRET: "" }, () => {
    assert.throws(() => getJwtSecretValue(), /JWT_SECRET/);
  });

  withEnv({ NODE_ENV: "production", JWT_SECRET: "short-secret" }, () => {
    assert.throws(() => getJwtSecretValue(), /JWT_SECRET/);
  });

  withEnv({ NODE_ENV: "production", JWT_SECRET: "x".repeat(32) }, () => {
    assert.equal(getJwtSecretValue(), "x".repeat(32));
  });
});

test("proxy membiarkan request API diproses route handler tanpa redirect HTML", async () => {
  const response = await proxy(new NextRequest("http://localhost:3000/api/settings"));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("location"), null);
});

test("service data menolak jalan tanpa database jika mode demo tidak diaktifkan", async () => {
  const { listCustomers } = await import("../services/customers");
  const previousNodeEnv = process.env.NODE_ENV;
  setNodeEnv("development");
  try {
    await assert.rejects(() => listCustomers(), /DATABASE_URL, POSTGRES_URL, POSTGRES_URL_NON_POOLING wajib diatur/);
  } finally {
    setNodeEnv(previousNodeEnv);
  }
});

test("konfigurasi database menerima fallback POSTGRES_URL_NON_POOLING", async () => {
  const { hasDatabaseConfig } = await import("../drizzle/db");

  withEnv(
    {
      DATABASE_URL: "",
      POSTGRES_URL_NON_POOLING: "postgresql://postgres:secret@db.example.com:5432/postgres",
      POSTGRES_URL: "",
    },
    () => {
      assert.equal(hasDatabaseConfig(), true);
    },
  );
});

test("schema CRUD pelanggan menolak input tidak valid", () => {
  assert.equal(
    customerSchema.safeParse({
      name: "Rizky",
      phone: "081234567890",
      licensePlate: "B 1234 CD",
      vehicleType: "mobil",
    }).success,
    true,
  );

  assert.equal(
    customerSchema.safeParse({
      name: "A",
      phone: "123",
      licensePlate: "B",
      vehicleType: "sepeda",
    }).success,
    false,
  );
});

test("sanitasi string menghapus tag html dan karakter kontrol", () => {
  assert.equal(sanitizeString("  <b>Halo</b>\u0000<script>x</script> Dunia  "), "Halo x Dunia");
});

test("queue demo membuat transaksi pending", async () => {
  const { createQueue } = await import("../services/queues");
  const { listTransactions } = await import("../services/transactions");
  const queue = await createQueue({
    customerId: demoCustomers[0].id,
    packageId: demoPackages[0].id,
    scheduledAt: new Date(),
    status: "menunggu",
    notes: null,
  });
  const createdTransaction = (await listTransactions(queue.queueNumber)).find(
    (transaction) => transaction.queueId === queue.id,
  );

  assert.ok(createdTransaction);
  assert.equal(createdTransaction.status, "belum_bayar");
  assert.equal(createdTransaction.total, demoPackages[0].price);
});

test("queue demo menyimpan diskon sebagai total transaksi bersih", async () => {
  const { createQueue } = await import("../services/queues");
  const { listTransactions } = await import("../services/transactions");
  const discount = 5000;

  const queue = await createQueue({
    customerId: demoCustomers[0].id,
    packageId: demoPackages[0].id,
    scheduledAt: new Date(),
    status: "menunggu",
    discount,
    notes: null,
  });
  const createdTransaction = (await listTransactions(queue.queueNumber)).find(
    (transaction) => transaction.queueId === queue.id,
  );

  assert.equal(queue.total, demoPackages[0].price - discount);
  assert.equal(createdTransaction?.subtotal, demoPackages[0].price);
  assert.equal(createdTransaction?.discount, discount);
  assert.equal(createdTransaction?.total, demoPackages[0].price - discount);
});

test("reset data demo membersihkan gallery urls dan melaporkan jumlah file gallery", async () => {
  const { getDemoState, resetDemoState } = await import("../lib/demo-store");
  const { resetOperationalData } = await import("../services/settings");

  resetDemoState();
  const state = getDemoState();
  state.galleryUrls = ["data:image/png;base64,one", "data:image/png;base64,two"];

  const result = await resetOperationalData();

  assert.equal(result.gallery, 2);
  assert.equal(result.galleryStorage, 2);
  assert.equal(getDemoState().galleryUrls.length, 0);
});

test("hapus pelanggan demo membersihkan pelanggan dan data turunannya", async () => {
  const { deleteCustomer } = await import("../services/customers");
  const { getDemoState } = await import("../lib/demo-store");

  const { customer, queue, transaction } = await createLinkedDemoFixture("Customer delete");
  await deleteCustomer(customer.id);

  const state = getDemoState();
  assert.equal(state.customers.some((item) => item.id === customer.id), false);
  assert.equal(state.queues.some((item) => item.id === queue.id), false);
  assert.equal(state.transactions.some((item) => item.id === transaction.id), false);
  assert.equal(state.payments.some((item) => item.transactionId === transaction.id), false);
});

test("hapus paket demo membersihkan paket dan data turunannya", async () => {
  const { deletePackage } = await import("../services/packages");
  const { getDemoState } = await import("../lib/demo-store");

  const { customer, washPackage, queue, transaction } = await createLinkedDemoFixture("Package delete");
  await deletePackage(washPackage.id);

  const state = getDemoState();
  assert.equal(state.packages.some((item) => item.id === washPackage.id), false);
  assert.equal(state.queues.some((item) => item.id === queue.id), false);
  assert.equal(state.transactions.some((item) => item.id === transaction.id), false);
  assert.equal(state.payments.some((item) => item.transactionId === transaction.id), false);
  assert.equal(state.customers.some((item) => item.id === customer.id), true);
});

test("hapus antrian demo membersihkan antrian dan data pembayarannya", async () => {
  const { deleteQueue } = await import("../services/queues");
  const { getDemoState } = await import("../lib/demo-store");

  const { customer, washPackage, queue, transaction } = await createLinkedDemoFixture("Queue delete");
  await deleteQueue(queue.id);

  const state = getDemoState();
  assert.equal(state.queues.some((item) => item.id === queue.id), false);
  assert.equal(state.transactions.some((item) => item.id === transaction.id), false);
  assert.equal(state.payments.some((item) => item.transactionId === transaction.id), false);
  assert.equal(state.customers.some((item) => item.id === customer.id), true);
  assert.equal(state.packages.some((item) => item.id === washPackage.id), true);
});

test("booking publik dapat memilih paket tanpa login", async () => {
  const { createPublicBooking } = await import("../services/bookings");
  const { listQueues } = await import("../services/queues");
  const { listTransactions } = await import("../services/transactions");
  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 10);
  scheduledAt.setHours(15, 0, 0, 0);

  const booking = await createPublicBooking({
    name: "Booking Publik",
    phone: "081234567891",
    licensePlate: "B 9999 PUB",
    vehicleType: "mobil",
    packageId: demoPackages[1].id,
    scheduledAt,
    notes: "Tanpa login",
  });

  assert.equal(booking.packageName, demoPackages[1].name);
  assert.equal(booking.queue.status, "menunggu");
  assert.equal(booking.total, demoPackages[1].price);

  const createdQueue = (await listQueues(booking.queue.queueNumber)).find((item) => item.id === booking.queue.id);
  const createdTransaction = (await listTransactions(booking.queue.queueNumber)).find(
    (item) => item.queueId === booking.queue.id,
  );

  assert.equal(createdQueue?.customerId, booking.customer.id);
  assert.equal(createdQueue?.customerName, booking.customer.name);
  assert.equal(createdQueue?.licensePlate, booking.customer.licensePlate);
  assert.equal(createdTransaction?.customerId, booking.customer.id);
  assert.equal(createdTransaction?.customerName, booking.customer.name);
});

test("pembayaran demo wajib pending dan nominal harus sama dengan total transaksi", async () => {
  const { createQueue } = await import("../services/queues");
  const { createPayment } = await import("../services/payments");
  const { listTransactions } = await import("../services/transactions");
  const queue = await createQueue({
    customerId: demoCustomers[1].id,
    packageId: demoPackages[1].id,
    scheduledAt: new Date(),
    status: "menunggu",
    notes: null,
  });
  const transaction = (await listTransactions(queue.queueNumber)).find((item) => item.queueId === queue.id);
  assert.ok(transaction);

  await assert.rejects(
    () =>
      createPayment({
        transactionId: transaction.id,
        method: "qris",
        amount: transaction.total + 1,
        status: "lunas",
      }),
    /Nominal pembayaran/,
  );

  const payment = await createPayment({
    transactionId: transaction.id,
    method: "qris",
    amount: transaction.total,
    status: "lunas",
  });
  assert.equal(payment.status, "lunas");

  const paidTransaction = (await listTransactions(queue.queueNumber)).find((item) => item.id === transaction.id);
  assert.equal(paidTransaction?.status, "lunas");

  await assert.rejects(
    () =>
      createPayment({
        transactionId: transaction.id,
        method: "tunai",
        amount: transaction.total,
        status: "belum_bayar" as "lunas",
      }),
    /benar-benar lunas/,
  );

  await assert.rejects(
    () =>
      createPayment({
        transactionId: transaction.id,
        method: "tunai",
        amount: transaction.total,
        status: "lunas",
      }),
    /sudah dibayar/,
  );
});

test("user demo baru bisa login dan user nonaktif ditolak login", async () => {
  const { authenticateUser } = await import("../services/auth");
  const { createUser, deactivateUser } = await import("../services/users");

  const createdUser = await createUser({
    name: "Operator Baru",
    email: "operator@kilapkendaraan.my.id",
    password: "operator123",
    role: "petugas",
    isActive: true,
  });

  const authenticatedUser = await authenticateUser("operator@kilapkendaraan.my.id", "operator123");
  assert.equal(authenticatedUser?.id, createdUser.id);

  const kasir = await authenticateUser("kasir@kilapkendaraan.my.id", "kasir123");
  assert.equal(kasir?.role, "kasir");

  const staff = await authenticateUser("staff@kilapkendaraan.my.id", "staff123");
  assert.equal(staff?.role, "staff");

  await deactivateUser(createdUser.id);
  const rejectedUser = await authenticateUser("operator@kilapkendaraan.my.id", "operator123");
  assert.equal(rejectedUser, null);
});

test("user demo dapat dihapus permanen dan referensi activity log dibersihkan", async () => {
  const { createUser, deleteUser } = await import("../services/users");
  const { logActivity } = await import("../services/activity");
  const { getDemoState } = await import("../lib/demo-store");

  const createdUser = await createUser({
    name: "User Hapus",
    email: "hapus@kilapkendaraan.my.id",
    password: "hapus123",
    role: "petugas",
    isActive: true,
  });

  await logActivity({
    userId: createdUser.id,
    action: "update",
    entity: "users",
    entityId: createdUser.id,
  });

  await deleteUser(createdUser.id);

  const state = getDemoState();
  assert.equal(state.users.some((item) => item.id === createdUser.id), false);
  assert.equal(
    state.activityLogs.some((item) => item.entityId === createdUser.id && item.userId === createdUser.id),
    false,
  );
  assert.equal(
    state.activityLogs.some((item) => item.entityId === createdUser.id && item.userId === null),
    true,
  );
});

test("filter export laporan menerima format json/csv/pdf/xlsx dan menolak format lain", () => {
  assert.equal(reportFilterSchema.safeParse({ format: "json", from: "2026-05-24", to: "2026-05-24" }).success, true);
  assert.equal(reportFilterSchema.safeParse({ format: "csv" }).success, true);
  assert.equal(reportFilterSchema.safeParse({ format: "pdf" }).success, true);
  assert.equal(reportFilterSchema.safeParse({ format: "xlsx", method: "qris", status: "lunas" }).success, true);
  assert.equal(reportFilterSchema.safeParse({ format: "xml" }).success, false);
});

test("slot antrian mengikuti kapasitas per jam dari settings", async () => {
  const { updateAppSettings } = await import("../services/settings");
  const { createQueue } = await import("../services/queues");

  await updateAppSettings({
    ...defaultAppSettings,
    queueSlotCapacity: 1,
  });

  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 7);
  scheduledAt.setHours(23, 0, 0, 0);

  await createQueue({
    customerId: demoCustomers[0].id,
    packageId: demoPackages[0].id,
    scheduledAt,
    status: "menunggu",
    notes: null,
  });

  await assert.rejects(
    () =>
      createQueue({
        customerId: demoCustomers[1].id,
        packageId: demoPackages[1].id,
        scheduledAt,
        status: "menunggu",
        notes: null,
      }),
    /Slot jadwal/,
  );

  await updateAppSettings(defaultAppSettings);
});

test("laporan memfilter rentang tanggal secara inklusif berdasarkan hari", async () => {
  const { getReportData } = await import("../services/reports");
  const reportDateKey = getDateKey(demoPayments[0]?.createdAt ?? demoTransactions[0]?.createdAt, APP_TIME_ZONE);
  assert.ok(reportDateKey);

  const report = await getReportData({ from: reportDateKey, to: reportDateKey });
  assert.ok(report.rows.length >= 1);
  assert.equal(report.rows.every((row) => getDateKey(row.createdAt, APP_TIME_ZONE) === reportDateKey), true);
});
