import React from 'react';
import { Handle, Position } from 'reactflow';
import { LOGIC_STEPS } from '../utils/templates.js';

const stepMap = LOGIC_STEPS.reduce((acc, step) => {
  acc[step.key] = step;
  return acc;
}, {});

const indicatorItem = (indicator, language, index) => (
  <li
    key={indicator.id || `${indicator.label?.[language] ?? indicator}-${index}`}
    className="text-xs bg-white/60 rounded px-2 py-0.5 text-slate-700"
  >
    {typeof indicator === 'string'
      ? indicator
      : indicator.label?.[language] ?? indicator.label?.en ?? ''}
  </li>
);

const assumptionItem = (assumption, language, index) => (
  <li
    key={assumption.id || `${assumption.text?.[language] ?? assumption}-${index}`}
    className="text-xs text-slate-100/90"
  >
    {typeof assumption === 'string'
      ? assumption
      : assumption.text?.[language] ?? assumption.text?.en ?? ''}
  </li>
);

export default function LogicNode({ data, selected }) {
  const step = stepMap[data.stepKey] ?? stepMap.problem;
  const color = step.color ?? {};
  const title = data.title?.[data.language] ?? data.title?.en ?? '';
  const description = data.description?.[data.language] ?? data.description?.en ?? '';
  const indicators = data.indicators ?? [];
  const assumptions = data.assumptions ?? [];

  return (
    <div
      className={`min-w-[220px] max-w-[260px] border-2 shadow-sm bg-white/95 ${
        color.border ?? 'border-slate-300'
      } ${selected ? 'ring-4 ring-offset-2 ring-slate-200' : ''}`}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-slate-500" />
      <div
        className={`rounded-t-xl px-4 py-3 text-white font-semibold ${
          color.background ?? 'bg-slate-700'
        }`}
      >
        {title}
      </div>
      <div className="p-4 space-y-3 text-sm text-slate-700">
        {description && <p>{description}</p>}
        {indicators.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wide text-slate-500">
              {data.language === 'sv' ? 'Indikatorer' : 'Indicators'}
            </h4>
            <ul className="mt-1 flex flex-wrap gap-2">{indicators.map((item, index) => indicatorItem(item, data.language, index))}</ul>
          </div>
        )}
        {assumptions.length > 0 && (
          <div className="bg-slate-900/70 rounded-lg px-3 py-2 text-white">
            <h4 className="text-xs uppercase tracking-wide text-slate-200">
              {data.language === 'sv' ? 'Antaganden' : 'Assumptions'}
            </h4>
            <ul className="mt-1 space-y-1">
              {assumptions.map((item, index) => assumptionItem(item, data.language, index))}
            </ul>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-slate-500" />
    </div>
  );
}
