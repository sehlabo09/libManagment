// Small formatting helpers shared by the pages.

/**
 * Formats an ISO date string for display, e.g. "16 Nov 2026, 14:30".
 */
export function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "16 Nov 2026" */
export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export const TRANSACTION_LABELS = {
  BORROW: 'Borrow',
  RETURN: 'Return',
  STOCK_ADDITION: 'Stock Addition',
};

export const TRANSACTION_BADGE_CLASS = {
  BORROW: 'badge badge-borrow',
  RETURN: 'badge badge-return',
  STOCK_ADDITION: 'badge badge-stock',
};

/**
 * Describes the stock level of a book. Anything under 2 available copies is
 * treated as low stock, and zero is out of stock.
 */
export function stockStatus(available) {
  if (available < 2) {
    return { label: available <= 0 ? 'Out of stock' : 'Low stock', className: 'status-low' };
  }
  return { label: 'Available', className: 'status-available' };
}

/**
 * Returns the CSS class used to highlight a low stock table row (fewer than
 * 2 copies available).
 */
export function stockRowClass(available) {
  return available < 2 ? 'low-stock' : '';
}
