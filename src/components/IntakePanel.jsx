import React from 'react';

const kindLabels = {
  docx: 'Word',
  pdf: 'PDF',
  image: 'Bild'
};

const statusLabels = {
  ready: 'Redo',
  processing: 'Bearbetas',
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
  accessCode,
  pastedText,
  sources,
  generationError,
  uiMessage,
  isGenerating,
  proxyStatus,
  onProjectTitleChange,
  onAccessCodeChange,
  onPastedTextChange,
  onFilesSelected,
  onRemoveSource,
  onGenerate,
  onCreateBlankDraft
}) {
  return (
    <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_rgba(28,35,48,0.08)] backdrop-blur">
      <div className="space-y-3">
        <span className="inline-flex rounded-full bg-[rgba(31,122,140,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#1f7a8c]">
          AI-intag
        </span>
        <div className="space-y-2">
          <h2 className="font-display text-3xl text-[var(--ink-strong)]">
            Samla underlag och generera ett forsta utkast
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
            Klistra in text, ladda upp Word, PDF eller bilder och lat verktyget formulera en
            klassisk forandringsteori som du sedan kan redigera vidare.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-[var(--ink-soft)]">
          <span className="font-semibold text-[var(--ink-strong)]">Projektnamn</span>
          <input
            type="text"
            value={projectTitle}
            onChange={(event) => onProjectTitleChange(event.target.value)}
            placeholder="Exempel: Lokal satsning for ungas psykiska halsa"
            className="field-input"
          />
        </label>
        <label className="space-y-2 text-sm text-[var(--ink-soft)]">
          <span className="font-semibold text-[var(--ink-strong)]">Atkomstkod</span>
          <input
            type="password"
            value={accessCode}
            onChange={(event) => onAccessCodeChange(event.target.value)}
            placeholder="Skriv in koden som proxyn forvantar sig"
            className="field-input"
          />
        </label>
      </div>

      <div className="mt-4 rounded-[28px] border border-[rgba(31,122,140,0.18)] bg-[rgba(31,122,140,0.04)] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center rounded-full bg-[var(--ink-strong)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--ink-soft)]">
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
            Stod for <span className="font-semibold text-[var(--ink-strong)]">docx</span>,{' '}
            <span className="font-semibold text-[var(--ink-strong)]">pdf</span> och{' '}
            <span className="font-semibold text-[var(--ink-strong)]">bilder</span>.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {sources.length === 0 && (
            <div className="rounded-[22px] border border-dashed border-[rgba(31,122,140,0.24)] bg-white/70 p-4 text-sm text-[var(--ink-soft)]">
              Inga filer valda an. Du kan fortfarande generera fran inklistrad text, eller skapa
              ett tomt utkast och fylla i manuellt.
            </div>
          )}
          {sources.map((source) => (
            <div
              key={source.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[rgba(28,35,48,0.08)] bg-white px-4 py-3"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-[rgba(221,110,66,0.12)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#b65d3b]">
                    {kindLabels[source.kind] ?? 'Fil'}
                  </span>
                  <span className="font-semibold text-[var(--ink-strong)]">{source.name}</span>
                  <span className="text-[var(--ink-soft)]">{formatBytes(source.size)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-soft)]">
                  <span
                    className={`rounded-full px-2.5 py-1 font-semibold ${
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
                  {source.needsReupload && <span>Filen sparas inte lokalt och maste valjas igen.</span>}
                  {source.warnings?.length > 0 && <span>{source.warnings.length} notering(ar) fran tolkning</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveSource(source.id)}
                className="inline-flex rounded-full border border-[rgba(28,35,48,0.12)] px-3 py-2 text-xs font-semibold text-[var(--ink-soft)] transition hover:border-[rgba(28,35,48,0.24)] hover:text-[var(--ink-strong)]"
              >
                Ta bort
              </button>
            </div>
          ))}
        </div>
      </div>

      <label className="mt-4 block space-y-2 text-sm text-[var(--ink-soft)]">
        <span className="font-semibold text-[var(--ink-strong)]">Inklistrat underlag</span>
        <textarea
          rows={10}
          value={pastedText}
          onChange={(event) => onPastedTextChange(event.target.value)}
          placeholder="Klistra in projektbeskrivning, ansokningstext, workshop-noteringar eller annan relevant kontext."
          className="field-textarea"
        />
      </label>

      <div className="mt-4 grid gap-3 rounded-[24px] bg-[rgba(28,35,48,0.04)] p-4 text-sm text-[var(--ink-soft)] sm:grid-cols-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Proxy
          </div>
          <div className="mt-1 font-semibold text-[var(--ink-strong)]">{proxyStatus}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Autosave
          </div>
          <div className="mt-1 font-semibold text-[var(--ink-strong)]">
            Underlag och utkast sparas lokalt
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            Publicering
          </div>
          <div className="mt-1 font-semibold text-[var(--ink-strong)]">Frontend fungerar pa GitHub Pages</div>
        </div>
      </div>

      {(generationError || uiMessage) && (
        <div className="mt-4 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {generationError || uiMessage}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="inline-flex items-center rounded-full bg-[var(--accent-coral)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(221,110,66,0.25)] transition hover:-translate-y-0.5 hover:bg-[#cc6239] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? 'Genererar utkast...' : 'Generera forandringsteori'}
        </button>
        <button
          type="button"
          onClick={onCreateBlankDraft}
          className="inline-flex items-center rounded-full border border-[rgba(28,35,48,0.12)] px-5 py-3 text-sm font-semibold text-[var(--ink-strong)] transition hover:border-[rgba(28,35,48,0.24)] hover:bg-white"
        >
          Starta tomt utkast
        </button>
      </div>
    </section>
  );
}
