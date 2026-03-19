import { describe, expect, it } from 'vitest';

import { buildOverviewNodes } from './diagram.js';
import { hasTheoryContent, normalizeTheory } from './theory.js';

describe('normalizeTheory', () => {
  it('normalizes strings and generates stable list ids', () => {
    const theory = normalizeTheory({
      projectTitle: '  Testprojekt  ',
      problem: '  Ett tydligt problem  ',
      targetGroups: [' Grupp A ', '', 'Grupp B'],
      activities: [{ id: 'a-1', text: ' Workshop ' }],
      impact: '  Haller over tid '
    });

    expect(theory.projectTitle).toBe('Testprojekt');
    expect(theory.problem).toBe('Ett tydligt problem');
    expect(theory.targetGroups).toHaveLength(2);
    expect(theory.targetGroups[0].id).toMatch(/^entry-/);
    expect(theory.activities[0]).toEqual({ id: 'a-1', text: 'Workshop' });
    expect(theory.impact).toBe('Haller over tid');
  });

  it('reports if a theory actually contains content', () => {
    expect(hasTheoryContent(normalizeTheory({}))).toBe(false);
    expect(hasTheoryContent(normalizeTheory({ outputs: ['Leverans'] }))).toBe(true);
  });
});

describe('buildOverviewNodes', () => {
  it('maps theory content into node items', () => {
    const nodes = buildOverviewNodes(
      normalizeTheory({
        problem: 'Utmaning',
        outputs: ['Output 1', 'Output 2']
      })
    );

    const problemNode = nodes.find((node) => node.id === 'problem');
    const outputNode = nodes.find((node) => node.id === 'outputs');

    expect(problemNode.data.items).toEqual(['Utmaning']);
    expect(outputNode.data.items).toEqual(['Output 1', 'Output 2']);
  });
});
