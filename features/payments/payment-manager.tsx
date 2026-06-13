"use client";

import { FormEvent, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import jsPDF from "jspdf";
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
import { formatCurrency, formatDate, toTitleCase } from "@/lib/utils";
import { paymentMethodLabels, paymentStatusLabels } from "@/lib/constants";

export function PaymentManager({
  initialData,
  transactions,
  allTransactions,
  settings,
  initialSearch,
  highlightedId,
  initialTransactionId,
}: {
  initialData: Payment[];
  transactions: TransactionItem[];
  allTransactions: TransactionItem[];
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
    window.setTimeout(() => window.print(), 400);
  }

  async function exportPdf(payment: Payment) {
    const width = 80;
    const doc = new jsPDF({ unit: "mm", format: [width, 160] });
    const margin = 5;
    const contentWidth = width - margin * 2;
    const txn = allTransactions.find((t) => t.id === payment.transactionId);
    let y = margin;

    doc.setFont("courier", "bold");
    doc.setFontSize(11);
    doc.text(settings.businessName, width / 2, y, { align: "center" });
    y += 4;

    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    if (settings.businessPhone) {
      doc.text(settings.businessPhone, width / 2, y, { align: "center" });
      y += 3;
    }
    if (settings.businessAddress) {
      doc.text(settings.businessAddress, width / 2, y, { align: "center", maxWidth: contentWidth });
      y += 3;
    }

    y += 1;
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, y, width - margin, y);
    y += 3;

    doc.setFontSize(7);
    const row = (label: string, value: string) => {
      doc.text(label, margin, y);
      doc.text(value, width - margin, y, { align: "right", maxWidth: contentWidth - 25 });
      y += 3;
    };

    row("No", payment.queueNumber);
    row("Tgl", formatDate(payment.paidAt ?? payment.createdAt));

    y += 1;
    doc.line(margin, y, width - margin, y);
    y += 3;

    row("Pelanggan", payment.customerName);
    if (txn) {
      row("Plat", txn.licensePlate);
      row("Kendaraan", toTitleCase(txn.vehicleType));
    }

    y += 1;
    doc.line(margin, y, width - margin, y);
    y += 3;

    if (txn) {
      row("Paket", txn.packageName);
      y += 1;
      doc.line(margin, y, width - margin, y);
      y += 3;
      row("Subtotal", formatCurrency(txn.subtotal));
      if (txn.discount > 0) {
        row("Diskon", "-" + formatCurrency(txn.discount));
      }
    }

    doc.setFont("courier", "bold");
    doc.setFontSize(9);
    doc.text("TOTAL", margin, y);
    doc.text(formatCurrency(payment.amount), width - margin, y, { align: "right" });
    y += 3;

    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    y += 1;
    doc.line(margin, y, width - margin, y);
    y += 3;

    row("Metode", paymentMethodLabels[payment.method]);
    row("Status", paymentStatusLabels[payment.status]);

    y += 1;
    doc.line(margin, y, width - margin, y);
    y += 3;

    try {
      const qrDataUrl = await QRCode.toDataURL(invoicePayload(payment, settings.businessName), {
        margin: 0,
        width: 120,
      });
      const qrSize = 22;
      doc.addImage(qrDataUrl, "PNG", (width - qrSize) / 2, y, qrSize, qrSize);
      y += qrSize + 3;
    } catch {
      // QR generation failed, skip
    }

    doc.line(margin, y, width - margin, y);
    y += 3;

    if (settings.invoiceFooter) {
      doc.setFontSize(6);
      const lines = doc.splitTextToSize(settings.invoiceFooter, contentWidth);
      for (const line of lines) {
        doc.text(line, width / 2, y, { align: "center" });
        y += 2.5;
      }
    }

    const pageHeight = y + margin;
    const finalDoc = new jsPDF({ unit: "mm", format: [width, pageHeight] });
    finalDoc.addImage(doc.output("datauristring"), "PNG", 0, 0, width, 160);
    finalDoc.save(`struk-${payment.queueNumber}.pdf`);
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
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto p-0 sm:max-w-sm print:fixed print:inset-0 print:z-50 print:block print:max-h-none print:w-auto print:max-w-none print:translate-x-0 print:translate-y-0 print:rounded-none print:border-0 print:bg-white print:p-0">
          {selected ? (() => {
            const txn = allTransactions.find((t) => t.id === selected.transactionId);
            return (
              <>
                <DialogHeader className="print:hidden p-4 pb-0">
                  <DialogTitle>Preview Struk</DialogTitle>
                  <DialogDescription>Struk {selected.queueNumber}</DialogDescription>
                </DialogHeader>
                <div className="receipt-struk mx-auto w-[300px] bg-white p-5 font-mono text-[12px] leading-relaxed text-black print:w-full print:max-w-[80mm] print:p-3">
                  <div className="text-center">
                    <div className="text-[14px] font-bold tracking-wide">{settings.businessName}</div>
                    {settings.businessPhone ? <div>{settings.businessPhone}</div> : null}
                    {settings.businessAddress ? <div className="mt-0.5">{settings.businessAddress}</div> : null}
                  </div>

                  <div className="my-2 border-t border-dashed border-black" />

                  <div className="space-y-0.5">
                    <div className="flex justify-between"><span>No</span><span>: {selected.queueNumber}</span></div>
                    <div className="flex justify-between"><span>Tgl</span><span>: {formatDate(selected.paidAt ?? selected.createdAt)}</span></div>
                  </div>

                  <div className="my-2 border-t border-dashed border-black" />

                  <div className="space-y-0.5">
                    <div className="flex justify-between"><span>Pelanggan</span><span>: {selected.customerName}</span></div>
                    {txn ? (
                      <>
                        <div className="flex justify-between"><span>Plat</span><span>: {txn.licensePlate}</span></div>
                        <div className="flex justify-between"><span>Kendaraan</span><span>: {toTitleCase(txn.vehicleType)}</span></div>
                      </>
                    ) : null}
                  </div>

                  <div className="my-2 border-t border-dashed border-black" />

                  {txn ? (
                    <div className="space-y-0.5">
                      <div className="flex justify-between"><span>Paket</span><span>: {txn.packageName}</span></div>
                    </div>
                  ) : null}

                  <div className="my-2 border-t border-dashed border-black" />

                  <div className="space-y-0.5">
                    {txn ? (
                      <>
                        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(txn.subtotal)}</span></div>
                        {txn.discount > 0 ? (
                          <div className="flex justify-between"><span>Diskon</span><span>-{formatCurrency(txn.discount)}</span></div>
                        ) : null}
                      </>
                    ) : null}
                    <div className="flex justify-between border-t border-black pt-1 font-bold text-[13px]">
                      <span>TOTAL</span>
                      <span>{formatCurrency(selected.amount)}</span>
                    </div>
                  </div>

                  <div className="my-2 border-t border-dashed border-black" />

                  <div className="space-y-0.5">
                    <div className="flex justify-between"><span>Metode</span><span>: {paymentMethodLabels[selected.method]}</span></div>
                    <div className="flex justify-between"><span>Status</span><span>: {paymentStatusLabels[selected.status]}</span></div>
                  </div>

                  <div className="my-2 border-t border-dashed border-black" />

                  <div className="flex justify-center">
                    <QRCodeCanvas
                      value={invoicePayload(selected, settings.businessName)}
                      size={96}
                      includeMargin={false}
                    />
                  </div>

                  <div className="my-2 border-t border-dashed border-black" />

                  {settings.invoiceFooter ? (
                    <div className="text-center">{settings.invoiceFooter}</div>
                  ) : null}
                </div>
                <div className="print:hidden p-4 pt-0">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => printInvoice(selected)} className="flex-1">
                      <Printer className="size-4" />
                      Print
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportPdf(selected)} className="flex-1">
                      <FileDown className="size-4" />
                      PDF
                    </Button>
                  </div>
                </div>
              </>
            );
          })() : null}
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
