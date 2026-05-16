"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { QRCodeCanvas } from "qrcode.react";
import { FileDown, Printer, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import type { Payment } from "@/lib/data";
import type { TransactionItem } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { paymentMethodLabels, paymentStatusLabels } from "@/lib/constants";

export function PaymentManager({
  initialData,
  transactions,
}: {
  initialData: Payment[];
  transactions: TransactionItem[];
}) {
  const csrfFetch = useCsrfFetch();
  const [data, setData] = useState<Payment[]>(initialData);
  const [pendingTransactions, setPendingTransactions] = useState<TransactionItem[]>(transactions);
  const [selected, setSelected] = useState<Payment | null>(initialData[0] ?? null);
  const [form, setForm] = useState({
    transactionId: pendingTransactions[0]?.id ?? "",
    method: "qris",
    amount: pendingTransactions[0]?.total ?? 0,
    status: "lunas",
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const transaction = pendingTransactions.find((item) => item.id === form.transactionId);
    if (!transaction) {
      toast.error("Pilih transaksi yang belum lunas");
      return;
    }

    const optimistic: Payment = {
      id: crypto.randomUUID(),
      transactionId: form.transactionId,
      queueNumber: transaction.queueNumber,
      customerName: transaction.customerName,
      method: form.method as Payment["method"],
      amount: transaction.total,
      status: form.status as Payment["status"],
      paidAt: form.status === "lunas" ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    };
    setData((items) => [optimistic, ...items]);
    setSelected(optimistic);

    const response = await csrfFetch("/api/payments", {
      method: "POST",
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      setData((items) => items.filter((item) => item.id !== optimistic.id));
      toast.error("Gagal menyimpan pembayaran");
      return;
    }

    setPendingTransactions((items) => {
      const next = items.filter((item) => item.id !== form.transactionId);
      setForm((current) => ({
        ...current,
        transactionId: next[0]?.id ?? "",
        amount: next[0]?.total ?? 0,
      }));
      return next;
    });
    toast.success("Pembayaran tersimpan");
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
    doc.addImage(qrDataUrl, "PNG", 158, 14, 35, 35);
    autoTable(doc, {
      startY: 38,
      head: [["Field", "Value"]],
      body: [
        ["Nama Pelanggan", payment.customerName],
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
      { accessorKey: "customerName", header: "Pelanggan" },
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
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportPdf(row.original)}>
              <FileDown className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Input Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Transaksi Belum Lunas</Label>
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                  value={form.transactionId}
                  onChange={(event) => {
                    const transaction = pendingTransactions.find((item) => item.id === event.target.value);
                    setForm({
                      ...form,
                      transactionId: event.target.value,
                      amount: transaction?.total ?? 0,
                    });
                  }}
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
                </select>
              </div>
              <div className="space-y-2">
                <Label>Metode</Label>
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                  value={form.method}
                  onChange={(event) => setForm({ ...form, method: event.target.value })}
                >
                  {Object.entries(paymentMethodLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Total Otomatis</Label>
                <Input type="number" value={form.amount} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                >
                  {Object.entries(paymentStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <Button className="w-full" disabled={!pendingTransactions.length}>
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
                </div>
                <div className="grid size-14 place-items-center rounded-lg bg-cyan-600 text-white">CR</div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Pelanggan</span><strong>{selected.customerName}</strong></div>
                <div className="flex justify-between"><span>Tanggal</span><strong>{formatDate(selected.createdAt)}</strong></div>
                <div className="flex justify-between"><span>Metode</span><strong>{paymentMethodLabels[selected.method]}</strong></div>
                <div className="flex justify-between"><span>Status</span><strong>{paymentStatusLabels[selected.status]}</strong></div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base"><span>Total</span><strong>{formatCurrency(selected.amount)}</strong></div>
              </div>
              <div className="mt-5 rounded-lg border border-slate-200 p-3 text-center font-mono text-xs">
                <QRCodeCanvas
                  value={invoicePayload(selected)}
                  size={112}
                  includeMargin
                  className="mx-auto"
                />
                <div className="mt-2">Scan invoice CleanRide</div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} searchPlaceholder="Cari invoice, pelanggan, metode..." />
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
    method: payment.method,
    status: payment.status,
    total: payment.amount,
  });
}
