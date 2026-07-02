import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts'

// Literal token colors — recharts writes SVG presentation attributes, which don't
// resolve CSS var(), so we mirror the HSL values from @shared/styles/index.css here.
export const CHART = {
  primary: 'hsl(221, 83%, 53%)',
  success: 'hsl(142, 65%, 36%)',
  warning: 'hsl(32, 92%, 46%)',
  destructive: 'hsl(0, 72%, 51%)',
  muted: 'hsl(215, 16%, 47%)',
  grid: 'hsl(214, 25%, 91%)',
  axis: 'hsl(215, 16%, 47%)',
}

const AXIS_TICK = { fontSize: 12, fill: CHART.axis }
const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: '1px solid hsl(214, 25%, 91%)',
  boxShadow: '0 4px 16px -2px rgb(15 23 42 / 0.10)',
  fontSize: 13,
}

export function SeriesLineChart({ data, color = CHART.primary }) {
  // Show dots for a sparse series so a few points read as data, not a smooth
  // curve invented by interpolation. The gradient area anchors the line so a
  // flat run at zero doesn't look like a second stray line over the axis.
  const showDots = data.length <= 14
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="seriesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          fill="url(#seriesFill)"
          dot={showDots ? { r: 3, fill: color, strokeWidth: 0 } : false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function DistributionBarChart({ data, color = CHART.primary }) {
  const height = Math.max(200, data.length * 34 + 20)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
        <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: CHART.grid }} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={150}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'hsl(215, 25%, 95%)' }} />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} barSize={18}>
          {data.map((row) => (
            <Cell key={row.key || row.name} fill={row.color || color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function StatusPieChart({ data }) {
  const nonZero = data.filter((d) => d.value > 0)
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Pie
          data={nonZero}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={92}
          paddingAngle={2}
          stroke="none"
        >
          {nonZero.map((row) => (
            <Cell key={row.key || row.name} fill={row.color || CHART.primary} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}
