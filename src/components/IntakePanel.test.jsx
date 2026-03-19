import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import IntakePanel from './IntakePanel.jsx';

const createProps = () => ({
  projectTitle: 'Pilot',
  accessCode: '',
  pastedText: '',
  sources: [
    {
      id: 'source-1',
      kind: 'pdf',
      name: 'rapport.pdf',
      size: 2048,
      status: 'ready',
      warnings: [],
      needsReupload: false
    }
  ],
  generationError: '',
  uiMessage: '',
  isGenerating: false,
  proxyStatus: 'Konfigurerad',
  onProjectTitleChange: vi.fn(),
  onAccessCodeChange: vi.fn(),
  onPastedTextChange: vi.fn(),
  onFilesSelected: vi.fn(),
  onRemoveSource: vi.fn(),
  onGenerate: vi.fn(),
  onCreateBlankDraft: vi.fn()
});

describe('IntakePanel', () => {
  it('forwards file uploads to the parent callback', () => {
    const props = createProps();
    render(<IntakePanel {...props} />);

    const input = screen.getByLabelText('Lagg till filer', { selector: 'input' });
    const file = new File(['hello'], 'underlag.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    fireEvent.change(input, { target: { files: [file] } });

    expect(props.onFilesSelected).toHaveBeenCalledTimes(1);
    expect(props.onFilesSelected.mock.calls[0][0][0].name).toBe('underlag.docx');
  });

  it('lets the user remove an uploaded source', () => {
    const props = createProps();
    render(<IntakePanel {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ta bort' }));

    expect(props.onRemoveSource).toHaveBeenCalledWith('source-1');
  });
});
