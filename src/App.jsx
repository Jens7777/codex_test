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

export default function App() {
  const appConfig = useMemo(() => getAppConfig(), []);
  const [projectTitle, setProjectTitle] = useState('');
  const [accessCode, setAccessCode] = useState('');
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
          ? 'Tidigare PDF- och bildfiler maste laddas upp pa nytt innan du kan generera igen.'
          : 'Tidigare utkast aterstallt fran lokal autosave.'
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
        setUiMessage(`Filtypen for ${file.name} stodjs inte i denna version.`);
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
    setAccessCode('');
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

    if (!accessCode.trim()) {
      setGenerationError('Skriv in en atkomstkod som proxyn kan validera.');
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateTheoryDraft({
        accessCode: accessCode.trim(),
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
      setUiMessage('Utkastet ar uppdaterat och redo for fortsatt redigering.');
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
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--ink-strong)]">
      <div className="page-shell">
        <header className="print-hidden relative overflow-hidden rounded-[40px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(247,241,232,0.92))] px-6 py-8 shadow-[0_28px_90px_rgba(28,35,48,0.08)]">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(31,122,140,0.22),transparent_56%),radial-gradient(circle_at_bottom_right,rgba(221,110,66,0.2),transparent_48%)]" />
          <div className="relative grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-[rgba(31,122,140,0.18)] bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#1f7a8c]">
                {appConfig.appName}
              </span>
              <div className="space-y-3">
                <h1 className="font-display text-5xl leading-tight text-[var(--ink-strong)] md:text-6xl">
                  Ladda upp underlag. Fa en forandringsteori. Redigera vidare.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-[var(--ink-soft)] md:text-lg">
                  Verktyget ar nu byggt for att tolka projektmaterial, skapa ett AI-stott utkast
                  och lata dig arbeta vidare i en modern redaktionell editor med visuell oversikt.
                </p>
              </div>
            </div>

            <div className="grid gap-3 self-end sm:grid-cols-2">
              <div className="rounded-[28px] border border-white/60 bg-white/76 p-4 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  Underlag
                </div>
                <div className="mt-2 text-3xl font-semibold text-[var(--ink-strong)]">
                  {sources.length + (pastedText.trim() ? 1 : 0)}
                </div>
                <div className="mt-1 text-sm text-[var(--ink-soft)]">text, Word, PDF och bilder</div>
              </div>
              <div className="rounded-[28px] border border-white/60 bg-white/76 p-4 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  Sektioner
                </div>
                <div className="mt-2 text-3xl font-semibold text-[var(--ink-strong)]">12</div>
                <div className="mt-1 text-sm text-[var(--ink-soft)]">klassisk forandringsteori</div>
              </div>
              <div className="rounded-[28px] border border-white/60 bg-white/76 p-4 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  GitHub Pages
                </div>
                <div className="mt-2 text-3xl font-semibold text-[var(--ink-strong)]">Ja</div>
                <div className="mt-1 text-sm text-[var(--ink-soft)]">statisk frontend med separat proxy</div>
              </div>
              <div className="rounded-[28px] border border-white/60 bg-white/76 p-4 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                  Utkast
                </div>
                <div className="mt-2 text-3xl font-semibold text-[var(--ink-strong)]">
                  {hasDraft ? 'Redo' : 'Tomt'}
                </div>
                <div className="mt-1 text-sm text-[var(--ink-soft)]">{autosaveLabel}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="mt-8 grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="print-hidden space-y-6">
            <IntakePanel
              projectTitle={projectTitle}
              accessCode={accessCode}
              pastedText={pastedText}
              sources={sources}
              generationError={generationError}
              uiMessage={uiMessage}
              isGenerating={isGenerating}
              proxyStatus={proxyStatus}
              onProjectTitleChange={syncProjectTitle}
              onAccessCodeChange={setAccessCode}
              onPastedTextChange={setPastedText}
              onFilesSelected={handleFilesSelected}
              onRemoveSource={handleRemoveSource}
              onGenerate={handleGenerate}
              onCreateBlankDraft={handleCreateBlankDraft}
            />

            <section className="rounded-[30px] border border-[rgba(28,35,48,0.08)] bg-white/90 p-6 shadow-[0_18px_44px_rgba(28,35,48,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="inline-flex rounded-full bg-[rgba(221,110,66,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#b65d3b]">
                    Materialstatus
                  </span>
                  <h2 className="mt-2 font-display text-3xl text-[var(--ink-strong)]">
                    Vad som finns i underlaget
                  </h2>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[24px] bg-[var(--paper)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    Word
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-[var(--ink-strong)]">{sourceStats.docx}</div>
                </div>
                <div className="rounded-[24px] bg-[var(--paper)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    PDF
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-[var(--ink-strong)]">{sourceStats.pdf}</div>
                </div>
                <div className="rounded-[24px] bg-[var(--paper)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                    Bilder
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-[var(--ink-strong)]">{sourceStats.image}</div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="print-hidden rounded-[30px] border border-[rgba(28,35,48,0.08)] bg-white/88 p-4 shadow-[0_18px_44px_rgba(28,35,48,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveView('editor')}
                    className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeView === 'editor'
                        ? 'bg-[var(--ink-strong)] text-white'
                        : 'bg-[var(--paper)] text-[var(--ink-soft)] hover:text-[var(--ink-strong)]'
                    }`}
                  >
                    Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('overview')}
                    disabled={!hasDraft}
                    className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeView === 'overview'
                        ? 'bg-[var(--ink-strong)] text-white'
                        : 'bg-[var(--paper)] text-[var(--ink-soft)] hover:text-[var(--ink-strong)]'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Oversikt
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => exportDraftAsJson(exportPayload)}
                    disabled={!hasDraft}
                    className="inline-flex rounded-full border border-[rgba(28,35,48,0.12)] px-4 py-2 text-sm font-semibold text-[var(--ink-strong)] transition hover:border-[rgba(28,35,48,0.24)] hover:bg-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Exportera JSON
                  </button>
                  <button
                    type="button"
                    onClick={printDraft}
                    disabled={!hasDraft}
                    className="inline-flex rounded-full border border-[rgba(28,35,48,0.12)] px-4 py-2 text-sm font-semibold text-[var(--ink-strong)] transition hover:border-[rgba(28,35,48,0.24)] hover:bg-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Skriv ut / PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDraft}
                    className="inline-flex rounded-full bg-[rgba(221,110,66,0.12)] px-4 py-2 text-sm font-semibold text-[#b65d3b] transition hover:bg-[rgba(221,110,66,0.18)]"
                  >
                    Borja om
                  </button>
                </div>
              </div>
            </section>

            {!hasDraft && (
              <section className="rounded-[32px] border border-[rgba(28,35,48,0.08)] bg-white/90 p-8 shadow-[0_18px_44px_rgba(28,35,48,0.06)]">
                <span className="inline-flex rounded-full bg-[rgba(31,122,140,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#1f7a8c]">
                  Nast steg
                </span>
                <h2 className="mt-3 font-display text-4xl text-[var(--ink-strong)]">
                  Generera eller starta ett tomt utkast
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">
                  Nar du har lagt till material kan verktyget skapa en forsta struktur. Du kan
                  ocksa starta ett tomt utkast om du vill redigera manuellt direkt.
                </p>
              </section>
            )}

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

            {hasDraft && activeView === 'overview' && (
              <Suspense
                fallback={
                  <section className="rounded-[32px] border border-[rgba(28,35,48,0.08)] bg-white/92 p-8 shadow-[0_18px_44px_rgba(28,35,48,0.06)]">
                    <p className="text-sm text-[var(--ink-soft)]">Laddar oversiktsvyn...</p>
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
