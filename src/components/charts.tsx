"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";

const LIGHT = {
  grid: "#e2e8f0",
  tick: "#64748b",
  line: "#0f766e",
  bar: "#0b1f33",
  area: "#0d9488",
};

const DARK = {
  grid: "#1e3a4c",
  tick: "#94a3b8",
  line: "#5eead4",
  bar: "#2dd4bf",
  area: "#14b8a6",
};

const PIE = ["#0f766e", "#0b1f33", "#0ea5e9", "#b45309", "#be123c", "#64748b"];
const PIE_DARK = ["#2dd4bf", "#5eead4", "#38bdf8", "#fbbf24", "#fb7185", "#94a3b8"];

type Theme = "light" | "dark";

function palette(theme: Theme) {
  return theme === "dark" ? DARK : LIGHT;
}

export function VolumeChart({
  data,
  theme = "light",
  name = "Encounters",
}: {
  data: { day: string; value: number }[];
  theme?: Theme;
  name?: string;
}) {
  const colors = palette(theme);
  if (data.length === 0) {
    return <p className="text-sm text-[var(--muted)]">Insufficient historical data.</p>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: colors.tick }} />
          <YAxis tick={{ fontSize: 11, fill: colors.tick }} />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke={colors.line} fill={colors.area} fillOpacity={0.28} strokeWidth={2} name={name} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MixBarChart({
  data,
  theme = "light",
}: {
  data: { name: string; value: number }[];
  theme?: Theme;
}) {
  const colors = palette(theme);
  if (!data.some((row) => row.value > 0)) {
    return <p className="text-sm text-[var(--muted)]">Insufficient historical data.</p>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: colors.tick }} />
          <YAxis tick={{ fontSize: 11, fill: colors.tick }} />
          <Tooltip />
          <Bar dataKey="value" fill={colors.bar} name="Count" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({
  data,
  theme = "light",
}: {
  data: { name: string; value: number }[];
  theme?: Theme;
}) {
  const slice = theme === "dark" ? PIE_DARK : PIE;
  const filtered = data.filter((row) => row.value > 0);
  if (filtered.length === 0) {
    return <p className="text-sm text-[var(--muted)]">Insufficient historical data.</p>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={filtered} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2}>
            {filtered.map((entry, index) => (
              <Cell key={entry.name} fill={slice[index % slice.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
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
