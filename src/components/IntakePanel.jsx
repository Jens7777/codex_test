import React from 'react';

const kindLabels = {
  docx: 'Word',
  pdf: 'PDF',
  image: 'Bild'
};

const statusLabels = {
  ready: 'Redo',
  processing: 'Bearbetas...',
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
    <section className="rounded-xl border border-[var(--line-soft)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-[var(--line-soft)]">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-5 w-1 rounded-full bg-[#009ca6]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#009ca6]">
            AI-intag
          </span>
        </div>
        <h2 className="font-display text-2xl font-bold text-[var(--ink-strong)]">
          Samla underlag och generera
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">
          Klistra in text, ladda upp Word, PDF eller bilder och lat verktyget formulera en
          forandringsteori som du sedan kan redigera vidare.
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
            placeholder="Exempel: Lokal satsning for ungas psykiska halsa"
            className="field-input"
          />
        </label>

        {/* File upload area */}
        <div className="rounded-xl border border-dashed border-[rgba(0,156,166,0.3)] bg-[rgba(0,156,166,0.02)] p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#009ca6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#00b0bb] active:scale-[0.97]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M7 1v8M3.5 4.5 7 1l3.5 3.5M1.5 10.5v1a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Lagg till filer
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
              Stod for{' '}
              <span className="font-semibold text-[var(--ink-strong)]">docx</span>,{' '}
              <span className="font-semibold text-[var(--ink-strong)]">pdf</span> och{' '}
              <span className="font-semibold text-[var(--ink-strong)]">bilder</span>.
            </p>
          </div>

          <div className="space-y-2">
            {sources.length === 0 && (
              <div className="rounded-lg border border-dashed border-[rgba(0,156,166,0.2)] bg-white/60 px-4 py-3 text-sm text-[var(--ink-muted)]">
                Inga filer valda an. Du kan fortfarande generera fran inklistrad text, eller skapa
                ett tomt utkast och fylla i manuellt.
              </div>
            )}
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--line-soft)] bg-white px-4 py-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-md bg-[rgba(0,156,166,0.08)] px-2 py-0.5 text-xs font-bold uppercase tracking-[0.1em] text-[#009ca6]">
                      {kindLabels[source.kind] ?? 'Fil'}
                    </span>
                    <span className="font-semibold text-[var(--ink-strong)] truncate">{source.name}</span>
                    <span className="text-[var(--ink-muted)] text-xs">{formatBytes(source.size)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-soft)]">
                    <span
                      className={`rounded-md px-2 py-0.5 font-semibold ${
                        source.status === 'error'
                          ? 'bg-[rgba(232,60,99,0.08)] text-[#e83c63]'
                          : source.status === 'needs-reupload'
                            ? 'bg-[rgba(255,229,0,0.15)] text-[#8a7a00]'
                            : source.status === 'processing'
                              ? 'bg-[rgba(0,156,166,0.08)] text-[#009ca6]'
                              : 'bg-[rgba(0,156,166,0.08)] text-[#0e4e65]'
                      }`}
                    >
                      {statusLabels[source.status] ?? 'Redo'}
                    </span>
                    {source.needsReupload && (
                      <span className="text-[#e83c63]">Filen sparas inte lokalt och maste valjas igen.</span>
                    )}
                    {source.warnings?.length > 0 && (
                      <span>{source.warnings.length} notering(ar) fran tolkning</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveSource(source.id)}
                  className="inline-flex rounded-lg border border-[var(--line-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-soft)] transition hover:border-[rgba(232,60,99,0.3)] hover:bg-[rgba(232,60,99,0.04)] hover:text-[#e83c63]"
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
            placeholder="Klistra in projektbeskrivning, ansokningstext, workshop-noteringar eller annan relevant kontext."
            className="field-textarea"
          />
        </label>

        {/* Config info strip */}
        <div className="grid gap-3 rounded-lg bg-[var(--page-bg)] px-4 py-3 text-sm text-[var(--ink-soft)] sm:grid-cols-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Proxy
            </div>
            <div className="mt-0.5 font-semibold text-[var(--ink-strong)] text-xs">{proxyStatus}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Autosave
            </div>
            <div className="mt-0.5 font-semibold text-[var(--ink-strong)] text-xs">
              Underlag och utkast sparas lokalt
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Publicering
            </div>
            <div className="mt-0.5 font-semibold text-[var(--ink-strong)] text-xs">Frontend fungerar pa GitHub Pages</div>
          </div>
        </div>

        {/* Error message */}
        {generationError && (
          <div className="rounded-lg border border-[rgba(232,60,99,0.2)] bg-[rgba(232,60,99,0.04)] px-4 py-3 text-sm text-[#e83c63] flex items-start gap-2.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-0.5 flex-shrink-0" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>{generationError}</span>
          </div>
        )}

        {/* Info/success message */}
        {!generationError && uiMessage && (
          <div className="rounded-lg border border-[rgba(0,156,166,0.2)] bg-[rgba(0,156,166,0.04)] px-4 py-3 text-sm text-[#0e4e65] flex items-start gap-2.5">
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
            {isGenerating ? 'Genererar utkast...' : 'Generera forandringsteori'}
          </button>
          <button
            type="button"
            onClick={onCreateBlankDraft}
            className="inline-flex items-center rounded-lg border border-[var(--line-soft)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink-strong)] transition hover:border-[rgba(0,156,166,0.3)] hover:text-[#009ca6]"
          >
            Starta tomt utkast
          </button>
        </div>
      </div>
    </section>
  );
}
