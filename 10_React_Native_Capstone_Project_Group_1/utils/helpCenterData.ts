/**
 * Help Center Knowledge Base, Status-Based FAQ Matching & Feedback Persistence - Marketplace
 *
 * Student Implementation Guide:
 * Complete the Customer Support Center data & persistence layer:
 * 1. Provide comprehensive FAQs across all 4 support categories:
 *    - Shipment & Delivery
 *    - Returns
 *    - Refunds
 *    - Ordering
 * 2. Recommend context-aware Related FAQs based on the customer's selected order status
 * 3. Search FAQs by keywords across titles, questions, answers, and categories
 * 4. Persist per-user article helpfulness feedback ("Yes" / "No") in AsyncStorage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type HelpTopicCategory =
  | 'Shipment & Delivery'
  | 'Returns'
  | 'Refunds'
  | 'Ordering';

export interface HelpFaqArticle {
  id: string;
  category: HelpTopicCategory;
  question: string;
  answer: string;
  keywords: string[];
  relatedIds: string[];
}

export const HELP_TOPIC_CATEGORIES: HelpTopicCategory[] = [
  'Shipment & Delivery',
  'Returns',
  'Refunds',
  'Ordering',
];

export const HELP_FAQ_ARTICLES: HelpFaqArticle[] = [
  // ==================== A. SHIPMENT & DELIVERY ====================
  {
    id: 'ship-where-is-package',
    category: 'Shipment & Delivery',
    question: 'Where is my package?',
    answer:
      'You can check the real-time location of your parcel by opening Orders or Messages > Shop Updates and selecting your order. Once the seller hands over your parcel to the courier (such as J&T Express), live tracking checkpoints and your tracking number will appear on the Order Tracking page.',
    keywords: ['where is my package', 'where is my order', 'track', 'tracking', 'location', 'parcel'],
    relatedIds: ['ship-when-arrive', 'ship-courier-info', 'ship-delayed'],
  },
  {
    id: 'ship-when-arrive',
    category: 'Shipment & Delivery',
    question: 'When will my order arrive?',
    answer:
      'Estimated delivery dates depend on your delivery address and the assigned courier:\n\n• Metro Manila & Central Luzon: 1–3 business days after shipment.\n• Provincial Luzon: 2–5 business days after shipment.\n• Visayas & Mindanao: 4–8 business days after shipment.\n\nYou will receive an Out for Delivery notification on the day your rider is scheduled to deliver.',
    keywords: ['when will my order arrive', 'estimated delivery', 'delivery date', 'eta', 'how long'],
    relatedIds: ['ship-where-is-package', 'ship-delayed', 'ship-failed-attempt'],
  },
  {
    id: 'ship-status-meaning',
    category: 'Shipment & Delivery',
    question: 'What do the different order shipping statuses mean?',
    answer:
      '• To Ship: Your order is confirmed and the seller is packing your items.\n• Shipped / In Transit: Your parcel has been picked up by the courier and is moving between sorting hubs.\n• Out for Delivery: Your courier rider is on the way to your delivery address today.\n• Completed / Delivered: Your parcel has been successfully delivered.',
    keywords: ['order shipping status', 'status', 'to ship', 'shipped', 'in transit', 'out for delivery'],
    relatedIds: ['ship-where-is-package', 'ship-courier-info', 'order-change-details'],
  },
  {
    id: 'ship-delayed',
    category: 'Shipment & Delivery',
    question: 'Why is my delivery delayed?',
    answer:
      'Deliveries may occasionally experience delays due to severe weather, peak campaign volume, or sorting hub congestion. If your tracking status has not updated for more than 48 hours past the estimated delivery date, open your order in Orders and contact the seller or courier support with your tracking number.',
    keywords: ['delayed deliveries', 'delay', 'late', 'stuck', 'not moving'],
    relatedIds: ['ship-where-is-package', 'ship-when-arrive', 'refund-how-to-request'],
  },
  {
    id: 'ship-failed-attempt',
    category: 'Shipment & Delivery',
    question: 'What happens if a delivery attempt fails?',
    answer:
      'If the courier cannot reach you or no one is available to receive the parcel (or pay for a Cash on Delivery order), the delivery attempt is marked as unsuccessful. Most couriers automatically make a second delivery attempt on the next business day. Keep your registered phone line open so the rider can contact you.',
    keywords: ['failed delivery attempts', 'unsuccessful', 'missed delivery', 'reattempt'],
    relatedIds: ['ship-when-arrive', 'ship-courier-info', 'order-cod'],
  },
  {
    id: 'ship-courier-info',
    category: 'Shipment & Delivery',
    question: 'How can I check my assigned courier and tracking number?',
    answer:
      'Open Orders or Messages > Shop Updates and tap your shipped order. Your assigned courier partner (such as J&T Express) and tracking number are displayed directly below the order status summary.',
    keywords: ['courier information', 'j&t', 'courier', 'tracking number'],
    relatedIds: ['ship-where-is-package', 'ship-when-arrive', 'ship-change-address'],
  },
  {
    id: 'ship-change-address',
    category: 'Shipment & Delivery',
    question: 'Can I change my delivery address or phone number after ordering?',
    answer:
      'You may update your delivery details only while the order is still in Unpaid or early To Ship status before the seller prints the shipping waybill. Once a tracking number is generated or the parcel is shipped, the delivery address can no longer be modified.',
    keywords: ['changing delivery details', 'change address', 'edit address', 'phone number'],
    relatedIds: ['order-change-order', 'order-how-to-cancel', 'ship-status-meaning'],
  },

  // ==================== B. RETURNS ====================
  {
    id: 'ret-how-to-return',
    category: 'Returns',
    question: 'How do I return a product?',
    answer:
      '1. Go to Orders and select your delivered order.\n2. Tap Request Return / Refund within the eligible return window.\n3. Select the item(s), choose your return reason, and upload clear photos or unboxing video evidence.\n4. Submit your request and follow the return drop-off or courier pick-up instructions once approved.',
    keywords: ['how do i return a product', 'how can i return an item', 'return product', 'return item'],
    relatedIds: ['ret-eligibility', 'ret-evidence', 'ret-shipping-procedure'],
  },
  {
    id: 'ret-eligibility',
    category: 'Returns',
    question: 'Which orders are eligible for return?',
    answer:
      'Items delivered within the return protection period that are damaged, defective, incorrect, incomplete, or significantly different from the product listing are eligible for return. Items must be unused, unwashed, and include original tags, accessories, and packaging.',
    keywords: ['return eligibility', 'eligible', 'return window', 'policy'],
    relatedIds: ['ret-how-to-return', 'ret-non-returnable', 'refund-eligibility'],
  },
  {
    id: 'ret-shipping-procedure',
    category: 'Returns',
    question: 'How does return shipping work?',
    answer:
      'Once your return request is approved, Marketplace generates a return shipping label or drop-off code. Pack the item securely in its original packaging, attach the return waybill, and drop it off at the designated courier branch (or hand it to the scheduled pick-up rider) before the return deadline.',
    keywords: ['return shipping procedures', 'drop off', 'pickup', 'return label', 'waybill'],
    relatedIds: ['ret-how-to-return', 'ret-status', 'refund-processing-time'],
  },
  {
    id: 'ret-evidence',
    category: 'Returns',
    question: 'What photos or evidence are required for a return request?',
    answer:
      'To help verify your claim quickly, please upload:\n\n• Clear photos of the outer parcel and shipping waybill.\n• Close-up photos showing the defect, damage, or wrong item received.\n• An unboxing video showing the sealed package being opened (strongly recommended for electronics and fragile items).',
    keywords: ['required photos or evidence', 'proof', 'unboxing video', 'pictures'],
    relatedIds: ['ret-how-to-return', 'ret-eligibility', 'refund-how-to-request'],
  },
  {
    id: 'ret-status',
    category: 'Returns',
    question: 'How do I check my return request status?',
    answer:
      'Open Orders > Returns or check Messages > Shop Updates for Return or Refund Update alerts. You can view whether your request is Under Review, Awaiting Return Drop-off, In Transit Back to Seller, or Completed.',
    keywords: ['return request status', 'track return', 'return update'],
    relatedIds: ['ret-shipping-procedure', 'refund-status', 'refund-processing-time'],
  },
  {
    id: 'ret-non-returnable',
    category: 'Returns',
    question: 'What items cannot be returned?',
    answer:
      'For hygiene, safety, and regulatory reasons, perishable groceries, opened skincare or cosmetics, intimate apparel, customized items, and digital vouchers cannot be returned unless they arrived damaged, expired, or incorrect.',
    keywords: ['items that cannot be returned', 'non-returnable', 'excluded items'],
    relatedIds: ['ret-eligibility', 'refund-eligibility', 'ret-how-to-return'],
  },

  // ==================== C. REFUNDS ====================
  {
    id: 'refund-how-to-request',
    category: 'Refunds',
    question: 'How do I request a refund?',
    answer:
      '1. Open Orders and select the order you want refunded.\n2. Tap Cancel Order (if not yet shipped) or Request Return / Refund (if already delivered).\n3. Select your reason, attach supporting photos if applicable, and submit.\n4. Once approved (and after returned goods are inspected, if required), your refund is automatically released.',
    keywords: ['how do i request a refund', 'how do i get a refund', 'get refund', 'claim refund'],
    relatedIds: ['refund-eligibility', 'refund-processing-time', 'refund-methods'],
  },
  {
    id: 'refund-eligibility',
    category: 'Refunds',
    question: 'When am I eligible for a full or partial refund?',
    answer:
      'You are eligible for a refund if:\n\n• Your paid order was cancelled before shipment.\n• Your parcel was lost in transit or failed delivery and returned to the seller.\n• Your return request for a defective, damaged, or wrong item was approved.\n• An item was missing from your delivered package.',
    keywords: ['refund eligibility', 'full refund', 'partial refund', 'qualify'],
    relatedIds: ['refund-how-to-request', 'ret-eligibility', 'refund-processing-time'],
  },
  {
    id: 'refund-processing-time',
    category: 'Refunds',
    question: 'How long does it take to receive my refund?',
    answer:
      'Refund processing times depend on your original payment method:\n\n• PayLater Credit Limit: Restored immediately upon refund approval (viewable in PayLater > Refund History).\n• GCash / E-Wallets: 1–3 business days.\n• Debit / Credit Cards & Online Banking (BPI / UnionBank): 5–10 business days depending on your bank.',
    keywords: ['refund processing time', 'how long refund', 'when will i get my refund'],
    relatedIds: ['refund-methods', 'refund-status', 'refund-delayed'],
  },
  {
    id: 'refund-status',
    category: 'Refunds',
    question: 'Where can I check my refund status?',
    answer:
      'You can monitor your refund progress in Orders > Returns, Messages > Shop Updates, or PayLater > Refund History (for orders paid via PayLater). Each entry displays the Refund Reference, Request Date, Refund Amount, and current status.',
    keywords: ['refund status', 'track refund', 'refund history'],
    relatedIds: ['refund-processing-time', 'refund-methods', 'ret-status'],
  },
  {
    id: 'refund-methods',
    category: 'Refunds',
    question: 'Where will my refund be credited?',
    answer:
      'Refunds are credited back to the original payment method used during checkout (such as your PayLater available credit limit, GCash wallet, or linked bank account). For Cash on Delivery (COD) orders, approved refunds are credited to your verified e-wallet or bank payout account.',
    keywords: ['refund payment methods', 'where refund goes', 'cod refund', 'paylater refund'],
    relatedIds: ['refund-processing-time', 'refund-status', 'refund-delayed'],
  },
  {
    id: 'refund-delayed',
    category: 'Refunds',
    question: 'What should I do if my refund is delayed or failed?',
    answer:
      'If your refund has exceeded the standard processing window or shows a Failed status, verify that your receiving e-wallet or bank account is active and within balance limits, then contact Customer Support with your Order ID and Refund Reference number.',
    keywords: ['failed or delayed refunds', 'refund failed', 'missing refund'],
    relatedIds: ['refund-processing-time', 'refund-methods', 'refund-status'],
  },

  // ==================== D. ORDERING ====================
  {
    id: 'order-how-to-cancel',
    category: 'Ordering',
    question: 'How can I cancel my order?',
    answer:
      'You can cancel an order directly from the Orders page while its status is still Unpaid or To Ship (before the seller hands the parcel over to the courier):\n\n1. Go to Orders.\n2. Select the order you wish to cancel.\n3. Tap Cancel Order and choose a cancellation reason.\n\nIf the order has already been shipped, cancellation is no longer available—you may request a return/refund after delivery.',
    keywords: ['how can i cancel my order', 'how do i cancel my order', 'cancel order', 'cancellation'],
    relatedIds: ['order-change-order', 'refund-how-to-request', 'ship-status-meaning'],
  },
  {
    id: 'order-how-to-place',
    category: 'Ordering',
    question: 'How do I place an order on Marketplace?',
    answer:
      '1. Browse products on Home or search by keyword or category.\n2. Open a product page, select your preferred variation and quantity, and tap Add to Cart or Buy Now.\n3. Review your delivery address, apply any eligible Coupons or Bonus rewards, choose your payment method, and tap Place Order.',
    keywords: ['how to place an order', 'buy', 'checkout', 'order'],
    relatedIds: ['order-payment-methods', 'order-confirmation', 'order-variations'],
  },
  {
    id: 'order-change-order',
    category: 'Ordering',
    question: 'Can I change items, quantity, or variation after placing an order?',
    answer:
      'Once an order is submitted, item variations and quantities cannot be edited directly. If your order has not been shipped yet, you can cancel it in Orders and place a new order with your preferred variation or quantity.',
    keywords: ['how to change an order', 'modify order', 'change quantity', 'change variation'],
    relatedIds: ['order-how-to-cancel', 'order-variations', 'ship-change-address'],
  },
  {
    id: 'order-payment-methods',
    category: 'Ordering',
    question: 'What payment methods are accepted?',
    answer:
      'Marketplace supports Cash on Delivery (COD), GCash, BPI Direct Debit, UnionBank Direct Debit, and approved PayLater accounts (subject to your available credit limit and disclosed terms).',
    keywords: ['available payment methods', 'payment options', 'gcash', 'bpi', 'unionbank', 'paylater'],
    relatedIds: ['order-cod', 'order-how-to-place', 'order-confirmation'],
  },
  {
    id: 'order-cod',
    category: 'Ordering',
    question: 'How does Cash on Delivery (COD) work?',
    answer:
      'With Cash on Delivery (COD), you pay in cash directly to the courier rider when your package arrives at your doorstep. Please prepare the exact payment amount shown in your order details or Out for Delivery notification.',
    keywords: ['cash on delivery', 'cod', 'pay upon delivery'],
    relatedIds: ['order-payment-methods', 'ship-failed-attempt', 'order-how-to-place'],
  },
  {
    id: 'order-confirmation',
    category: 'Ordering',
    question: 'How do I know my order is confirmed?',
    answer:
      'Immediately after submitting checkout, your order appears in Orders and you receive an Order Placed notification in Messages > Shop Updates with your Order ID and order summary.',
    keywords: ['order confirmation', 'confirmed', 'receipt'],
    relatedIds: ['order-how-to-place', 'ship-status-meaning', 'order-contact-seller'],
  },
  {
    id: 'order-variations',
    category: 'Ordering',
    question: 'How do product variations and stock availability work?',
    answer:
      'Each product page displays real-time stock availability and selectable options (such as size, color, or model). Out-of-stock variations are automatically disabled so you only check out available items.',
    keywords: ['product variations and availability', 'out of stock', 'size', 'color', 'stock'],
    relatedIds: ['order-how-to-place', 'order-change-order', 'order-contact-seller'],
  },
  {
    id: 'order-contact-seller',
    category: 'Ordering',
    question: 'How can I contact the seller about my order?',
    answer:
      'Open your order details in Orders or tap the store name on the product listing to message the seller directly regarding product questions, packaging requests, or order updates.',
    keywords: ['how can i contact the seller', 'message seller', 'chat seller', 'store'],
    relatedIds: ['order-confirmation', 'order-how-to-cancel', 'ret-how-to-return'],
  },
];

/**
 * Return tailored Related FAQs based on the customer's selected order status.
 */
