"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from "recharts";

export function VolumeChart({ data }: { data: { day: string; value: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--muted)]">Insufficient historical data.</p>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2} dot={false} name="Encounters" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PharmacyChart({ data }: { data: { medication: string; recent: number; historical: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--muted)]">Insufficient historical data.</p>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis dataKey="medication" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={70} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="historical" fill="#94a3b8" name="Previous 30 days" />
          <Bar dataKey="recent" fill="#0b1f33" name="Last 30 days" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
