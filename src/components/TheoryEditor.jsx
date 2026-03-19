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
      ? 'bg-[rgba(221,110,66,0.12)] text-[#b65d3b]'
      : 'bg-[rgba(31,122,140,0.12)] text-[#1f7a8c]';

  return (
    <section className="rounded-[28px] border border-[rgba(28,35,48,0.08)] bg-white p-5 shadow-[0_14px_32px_rgba(28,35,48,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${accentClass}`}>
            Del
          </span>
          <div>
            <h3 className="font-display text-2xl text-[var(--ink-strong)]">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">{helper}</p>
          </div>
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
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="rounded-[20px] border border-dashed border-[rgba(28,35,48,0.12)] bg-[rgba(28,35,48,0.02)] px-4 py-4 text-sm text-[var(--ink-soft)]">
            Ingen text har lagts till an.
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-[22px] border border-[rgba(28,35,48,0.08)] bg-[var(--paper)] p-4"
          >
            <div className="flex items-start gap-3">
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
                className="field-textarea min-h-[92px] flex-1"
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
                className="inline-flex rounded-full border border-[rgba(28,35,48,0.12)] px-3 py-2 text-xs font-semibold text-[var(--ink-soft)] transition hover:border-[rgba(28,35,48,0.24)] hover:text-[var(--ink-strong)]"
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
        className="mt-4 inline-flex rounded-full bg-[rgba(31,122,140,0.12)] px-4 py-2 text-sm font-semibold text-[#1f7a8c] transition hover:bg-[rgba(31,122,140,0.18)]"
      >
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
        className="field-textarea min-h-[180px]"
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
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.id ?? item.text ?? item}
          className="rounded-full bg-[rgba(31,122,140,0.12)] px-3 py-1.5 text-xs font-semibold text-[#1f7a8c]"
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
      <section className="rounded-[30px] border border-[rgba(28,35,48,0.08)] bg-white/90 p-6 shadow-[0_18px_44px_rgba(28,35,48,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex rounded-full bg-[rgba(31,122,140,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#1f7a8c]">
              Redigering
            </span>
            <h2 className="font-display text-3xl text-[var(--ink-strong)]">
              {projectTitle || 'Namnlost utkast'}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
              Justera formuleringar, lagg till detaljer och anvand oklara delar som en checklista
              for vidare forankring.
            </p>
          </div>
          <div className="rounded-[22px] bg-[rgba(28,35,48,0.05)] px-4 py-3 text-sm text-[var(--ink-soft)]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Autosave
            </div>
            <div className="mt-1 font-semibold text-[var(--ink-strong)]">{autosaveLabel}</div>
          </div>
        </div>

        <label className="mt-5 block space-y-2 text-sm text-[var(--ink-soft)]">
          <span className="font-semibold text-[var(--ink-strong)]">Rubrik for utkastet</span>
          <input
            type="text"
            value={projectTitle}
            onChange={(event) => onProjectTitleChange(event.target.value)}
            placeholder="Ange ett tydligt namn pa forandringsteorin"
            className="field-input"
          />
        </label>

        {sourceSummary?.summary && (
          <div className="mt-5 rounded-[24px] border border-[rgba(31,122,140,0.14)] bg-[rgba(31,122,140,0.05)] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1f7a8c]">
              Kalltolkning
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{sourceSummary.summary}</p>
            {renderHighlights(sourceSummary)}
          </div>
        )}

        {warnings?.length > 0 && (
          <div className="mt-4 rounded-[24px] border border-amber-200 bg-amber-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Modellens noteringar
            </div>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-amber-800">
              {warnings.map((warning) => (
                <li key={warning}>- {warning}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <NarrativeSection sectionKey="problem" theory={theory} onTheoryChange={onTheoryChange} />
        <NarrativeSection sectionKey="impact" theory={theory} onTheoryChange={onTheoryChange} />
      </div>

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
