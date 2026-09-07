# ETHIO-BRIDGE
## Software Design Document — SDD
### AI-Powered Ethiopia–China Commercial & Business Platform

**Version:** 1.0  
**Status:** Implementation Specification  
**Primary Markets:** Ethiopia ↔ China  
**Languages:** English, Amharic, Afaan Oromo, Simplified Chinese  
**Architecture:** Multi-tenant, modular, AI-enabled, mobile-first  
**Primary Business Model:** B2B marketplace + SaaS + AI pay-per-use + business services  

---

## 1. EXECUTIVE SUMMARY

ETHIO-BRIDGE is a multilingual AI-powered commercial platform designed to connect Ethiopian and Chinese businesses.

The platform enables businesses to:
- Register their organizations
- Create company profiles
- Publish products and services
- Discover buyers and suppliers
- Search across languages
- Communicate in different languages
- Automatically translate business communication
- Create and respond to RFQs
- Manage leads and business relationships
- Generate AI-powered business content
- Use AI document services
- Monitor business risks
- Perform internal audit activities
- Manage selected business operations
- Purchase AI and platform services
- Pay subscriptions
- Pay based on service usage
- Connect with appropriate payment, logistics and financial-service providers

The platform owner earns revenue through:
- Business subscriptions
- AI pay-per-use
- B2B transaction/service fees
- Featured listings
- Advertising/promotional services
- Premium verification services
- Market intelligence
- Enterprise services
- API/service usage
- Partner/referral services where legally and commercially permitted

---

## 2. CORE VISION

ETHIO-BRIDGE should become:
**The digital commercial bridge between Ethiopia and China.**

The complete commercial journey is:
```
DISCOVER
   ↓
CONNECT
   ↓
TRANSLATE
   ↓
COMMUNICATE
   ↓
REQUEST
   ↓
QUOTE
   ↓
NEGOTIATE
   ↓
ORDER
   ↓
PAYMENT PARTNER
   ↓
LOGISTICS
   ↓
DELIVERY
   ↓
BUSINESS MANAGEMENT
   ↓
ANALYTICS
   ↓
GROW
```

---

## 3. PRODUCT PRINCIPLES

The implementation must follow these principles:

### 3.1 Multi-tenant
Each company is an isolated tenant.

### 3.2 Modular
Companies activate only the functionality they need.

### 3.3 Multilingual
English, Amharic, Afaan Oromo and Chinese are first-class languages.

### 3.4 AI-assisted
AI assists users but does not replace authorization, accounting controls, auditors, administrators, or regulated financial institutions.

### 3.5 Commercial
The platform must have a complete monetization architecture.

### 3.6 Secure
Private company data must never leak between organizations.

### 3.7 Mobile-first
The primary user experience must work exceptionally well on mobile.

### 3.8 API-first
Business logic belongs in backend APIs, not only frontend code.

---

## 4. SYSTEM ACTORS

The system contains several distinct actor types:
- Platform Owner
- Platform Super Admin
- Platform Finance Admin
- Platform Support Admin
- Platform Moderator
- Company Owner
- Company Administrator
- Company Manager
- Employee
- Buyer
- Seller
- Supplier
- Internal Auditor
- External Auditor
- Service Provider
- Logistics Partner
- Financial/Payment Partner
- API Client
- Public Visitor

---

## 5. PLATFORM OWNER

The platform owner owns ETHIO-BRIDGE.
The owner needs a separate administrative environment:
- Platform Overview
- Organizations
- Users
- Business Hub
- Transactions
- Subscriptions
- AI Usage
- Revenue
- Wallets
- Payments
- Commissions
- Feature Catalog
- Plans
- Verification
- Audit
- Risk
- Moderation
- Partners
- API
- Reports
- System Settings

---

## 6. PLATFORM OWNER REVENUE DASHBOARD

The owner must see:
- Gross Revenue
- Net Revenue
- Subscription Revenue
- AI Revenue
- Transaction Revenue
- Promotion Revenue
- Verification Revenue
- Enterprise Revenue
- API Revenue
- Partner Revenue
- Refunds
- Platform Costs
- AI Costs
- Payment Costs
- Profit Estimate

**Charts:**
- Daily revenue
- Weekly revenue
- Monthly revenue
- Revenue by country
- Revenue by service
- Revenue by company
- Revenue by plan
- Revenue by AI feature

---

## 7. COMPANY TENANT

Each registered business creates a tenant.

Example:
```
ETHIO-BRIDGE
│
├── Ethiopian Company A
│   ├── Addis Branch
│   ├── Adama Branch
│   └── Sales Department
│
├── Ethiopian Company B
│
└── Chinese Company C
    ├── Shenzhen Office
    └── Guangzhou Office
```

Every private resource must be associated with:
`organization_id`

Where applicable:
`branch_id`, `department_id`, `created_by`, `updated_by`

---

## 8. STRICT TENANT ISOLATION

Backend authorization must verify:
```
current_user.organization_id == resource.organization_id
```

A user from Company A must never access Company B's private information.
This must be enforced at the backend/database/service level.
Frontend hiding is **NOT** sufficient.

---

## 9. THREE LEVELS OF INFORMATION

Every company object must have an appropriate visibility model:

- **PRIVATE:** Only authorized company users (e.g. Payroll, Internal expenses, Financial records, Internal audit, Internal documents).
- **BUSINESS:** Visible to authenticated/authorized business users according to policy.
- **PUBLIC:** Visible in the Business Hub (e.g. Public company profile, Published products, Published services, Public RFQs, Public business posts).

---

## 10. REGISTRATION

Registration supports:
- Email
- Phone
- Password
- OTP

