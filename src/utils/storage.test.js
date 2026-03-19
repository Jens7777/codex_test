import { beforeEach, describe, expect, it } from 'vitest';

import { clearStoredDraft, loadStoredDraft, saveStoredDraft } from './storage.js';
import { normalizeTheory } from './theory.js';

describe('draft storage', () => {
  beforeEach(() => {
    clearStoredDraft();
  });

  it('persists theory data and marks binary files for reupload on restore', () => {
    saveStoredDraft({
      projectTitle: 'Pilot',
      pastedText: 'Bakgrund',
      activeView: 'editor',
      theory: normalizeTheory({
        problem: 'Utmaning',
        activities: ['Aktivitet']
      }),
      sourceSummary: { summary: 'Kort sammanfattning', sourceHighlights: [] },
      warnings: ['Notering'],
      sources: [
        {
          id: 'docx-1',
          kind: 'docx',
          name: 'underlag.docx',
          size: 100,
          status: 'ready',
          extractedText: 'Word-text',
          warnings: []
        },
        {
          id: 'pdf-1',
          kind: 'pdf',
          name: 'rapport.pdf',
          size: 2048,
          status: 'ready'
        }
      ]
    });

    const restored = loadStoredDraft();

    expect(restored.projectTitle).toBe('Pilot');
    expect(restored.theory.problem).toBe('Utmaning');
    expect(restored.sources[0].status).toBe('ready');
    expect(restored.sources[1].status).toBe('needs-reupload');
    expect(restored.sources[1].needsReupload).toBe(true);
  });
});
