import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';

import OverviewNode from '../nodes/OverviewNode.jsx';
import { buildOverviewEdges, buildOverviewNodes } from '../utils/diagram.js';

const nodeTypes = {
  overviewNode: OverviewNode
};

export default function OverviewCanvas({ theory }) {
  const initialNodes = useMemo(() => buildOverviewNodes(theory), [theory]);
  const initialEdges = useMemo(() => buildOverviewEdges(), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when theory changes
  React.useEffect(() => {
    setNodes(buildOverviewNodes(theory));
  }, [theory, setNodes]);

  return (
    <section className="rounded-xl border border-[var(--line-soft)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="px-5 py-4 border-b border-[var(--line-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-[#009ca6]" />
              <h2 className="font-display text-xl font-bold text-[var(--ink-strong)]">
                Visuell logikkedja
              </h2>
            </div>
          </div>
          <p className="text-sm text-[var(--ink-muted)]">
            Dra i rutorna for att arrangera dem. Oversikten genereras fran dina sektioner.
          </p>
        </div>
      </div>

      <div className="h-[calc(100vh-220px)] min-h-[600px] overflow-hidden bg-[#fafbfc]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          zoomOnDoubleClick={false}
          panOnScroll
          minZoom={0.25}
          maxZoom={1.5}
          fitViewOptions={{ padding: 0.15 }}
        >
          <MiniMap
            pannable
            zoomable
            className="!bg-white !border !border-[var(--line-soft)] !rounded-lg !shadow-sm"
            nodeColor={(node) => node.data?.accent ?? '#c8c8c8'}
          />
          <Controls showInteractive={false} className="!rounded-lg !border !border-[var(--line-soft)] !shadow-sm" />
          <Background gap={24} size={1} color="rgba(0, 156, 166, 0.06)" />
        </ReactFlow>
      </div>
    </section>
  );
}
