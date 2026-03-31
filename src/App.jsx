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
    return 'Väntar på ändringar';
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
  const [activeView, setActiveView] = useState('editor');
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
      setActiveView(storedDraft.activeView ?? 'editor');
      setLastSavedAt(storedDraft.savedAt ?? null);
      setUiMessage(
        (storedDraft.sources ?? []).some((source) => source.needsReupload)
          ? 'Tidigare PDF- och bildfiler måste laddas upp på nytt innan du kan generera igen.'
          : 'Tidigare utkast återställt från lokal autosave.'
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
        setUiMessage(`Filtypen för ${file.name} stöds inte i denna version.`);
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
          setUiMessage(`Det gick inte att läsa ${file.name}.`);
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
    if (typeof window !== 'undefined' && !window.confirm('Ta bort lokalt utkast och börja om?')) {
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
    setActiveView('editor');
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
      setGenerationError('Vänta tills alla Word-filer har bearbetats klart.');
      return;
    }

    if (hasBlockingUploads) {
      setGenerationError('Ladda upp PDF- eller bildfilerna igen innan du genererar på nytt.');
      return;
    }

    if (!pastedText.trim() && docxTexts.length === 0 && pdfFiles.length === 0 && imageFiles.length === 0) {
      setGenerationError('Lägg till minst ett underlag innan du genererar.');
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
      setActiveView('editor');
      setUiMessage('Utkastet är uppdaterat och redo för fortsatt redigering.');
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

  return (
    <div className="min-h-screen text-[var(--ink-strong)]">
      <div className="page-shell">

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="print-hidden relative overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(248,242,233,0.94))] px-7 py-9 shadow-[0_24px_80px_rgba(28,35,48,0.1)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(31,122,140,0.18),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(221,110,66,0.16),transparent_44%)]" />
          <div className="relative grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
            {/* Title + subtitle */}
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-[rgba(31,122,140,0.2)] bg-white/75 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.24em] text-[#1f7a8c]">
                {appConfig.appName}
              </span>
              <div className="space-y-3">
                <h1 className="font-display text-[2.8rem] leading-[1.1] text-[var(--ink-strong)] md:text-6xl">
                  Ladda upp underlag.{' '}
                  <span className="text-[#1f7a8c]">Få en förändringsteori.</span>{' '}
                  Redigera vidare.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[var(--ink-soft)]">
                  Verktyget är byggt för att tolka projektmaterial, skapa ett AI-stöttat utkast
                  och låta dig arbeta vidare i en redaktionell editor med visuell översikt.
                </p>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3 self-center">
              {[
                {
                  label: 'Underlag',
                  value: sources.length + (pastedText.trim() ? 1 : 0),
                  sub: 'text, Word, PDF och bilder'
                },
                {
                  label: 'Sektioner',
                  value: 12,
                  sub: 'klassisk förändringsteori'
                },
                {
                  label: 'Utkast',
                  value: hasDraft ? 'Redo' : 'Tomt',
                  sub: autosaveLabel
                },
                {
                  label: 'Hosting',
                  value: 'GitHub',
                  sub: 'statisk frontend + proxy'
                }
              ].map(({ label, value, sub }) => (
                <div
                  key={label}
                  className="rounded-[22px] border border-white/60 bg-white/72 p-4 backdrop-blur"
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                    {label}
                  </div>
                  <div className="mt-1.5 text-2xl font-bold text-[var(--ink-strong)]">{value}</div>
                  <div className="mt-0.5 text-xs text-[var(--ink-soft)]">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* ── Main grid ──────────────────────────────────────────── */}
        <main className="mt-7 grid gap-7 xl:grid-cols-[0.9fr_1.1fr]">

          {/* Left column: intake + material status */}
          <div className="print-hidden space-y-6">
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

            {/* Material status card */}
            <section className="rounded-[24px] border border-[rgba(28,35,48,0.08)] bg-white/88 p-5 shadow-[0_14px_36px_rgba(28,35,48,0.06)]">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <span className="inline-flex rounded-full bg-[rgba(221,110,66,0.11)] px-3 py-0.5 text-xs font-bold uppercase tracking-[0.2em] text-[#b65d3b]">
                    Materialstatus
                  </span>
                  <h2 className="mt-1.5 font-display text-2xl text-[var(--ink-strong)]">
                    Vad som finns i underlaget
                  </h2>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Word', value: sourceStats.docx },
                  { label: 'PDF', value: sourceStats.pdf },
                  { label: 'Bilder', value: sourceStats.image }
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-[18px] bg-[var(--paper)] p-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                      {label}
                    </div>
                    <div className="mt-1.5 text-2xl font-bold text-[var(--ink-strong)]">{value}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right column: view switcher + editor/overview */}
          <div className="space-y-6">
            {/* View + export toolbar */}
            <section className="print-hidden rounded-[24px] border border-[rgba(28,35,48,0.08)] bg-white/88 p-4 shadow-[0_14px_36px_rgba(28,35,48,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2">
                  {[
                    { id: 'editor', label: 'Editor' },
                    { id: 'overview', label: 'Översikt', disabled: !hasDraft }
                  ].map(({ id, label, disabled }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveView(id)}
                      disabled={disabled}
                      className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold transition ${
                        activeView === id
                          ? 'bg-[var(--ink-strong)] text-white shadow-sm'
                          : 'bg-[var(--paper)] text-[var(--ink-soft)] hover:text-[var(--ink-strong)]'
                      } disabled:cursor-not-allowed disabled:opacity-45`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => exportDraftAsJson(exportPayload)}
                    disabled={!hasDraft}
                    className="inline-flex rounded-full border border-[rgba(28,35,48,0.12)] px-4 py-2 text-sm font-semibold text-[var(--ink-strong)] transition hover:border-[rgba(28,35,48,0.24)] hover:bg-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Exportera JSON
                  </button>
                  <button
                    type="button"
                    onClick={printDraft}
                    disabled={!hasDraft}
                    className="inline-flex rounded-full border border-[rgba(28,35,48,0.12)] px-4 py-2 text-sm font-semibold text-[var(--ink-strong)] transition hover:border-[rgba(28,35,48,0.24)] hover:bg-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Skriv ut / PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDraft}
                    className="inline-flex rounded-full bg-[rgba(221,110,66,0.1)] px-4 py-2 text-sm font-semibold text-[#b65d3b] transition hover:bg-[rgba(221,110,66,0.18)]"
                  >
                    Börja om
                  </button>
                </div>
              </div>
            </section>

            {/* Empty state */}
            {!hasDraft && (
              <section className="rounded-[28px] border border-[rgba(28,35,48,0.08)] bg-white/90 p-8 shadow-[0_14px_36px_rgba(28,35,48,0.06)]">
                <span className="inline-flex rounded-full bg-[rgba(31,122,140,0.1)] px-3 py-0.5 text-xs font-bold uppercase tracking-[0.22em] text-[#1f7a8c]">
                  Nästa steg
                </span>
                <h2 className="mt-3 font-display text-4xl text-[var(--ink-strong)] leading-snug">
                  Generera eller starta ett tomt utkast
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">
                  När du har lagt till material kan verktyget skapa en första struktur. Du kan
                  också starta ett tomt utkast om du vill redigera manuellt direkt.
                </p>
              </section>
            )}

            {/* Theory editor */}
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

            {/* Overview canvas */}
            {hasDraft && activeView === 'overview' && (
              <Suspense
                fallback={
                  <section className="rounded-[28px] border border-[rgba(28,35,48,0.08)] bg-white/90 p-8 shadow-[0_14px_36px_rgba(28,35,48,0.06)]">
                    <p className="text-sm text-[var(--ink-soft)]">Laddar översiktsvyn…</p>
                  </section>
                }
              >
                <OverviewCanvas theory={theory} />
              </Suspense>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
