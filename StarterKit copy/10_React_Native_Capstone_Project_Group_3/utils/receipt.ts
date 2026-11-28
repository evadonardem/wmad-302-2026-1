/**
 * Builds the HTML for a printable / shareable order receipt (rendered to PDF by
 * expo-print). Pure so it can be unit tested.
 */
import type { Order } from '@/types/account';
import { formatDate, formatPrice } from './format';
import { formatDeliveryDay } from './delivery';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);

export function buildReceiptHtml(order: Order, accent: string, emoji = '🛍️'): string {
  const rows = order.lines
    .map(
      (line) => `<tr>
        <td>${escapeHtml(line.title)}</td>
        <td class="num">${line.quantity}</td>
        <td class="num">${formatPrice(line.price)}</td>
        <td class="num">${formatPrice(line.discountedTotal)}</td>
      </tr>`
    )
    .join('');

  const summary: [string, string][] = [
    ['Subtotal', formatPrice(order.subtotal)],
    ...(order.productDiscount > 0 ? [['Product discounts', `-${formatPrice(order.productDiscount)}`] as [string, string]] : []),
    ...(order.couponDiscount > 0
      ? [[`Coupon (${escapeHtml(order.couponCode ?? '')})`, `-${formatPrice(order.couponDiscount)}`] as [string, string]]
      : []),
    ['Shipping', order.shippingFee === 0 ? 'FREE' : formatPrice(order.shippingFee)],
    ...(order.giftWrapFee ? [['Gift wrap', formatPrice(order.giftWrapFee)] as [string, string]] : []),
  ];

  const shipping = order.shipping
    ? `<p><strong>Ship to:</strong> ${escapeHtml(order.shipping.fullName)}, ${escapeHtml(order.shipping.street)}, ${escapeHtml(
        order.shipping.city
      )} ${escapeHtml(order.shipping.postalCode)}</p>`
    : '';
  const delivery = order.deliveryDate
    ? `<p><strong>Delivery:</strong> ${formatDeliveryDay(order.deliveryDate)} · ${escapeHtml(order.deliverySlot ?? '')}</p>`
    : '';

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Receipt #${order.cartId}</title>
<style>
  body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: #222; padding: 32px; }
  .header { background: ${accent}; color: #fff; padding: 20px 24px; border-radius: 16px; }
  .header h1 { margin: 0; font-size: 26px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th, td { padding: 8px; border-bottom: 1px solid #eee; text-align: left; font-size: 14px; }
  .num { text-align: right; }
  .total { font-size: 18px; font-weight: 800; color: ${accent}; }
  .footer { margin-top: 32px; color: #888; font-size: 12px; text-align: center; }
</style></head>
<body>
  <div class="header"><h1>${emoji} Marketplace receipt</h1><div>Order #${order.cartId} · ${
    order.createdAt ? formatDate(order.createdAt) : 'Past order'
  }</div></div>
  ${shipping}${delivery}
  ${order.paymentLabel ? `<p><strong>Payment:</strong> ${escapeHtml(order.paymentLabel)}</p>` : ''}
  <table>
    <tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Total</th></tr>
    ${rows}
  </table>
  <table>
    ${summary.map(([label, value]) => `<tr><td>${label}</td><td class="num">${value}</td></tr>`).join('')}
    <tr><td class="total">Total</td><td class="num total">${formatPrice(order.grandTotal)}</td></tr>
  </table>
  <p class="footer">Thank you for shopping with Marketplace! (Demo receipt — data from dummyjson.com)</p>
</body></html>`;
}
