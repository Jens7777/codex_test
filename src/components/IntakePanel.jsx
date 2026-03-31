import React from 'react';

const kindLabels = {
  docx: 'Word',
  pdf: 'PDF',
  image: 'Bild'
};

const statusLabels = {
  ready: 'Redo',
  processing: 'Bearbetas…',
  error: 'Fel',
  'needs-reupload': 'Ladda upp igen'
};

const formatBytes = (value) => {
  if (!value) {
    return '0 KB';
  }

  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

export default function IntakePanel({
  projectTitle,
  pastedText,
  sources,
  generationError,
  uiMessage,
  isGenerating,
  proxyStatus,
  onProjectTitleChange,
  onPastedTextChange,
  onFilesSelected,
  onRemoveSource,
  onGenerate,
  onCreateBlankDraft
}) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/88 shadow-[0_20px_60px_rgba(28,35,48,0.09)] backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-[rgba(28,35,48,0.07)]">
        <span className="inline-flex rounded-full bg-[rgba(31,122,140,0.1)] px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[#1f7a8c]">
          AI-intag
        </span>
        <h2 className="mt-2.5 font-display text-3xl text-[var(--ink-strong)] leading-snug">
          Samla underlag och generera ett första utkast
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-[var(--ink-soft)]">
          Klistra in text, ladda upp Word, PDF eller bilder och låt verktyget formulera en
          klassisk förändringsteori som du sedan kan redigera vidare.
        </p>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Project name */}
        <label className="block space-y-1.5 text-sm">
          <span className="font-semibold text-[var(--ink-strong)]">Projektnamn</span>
          <input
            type="text"
            value={projectTitle}
            onChange={(event) => onProjectTitleChange(event.target.value)}
            placeholder="Exempel: Lokal satsning för ungas psykiska hälsa"
            className="field-input"
          />
        </label>

        {/* File upload area */}
        <div className="rounded-[20px] border border-[rgba(31,122,140,0.2)] bg-[rgba(31,122,140,0.035)] p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[var(--ink-strong)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2d3547] active:scale-[0.97]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M7 1v8M3.5 4.5 7 1l3.5 3.5M1.5 10.5v1a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Lägg till filer
              <input
                type="file"
                multiple
                accept=".docx,.pdf,image/*"
                className="hidden"
                onChange={(event) => {
                  onFilesSelected(Array.from(event.target.files ?? []));
                  event.target.value = '';
                }}
              />
            </label>
            <p className="text-sm text-[var(--ink-soft)]">
              Stöd för{' '}
              <span className="font-semibold text-[var(--ink-strong)]">docx</span>,{' '}
              <span className="font-semibold text-[var(--ink-strong)]">pdf</span> och{' '}
              <span className="font-semibold text-[var(--ink-strong)]">bilder</span>.
            </p>
          </div>

          <div className="space-y-2">
            {sources.length === 0 && (
              <div className="rounded-[16px] border border-dashed border-[rgba(31,122,140,0.25)] bg-white/60 px-4 py-3 text-sm text-[var(--ink-muted)]">
                Inga filer valda än. Du kan fortfarande generera från inklistrad text, eller skapa
                ett tomt utkast och fylla i manuellt.
              </div>
            )}
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[rgba(28,35,48,0.08)] bg-white px-4 py-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full bg-[rgba(221,110,66,0.12)] px-2.5 py-0.5 text-xs font-bold uppercase tracking-[0.12em] text-[#b65d3b]">
                      {kindLabels[source.kind] ?? 'Fil'}
                    </span>
                    <span className="font-semibold text-[var(--ink-strong)] truncate">{source.name}</span>
                    <span className="text-[var(--ink-muted)] text-xs">{formatBytes(source.size)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-soft)]">
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-semibold ${
                        source.status === 'error'
                          ? 'bg-rose-100 text-rose-700'
                          : source.status === 'needs-reupload'
                            ? 'bg-amber-100 text-amber-700'
                            : source.status === 'processing'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {statusLabels[source.status] ?? 'Redo'}
                    </span>
                    {source.needsReupload && (
                      <span className="text-amber-600">Filen sparas inte lokalt och måste väljas igen.</span>
                    )}
                    {source.warnings?.length > 0 && (
                      <span>{source.warnings.length} notering(ar) från tolkning</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveSource(source.id)}
                  className="inline-flex rounded-full border border-[rgba(28,35,48,0.1)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-soft)] transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                >
                  Ta bort
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pasted text */}
        <label className="block space-y-1.5 text-sm">
          <span className="font-semibold text-[var(--ink-strong)]">Inklistrat underlag</span>
          <textarea
            rows={9}
            value={pastedText}
            onChange={(event) => onPastedTextChange(event.target.value)}
            placeholder="Klistra in projektbeskrivning, ansökningstext, workshop-noteringar eller annan relevant kontext."
            className="field-textarea"
          />
        </label>

        {/* Config info strip */}
        <div className="grid gap-3 rounded-[16px] bg-[rgba(28,35,48,0.04)] px-4 py-3 text-sm text-[var(--ink-soft)] sm:grid-cols-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              Proxy
            </div>
            <div className="mt-0.5 font-semibold text-[var(--ink-strong)] text-xs">{proxyStatus}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              Autosave
            </div>
            <div className="mt-0.5 font-semibold text-[var(--ink-strong)] text-xs">
              Underlag och utkast sparas lokalt
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
              Publicering
            </div>
            <div className="mt-0.5 font-semibold text-[var(--ink-strong)] text-xs">Frontend fungerar på GitHub Pages</div>
          </div>
        </div>

        {/* Error message */}
        {generationError && (
          <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-start gap-2.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-0.5 flex-shrink-0" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>{generationError}</span>
          </div>
        )}

        {/* Info/success message */}
        {!generationError && uiMessage && (
          <div className="rounded-[16px] border border-[rgba(31,122,140,0.2)] bg-[rgba(31,122,140,0.06)] px-4 py-3 text-sm text-[#1f6878] flex items-start gap-2.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-0.5 flex-shrink-0" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 7v4.5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>{uiMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="btn-primary"
          >
            {isGenerating && <span className="spinner" aria-hidden="true" />}
            {isGenerating ? 'Genererar utkast…' : 'Generera förändringsteori'}
          </button>
          <button
            type="button"
            onClick={onCreateBlankDraft}
            className="inline-flex items-center rounded-full border border-[rgba(28,35,48,0.14)] bg-white/70 px-5 py-3 text-sm font-semibold text-[var(--ink-strong)] transition hover:border-[rgba(28,35,48,0.26)] hover:bg-white"
          >
            Starta tomt utkast
          </button>
        </div>
      </div>
    </section>
  );
}
