import React from 'react';
import {
  THEORY_LIST_SECTION_KEYS,
  THEORY_SECTION_META,
  createListItem,
  replaceListSection
} from '../utils/theory.js';

const listSectionOrder = THEORY_LIST_SECTION_KEYS;

function SectionShell({ title, helper, children, accent = 'teal' }) {
  const accentClass =
    accent === 'coral'
      ? 'bg-[rgba(221,110,66,0.11)] text-[#b65d3b]'
      : 'bg-[rgba(31,122,140,0.11)] text-[#1f7a8c]';

  return (
    <section className="rounded-[24px] border border-[rgba(28,35,48,0.08)] bg-white p-5 shadow-[0_10px_28px_rgba(28,35,48,0.05)]">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-[0.2em] ${accentClass}`}>
            Sektion
          </span>
          <h3 className="font-display text-xl text-[var(--ink-strong)] leading-snug">{title}</h3>
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
          <p className="rounded-[14px] border border-dashed border-[rgba(28,35,48,0.12)] bg-[rgba(28,35,48,0.02)] px-4 py-3.5 text-sm text-[var(--ink-muted)]">
            Ingen text har lagts till än.
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-[18px] border border-[rgba(28,35,48,0.08)] bg-[var(--paper)] p-3.5"
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
                className="mt-0.5 inline-flex rounded-full border border-[rgba(28,35,48,0.1)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-soft)] transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
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
        className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-[rgba(31,122,140,0.1)] px-4 py-2 text-sm font-semibold text-[#1f7a8c] transition hover:bg-[rgba(31,122,140,0.17)]"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        </svg>
        Lägg till rad
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
          className="rounded-full bg-[rgba(31,122,140,0.1)] px-3 py-1 text-xs font-semibold text-[#1f7a8c]"
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
    <div className="space-y-5">
      {/* Editor header card */}
      <section className="rounded-[28px] border border-[rgba(28,35,48,0.08)] bg-white/92 p-6 shadow-[0_16px_40px_rgba(28,35,48,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex rounded-full bg-[rgba(31,122,140,0.1)] px-3 py-0.5 text-xs font-bold uppercase tracking-[0.22em] text-[#1f7a8c]">
              Redigering
            </span>
            <h2 className="font-display text-3xl text-[var(--ink-strong)] leading-snug">
              {projectTitle || 'Namnlöst utkast'}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
              Justera formuleringar, lägg till detaljer och använd oklara delar som en checklista
              för vidare förankring.
            </p>
          </div>
          <div className="rounded-[18px] bg-[rgba(28,35,48,0.04)] px-4 py-3 text-sm text-[var(--ink-soft)] min-w-[140px]">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              Autosave
            </div>
            <div className="mt-1 font-semibold text-[var(--ink-strong)] text-sm">{autosaveLabel}</div>
          </div>
        </div>

        <label className="mt-5 block space-y-1.5 text-sm">
          <span className="font-semibold text-[var(--ink-strong)]">Rubrik för utkastet</span>
          <input
            type="text"
            value={projectTitle}
            onChange={(event) => onProjectTitleChange(event.target.value)}
            placeholder="Ange ett tydligt namn på förändringsteoin"
            className="field-input"
          />
        </label>

        {sourceSummary?.summary && (
          <div className="mt-5 rounded-[20px] border border-[rgba(31,122,140,0.16)] bg-[rgba(31,122,140,0.05)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1f7a8c]">
              Källtolkning
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{sourceSummary.summary}</p>
            {renderHighlights(sourceSummary)}
          </div>
        )}

        {warnings?.length > 0 && (
          <div className="mt-4 rounded-[20px] border border-amber-200/70 bg-amber-50/70 p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
              Modellens noteringar
            </div>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-amber-800">
              {warnings.map((warning) => (
                <li key={warning} className="flex items-start gap-1.5">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
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