Company creation workflow:
```
Create Account
     ↓
Verify Contact
     ↓
Create Organization
     ↓
Company Information
     ↓
Owner Profile
     ↓
Select Country
     ↓
Select Language
     ↓
Select Business Type
     ↓
Select Required Features
     ↓
Dashboard
```

---

## 11. ORGANIZATION TYPES

Supported business structures:
- PLC
- Private Company
- Sole Proprietorship
- Partnership
- Cooperative
- NGO
- SME
- Manufacturer
- Trader
- Importer
- Exporter
- Service Provider
- Other

---

## 12. COMPANY PROFILE

Fields:
- **Identity:** Legal name, Trading name, Registration number, TIN, Business type, Industry, Year established
- **Location:** Country, Region/province, City, Address, Business locations
- **Contact:** Phone, Email, Website, Social/business links
- **Business:** Description, Products, Services, Export capability, Import capability, Target markets
- **Verification:** UNVERIFIED, BASIC_VERIFIED, BUSINESS_VERIFIED, PREMIUM_VERIFIED, SUSPENDED

*Verification badges must not falsely imply government certification.*

---

## 13. BRANCH MANAGEMENT

Company owner can create branches (e.g., Addis Ababa Branch, Adama Branch, Shenzhen Branch, Guangzhou Branch).
Each branch can have:
- Users
- Inventory
- Sales
- Expenses
- Customers
- Suppliers
- Reports

*Access must be permission controlled.*

---

## 14. DEPARTMENT MANAGEMENT

Examples: Management, Finance, Sales, Procurement, Inventory, HR, Marketing, IT, Audit, Export, Import.

---

## 15. USER MANAGEMENT

Company owner can:
- Invite users
- Disable users
- Reset access
- Assign roles
- Assign branches
- Assign departments
- Assign permissions

---

## 16. RBAC

Permissions must be granular. Examples:
- `company.view`, `company.edit`
- `users.view`, `users.create`, `users.edit`, `users.disable`
- `products.view`, `products.create`, `products.edit`, `products.delete`, `products.publish`
- `rfq.view`, `rfq.create`, `rfq.respond`, `rfq.manage`
- `finance.view`, `finance.create`, `finance.approve`
- `audit.view`, `audit.create`, `audit.finding.create`, `audit.finding.close`

Roles are collections of permissions.

---

## 17. OWNER ROLE

Company Owner can:
- Manage organization
- Manage users & roles
- Activate features
- Manage billing
- Manage public profile
- Publish products
- Manage business connections
- View company analytics
- Assign auditors
- Configure business settings

*Owner must not automatically see another organization's data.*

---

## 18. DYNAMIC FEATURE ACTIVATION

Mandatory requirement:
- **ACTIVE FEATURES:** Shown in navigation (e.g., Business Profile, Products, Business Hub, Messaging, Translation).
- **AVAILABLE FEATURES:** In feature store (e.g., CRM, Inventory, Accounting, AI Audit, Market Intelligence, Advanced Analytics).

*Only activated features appear in navigation; the backend must independently verify feature entitlement.*

---

## 19. FEATURE ENTITLEMENT

Database entities: `features`, `plans`, `organization_features`, `feature_usage`, `feature_limits`, `feature_requests`.

`organization_features` tracks:
- `organization_id`
- `feature_id`
- `status`
- `activation_date`
- `expiration_date`
- `usage_limit`
- `usage_count`
- `billing_type` (FREE, SUBSCRIPTION, PAY_PER_USE, ENTERPRISE)

---

## 20. FEATURE CATALOG

- **Core:** Company Profile, Users, Branches, Departments, Notifications
- **B2B:** Business Hub, Products, Services, Buyers, Suppliers, RFQ, Messaging, Connections
- **CRM:** Leads, Contacts, Deals, Activities, Follow-ups
- **Operations:** Sales, Inventory, Procurement, Expenses, Assets
- **Finance:** Accounting, Cash Management, Receivables, Payables, Reports
- **AI:** AI Assistant, Translation, Product AI, Marketing AI, Document AI, Market Intelligence, Matching AI, Audit AI
- **Audit:** Risk, Internal Controls, Audit Engagements, Audit Tests, Evidence, Findings, Follow-up, Reports

---

## 21. FOUR-LANGUAGE ARCHITECTURE

Supported languages:
- English (`en`)
- Amharic (`am`)
- Afaan Oromo (`om`)
- Simplified Chinese (`zh`)

Every user has `preferred_language`.

---

## 22. UI INTERNATIONALIZATION

Never hardcode UI text. Use translation keys (e.g. `dashboard.title`, `product.create`, `product.price`, `message.send`, `rfq.create`).
Translation resources: `en.json`, `am.json`, `om.json`, `zh.json`.

---

## 23. BUSINESS CONTENT TRANSLATION

Business content requires stored multilingual versions alongside the original:
```
Product
│
├── Original Chinese
├── English translation
├── Amharic translation
└── Afaan Oromo translation
```
*Never destroy the original content.*

---

## 24. AI TRANSLATION ENGINE

Architecture:
```
User Content
      ↓
Language Detection
      ↓
Translation Service (Provider A / Provider B / Fallback)
      ↓
Quality Check
      ↓
Store Translation
      ↓
Review
      ↓
Publish
```

---

## 25. TRANSLATION METADATA

Store:
- `original_text`
- `original_language`
- `translated_text`
- `target_language`
- `provider`
- `model`
- `timestamp`
- `translation_status` (AI_GENERATED, REVIEW_REQUIRED, APPROVED, PUBLISHED)
- `reviewed_by`

---

## 26. CROSS-LANGUAGE SEARCH

Core feature enabling cross-lingual discovery:
```
Query (e.g., 太阳能水泵)
 ↓
Language Detection
 ↓
Normalization
 ↓
Translation (Solar Water Pump / የፀሐይ ውሃ ፓምፕ / Pampii bishaanii humna aduu)
 ↓
Keyword Search + Semantic Search
 ↓
Ranked Results
```

