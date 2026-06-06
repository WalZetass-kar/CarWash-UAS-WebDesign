"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Car, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import { readJsonResponse } from "@/lib/http/read-json-response";
import { demoUserPasswords, demoUsers, roleLabels } from "@/lib/constants";

const showSeedCredentials = process.env.NODE_ENV !== "production";
const seedAdminEmail = "admin@kilapkendaraan.my.id";
const seedAdminPassword = "admin123";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const csrfFetch = useCsrfFetch();
  const [email, setEmail] = useState(showSeedCredentials ? seedAdminEmail : "");
  const [password, setPassword] = useState(showSeedCredentials ? seedAdminPassword : "");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const response = await csrfFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const payload = await readJsonResponse<{ message?: string }>(response);
    setLoading(false);

    if (!response.ok) {
      toast.error(payload.message ?? "Login gagal");
      return;
    }

    toast.success("Login berhasil");
    router.push(searchParams.get("next") ?? "/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-white/60 bg-white/90 p-5 shadow-2xl shadow-cyan-950/12 backdrop-blur sm:p-6 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mb-6 text-center sm:mb-8">
        <Link href="/" className="relative mx-auto mb-4 grid size-12 overflow-hidden rounded-xl">
          <Image src="/logo.png" alt="Logo" fill className="object-cover" />
        </Link>
        <h1 className="text-2xl font-semibold">Masuk Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {showSeedCredentials
            ? "Gunakan akun seed awal admin atau petugas untuk setup lokal."
            : "Masukkan email dan password akun operasional."}
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

      {showSeedCredentials ? (
        <div className="mt-6 grid gap-2 rounded-lg bg-slate-50 p-4 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          {demoUsers.map((user) => (
            <div key={user.email}>
              <span className="font-semibold">{roleLabels[user.role]}:</span>{" "}
              <span className="break-all">{user.email} / {demoUserPasswords[user.email]}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
