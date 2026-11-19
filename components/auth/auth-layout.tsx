import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <Link href="/login" className="mb-12 inline-flex items-center gap-3 text-slate-900">
            <span className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <BookOpen aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </span>
            <span className="text-base font-semibold tracking-tight">Biczon</span>
          </Link>
          {children}
          <p className="mt-10 text-center text-xs text-slate-400">
            A considered space for school administration
          </p>
        </div>
      </main>

      <aside className="relative hidden overflow-hidden bg-slate-950 text-white lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] [background-size:56px_56px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 top-1/3 size-[34rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-[38%] size-[22rem] rounded-full border border-white/10"
        />

        <div className="relative flex items-center gap-3 text-sm font-medium text-slate-300">
          <span className="size-2 rounded-full bg-emerald-400" />
          School management, thoughtfully arranged
        </div>

        <div className="relative max-w-xl py-16">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Clarity for the work that matters
          </p>
          <h2 className="text-4xl font-medium leading-[1.12] tracking-tight text-white xl:text-5xl">
            Every part of school life, in its place.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
            Keep the everyday work of your school clear, connected, and centered on learning.
          </p>
          <div className="mt-10 h-px w-16 bg-slate-600" />
          <p className="mt-5 text-sm text-slate-400">A calmer view of your school community.</p>
        </div>

        <p className="relative text-xs text-slate-500">Biczon School Management</p>
      </aside>
    </div>
  );
}

export function AuthPageSkeleton() {
  return (
    <AuthLayout>
      <div role="status" aria-label="Checking account" className="animate-pulse space-y-5">
        <div className="h-3 w-24 rounded bg-slate-200" />
        <div className="h-9 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="mt-8 h-11 rounded-lg bg-slate-200" />
        <div className="h-11 rounded-lg bg-slate-200" />
        <div className="h-11 rounded-lg bg-slate-300" />
      </div>
    </AuthLayout>
  );
}
