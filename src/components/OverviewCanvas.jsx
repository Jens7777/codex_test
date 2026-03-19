import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

import OverviewNode from '../nodes/OverviewNode.jsx';
import { buildOverviewEdges, buildOverviewNodes } from '../utils/diagram.js';

const nodeTypes = {
  overviewNode: OverviewNode
};

export default function OverviewCanvas({ theory }) {
  const nodes = useMemo(() => buildOverviewNodes(theory), [theory]);
  const edges = useMemo(() => buildOverviewEdges(), []);

  return (
    <section className="rounded-[32px] border border-[rgba(28,35,48,0.08)] bg-white/92 p-5 shadow-[0_18px_44px_rgba(28,35,48,0.06)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full bg-[rgba(221,110,66,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#b65d3b]">
            Oversikt
          </span>
          <h2 className="mt-2 font-display text-3xl text-[var(--ink-strong)]">
            Visuell logik kedja
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-[var(--ink-soft)]">
          Oversikten genereras automatiskt fran dina redigerbara sektioner och ar ett komplement
          till den strukturerade editorn.
        </p>
      </div>

      <div className="h-[760px] overflow-hidden rounded-[28px] border border-[rgba(28,35,48,0.08)] bg-[linear-gradient(180deg,rgba(252,249,245,1),rgba(247,241,232,0.75))]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnDoubleClick={false}
          panOnScroll
          minZoom={0.35}
          maxZoom={1.2}
        >
          <MiniMap pannable zoomable className="!bg-white/90" />
          <Controls showInteractive={false} />
          <Background gap={28} size={1} color="rgba(31, 122, 140, 0.08)" />
        </ReactFlow>
      </div>
    </section>
  );
}
