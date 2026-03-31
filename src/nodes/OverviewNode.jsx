import React from 'react';
import { Handle, Position } from 'reactflow';

export default function OverviewNode({ data }) {
  return (
    <div
      className="min-w-[260px] max-w-[290px] rounded-xl border bg-white"
      style={{
        borderColor: `${data.accent}20`,
        boxShadow: `0 4px 16px ${data.accent}12, 0 1px 3px rgba(0,0,0,0.04)`
      }}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-0 !bg-transparent" />
      <div
        className="flex items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-bold uppercase tracking-wider text-white"
        style={{ backgroundColor: data.accent }}
      >
        {data.label}
      </div>
      <div className="space-y-1.5 px-4 py-3 text-sm leading-6 text-[var(--ink-soft)]">
        {data.isEmpty ? (
          <p className="text-[var(--ink-muted)] italic">Ingen text har lagts till.</p>
        ) : (
          data.items.slice(0, 4).map((item) => (
            <p key={item} className="rounded-lg bg-[#f5f7f8] px-3 py-2 text-[13px] leading-5">
              {item}
            </p>
          ))
        )}
        {data.items.length > 4 && (
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] pt-1">
            + {data.items.length - 4} fler punkter
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-0 !bg-transparent" />
    </div>
  );
}