---

## 27. BUSINESS HUB

Main sections:
- Discover
- Companies
- Products
- Services
- Buyers
- Suppliers
- RFQs
- Connections
- Messages
- My Listings

---

## 28. COMPANY DISCOVERY

Search by: Company name, Country, City, Industry, Product, Service, Manufacturer, Supplier, Buyer, Importer, Exporter, Verification level.

---

## 29. PRODUCT SYSTEM

Fields: Product ID, Seller, Category, Name, Description, Images, Video, Specifications, Price, Currency, MOQ, Available quantity, Unit, Production capacity, Country of origin, Shipping options, Payment terms, Warranty.

---

## 30. MULTILINGUAL PRODUCT

Seller creates product in any supported language. ETHIO-BRIDGE generates translations (Solar Water Pump / የፀሐይ ውሃ ፓምፕ / Pampii bishaanii humna aduu). Seller can edit before publication.

---

## 31. PRODUCT VISIBILITY

Lifecycle states: DRAFT, PRIVATE, BUSINESS_ONLY, PUBLIC, SUSPENDED, ARCHIVED.

---

## 32. PRODUCT AI

Input: Image, Existing description, PDF catalogue, Product specification.  
AI generates: Product title, Description, Specifications, Keywords, Category, SEO text, Marketing content, Translations.  
*User must approve generated content before publication.*

---

## 33. BUSINESS POSTS

Types: PRODUCT, SERVICE, BUY_REQUEST, SELL_REQUEST, ANNOUNCEMENT, BUSINESS_OPPORTUNITY, NEWS (with multilingual support).

---

## 34. BUYER SYSTEM

Capabilities: Search products, Save products, Follow companies, Contact sellers, Create RFQs, Compare suppliers, Request quotation, Manage leads.

---

## 35. SUPPLIER SYSTEM

Capabilities: Create company profile, Publish products, Receive RFQs, Send quotations, Chat, Manage leads, Track opportunities.

---

## 36. RFQ SYSTEM

Workflow:
```
DRAFT → PUBLISHED → SUPPLIER RESPONSE → QUOTATION → NEGOTIATION → ACCEPTED → ORDER
```
Buyer specifies: Product, Quantity, Specifications, Required delivery date, Destination, Budget, Payment preference, Additional requirements.

---

## 37. QUOTATION SYSTEM

Supplier submits: Unit price, Quantity, Total, Currency, MOQ, Delivery time, Shipping cost, Payment terms, Validity, Warranty, Notes.  
Buyer actions: Accept, Reject, Request revision, Negotiate.

---

## 38. BUSINESS CONNECTIONS

Actions: Connect, Follow, Contact, Request quotation, Request partnership.  
Status: PENDING, ACCEPTED, REJECTED, BLOCKED.

---

## 39. MULTILINGUAL CHAT

Stores: `sender`, `receiver`, `original_language`, `original_text`, `translation`, `target_language`, `timestamp`.  
User can switch between "View Original" and "View Translation".

---

## 40. AI COMMUNICATION ASSISTANT

Workflow: `Write → Improve with AI (Professional / Polite / Concise) → Translate → Preview → Send`.  
Features: Explain supplier responses, generate negotiation counter-offers.

---

## 41. CRM

Entities: Leads, Contacts, Companies, Deals, Activities, Tasks, Notes, Follow-ups.  
Pipeline stages: NEW → CONTACTED → QUALIFIED → NEGOTIATING → QUOTATION → CONTRACT → WON / LOST.

---

## 42. AI SUPPLIER/BUSINESS MATCHING

Matching criteria: Product, Category, Industry, Country, MOQ, Capacity, Public profile, Export/import capability, Verification, RFQ requirements.  
Output: Ranked match score (e.g. 95%, 88%) with explicit reasons for the recommendation.

---

## 43. MARKET INTELLIGENCE

Premium feature combining authorized public/business data and user-provided inputs to report market trends, supplier intelligence, buyer demand, and competitor analysis. AI results must clearly distinguish: FACT, ESTIMATE, RECOMMENDATION.

---

## 44. BUSINESS MANAGEMENT MODULE

Optional private company modules: Sales, Customers, Suppliers, Inventory, Purchasing, Expenses, Assets, Finance (remain private unless explicitly published).

---

## 45. SALES

Supports: Quotation, Sales Order, Invoice, Payment status, Customer, Items, Discount, Tax, Total.

---

## 46. INVENTORY

Supports: Products, Warehouses, Stock, Stock movements, Purchases, Sales, Adjustments, Transfers, Low-stock alerts.

---

## 47. FINANCE

Supports: Accounts, Income, Expenses, Receivables, Payables, Cash, Bank accounts, Reports (strictly isolated and private).

---

## 48. AUDIT MODULE

Dedicated subsystem supporting: Audit Planning, Risk Assessment, Internal Controls, Audit Tests, Sampling, Evidence, Working Papers, Findings, Management Responses, Follow-up, Audit Reports.

---

## 49. AUDITOR ROLES

- **Internal Auditor:** Authorized company audit information access.
- **External Auditor:** Controlled temporary access.
- **Audit Manager:** Manages engagements and assigns auditors.
*Auditors must not modify source financial transactions merely because they can audit them.*

---

## 50. AUDIT ENGAGEMENT

Fields: `engagement_id`, `organization_id`, `title`, `scope`, `objective`, `start_date`, `end_date`, `audit_type`, `assigned_team`, `status`.  
Types: FINANCIAL, OPERATIONAL, COMPLIANCE, IT, INVENTORY, PROCUREMENT, SPECIAL.

---

## 51. AUDIT WORKFLOW

