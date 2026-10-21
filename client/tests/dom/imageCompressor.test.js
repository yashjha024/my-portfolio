// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { compressImageBeforeUpload } from '../../src/utils/imageCompressor.js';

/**
 * jsdom has no canvas encoder, so the canvas is replaced with a fake whose `toBlob` returns the
 * blob type a given browser would produce. This exercises the real fallback handling.
 */
const installFakeCanvas = ({ producedType, producedSize = 10 }) => {
  const ctx = { fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: null };
  const originalCreate = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    if (tag !== 'canvas') return originalCreate(tag);
    return {
      width: 0,
      height: 0,
      getContext: () => ctx,
      toBlob: (callback, requestedType) => {
        callback(new Blob([new Uint8Array(producedSize)], { type: producedType ?? requestedType }));
      },
    };
  });
  // Image decoding: fire onload as soon as src is set
  vi.stubGlobal(
    'Image',
    class {
      constructor() {
        this.width = 4000;
        this.height = 2000;
      }
      set src(_value) {
        setTimeout(() => this.onload?.(), 0);
      }
    }
  );
  return ctx;
};

const sourceFile = (name, type) => new File([new Uint8Array(5000)], name, { type });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('compressImageBeforeUpload', () => {
  it('labels a PNG fallback as PNG when WebP encoding is unavailable', async () => {
    installFakeCanvas({ producedType: 'image/png' });
    const result = await compressImageBeforeUpload(sourceFile('diagram.png', 'image/png'), {
      outputFormat: 'image/webp',
    });
    expect(result.wasCompressed).toBe(true);
    expect(result.file.type).toBe('image/png');
    expect(result.file.name).toBe('diagram.png');
  });

  it('produces a .webp file with a WebP MIME type when WebP is supported', async () => {
    installFakeCanvas({ producedType: 'image/webp' });
    const result = await compressImageBeforeUpload(sourceFile('photo.jpg', 'image/jpeg'));
    expect(result.file.type).toBe('image/webp');
    expect(result.file.name).toBe('photo.webp');
  });

  it('keeps transparency: no background fill for WebP/PNG output', async () => {
    const ctx = installFakeCanvas({ producedType: 'image/webp' });
    await compressImageBeforeUpload(sourceFile('logo.png', 'image/png'));
    expect(ctx.fillRect).not.toHaveBeenCalled();
    expect(ctx.drawImage).toHaveBeenCalled();
  });

  it('fills a white (not navy) background only for JPEG output', async () => {
    const ctx = installFakeCanvas({ producedType: 'image/jpeg' });
    await compressImageBeforeUpload(sourceFile('logo.png', 'image/png'), {
      outputFormat: 'image/jpeg',
    });
    expect(ctx.fillRect).toHaveBeenCalledTimes(1);
    expect(ctx.fillStyle).toBe('#ffffff');
  });

  it('uploads the original when the browser produces an unsupported type or no savings', async () => {
    installFakeCanvas({ producedType: 'image/bmp' });
    const original = sourceFile('photo.png', 'image/png');
    expect((await compressImageBeforeUpload(original)).file).toBe(original);

    vi.restoreAllMocks();
    installFakeCanvas({ producedType: 'image/webp', producedSize: 6000 });
    expect((await compressImageBeforeUpload(original)).file).toBe(original);
  });

  it('never touches PDFs or unsupported formats', async () => {
    const pdf = sourceFile('spec.pdf', 'application/pdf');
    const svg = sourceFile('icon.svg', 'image/svg+xml');
    expect((await compressImageBeforeUpload(pdf)).file).toBe(pdf);
    expect((await compressImageBeforeUpload(svg)).file).toBe(svg);
  });
});
