import React from 'react';
import { Handle, Position } from 'reactflow';

export default function OverviewNode({ data }) {
  return (
    <div
      className="min-w-[260px] max-w-[280px] rounded-[24px] border border-[rgba(28,35,48,0.08)] bg-white shadow-[0_18px_38px_rgba(28,35,48,0.08)]"
      style={{
        boxShadow: `0 18px 38px ${data.accent}22`
      }}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-0 !bg-transparent" />
      <div
        className="rounded-t-[24px] px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white"
        style={{ backgroundColor: data.accent }}
      >
        {data.label}
      </div>
      <div className="space-y-2 px-4 py-4 text-sm leading-6 text-[var(--ink-soft)]">
        {data.isEmpty ? (
          <p className="text-[var(--ink-muted)]">Ingen text har lagts till.</p>
        ) : (
          data.items.slice(0, 4).map((item) => (
            <p key={item} className="rounded-[16px] bg-[var(--paper)] px-3 py-2">
              {item}
            </p>
          ))
        )}
        {data.items.length > 4 && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            + {data.items.length - 4} fler punkter
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-0 !bg-transparent" />
    </div>
  );
}