```
Create Engagement → Define Scope → Risk Assessment → Audit Plan → Audit Tests → Sampling → Evidence → Findings → Management Response → Auditor Verification → Final Report → Follow-up
```

---

## 52. AUDIT FINDINGS

Fields: Title, Description, Criteria, Condition, Cause, Effect, Risk, Financial Impact, Evidence, Recommendation, Responsible Person, Due Date, Status.  
Status: OPEN, MANAGEMENT_RESPONSE, IN_PROGRESS, RESOLUTION_CLAIMED, VERIFICATION, CLOSED, REOPENED.

---

## 53. INTERNAL CONTROL SYSTEM

Controls: Control ID, Control Name, Objective, Owner, Frequency, Evidence Required, Risk Addressed, Status.  
Test results: PASS, FAIL, PARTIAL, NOT_TESTED.

---

## 54. AI AUDITOR

AI analysis tasks: Identify duplicate invoices, unusual payments, after-hours transactions, supplier price anomalies, inventory discrepancies, segregation-of-duty conflicts; summarize evidence, draft findings.

---

## 55. AI AUDIT SAFETY

*AI must never output: "This employee committed fraud."*  
Output formulation: *"Potential fraud indicator detected. Auditor review is required."*  
Human auditor retains sole professional responsibility.

---

## 56. RISK ENGINE

Deterministic rules + analytics scoring:
- Missing document: +25
- Unusual transaction: +20
- Manual override: +15
- New supplier: +15
- After-hours transaction: +10
- Duplicate indicator: +25

Risk Bands:
- 0–29: LOW
- 30–59: MEDIUM
- 60–79: HIGH
- 80–100: CRITICAL

---

## 57. SEGREGATION OF DUTIES

Detects conflicting permissions:
- Create supplier + Approve supplier payment
- Create transaction + Approve transaction
- Create transaction + Audit same transaction

*Triggers risk alert immediately.*

---

## 58. IMMUTABLE AUDIT LOG

Tracks sensitive events: `user_id`, `organization_id`, `action`, `entity`, `entity_id`, `timestamp`, `ip`, `device`, `old_value`, `new_value`, `reason`, `request_id`.

---

## 59. COMMERCIAL MONETIZATION

Dedicated monetization architecture across:
- Subscriptions
- AI Usage
- Transaction Services
- Featured Listings
- Advertising
- Verification
- Market Intelligence
- Enterprise Services
- API
- Partner Services

---

## 60. SUBSCRIPTION PLANS

Tiers: FREE, BUSINESS, PROFESSIONAL, ENTERPRISE.  
*All prices and plan limits must be configurable by platform administrators; never hardcode prices in application code.*

---

## 61. PAY-PER-USE

Configurable billing units (character, word, page, document, request, token, minute, match, generation) for:
- AI translation
- AI document processing
- AI product generation
- AI marketing
- AI audit
- Supplier matching
- Market intelligence

---

## 62. WALLET

Organization wallet: `wallet_id`, `organization_id`, `currency`, `balance`, `status`.  
Transactions: CREDIT, DEBIT, RESERVATION, RELEASE, REFUND, REVERSAL.

---

## 63. USAGE BILLING

Flow:
```
User requests AI service → Authentication & Authorization → Feature entitlement check → Usage limit check → Wallet/billing check → Reserve amount → AI service executes
  ├── Success → Finalize charge & record usage
  └── Failure → Release reservation & record failure
```

---

## 64. PLATFORM COMMISSION

Commission flow:
```
Transaction Value → Platform Fee → Partner/payment costs → Seller/buyer settlement
```
Configurable rules: `transaction_type`, `percentage`, `fixed_fee`, `minimum_fee`, `maximum_fee`, `currency`, `effective_date`.

---

## 65. PAYMENT ARCHITECTURE

Payment Integration Layer connecting to licensed external payment partners (e.g. EthSwitch ecosystem / licensed payment instrument issuers). ETHIO-BRIDGE does not hold customer funds or operate as an unlicensed bank/settlement service.

---

## 66. ORDER MANAGEMENT

Order structure: Buyer, Seller, Products, Quantity, Price, Currency, Status, Payment, Shipping, Documents.  
Statuses: DRAFT, PENDING, CONFIRMED, PAYMENT_PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, COMPLETED, CANCELLED, DISPUTED.

---

## 67. LOGISTICS INTEGRATION

Integrates Freight Forwarders, Customs Brokers, Warehouses, Transport, and Inspection providers via tracking and shipping requests.

---

## 68. DOCUMENT MANAGEMENT

Manages Quotations, Invoices, Purchase Orders, Contracts, Certificates, Catalogues, Shipping Documents, and Audit Evidence with versioning and visibility controls.

---

## 69. AI DOCUMENT PROCESSING

Upload document → Extract text, detect language, translate, summarize, extract key fields, classify, compare documents, detect anomalies. Reviewable before acceptance.

---

## 70. NOTIFICATION SYSTEM

Channels: In-app, Email, SMS, Push.  
Events: New RFQ, Quotation, Message, Connection, Feature activation, Billing, Wallet alerts, Audit finding, Verification, Order update.

---

## 71. SEARCH ENGINE

Keyword search + Category/Country/Industry filters + Cross-language search + Semantic vector search. Ranked by relevance, verification badge, completeness, and match quality.

---

## 72. REVIEWS

Transaction & interaction reviews with rating, comments, verified buyer badge, and anti-abuse / spam moderation.

---

## 73. MODERATION

Admin/moderator tools to review, approve, suspend, or restore companies, products, posts, and reports with full audit logging.

---

## 74. BUSINESS VERIFICATION

Workflow: Information submission → Document verification → Decision → Badge assignment (UNVERIFIED, BASIC_VERIFIED, BUSINESS_VERIFIED, PREMIUM_VERIFIED). Never imply government certification without explicit legal standing.

