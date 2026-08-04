'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Download, Minus, Inbox } from 'lucide-react';
import { toast } from 'sonner';

interface OrderRecord {
  id: string;
  totalAmount: string | number;
  status: string;
  createdAt: string | Date;
}

interface DynamicAnalyticsChartProps {
  orders: OrderRecord[];
  isLoading?: boolean;
}

/**
 * The orders table only ever holds these four states (order_status enum).
 * Revenue recognises `completed`; `pending` is surfaced separately so orders that
 * exist but have not settled are visible rather than silently dropped.
 */
const REVENUE_STATUS = 'completed';
const PENDING_STATUS = 'pending';

const TIMEFRAMES = {
  '1W': { days: 7, bucketDays: 1 },
  '1M': { days: 30, bucketDays: 1 },
  '3M': { days: 90, bucketDays: 7 },
  '6M': { days: 180, bucketDays: 15 },
  '1Y': { days: 365, bucketDays: 30 },
} as const;

type Timeframe = keyof typeof TIMEFRAMES;

const MS_PER_DAY = 86_400_000;

/** Plot geometry, in CSS pixels. Width is measured from the container. */
const PLOT_HEIGHT = 200;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

export function DynamicAnalyticsChart({ orders, isLoading = false }: DynamicAnalyticsChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // The SVG is drawn in real pixels rather than a stretched viewBox, so strokes and
  // markers keep their intended geometry at every container width.
  const plotRef = useRef<HTMLDivElement | null>(null);
  const [plotWidth, setPlotWidth] = useState(640);

  useEffect(() => {
    const node = plotRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setPlotWidth(w);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const { buckets, totalRevenue, pendingTotal, pendingCount, periodGrowth, avgRevenue, maxRevenue } =
    useMemo(() => {
      const { days, bucketDays } = TIMEFRAMES[timeframe];
      const bucketMs = bucketDays * MS_PER_DAY;
      const bucketCount = Math.ceil(days / bucketDays);

      // Window ends at the close of today, in local time. Bucketing on local dates
      // avoids the off-by-one that UTC date keys cause either side of midnight.
      const windowEnd = new Date();
      windowEnd.setHours(23, 59, 59, 999);
      const windowStart = windowEnd.getTime() - bucketCount * bucketMs;

      const list = Array.from({ length: bucketCount }, (_, idx) => {
        const end = windowEnd.getTime() - (bucketCount - 1 - idx) * bucketMs;
        return { start: new Date(end - bucketMs + 1), end: new Date(end), revenue: 0, count: 0 };
      });

      let totalRevenue = 0;
      let pendingTotal = 0;
      let pendingCount = 0;
      let prevPeriodRevenue = 0;
      const prevWindowStart = windowStart - bucketCount * bucketMs;

      orders.forEach((order) => {
        const date = new Date(order.createdAt);
        if (Number.isNaN(date.getTime())) return;

        const amount = parseFloat(String(order.totalAmount ?? 0));
        if (Number.isNaN(amount)) return;

        const time = date.getTime();

        if (order.status === PENDING_STATUS && time > windowStart && time <= windowEnd.getTime()) {
          pendingTotal += amount;
          pendingCount += 1;
          return;
        }

        if (order.status !== REVENUE_STATUS) return;

        // Immediately preceding window of equal length, for the growth comparison.
        if (time > prevWindowStart && time <= windowStart) {
          prevPeriodRevenue += amount;
          return;
        }

        // Orders outside the window are simply out of scope — the previous build
        // snapped them onto the nearest bucket, inflating the window's edges.
        if (time <= windowStart || time > windowEnd.getTime()) return;

        const idx = bucketCount - 1 - Math.floor((windowEnd.getTime() - time) / bucketMs);
        if (idx < 0 || idx >= bucketCount) return;

        list[idx].revenue += amount;
        list[idx].count += 1;
        totalRevenue += amount;
      });

      const periodGrowth =
        prevPeriodRevenue > 0
          ? parseFloat((((totalRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100).toFixed(1))
          : null;

      return {
        buckets: list,
        totalRevenue,
        pendingTotal,
        pendingCount,
        periodGrowth,
        avgRevenue: list.length ? totalRevenue / list.length : 0,
        maxRevenue: Math.max(...list.map((b) => b.revenue), 0),
      };
    }, [orders, timeframe]);

  const hasData = totalRevenue > 0;

  const formatBucketLabel = useCallback(
    (bucket: { start: Date; end: Date }) => {
      const { bucketDays } = TIMEFRAMES[timeframe];
      const opts: Intl.DateTimeFormatOptions =
        bucketDays === 1 ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric' };
      return bucket.end.toLocaleDateString('en-US', opts);
    },
    [timeframe]
  );

  // Geometry. A flat all-zero series still needs a sane scale, hence the floor.
  const scaleMax = maxRevenue > 0 ? maxRevenue * 1.15 : 100;
  const innerHeight = PLOT_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const coords = useMemo(() => {
    const stepX = buckets.length > 1 ? plotWidth / (buckets.length - 1) : 0;
    return buckets.map((bucket, i) => ({
      x: buckets.length > 1 ? i * stepX : plotWidth / 2,
      y: PAD_TOP + innerHeight - (bucket.revenue / scaleMax) * innerHeight,
      bucket,
    }));
  }, [buckets, plotWidth, scaleMax, innerHeight]);

  const { linePath, areaPath } = useMemo(() => {
    if (coords.length === 0) return { linePath: '', areaPath: '' };
    if (coords.length === 1) {
      const only = coords[0];
      return { linePath: `M 0 ${only.y} L ${plotWidth} ${only.y}`, areaPath: '' };
    }

    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const cpX = (curr.x + next.x) / 2;
      d += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
    }

    const baseline = PAD_TOP + innerHeight;
    return {
      linePath: d,
      areaPath: `${d} L ${coords[coords.length - 1].x} ${baseline} L ${coords[0].x} ${baseline} Z`,
    };
  }, [coords, plotWidth, innerHeight]);

  // Four gridlines, and the y-axis labels sit at exactly these positions rather
  // than being distributed by flexbox against a different height.
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    y: PAD_TOP + innerHeight - ratio * innerHeight,
    value: scaleMax * ratio,
  }));

  // Thin the x labels so they never collide, regardless of bucket count.
  const labelStride = Math.max(1, Math.ceil(buckets.length / 6));

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!plotRef.current || coords.length === 0) return;
    const rect = plotRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const stepX = coords.length > 1 ? rect.width / (coords.length - 1) : rect.width;
    const idx = Math.round(x / stepX);
    setHoverIndex(Math.min(Math.max(idx, 0), coords.length - 1));
  };

  const handleExportCSV = () => {
    if (buckets.length === 0) {
      toast.error('No analytics data available to export');
      return;
    }

    const rows = [['Period Start', 'Period End', 'Revenue', 'Orders'].join(',')];
    buckets.forEach((b) => {
      rows.push(
        [
          b.start.toISOString().split('T')[0],
          b.end.toISOString().split('T')[0],
          b.revenue.toFixed(2),
          b.count,
        ].join(',')
      );
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `revenue_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Revenue report exported');
  };

  const formatCompact = (num: number) => {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
    return `$${Math.round(num)}`;
  };

  const formatMoney = (num: number) =>
    num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const hovered = hoverIndex !== null ? coords[hoverIndex] : null;

  return (
    <div className="bg-white border border-[#E5E2D9] rounded-3xl p-6 sm:p-7 shadow-luxe-card flex flex-col h-full">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl font-bold tracking-tight text-[#111827]">
            Revenue
          </h3>
          <p className="text-xs text-[#6B7280] mt-1">
            Settled orders over the selected period
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div
            role="group"
            aria-label="Timeframe"
            className="flex items-center bg-[#F5F0E4]/70 p-1 rounded-full border border-[#E5E2D9]"
          >
            {(Object.keys(TIMEFRAMES) as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                aria-pressed={timeframe === tf}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-full transition-all cursor-pointer focus-luxe ${
                  timeframe === tf
                    ? 'bg-[#2E5A44] text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-bold rounded-full bg-white hover:bg-[#EAF2ED] text-[#111827] border border-[#E5E2D9] hover:border-[#2E5A44] transition-all cursor-pointer focus-luxe"
          >
            <Download className="w-3.5 h-3.5 text-[#2E5A44]" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* ── Headline figure ──────────────────────────────────────────────── */}
      <div className="mt-6 flex items-end gap-4 flex-wrap">
        {isLoading ? (
          <div className="h-10 w-40 bg-[#F5F0E4] rounded-lg animate-pulse" />
        ) : (
          <>
            <span className="font-mono text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight tabular-nums">
              {formatMoney(totalRevenue)}
            </span>
            {periodGrowth === null ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-[#9CA3AF] pb-1.5">
                <Minus className="w-3.5 h-3.5" />
                <span>No prior period</span>
              </span>
            ) : (
              <span
                className={`flex items-center gap-1 text-xs font-bold pb-1.5 ${
                  periodGrowth >= 0 ? 'text-[#2E5A44]' : 'text-[#B45309]'
                }`}
              >
                {periodGrowth >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span className="tabular-nums">
                  {periodGrowth >= 0 ? '+' : ''}
                  {periodGrowth}%
                </span>
                <span className="text-[#9CA3AF] font-medium">vs previous {timeframe}</span>
              </span>
            )}
          </>
        )}
      </div>

      {/* ── Plot ─────────────────────────────────────────────────────────── */}
      <div className="mt-6 flex-1">
        {isLoading ? (
          <div
            className="w-full bg-[#F5F0E4]/50 rounded-2xl animate-pulse"
            style={{ height: PLOT_HEIGHT }}
          />
        ) : (
          <div className="flex gap-3">
            {/* Y axis, positioned against the same geometry the plot uses */}
            <div className="relative w-12 shrink-0" style={{ height: PLOT_HEIGHT }}>
              {gridLines.map((line) => (
                <span
                  key={line.ratio}
                  className="absolute right-0 -translate-y-1/2 font-mono text-[10px] text-[#9CA3AF] tabular-nums"
                  style={{ top: line.y }}
                >
                  {formatCompact(line.value)}
                </span>
              ))}
            </div>

            <div className="flex-1 min-w-0">
              <div
                ref={plotRef}
                className="relative"
                style={{ height: PLOT_HEIGHT }}
                onPointerMove={handlePointerMove}
                onPointerLeave={() => setHoverIndex(null)}
              >
                <svg
                  width={plotWidth}
                  height={PLOT_HEIGHT}
                  className="overflow-visible block"
                  role="img"
                  aria-label={`Revenue over the last ${timeframe}, totalling ${formatMoney(totalRevenue)}`}
                >
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2E5A44" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#2E5A44" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Recessive grid */}
                  {gridLines.map((line) => (
                    <line
                      key={line.ratio}
                      x1={0}
                      y1={line.y}
                      x2={plotWidth}
                      y2={line.y}
                      stroke="#EAF2ED"
                      strokeWidth={1}
                      strokeDasharray={line.ratio === 0 ? undefined : '3 4'}
                    />
                  ))}

                  {hasData && areaPath && <path d={areaPath} fill="url(#revenueFill)" />}

                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke={hasData ? '#2E5A44' : '#C6DFD1'}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Crosshair + focused marker */}
                  {hovered && hasData && (
                    <g pointerEvents="none">
                      <line
                        x1={hovered.x}
                        y1={PAD_TOP}
                        x2={hovered.x}
                        y2={PAD_TOP + innerHeight}
                        stroke="#2E5A44"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        opacity={0.5}
                      />
                      <circle cx={hovered.x} cy={hovered.y} r={5} fill="#2E5A44" />
                      <circle
                        cx={hovered.x}
                        cy={hovered.y}
                        r={5}
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                    </g>
                  )}
                </svg>

                {/* Tooltip, clamped so it never leaves the card */}
                {hovered && hasData && (
                  <div
                    className="absolute z-20 pointer-events-none bg-[#111827] text-white px-3 py-2 rounded-xl shadow-luxe-lg min-w-[132px]"
                    style={{
                      left: Math.min(Math.max(hovered.x, 66), Math.max(plotWidth - 66, 66)),
                      top: Math.max(hovered.y - 12, 0),
                      transform: 'translate(-50%, -100%)',
                    }}
                  >
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#C6DFD1]">
                      {formatBucketLabel(hovered.bucket)}
                    </div>
                    <div className="font-mono text-sm font-bold mt-0.5 tabular-nums">
                      {formatMoney(hovered.bucket.revenue)}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {hovered.bucket.count} {hovered.bucket.count === 1 ? 'order' : 'orders'}
                    </div>
                  </div>
                )}

                {/* Empty state sits over the flat baseline rather than pretending it is data */}
                {!hasData && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <Inbox className="w-6 h-6 text-[#C6DFD1] mb-2" />
                    <p className="text-xs font-semibold text-[#6B7280]">
                      No settled revenue in this period
                    </p>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                      {pendingCount > 0
                        ? `${pendingCount} pending ${pendingCount === 1 ? 'order' : 'orders'} awaiting settlement`
                        : 'Try a longer timeframe'}
                    </p>
                  </div>
                )}
              </div>

              {/* X axis */}
              <div className="relative h-5 mt-1">
                {coords.map((c, i) =>
                  i % labelStride === 0 || i === coords.length - 1 ? (
                    <span
                      key={i}
                      className="absolute -translate-x-1/2 font-mono text-[10px] text-[#9CA3AF] whitespace-nowrap"
                      style={{
                        left: Math.min(Math.max(c.x, 18), Math.max(plotWidth - 18, 18)),
                      }}
                    >
                      {formatBucketLabel(c.bucket)}
                    </span>
                  ) : null
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Summary ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap mt-6 pt-5 border-t border-[#EAF2ED]">
        <div className="bg-[#FDFBF7] border border-[#E5E2D9] px-3.5 py-2 rounded-full flex items-center gap-2 text-[11px]">
          <span className="text-[#6B7280] font-medium">Avg / period</span>
          <strong className="text-[#111827] font-mono font-bold tabular-nums">
            {formatMoney(avgRevenue)}
          </strong>
        </div>

        {pendingCount > 0 && (
          <div className="bg-[#FEF6E7] border border-[#F0D9A8] px-3.5 py-2 rounded-full flex items-center gap-2 text-[11px]">
            <span className="text-[#8A5C29] font-medium">
              Pending ({pendingCount})
            </span>
            <strong className="text-[#8A5C29] font-mono font-bold tabular-nums">
              {formatMoney(pendingTotal)}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}
