"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function EmiCalculator({ price }: { price: number }) {
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);

  const principal = price * (1 - down / 100);
  const r = rate / 12 / 100;
  const n = years * 12;
  const emi = r === 0 ? principal / n : (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1);
  const interest = emi * n - principal;
  const pPct = Math.round((principal / (principal + interest)) * 100);

  return (
    <section className="card p-6" aria-labelledby="emi-title">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gold-50 text-[#8a6100]">
          <Calculator className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <div>
          <h2 id="emi-title" className="text-lg font-semibold">Home loan EMI</h2>
          <p className="text-xs text-muted">An estimate to help you plan. Banks decide the final rate.</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          {[
            { label: "Down payment", value: down, set: setDown, min: 10, max: 60, step: 5, fmt: `${down}% · ${inr((price * down) / 100)}` },
            { label: "Interest rate", value: rate, set: setRate, min: 6.5, max: 12, step: 0.1, fmt: `${rate.toFixed(1)}% a year` },
            { label: "Loan period", value: years, set: setYears, min: 5, max: 30, step: 1, fmt: `${years} years` },
          ].map((s) => (
            <label key={s.label} className="block">
              <span className="flex justify-between text-sm">
                <span className="font-medium">{s.label}</span>
                <span className="text-ink-soft">{s.fmt}</span>
              </span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={s.value}
                onChange={(e) => s.set(Number(e.target.value))}
                className="mt-2 w-full accent-brand-green"
              />
            </label>
          ))}
        </div>
        <div className="rounded-2xl bg-brand-green p-5 text-brand-cream">
          <p className="text-xs uppercase tracking-wider text-brand-cream/70">Monthly EMI</p>
          <p className="mt-1 font-display text-3xl font-semibold text-white">{inr(emi)}</p>
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
            <span className="bg-brand-gold" style={{ width: `${pPct}%` }} />
          </div>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-brand-gold" /> Loan amount</dt>
              <dd className="font-semibold text-white">{inr(principal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-white/30" /> Total interest</dt>
              <dd className="font-semibold text-white">{inr(interest)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
