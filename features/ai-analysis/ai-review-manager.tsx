"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  BarChart3,
  BadgeCheck,
  Loader2,
  Minus,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { SentimentDistributionChart } from "@/features/ai-analysis/sentiment-distribution-chart";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import { getFormErrors, getResponseMessage, type FormErrors } from "@/lib/form-utils";
import type { AiReviewAnalysis } from "@/lib/data";
import { reviewSentimentLabels, type ReviewSentiment } from "@/lib/constants";
import { analyzeReviewSentiment, reviewKeywords } from "@/lib/review-sentiment";
import { cn, formatDate } from "@/lib/utils";
import { aiReviewSchema } from "@/schemas/ai-review";

const initialForm = {
  customerName: "",
  review: "",
};

export function AiReviewManager({ initialData }: { initialData: AiReviewAnalysis[] }) {
  const csrfFetch = useCsrfFetch();
  const [data, setData] = useState<AiReviewAnalysis[]>(initialData);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState({
    search: "",
    sentiment: "all" as ReviewSentiment | "all",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [latestResult, setLatestResult] = useState<AiReviewAnalysis | null>(initialData[0] ?? null);

  const statistics = useMemo(() => {
    const positive = data.filter((item) => item.sentiment === "positif").length;
    const neutral = data.filter((item) => item.sentiment === "netral").length;
    const negative = data.filter((item) => item.sentiment === "negatif").length;
    const total = data.length;

    return {
      total,
      positive,
      neutral,
      negative,
      satisfactionRate: total ? Math.round((positive / total) * 100) : 0,
    };
  }, [data]);

  const sentimentFilteredData = useMemo(() => {
    return data.filter((item) => (filters.sentiment === "all" ? true : item.sentiment === filters.sentiment));
  }, [data, filters.sentiment]);

  const latestInsights = useMemo(() => {
    if (!latestResult) return null;
    return analyzeReviewSentiment(latestResult.review);
  }, [latestResult]);

  const detectedPositiveKeywords = useMemo(
    () => Array.from(new Set(latestInsights?.positiveMatches ?? [])),
    [latestInsights],
  );
  const detectedNegativeKeywords = useMemo(
    () => Array.from(new Set(latestInsights?.negativeMatches ?? [])),
    [latestInsights],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = aiReviewSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(getFormErrors(parsed.error));
      toast.error("Periksa kembali input review pelanggan");
      return;
    }

    setSubmitting(true);
    setErrors({});

    const response = await csrfFetch("/api/ai-reviews", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    setSubmitting(false);

    if (!response.ok) {
      toast.error(await getResponseMessage(response, "Gagal menganalisis review pelanggan"));
      return;
    }

    const created = (await response.json()) as AiReviewAnalysis;
    setData((items) => [created, ...items]);
    setLatestResult(created);
    setForm(initialForm);
    toast.success("Review berhasil dianalisis dan disimpan");
  }

  const columns = useMemo<ColumnDef<AiReviewAnalysis>[]>(
    () => [
      { accessorKey: "customerName", header: "Nama Pelanggan" },
      {
        accessorKey: "review",
        header: "Review",
        cell: ({ row }) => (
          <div className="max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {row.original.review}
          </div>
        ),
      },
      {
        accessorKey: "sentiment",
        header: "Sentimen",
        cell: ({ row }) => <SentimentBadge sentiment={row.original.sentiment} />,
      },
      {
        accessorKey: "confidenceScore",
        header: "Confidence",
        cell: ({ row }) => <span className="font-semibold">{row.original.confidenceScore}%</span>,
      },
      {
        accessorKey: "createdAt",
        header: "Tanggal",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge>
                  <ScanSearch className="mr-1 size-3" />
                  Keyword NLP Indonesia
                </Badge>
                <CardTitle className="mt-4 text-2xl">Analisis Review Pelanggan</CardTitle>
                <CardDescription className="mt-2 text-sm leading-6">
                  Masukkan review pelanggan, lalu sistem akan membaca kecenderungan sentimen menggunakan keyword Bahasa Indonesia yang ringan dan konsisten dengan arsitektur CleanRide saat ini.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="ai-customer-name">Nama Pelanggan</Label>
                <Input
                  id="ai-customer-name"
                  value={form.customerName}
                  onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
                  placeholder="Contoh: Rizky Pratama"
                  aria-invalid={Boolean(errors.customerName)}
                />
                <FieldError message={errors.customerName} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="ai-review-text">Review Pelanggan</Label>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{form.review.length}/1000 karakter</span>
                </div>
                <Textarea
                  id="ai-review-text"
                  value={form.review}
                  onChange={(event) => setForm((current) => ({ ...current, review: event.target.value }))}
                  placeholder="Contoh: Pelayanannya cepat, hasil cuci bersih, dan staff sangat ramah."
                  aria-invalid={Boolean(errors.review)}
                />
                <FieldError message={errors.review} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <MiniInfo
                  title="Keyword Positif"
                  description={`${reviewKeywords.positive.length} kata kunci untuk menangkap apresiasi pelanggan.`}
                  icon={TrendingUp}
                  tone="text-emerald-600"
                />
                <MiniInfo
                  title="Keyword Negatif"
                  description={`${reviewKeywords.negative.length} kata kunci untuk menangkap keluhan pelanggan.`}
                  icon={TrendingDown}
                  tone="text-rose-600"
                />
              </div>

              <div className="rounded-[1.35rem] border border-cyan-200 bg-cyan-50/70 p-4 text-sm leading-6 text-cyan-900 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-100">
                Confidence score diturunkan dari dominasi keyword positif vs negatif, lalu hasilnya langsung tersimpan ke riwayat review tanpa mengubah logika backend yang sudah stabil.
              </div>

              <Button className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {submitting ? "Menganalisis Review..." : "Analisis Sentimen"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.2),transparent_34%),linear-gradient(160deg,rgba(15,23,42,0.98),rgba(2,6,23,1))] text-white">
          {submitting ? (
            <div className="absolute inset-0 z-10 grid place-items-center bg-slate-950/45 backdrop-blur-sm">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/8 px-5 py-4 text-center">
                <Loader2 className="mx-auto size-5 animate-spin text-cyan-300" />
                <div className="mt-3 text-sm font-medium text-white">Menjalankan analisis sentimen...</div>
              </div>
            </div>
          ) : null}

          <CardHeader>
            <Badge className="w-fit bg-white/10 text-cyan-100 ring-white/10">Insight Terbaru</Badge>
            <CardTitle className="mt-4 text-2xl text-white">Hasil Analisis AI</CardTitle>
            <CardDescription className="mt-2 text-slate-300">
              Panel premium untuk membaca sentimen terakhir, confidence score, dan keyword yang paling memengaruhi hasil analisis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {latestResult ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Nama Pelanggan</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{latestResult.customerName}</div>
                    <div className="mt-2 text-sm text-slate-300">{formatDate(latestResult.createdAt)}</div>
                  </div>
                  <SentimentBadge sentiment={latestResult.sentiment} large />
                </div>

                <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Confidence Score</div>
                      <div className="mt-2 text-4xl font-semibold text-white">{latestResult.confidenceScore}%</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-right text-xs text-slate-300">
                      <div>Sentimen</div>
                      <div className="mt-1 font-semibold text-white">{reviewSentimentLabels[latestResult.sentiment]}</div>
                    </div>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={cn("h-full rounded-full transition-all", confidenceBarClass[latestResult.sentiment])}
                      style={{ width: `${latestResult.confidenceScore}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Review Asli</div>
                  <p className="mt-3 text-sm leading-7 text-slate-100">{latestResult.review}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <KeywordPanel
                    title="Keyword Positif Terdeteksi"
                    emptyLabel="Tidak ada keyword positif terdeteksi"
                    items={detectedPositiveKeywords}
                    tone="positive"
                  />
                  <KeywordPanel
                    title="Keyword Negatif Terdeteksi"
                    emptyLabel="Tidak ada keyword negatif terdeteksi"
                    items={detectedNegativeKeywords}
                    tone="negative"
                  />
                </div>
              </div>
            ) : (
              <div className="grid min-h-[28rem] place-items-center rounded-[1.9rem] border border-white/10 bg-white/5 px-6 text-center">
                <div>
                  <div className="mx-auto grid size-14 place-items-center rounded-[1.4rem] border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                    <Sparkles className="size-6" />
                  </div>
                  <div className="mt-5 text-xl font-semibold text-white">Belum ada hasil analisis</div>
                  <p className="mt-3 max-w-md text-sm leading-7 text-slate-300">
                    Review pertama yang Anda analisis akan langsung muncul di sini bersama sentimen, confidence score, dan keyword yang terdeteksi.
                  </p>
                  <div className="mt-5 text-xs uppercase tracking-[0.24em] text-slate-500">
                    10 keyword positif | 10 keyword negatif
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Review"
          value={statistics.total}
          note="Seluruh review yang pernah dianalisis"
          icon={BarChart3}
          tone="text-cyan-600"
        />
        <StatCard
          title="Positif"
          value={statistics.positive}
          note="Review dominan puas dan apresiatif"
          icon={BadgeCheck}
          tone="text-emerald-600"
        />
        <StatCard
          title="Netral"
          value={statistics.neutral}
          note="Review seimbang atau belum kuat"
          icon={Minus}
          tone="text-amber-600"
        />
        <StatCard
          title="Negatif"
          value={statistics.negative}
          note="Review dominan keluhan pelanggan"
          icon={X}
          tone="text-rose-600"
        />
        <StatCard
          title="Tingkat Kepuasan"
          value={`${statistics.satisfactionRate}%`}
          note="Rasio review positif dari total review"
          icon={ShieldCheck}
          tone="text-sky-600"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),transparent_42%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,1))] text-white">
          <CardHeader>
            <CardTitle className="text-white">Distribusi Sentimen</CardTitle>
            <CardDescription className="text-slate-300">
              Visualisasi modern untuk membaca proporsi review positif, netral, dan negatif secara cepat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SentimentDistributionChart
              positive={statistics.positive}
              neutral={statistics.neutral}
              negative={statistics.negative}
              satisfactionRate={statistics.satisfactionRate}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mesin Keyword AI</CardTitle>
            <CardDescription className="mt-1">
              Engine tetap sederhana dan stabil, tetapi sekarang tampil lebih rapi untuk memudahkan pembacaan pola review pelanggan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <KeywordCluster
              title="Keyword Positif"
              description="Semakin banyak keyword ini muncul, semakin besar peluang sentimen positif."
              items={reviewKeywords.positive}
              itemClassName="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
            />
            <KeywordCluster
              title="Keyword Negatif"
              description="Keyword ini menaikkan kemungkinan sentimen negatif atau menurunkan tingkat kepuasan."
              items={reviewKeywords.negative}
              itemClassName="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Riwayat Review Pelanggan</CardTitle>
              <CardDescription className="mt-1">
                Search nama pelanggan atau isi review, filter sentimen, dan navigasi halaman tetap memakai tabel reusable bawaan project.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="w-fit">
              {statistics.total} Review
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={sentimentFilteredData}
            searchValue={filters.search}
            onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
            searchPlaceholder="Cari nama pelanggan, isi review, atau sentimen..."
            emptyTitle="Belum ada review dianalisis"
            emptyDescription="Masukkan review pelanggan pertama untuk mulai melihat riwayat analisis AI."
            toolbar={
              <>
                <NativeSelect
                  className="min-w-40"
                  value={filters.sentiment}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      sentiment: event.target.value as ReviewSentiment | "all",
                    }))
                  }
                >
                  <option value="all">Semua sentimen</option>
                  <option value="positif">Positif</option>
                  <option value="netral">Netral</option>
                  <option value="negatif">Negatif</option>
                </NativeSelect>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ search: "", sentiment: "all" })}
                >
                  Reset Filter
                </Button>
              </>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SentimentBadge({
  sentiment,
  large = false,
}: {
  sentiment: ReviewSentiment;
  large?: boolean;
}) {
  const tone =
    sentiment === "positif"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-200"
      : sentiment === "negatif"
        ? "bg-rose-50 text-rose-700 ring-rose-500/20 dark:bg-rose-400/10 dark:text-rose-200"
        : "bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-200";

  return (
    <Badge
      variant="secondary"
      className={cn(tone, large && "px-4 py-1.5 text-sm")}
    >
      {reviewSentimentLabels[sentiment]}
    </Badge>
  );
}

function StatCard({
  title,
  value,
  note,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number | string;
  note: string;
  icon: typeof BarChart3;
  tone: string;
}) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full items-start justify-between gap-4 pt-6">
        <div className="min-w-0">
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
          <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">{note}</p>
        </div>
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-900">
          <Icon className={cn("size-5", tone)} />
        </div>
      </CardContent>
    </Card>
  );
}

function KeywordCluster({
  title,
  description,
  items,
  itemClassName,
}: {
  title: string;
  description: string;
  items: readonly string[];
  itemClassName: string;
}) {
  return (
    <div>
      <div className="font-semibold">{title}</div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className={cn("rounded-full border px-3 py-1 text-xs font-semibold", itemClassName)}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function KeywordPanel({
  title,
  items,
  emptyLabel,
  tone,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
  tone: "positive" | "negative";
}) {
  const badgeClass =
    tone === "positive"
      ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
      : "border-rose-300/20 bg-rose-400/10 text-rose-200";

  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4 backdrop-blur">
      <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{title}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length ? (
          items.map((item) => (
            <span key={item} className={cn("rounded-full border px-3 py-1 text-xs font-semibold", badgeClass)}>
              {item}
            </span>
          ))
        ) : (
          <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-300">
            {emptyLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function MiniInfo({
  title,
  description,
  icon: Icon,
  tone,
}: {
  title: string;
  description: string;
  icon: typeof TrendingUp;
  tone: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/75 p-4 dark:border-slate-800/80 dark:bg-slate-900/70">
      <div className="flex items-center gap-2">
        <div className="grid size-9 place-items-center rounded-xl bg-white dark:bg-slate-950">
          <Icon className={cn("size-4", tone)} />
        </div>
        <div className="font-semibold text-slate-900 dark:text-white">{title}</div>
      </div>
      <div className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</div>
    </div>
  );
}

const confidenceBarClass: Record<ReviewSentiment, string> = {
  positif: "bg-emerald-400",
  netral: "bg-amber-400",
  negatif: "bg-rose-400",
};