---

## 75. AI PROVIDER ARCHITECTURE

Decoupled `AIProvider` interface supporting TranslationProvider, LLMProvider, DocumentAIProvider, and EmbeddingProvider with seamless multi-model fallback.

---

## 76. AI REQUEST RECORD

Tracks every AI interaction: `request_id`, `organization_id`, `user_id`, `service`, `provider`, `model`, `input_units`, `output_units`, `cost`, `status` (PENDING, PROCESSING, SUCCESS, FAILED, CANCELLED), `timestamp`.

---

## 77. AI COST CONTROL

Configurable company monthly & daily caps, feature-specific limits, and wallet threshold notifications.

---

## 78. AI DATA PRIVACY

Strict data isolation: only the minimum necessary authorized tenant data is sent to AI models after permission checks.

---

## 79. API ARCHITECTURE

All business logic exposed under `/api/v1/` with standardized responses.

---

## 80. BUSINESS HUB APIs

- `GET /businesses`, `GET /businesses/search`, `GET /businesses/:id`
- `POST /products`, `GET /products`, `GET /products/:id`, `PUT /products/:id`, `DELETE /products/:id`, `POST /products/:id/publish`
- `POST /posts`, `GET /posts`
- `POST /connections`, `GET /connections`

---

## 81. RFQ APIs

- `POST /rfqs`, `GET /rfqs`, `GET /rfqs/:id`, `PUT /rfqs/:id`
- `POST /rfqs/:id/respond`, `POST /rfqs/:id/accept`, `POST /rfqs/:id/reject`

---

## 82. MESSAGING APIs

- `POST /conversations`, `GET /conversations`, `GET /conversations/:id/messages`
- `POST /conversations/:id/messages`, `POST /messages/:id/translate`

---

## 83. AI APIs

- `POST /ai/chat`, `POST /ai/translate`, `POST /ai/product`, `POST /ai/marketing`, `POST /ai/document`, `POST /ai/matching`, `POST /ai/audit`, `POST /ai/market-intelligence`

---

## 84. BILLING APIs

- `GET /billing/plans`, `POST /billing/subscription`, `GET /billing/subscription`, `GET /billing/invoices`
- `GET /wallet`, `GET /wallet/transactions`
- `GET /usage`, `GET /usage/:feature`

---

## 85. AUDIT APIs

- `POST /audits`, `GET /audits`, `GET /audits/:id`
- `POST /audits/:id/tests`, `POST /audits/:id/evidence`, `POST /audits/:id/findings`
- `GET /audit/risks`, `GET /audit/controls`, `GET /audit/logs`, `POST /audits/:id/report`

---

## 86. ADMIN APIs

- `GET /admin/organizations`, `GET /admin/users`, `GET /admin/revenue`, `GET /admin/usage`, `GET /admin/transactions`, `GET /admin/verification`, `GET /admin/moderation`, `GET /admin/ai`, `GET /admin/system-health`

---

## 87. DATABASE CORE TABLES

`users`, `organizations`, `organization_members`, `organization_types`, `branches`, `departments`, `employees`, `roles`, `permissions`, `role_permissions`, `member_roles`, `features`, `plans`, `plan_features`, `organization_features`, `feature_usage`, `feature_requests`, `business_profiles`, `business_categories`, `business_products`, `product_translations`, `business_services`, `business_posts`, `post_translations`, `business_connections`, `business_followers`, `conversations`, `messages`, `message_translations`, `rfqs`, `rfq_items`, `rfq_responses`, `quotations`, `crm_leads`, `crm_contacts`, `crm_deals`, `crm_activities`, `sales`, `sales_items`, `customers`, `suppliers`, `inventory`, `warehouses`, `stock_movements`, `expenses`, `assets`, `accounts`, `transactions`, `invoices`, `orders`, `order_items`, `payments`.

---

## 88. AI DATABASE TABLES

`ai_requests`, `ai_usage`, `ai_models`, `ai_providers`, `ai_costs`, `ai_prompts`, `ai_outputs`, `translation_requests`, `translation_results`.

---

## 89. AUDIT DATABASE TABLES

`audit_engagements`, `audit_team_members`, `audit_plans`, `audit_risks`, `audit_tests`, `audit_samples`, `audit_workpapers`, `audit_evidence`, `audit_findings`, `audit_finding_comments`, `audit_finding_actions`, `audit_followups`, `audit_reports`, `internal_controls`, `control_tests`, `control_exceptions`, `risk_rules`, `risk_events`, `risk_flags`.

---

## 90. MONETIZATION DATABASE TABLES

`subscriptions`, `subscription_items`, `plans`, `plan_features`, `wallets`, `wallet_transactions`, `service_prices`, `usage_records`, `platform_commissions`, `commission_rules`, `invoices`, `invoice_items`, `refunds`, `payment_attempts`, `promotions`, `advertisements`, `featured_listings`, `verification_products`, `verification_orders`.

---

## 91. SYSTEM AUDIT TABLES

`audit_logs`, `access_logs`, `security_events`, `login_attempts`, `api_logs`, `data_exports`.

---

## 92. FRONTEND STRUCTURE

Feature- and permission-aware responsive interface:
- **My Business:** Profile, Branches, Departments, Employees
- **Business Hub:** Discover, Companies, Products, Services, Buyers, Suppliers, RFQs, Connections, Messages
- **CRM:** Leads, Contacts, Deals, Activities
- **Operations:** Sales, Inventory, Procurement, Expenses
- **Finance:** Accounts, Invoices, Receivables, Payables, Reports
- **AI:** Assistant, Translation, Product AI, Marketing, Documents, Matching, Intelligence
- **Audit:** Dashboard, Risk, Controls, Engagements, Evidence, Findings, Follow-up, Reports
- **Billing:** Plan, Wallet, Usage, Invoices
- **Settings:** Users, Roles, Features, Language, Security

