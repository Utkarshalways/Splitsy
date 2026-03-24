import {
  ArrowRight,
  BellRing,
  Check,
  Coins,
  LayoutDashboard,
  Receipt,
  Sparkles,
  Users,
} from "lucide-react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#2a3439]">
      <header className="sticky top-0 z-50 border-b border-[#a9b4b933] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="text-2xl font-black tracking-tight text-[#006c49]">Splitsy</div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#566166] md:flex">
            <a className="text-[#006c49]" href="#features">
              Features
            </a>
            <a className="hover:text-[#006c49]" href="#about">
              About
            </a>
            <a className="hover:text-[#006c49]" href="#cta">
              Get Started
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="rounded-xl px-4 py-2 text-sm font-semibold text-[#566166] transition hover:bg-[#f0f4f7] hover:text-[#006c49]">
                  Login
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-[#566166] transition hover:bg-[#f0f4f7] hover:text-[#006c49]"
              >
                <LayoutDashboard className="size-4" />
                Dashboard
              </Link>
              <UserButton />
            </Show>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-7xl gap-14 px-6 pb-20 pt-14 lg:grid-cols-2 lg:px-8 lg:pt-20">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#e1e9ee] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#006c49]">
              <Sparkles className="size-3.5" />
              New: Intelligent Group Splitting
            </div>
            <h1 className="text-5xl font-bold leading-[0.95] tracking-[-0.04em] lg:text-6xl">
              Expense sharing,
              <br />
              <span className="italic text-[#006c49]">refined.</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-[#566166]">
              The first landing page of Splitsy. A digital atelier for shared finances, built for friends,
              teams, and travelers who value precision and clarity.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <SignInButton mode="modal">
                <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#006c49] to-[#005f40] px-7 py-4 font-semibold text-[#e1ffec] shadow-[0_18px_38px_rgba(0,108,73,0.2)] transition hover:brightness-105">
                  Start Splitting Now
                  <ArrowRight className="size-4" />
                </button>
              </SignInButton>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-xl bg-[#f0f4f7] px-7 py-4 font-semibold text-[#2a3439] transition hover:bg-[#e1e9ee]"
              >
                See how it works
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[28px] bg-[#f0f4f7] p-4 shadow-[0_24px_56px_rgba(42,52,57,0.12)]">
              <img
                src="/stitch/landing-page-desktop.png"
                alt="Stitch generated desktop landing page mock"
                className="h-auto w-full rounded-[20px] border border-[#a9b4b933]"
              />
            </div>
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#6ffbbe55] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-[#006c4933] blur-3xl" />
          </div>
        </section>

        <section id="features" className="bg-[#f0f4f7] py-24">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#006c49]">The Workbench</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight">Precision tools for modern equity.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-3xl bg-white p-7 lg:col-span-2">
                <Receipt className="mb-4 size-7 text-[#006c49]" />
                <h3 className="text-xl font-bold">Smart Reciprocal Settlement</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#566166]">
                  Splitsy minimizes transactions and suggests the fastest way to settle everyone with fewer
                  payments.
                </p>
              </article>
              <article className="rounded-3xl bg-[#006c49] p-7 text-[#e1ffec]">
                <Coins className="mb-4 size-7" />
                <h3 className="text-xl font-bold">Global Currency Sync</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#d5f7e7]">
                  Live exchange rates across 160+ currencies keep international group expenses fair.
                </p>
              </article>
              <article className="rounded-3xl bg-white p-7">
                <Users className="mb-4 size-7 text-[#006c49]" />
                <h3 className="text-xl font-bold">Unlimited Groups</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#566166]">
                  Separate trips, rent, and events without mixing ledgers.
                </p>
              </article>
              <article className="rounded-3xl bg-white p-7">
                <BellRing className="mb-4 size-7 text-[#006c49]" />
                <h3 className="text-xl font-bold">Gentle Nudges</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#566166]">
                  Smart reminders keep things moving without awkward follow-ups.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto w-full max-w-7xl px-6 py-24 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="rounded-[30px] bg-white p-9 shadow-[0_14px_40px_rgba(42,52,57,0.08)]">
              <h3 className="text-3xl font-bold tracking-tight">Financial harmony, by design.</h3>
              <p className="mt-4 text-[#566166]">
                Splitsy follows a soft editorial UI that reduces cognitive load while making debt structures
                readable and manageable.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-full bg-[#6ffbbe66] p-1 text-[#006c49]">
                    <Check className="size-3.5" />
                  </span>
                  <span className="text-sm text-[#566166]">Privacy-first architecture with encrypted expense data.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-full bg-[#6ffbbe66] p-1 text-[#006c49]">
                    <Check className="size-3.5" />
                  </span>
                  <span className="text-sm text-[#566166]">Bank-grade security and robust identity verification.</span>
                </li>
              </ul>
            </div>
            <div id="cta" className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#006c49] to-[#005f40] p-9 text-[#e1ffec]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.28),transparent_50%)]" />
              <h3 className="relative text-4xl font-bold tracking-tight">Ready to curate your finances?</h3>
              <p className="relative mt-4 max-w-md text-[#d5f7e7]">
                Join thousands of users who have upgraded shared expense management.
              </p>
              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row">
                <SignInButton mode="modal">
                  <button className="rounded-xl bg-white px-6 py-3 font-semibold text-[#005f40] transition hover:bg-[#f0fff8]">
                    Create Free Account
                  </button>
                </SignInButton>
                <a
                  href="#features"
                  className="rounded-xl border border-[#e1ffec55] px-6 py-3 font-semibold transition hover:bg-[#e1ffec1f]"
                >
                  Explore Features
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#a9b4b933] bg-[#f0f4f7] py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 px-6 text-sm text-[#566166] md:flex-row md:items-center lg:px-8">
          <p>Splitsy Digital Atelier</p>
          <p>Copyright 2026. Crafted for shared expense clarity.</p>
        </div>
      </footer>
    </div>
  );
}