export function getRecommendedFaqsForOrder(order?: any | null): HelpFaqArticle[] {
  const status = String(order?.status || '').toLowerCase();

  let priorityIds: string[];
  if (!order) {
    priorityIds = [
      'ship-where-is-package',
      'ship-when-arrive',
      'order-how-to-cancel',
      'refund-how-to-request',
      'ret-how-to-return',
    ];
  } else if (status.includes('return') || status.includes('refund')) {
    priorityIds = [
      'ret-status',
      'refund-status',
      'refund-processing-time',
      'ret-shipping-procedure',
    ];
  } else if (status.includes('deliver') || status.includes('complet')) {
    priorityIds = [
      'ret-how-to-return',
      'refund-how-to-request',
      'ret-eligibility',
      'order-contact-seller',
    ];
  } else if (status.includes('ship') || status.includes('transit') || status.includes('out')) {
    priorityIds = [
      'ship-where-is-package',
      'ship-when-arrive',
      'ship-courier-info',
      'ship-failed-attempt',
    ];
  } else if (status.includes('cancel')) {
    priorityIds = [
      'refund-how-to-request',
      'refund-processing-time',
      'refund-methods',
      'order-how-to-place',
    ];
  } else {
    // Unpaid / Pending / To Ship / Processing
    priorityIds = [
      'order-how-to-cancel',
      'ship-when-arrive',
      'ship-change-address',
      'order-contact-seller',
    ];
  }

  return priorityIds
    .map((id) => HELP_FAQ_ARTICLES.find((a) => a.id === id))
    .filter((a): a is HelpFaqArticle => Boolean(a));
}

export function searchHelpFaqs(query: string): HelpFaqArticle[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const tokens = normalized.split(/\s+/).filter(Boolean);

  return HELP_FAQ_ARTICLES.filter((article) => {
    const haystack = [
      article.question,
      article.answer,
      article.category,
      ...article.keywords,
    ]
      .join(' ')
      .toLowerCase();

    return tokens.every((token) => haystack.includes(token));
  });
}

const getFeedbackKey = (userId?: string | number) =>
  `@marketplace_user_${userId || 'guest'}_help_article_feedback`;

export async function getHelpArticleFeedback(
  userId?: string | number
): Promise<Record<string, 'yes' | 'no'>> {
  try {
    const raw = await AsyncStorage.getItem(getFeedbackKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveHelpArticleFeedback(
  userId: string | number | undefined,
  articleId: string,
  vote: 'yes' | 'no'
): Promise<Record<string, 'yes' | 'no'>> {
  const current = await getHelpArticleFeedback(userId);
  const updated = { ...current, [articleId]: vote };
  try {
    await AsyncStorage.setItem(getFeedbackKey(userId), JSON.stringify(updated));
  } catch {
    // Ignore storage write error
  }
  return updated;
}