---

## 93. AUDITOR INTERFACE

Auditors see audit and risk dashboards, engagements, plans, tests, evidence, findings, management responses, follow-ups, reports, and audit logs.  
*Auditors must NOT automatically see company billing, platform administration, or unrelated company settings.*

---

## 94. MOBILE APPLICATION

Mobile navigation: Home, Discover, Messages, RFQs, AI, Profile.

---

## 95. MOBILE PRODUCT CREATION

`Take photo → AI recognizes product → Confirm name → Generate description & translations → Set price & MOQ → Review → Publish`.

---

## 96. CHINESE USER EXPERIENCE

Simplified Chinese (`zh`) first-class interface: registration, company creation, publishing products in Chinese, automatic translation to English/Amharic/Afaan Oromo, Ethiopian buyer discovery, RFQ receipt, and localized chat.

---

## 97. ETHIOPIAN USER EXPERIENCE

Multilingual interface (`en`, `am`, `om`): discover Chinese suppliers, search in local languages, view translated product specs, send RFQs, negotiate, manage leads, and promote Ethiopian export goods to China.

---

## 98. BUSINESS CATEGORY STRUCTURE

Configurable industry hierarchy: Agriculture, Manufacturing, Construction, Energy/Solar, Machinery, Technology, Electronics, Textiles, Leather, Coffee, Food, Logistics, Professional Services, Healthcare, Tourism, Import/Export.

---

## 99. COMMERCIAL DOCUMENT FLOW

`Product → RFQ → Quotation → Negotiation → Purchase Order → Invoice → Payment Partner → Shipping → Delivery → Completed`.

---

## 100. PAYMENT INTEGRATION BOUNDARY

Strict division of responsibilities:
- **ETHIO-BRIDGE:** Order details, invoice metadata, transaction status, commission calculation, payment initiation, reconciliation.
- **Licensed Payment Provider:** Actual payment processing, regulatory settlement, and funds transfer.

---

## 101. RECONCILIATION

Platform finance admin tracks: `payment_reference`, `order_reference`, `provider_reference`, `amount`, `currency`, `status` (INITIATED, PENDING, SUCCESS, FAILED, REFUNDED, REVERSED), `commission`, `date`.

---

## 102. DISPUTE SYSTEM

Structured dispute workflow with evidence attachment, communication thread, and status tracking (OPEN, UNDER_REVIEW, WAITING_FOR_BUYER, WAITING_FOR_SELLER, RESOLVED, CLOSED).

---

## 103. PLATFORM SERVICE PROVIDERS

Service marketplace profiles for Logistics, Customs, Inspection, Translation, Legal, Insurance, and Warehousing.

---

## 104. PARTNER MANAGEMENT

Admin management of partner agreements, commission splits, status, and API credentials across PAYMENT, LOGISTICS, FINANCE, INSURANCE, and INSPECTION partners.

---

## 105. ADVERTISING

Targeted promotional campaigns for products, companies, services, and posts with budget, date, and audience filters.

---

## 106. FEATURED LISTINGS

Product listing tiers (STANDARD, FEATURED, PREMIUM) with transparent visual demarcation of sponsored placement.

---

## 107. API BUSINESS

External API exposure for third-party consumers with API keys, rate limits, usage dashboards, and metered billing.

---

## 108. API SECURITY

API keys, OAuth2 scopes, token rotation, IP restrictions, and granular rate limiting.

---

## 109. SECURITY

Password hashing (Argon2/bcrypt), JWT session management, RBAC, tenant isolation, input validation, CSRF/XSS prevention, SQL injection protection, secure uploads, TLS in transit, and comprehensive security logging.

---

## 110. SECRETS

Never store secrets in source code; use environment variables and key management services.

---

## 111. BACKUP

Automated database and file backups with periodic restore verification.

---

## 112. OBSERVABILITY

Real-time monitoring of API latency, errors, AI metrics, database health, queue throughput, and memory/CPU utilization.

---

## 113. ERROR HANDLING

Standardized JSON error responses without stack trace leakage to clients.

---

## 114. AUDITABILITY

Every sensitive action records: Who, What, When, Where, Before, After, Reason.

---

## 115. PERFORMANCE

Targets: API responses < 500ms, search < 1–2s, dashboard < 2s; asynchronous queue processing for heavy operations.

---

## 116. ASYNCHRONOUS JOBS

Background job queues for translation, document processing, bulk imports, notifications, audit analysis, and embedding generation.

---

## 117. FILE STORAGE

Object storage (S3-compatible) with database metadata reference.

---

## 118. SEARCH INDEX

PostgreSQL full-text search initially, scaling to dedicated vector/semantic search indexing.

---

## 119. AI EMBEDDINGS

Secure embeddings tagged with `organization_id`, `visibility`, and `language` to prevent cross-tenant leakage.

---

## 120. DATA RETENTION

Configurable data retention policies adhering to legal and financial compliance requirements.

---

## 121. DATA EXPORT

Authorized organization data export (CSV, Excel, PDF, JSON) with audit logging.

---

## 122. ACCOUNT DELETION

Compliant deactivation, suspension, and data retention workflows.

---

## 123. ADMIN FEATURE MANAGEMENT

Admin controls to configure feature pricing, billing type (FREE, SUBSCRIPTION, PAY_PER_USE, ENTERPRISE), usage limits, and availability.

---

## 124. ADMIN PLAN MANAGEMENT

Admin controls for subscription plan pricing, billing cycles (MONTHLY, YEARLY, CUSTOM), included features, and quotas.

---

## 125. FREE TRIAL

Admin-configurable free trial periods (7, 14, 30 days).

---

