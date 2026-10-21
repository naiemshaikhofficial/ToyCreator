/**
 * Producer Toy Marketplace Settlement & Commission Engine
 * 
 * Implements the verified commercial terms for partner and third-party audio developer agreements
 * (including FORGE Multimedia Group LLC).
 * 
 * SETTLEMENT DEDUCTION HIERARCHY:
 * 1. Customer Product Payment (gross after applicable discounts).
 * 2. Exclude separately collected transaction taxes (sales tax / VAT / GST).
 * 3. Deduct actual payment processing fee (e.g. PayPal international 4.40% + $0.30 fixed fee or domestic processor)
 *    and transaction-specific currency conversion charges.
 * 4. Reverse or adjust refunded and charged-back sales.
 * 5. Calculate eligible net sale proceeds.
 * 6. Allocate 70% to Seller (e.g. FORGE) and 30% to Producer Toy.
 * 7. Deduct actual outbound seller payout transfer fees (SWIFT / wire) from the seller's share
 *    without additional markup.
 */

export interface TransactionSettlementInput {
  transactionId?: string;
  orderNumber?: string;
  productPrice: number;
  discountAmount?: number;
  discountFundedBy?: 'seller' | 'platform';
  collectedTax?: number;
  currency?: string; // 'USD' | 'INR' | etc.
  paymentGateway?: 'paypal' | 'razorpay' | string;
  actualProcessorFee?: number;
  currencyConversionFee?: number;
  isRefunded?: boolean;
  refundAmount?: number;
  isChargeback?: boolean;
  chargebackFee?: number;
  payoutTransferFee?: number;
  sellerSharePercent?: number; // default 70
  platformSharePercent?: number; // default 30
}

export interface ItemizedSettlementResult {
  customerGrossPaid: number;
  discountDeduction: number;
  netPriceAfterDiscount: number;
  excludedTax: number;
  processorFee: number;
  currencyConversionFee: number;
  refundDeduction: number;
  eligibleNetProceeds: number;
  sellerGrossShare: number; // 70% of eligible net
  platformGrossShare: number; // 30% of eligible net
  payoutTransferFee: number;
  sellerFinalPayable: number;
  currency: string;
  breakdownSummary: string[];
}

/**
 * Calculates itemized settlement breakdown strictly following the contractual deduction order.
 */
