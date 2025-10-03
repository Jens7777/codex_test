import React, { useCallback, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState
} from 'reactflow';
import 'reactflow/dist/style.css';

import LogicNode from './nodes/LogicNode.jsx';
import Sidebar from './components/Sidebar.jsx';
import {
  BASIC_TEMPLATE,
  PIPELINE_STEPS,
  TEMPLATE_LOOKUP,
  TEMPLATES
} from './utils/templates.js';
import {
  exportDiagramAsPDF,
  exportDiagramAsPNG,
  exportModelAsJSON
} from './utils/exporters.js';

const nodeTypes = {
  logicNode: LogicNode
};

const randomId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

const prepareIndicators = (indicators = [], nodeId) =>
  indicators.map((indicator, index) => ({
    id: indicator.id ?? `${nodeId}-indicator-${index + 1}`,
    label: {
      en: indicator.label?.en ?? '',
      sv: indicator.label?.sv ?? ''
    },
    dataSource: indicator.dataSource ?? ''
  }));

const prepareAssumptions = (assumptions = [], nodeId) =>
  assumptions.map((assumption, index) => ({
    id: assumption.id ?? `${nodeId}-assumption-${index + 1}`,
    text: {
      en: assumption.text?.en ?? '',
      sv: assumption.text?.sv ?? ''
    }
  }));

const prepareNodes = (nodes, language) =>
  nodes.map((node) => ({
    ...node,
    data: {
      language,
      stepKey: node.data?.stepKey ?? node.id,
      title: {
        en: node.data?.title?.en ?? '',
        sv: node.data?.title?.sv ?? ''
      },
      description: {
        en: node.data?.description?.en ?? '',
        sv: node.data?.description?.sv ?? ''
      },
      indicators: prepareIndicators(node.data?.indicators ?? [], node.id),
      assumptions: prepareAssumptions(node.data?.assumptions ?? [], node.id)
    }
  }));

const prepareEdges = (edges) =>
  edges.map((edge) => ({
    ...edge,
    data: {
      assumptions: {
        en: edge.data?.assumptions?.en ?? '',
        sv: edge.data?.assumptions?.sv ?? ''
      }
    }
  }));