## 126. REVENUE REPORTING

Revenue analytics aggregated daily, weekly, monthly, and yearly across subscriptions, AI, transactions, ads, verification, enterprise, and partner fees.

---

## 127. CUSTOMER BILLING

Customer-facing billing portal: current plan, real-time usage metrics, wallet balance, invoice history, and payment methods.

---

## 128. OWNER PROFIT ANALYTICS

Platform profit computation:
```
Gross Revenue - (AI Provider Costs + Payment Fees + Infrastructure Costs + Refunds) = Net Contribution Margin
```

---

## 129. BUSINESS MODEL RULE

**Free to join → valuable to use → paid when business value increases.**

---

## 130. ETHIOPIA → CHINA WORKFLOW

`Ethiopian Exporter → Create Profile → Publish Goods (e.g. Coffee) → AI Generates Chinese Specs → Chinese Buyer Discovers → Multilingual RFQ & Quotation → Negotiation → Order → Licensed Settlement → Logistics → CRM`.

---

## 131. CHINA → ETHIOPIA WORKFLOW

`Chinese Manufacturer → Create Profile → Publish Machinery → AI Generates English/Amharic/Oromo Specs → Ethiopian Buyer Discovers → RFQ → Quotation → Negotiation → Order → Licensed Settlement → Logistics → CRM`.

---

## 132. COMPANY ONBOARDING WORKFLOW

`Register → Verify Contact → Create Organization → Profile Setup → Language & Category Selection → Feature Selection → Plan → Dashboard`.

---

## 133. FEATURE PURCHASE WORKFLOW

`Owner → Feature Store → Select Feature → View Price & Limits → Subscribe/Pay → Instant Entitlement Activation`.

---

## 134. AI PAY-PER-USE WORKFLOW

`User selects AI service → Enter input → Cost preview → Confirm → Execution → Charge wallet / record meter`.

---

## 135. COMPANY DASHBOARD

Configurable widgets: Business Health, Revenue, Orders, Leads, RFQs, Messages, Product Views, Supplier Opportunities, Buyer Matches, AI Usage, Risk Alerts.

---

## 136. BUYER DASHBOARD

Recommended Suppliers, Saved Products, My RFQs, Received Quotations, Active Messages, Orders.

---

## 137. SELLER DASHBOARD

Product Analytics, Incoming Leads, RFQs, Active Quotations, Customer Chats, Orders, Revenue.

---

## 138. AUDITOR DASHBOARD

Open Risks, Critical Risk Alerts, Open Findings, Overdue Actions, Audit Engagement Progress, Control Test Results, AI Risk Indicators.

---

## 139. PLATFORM ADMIN DASHBOARD

Overview of Organizations, Users, Platform Revenue, Subscriptions, AI Metering, Marketplace Health, Moderation Queue, and System Performance.

---

## 140. NOTIFICATION PRIORITY

- CRITICAL: Security alerts, critical audit risks, payment failures, account suspensions
- HIGH: Quotation received, RFQ deadline, contract signed
- NORMAL: New messages, connection requests, feature updates
- LOW: Informational newsletters and tips

---

## 141. ACCESS CONTROL MATRIX

| Function | Owner | Manager | Employee | Auditor | Platform Admin |
|---|---|---|---|---|---|
| Company settings | ✓ | Limited | ✗ | ✗ | Platform view |
| Users & roles | ✓ | Limited | ✗ | ✗ | ✓ |
| Products | ✓ | ✓ | Assigned | View | ✓ |
| Finance | ✓ | Assigned | Assigned | Read/Audit | Platform view |
| Audit | ✓ | Assigned | ✗ | ✓ | ✓ |
| Billing | ✓ | ✗ | ✗ | ✗ | ✓ |
| Other companies | Public only | Public only | Public only | Authorized only | ✓ |

---

## 142. CRITICAL SECURITY RULE

Frontend button hiding is **NOT** authorization.
Backend must verify permission, organization tenancy, feature entitlement, and resource ownership on every request.

---

## 143. NO FAKE FUNCTIONALITY

Unimplemented features must have `implementationStatus: NOT_IMPLEMENTED` and must never be disguised as operational.

---

## 144. NO HARDCODED DASHBOARD DATA

All dashboard metrics must be computed from real database state. Seed/demo data must be strictly segregated from production data.

---

## 145. NO MOCK AI IN PRODUCTION

No fake translation or AI responses. If an AI provider is unavailable or unconfigured, return `503 SERVICE_UNAVAILABLE` or `503 AI_PROVIDER_NOT_CONFIGURED` gracefully.

---

## 146. NO CROSS-TENANT AI LEAKAGE

AI prompts must only receive authorized, scoped tenant data. Never query unconstrained database tables for AI context.

---

## 147. NO AUTOMATIC PUBLICATION OF AI CONTENT

AI-generated product descriptions, translations, and marketing posts must be user-reviewable before publication.

---

## 148. AUDITOR IMMUTABILITY

Auditors can create findings and comments, but cannot alter or delete underlying financial transactions.

---

## 149. VERSION HISTORY

Versioning support for Products, Contracts, Quotations, Audit Findings, Company Profiles, and Multilingual Content.

---

## 150. SYSTEM ARCHITECTURE

