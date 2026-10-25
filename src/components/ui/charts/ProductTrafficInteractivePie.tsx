'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { PieChart, Pie, Sector, ResponsiveContainer, Tooltip } from 'recharts';

export interface TrafficSegmentItem {
  key: string;
  label: string;
  count: number;
  sharePercent: number;
  color: string;
}

export interface ProductTrafficInteractivePieProps {
  title?: string;
  subtitle?: string;
  data: TrafficSegmentItem[];
  className?: string;
}

export function ProductTrafficInteractivePie({
  title = 'Traffic & Cart Engagement',
  subtitle = 'Customer acquisition, clicks & cart intent distribution',
  data = [],
  className = '',
}: ProductTrafficInteractivePieProps) {
  const [activeKey, setActiveKey] = useState<string>(() => data[0]?.key || 'cart');

  // Sync if data changes
  const activeIndex = useMemo(() => {
    const idx = data.findIndex((item) => item.key === activeKey);
    return idx >= 0 ? idx : 0;
  }, [data, activeKey]);

  const activeItem = data[activeIndex] || data[0] || {
    key: 'empty',
    label: 'No Data',
    count: 0,
    sharePercent: 0,
    color: '#ffffff',
  };

  const totalSum = useMemo(() => {
    return data.reduce((acc, curr) => acc + (curr.count || 0), 0);
  }, [data]);

  const renderActiveShape = useCallback((props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, index } = props;
    const isSelected = index === activeIndex;

    if (isSelected) {
      return (
        <g>
          <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius + 6}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
            className="transition-all duration-300"
          />
          <Sector
            cx={cx}
            cy={cy}
            startAngle={startAngle}
            endAngle={endAngle}
            innerRadius={outerRadius + 10}
            outerRadius={outerRadius + 16}
            fill={fill}
            opacity={0.65}
          />
        </g>
      );
    }

    return (
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.8}
        className="transition-all duration-300"
      />
    );
  }, [activeIndex]);

  return (
    <div className={`toy-card p-5 sm:p-6 flex flex-col justify-between ${className}`}>
      {/* Header with Title and Segment Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#242424]">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>{title}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#202020] text-zinc-300 border border-zinc-700/60">
              Interactive
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Segment Picker Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={activeItem.key}
            onChange={(e) => setActiveKey(e.target.value)}
            className="bg-[#161616] border border-[#2a2a2a] hover:border-zinc-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-400 transition"
          >
            {data.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label} ({item.count.toLocaleString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="relative w-full h-64 sm:h-72 my-2 flex items-center justify-center">
        {data.length > 0 && totalSum > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as TrafficSegmentItem;
                    return (
                      <div className="bg-[#181818] border border-[#2e2e2e] rounded-xl px-3 py-2 shadow-2xl text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: d.color }}
                          />
                          <span className="font-semibold text-white">{d.label}</span>
                        </div>
                        <div className="flex items-baseline justify-between gap-4 font-mono">
                          <span className="text-zinc-400">{d.count.toLocaleString()} actions</span>
                          <span className="font-bold text-white">{d.sharePercent}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={88}
                stroke="#121212"
                strokeWidth={3}
                onClick={(_, index) => {
                  if (data[index]) {
                    setActiveKey(data[index].key);
                  }
                }}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => {
                  if (data[index]) {
                    setActiveKey(data[index].key);
                  }
                }}
                cursor="pointer"
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center p-6 text-xs text-zinc-500">
            No traffic or cart interactions recorded yet for this selection.
          </div>
        )}

        {/* Center Donut Label */}
        {data.length > 0 && totalSum > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight leading-none">
              {activeItem.count.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold text-zinc-400 mt-1 uppercase tracking-wider text-center max-w-[110px] truncate">
              {activeItem.label}
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {activeItem.sharePercent}% of total
            </span>
          </div>
        )}
      </div>

      {/* Legend Pills Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#202020]">
        {data.map((item, idx) => {
          const isSelected = item.key === activeItem.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveKey(item.key)}
              className={`p-2 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-[#222222] border-white/40 shadow-sm'
                  : 'bg-[#161616] border-[#262626] hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[11px] font-medium text-zinc-300 truncate">
                  {item.label}
                </span>
              </div>
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-xs font-bold text-white">
                  {item.count.toLocaleString()}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {item.sharePercent}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
