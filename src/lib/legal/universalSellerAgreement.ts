export interface AgreementSection {
  id: string;
  number: string;
  title: string;
  subsections: {
    number: string;
    text: string;
  }[];
}

export interface ScheduleItem {
  term: string;
  standard: string;
  selection: string;
}

export interface RiskMatrixRow {
  scenario: string;
  responsibleParty: string;
  standard: string;
}

export const UNIVERSAL_AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    id: 'sec_1',
    number: '1',
    title: 'Parties, Definitions and Interpretation',
    subsections: [
      {
        number: '1.1',
        text: 'This proposed Brand & Seller Agreement (the "Agreement") is entered into between (a) Naiemoddin Nijamoddin Shaikh, an individual operating as a sole proprietor under the trade name Producer Toy, having its principal place of business at Producer Toy Studios, Sangamner, Maharashtra – 422605, India ("Producer Toy" or "Platform"); and (b) the Brand entity, publisher, or creator identified in the executed schedule or creator profile ("Seller", "Brand", or "Publisher"). Each a "Party" and collectively the "Parties".',
      },
      {
        number: '1.2',
        text: 'Producer Toy Details. Trade name: Producer Toy. Address: Producer Toy Studios, Sangamner, Maharashtra – 422605, India. Official legal notice email: legal@producetoy.com. Udyam Registration Number: UDYAM-MH-01-0264011.',
      },
      {
        number: '1.3',
        text: 'Master Terms & Scope. This Agreement serves as the standardized Master Marketplace Distribution Terms governing direct sales, delivery, customer library access, licensing, and settlements on Producer Toy.',
      },
      {
        number: '1.4',
        text: 'Effective Date. The Effective Date is established upon mutual execution of Schedule A, or verified digital acceptance within the Toy Creator dashboard. No product is authorized to go live on the public storefront until all pre-launch acceptance criteria in Schedule B are met.',
      },
    ],
  },
  {
    id: 'sec_2',
    number: '2',
    title: 'Purpose, Scope and Non-Exclusivity',
    subsections: [
      {
        number: '2.1',
        text: 'Direct Marketplace Sales. Producer Toy lists, markets, and sells the Seller\'s approved digital audio products through Producer Toy\'s native checkout and customer library. For covered orders, checkout and transaction fulfillment take place directly through Producer Toy without redirecting the customer to third-party marketplaces.',
      },
      {
        number: '2.2',
        text: 'Approved Products. The products governed by this Agreement are recorded in Schedule C. Product builds, versions, retail pricing, license delivery models, installer packages, and system compatibility statements must be verified before each listing goes live.',
      },
      {
        number: '2.3',
        text: 'Strict Non-Exclusivity. The relationship is strictly non-exclusive. Seller remains entirely free to distribute, market, and sell its products directly, through its own website, or through any other third-party distributors, retailers, or marketplaces. Neither Party is authorized to bind or commit the other Party.',
      },
      {
        number: '2.4',
        text: 'No Implied Guarantee of Commercial Outcomes. Producer Toy does not guarantee a minimum number of impressions, visitors, conversions, or sales. Seller does not guarantee marketplace performance or volume.',
      },
      {
        number: '2.5',
        text: 'No Sales Performance Recourse. Projections, forecasts, and promotional estimates are informational only and not warranties. Failure to achieve anticipated sales levels does not constitute a breach of this Agreement and creates no claim for lost profits or opportunity costs. Seller will not require Producer Toy to purchase unsold inventory or guarantee minimum royalties.',
      },
    ],
  },
  {
    id: 'sec_3',
    number: '3',
    title: 'Toy Creator Access and Seller-Managed Listings',
    subsections: [
      {
        number: '3.1',
        text: 'Self-Service Creator Portal. Approved Sellers receive authenticated access to the Toy Creator portal (https://creators.producetoy.com/) to add, configure, and manage product listings, manage license key pools, configure live keygen webhooks, view real-time sales analytics, and initiate payout disbursements.',
      },
      {
        number: '3.2',
        text: 'Seller Responsibility for Content. Seller is solely responsible for the accuracy, legality, and currency of its product descriptions, pricing, discounts, artwork, logos, audio preview stems, user manuals, compatibility claims, and license agreements. Seller warrants it holds all requisite intellectual property rights.',
      },
      {
        number: '3.3',
        text: 'Platform Moderation. Producer Toy reserves the right to review, decline, pause, or remove listings where reasonably necessary for customer safety, security, compliance, intellectual property protection, payment-processor regulations, or applicable law. Where practicable, Producer Toy will provide prior notice and reasonable opportunity to cure.',
      },
    ],
  },
  {
    id: 'sec_4',
    number: '4',
    title: 'Approved Products, Builds and Compatibility',
    subsections: [
      {
        number: '4.1',
        text: 'Specific Product Builds. Exact installer packages, version numbers, file sizes, SHA-256 checksums, CPU architectures (Apple Silicon arm64, Intel x86_64, Windows x64), supported OS versions, plugin formats (VST3, AU, AAX, Standalone), and code-signing / notarization details must be recorded in Schedule C and approved prior to launch.',
      },
      {
        number: '4.2',
        text: 'Seller Compatibility Warranty. Seller warrants that published system requirements and DAW host compatibility claims are thoroughly tested and accurate for each exact build supplied.',
      },
      {
        number: '4.3',
        text: 'Exclusion of Unvalidated Builds. Legacy, unnotarized, alpha, or unvalidated beta builds will not be distributed on the live storefront unless specifically approved and tested in writing.',
      },
      {
        number: '4.4',
        text: 'Pre-Launch Product Review. Before listing, Producer Toy conducts reasonable marketplace quality assurance in sandboxed test environments covering installation, activation/deactivation, DAW host stability, and advertised features. Review copy testing does not authorize reverse engineering, decompilation, or circumventing technical protection.',
      },
    ],
  },
  {
    id: 'sec_5',
    number: '5',
    title: 'Checkout, Payments, Orders and Delivery',
    subsections: [
      {
        number: '5.1',
        text: 'Server-Side Verified Checkout. Orders are processed through Producer Toy checkout using authorized payment gateways with server-side webhook verification. No order or delivery is initiated on client-side status alone.',
      },
      {
        number: '5.2',
        text: 'Library and Protected Delivery. Upon verified payment, the buyer receives permanent access in their Producer Toy user library and access to the approved, secure, time-expiring or token-gated download path.',
      },
      {
        number: '5.3',
        text: 'License Delivery Architecture. For products requiring serial numbers or activation, the Platform supports: (a) Method A: Pre-loaded CSV serial key pool with unique non-duplicate issuance; (b) Method B: Live Webhook API with cryptographically signed (HMAC-SHA256) server-to-server POST request and 3000ms SLA; (c) Method C: Direct royalty-free cloud zip delivery.',
      },
      {
        number: '5.4',
        text: 'Excluded Transactions. Revenue share is payable only on eligible amounts actually collected. Fraudulent, duplicate, test, chargeback, reversed, or refunded transactions do not generate payable revenue share.',
      },
    ],
  },
  {
    id: 'sec_6',
    number: '6',
    title: 'Product License, Platform Terms and Purchaser Rights',
    subsections: [
      {
        number: '6.1',
        text: 'Separate Scope of Terms. Producer Toy\'s Platform Terms govern general user account access, marketplace browsing, checkout, and platform library services. Seller\'s End-User License Agreement (EULA) exclusively governs software installation, activation, seats/machines allowed, reverse-engineering restrictions, and sound design usage rights.',
      },
      {
        number: '6.2',
        text: 'Pre-Purchase Disclosure. Seller must provide its authorized EULA text or URL prior to launch. Producer Toy displays the EULA link at checkout and records buyer acceptance where legally required.',
      },
      {
        number: '6.3',
        text: 'Protection of Existing Purchasers. Termination or expiration of this Agreement will not revoke or impair valid licenses acquired by customers prior to termination. Subject to applicable law, Seller will continue to honor valid licenses and activation servers, and Producer Toy will maintain library installer download access where technically and legally safe.',
      },
    ],
  },
  {
    id: 'sec_7',
    number: '7',
    title: 'Intellectual Property, Brand Use and Anti-Piracy',
    subsections: [
      {
        number: '7.1',
        text: 'Intellectual Property Ownership. Seller retains 100% exclusive ownership of its products, audio code, DSP algorithms, installers, samples, presets, documentation, trademarks, and trade names. Producer Toy retains 100% exclusive ownership of its marketplace platform, Toy Creator software, APIs, databases, trademarks, and proprietary systems. Neither Party transfers ownership to the other.',
      },
      {
        number: '7.2',
        text: 'Limited Distribution License. Seller grants Producer Toy a non-exclusive, worldwide license to host, display, market, and deliver approved product installers, artwork, audio demos, descriptions, and logos solely for listing, processing sales, and fulfilling customer orders.',
      },
      {
        number: '7.3',
        text: 'Reasonable Anti-Piracy Safeguards (No Absolute Guarantee). Producer Toy applies risk-proportionate access controls, rate limiting, and signed download links to protect internal servers. However, digital distribution cannot guarantee absolute prevention of client-side key-sharing, reverse engineering, or external re-uploading. Producer Toy does not provide piracy insurance or warrant zero illicit copies.',
      },
      {
        number: '7.4',
        text: 'External Piracy Enforcement. For unauthorized files hosted on third-party cyberlockers, torrents, or external websites, Seller retains primary responsibility for issuing DMCA / copyright takedown notices. Upon credible report, Producer Toy will assist by preserving transaction logs and restricting compromised platform accounts.',
      },
    ],
  },
  {
    id: 'sec_8',
    number: '8',
    title: 'Revenue Share, Deductions and Statements',
    subsections: [
      {
        number: '8.1',
        text: 'Standard Revenue Split. The standard revenue share is 70% to Seller and 30% to Producer Toy, calculated on Eligible Net Proceeds.',
      },
      {
        number: '8.2',
        text: 'Eligible Net Proceeds Defined. Eligible Net Proceeds = Gross Order Receipts minus (Discounts + Transaction Taxes + Actual Payment Processing Fees + Refunds/Chargebacks + FX Conversion Costs). No undisclosed platform markups or hidden fees may be deducted.',
      },
      {
        number: '8.3',
        text: 'Transparent Itemized Statements. Monthly statements in Toy Creator provide transparent breakdowns by order ID, currency, processing fee, and net split. Currencies (e.g., USD and INR) are kept strictly separate and never summed without clear FX conversion records.',
      },
      {
        number: '8.4',
        text: 'Illustrative $19.00 Standard Product: Customer purchase price $19.00; hypothetical gateway processing fee -$1.14; Eligible Net Proceeds $17.86; Seller 70% share $12.50; Producer Toy 30% share $5.36. Actual gateway receipts govern.',
      },
    ],
  },
  {
    id: 'sec_9',
    number: '9',
    title: 'Monthly Settlements and Payout Method',
    subsections: [
      {
        number: '9.1',
        text: 'Monthly Settlement Cadence. Settlements are calculated on calendar-month cycles. Statements and disbursements are issued by the 15th calendar day of the following month (e.g., January sales settled by February 15).',
      },
      {
        number: '9.2',
        text: 'Zero Minimum Payout Threshold. No artificial or unpublished minimum payout balance is required. Undisputed balances are disbursed on schedule regardless of volume.',
      },
      {
        number: '9.3',
        text: 'Payout Rails. Disbursements are processed via international bank wire (SWIFT/ACH), PayPal, or approved cross-border payment rails confirmed in Seller\'s brand profile.',
      },
    ],
  },
  {
    id: 'sec_10',
    number: '10',
    title: 'Refunds, Chargebacks, Taxes and Invoicing',
    subsections: [
      {
        number: '10.1',
        text: 'Cause-Based Refund Allocation. If a refund or chargeback arises directly from a verified product defect, broken installer, invalid/exhausted license keys, false listing claims, or Seller breach, the cost is allocated to Seller. If a refund arises directly from checkout billing errors or platform download server failures, the cost is borne by Producer Toy.',
      },
      {
        number: '10.2',
        text: 'Taxes and Invoicing. Each Party is responsible for its own income tax liabilities. Transaction taxes (GST, VAT, Sales Tax) are collected and remitted according to the legal merchant structure established in Schedule A.',
      },
      {
        number: '10.3',
        text: 'No Indefinite Reserves. Neither Party will withhold undisputed funds or impose arbitrary financial reserves. Temporary holds are restricted to active, documented fraud investigations or pending chargeback disputes.',
      },
    ],
  },
  {
    id: 'sec_11',
    number: '11',
    title: 'Customer Support and Cooperation',
    subsections: [
      {
        number: '11.1',
        text: 'Division of Responsibility. Producer Toy handles marketplace customer accounts, checkout errors, billing inquiries, and library download infrastructure. Seller handles audio DSP defects, DAW compatibility, software installation, license authorization, and preset troubleshooting.',
      },
      {
        number: '11.2',
        text: 'Escalation SLA. Product defects or DSP inquiries escalated by Producer Toy to Seller must receive an operational response within two (2) business days.',
      },
    ],
  },
  {
    id: 'sec_12',
    number: '12',
    title: 'Privacy, Customer Data and Security',
    subsections: [
      {
        number: '12.1',
        text: 'Purpose Limitation & Data Minimization. Customer data may be processed strictly for legitimate order fulfillment, license delivery, customer support, and accounting. Seller receives order reference IDs, purchased product SKUs, country, and activation status. Buyer email addresses are masked by default.',
      },
      {
        number: '12.2',
        text: 'Affirmative Consent for Email Sharing. Direct customer email addresses are transmitted to Seller or Seller\'s webhook endpoint only when affirmative buyer consent is obtained at checkout specifically for online activation or software update notices, in compliance with GDPR, CCPA, and Indian DPDP Act 2023.',
      },
      {
        number: '12.3',
        text: '48-Hour Incident Notification. In the event of a confirmed security incident affecting shared customer data, license keys, or product binaries, the affected Party must notify the other within 48 hours and cooperate on investigation and regulatory compliance.',
      },
    ],
  },
  {
    id: 'sec_13',
    number: '13',
    title: 'Representations, Warranties and Compliance',
    subsections: [
      {
        number: '13.1',
        text: 'Mutual Authority. Each Party represents that it is duly organized, validly existing, and possesses full legal authority to execute and perform this Agreement.',
      },
      {
        number: '13.2',
        text: 'Seller Assurances. Seller warrants that distributed software does not contain malware, trojans, spyware, keyloggers, or unauthorized data exfiltration routines, and that all serial keys are genuine, unique, and authorized.',
      },
    ],
  },
  {
    id: 'sec_14',
    number: '14',
    title: 'Indemnity and Limitation of Liability',
    subsections: [
      {
        number: '14.1',
        text: 'Mutual Indemnification. Seller indemnifies Producer Toy against third-party claims arising from intellectual property infringement, malware, defective operation, or Seller breach. Producer Toy indemnifies Seller against third-party claims arising from platform software infringement or material platform breach.',
      },
      {
        number: '14.2',
        text: 'Standard Liability Cap. Each Party\'s total aggregate liability for ordinary direct contractual claims in any rolling 12-month period is capped at the greater of: (a) US$10,000, or (b) the total net amounts paid or payable under this Agreement during the preceding 12 months.',
      },
      {
        number: '14.3',
        text: 'Enhanced Liability Cap for High-Risk Claims. For claims arising from third-party intellectual property indemnity, material data privacy/security breaches, or malicious code, the aggregate liability cap is the greater of: (a) US$25,000, or (b) two times (2x) the amounts paid or payable during the preceding 12 months.',
      },
      {
        number: '14.4',
        text: 'Exclusion of Consequential Damages. Neither Party is liable for indirect, incidental, special, punitive, or consequential damages, nor for loss of anticipated profits or speculative lost sales resulting from low demand or external piracy.',
      },
    ],
  },
  {
    id: 'sec_15',
    number: '15',
    title: 'Term, Suspension and Termination',
    subsections: [
      {
        number: '15.1',
        text: 'Term & Convenience Termination. This Agreement continues on an ongoing basis. Either Party may terminate without cause upon thirty (30) days\' written notice.',
      },
      {
        number: '15.2',
        text: 'Termination for Cause. Either Party may terminate immediately if the other Party materially breaches this Agreement and fails to cure within fifteen (15) days of written notice.',
      },
      {
        number: '15.3',
        text: 'Immediate Safety Suspension. Producer Toy may immediately suspend a product listing or download path if credible evidence of malware, compromised keys, severe safety risks, or regulatory demands arises.',
      },
    ],
  },
  {
    id: 'sec_16',
    number: '16',
    title: 'Planned Corporate Formation and Assignment',
    subsections: [
      {
        number: '16.1',
        text: 'Producer Toy currently operates as a sole proprietorship registered under Indian Udyam regulations. The proprietor reserves the right to incorporate a Private Limited Company to succeed the proprietorship. Upon incorporation, Producer Toy may assign or novate this Agreement to the new corporate entity upon written notice to Seller without interruption of services or accounts.',
      },
    ],
  },
  {
    id: 'sec_17',
    number: '17',
    title: 'Governing Law and Dispute Resolution',
    subsections: [
      {
        number: '17.1',
        text: 'Governing Law. This Agreement is governed by and construed in accordance with the laws of India, without regard to conflict of law principles.',
      },
      {
        number: '17.2',
        text: 'Dispute Escalation & Arbitration. The Parties will first seek good-faith negotiations for thirty (30) days. If unresolved, the dispute will be referred to binding arbitration before a sole arbitrator in Pune, Maharashtra, India, conducted in English under the Indian Arbitration and Conciliation Act, 1996. Alternatively, international Parties may mutually agree in Schedule A to a neutral forum (e.g., SIAC or ICC).',
      },
    ],
  },
  {
    id: 'sec_18',
    number: '18',
    title: 'General Provisions',
    subsections: [
      {
        number: '18.1',
        text: 'Entire Agreement. This Agreement together with Schedules A through F constitutes the entire agreement between the Parties and supersedes all prior negotiations or draft proposals.',
      },
      {
        number: '18.2',
        text: 'Electronic Signature. Execution via digital signature or authenticated acceptance within the Toy Creator dashboard is valid, binding, and enforceable.',
      },
    ],
  },
];