export function calculateItemizedSettlement(
  input: TransactionSettlementInput
): ItemizedSettlementResult {
  const currency = input.currency || 'USD';
  const sellerPct = (input.sellerSharePercent ?? 70) / 100;
  const platformPct = (input.platformSharePercent ?? 30) / 100;

  // 1. Customer gross payment & discounts
  const rawPrice = Number(input.productPrice) || 0;
  const discount = Number(input.discountAmount) || 0;
  
  // If discount is seller-funded, it reduces the eligible sale price.
  // If discount is platform-funded, the seller is compensated on the pre-discount base.
  const isPlatformDiscount = input.discountFundedBy === 'platform';
  const netPriceAfterDiscount = isPlatformDiscount 
    ? rawPrice 
    : Math.max(0, rawPrice - discount);

  // 2. Exclude separately collected transaction taxes
  const tax = Number(input.collectedTax) || 0;

  // 3. Payment processor fees & currency conversion
  // Default to illustrative PayPal international commercial fee (4.4% + $0.30) if not specified
  let processorFee = 0;
  if (input.actualProcessorFee !== undefined) {
    processorFee = Number(input.actualProcessorFee);
  } else if (input.paymentGateway === 'paypal' || currency === 'USD') {
    processorFee = Number((netPriceAfterDiscount * 0.044 + 0.30).toFixed(2));
  } else if (input.paymentGateway === 'razorpay' || currency === 'INR') {
    // Domestic India gateway typical ~2% + 18% GST on fee = ~2.36%
    processorFee = Number((netPriceAfterDiscount * 0.0236).toFixed(2));
  }

  const convFee = Number(input.currencyConversionFee) || 0;

  // 4. Handle refunds and chargebacks
  let refundDeduction = 0;
  if (input.isRefunded) {
    refundDeduction = input.refundAmount !== undefined 
      ? Number(input.refundAmount) 
      : netPriceAfterDiscount;
  }
  const chargebackCost = input.isChargeback ? (Number(input.chargebackFee) || 15) : 0;

  // 5. Eligible Net Sale Proceeds
  const eligibleNetProceeds = Math.max(
    0,
    Number((netPriceAfterDiscount - processorFee - convFee - refundDeduction - chargebackCost).toFixed(2))
  );

  // 6. 70/30 Revenue Split
  const sellerGrossShare = Number((eligibleNetProceeds * sellerPct).toFixed(2));
  const platformGrossShare = Number((eligibleNetProceeds * platformPct).toFixed(2));

  // 7. Deduct outbound payout transfer fee (if applicable)
  const transferFee = Number(input.payoutTransferFee) || 0;
  const sellerFinalPayable = Math.max(0, Number((sellerGrossShare - transferFee).toFixed(2)));

  const breakdownSummary = [
    `Customer Product Payment: ${currency} ${rawPrice.toFixed(2)}`,
    discount > 0 ? `Discount: -${currency} ${discount.toFixed(2)} (${input.discountFundedBy || 'seller'} funded)` : 'Discount: None',
    `Tax (Excluded from revenue share): ${currency} ${tax.toFixed(2)}`,
    `Payment Processor Fee: -${currency} ${processorFee.toFixed(2)}`,
    convFee > 0 ? `Currency Conversion Fee: -${currency} ${convFee.toFixed(2)}` : null,
    refundDeduction > 0 ? `Refund Adjustment: -${currency} ${refundDeduction.toFixed(2)}` : null,
    `Eligible Net Proceeds: ${currency} ${eligibleNetProceeds.toFixed(2)}`,
    `Seller Share (${(sellerPct * 100).toFixed(0)}%): ${currency} ${sellerGrossShare.toFixed(2)}`,
    `Platform Commission (${(platformPct * 100).toFixed(0)}%): ${currency} ${platformGrossShare.toFixed(2)}`,
    transferFee > 0 ? `Outbound Payout Transfer Fee: -${currency} ${transferFee.toFixed(2)}` : 'Outbound Transfer Fee: None (Itemized at payout disbursement)',
    `Net Amount Due to Seller: ${currency} ${sellerFinalPayable.toFixed(2)}`,
  ].filter(Boolean) as string[];

  return {
    customerGrossPaid: rawPrice,
    discountDeduction: discount,
    netPriceAfterDiscount,
    excludedTax: tax,
    processorFee,
    currencyConversionFee: convFee,
    refundDeduction,
    eligibleNetProceeds,
    sellerGrossShare,
    platformGrossShare,
    payoutTransferFee: transferFee,
    sellerFinalPayable,
    currency,
    breakdownSummary,
  };
}

/**
 * Standard illustrative $19.00 USD sale breakdown for the FORGE agreement
 * Matches exact numbers submitted in commercial response:
 * - Customer product payment: $19.00
 * - PayPal fee (4.4% + $0.30): -$1.14
 * - Net proceeds: $17.86
 * - FORGE 70%: $12.50
 * - Producer Toy 30%: $5.36
 */
export function getIllustrative19DollarSaleExample(): ItemizedSettlementResult {
  return calculateItemizedSettlement({
    productPrice: 19.00,
    discountAmount: 0,
    collectedTax: 0,
    currency: 'USD',
    paymentGateway: 'paypal',
    actualProcessorFee: 1.14, // Exact PayPal India international commercial rate: $19.00 * 4.4% + $0.30 = $1.136 -> $1.14
    sellerSharePercent: 70,
    platformSharePercent: 30,
    payoutTransferFee: 0,
  });
}
