import { calculateItemizedSettlement, getIllustrative19DollarSaleExample } from './src/lib/accounting.ts';

console.log('--- TEST 1: Illustrative $19 FORGE Sale Example ---');
const example = getIllustrative19DollarSaleExample();
console.log('Customer Gross Paid:', example.customerGrossPaid);
console.log('Processor Fee (PayPal 4.4% + $0.30):', example.processorFee);
console.log('Eligible Net Proceeds:', example.eligibleNetProceeds);
console.log('FORGE 70% Share:', example.sellerGrossShare);
console.log('Producer Toy 30% Share:', example.platformGrossShare);
console.log('Seller Final Payable:', example.sellerFinalPayable);

if (example.customerGrossPaid !== 19.00) throw new Error('Failed: customerGrossPaid != 19');
if (example.processorFee !== 1.14) throw new Error('Failed: processorFee != 1.14');
if (example.eligibleNetProceeds !== 17.86) throw new Error('Failed: eligibleNetProceeds != 17.86');
if (example.sellerGrossShare !== 12.50) throw new Error('Failed: sellerGrossShare != 12.50');
if (example.platformGrossShare !== 5.36) throw new Error('Failed: platformGrossShare != 5.36');
if (example.sellerFinalPayable !== 12.50) throw new Error('Failed: sellerFinalPayable != 12.50');

console.log('✓ TEST 1 PASSED: Exact match with commercial terms ($12.50 / $5.36).\n');

console.log('--- TEST 2: Seller-Funded Discount ($29 - $10 discount = $19) ---');
const test2 = calculateItemizedSettlement({
  productPrice: 29.00,
  discountAmount: 10.00,
  discountFundedBy: 'seller',
  currency: 'USD',
  actualProcessorFee: 1.14,
});
console.log('Net Price After Discount:', test2.netPriceAfterDiscount);
console.log('Eligible Net Proceeds:', test2.eligibleNetProceeds);
console.log('Seller 70% Share:', test2.sellerGrossShare);
if (test2.netPriceAfterDiscount !== 19.00) throw new Error('Failed: netPriceAfterDiscount != 19');
if (test2.sellerGrossShare !== 12.50) throw new Error('Failed: sellerGrossShare != 12.50');
console.log('✓ TEST 2 PASSED: Seller-funded discount reduces commission base accurately.\n');

console.log('--- TEST 3: Refunded Transaction ---');
const test3 = calculateItemizedSettlement({
  productPrice: 19.00,
  currency: 'USD',
  actualProcessorFee: 1.14,
  isRefunded: true,
});
console.log('Refunded Eligible Net Proceeds:', test3.eligibleNetProceeds);
console.log('Seller Share:', test3.sellerGrossShare);
if (test3.eligibleNetProceeds !== 0) throw new Error('Failed: eligibleNetProceeds != 0 on full refund');
if (test3.sellerGrossShare !== 0) throw new Error('Failed: sellerGrossShare != 0 on full refund');
console.log('✓ TEST 3 PASSED: Refund correctly zeros out commission liability.\n');

console.log('--- ALL SETTLEMENT TESTS PASSED SUCCESSFULLY ---');
