import {
  paymentMethods,
  paymentStatuses,
  queueStatuses,
  vehicleTypes,
  type demoUsers,
} from "@/lib/constants";

export type Role = "admin" | "petugas";
export type QueueStatus = (typeof queueStatuses)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type VehicleType = (typeof vehicleTypes)[number];

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  licensePlate: string;
  vehicleType: VehicleType;
  notes?: string | null;
  createdAt: string;
};

export type WashPackage = {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedMinutes: number;
  isActive: boolean;
  createdAt: string;
};

export type QueueItem = {
  id: string;
  queueNumber: string;
  customerId: string;
  packageId: string;
  customerName: string;
  packageName: string;
  licensePlate: string;
  scheduledAt: string;
  status: QueueStatus;
  total: number;
  createdAt: string;
};

export type Payment = {
  id: string;
  transactionId: string;
  queueNumber: string;
  customerName: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  paidAt?: string | null;
  createdAt: string;
};

export type TransactionItem = {
  id: string;
  queueId: string;
  queueNumber: string;
  customerId: string;
  customerName: string;
  packageId: string;
  packageName: string;
  total: number;
  status: PaymentStatus;
  createdAt: string;
};

const now = new Date();
const iso = (dayOffset = 0, hour = 9, minute = 0) => {
  const date = new Date(now);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export const demoCustomers: Customer[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Rizky Pratama",
    phone: "081234567890",
    licensePlate: "B 1288 KLR",
    vehicleType: "mobil",
    notes: "Interior perlu vacuum ekstra",
    createdAt: iso(-8),
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    name: "Nadia Putri",
    phone: "082112223333",
    licensePlate: "D 4040 NAD",
    vehicleType: "suv",
    notes: "Pelanggan langganan paket premium",
    createdAt: iso(-5),
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    name: "Fajar Maulana",
    phone: "085677788899",
    licensePlate: "F 9012 FM",
    vehicleType: "motor",
    notes: "Tanpa semir ban",
    createdAt: iso(-2),
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    name: "Sinta Aulia",
    phone: "087700001111",
    licensePlate: "AB 77 SA",
    vehicleType: "van",
    notes: "Booking korporat",
    createdAt: iso(-1),
  },
];

export const demoPackages: WashPackage[] = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    name: "Express Wash",
    description: "Cuci eksterior cepat, bilas salju, dan pengeringan microfiber.",
    price: 35000,
    estimatedMinutes: 25,
    isActive: true,
    createdAt: iso(-20),
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    name: "Premium Gloss",
    description: "Cuci eksterior, vacuum interior, semir ban, dan wax kilap.",
    price: 85000,
    estimatedMinutes: 55,
    isActive: true,
    createdAt: iso(-20),
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    name: "Detailing Care",
    description: "Perawatan lengkap interior-eksterior dengan coating ringan.",
    price: 175000,
    estimatedMinutes: 120,
    isActive: true,
    createdAt: iso(-18),
  },
  {
    id: "20000000-0000-4000-8000-000000000004",
    name: "Motor Shine",
    description: "Cuci motor, degreaser ringan, dan finishing body.",
    price: 25000,
    estimatedMinutes: 20,
    isActive: true,
    createdAt: iso(-16),
  },
];

export const demoQueues: QueueItem[] = [
  {
    id: "30000000-0000-4000-8000-000000000001",
    queueNumber: "CR-001",
    customerId: demoCustomers[0].id,
    packageId: demoPackages[1].id,
    customerName: demoCustomers[0].name,
    packageName: demoPackages[1].name,
    licensePlate: demoCustomers[0].licensePlate,
    scheduledAt: iso(0, 9, 30),
    status: "selesai",
    total: demoPackages[1].price,
    createdAt: iso(0, 9, 0),
  },
  {
    id: "30000000-0000-4000-8000-000000000002",
    queueNumber: "CR-002",
    customerId: demoCustomers[1].id,
    packageId: demoPackages[2].id,
    customerName: demoCustomers[1].name,
    packageName: demoPackages[2].name,
    licensePlate: demoCustomers[1].licensePlate,
    scheduledAt: iso(0, 10, 15),
    status: "diproses",
    total: demoPackages[2].price,
    createdAt: iso(0, 9, 25),
  },
  {
    id: "30000000-0000-4000-8000-000000000003",
    queueNumber: "CR-003",
    customerId: demoCustomers[2].id,
    packageId: demoPackages[3].id,
    customerName: demoCustomers[2].name,
    packageName: demoPackages[3].name,
    licensePlate: demoCustomers[2].licensePlate,
    scheduledAt: iso(0, 11, 0),
    status: "menunggu",
    total: demoPackages[3].price,
    createdAt: iso(0, 10, 10),
  },
  {
    id: "30000000-0000-4000-8000-000000000004",
    queueNumber: "CR-004",
    customerId: demoCustomers[3].id,
    packageId: demoPackages[0].id,
    customerName: demoCustomers[3].name,
    packageName: demoPackages[0].name,
    licensePlate: demoCustomers[3].licensePlate,
    scheduledAt: iso(1, 8, 30),
    status: "menunggu",
    total: demoPackages[0].price,
    createdAt: iso(0, 11, 15),
  },
];

