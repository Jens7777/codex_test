import React, { useMemo } from 'react';
import { ALL_STEP_DEFINITIONS } from '../utils/templates.js';

const stepLookup = ALL_STEP_DEFINITIONS.reduce((acc, step) => {
  acc[step.key] = step;
  return acc;
}, {});

const languageLabels = {
  en: {
    title: 'Title',
    description: 'Description',
    indicators: 'Indicators & data sources',
    assumptions: 'Assumptions',
    addIndicator: 'Add indicator',
    addAssumption: 'Add assumption',
    remove: 'Remove',
    dataSource: 'Data source',
    english: 'English',
    swedish: 'Swedish',
    nodeInfo: 'Node details',
    edgeInfo: 'Connection assumptions',
    noSelection: 'Select a box or arrow to edit its details.'
  },
  sv: {
    title: 'Rubrik',
    description: 'Beskrivning',
    indicators: 'Indikatorer och datakällor',
    assumptions: 'Antaganden',
    addIndicator: 'Lägg till indikator',
    addAssumption: 'Lägg till antagande',
    remove: 'Ta bort',
    dataSource: 'Datakälla',
    english: 'Engelska',
    swedish: 'Svenska',
    nodeInfo: 'Detaljer',
    edgeInfo: 'Antaganden för koppling',
    noSelection: 'Markera en ruta eller pil för att redigera detaljer.'
  }
};

