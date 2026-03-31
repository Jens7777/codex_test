import React from 'react';
import {
  THEORY_LIST_SECTION_KEYS,
  THEORY_SECTION_META,
  createListItem,
  replaceListSection
} from '../utils/theory.js';

const listSectionOrder = THEORY_LIST_SECTION_KEYS;

function SectionShell({ title, helper, children, accent = 'teal' }) {
  const accentColor = accent === 'coral' ? '#e83c63' : '#009ca6';

  return (
    <section className="rounded-xl border border-[var(--line-soft)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full" style={{ backgroundColor: accentColor }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: accentColor }}>
              Sektion
            </span>
          </div>
          <h3 className="font-display text-lg font-bold text-[var(--ink-strong)]">{title}</h3>
          <p className="text-sm leading-5 text-[var(--ink-soft)]">{helper}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ListSection({ sectionKey, theory, onTheoryChange }) {
  const meta = THEORY_SECTION_META[sectionKey];
  const items = theory[sectionKey];

  return (
    <SectionShell title={meta.title} helper={meta.helper}>
      <div className="space-y-2.5">
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-[var(--line-soft)] bg-[var(--page-bg)] px-4 py-3.5 text-sm text-[var(--ink-muted)]">
            Ingen text har lagts till an.
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-[var(--line-soft)] bg-[var(--page-bg)] p-3.5"
          >
            <div className="flex items-start gap-2.5">
              <textarea
                rows={3}
                value={item.text}
                onChange={(event) =>
                  onTheoryChange(
                    replaceListSection(
                      theory,
                      sectionKey,
                      items.map((current) =>
                        current.id === item.id ? { ...current, text: event.target.value } : current
                      )
                    )
                  )
                }
                placeholder={meta.placeholder}
                className="field-textarea min-h-[84px] flex-1 text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  onTheoryChange(
                    replaceListSection(
                      theory,
                      sectionKey,
                      items.filter((current) => current.id !== item.id)
                    )
                  )
                }
                className="mt-0.5 inline-flex rounded-lg border border-[var(--line-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-soft)] transition hover:border-[rgba(232,60,99,0.3)] hover:bg-[rgba(232,60,99,0.04)] hover:text-[#e83c63]"
              >
                Ta bort
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onTheoryChange(
            replaceListSection(theory, sectionKey, [...items, createListItem('')])
          )
        }
        className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg bg-[rgba(0,156,166,0.08)] px-4 py-2 text-sm font-semibold text-[#009ca6] transition hover:bg-[rgba(0,156,166,0.14)]"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        </svg>
        Lagg till rad
      </button>
    </SectionShell>
  );
}

function NarrativeSection({ sectionKey, theory, onTheoryChange }) {
  const meta = THEORY_SECTION_META[sectionKey];

  return (
    <SectionShell title={meta.title} helper={meta.helper} accent="coral">
      <textarea
        rows={6}
        value={theory[sectionKey]}
        onChange={(event) =>
          onTheoryChange({
            ...theory,
            [sectionKey]: event.target.value
          })
        }
        placeholder={meta.placeholder}
        className="field-textarea min-h-[160px] text-sm"
      />
    </SectionShell>
  );
}

const renderHighlights = (sourceSummary) => {
  const items = sourceSummary?.sourceHighlights ?? [];
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.id ?? item.text ?? item}
          className="rounded-md bg-[rgba(0,156,166,0.08)] px-3 py-1 text-xs font-semibold text-[#009ca6]"
        >
          {item.text ?? item}
        </span>
      ))}
    </div>
  );
};

export default function TheoryEditor({
  projectTitle,
  theory,
  sourceSummary,
  warnings,
  autosaveLabel,
  onProjectTitleChange,
  onTheoryChange
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Editor header card */}
      <section className="rounded-xl border border-[var(--line-soft)] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-[#009ca6]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#009ca6]">
                Redigering
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-[var(--ink-strong)]">
              {projectTitle || 'Namnlost utkast'}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
              Justera formuleringar, lagg till detaljer och anvand oklara delar som en checklista
              for vidare forankring.
            </p>
          </div>
          <div className="rounded-lg bg-[var(--page-bg)] px-4 py-3 text-sm text-[var(--ink-soft)] min-w-[140px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Autosave
            </div>
            <div className="mt-1 font-semibold text-[var(--ink-strong)] text-sm">{autosaveLabel}</div>
          </div>
        </div>

        <label className="mt-5 block space-y-1.5 text-sm">
          <span className="font-semibold text-[var(--ink-strong)]">Rubrik for utkastet</span>
          <input
            type="text"
            value={projectTitle}
            onChange={(event) => onProjectTitleChange(event.target.value)}
            placeholder="Ange ett tydligt namn pa forandringsteoin"
            className="field-input"
          />
        </label>

        {sourceSummary?.summary && (
          <div className="mt-5 rounded-lg border border-[rgba(0,156,166,0.15)] bg-[rgba(0,156,166,0.03)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#009ca6]">
              Kalltolkning
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{sourceSummary.summary}</p>
            {renderHighlights(sourceSummary)}
          </div>
        )}

        {warnings?.length > 0 && (
          <div className="mt-4 rounded-lg border border-[rgba(255,229,0,0.3)] bg-[rgba(255,229,0,0.06)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a7a00]">
              Modellens noteringar
            </div>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[var(--ink-soft)]">
              {warnings.map((warning) => (
                <li key={warning} className="flex items-start gap-1.5">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#ffe500]" aria-hidden="true" />
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Narrative sections: problem + impact */}
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <NarrativeSection sectionKey="problem" theory={theory} onTheoryChange={onTheoryChange} />
        <NarrativeSection sectionKey="impact" theory={theory} onTheoryChange={onTheoryChange} />
      </div>

      {/* List sections grid */}
      <div className="grid gap-5 xl:grid-cols-2">
        {listSectionOrder.map((sectionKey) => (
          <ListSection
            key={sectionKey}
            sectionKey={sectionKey}
            theory={theory}
            onTheoryChange={onTheoryChange}
          />
        ))}
      </div>
    </div>
  );
}