export const UNIVERSAL_SCHEDULE_A: ScheduleItem[] = [
  {
    term: 'Marketplace Model',
    standard: 'Direct Producer Toy Native Checkout & Library Delivery',
    selection: 'Direct Checkout (No External Redirects)',
  },
  {
    term: 'Creator Portal',
    standard: 'https://creators.producetoy.com/',
    selection: 'Self-Service Access Granted',
  },
  {
    term: 'Revenue Split',
    standard: '70% Seller / 30% Producer Toy on Eligible Net Proceeds',
    selection: '70% / 30%',
  },
  {
    term: 'Settlement Cadence',
    standard: 'Monthly by the 15th calendar day of the following month',
    selection: 'Monthly (by 15th)',
  },
  {
    term: 'Minimum Payout',
    standard: 'US$0.00 (Zero minimum threshold)',
    selection: 'No Minimum Threshold',
  },
  {
    term: 'Disbursement Rail',
    standard: 'International Bank Wire (SWIFT/ACH), PayPal, or Direct Local Transfer',
    selection: 'As configured in Brand Profile',
  },
  {
    term: 'Customer Support',
    standard: 'Tier 1 (Billing/Account): Producer Toy | Tier 2 (DSP/Audio/Keygen): Seller',
    selection: 'Confirmed',
  },
  {
    term: 'Launch Promotion',
    standard: 'Official Producer Toy Marketplace Feature & Social Spotlight',
    selection: 'Standard Launch Package',
  },
];