const StepBadge = ({ stepKey, language }) => {
  const step = stepLookup[stepKey];
  if (!step) return null;
  const label = step.defaultTitle?.[language] ?? step.defaultTitle?.en ?? stepKey;
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${
      step.color?.background ?? 'bg-slate-600'
    }`}
    >
      {label}
    </span>
  );
};

export default function Sidebar({
  language,
  selectedNode,
  selectedEdge,
  onNodeChange,
  onNodeDelete,
  onIndicatorAdd,
  onIndicatorRemove,
  onAssumptionAdd,
  onAssumptionRemove,
  onEdgeChange,
  onEdgeDelete
}) {
  const labels = languageLabels[language];
  const isNode = Boolean(selectedNode);
  const isEdge = Boolean(selectedEdge);

  const stepKey = selectedNode?.data?.stepKey;
  const stepDefinition = stepKey ? stepLookup[stepKey] : undefined;
  const isContextNode = stepDefinition?.kind === 'context';

  const indicatorEntries = useMemo(() => selectedNode?.data?.indicators ?? [], [selectedNode]);
  const assumptionEntries = useMemo(() => selectedNode?.data?.assumptions ?? [], [selectedNode]);

  if (!isNode && !isEdge) {
    return (
      <aside className="w-80 border-l border-slate-200 bg-white p-6 text-sm text-slate-600">
        <p>{labels.noSelection}</p>
      </aside>
    );
  }

  return (
    <aside className="w-80 border-l border-slate-200 bg-white h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {isNode && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{labels.nodeInfo}</h2>
              <button
                type="button"
                className="text-xs text-rose-600 hover:text-rose-700"
                onClick={() => onNodeDelete(selectedNode.id)}
              >
                {labels.remove}
              </button>
            </div>
            <StepBadge stepKey={stepKey} language={language} />
            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase text-slate-500">
                {labels.title} ({labels.english})
              </label>
              <input
                type="text"
                value={selectedNode.data.title?.en ?? ''}
                onChange={(event) =>
                  onNodeChange(selectedNode.id, {
                    title: { ...selectedNode.data.title, en: event.target.value }
                  })
                }
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
              <label className="block text-xs font-medium uppercase text-slate-500">
                {labels.title} ({labels.swedish})
              </label>
              <input
                type="text"
                value={selectedNode.data.title?.sv ?? ''}
                onChange={(event) =>
                  onNodeChange(selectedNode.id, {
                    title: { ...selectedNode.data.title, sv: event.target.value }
                  })
                }
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase text-slate-500">
                {labels.description} ({labels.english})
              </label>
              <textarea
                rows={3}
                value={selectedNode.data.description?.en ?? ''}
                onChange={(event) =>
                  onNodeChange(selectedNode.id, {
                    description: { ...selectedNode.data.description, en: event.target.value }
                  })
                }
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
              <label className="block text-xs font-medium uppercase text-slate-500">
                {labels.description} ({labels.swedish})
              </label>
              <textarea
                rows={3}
                value={selectedNode.data.description?.sv ?? ''}
                onChange={(event) =>
                  onNodeChange(selectedNode.id, {
                    description: { ...selectedNode.data.description, sv: event.target.value }
                  })
                }
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            {!isContextNode && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">{labels.indicators}</h3>
                    <button
                      type="button"
                      onClick={() => onIndicatorAdd(selectedNode.id)}
                      className="text-xs text-sky-600 hover:text-sky-700"
                    >
                      {labels.addIndicator}
                    </button>
                  </div>
                  <div className="space-y-4">
                    {indicatorEntries.length === 0 && (
                      <p className="text-xs text-slate-500">
                        {language === 'sv'
                          ? 'Inga indikatorer tillagda ännu.'
                          : 'No indicators added yet.'}
                      </p>
                    )}
                    {indicatorEntries.map((indicator, index) => (
                      <div key={indicator.id ?? index} className="rounded-lg border border-slate-200 p-3 space-y-2">
                        <div className="flex justify-between text-xs font-medium uppercase text-slate-400">
                          <span>{language === 'sv' ? 'Indikator' : 'Indicator'} #{index + 1}</span>
                          <button
                            type="button"
                            className="text-rose-500 hover:text-rose-600"
                            onClick={() => onIndicatorRemove(selectedNode.id, indicator.id ?? index)}
                          >
                            {labels.remove}
                          </button>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] font-medium uppercase text-slate-400">
                            {labels.title} ({labels.english})
                          </label>
                          <input
                            type="text"
                            value={indicator.label?.en ?? ''}
                            onChange={(event) =>
                              onNodeChange(selectedNode.id, {
                                indicators: indicatorEntries.map((item, idx) =>
                                  idx === index
                                    ? { ...item, label: { ...item.label, en: event.target.value } }
                                    : item
                                )
                              })
                            }
                            className="w-full rounded border border-slate-200 px-3 py-1.5 text-sm"
                          />
                          <label className="block text-[11px] font-medium uppercase text-slate-400">
                            {labels.title} ({labels.swedish})
                          </label>
                          <input
                            type="text"
                            value={indicator.label?.sv ?? ''}
                            onChange={(event) =>
                              onNodeChange(selectedNode.id, {
                                indicators: indicatorEntries.map((item, idx) =>
                                  idx === index
                                    ? { ...item, label: { ...item.label, sv: event.target.value } }
                                    : item
                                )
                              })
                            }
                            className="w-full rounded border border-slate-200 px-3 py-1.5 text-sm"
                          />
                          <label className="block text-[11px] font-medium uppercase text-slate-400">
                            {labels.dataSource}
                          </label>
                          <input
                            type="text"
                            value={indicator.dataSource ?? ''}
                            onChange={(event) =>
                              onNodeChange(selectedNode.id, {
                                indicators: indicatorEntries.map((item, idx) =>
                                  idx === index
                                    ? { ...item, dataSource: event.target.value }
                                    : item
                                )
                              })
                            }
                            className="w-full rounded border border-slate-200 px-3 py-1.5 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">{labels.assumptions}</h3>
                    <button
                      type="button"
                      onClick={() => onAssumptionAdd(selectedNode.id)}
                      className="text-xs text-sky-600 hover:text-sky-700"
                    >
                      {labels.addAssumption}
                    </button>
                  </div>
                  <div className="space-y-4">
                    {assumptionEntries.length === 0 && (
                      <p className="text-xs text-slate-500">
                        {language === 'sv'
                          ? 'Inga antaganden tillagda ännu.'
                          : 'No assumptions added yet.'}
                      </p>
                    )}
                    {assumptionEntries.map((assumption, index) => (
                      <div key={assumption.id ?? index} className="rounded-lg border border-slate-200 p-3 space-y-2">
                        <div className="flex justify-between text-xs font-medium uppercase text-slate-400">
                          <span>{language === 'sv' ? 'Antagande' : 'Assumption'} #{index + 1}</span>
                          <button
                            type="button"
                            className="text-rose-500 hover:text-rose-600"
                            onClick={() => onAssumptionRemove(selectedNode.id, assumption.id ?? index)}
                          >
                            {labels.remove}
                          </button>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[11px] font-medium uppercase text-slate-400">
                            {labels.description} ({labels.english})
                          </label>
                          <textarea
                            rows={2}
                            value={assumption.text?.en ?? ''}
                            onChange={(event) =>
                              onNodeChange(selectedNode.id, {
                                assumptions: assumptionEntries.map((item, idx) =>
                                  idx === index
                                    ? { ...item, text: { ...item.text, en: event.target.value } }
                                    : item
                                )
                              })
                            }
                            className="w-full rounded border border-slate-200 px-3 py-1.5 text-sm"
                          />
                          <label className="block text-[11px] font-medium uppercase text-slate-400">
                            {labels.description} ({labels.swedish})
                          </label>
                          <textarea
                            rows={2}
                            value={assumption.text?.sv ?? ''}
                            onChange={(event) =>
                              onNodeChange(selectedNode.id, {
                                assumptions: assumptionEntries.map((item, idx) =>
                                  idx === index
                                    ? { ...item, text: { ...item.text, sv: event.target.value } }
                                    : item
                                )
                              })
                            }
                            className="w-full rounded border border-slate-200 px-3 py-1.5 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {isEdge && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{labels.edgeInfo}</h2>
              <button
                type="button"
                className="text-xs text-rose-600 hover:text-rose-700"
                onClick={() => onEdgeDelete(selectedEdge.id)}
              >
                {labels.remove}
              </button>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase text-slate-500">
                {labels.assumptions} ({labels.english})
              </label>
              <textarea
                rows={3}
                value={selectedEdge.data?.assumptions?.en ?? ''}
                onChange={(event) =>
                  onEdgeChange(selectedEdge.id, {
                    assumptions: { ...selectedEdge.data?.assumptions, en: event.target.value }
                  })
                }
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
              <label className="block text-xs font-medium uppercase text-slate-500">
                {labels.assumptions} ({labels.swedish})
              </label>
              <textarea
                rows={3}
                value={selectedEdge.data?.assumptions?.sv ?? ''}
                onChange={(event) =>
                  onEdgeChange(selectedEdge.id, {
                    assumptions: { ...selectedEdge.data?.assumptions, sv: event.target.value }
                  })
                }
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
