"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { DonutChart, MixBarChart, VolumeChart } from "@/components/charts";
import { BRAND } from "@/lib/brand";
import type { NamedCount, SeriesPoint } from "@/lib/aggregates";

const TIMELINE = [
  { time: "10:42", title: "Record accessed", meta: "Dr. Amina Diallo · Internal Medicine" },
  { time: "10:44", title: "Consultation started", meta: "Encounter ENC-00018492" },
  { time: "10:52", title: "Diagnosis recorded", meta: "Clinical note finalized with version history" },
  { time: "11:30", title: "Laboratory result uploaded", meta: "Critical flag requires physician review" },
  { time: "12:30", title: "Medication dispensed", meta: "Prescription chained to the patient record" },
  { time: "18:05", title: "Patient opened their own dossier", meta: "John Doe · PAT-00018492 · My Health" },
];

export function LandingPage({
  signedIn,
  home,
  stats,
}: {
  signedIn: boolean;
  home: string;
  stats: {
    hospitalName: string;
    patientName: string;
    patientPublicId: string;
    hospital: { volume: SeriesPoint[]; mix: NamedCount[] };
    patient: { visits: SeriesPoint[]; mix: NamedCount[] };
  } | null;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((value) => (value + 1) % TIMELINE.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  const cta = signedIn ? home : "/login";
  const ctaLabel = signedIn ? "Open workspace" : "Enter the live demo";

  return (
    <div className="min-h-screen bg-[#071421] text-white">
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-colors ${
          scrolled ? "border-b border-white/10 bg-[#071421]/90 backdrop-blur" : ""
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="#top" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-300" />
            <span className="text-sm font-semibold tracking-wide">{BRAND.name}</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <a href="#pillars" className="hover:text-white">
              Pillars
            </a>
            <a href="#timeline" className="hover:text-white">
              Accountability
            </a>
            <a href="#insights" className="hover:text-white">
              Insights
            </a>
            <a href="#demo" className="hover:text-white">
              Demo
            </a>
          </nav>
          <Link
            href={cta}
            className="rounded-md bg-teal-400 px-3 py-1.5 text-sm font-semibold text-[#062017] hover:bg-teal-300"
          >
            {signedIn ? "Workspace" : "Sign in"}
          </Link>
        </div>
      </header>

      <section id="top" className="relative isolate min-h-screen overflow-hidden">
        <img
          src="/landing/hero.jpg"
          alt="Hospital operations room with a longitudinal clinical display"
          className="landing-hero-image absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071421] via-[#071421]/80 to-[#071421]/25" />
        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-end px-5 pb-20 pt-28 md:justify-center">
          <p className="landing-fade pm-label text-teal-200">{BRAND.name} · {BRAND.descriptor}</p>
          <h1 className="landing-fade landing-delay-1 mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            {BRAND.tagline}
          </h1>
          <p className="landing-fade landing-delay-2 mt-5 max-w-xl text-base text-white/75 md:text-lg">
            A complete digital memory of every patient, and a transparent record of every clinical interaction—reducing
            risk while protecting revenue and accountability.
          </p>
          <div className="landing-fade landing-delay-3 mt-8 flex flex-wrap gap-3">
            <Link
              href={cta}
              className="rounded-md bg-teal-400 px-5 py-2.5 text-sm font-semibold text-[#062017] hover:bg-teal-300"
            >
              {ctaLabel}
            </Link>
            <Link
              href="/login?as=patient"
              className="rounded-md border border-white/20 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
            >
              Open the patient portal
            </Link>
          </div>
          <p className="landing-fade landing-delay-4 mt-6 text-xs uppercase tracking-[0.16em] text-white/50">
            Demo data only · Investor walkthrough under 10 minutes
          </p>
        </div>
      </section>

      <section id="pillars" className="mx-auto max-w-6xl px-5 py-24">
        <p className="pm-label text-teal-200">Product philosophy</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold">BilAn keeps the memory. Both sides see the aggregate.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              image: "/landing/ehr.jpg",
              alt: "Physician reviewing a longitudinal patient timeline",
              title: "Patient EHR",
              body: "One unique Patient Health ID, a usable snapshot, and a chronological clinical timeline that follows the person—not the folder.",
            },
            {
              image: "/landing/audit.jpg",
              alt: "Quiet hospital setting suggesting audited clinical records",
              title: "Clinical accountability",
              body: "Every sensitive action is attributed: who accessed the record, when, why, and what they created or changed.",
            },
            {
              image: "/landing/intelligence.jpg",
              alt: "Abstract hospital operations signals on a wide display",
              title: "Hospital intelligence",
              body: "Decision support—not an AI doctor. Risks, demand forecasts and anomalies that always require human review.",
            },
          ].map((pillar) => (
            <article
              key={pillar.title}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition duration-500 hover:-translate-y-1 hover:border-teal-300/40"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img src={pillar.image} alt={pillar.alt} className="h-full w-full object-cover transition duration-700 hover:scale-105" />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{pillar.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="timeline" className="border-y border-white/10 bg-[#0b1f33] py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2">
          <div>
            <p className="pm-label text-teal-200">Live clinical timeline</p>
            <h2 className="mt-3 text-3xl font-semibold">Who. When. What.</h2>
            <p className="mt-4 max-w-md text-white/70">
              The investor scenario plays as a continuous memory: authorization, consultation, laboratory, pharmacy, then
              the administrator audit trail.
            </p>
          </div>
          <ol className="relative space-y-5 pl-6">
            <span className="landing-spine absolute bottom-2 left-[7px] top-2 w-px bg-teal-400/40" />
            {TIMELINE.map((item, index) => (
              <li
                key={item.time}
                className={`relative rounded-xl border px-4 py-3 transition duration-500 ${
                  active === index ? "border-teal-300/50 bg-teal-400/10" : "border-white/10 bg-white/5"
                }`}
              >
                <span
                  className={`absolute -left-[21px] top-5 h-3 w-3 rounded-full ${
                    active === index ? "landing-dot bg-teal-300" : "bg-white/40"
                  }`}
                />
                <p className="text-xs tabular text-teal-200">{item.time}</p>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-white/60">{item.meta}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="insights" className="border-y border-white/10 bg-[#0b1f33] py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="pm-label text-teal-200">Live aggregation · DEMO DATA</p>
          <h2 className="mt-3 text-3xl font-semibold">Hospital operations and the patient record, side by side.</h2>
          <p className="mt-3 max-w-2xl text-white/70">
            BilAn rolls clinical activity into explainable totals: volume, mix of work, and the composition of one
            longitudinal dossier. No invented series — these charts read the seeded hospital database.
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="pm-label text-teal-200">Hospital side</p>
              <p className="mt-1 font-medium">{stats?.hospitalName ?? "Hospital activity"}</p>
              <p className="mb-4 text-sm text-white/60">Encounter volume and activity mix, last 30 days.</p>
              <VolumeChart data={stats?.hospital.volume ?? []} theme="dark" name="Encounters" />
              <MixBarChart data={stats?.hospital.mix ?? []} theme="dark" />
            </div>
            <div className="rounded-2xl border border-teal-300/30 bg-teal-400/10 p-5">
              <p className="pm-label text-teal-200">Patient side</p>
              <p className="mt-1 font-medium">
                {stats ? `${stats.patientName} · ${stats.patientPublicId}` : "Patient record"}
              </p>
              <p className="mb-4 text-sm text-white/60">What sits in the dossier, and how visits accumulate.</p>
              <DonutChart data={stats?.patient.mix ?? []} theme="dark" />
              <VolumeChart data={stats?.patient.visits ?? []} theme="dark" name="Visits" />
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-6xl px-5 py-24">
        <p className="pm-label text-teal-200">Presentation path</p>
        <h2 className="mt-3 text-3xl font-semibold">Start with John Doe · PAT-00018492</h2>
        <p className="mt-4 max-w-2xl text-white/70">
          Walk the hospital roles first, then sign in as the patient. John Doe can open his own dossier, authorize a
          doctor, and see who accessed the record.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link href="/login" className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-teal-300/40">
            <p className="pm-label text-teal-200">Hospital demo</p>
            <p className="mt-2 font-medium">Doctor → lab → pharmacy → admin</p>
            <p className="mt-1 text-sm text-white/60">Start a consultation on PAT-00018492 after patient authorization.</p>
          </Link>
          <Link href="/login?as=patient" className="rounded-2xl border border-teal-300/40 bg-teal-400/10 p-5 hover:border-teal-200">
            <p className="pm-label text-teal-200">Patient demo</p>
            <p className="mt-2 font-medium">John Doe opens his own record</p>
            <p className="mt-1 text-sm text-white/60">
              patient@demo-hospital.com · history, prescriptions, labs, and “who accessed my record?”
            </p>
          </Link>
        </div>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-white/50">
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Password</th>
              </tr>
            </thead>
            <tbody className="text-white/85">
              {[
                ["Doctor", "doctor@demo-hospital.com", "DemoDoctor123!"],
                ["Laboratory", "lab@demo-hospital.com", "DemoLab123!"],
                ["Pharmacist", "pharmacy@demo-hospital.com", "DemoPharmacy123!"],
                ["Administrator", "admin@demo-hospital.com", "DemoAdmin123!"],
                ["Patient", "patient@demo-hospital.com", "DemoPatient123!"],
              ].map((row) => (
                <tr key={row[1]} className="border-t border-white/10">
                  <td className="px-4 py-3">{row[0]}</td>
                  <td className="px-4 py-3 tabular">{row[1]}</td>
                  <td className="px-4 py-3 tabular">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link
          href={cta}
          className="mt-8 inline-flex rounded-md bg-teal-400 px-5 py-2.5 text-sm font-semibold text-[#062017] hover:bg-teal-300"
        >
          {ctaLabel}
        </Link>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-xs text-white/40">
        BilAn · DEMO DATA · Synthetic records only · Not a claim of jurisdictional compliance
      </footer>
    </div>
  );
}