export default function App() {
  const [language, setLanguage] = useState('en');
  const [templateId, setTemplateId] = useState(BASIC_TEMPLATE.id);
  const [nodes, setNodes, onNodesChange] = useNodesState(
    prepareNodes(BASIC_TEMPLATE.nodes, 'en')
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(prepareEdges(BASIC_TEMPLATE.edges));
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const reactFlowWrapper = useRef(null);
  const reactFlowInstanceRef = useRef(null);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const selectedEdge = useMemo(
    () => edges.find((edge) => edge.id === selectedEdgeId) ?? null,
    [edges, selectedEdgeId]
  );

  const updateLanguageOnNodes = useCallback(
    (lang) => {
      setNodes((current) =>
        current.map((node) => ({
          ...node,
          data: {
            ...node.data,
            language: lang
          }
        }))
      );
    },
    [setNodes]
  );

  const loadTemplate = useCallback(
    (id) => {
      const template = TEMPLATE_LOOKUP[id] ?? BASIC_TEMPLATE;
      setTemplateId(template.id);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setNodes(prepareNodes(template.nodes, language));
      setEdges(prepareEdges(template.edges));
      requestAnimationFrame(() => {
        if (reactFlowInstanceRef.current) {
          reactFlowInstanceRef.current.fitView({ padding: 0.2, duration: 300 });
        }
      });
    },
    [language, setEdges, setNodes]
  );

  const handleLanguageToggle = useCallback(() => {
    setLanguage((prev) => {
      const next = prev === 'en' ? 'sv' : 'en';
      updateLanguageOnNodes(next);
      return next;
    });
  }, [updateLanguageOnNodes]);

  const handleAddNode = useCallback(
    (stepKey) => {
      const step = PIPELINE_STEPS.find((item) => item.key === stepKey);
      if (!step) return;
      const baseTitle = step.defaultTitle ?? { en: stepKey, sv: stepKey };
      const newNodeId = `${stepKey}-${randomId().slice(0, 6)}`;
      const laneIndex = PIPELINE_STEPS.findIndex((item) => item.key === stepKey);
      const siblingsInLane = nodes.filter((node) => node.data?.stepKey === stepKey).length;
      const offsetX = laneIndex >= 0 ? laneIndex * 280 : nodes.length * 220;
      const offsetY = laneIndex >= 0 ? 40 + siblingsInLane * 160 : 40 + nodes.length * 120;
      const newNode = {
        id: newNodeId,
        type: 'logicNode',
        position: { x: offsetX, y: offsetY },
        data: {
          language,
          stepKey,
          title: {
            en: baseTitle.en ?? '',
            sv: baseTitle.sv ?? ''
          },
          description: { en: '', sv: '' },
          indicators: [],
          assumptions: []
        }
      };
      setNodes((current) => current.concat(newNode));
      setSelectedNodeId(newNodeId);
      requestAnimationFrame(() => {
        if (reactFlowInstanceRef.current) {
          reactFlowInstanceRef.current.fitView({ padding: 0.15, duration: 200 });
        }
      });
    },
    [language, nodes, setNodes]
  );

  const onConnect = useCallback(
    (connection) => {
      if (!connection?.source || !connection?.target) {
        return;
      }
      const isContextNodeId = (nodeId) => {
        const node = nodes.find((item) => item.id === nodeId);
        const stepKey = node?.data?.stepKey;
        return stepKey === 'problem' || stepKey === 'target';
      };
      if (isContextNodeId(connection.source) || isContextNodeId(connection.target)) {
        return;
      }
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            data: {
              assumptions: { en: '', sv: '' }
            }
          },
          current
        )
      );
    },
    [nodes, setEdges]
  );

  const onSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }) => {
    const node = selectedNodes?.[0];
    const edge = selectedEdges?.[0];
    setSelectedNodeId(node?.id ?? null);
    setSelectedEdgeId(edge?.id ?? null);
  }, []);

  const handleNodeChange = useCallback(
    (nodeId, changes) => {
      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...changes
                }
              }
            : node
        )
      );
    },
    [setNodes]
  );

  const handleNodeDelete = useCallback(
    (nodeId) => {
      setNodes((current) => current.filter((node) => node.id !== nodeId));
      setEdges((current) => current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      setSelectedNodeId(null);
    },
    [setEdges, setNodes]
  );

  const handleIndicatorAdd = useCallback(
    (nodeId) => {
      const indicatorId = `${nodeId}-indicator-${randomId().slice(0, 6)}`;
      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  indicators: node.data.indicators.concat({
                    id: indicatorId,
                    label: { en: '', sv: '' },
                    dataSource: ''
                  })
                }
              }
            : node
        )
      );
    },
    [setNodes]
  );

  const handleIndicatorRemove = useCallback(
    (nodeId, indicatorIdentifier) => {
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId) return node;
          const hasMatchingId = node.data.indicators.some(
            (indicator) => indicator.id === indicatorIdentifier
          );
          return {
            ...node,
            data: {
              ...node.data,
              indicators: node.data.indicators.filter((indicator, index) =>
                hasMatchingId ? indicator.id !== indicatorIdentifier : index !== indicatorIdentifier
              )
            }
          };
        })
      );
    },
    [setNodes]
  );

  const handleAssumptionAdd = useCallback(
    (nodeId) => {
      const assumptionId = `${nodeId}-assumption-${randomId().slice(0, 6)}`;
      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  assumptions: node.data.assumptions.concat({
                    id: assumptionId,
                    text: { en: '', sv: '' }
                  })
                }
              }
            : node
        )
      );
    },
    [setNodes]
  );

  const handleAssumptionRemove = useCallback(
    (nodeId, assumptionIdentifier) => {
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId) return node;
          const hasMatchingId = node.data.assumptions.some(
            (assumption) => assumption.id === assumptionIdentifier
          );
          return {
            ...node,
            data: {
              ...node.data,
              assumptions: node.data.assumptions.filter((assumption, index) =>
                hasMatchingId ? assumption.id !== assumptionIdentifier : index !== assumptionIdentifier
              )
            }
          };
        })
      );
    },
    [setNodes]
  );

  const handleEdgeChange = useCallback(
    (edgeId, changes) => {
      setEdges((current) =>
        current.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                data: {
                  ...edge.data,
                  ...changes
                }
              }
            : edge
        )
      );
    },
    [setEdges]
  );

  const handleEdgeDelete = useCallback(
    (edgeId) => {
      setEdges((current) => current.filter((edge) => edge.id !== edgeId));
      setSelectedEdgeId(null);
    },
    [setEdges]
  );

  const handleNodesDelete = useCallback(
    (deletedNodes) => {
      const ids = new Set(deletedNodes.map((node) => node.id));
      setEdges((current) => current.filter((edge) => !ids.has(edge.source) && !ids.has(edge.target)));
      if (ids.has(selectedNodeId)) {
        setSelectedNodeId(null);
      }
    },
    [selectedNodeId, setEdges]
  );

  const handleEdgesDelete = useCallback(
    (deletedEdges) => {
      if (deletedEdges.some((edge) => edge.id === selectedEdgeId)) {
        setSelectedEdgeId(null);
      }
    },
    [selectedEdgeId]
  );

  const handleExportJSON = useCallback(() => {
    exportModelAsJSON({ nodes, edges });
  }, [edges, nodes]);

  const handleExportPNG = useCallback(() => {
    exportDiagramAsPNG(reactFlowWrapper.current);
  }, []);

  const handleExportPDF = useCallback(() => {
    exportDiagramAsPDF(reactFlowWrapper.current);
  }, []);

  const currentTemplate = useMemo(
    () => TEMPLATES.find((template) => template.id === templateId) ?? BASIC_TEMPLATE,
    [templateId]
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      <div className="flex h-full flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-slate-900">
              {language === 'sv' ? 'Logikmodellbyggare' : 'Logic Model Builder'}
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl">
              {language === 'sv'
                ? 'Skapa en effektlogik genom att lägga till rutor, dra pilar och beskriva indikatorer, datakällor och antaganden.'
                : 'Build a theory of change by arranging boxes, connecting arrows, and capturing indicators, data sources, and assumptions.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLanguageToggle}
              className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900"
            >
              {language === 'sv' ? 'Visa på engelska' : 'Visa på svenska'}
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
              >
                JSON
              </button>
              <button
                type="button"
                onClick={handleExportPNG}
                className="rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                PNG
              </button>
              <button
                type="button"
                onClick={handleExportPDF}
                className="rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                PDF
              </button>
            </div>
          </div>
        </header>
        <div className="flex items-start gap-4 border-b border-slate-200 bg-white/80 px-6 py-3">
          <div className="flex items-center gap-2">
            <label htmlFor="template-select" className="text-sm font-medium text-slate-600">
              {language === 'sv' ? 'Mall' : 'Template'}
            </label>
            <select
              id="template-select"
              value={templateId}
              onChange={(event) => loadTemplate(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700"
            >
              {TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label?.[language] ?? template.label?.en ?? template.id}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500 max-w-sm">
              {currentTemplate.description?.[language] ?? currentTemplate.description?.en ?? ''}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PIPELINE_STEPS.map((step) => (
              <button
                key={step.key}
                type="button"
                onClick={() => handleAddNode(step.key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:translate-y-[1px] ${
                  step.color?.background ?? 'bg-slate-600'
                }`}
              >
                {step.defaultTitle?.[language] ?? step.defaultTitle?.en ?? step.key}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div ref={reactFlowWrapper} className="flex-1">
            <ReactFlow
              nodes={nodes.map((node) => ({ ...node, data: { ...node.data, language } }))}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              onInit={(instance) => {
                reactFlowInstanceRef.current = instance;
                instance.fitView({ padding: 0.2 });
              }}
              onNodesDelete={handleNodesDelete}
              onEdgesDelete={handleEdgesDelete}
              fitView
              minZoom={0.2}
              maxZoom={1.5}
            >
              <MiniMap className="!bg-white" />
              <Controls showInteractive={false} />
              <Background gap={24} size={1} color="rgba(15, 23, 42, 0.1)" />
            </ReactFlow>
          </div>
          <Sidebar
            language={language}
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            onNodeChange={handleNodeChange}
            onNodeDelete={handleNodeDelete}
            onIndicatorAdd={handleIndicatorAdd}
            onIndicatorRemove={handleIndicatorRemove}
            onAssumptionAdd={handleAssumptionAdd}
            onAssumptionRemove={handleAssumptionRemove}
            onEdgeChange={handleEdgeChange}
            onEdgeDelete={handleEdgeDelete}
          />
        </div>
      </div>
    </div>
  );
}