```
                      ETHIO-BRIDGE
                            │
                ┌───────────┴───────────┐
                │                       │
            WEB CLIENT             MOBILE CLIENT
                │                       │
                └───────────┬───────────┘
                            │
                        API GATEWAY (/api/v1/)
                            │
                   AUTHENTICATION & RBAC
                            │
               FEATURE ENTITLEMENT ENGINE
                            │
      ┌─────────────────────┼─────────────────────┐
      │                     │                     │
  B2B SERVICES          BUSINESS SERVICES      AI SERVICES
      │                     │                     │
  Products              Sales                Translation
  Companies             CRM                  Assistant
  RFQ                   Inventory             Documents
  Chat                  Finance               Matching
  Search                Audit                 AI Audit
      │                     │                     │
      └─────────────────────┼─────────────────────┘
                            │
                       DATA LAYER
                            │
            ┌───────────────┼────────────────┐
            │               │                │
        PostgreSQL       Object Storage    Search Index
            │
            └───────────────┬────────────────┘
                            │
                      BILLING LAYER
                            │
               ┌────────────┼────────────┐
               │            │            │
          Subscription    Wallet      Usage Meter
               │            │            │
               └────────────┼────────────┘
                            │
                    PAYMENT INTEGRATION
                            │
                 Licensed Payment Partners
```

---

## 151. RECOMMENDED TECHNOLOGY STRUCTURE

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS / Vanilla CSS, Responsive & PWA-ready.
- **Backend:** NestJS / Node.js, TypeScript, RESTful API architecture.
- **Database:** PostgreSQL with Prisma ORM.
- **Cache & Queues:** Redis / BullMQ.
- **Storage:** S3-compatible object store.
- **Internationalization:** `next-intl` (en, am, om, zh).

---

## 152. MOBILE STRATEGY

Responsive Web + PWA prioritized for Ethiopian and Chinese mobile environments, backed by mobile-optimized API endpoints.

---

## 153. IMPLEMENTATION PHASES

- **Phase 0:** Existing System Audit & Gap Analysis
- **Phase 1:** Foundation (Auth, Multi-tenancy, RBAC, Feature Entitlement, Audit Logs, 4-Language UI)
- **Phase 2:** Business Hub (Profiles, Products, Posts, Categories, Discovery)
- **Phase 3:** Ethiopia ↔ China Bridge (Cross-language Search, AI Translation, Chat, Connections, RFQ & Quotation)
- **Phase 4:** CRM (Leads, Contacts, Deals, Pipeline, Activities)
- **Phase 5:** AI Services (Assistant, Translation, Product AI, Marketing, Document AI, Matching, Market Intelligence)
- **Phase 6:** Business Management (Sales, Inventory, Procurement, Expenses, Finance)
- **Phase 7:** Audit & Risk (Engagements, Internal Controls, Risk Engine, Evidence, Findings, Reports, AI Audit)
- **Phase 8:** Monetization (Plans, Subscriptions, Wallet, Pay-per-use, Commissions, Invoices, Revenue Dashboard)
- **Phase 9:** Payment & Order Ecosystem (Orders, Licensed Payment Partner Integration, Reconciliation, Logistics, Disputes)
- **Phase 10:** Scale & Ecosystem (Semantic Vector Search, API Marketplace, Enterprise Multi-branch, Global Expansion)

---

## 154–163. DETAILED PHASE SPECIFICATIONS

*(Aligned with Phases 1 through 10 as specified in §154–163).*

---

## 164. TESTING REQUIREMENTS

- **Unit tests:** Business logic and utility invariants.
- **Integration tests:** API endpoints and database constraints.
- **Authorization tests:** RBAC permissions and role boundaries.
- **Tenant isolation tests:** Cross-organization 403 enforcement.
- **AI tests:** Provider failure handling and quota verification.
- **Translation tests:** 4-language persistence without original data mutation.
- **Billing tests:** Wallet reservation, debit, credit, and rollback on failure.
- **Audit tests:** Log immutability and auditor permission restrictions.
- **End-to-end tests:** Complete commercial lifecycle.

---

## 165. MANDATORY SECURITY TEST

```
ORG_A User → Access ORG_B Data → Result: 403 FORBIDDEN
```

---

## 166. MANDATORY FEATURE TEST

```
Disable AI_AUDIT → POST /ai/audit → Result: 403 FEATURE_NOT_ENABLED
```

---

## 167. MANDATORY ROLE TEST

```
Auditor Role → Attempt DELETE on financial transaction → Result: 403 FORBIDDEN
```

---

## 168. MANDATORY BILLING TEST

```
AI service succeeds → Wallet reservation → AI Success → Finalize Charge
AI service fails → Wallet reservation → AI Failure → Release Reservation
```

---

## 169. MANDATORY TRANSLATION TEST

Multilingual translation workflow across `zh`, `en`, `am`, `om` preserves original text intact with complete translation metadata.

---

## 170. PRODUCTION ACCEPTANCE CHECKLIST

Comprehensive verification across Core, Languages, B2B Hub, AI, Business Operations, Audit, Monetization, and Platform Administration.

---

## 171. MOST IMPORTANT AGENT INSTRUCTION

> **ETHIO-BRIDGE SDD is the authoritative product specification.** Do not redesign the product based on assumptions. Do not remove requirements because they are difficult. Do not create fake functionality. Implement incrementally with strict multi-tenancy, RBAC, and data isolation at the backend.

---

## 172. THE ETHIO-BRIDGE BUSINESS FLYWHEEL

```
        🇨🇳 CHINESE BUSINESSES
                 │
          Publish Products
                 │
                 ▼
          ┌─────────────┐
          │ ETHIO-BRIDGE │
          └─────────────┘
                 │
        AI Translation
        AI Matching
        B2B Search
                 │
                 ▼
        🇪🇹 ETHIOPIAN BUYERS
                 │
                 ▼
                RFQ
                 │
                 ▼
             QUOTATION
                 │
                 ▼
            NEGOTIATION
                 │
                 ▼
               ORDER
                 │
                 ▼
        PAYMENT PARTNER (Licensed)
                 │
                 ▼
             LOGISTICS
                 │
                 ▼
             DELIVERY
                 │
                 ▼
         BUSINESS MANAGEMENT
                 │
                 ▼
                AI
                 │
                 ▼
              GROWTH
```