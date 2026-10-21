// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AssetPreviewModal } from '../../src/components/admin/AssetPreviewModal.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const assetA = {
  id: 'aaaaaaaa-0000-4000-8000-000000000001',
  original_name: 'hero.png',
  alt_text: 'Hero image',
  type: 'image',
  url: 'https://cdn.example.test/hero.png',
  folder: 'case-studies',
  size_bytes: 2048,
  is_used: true,
  storage_visibility: 'public',
};
const assetB = {
  id: 'bbbbbbbb-0000-4000-8000-000000000002',
  original_name: 'spec.pdf',
  alt_text: 'Spec PDF',
  type: 'pdf',
  url: '/api/media/download/123_spec.pdf',
  folder: 'private',
  size_bytes: 4096,
  is_used: null,
  storage_visibility: 'private',
  visibility_mismatch: true,
};

let container;
let root;
let consoleError;

const render = (props) =>
  act(() => {
    root.render(<AssetPreviewModal onClose={() => {}} {...props} />);
  });

const altInput = () => container.querySelector('form input[type="text"]');
const button = (text) =>
  [...container.querySelectorAll('button')].find((b) => b.textContent.trim() === text);

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe('AssetPreviewModal', () => {
  it('renders nothing while closed or without a selection', () => {
    render({ isOpen: false, asset: assetA });
    expect(container.innerHTML).toBe('');
    render({ isOpen: true, asset: null });
    expect(container.innerHTML).toBe('');
  });

  it('opens, switches assets, closes and reopens without hook-order errors', () => {
    render({ isOpen: false, asset: null });
    expect(() => render({ isOpen: true, asset: assetA })).not.toThrow();
    expect(container.textContent).toContain('hero.png');
    expect(altInput().value).toBe('Hero image');

    // Edit alt text, then switch to another asset: state must reset to the new asset
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(altInput(), 'Unsaved edit');
      altInput().dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(altInput().value).toBe('Unsaved edit');

    render({ isOpen: true, asset: assetB });
    expect(container.textContent).toContain('spec.pdf');
    expect(altInput().value).toBe('Spec PDF');

    // The original component called hooks after an early return and crashed when closing
    // ("Rendered fewer hooks than expected")
    expect(() => render({ isOpen: false, asset: assetB })).not.toThrow();
    expect(container.innerHTML).toBe('');
    expect(() => render({ isOpen: true, asset: assetA })).not.toThrow();
    expect(container.textContent).toContain('hero.png');
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();

    const hookErrors = consoleError.mock.calls.filter((args) =>
      String(args[0]).match(/hooks|Rendered (more|fewer)/i)
    );
    expect(hookErrors).toEqual([]);
  });

  it('shows the visibility that the storage bucket actually enforces', () => {
    render({ isOpen: true, asset: assetA });
    expect(container.querySelector('[data-testid="asset-visibility"]').textContent).toContain(
      'Public bucket'
    );
    render({ isOpen: true, asset: assetB });
    const visibility = container.querySelector('[data-testid="asset-visibility"]').textContent;
    expect(visibility).toContain('Private bucket');
    expect(visibility).toContain('flag disagrees with the bucket');
    expect(container.textContent).toContain('Usage unknown');
  });

  it('closes only after a confirmed delete and reports failures', async () => {
    const onClose = vi.fn();
    const failingDelete = vi
      .fn()
      .mockRejectedValue(new Error('"hero.png" is still used by 1 item(s).'));
    render({ isOpen: true, asset: assetA, onClose, onDelete: failingDelete });

    await act(async () => {
      button('Delete').click();
    });
    expect(failingDelete).toHaveBeenCalledWith(assetA);
    expect(onClose).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]').textContent).toContain('still used');

    const okDelete = vi.fn().mockResolvedValue(undefined);
    render({ isOpen: true, asset: assetA, onClose, onDelete: okDelete });
    await act(async () => {
      button('Delete').click();
    });
    expect(okDelete).toHaveBeenCalledWith(assetA);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('saves alt text through the parent callback and surfaces errors', async () => {
    const onSaveAltText = vi.fn().mockRejectedValueOnce(new Error('Could not update alt text.'));
    render({ isOpen: true, asset: assetA, onSaveAltText });

    await act(async () => {
      container
        .querySelector('form')
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(onSaveAltText).toHaveBeenCalledWith(assetA, 'Hero image');
    expect(container.querySelector('[role="alert"]').textContent).toContain('Could not update');
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render({ isOpen: true, asset: assetA, onClose });
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
