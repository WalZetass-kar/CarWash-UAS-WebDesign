"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import { readJsonResponse } from "@/lib/http/read-json-response";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const csrfFetch = useCsrfFetch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await csrfFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(60_000),
      });
      const payload = await readJsonResponse<{ message?: string }>(response);

      if (!response.ok) {
        toast.error(payload.message ?? "Login gagal");
        return;
      }

      toast.success("Login berhasil");
      router.push(searchParams.get("next") ?? "/dashboard");
      router.refresh();
    } catch {
      toast.error("Gagal terhubung ke server. Periksa koneksi internet atau coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-white/60 bg-white/90 p-5 shadow-2xl shadow-cyan-950/12 backdrop-blur sm:p-6 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mb-6 text-center sm:mb-8">
        <Link href="/" className="relative mx-auto mb-4 grid size-12 overflow-hidden rounded-xl">
          <Image src="/logo.png" alt="Logo" fill sizes="48px" className="object-cover" />
        </Link>
        <h1 className="text-2xl font-semibold">Masuk Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Masukkan email dan password akun operasional yang sudah dibuat di Supabase.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="pl-9"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pl-9 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle password"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <LoadingSpinner className="text-white" /> : null}
          Masuk
        </Button>
      </form>

    </div>
  );
}
