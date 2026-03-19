import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import worker, { checkRateLimit, normalizeModelPayload } from './worker.mjs';

describe('normalizeModelPayload', () => {
  it('normalizes list values and source summary', () => {
    const result = normalizeModelPayload({
      projectTitle: ' Pilot ',
      problem: ' Otydlig riktning ',
      activities: [' Workshop ', '', 'Coachning'],
      sourceSummary: {
        summary: ' Kort sammanfattning ',
        sourceHighlights: [' Tema 1 ']
      },
      warnings: [' Saknar nulage ']
    });

    expect(result.theory.projectTitle).toBe('Pilot');
    expect(result.theory.activities).toEqual([
      { id: 'activity-1', text: 'Workshop' },
      { id: 'activity-3', text: 'Coachning' }
    ]);
    expect(result.sourceSummary.summary).toBe('Kort sammanfattning');
    expect(result.warnings).toEqual(['Saknar nulage']);
  });
});

describe('checkRateLimit', () => {
  it('blocks requests once the configured threshold is exceeded', () => {
    const request = new Request('https://proxy.example/api/generate-theory', {
      headers: {
        'cf-connecting-ip': '127.0.0.1'
      }
    });

    const env = {
      RATE_LIMIT_MAX_REQUESTS: '2',
      RATE_LIMIT_WINDOW_MS: '60000'
    };

    expect(checkRateLimit(request, env, 'secret')).toBe(true);
    expect(checkRateLimit(request, env, 'secret')).toBe(true);
    expect(checkRateLimit(request, env, 'secret')).toBe(false);
  });
});

describe('proxy worker', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns 401 for invalid access code before calling Gemini', async () => {
    const formData = new FormData();
    formData.append('accessCode', 'wrong');
    formData.append('pastedText', 'Underlag');

    const response = await worker.fetch(
      new Request('https://proxy.example/api/generate-theory', {
        method: 'POST',
        body: formData
      }),
      {
        ACCESS_CODE: 'secret'
      }
    );

    expect(response.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns normalized theory data on success', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    projectTitle: 'Pilot',
                    problem: 'Utmaning',
                    targetGroups: ['Unga deltagare'],
                    inputs: ['Projektledare'],
                    activities: ['Grupptraffar'],
                    outputs: ['10 genomforda tillfallen'],
                    shortTermOutcomes: ['Okad kunskap'],
                    longTermOutcomes: ['Starkare egenmakt'],
                    impact: 'Hallbara livschanser',
                    assumptions: ['Deltagare kommer tillbaka'],
                    indicators: ['Narvaro'],
                    evidenceGaps: ['Begransad baseline'],
                    confidenceNotes: ['Baserat pa tidigt material'],
                    sourceSummary: {
                      summary: 'Material om en lokal ungdomssatsning',
                      sourceHighlights: ['Ungdomar', 'Stress']
                    },
                    warnings: ['Saknar registerdata']
                  })
                }
              ]
            }
          }
        ]
      })
    });

    const formData = new FormData();
    formData.append('accessCode', 'secret');
    formData.append('locale', 'sv');
    formData.append('projectTitle', 'Pilot');
    formData.append('pastedText', 'Bakgrundstext');

    const response = await worker.fetch(
      new Request('https://proxy.example/api/generate-theory', {
        method: 'POST',
        body: formData
      }),
      {
        ACCESS_CODE: 'secret',
        GEMINI_API_KEY: 'api-key',
        GEMINI_MODEL: 'gemini-2.5-flash',
        ALLOWED_ORIGIN: '*'
      }
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.theory.problem).toBe('Utmaning');
    expect(body.theory.activities).toEqual([{ id: 'activity-1', text: 'Grupptraffar' }]);
    expect(body.sourceSummary.summary).toBe('Material om en lokal ungdomssatsning');
    expect(body.warnings).toEqual(['Saknar registerdata']);
  });
});
