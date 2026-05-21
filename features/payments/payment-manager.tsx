"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { QRCodeCanvas } from "qrcode.react";
import Flatpickr from "react-flatpickr";
import { FileDown, Printer, Receipt, ScanQrCode } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import { getResponseMessage, type FormErrors } from "@/lib/form-utils";
import type { Payment, TransactionItem } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { paymentMethodLabels, paymentStatusLabels } from "@/lib/constants";

type PaymentForm = {
  transactionId: string;
  method: Payment["method"] | "";
  status: Payment["status"];
};

export function PaymentManager({
  initialData,
  transactions,
}: {
  initialData: Payment[];
  transactions: TransactionItem[];
}) {
  const csrfFetch = useCsrfFetch();
  const [data, setData] = useState<Payment[]>(initialData);
  const [transactionsData, setTransactionsData] = useState<TransactionItem[]>(transactions);
  const [selected, setSelected] = useState<Payment | null>(initialData[0] ?? null);
  const [filters, setFilters] = useState({
    search: "",
    method: "all",
    status: "all",
    range: [] as Date[],
  });
  const [form, setForm] = useState<PaymentForm>({
    transactionId: "",
    method: "",
    status: "lunas",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const pendingTransactions = useMemo(
    () => transactionsData.filter((item) => item.status === "belum_bayar"),
    [transactionsData],
  );

  const activeTransaction =
    pendingTransactions.find((item) => item.id === form.transactionId) ?? pendingTransactions[0] ?? null;
  const activePayment = activeTransaction
    ? data.find((item) => item.transactionId === activeTransaction.id) ?? null
    : null;
  const currentMethod = activeTransaction?.id === form.transactionId ? form.method : activePayment?.method ?? "";
  const currentStatus = activeTransaction?.id === form.transactionId ? form.status : activePayment?.status ?? "lunas";
  const currentAmount = activeTransaction?.total ?? 0;

  const filteredData = useMemo(() => {
    return data.filter((payment) => {
      const normalizedSearch = filters.search.toLowerCase();
      const matchesSearch = [
        payment.queueNumber,
        payment.customerName,
        payment.packageName,
        payment.method,
        payment.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
      const matchesMethod = filters.method === "all" ? true : payment.method === filters.method;
      const matchesStatus = filters.status === "all" ? true : payment.status === filters.status;
      const matchesDate = (() => {
        if (filters.range.length < 2) return true;
        const endDate = new Date(filters.range[1]);
        endDate.setHours(23, 59, 59, 999);
        const paymentDate = new Date(payment.createdAt);
        return paymentDate >= filters.range[0] && paymentDate <= endDate;
      })();

      return matchesSearch && matchesMethod && matchesStatus && matchesDate;
    });
  }, [data, filters]);

  function handleTransactionChange(transactionId: string) {
    const existingPayment = data.find((item) => item.transactionId === transactionId);
    setForm({
      transactionId,
      method: existingPayment?.method ?? "",
      status: existingPayment?.status ?? "lunas",
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const transaction = activeTransaction;
    if (!transaction) {
      toast.error("Pilih transaksi yang belum lunas");
      return;
    }

    const nextErrors: FormErrors = {};
    if (!currentMethod) nextErrors.method = "Metode pembayaran wajib dipilih";
    if (currentAmount < 0) nextErrors.amount = "Harga tidak boleh minus";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Periksa kembali form pembayaran");
      return;
    }

    setSubmitting(true);
    setErrors({});

    const paymentMethod = currentMethod as Payment["method"];
    const existingPayment = activePayment;
    const optimistic: Payment = existingPayment
      ? {
          ...existingPayment,
          method: paymentMethod,
          amount: transaction.total,
          status: currentStatus,
          paidAt: currentStatus === "lunas" ? new Date().toISOString() : null,
        }
      : {
          id: crypto.randomUUID(),
          transactionId: transaction.id,
          queueNumber: transaction.queueNumber,
          customerId: transaction.customerId,
          customerName: transaction.customerName,
          packageName: transaction.packageName,
          method: paymentMethod,
          amount: transaction.total,
          status: currentStatus,
          paidAt: currentStatus === "lunas" ? new Date().toISOString() : null,
          createdAt: new Date().toISOString(),
        };

    setSelected(optimistic);

    if (existingPayment) {
      const previous = data;
      setData((items) => items.map((item) => (item.id === existingPayment.id ? optimistic : item)));
      const response = await csrfFetch(`/api/payments/${existingPayment.id}`, {
        method: "PUT",
        body: JSON.stringify({
          transactionId: transaction.id,
          method: paymentMethod,
          amount: transaction.total,
          status: currentStatus,
        }),
      });
      setSubmitting(false);

      if (!response.ok) {
        setData(previous);
        toast.error(await getResponseMessage(response, "Gagal memperbarui pembayaran"));
        return;
      }

      const saved = await response.json();
      setData((items) => items.map((item) => (item.id === existingPayment.id ? saved : item)));
      setTransactionsData((items) =>
        items.map((item) => (item.id === transaction.id ? { ...item, status: currentStatus } : item)),
      );
      setSelected(saved);
      setForm({ transactionId: "", method: "", status: "lunas" });
      window.dispatchEvent(new CustomEvent("cleanride:payment-updated"));
      toast.success(currentStatus === "lunas" ? "Pembayaran berhasil dilunaskan" : "Pembayaran berhasil diperbarui");
      return;
    }

    setData((items) => [optimistic, ...items]);
    const response = await csrfFetch("/api/payments", {
      method: "POST",
      body: JSON.stringify({
        transactionId: transaction.id,
        method: paymentMethod,
        amount: transaction.total,
        status: currentStatus,
      }),
    });
    setSubmitting(false);

    if (!response.ok) {
      setData((items) => items.filter((item) => item.id !== optimistic.id));
      toast.error(await getResponseMessage(response, "Gagal menyimpan pembayaran"));
      return;
    }

    const created = await response.json();
    setData((items) => items.map((item) => (item.id === optimistic.id ? created : item)));
    setTransactionsData((items) =>
      items.map((item) => (item.id === transaction.id ? { ...item, status: currentStatus } : item)),
    );
    setSelected(created);
    setForm({ transactionId: "", method: "", status: "lunas" });
    window.dispatchEvent(new CustomEvent("cleanride:payment-updated"));
    toast.success("Pembayaran berhasil disimpan");
  }

  function printInvoice(payment: Payment) {
    setSelected(payment);
    window.setTimeout(() => window.print(), 80);
  }

  async function exportPdf(payment: Payment) {
    const doc = new jsPDF();
    const qrDataUrl = await QRCode.toDataURL(invoicePayload(payment), {
      margin: 1,
      width: 140,
    });
    doc.setFontSize(18);
    doc.text("CleanRide Car Wash", 14, 18);
    doc.setFontSize(11);
    doc.text(`Invoice ${payment.queueNumber}`, 14, 28);
    doc.text(`Pelanggan: ${payment.customerName}`, 14, 35);
    doc.addImage(qrDataUrl, "PNG", 158, 12, 35, 35);
    autoTable(doc, {
      startY: 46,
      head: [["Field", "Value"]],
      body: [
        ["Paket", payment.packageName ?? "-"],
        ["Tanggal", formatDate(payment.createdAt)],
        ["Metode", paymentMethodLabels[payment.method]],
        ["Status", paymentStatusLabels[payment.status]],
        ["Total", formatCurrency(payment.amount)],
      ],
    });
    doc.save(`invoice-${payment.queueNumber}.pdf`);
  }

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      { accessorKey: "queueNumber", header: "Invoice" },
      {
        accessorKey: "customerName",
        header: "Pelanggan",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">{row.original.customerName}</div>
            <div className="mt-1 text-xs text-slate-500">{row.original.packageName ?? "Paket belum tersedia"}</div>
          </div>
        ),
      },
      {
        accessorKey: "method",
        header: "Metode",
        cell: ({ row }) => paymentMethodLabels[row.original.method],
      },
      {
        accessorKey: "amount",
        header: "Total",
        cell: ({ row }) => formatCurrency(row.original.amount),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "lunas" ? "success" : "warning"}>
            {paymentStatusLabels[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Tanggal",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "Invoice",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => printInvoice(row.original)}>
              <Printer className="size-4" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportPdf(row.original)}>
              <FileDown className="size-4" />
              PDF
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const paidCount = data.filter((item) => item.status === "lunas").length;

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Input Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <SummaryCard label="Transaksi pending" value={pendingTransactions.length} />
              <SummaryCard label="Invoice lunas" value={paidCount} />
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Transaksi Belum Lunas</Label>
                <NativeSelect
                  value={activeTransaction?.id ?? ""}
                  onChange={(event) => handleTransactionChange(event.target.value)}
                  required
                >
                  {pendingTransactions.length ? (
                    pendingTransactions.map((transaction) => (
                      <option key={transaction.id} value={transaction.id}>
                        {transaction.queueNumber} - {transaction.customerName} - {formatCurrency(transaction.total)}
                      </option>
                    ))
                  ) : (
                    <option value="">Tidak ada transaksi pending</option>
                  )}
                </NativeSelect>
                <FieldError message={errors.transactionId} />
              </div>

              <div className="space-y-2">
                <Label>Metode Pembayaran</Label>
                <NativeSelect
                  value={currentMethod}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      transactionId: activeTransaction?.id ?? current.transactionId,
                      method: event.target.value as Payment["method"] | "",
                    }))
                  }
                >
                  <option value="">Pilih metode pembayaran</option>
                  {Object.entries(paymentMethodLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
                <FieldError message={errors.method} />
              </div>

              <div className="space-y-2">
                <Label>Total Otomatis</Label>
                <Input type="number" value={currentAmount} readOnly />
                <FieldError message={errors.amount} />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <NativeSelect
                  value={currentStatus}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      transactionId: activeTransaction?.id ?? current.transactionId,
                      status: event.target.value as Payment["status"],
                    }))
                  }
                >
                  {Object.entries(paymentStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <Button className="w-full" disabled={!pendingTransactions.length || submitting}>
                <Receipt className="size-4" />
                Simpan Pembayaran
              </Button>
            </form>
          </CardContent>
        </Card>

        {selected ? (
          <Card className="print:fixed print:inset-0 print:z-50 print:block print:rounded-none print:border-0 print:bg-white print:p-8 print:text-slate-950">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-semibold">CleanRide Car Wash</h2>
                  <p className="text-sm text-slate-500">Invoice {selected.queueNumber}</p>
                  <p className="mt-1 text-sm text-slate-500">{selected.customerName}</p>
                </div>
                <div className="grid size-14 place-items-center rounded-2xl bg-cyan-600 text-white">
                  <ScanQrCode className="size-6" />
                </div>
              </div>
              <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex justify-between gap-4"><span>Paket</span><strong>{selected.packageName ?? "-"}</strong></div>
                <div className="flex justify-between gap-4"><span>Tanggal</span><strong>{formatDate(selected.createdAt)}</strong></div>
                <div className="flex justify-between gap-4"><span>Metode</span><strong>{paymentMethodLabels[selected.method]}</strong></div>
                <div className="flex justify-between gap-4"><span>Status</span><strong>{paymentStatusLabels[selected.status]}</strong></div>
                <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-base"><span>Total</span><strong>{formatCurrency(selected.amount)}</strong></div>
              </div>
              <div className="mt-5 rounded-2xl border border-slate-200 p-4 text-center font-mono text-xs">
                <QRCodeCanvas value={invoicePayload(selected)} size={112} includeMargin className="mx-auto" />
                <div className="mt-2">Scan invoice CleanRide</div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Riwayat Pembayaran</CardTitle>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Filter tanggal transaksi, metode pembayaran, status, dan pencarian invoice tetap ringan.
              </p>
            </div>
            <Badge variant="secondary">{filteredData.length} Invoice</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredData}
            searchValue={filters.search}
            onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
            searchPlaceholder="Cari invoice, pelanggan, paket, atau metode pembayaran..."
            toolbar={
              <>
                <Flatpickr
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                  value={filters.range}
                  options={{ mode: "range", dateFormat: "Y-m-d" }}
                  onChange={(dates) => setFilters((current) => ({ ...current, range: dates }))}
                  placeholder="Filter tanggal transaksi"
                />
                <NativeSelect
                  className="min-w-40"
                  value={filters.method}
                  onChange={(event) => setFilters((current) => ({ ...current, method: event.target.value }))}
                >
                  <option value="all">Semua metode</option>
                  {Object.entries(paymentMethodLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
                <NativeSelect
                  className="min-w-40"
                  value={filters.status}
                  onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="all">Semua status</option>
                  {Object.entries(paymentStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
              </>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function invoicePayload(payment: Payment) {
  return JSON.stringify({
    brand: "CleanRide Car Wash",
    invoice: payment.queueNumber,
    customer: payment.customerName,
    packageName: payment.packageName,
    method: payment.method,
    status: payment.status,
    total: payment.amount,
  });
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
