import QRCode from 'qrcode';

// Asset QR codes encode the asset tag (e.g. "AF-0001"), so a scan resolves the
// physical label back to the record. Two forms: a data-URL for embedding in
// JSON responses, and a raw PNG buffer for the image endpoint.
const OPTS = { margin: 1, width: 240 } as const;

export const qrDataUrl = (text: string): Promise<string> =>
  QRCode.toDataURL(text, OPTS);

export const qrPngBuffer = (text: string): Promise<Buffer> =>
  QRCode.toBuffer(text, { ...OPTS, type: 'png' });
