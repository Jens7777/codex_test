import { beforeEach, describe, expect, it, vi } from 'vitest';

const { extractRawText } = vi.hoisted(() => ({
  extractRawText: vi.fn()
}));

vi.mock('mammoth/mammoth.browser', () => ({
  default: {
    extractRawText
  }
}));

import { extractTextFromDocx } from './docx.js';

describe('extractTextFromDocx', () => {
  beforeEach(() => {
    extractRawText.mockReset();
  });

  it('returns collapsed text and forwards mammoth warnings', async () => {
    extractRawText.mockResolvedValue({
      value: ' Rad ett \n\n Rad tva ',
      messages: [{ message: 'Kommentar fran parsern' }]
    });

    const file = {
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
    };

    const result = await extractTextFromDocx(file);

    expect(result).toEqual({
      text: 'Rad ett\nRad tva',
      warnings: ['Kommentar fran parsern']
    });
    expect(file.arrayBuffer).toHaveBeenCalledTimes(1);
    expect(extractRawText).toHaveBeenCalledTimes(1);
  });
});
