"use client";

import { FormEvent, useState } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable } from "@/components/tables/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import type { AppSettings, Payment, TransactionItem } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { paymentMethodLabels, paymentStatusLabels } from "@/lib/constants";

export function PaymentManager({
  initialData,
  transactions,
  settings,
  initialSearch,
  highlightedId,
  initialTransactionId,
}: {
  initialData: Payment[];
  transactions: TransactionItem[];
  settings: AppSettings;
  initialSearch?: string;
  highlightedId?: string;
  initialTransactionId?: string;
}) {
  const csrfFetch = useCsrfFetch();
  const [data, setData] = useState<Payment[]>(initialData);
  const [pendingTransactions, setPendingTransactions] = useState<TransactionItem[]>(transactions);
  const [selected, setSelected] = useState<Payment | null>(
    initialData.find((item) => item.id === highlightedId) ?? initialData[0] ?? null,
  );
  const [formOpen, setFormOpen] = useState(Boolean(initialTransactionId));
  const [invoiceOpen, setInvoiceOpen] = useState(Boolean(highlightedId));
  const selectedInitialTransaction =
    pendingTransactions.find((item) => item.id === initialTransactionId) ?? pendingTransactions[0];
  const [form, setForm] = useState({
    transactionId: selectedInitialTransaction?.id ?? "",
    method: "qris",
    amount: selectedInitialTransaction?.total ?? 0,
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

    const saved = await response.json();
    setData((items) => items.map((item) => (item.id === optimistic.id ? saved : item)));
    setSelected(saved);
    setInvoiceOpen(true);
    setPendingTransactions((items) => {
      const next = items.filter((item) => item.id !== form.transactionId);
      setForm((current) => ({
        ...current,
        transactionId: next[0]?.id ?? "",
        amount: next[0]?.total ?? 0,
      }));
      return next;
    });
    setFormOpen(false);
    toast.success("Pembayaran tersimpan");
    if (settings.autoPrintInvoice) {
      printInvoice(saved);
    }
  }

  function printInvoice(payment: Payment) {
    setSelected(payment);
    setInvoiceOpen(true);
    window.setTimeout(() => window.print(), 80);
  }

  async function exportPdf(payment: Payment) {
    const doc = new jsPDF();
    const qrDataUrl = await QRCode.toDataURL(invoicePayload(payment, settings.businessName), {
      margin: 1,
      width: 140,
    });
    doc.setFontSize(18);
    doc.text(settings.businessName, 14, 18);
    doc.setFontSize(11);
    doc.text(`Invoice ${payment.queueNumber}`, 14, 28);
    if (settings.businessPhone) doc.text(settings.businessPhone, 14, 34);
    if (settings.businessAddress) doc.text(settings.businessAddress, 14, 40);
    doc.addImage(qrDataUrl, "PNG", 158, 14, 35, 35);
    autoTable(doc, {
      startY: settings.businessAddress || settings.businessPhone ? 48 : 38,
      head: [["Field", "Value"]],
      body: [
        ["Nama Pelanggan", payment.customerName],
        ["Tanggal", formatDate(payment.createdAt)],
        ["Metode", paymentMethodLabels[payment.method]],
        ["Status", paymentStatusLabels[payment.status]],
        ["Total", formatCurrency(payment.amount)],
      ],
    });
    if (settings.invoiceFooter) {
      doc.setFontSize(10);
      doc.text(settings.invoiceFooter, 14, doc.internal.pageSize.getHeight() - 14, {
        maxWidth: 180,
      });
    }
    doc.save(`invoice-${payment.queueNumber}.pdf`);
  }

  const columns: ColumnDef<Payment>[] = [
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
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => printInvoice(row.original)}
            className="w-full justify-center sm:w-auto"
          >
            <Printer className="size-4" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportPdf(row.original)}
            className="w-full justify-center sm:w-auto"
          >
            <FileDown className="size-4" />
            PDF
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <CardTitle>Riwayat Pembayaran</CardTitle>
          <Button
            type="button"
            onClick={() => setFormOpen(true)}
            disabled={!pendingTransactions.length}
            className="w-full sm:w-auto"
          >
            <Receipt className="size-4" />
            Input Pembayaran
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Cari invoice, pelanggan, metode..."
            initialSearch={initialSearch}
            getRowId={(row) => row.id}
            highlightedRowId={highlightedId}
          />
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Input Pembayaran</DialogTitle>
            <DialogDescription>
              Pilih transaksi belum lunas, metode pembayaran, lalu simpan sebagai lunas.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Transaksi Belum Lunas</Label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-base dark:border-slate-800 dark:bg-slate-950 sm:text-sm"
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
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-base dark:border-slate-800 dark:bg-slate-950 sm:text-sm"
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
              <Input value="Lunas" readOnly />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Batal
              </Button>
              <Button disabled={!pendingTransactions.length}>
                <Receipt className="size-4" />
                Simpan Pembayaran
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={invoiceOpen && Boolean(selected)} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto print:fixed print:inset-0 print:z-50 print:block print:max-h-none print:w-auto print:max-w-none print:translate-x-0 print:translate-y-0 print:rounded-none print:border-0 print:bg-white print:p-8 print:text-slate-950 sm:max-w-lg">
          {selected ? (
            <>
              <DialogHeader className="print:hidden">
                <DialogTitle>Preview Invoice</DialogTitle>
                <DialogDescription>Invoice {selected.queueNumber}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{settings.businessName}</h2>
                  <p className="text-sm text-slate-500">Invoice {selected.queueNumber}</p>
                  <p className="mt-1 text-xs text-slate-500">{settings.businessPhone}</p>
                  <p className="text-xs text-slate-500">{settings.businessAddress}</p>
                </div>
                <div className="grid size-14 place-items-center rounded-lg bg-cyan-600 text-white">CR</div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4"><span>Pelanggan</span><strong className="break-words sm:text-right">{selected.customerName}</strong></div>
                <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4"><span>Tanggal</span><strong className="break-words sm:text-right">{formatDate(selected.createdAt)}</strong></div>
                <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4"><span>Metode</span><strong className="break-words sm:text-right">{paymentMethodLabels[selected.method]}</strong></div>
                <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4"><span>Status</span><strong className="break-words sm:text-right">{paymentStatusLabels[selected.status]}</strong></div>
                <div className="grid gap-1 border-t border-slate-200 pt-3 text-base sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4"><span>Total</span><strong className="break-words sm:text-right">{formatCurrency(selected.amount)}</strong></div>
              </div>
              <div className="mt-5 rounded-lg border border-slate-200 p-3 text-center font-mono text-xs">
                <QRCodeCanvas
                  value={invoicePayload(selected, settings.businessName)}
                  size={112}
                  includeMargin
                  className="mx-auto"
                />
                <div className="mt-2">Scan invoice {settings.businessName}</div>
              </div>
              <p className="mt-4 break-words text-xs text-slate-500">{settings.invoiceFooter}</p>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function invoicePayload(payment: Payment, businessName: string) {
  return JSON.stringify({
    brand: businessName,
    invoice: payment.queueNumber,
    customer: payment.customerName,
    method: payment.method,
    status: payment.status,
    total: payment.amount,
  });
}