export const demoTransactions: TransactionItem[] = [
  {
    id: "50000000-0000-4000-8000-000000000001",
    queueId: demoQueues[0].id,
    queueNumber: demoQueues[0].queueNumber,
    customerId: demoCustomers[0].id,
    customerName: demoCustomers[0].name,
    packageId: demoPackages[1].id,
    packageName: demoPackages[1].name,
    total: demoPackages[1].price,
    status: "lunas",
    createdAt: iso(0, 10, 15),
  },
  {
    id: "50000000-0000-4000-8000-000000000002",
    queueId: demoQueues[1].id,
    queueNumber: demoQueues[1].queueNumber,
    customerId: demoCustomers[1].id,
    customerName: demoCustomers[1].name,
    packageId: demoPackages[2].id,
    packageName: demoPackages[2].name,
    total: demoPackages[2].price,
    status: "belum_bayar",
    createdAt: iso(0, 10, 25),
  },
  {
    id: "50000000-0000-4000-8000-000000000003",
    queueId: demoQueues[2].id,
    queueNumber: demoQueues[2].queueNumber,
    customerId: demoCustomers[2].id,
    customerName: demoCustomers[2].name,
    packageId: demoPackages[3].id,
    packageName: demoPackages[3].name,
    total: demoPackages[3].price,
    status: "belum_bayar",
    createdAt: iso(0, 10, 40),
  },
  {
    id: "50000000-0000-4000-8000-000000000004",
    queueId: demoQueues[3].id,
    queueNumber: demoQueues[3].queueNumber,
    customerId: demoCustomers[3].id,
    customerName: demoCustomers[3].name,
    packageId: demoPackages[0].id,
    packageName: demoPackages[0].name,
    total: demoPackages[0].price,
    status: "belum_bayar",
    createdAt: iso(0, 11, 20),
  },
];

export const demoPayments: Payment[] = [
  {
    id: "40000000-0000-4000-8000-000000000001",
    transactionId: "50000000-0000-4000-8000-000000000001",
    queueNumber: "CR-001",
    customerName: demoCustomers[0].name,
    method: "qris",
    amount: demoPackages[1].price,
    status: "lunas",
    paidAt: iso(0, 10, 20),
    createdAt: iso(0, 10, 20),
  },
  {
    id: "40000000-0000-4000-8000-000000000002",
    transactionId: "50000000-0000-4000-8000-000000000002",
    queueNumber: "CR-002",
    customerName: demoCustomers[1].name,
    method: "transfer",
    amount: demoPackages[2].price,
    status: "belum_bayar",
    paidAt: null,
    createdAt: iso(0, 10, 30),
  },
  {
    id: "40000000-0000-4000-8000-000000000003",
    transactionId: "50000000-0000-4000-8000-000000000003",
    queueNumber: "CR-003",
    customerName: demoCustomers[2].name,
    method: "tunai",
    amount: demoPackages[3].price,
    status: "belum_bayar",
    paidAt: null,
    createdAt: iso(0, 10, 45),
  },
];

export const weeklyRevenue = [
  { day: "Sen", revenue: 275000, transactions: 5 },
  { day: "Sel", revenue: 410000, transactions: 7 },
  { day: "Rab", revenue: 335000, transactions: 6 },
  { day: "Kam", revenue: 520000, transactions: 9 },
  { day: "Jum", revenue: 695000, transactions: 12 },
  { day: "Sab", revenue: 840000, transactions: 14 },
  { day: "Min", revenue: 590000, transactions: 10 },
];

export const monthlyRevenue = [
  { month: "Jan", revenue: 8200000 },
  { month: "Feb", revenue: 9600000 },
  { month: "Mar", revenue: 10400000 },
  { month: "Apr", revenue: 12850000 },
  { month: "Mei", revenue: 14100000 },
  { month: "Jun", revenue: 15200000 },
];

export const demoActivity = [
  "Admin CleanRide login ke dashboard",
  "Status CR-002 diubah menjadi Diproses",
  "Pembayaran QRIS CR-001 ditandai Lunas",
  "Paket Premium Gloss diperbarui",
  "Pelanggan Sinta Aulia ditambahkan",
];

export type DemoUser = (typeof demoUsers)[number];
