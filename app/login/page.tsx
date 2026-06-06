import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "@/features/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10 sm:py-16">
      <Image
        src="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1800&q=85"
        alt="Area cuci mobil Kilap Kendaraan"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-slate-950/64" />
      <div className="relative z-10 w-full max-w-md">
        <Suspense fallback={<Skeleton className="mx-auto h-[520px] w-full max-w-md" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
