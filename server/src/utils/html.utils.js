const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escape untrusted text for interpolation into HTML element content or quoted attributes.
 */
export const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
