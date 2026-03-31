import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';

import IntakePanel from './components/IntakePanel.jsx';
import TheoryEditor from './components/TheoryEditor.jsx';
import { generateTheoryDraft } from './utils/api.js';
import { getAppConfig, getApiBaseUrl } from './utils/config.js';
import { extractTextFromDocx } from './utils/docx.js';
import { exportDraftAsJson, printDraft } from './utils/exporters.js';
import { clearStoredDraft, loadStoredDraft, saveStoredDraft } from './utils/storage.js';
import {
  countSourcesByKind,
  createEmptyTheory,
  createId,
  hasTheoryContent,
  normalizeTheory
} from './utils/theory.js';

const LOCALE = 'sv';
const OverviewCanvas = lazy(() => import('./components/OverviewCanvas.jsx'));

const detectSourceKind = (file) => {
  const lowerName = file.name.toLowerCase();

  if (
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerName.endsWith('.docx')
  ) {
    return 'docx';
  }

  if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return 'pdf';
  }

  if (file.type.startsWith('image/')) {
    return 'image';
  }

  return null;
};

const formatSavedAt = (savedAt) => {
  if (!savedAt) {
    return 'Vantar pa andringar';
  }

  try {
    return new Intl.DateTimeFormat('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(savedAt));
  } catch (error) {
    return 'Sparat';
  }
};

const createDraftExport = ({ projectTitle, theory, sourceSummary, warnings, sources }) => ({
  projectTitle,
  generatedAt: new Date().toISOString(),
  theory: {
    ...theory,
    projectTitle
  },
  sourceSummary,
  warnings,
  sources: (sources ?? []).map((source) => ({
    id: source.id,
    kind: source.kind,
    name: source.name,
    size: source.size,
    status: source.status,
    needsReupload: Boolean(source.needsReupload)
  }))
});

const TAB_ICONS = {
  overview: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1" y="1" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="10" y="1" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="1" y="10" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="10" y="10" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  editor: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  intake: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 1v8M4.5 5.5 8 2l3.5 3.5M2 11v2.5a1 1 0 001 1h10a1 1 0 001-1V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
};

export default function App() {
  const appConfig = useMemo(() => getAppConfig(), []);
  const [projectTitle, setProjectTitle] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [sources, setSources] = useState([]);
  const [theory, setTheory] = useState(createEmptyTheory());
  const [sourceSummary, setSourceSummary] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [uiMessage, setUiMessage] = useState('');
  const [activeView, setActiveView] = useState('intake');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [storageReady, setStorageReady] = useState(false);

  const proxyStatus = useMemo(() => {
    const apiBaseUrl = getApiBaseUrl();
    return apiBaseUrl ? `Konfigurerad (${apiBaseUrl})` : 'Samma origin (/api)';
  }, []);

  const sourceStats = useMemo(() => countSourcesByKind(sources), [sources]);
  const hasDraft = hasTheoryContent(theory);
  const autosaveLabel = useMemo(() => `Senast sparat ${formatSavedAt(lastSavedAt)}`, [lastSavedAt]);

  useEffect(() => {
    const storedDraft = loadStoredDraft();
    if (storedDraft) {
      setProjectTitle(storedDraft.projectTitle ?? '');
      setPastedText(storedDraft.pastedText ?? '');
      setSources(storedDraft.sources ?? []);
      setTheory(normalizeTheory(storedDraft.theory));
      setSourceSummary(storedDraft.sourceSummary ?? null);
      setWarnings(storedDraft.warnings ?? []);
      setActiveView(storedDraft.activeView ?? 'intake');
      setLastSavedAt(storedDraft.savedAt ?? null);
      setUiMessage(
        (storedDraft.sources ?? []).some((source) => source.needsReupload)
          ? 'Tidigare PDF- och bildfiler maste laddas upp pa nytt innan du kan generera igen.'
          : 'Tidigare utkast aterstellt fran lokal autosave.'
      );
    }

    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    const handle = window.setTimeout(() => {
      saveStoredDraft({
        projectTitle,
        pastedText,
        sources,
        theory,
        sourceSummary,
        warnings,
        activeView
      });
      setLastSavedAt(new Date().toISOString());
    }, 300);

    return () => window.clearTimeout(handle);
  }, [activeView, pastedText, projectTitle, sourceSummary, sources, storageReady, theory, warnings]);

  const syncProjectTitle = (nextTitle) => {
    setProjectTitle(nextTitle);
    setTheory((current) => ({
      ...current,
      projectTitle: nextTitle
    }));
  };

  const handleFilesSelected = async (files) => {
    if (!files.length) {
      return;
    }

    setGenerationError('');
    setUiMessage('');

    for (const file of files) {
      const kind = detectSourceKind(file);

      if (!kind) {
        setUiMessage(`Filtypen for ${file.name} stods inte i denna version.`);
        continue;
      }

      const baseSource = {
        id: createId('source'),
        kind,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        file,
        warnings: [],
        needsReupload: false
      };

      if (kind === 'docx') {
        setSources((current) =>
          current.concat({
            ...baseSource,
            status: 'processing',
            extractedText: ''
          })
        );

        try {
          const result = await extractTextFromDocx(file);
          setSources((current) =>
            current.map((source) =>
              source.id === baseSource.id
                ? {
                    ...source,
                    status: 'ready',
                    extractedText: result.text,
                    warnings: result.warnings
                  }
                : source
            )
          );
        } catch (error) {
          setSources((current) =>
            current.map((source) =>
              source.id === baseSource.id
                ? {
                    ...source,
                    status: 'error',
                    extractedText: '',
                    warnings: ['Word-filen kunde inte tolkas i browsern.']
                  }
                : source
            )
          );
          setUiMessage(`Det gick inte att lasa ${file.name}.`);
        }

        continue;
      }

      setSources((current) =>
        current.concat({
          ...baseSource,
          status: 'ready'
        })
      );
    }
  };

  const handleRemoveSource = (sourceId) => {
    setSources((current) => current.filter((source) => source.id !== sourceId));
    setGenerationError('');
  };

  const handleCreateBlankDraft = () => {
    setGenerationError('');
    setUiMessage('');
    setSourceSummary(null);
    setWarnings([]);
    setTheory((current) => ({
      ...createEmptyTheory(),
      projectTitle: projectTitle || current.projectTitle || ''
    }));
    setActiveView('editor');
  };

  const handleResetDraft = () => {
    if (typeof window !== 'undefined' && !window.confirm('Ta bort lokalt utkast och borja om?')) {
      return;
    }

    setProjectTitle('');
    setPastedText('');
    setSources([]);
    setTheory(createEmptyTheory());
    setSourceSummary(null);
    setWarnings([]);
    setGenerationError('');
    setUiMessage('');
    setActiveView('intake');
    clearStoredDraft();
  };

  const handleGenerate = async () => {
    setGenerationError('');
    setUiMessage('');

    const docxTexts = sources
      .filter((source) => source.kind === 'docx' && source.status === 'ready' && source.extractedText)
      .map((source) => source.extractedText);
    const pdfSources = sources.filter((source) => source.kind === 'pdf');
    const imageSources = sources.filter((source) => source.kind === 'image');
    const pdfFiles = pdfSources.map((source) => source.file).filter(Boolean);
    const imageFiles = imageSources.map((source) => source.file).filter(Boolean);
    const hasBlockingUploads = [...pdfSources, ...imageSources].some((source) => !source.file);
    const hasProcessingDocx = sources.some((source) => source.kind === 'docx' && source.status === 'processing');

    if (hasProcessingDocx) {
      setGenerationError('Vanta tills alla Word-filer har bearbetats klart.');
      return;
    }

    if (hasBlockingUploads) {
      setGenerationError('Ladda upp PDF- eller bildfilerna igen innan du genererar pa nytt.');
      return;
    }

    if (!pastedText.trim() && docxTexts.length === 0 && pdfFiles.length === 0 && imageFiles.length === 0) {
      setGenerationError('Lagg till minst ett underlag innan du genererar.');
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateTheoryDraft({
        locale: LOCALE,
        projectTitle: projectTitle.trim(),
        pastedText,
        docxTexts,
        pdfFiles,
        imageFiles
      });

      const nextTitle = result.theory.projectTitle || projectTitle.trim();
      setTheory({
        ...result.theory,
        projectTitle: nextTitle
      });
      setProjectTitle(nextTitle);
      setSourceSummary(result.sourceSummary);
      setWarnings(result.warnings);
      setActiveView('overview');
      setUiMessage('Forandringsteori genererad! Dra i rutorna for att arrangera dem som du vill.');
    } catch (error) {
      setGenerationError(error.message || 'Genereringen misslyckades.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPayload = createDraftExport({
    projectTitle,
    theory,
    sourceSummary,
    warnings,
    sources
  });

  // Determine if we're in the "result" phase (have a draft and not on intake)
  const showResultView = hasDraft && activeView !== 'intake';

  return (
    <div className="min-h-screen text-[var(--ink-strong)]">
      <div className="page-shell">

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="print-hidden relative overflow-hidden rounded-2xl border border-[rgba(0,156,166,0.12)] bg-white px-7 py-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,156,166,0.04),transparent_50%)]" />
          <div className="relative flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              {/* RISE-style accent bar */}
              <div className="hidden sm:flex flex-col gap-1">
                <div className="w-1 h-4 rounded-full bg-[#009ca6]" />
                <div className="w-1 h-4 rounded-full bg-[#e83c63]" />
                <div className="w-1 h-4 rounded-full bg-[#ffe500]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-xl font-bold text-[var(--ink-strong)]">
                    {appConfig.appName}
                  </h1>
                  <span className="inline-flex rounded-md bg-[rgba(0,156,166,0.08)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#009ca6]">
                    Beta
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
                  AI-stott verktyg for att skapa forandringsteorier fran projektmaterial
                </p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-5 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--ink-strong)]">{sources.length + (pastedText.trim() ? 1 : 0)}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Underlag</div>
              </div>
              <div className="w-px h-8 bg-[var(--line-soft)]" />
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--ink-strong)]">{hasDraft ? 'Redo' : 'Tomt'}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Utkast</div>
              </div>
              {hasDraft && (
                <>
                  <div className="w-px h-8 bg-[var(--line-soft)]" />
                  <div className="text-center">
                    <div className="text-xs font-semibold text-[var(--ink-soft)]">{autosaveLabel}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Autosave</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Navigation tabs (only visible when draft exists) ──── */}
        {hasDraft && (
          <nav className="print-hidden mt-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1 rounded-xl bg-white border border-[var(--line-soft)] p-1 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              {[
                { id: 'overview', label: 'Oversikt' },
                { id: 'editor', label: 'Editor' },
                { id: 'intake', label: 'AI-intag' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveView(id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    activeView === id
                      ? 'bg-[#009ca6] text-white shadow-sm'
                      : 'text-[var(--ink-soft)] hover:text-[var(--ink-strong)] hover:bg-[rgba(0,156,166,0.05)]'
                  }`}
                >
                  {TAB_ICONS[id]}
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => exportDraftAsJson(exportPayload)}
                disabled={!hasDraft}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line-soft)] px-3 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[rgba(0,156,166,0.3)] hover:text-[#009ca6] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Exportera JSON
              </button>
              <button
                type="button"
                onClick={printDraft}
                disabled={!hasDraft}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line-soft)] px-3 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[rgba(0,156,166,0.3)] hover:text-[#009ca6] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Skriv ut / PDF
              </button>
              <button
                type="button"
                onClick={handleResetDraft}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(232,60,99,0.2)] px-3 py-2 text-sm font-semibold text-[#e83c63] transition hover:bg-[rgba(232,60,99,0.06)]"
              >
                Borja om
              </button>
            </div>
          </nav>
        )}

        {/* ── Main content ──────────────────────────────────────── */}
        <main className="mt-6">

          {/* INTAKE VIEW - shown alone when no draft, or when switching back */}
          {activeView === 'intake' && (
            <div className={`mx-auto ${hasDraft ? 'max-w-4xl' : 'max-w-3xl'}`}>
              {/* Hero text when no draft */}
              {!hasDraft && (
                <div className="mb-8 text-center">
                  <h2 className="font-display text-4xl font-bold text-[var(--ink-strong)] md:text-5xl">
                    Ladda upp underlag.{' '}
                    <span className="text-[#009ca6]">Fa en forandringsteori.</span>
                  </h2>
                  <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[var(--ink-soft)]">
                    Klistra in text eller ladda upp filer sa skapar verktyget ett AI-stott utkast
                    som du sedan kan redigera och visualisera.
                  </p>
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <IntakePanel
                  projectTitle={projectTitle}
                  pastedText={pastedText}
                  sources={sources}
                  generationError={generationError}
                  uiMessage={uiMessage}
                  isGenerating={isGenerating}
                  proxyStatus={proxyStatus}
                  onProjectTitleChange={syncProjectTitle}
                  onPastedTextChange={setPastedText}
                  onFilesSelected={handleFilesSelected}
                  onRemoveSource={handleRemoveSource}
                  onGenerate={handleGenerate}
                  onCreateBlankDraft={handleCreateBlankDraft}
                />

                {/* Material status sidebar */}
                <div className="space-y-4">
                  <section className="rounded-xl border border-[var(--line-soft)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                      Materialstatus
                    </h3>
                    <div className="mt-4 space-y-3">
                      {[
                        { label: 'Word', value: sourceStats.docx, color: '#009ca6' },
                        { label: 'PDF', value: sourceStats.pdf, color: '#e83c63' },
                        { label: 'Bilder', value: sourceStats.image, color: '#482d55' }
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-sm font-medium text-[var(--ink-soft)]">{label}</span>
                          </div>
                          <span className="text-lg font-bold text-[var(--ink-strong)]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {pastedText.trim() && (
                    <section className="rounded-xl border border-[var(--line-soft)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                        Inklistrad text
                      </h3>
                      <p className="mt-2 text-sm text-[var(--ink-soft)]">
                        {pastedText.trim().length.toLocaleString()} tecken
                      </p>
                    </section>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* OVERVIEW VIEW */}
          {hasDraft && activeView === 'overview' && (
            <Suspense
              fallback={
                <section className="rounded-xl border border-[var(--line-soft)] bg-white p-8">
                  <p className="text-sm text-[var(--ink-soft)]">Laddar oversiktsvyn...</p>
                </section>
              }
            >
              <OverviewCanvas theory={theory} />
            </Suspense>
          )}

          {/* EDITOR VIEW */}
          {hasDraft && activeView === 'editor' && (
            <TheoryEditor
              projectTitle={projectTitle}
              theory={theory}
              sourceSummary={sourceSummary}
              warnings={warnings}
              autosaveLabel={autosaveLabel}
              onProjectTitleChange={syncProjectTitle}
              onTheoryChange={(nextTheory) =>
                setTheory({
                  ...normalizeTheory(nextTheory),
                  projectTitle
                })
              }
            />
          )}

          {/* Empty state when no draft and not on intake */}
          {!hasDraft && activeView !== 'intake' && (
            <section className="mx-auto max-w-lg rounded-xl border border-[var(--line-soft)] bg-white p-8 text-center">
              <h2 className="font-display text-2xl font-bold text-[var(--ink-strong)]">
                Inget utkast annu
              </h2>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                Ga till AI-intag for att ladda upp material och generera en forandringsteori.
              </p>
              <button
                type="button"
                onClick={() => setActiveView('intake')}
                className="btn-primary mt-5"
              >
                Ga till AI-intag
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