export const UNIVERSAL_RISK_MATRIX: RiskMatrixRow[] = [
  {
    scenario: 'Marketplace Sales Volume',
    responsibleParty: 'No Warranty',
    standard: 'Neither Party warrants traffic, ranking, or sales volume. Low sales is not a breach.',
  },
  {
    scenario: 'External Internet Piracy',
    responsibleParty: 'Seller (Primary) / Platform (Assistance)',
    standard: 'Producer Toy protects internal servers. External takedowns/DMCA handled by Seller.',
  },
  {
    scenario: 'Internal Server Breach',
    responsibleParty: 'Producer Toy',
    standard: 'Subject to direct liability caps ($10k general / $25k data breach).',
  },
  {
    scenario: 'Product DSP Bug / DAW Crash',
    responsibleParty: 'Seller',
    standard: 'Seller investigates and issues updates. Repeated failure allows listing pause.',
  },
  {
    scenario: 'Invalid License Key Issued',
    responsibleParty: 'Seller',
    standard: 'Seller must restock valid keys or fix keygen webhook immediately.',
  },
  {
    scenario: 'Checkout Gateway Outage',
    responsibleParty: 'Producer Toy',
    standard: 'Platform mitigates with gateway providers; neither Party liable for 3rd-party cloud outages.',
  },
  {
    scenario: 'Refunds Due to Product Defects',
    responsibleParty: 'Seller',
    standard: 'Allocated to Seller statement.',
  },
  {
    scenario: 'Refunds Due to Platform Errors',
    responsibleParty: 'Producer Toy',
    standard: 'Allocated to Producer Toy.',
  },
  {
    scenario: 'Data Privacy Incident',
    responsibleParty: 'Breaching Party',
    standard: '48-hour notification SLA; mutual mitigation and legal compliance.',
  },
];
