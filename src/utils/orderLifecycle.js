/**
 * ROSHAN ENTERPRISES — ORDER LIFECYCLE & STATE MACHINE UTILITY
 * Standardized status transitions, timelines, and dispatch schemas.
 */

export const ORDER_STATUSES = {
  ORDER_PLACED: 'ORDER_PLACED',
  CONFIRMED: 'CONFIRMED',
  PACKED: 'PACKED',
  DISPATCHED: 'DISPATCHED',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUSES.ORDER_PLACED]: 'Order Placed',
  [ORDER_STATUSES.CONFIRMED]: 'Payment Confirmed',
  [ORDER_STATUSES.PACKED]: 'Packed & Ready',
  [ORDER_STATUSES.DISPATCHED]: 'Dispatched',
  [ORDER_STATUSES.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [ORDER_STATUSES.DELIVERED]: 'Delivered',
  [ORDER_STATUSES.CANCELLED]: 'Cancelled'
};

export const ORDER_STEP_KEYS = [
  ORDER_STATUSES.ORDER_PLACED,
  ORDER_STATUSES.CONFIRMED,
  ORDER_STATUSES.PACKED,
  ORDER_STATUSES.DISPATCHED,
  ORDER_STATUSES.OUT_FOR_DELIVERY,
  ORDER_STATUSES.DELIVERED
];

/**
 * Normalizes legacy or free-text status to official status key
 * @param {string} status - Raw status string
 * @returns {string} - Canonical order status
 */
export function normalizeOrderStatus(status) {
  if (!status) return ORDER_STATUSES.ORDER_PLACED;
  const s = String(status).trim().toUpperCase().replace(/[\s-]+/g, '_');

  if (s === 'PROCESSING' || s === 'PLACED' || s === 'ORDER_PLACED') return ORDER_STATUSES.ORDER_PLACED;
  if (s === 'CONFIRMED' || s === 'PAYMENT_CONFIRMED' || s === 'PAID') return ORDER_STATUSES.CONFIRMED;
  if (s === 'PACKED' || s === 'PACKAGING') return ORDER_STATUSES.PACKED;
  if (s === 'DISPATCHED' || s === 'SHIPPED') return ORDER_STATUSES.DISPATCHED;
  if (s === 'OUT_FOR_DELIVERY' || s === 'IN_TRANSIT') return ORDER_STATUSES.OUT_FOR_DELIVERY;
  if (s === 'DELIVERED' || s === 'COMPLETED') return ORDER_STATUSES.DELIVERED;
  if (s === 'CANCELLED' || s === 'REJECTED') return ORDER_STATUSES.CANCELLED;

  return ORDER_STATUSES.ORDER_PLACED;
}

/**
 * Generates initial chronological timeline when order is placed
 * @param {object} params
 * @param {string} params.paymentMethod - 'upi' | 'cod'
 * @param {string} [params.notes]
 * @returns {Array<object>} Timeline events
 */
export function createInitialOrderTimeline({ paymentMethod = 'cod', notes = '' } = {}) {
  const now = new Date().toISOString();
  const isUPI = paymentMethod === 'upi';

  return [
    {
      status: ORDER_STATUSES.ORDER_PLACED,
      label: 'Order Placed',
      timestamp: now,
      description: isUPI
        ? 'Order registered. UPI transaction reference submitted and awaiting store verification.'
        : 'Order registered successfully with Cash on Delivery.',
      location: 'Satyam Nagar, Dhanbad'
    }
  ];
}

/**
 * Appends a new status event to existing timeline
 * @param {Array<object>} timeline - Current timeline array
 * @param {string} newStatus - Target status key
 * @param {string} description - Description of event
 * @param {string} [location] - Location info
 * @returns {Array<object>} Updated timeline array
 */
export function appendTimelineEvent(timeline = [], newStatus, description, location = 'Dhanbad Hub') {
  const norm = normalizeOrderStatus(newStatus);
  const existing = Array.isArray(timeline) ? [...timeline] : [];

  existing.push({
    status: norm,
    label: ORDER_STATUS_LABELS[norm] || norm,
    timestamp: new Date().toISOString(),
    description: description || `Status updated to ${ORDER_STATUS_LABELS[norm] || norm}.`,
    location
  });

  return existing;
}

/**
 * Calculates current progress index (0 to 5)
 * @param {string} status - Order status
 * @returns {number} Step index
 */
export function getOrderStepIndex(status) {
  const norm = normalizeOrderStatus(status);
  const idx = ORDER_STEP_KEYS.indexOf(norm);
  return idx === -1 ? 0 : idx;
}

/**
 * Validates Indian UPI 12-digit UTR/Reference number
 * @param {string} utr - User entered reference
 * @returns {boolean}
 */
export function validateUPIUTR(utr) {
  if (!utr || typeof utr !== 'string') return false;
  const clean = utr.trim().replace(/\s+/g, '');
  // Matches 12-digit numeric or standard 12-character alphanumeric bank reference
  return /^[0-9A-Za-z]{12}$/.test(clean);
}

/**
 * Calculates dynamic delivery window based on Dhanbad and regional pin codes
 * @param {string} addressOrPin - Customer shipping address or 6-digit pin code
 * @returns {{ window: string, description: string, isLocal: boolean, estimatedDate: string }}
 */
export function calculateDynamicETA(addressOrPin) {
  const str = String(addressOrPin || '');
  const pinMatch = str.match(/\b(\d{6})\b/);
  const pin = pinMatch ? pinMatch[1] : '';

  // Dhanbad district PIN codes: 826xxx, 828xxx
  if (
    pin.startsWith('826') ||
    pin.startsWith('828') ||
    str.toLowerCase().includes('dhanbad') ||
    str.toLowerCase().includes('katras') ||
    str.toLowerCase().includes('jharia')
  ) {
    return {
      window: 'Same Day / Within 24 Hours',
      description: 'Local Express Delivery from Satyam Nagar Dhanbad Hub',
      isLocal: true,
      estimatedDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }

  // Other Jharkhand PIN codes: 814xxx - 835xxx
  if (
    pin.startsWith('81') ||
    pin.startsWith('82') ||
    pin.startsWith('83') ||
    str.toLowerCase().includes('jharkhand') ||
    str.toLowerCase().includes('ranchi') ||
    str.toLowerCase().includes('bokaro')
  ) {
    return {
      window: '1 - 2 Business Days',
      description: 'Regional Express Delivery via Jharkhand Transit Network',
      isLocal: false,
      estimatedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  // Rest of India
  return {
    window: '3 - 5 Business Days',
    description: 'National Surface / Air Courier Delivery',
    isLocal: false,
    estimatedDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
  };
}
