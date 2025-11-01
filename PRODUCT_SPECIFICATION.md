# Product Specification Document
## Milk Delivery Management System

---

**Version:** 1.0  
**Last Updated:** October 27, 2025  
**Status:** In Development  
**Document Owner:** Product Team  
**Project Type:** Enterprise Financial Application (PWA)

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Product Vision & Goals](#product-vision--goals)
4. [Target Users & Personas](#target-users--personas)
5. [Product Overview](#product-overview)
6. [Core Features & Requirements](#core-features--requirements)
7. [User Stories & Use Cases](#user-stories--use-cases)
8. [Technical Architecture](#technical-architecture)
9. [Data Models & Business Logic](#data-models--business-logic)
10. [User Interface & Experience](#user-interface--experience)
11. [Non-Functional Requirements](#non-functional-requirements)
12. [Success Metrics & KPIs](#success-metrics--kpis)
13. [Risk Assessment & Mitigation](#risk-assessment--mitigation)
14. [Development Roadmap](#development-roadmap)
15. [Appendix](#appendix)

---

## Executive Summary

### Product Name
**Milk Delivery Management System**

### Product Category
Enterprise-grade Financial Application / Progressive Web App (PWA)

### Target Market
Small to medium-sized milk delivery businesses in India

### Primary Value Proposition
A mobile-first, enterprise-grade milk delivery management system that ensures **100% financial accuracy**, eliminates payment discrepancies, and provides real-time business insights through automated FIFO payment processing and comprehensive audit trails.

### Key Differentiators
- **Zero data loss guarantee** - Every rupee is accounted for
- **Automated FIFO payment processing** - Oldest deliveries paid first, automatically
- **Real-time financial tracking** - Instant updates across all devices
- **Multi-day pending accumulation** - Track unpaid amounts across unlimited days
- **Business logic in database** - Single source of truth, no sync issues
- **Mobile-first design** - Built specifically for delivery personnel on-the-go

### Business Impact
- **100% payment accuracy** - Eliminates financial discrepancies
- **75% faster payment collection** - Streamlined mobile interface
- **Real-time visibility** - Business owner sees everything instantly
- **Complete audit trail** - Every action logged with timestamp
- **Reduced operational errors** - Database constraints prevent invalid data

---

## Problem Statement

### Current Pain Points

#### 1. **Critical Data Integrity Issues** 🚨
- Payment data inconsistencies between different views
- Duplicate database columns causing confusion
- Pending payments being accidentally deleted
- Wrong shop data loading in collection view
- Payment amounts not matching delivery totals

#### 2. **Broken Payment Processing**
- Payment processing not working correctly
- Partial payments not being tracked
- FIFO logic not implemented (oldest deliveries not paid first)
- Multi-day pending amounts not accumulating properly

#### 3. **Scattered Business Logic**
- Business logic split between frontend and backend
- Different calculations in different parts of the app
- Sync issues between multiple data sources
- No single source of truth

#### 4. **Poor User Experience**
- Manual refresh required to see updates
- Slow loading times
- Not optimized for mobile devices
- Complex workflows for simple tasks

#### 5. **Lack of Financial Visibility**
- No clear view of total pending amounts
- Difficulty tracking multi-day pending payments
- No historical reporting
- Missing audit trail

### Impact of Current Problems
- **Financial losses** due to payment tracking errors
- **Customer dissatisfaction** from payment disputes
- **Operational inefficiency** from manual workarounds
- **Staff frustration** from system unreliability
- **Business risk** from lack of financial visibility

### Solution Requirements
A **completely rebuilt system** with:
- Database-first architecture (business logic in PostgreSQL)
- Real-time synchronization (Supabase real-time)
- Mobile-first design (optimized for delivery personnel)
- ACID transactions (every rupee accounted for)
- Complete audit trail (all actions logged)

---

## Product Vision & Goals

### Vision Statement
*"To become the most reliable and easy-to-use milk delivery management system that gives business owners complete financial control and peace of mind."*

### Product Goals

#### Primary Goals
1. **Financial Accuracy** - Achieve 100% payment tracking accuracy with zero discrepancies
2. **Operational Efficiency** - Reduce payment collection time by 75%
3. **Real-time Visibility** - Provide instant business insights across all devices
4. **User Satisfaction** - Achieve 95%+ user satisfaction score from delivery staff

#### Secondary Goals
1. **Scalability** - Support businesses from 10 to 1000+ daily deliveries
2. **Reliability** - Achieve 99.9% uptime
3. **Mobile Performance** - App loads in < 2 seconds on 3G networks
4. **Data Security** - Zero data breaches, complete audit trail

### Success Criteria
- ✅ All payment amounts match delivery totals within 24 hours
- ✅ Zero pending payment losses during daily resets
- ✅ FIFO payment processing works 100% correctly
- ✅ Real-time updates without manual refresh
- ✅ Mobile app usable with one hand while riding bike
- ✅ Complete financial reports available instantly

---

## Target Users & Personas

### User Roles

#### 1. **Delivery Boy** (Primary User)
**Profile:**
- Age: 18-35
- Education: 10th-12th pass
- Tech Savviness: Basic smartphone user
- Work Pattern: Early morning (5 AM - 12 PM)
- Device: Budget Android phone (4-6 inch screen)

**Goals:**
- Record deliveries quickly while on route
- Minimize typing and data entry
- Work with one hand while riding bike
- Know which shops to deliver to
- Complete route before noon

**Pain Points:**
- Poor mobile internet connectivity
- Limited time at each shop
- Need to remember multiple milk types and prices
- Difficulty entering data while standing
- Confusion about shop names/addresses

**Key Features Needed:**
- Quick delivery entry (< 30 seconds per shop)
- Offline capability
- Large touch targets
- Auto-calculated totals
- Shop search by name or route
- Voice notes for special instructions

---

#### 2. **Collection Staff** (Primary User)
**Profile:**
- Age: 25-45
- Education: 12th pass to graduate
- Tech Savviness: Moderate smartphone user
- Work Pattern: Afternoon/evening (2 PM - 8 PM)
- Device: Budget to mid-range Android phone

**Goals:**
- Collect payments from shops efficiently
- Track pending payments across days
- Mark "Pay Tomorrow" for shops that can't pay today
- Record partial payments accurately
- Know exact pending amount for each shop

**Pain Points:**
- Shops dispute payment amounts
- Difficult to track multi-day pending payments
- Confusion about which deliveries are paid
- Manual calculation errors
- No proof of payment collection

**Key Features Needed:**
- Clear pending amount display
- FIFO payment processing (automatic)
- Partial payment support
- "Pay Tomorrow" button
- Payment receipt/confirmation
- Historical payment view

---

#### 3. **Business Owner** (Secondary User)
**Profile:**
- Age: 30-60
- Education: Graduate
- Tech Savviness: Moderate to high
- Work Pattern: Throughout the day
- Device: Smartphone + optional tablet/laptop

**Goals:**
- Monitor daily business performance
- Track pending payments across all shops
- Generate financial reports
- Verify staff actions
- Make data-driven decisions
- Ensure zero financial discrepancies

**Pain Points:**
- Lack of real-time visibility
- Difficulty tracking overall pending amounts
- No historical reporting
- Can't verify staff actions
- Manual report generation
- Trust issues due to past data errors

**Key Features Needed:**
- Real-time dashboard
- Daily/weekly/monthly reports
- Complete audit trail
- Pending payment tracking
- Shop-wise financial summaries
- Daily reset functionality
- User activity logs

---

## Product Overview

### What is the Milk Delivery Management System?

A **mobile-first Progressive Web App** that manages the complete lifecycle of milk delivery operations:

1. **Morning:** Delivery boys record deliveries to shops
2. **Afternoon:** Collection staff collect payments (full/partial/deferred)
3. **Evening:** Business owner reviews reports and verifies finances
4. **Night:** System automatically handles daily reset and archiving

### Core Workflow

```
┌─────────────────────────────────────────────────────┐
│                   DAILY WORKFLOW                     │
└─────────────────────────────────────────────────────┘

   MORNING (5 AM - 12 PM)
   ┌──────────────────────────────────┐
   │  Delivery Boy Records Deliveries │
   │  - Select shop                   │
   │  - Choose milk types & quantity  │
   │  - Auto-calculate total          │
   │  - Add optional notes            │
   └──────────────────────────────────┘
              ↓
   AFTERNOON (2 PM - 8 PM)
   ┌──────────────────────────────────┐
   │  Collection Staff Collects Money │
   │  - View pending amounts          │
   │  - Process payments (FIFO)       │
   │  - Mark "Pay Tomorrow"           │
   │  - Record partial payments       │
   └──────────────────────────────────┘
              ↓
   EVENING (8 PM - 11 PM)
   ┌──────────────────────────────────┐
   │  Business Owner Reviews Reports  │
   │  - Daily financial summary       │
   │  - Pending payments report       │
   │  - Shop-wise details             │
   │  - Staff activity log            │
   └──────────────────────────────────┘
              ↓
   NIGHT (After verification)
   ┌──────────────────────────────────┐
   │  Daily Reset (Owner initiates)   │
   │  - Archive paid deliveries       │
   │  - Preserve pending amounts      │
   │  - Reset daily counters          │
   │  - Generate daily report         │
   └──────────────────────────────────┘
```

### Key Concepts

#### 1. **FIFO Payment Processing**
When a payment is collected, it automatically applies to the **oldest pending deliveries first**.

**Example:**
```
Shop "Jai Ambe Kirana" has:
- Day 1: ₹272 pending (oldest)
- Day 2: ₹185 pending
- Day 3: ₹544 pending
Total: ₹1,001 pending

Customer pays ₹400:
✅ Day 1: ₹272 - FULLY PAID
✅ Day 2: ₹128 - PARTIALLY PAID (₹57 remaining)
❌ Day 3: ₹544 - STILL PENDING
```

#### 2. **Multi-Day Pending Accumulation**
Unpaid amounts automatically carry forward across days until paid.

**Example:**
```
Monday: Delivered ₹500, Paid ₹0 → Pending: ₹500
Tuesday: Delivered ₹300, Paid ₹200 → Pending: ₹600 (₹500 + ₹300 - ₹200)
Wednesday: Delivered ₹400, Paid ₹900 → Pending: ₹0 (all cleared)
```

#### 3. **Payment States**
Every delivery has one of three states:
- **PAID** - Fully paid (payment_amount = total_amount)
- **PARTIAL** - Partially paid (0 < payment_amount < total_amount)
- **PENDING** - Unpaid (payment_amount = 0)

#### 4. **Daily Reset**
End-of-day process that:
- ✅ Keeps all records forever (nothing deleted)
- ✅ Archives paid deliveries for reporting
- ✅ Preserves pending/partial amounts
- ✅ Resets daily counters
- ✅ Generates daily summary report

---

## Core Features & Requirements

### Feature 1: Delivery Management 📦

#### Description
Allows delivery boys to quickly record milk deliveries to shops while on their route.

#### User Stories
- As a delivery boy, I want to record a delivery in < 30 seconds
- As a delivery boy, I want the app to auto-calculate totals
- As a delivery boy, I want to add optional notes per delivery
- As a delivery boy, I want to see today's delivery list

#### Functional Requirements
1. **Shop Selection**
   - Search shops by name (autocomplete)
   - Filter shops by route number
   - Recently delivered shops shown first
   - Display shop contact info

2. **Product Selection**
   - Select milk type from dropdown
   - Enter quantity (number input)
   - Auto-calculate total amount (quantity × price)
   - Support multiple products per delivery

3. **Delivery Recording**
   - Save delivery with validation
   - Auto-set delivery date to today
   - Optional notes field
   - Confirmation message

4. **Delivery List View**
   - View today's deliveries
   - Filter by shop/product/delivery boy
   - Show total delivered today
   - Real-time updates

#### Acceptance Criteria
- ✅ Delivery can be recorded in ≤ 30 seconds
- ✅ Total amount auto-calculated correctly
- ✅ All deliveries visible immediately after saving
- ✅ Works on 3G internet
- ✅ Validation prevents negative quantities
- ✅ Validation prevents zero amounts

#### Data Validations
```sql
- quantity > 0
- total_amount > 0
- shop_id exists in shops table
- milk_type_id exists in milk_types table
- delivery_boy_id exists in delivery_boys table
```

---

### Feature 2: Payment Collection 💰

#### Description
Allows collection staff to collect payments from shops with automatic FIFO processing.

#### User Stories
- As collection staff, I want to see all shops with pending amounts
- As collection staff, I want to process full payments quickly
- As collection staff, I want to record partial payments
- As collection staff, I want to mark shops as "Pay Tomorrow"
- As collection staff, I want to see payment history

#### Functional Requirements

1. **Collection View**
   - List all shops with pending amounts
   - Show total pending per shop
   - Breakdown: today's pending + historical pending
   - Sort by highest pending first
   - Search shops by name

2. **Full Payment Processing**
   - Display total pending amount
   - Enter payment amount
   - Auto-apply FIFO logic (oldest first)
   - Show which deliveries will be paid
   - Confirmation message

3. **Partial Payment Processing**
   - Enter amount less than total pending
   - Auto-distribute to oldest deliveries
   - Show remaining pending amount
   - Update shop status to "partial"

4. **Pay Tomorrow**
   - Mark shop for next-day collection
   - Add optional note (reason)
   - Keep pending amount intact
   - Track in pending_tracking table

5. **Payment History**
   - View all payments for a shop
   - Filter by date range
   - Show payment method
   - Show who collected

#### Acceptance Criteria
- ✅ FIFO payment processing works 100% correctly
- ✅ Partial payments calculated accurately
- ✅ "Pay Tomorrow" preserves pending amount
- ✅ Payment confirmation shown immediately
- ✅ Real-time updates to collection view
- ✅ No payment amount exceeds total pending

#### FIFO Algorithm
```
1. Get all pending deliveries for shop (ORDER BY delivery_date ASC)
2. Start with payment amount
3. For each delivery (oldest first):
   - remaining_on_delivery = total_amount - payment_amount
   - apply_amount = MIN(payment_remaining, remaining_on_delivery)
   - payment_amount += apply_amount
   - payment_remaining -= apply_amount
   - IF payment_amount = total_amount: status = 'paid'
   - ELSE IF payment_amount > 0: status = 'partial'
   - IF payment_remaining = 0: BREAK
4. Save payment record with affected delivery IDs
```

---

### Feature 3: Reports & Analytics 📊

#### Description
Provides business owner with real-time financial insights and historical reports.

#### User Stories
- As a business owner, I want to see today's financial summary
- As a business owner, I want to see all pending payments
- As a business owner, I want shop-wise detailed reports
- As a business owner, I want to see payment collection trends
- As a business owner, I want to verify staff actions

#### Functional Requirements

1. **Daily Summary**
   - Total delivered today
   - Total collected today
   - Total pending today
   - Number of deliveries
   - Number of shops served
   - Payment collection rate

2. **Pending Payments Report**
   - All shops with pending amounts
   - Total pending across all shops
   - Breakdown by shop
   - Aging analysis (0-7 days, 8-15 days, 15+ days)
   - Export to CSV

3. **Shop Detail View**
   - Complete financial history for a shop
   - All deliveries (all time)
   - All payments (all time)
   - Current balance
   - Average daily delivery
   - Payment reliability score

4. **Activity Log**
   - All actions with timestamps
   - User who performed action
   - Action type (delivery/payment/reset)
   - Filter by date/user/action type
   - Search functionality

5. **Historical Reports**
   - Date range selection
   - Financial summary for period
   - Top shops by delivery volume
   - Top shops by pending amount
   - Delivery boy performance
   - Collection staff performance

#### Acceptance Criteria
- ✅ All reports show data instantly (< 2 seconds)
- ✅ Numbers match database exactly
- ✅ Export functionality works
- ✅ Real-time updates without refresh
- ✅ Historical data available for all time
- ✅ Filters work correctly

#### Report Metrics
```
Daily Summary:
- total_delivered: SUM(deliveries.total_amount) WHERE date = today
- total_collected: SUM(payments.amount) WHERE date = today  
- total_pending: SUM(deliveries.total_amount - payment_amount) WHERE status != 'paid'
- collection_rate: (total_collected / total_delivered) × 100

Aging Analysis:
- 0-7 days: SUM(pending) WHERE delivery_date > today - 7 days
- 8-15 days: SUM(pending) WHERE delivery_date BETWEEN today - 15 AND today - 8
- 15+ days: SUM(pending) WHERE delivery_date <= today - 15 days
```

---

### Feature 4: Daily Reset 🔄

#### Description
End-of-day process that archives paid deliveries and preserves pending amounts.

#### User Stories
- As a business owner, I want to reset daily data after verification
- As a business owner, I want confirmation before resetting
- As a business owner, I want to ensure pending amounts are preserved
- As a business owner, I want a summary of what was reset

#### Functional Requirements

1. **Reset Confirmation Dialog**
   - Show what will be reset
   - Show counts: paid deliveries, pending deliveries
   - Require explicit confirmation
   - Warning about irreversibility

2. **Reset Process**
   - Archive all PAID deliveries
   - Preserve all PENDING/PARTIAL deliveries
   - Delete daily notes
   - Generate daily summary report
   - Log reset action

3. **Reset Summary**
   - Number of deliveries archived
   - Number of pending deliveries preserved
   - Total amount archived
   - Total pending amount
   - Success/error message

#### Acceptance Criteria
- ✅ Paid deliveries archived correctly
- ✅ Pending/partial deliveries preserved
- ✅ No data loss during reset
- ✅ Reset logged in activity_log
- ✅ Summary shown after reset
- ✅ Cannot reset twice for same date

#### Reset Logic
```sql
FOR each delivery WHERE delivery_date = reset_date:
  IF payment_status = 'paid':
    -- Keep in database for historical reporting
    -- Mark as archived
  ELSE IF payment_status IN ('pending', 'partial'):
    -- Keep delivery record unchanged
    -- Will appear in next day's collection view
  END IF
END FOR

DELETE FROM daily_notes WHERE note_date = reset_date;
INSERT INTO activity_log (action = 'daily_reset', ...);
```

---

### Feature 5: Shop Management 🏪

#### Description
Manage shop information, contact details, and activity status.

#### User Stories
- As an owner, I want to add new shops
- As an owner, I want to edit shop details
- As an owner, I want to deactivate shops
- As an owner, I want to see shop financial history

#### Functional Requirements

1. **Add Shop**
   - Name (unique, required)
   - Address (optional)
   - Phone number (optional)
   - Owner name (optional)
   - Route number (optional)
   - Validation on save

2. **Edit Shop**
   - Update any field
   - Prevent duplicate names
   - Auto-save on change
   - Show last updated timestamp

3. **Deactivate Shop**
   - Mark shop as inactive
   - Hide from delivery lists
   - Keep in database for history
   - Can reactivate later

4. **Shop List View**
   - Search by name
   - Filter by active/inactive
   - Filter by route
   - Sort by name/pending amount

#### Acceptance Criteria
- ✅ Unique shop names enforced
- ✅ Phone number validation
- ✅ Inactive shops hidden from delivery view
- ✅ Shop data persisted correctly
- ✅ Edit history tracked

---

### Feature 6: Product Management 📋

#### Description
Manage milk types and pricing.

#### User Stories
- As an owner, I want to add new milk types
- As an owner, I want to update prices
- As an owner, I want to deactivate products
- As an owner, I want price history

#### Functional Requirements

1. **Add Milk Type**
   - Name (unique, required)
   - Price per packet (required, > 0)
   - Description (optional)
   - Active status

2. **Edit Milk Type**
   - Update name/price/description
   - Price change creates new history entry
   - Cannot edit if deliveries exist

3. **Deactivate Product**
   - Mark as inactive
   - Hide from delivery form
   - Keep for historical deliveries

4. **Price History**
   - Track all price changes
   - Show effective date
   - Show who changed price

#### Acceptance Criteria
- ✅ Price must be positive
- ✅ Unique product names
- ✅ Price history tracked
- ✅ Inactive products hidden
- ✅ Historical deliveries unaffected

---

### Feature 7: User & Role Management 👥

#### Description
Manage delivery boys, collection staff, and access control.

#### User Stories
- As an owner, I want to add new delivery boys
- As an owner, I want to add collection staff
- As an owner, I want to see staff performance
- As an owner, I want to deactivate users

#### Functional Requirements

1. **Add Delivery Boy**
   - Name (required)
   - Phone (optional)
   - Active status
   - Assign to routes

2. **Add Collection Staff**
   - Name (required)
   - Phone (optional)
   - Active status

3. **User Performance**
   - Deliveries completed
   - Payments collected
   - Average per day
   - Activity timeline

4. **User Management**
   - Edit user details
   - Deactivate users
   - View user activity
   - Reassign deliveries

#### Acceptance Criteria
- ✅ User names required
- ✅ Phone validation
- ✅ Performance metrics accurate
- ✅ Inactive users hidden
- ✅ User activity logged

---

## User Stories & Use Cases

### Epic 1: Daily Delivery Operations

#### User Story 1.1
**As a** delivery boy  
**I want to** record deliveries quickly on my phone  
**So that** I can complete my route efficiently without delays

**Acceptance Criteria:**
- Can record delivery in ≤ 30 seconds
- Works on slow mobile internet
- Large touch targets for easy tapping
- Auto-calculated totals
- Minimal typing required

---

#### User Story 1.2
**As a** delivery boy  
**I want to** see which shops are on my route today  
**So that** I don't miss any deliveries

**Acceptance Criteria:**
- Shop list filtered by route number
- Shops sorted by delivery order
- Can mark shops as "skipped" with reason
- Can add notes for irregular requests

---

### Epic 2: Payment Collection

#### User Story 2.1
**As a** collection staff  
**I want to** see exactly how much each shop owes  
**So that** I can collect the correct amount

**Acceptance Criteria:**
- Total pending shown prominently
- Breakdown of today vs historical pending
- Includes all unpaid deliveries from all days
- Updates in real-time

---

#### User Story 2.2
**As a** collection staff  
**I want to** record partial payments easily  
**So that** shops can pay what they have available

**Acceptance Criteria:**
- Can enter any amount ≤ total pending
- System automatically applies FIFO
- Shows remaining pending amount
- Can collect multiple times per day

---

#### User Story 2.3
**As a** collection staff  
**I want to** mark a shop as "Pay Tomorrow"  
**So that** I can follow up the next day

**Acceptance Criteria:**
- One-tap "Pay Tomorrow" button
- Optional note for reason
- Shop appears in tomorrow's pending list
- Tracked in pending_tracking table

---

### Epic 3: Business Reporting

#### User Story 3.1
**As a** business owner  
**I want to** see today's financial summary  
**So that** I know how the business is performing

**Acceptance Criteria:**
- Shows total delivered, collected, pending
- Shows number of shops served
- Shows payment collection rate
- Updates in real-time

---

#### User Story 3.2
**As a** business owner  
**I want to** see complete financial history for each shop  
**So that** I can verify disputed amounts

**Acceptance Criteria:**
- All deliveries shown with dates
- All payments shown with dates
- Current balance calculated
- Can export to PDF/CSV

---

### Epic 4: System Administration

#### User Story 4.1
**As a** business owner  
**I want to** reset daily data after verification  
**So that** the next day starts clean

**Acceptance Criteria:**
- Confirmation dialog before reset
- Paid deliveries archived
- Pending deliveries preserved
- Summary shown after reset

---

#### User Story 4.2
**As a** business owner  
**I want to** see all user actions  
**So that** I can audit staff activity

**Acceptance Criteria:**
- All actions logged with timestamp
- Shows who performed action
- Can filter by user/date/action type
- Cannot be modified or deleted

---

## Technical Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │   Progressive Web App (PWA)                         │    │
│  │   - React 18 + TypeScript                          │    │
│  │   - Vite (Build Tool)                              │    │
│  │   - Tailwind CSS + Shadcn/ui                       │    │
│  │   - React Query (Caching)                          │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
                    Supabase Client SDK
                    (Real-time WebSocket)
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │   Supabase (Cloud Platform)                         │    │
│  │   - PostgreSQL 15+ (Database)                      │    │
│  │   - Real-time Engine (Subscriptions)               │    │
│  │   - Authentication (Disabled for now)              │    │
│  │   - Storage (Future: receipts/images)              │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │   PostgreSQL Functions (Business Logic)             │    │
│  │   - get_collection_view()                          │    │
│  │   - process_shop_payment()                         │    │
│  │   - process_daily_reset()                          │    │
│  │   - get_shop_balance()                             │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │   Database Tables                                   │    │
│  │   - shops, deliveries, payments                    │    │
│  │   - delivery_boys, milk_types                      │    │
│  │   - activity_log, pending_tracking                 │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI Framework |
| TypeScript | 5.x | Type Safety |
| Vite | 5.x | Build Tool |
| Tailwind CSS | 3.x | Styling |
| Shadcn/ui | Latest | Component Library |
| React Query | 5.x | Data Fetching & Caching |
| React Router | 6.x | Navigation |
| date-fns | 3.x | Date Manipulation |

#### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase | Cloud | Backend Platform |
| PostgreSQL | 15+ | Database |
| PostgREST | Auto | REST API |
| Realtime | Auto | WebSocket Subscriptions |

#### DevOps
| Tool | Purpose |
|------|---------|
| Vercel | Frontend Hosting |
| Supabase Cloud | Database Hosting |
| Git | Version Control |
| npm | Package Management |

### Data Flow Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    USER ACTION                            │
│              (e.g., "Collect ₹500 payment")              │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│                  FRONTEND LAYER                           │
│  1. Validate input (amount > 0)                          │
│  2. Show loading state                                   │
│  3. Call Supabase function                               │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│              SUPABASE CLIENT (SDK)                        │
│  1. Format RPC call                                      │
│  2. Send to Supabase via HTTPS                           │
│  3. Include authentication (future)                      │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│            POSTGRESQL FUNCTION                            │
│  1. START TRANSACTION                                    │
│  2. Validate parameters                                  │
│  3. Get pending deliveries (ORDER BY date ASC)           │
│  4. Apply payment (FIFO loop)                            │
│  5. Update delivery records                              │
│  6. Insert payment record                                │
│  7. Delete from pending_tracking                         │
│  8. Insert activity_log                                  │
│  9. COMMIT TRANSACTION                                   │
│  10. RETURN result JSON                                  │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│              DATABASE TRIGGERS                            │
│  1. Real-time change detected                            │
│  2. Broadcast to subscribed clients                      │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│             FRONTEND AUTO-UPDATE                          │
│  1. Receive real-time update                             │
│  2. Invalidate React Query cache                         │
│  3. Refetch data                                         │
│  4. Update UI automatically                              │
│  5. Show success toast                                   │
└──────────────────────────────────────────────────────────┘
```

### Security Architecture

#### Current State (Development)
- ✅ Database constraints prevent invalid data
- ✅ PostgreSQL functions validate inputs
- ✅ ACID transactions ensure consistency
- ❌ Authentication disabled
- ❌ Row Level Security (RLS) disabled

#### Future State (Production)
- ✅ PIN-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Row Level Security (RLS) enabled
- ✅ Audit logging for all actions
- ✅ Session management

### Performance Architecture

#### Frontend Optimizations
- Code splitting (React.lazy)
- Lazy loading of screens
- Image optimization
- Memoization (React.memo, useMemo)
- Debounced search inputs

#### Backend Optimizations
- Database indexes on frequently queried columns
- PostgreSQL functions for complex calculations
- Connection pooling
- Query result caching

#### Real-time Optimizations
- Targeted subscriptions (only active data)
- Throttled updates (max 1/second)
- Optimistic UI updates

---

## Data Models & Business Logic

### Entity Relationship Diagram

```
┌─────────────────┐
│     shops       │
├─────────────────┤
│ id (PK)         │
│ name (UNIQUE)   │◄──────┐
│ address         │       │
│ phone           │       │
│ owner_name      │       │
│ route_number    │       │
│ is_active       │       │
└─────────────────┘       │
                          │
┌─────────────────┐       │
│ delivery_boys   │       │
├─────────────────┤       │
│ id (PK)         │◄──┐   │
│ name            │   │   │
│ phone           │   │   │
│ is_active       │   │   │
└─────────────────┘   │   │
                      │   │
┌─────────────────┐   │   │
│  milk_types     │   │   │
├─────────────────┤   │   │
│ id (PK)         │◄─┐│   │
│ name (UNIQUE)   │  ││   │
│ price_per_packet│  ││   │
│ is_active       │  ││   │
└─────────────────┘  ││   │
                     ││   │
┌─────────────────────────────────────┐
│          deliveries                 │
├─────────────────────────────────────┤
│ id (PK)                             │
│ shop_id (FK) ───────────────────────┘
│ delivery_boy_id (FK) ───────────────┘
│ milk_type_id (FK) ──────────────────┘
│ delivery_date                       │
│ quantity                            │
│ total_amount                        │
│ payment_status (paid/partial/pending)│
│ payment_amount                      │
│ notes                               │
│ created_at                          │
└─────────────────────────────────────┘
              │
              │ (many deliveries → one payment)
              ↓
┌─────────────────────────────────────┐
│          payments                   │
├─────────────────────────────────────┤
│ id (PK)                             │
│ shop_id (FK)                        │
│ amount                              │
│ payment_date                        │
│ collected_by (FK to delivery_boys)  │
│ delivery_ids (UUID[])               │
│ notes                               │
│ created_at                          │
└─────────────────────────────────────┘
```

### Core Tables

#### 1. shops
```sql
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  address TEXT,
  phone VARCHAR(20),
  owner_name VARCHAR(255),
  route_number INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Constraints
CHECK (name != '')
```

**Business Rules:**
- Shop names must be unique
- Inactive shops hidden from delivery views
- Cannot delete shops (only deactivate)
- Name is required, all other fields optional

---

#### 2. deliveries (MOST CRITICAL)
```sql
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  delivery_boy_id UUID NOT NULL REFERENCES delivery_boys(id),
  milk_type_id UUID NOT NULL REFERENCES milk_types(id),
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Constraints
CHECK (quantity > 0)
CHECK (total_amount > 0)
CHECK (payment_amount >= 0)
CHECK (payment_amount <= total_amount)
CHECK (payment_status IN ('paid', 'partial', 'pending'))

-- Indexes
CREATE INDEX idx_deliveries_shop_date ON deliveries(shop_id, delivery_date DESC);
CREATE INDEX idx_deliveries_date ON deliveries(delivery_date DESC);
CREATE INDEX idx_deliveries_pending ON deliveries(payment_status) WHERE payment_status != 'paid';
```

**Business Rules:**
- `payment_status` auto-calculated:
  - `paid` if `payment_amount = total_amount`
  - `partial` if `0 < payment_amount < total_amount`
  - `pending` if `payment_amount = 0`
- Never deleted (kept forever for history)
- `total_amount` = `quantity × milk_type.price_per_packet`

---

#### 3. payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  collected_by UUID NOT NULL REFERENCES delivery_boys(id),
  delivery_ids UUID[] NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Constraints
CHECK (amount > 0)
CHECK (array_length(delivery_ids, 1) > 0)
```

**Business Rules:**
- Tracks individual payment transactions
- `delivery_ids` array contains all deliveries affected by this payment
- Cannot be modified after creation (audit trail)
- Links to multiple deliveries via FIFO processing

---

#### 4. pending_payments_tracking
```sql
CREATE TABLE pending_payments_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  delivery_id UUID NOT NULL REFERENCES deliveries(id),
  marked_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Unique constraint: one tracking record per delivery
CREATE UNIQUE INDEX idx_pending_tracking_delivery ON pending_payments_tracking(delivery_id);
```

**Business Rules:**
- Created when "Pay Tomorrow" is clicked
- Deleted when payment is processed
- Stores optional reason for pending
- One record per delivery

---

#### 5. activity_log
```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES delivery_boys(id),
  shop_id UUID REFERENCES shops(id),
  delivery_id UUID REFERENCES deliveries(id),
  payment_id UUID REFERENCES payments(id),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Index for querying
CREATE INDEX idx_activity_log_date ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
```

**Business Rules:**
- Every action logged (delivery, payment, reset, etc.)
- Never modified or deleted
- Provides complete audit trail
- Metadata stores action details in JSON

---

### Critical PostgreSQL Functions

#### 1. get_collection_view(p_date DATE)

**Purpose:** Returns collection view for a specific date with all pending amounts.

**Parameters:**
- `p_date` - Date to get collection view for (usually TODAY)

**Returns:**
```json
{
  "shop_id": "uuid",
  "shop_name": "string",
  "today_delivered": 0.00,
  "today_paid": 0.00,
  "today_pending": 0.00,
  "historical_pending": 0.00,
  "total_pending": 0.00,
  "overall_status": "paid|partial|pending"
}
```

**Logic:**
```sql
1. Get all shops with deliveries on p_date OR pending amounts
2. Calculate today_delivered: SUM(total_amount) WHERE delivery_date = p_date
3. Calculate today_paid: SUM(payment_amount) WHERE delivery_date = p_date
4. Calculate today_pending: today_delivered - today_paid
5. Calculate historical_pending: SUM(total_amount - payment_amount) WHERE delivery_date < p_date
6. Calculate total_pending: today_pending + historical_pending
7. Determine overall_status:
   - 'paid' if total_pending = 0
   - 'pending' if today_paid = 0 AND total_pending > 0
   - 'partial' otherwise
8. Sort by total_pending DESC
```

---

#### 2. process_shop_payment()

**Purpose:** Process payment for a shop with FIFO logic.

**Parameters:**
```sql
p_shop_id UUID,
p_amount DECIMAL,
p_collected_by UUID,
p_payment_date DATE,
p_notes TEXT
```

**Returns:**
```json
{
  "success": true,
  "payment_id": "uuid",
  "amount_applied": 0.00,
  "deliveries_affected": ["uuid1", "uuid2"],
  "remaining_pending": 0.00
}
```

**Logic:**
```sql
BEGIN TRANSACTION;

1. Validate p_amount > 0
2. Get shop's total pending amount
3. IF p_amount > total_pending: RAISE ERROR
4. Create payment record
5. Get all pending deliveries ORDER BY delivery_date ASC, created_at ASC
6. Initialize remaining_amount = p_amount
7. FOR each delivery:
     delivery_pending = total_amount - payment_amount
     apply_amount = LEAST(remaining_amount, delivery_pending)
     UPDATE deliveries SET payment_amount = payment_amount + apply_amount
     remaining_amount = remaining_amount - apply_amount
     Add delivery_id to affected_deliveries array
     IF remaining_amount = 0: BREAK
   END FOR
8. Update payment record with delivery_ids
9. DELETE FROM pending_payments_tracking WHERE delivery_id IN affected_deliveries
10. Log activity
11. COMMIT;

RETURN success result;
```

**Error Handling:**
- Rollback on any error
- Validate all inputs
- Check foreign keys exist
- Ensure no negative amounts

---

#### 3. process_daily_reset(p_date DATE)

**Purpose:** Reset daily data, archive paid deliveries, preserve pending.

**Parameters:**
- `p_date` - Date to reset (usually TODAY)

**Returns:**
```json
{
  "success": true,
  "deliveries_archived": 10,
  "deliveries_preserved": 3,
  "total_archived_amount": 2500.00,
  "total_pending_amount": 750.00
}
```

**Logic:**
```sql
BEGIN TRANSACTION;

1. Count deliveries: paid_count, pending_count
2. Calculate amounts: paid_amount, pending_amount
3. -- All deliveries kept in database for history
4. -- Status already indicates paid vs pending
5. Delete daily notes for p_date
6. Log reset activity
7. COMMIT;

RETURN summary JSON;
```

**Important:**
- Nothing is deleted from deliveries table
- All records kept forever for historical reporting
- Payment status distinguishes active vs archived

---

#### 4. get_shop_balance(p_shop_id UUID)

**Purpose:** Get complete financial summary for a shop.

**Returns:**
```json
{
  "shop_id": "uuid",
  "shop_name": "string",
  "total_delivered": 10000.00,
  "total_paid": 9500.00,
  "total_pending": 500.00,
  "deliveries_count": 45,
  "pending_deliveries_count": 3,
  "last_delivery_date": "2025-10-27",
  "last_payment_date": "2025-10-26"
}
```

**Logic:**
```sql
1. Get shop details
2. Calculate total_delivered: SUM(total_amount) all time
3. Calculate total_paid: SUM(payment_amount) all time
4. Calculate total_pending: total_delivered - total_paid
5. Count deliveries
6. Count pending deliveries (status != 'paid')
7. Get last_delivery_date: MAX(delivery_date)
8. Get last_payment_date: MAX(payment_date) from payments

RETURN JSON result;
```

---

## User Interface & Experience

### Design Principles

1. **Mobile-First**
   - Designed for 4-6 inch smartphone screens
   - Large touch targets (min 44×44 px)
   - One-hand operation support
   - Works in portrait mode only

2. **Speed & Efficiency**
   - ≤ 30 seconds per delivery entry
   - ≤ 15 seconds per payment
   - Minimal typing required
   - Auto-calculated amounts

3. **Clarity & Feedback**
   - Clear visual hierarchy
   - Immediate feedback on actions
   - Toast notifications for success/error
   - Loading states on all async operations

4. **Accessibility**
   - High contrast colors
   - Large readable fonts (min 16px)
   - Clear labels
   - Keyboard navigation support

### Screen Layouts

#### 1. Home Screen (Dashboard)

```
┌─────────────────────────────────┐
│  Milk Delivery App       [User] │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │  TODAY'S SUMMARY          │ │
│  │  Delivered: ₹12,500       │ │
│  │  Collected: ₹10,200       │ │
│  │  Pending: ₹2,300          │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  QUICK ACTIONS            │ │
│  │  [Add Delivery]           │ │
│  │  [Collect Payment]        │ │
│  │  [View Reports]           │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  RECENT ACTIVITY          │ │
│  │  • Delivery to Shop A     │ │
│  │  • Payment from Shop B    │ │
│  │  • Delivery to Shop C     │ │
│  └───────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ [Home] [Delivery] [Pay] [More] │
└─────────────────────────────────┘
```

---

#### 2. Delivery Screen

```
┌─────────────────────────────────┐
│  Add Delivery           [Close] │
├─────────────────────────────────┤
│                                 │
│  Shop *                         │
│  ┌───────────────────────────┐ │
│  │ [Search shops...]   🔍    │ │
│  └───────────────────────────┘ │
│                                 │
│  Milk Type *                    │
│  ┌───────────────────────────┐ │
│  │ Smart - 26 (₹272)    ▼   │ │
│  └───────────────────────────┘ │
│                                 │
│  Quantity *                     │
│  ┌───────────────────────────┐ │
│  │  1         [-]  [1]  [+]  │ │
│  └───────────────────────────┘ │
│                                 │
│  Total Amount                   │
│  ┌───────────────────────────┐ │
│  │  ₹272.00 (auto-calculated)│ │
│  └───────────────────────────┘ │
│                                 │
│  Notes (Optional)               │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │    SAVE DELIVERY          │ │
│  └───────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ [Home] [Delivery] [Pay] [More] │
└─────────────────────────────────┘
```

---

#### 3. Collection Screen

```
┌─────────────────────────────────┐
│  Collection              [Date] │
├─────────────────────────────────┤
│  [All Shops] [Pending Only]    │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │ Jai Ambe Kirana           │ │
│  │ Total Pending: ₹1,544     │ │
│  │ Today: ₹544 | Old: ₹1,000 │ │
│  │ [Pay] [Pay Tomorrow]      │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Pune Fresh Dairy          │ │
│  │ Total Pending: ₹915       │ │
│  │ Today: ₹915 | Old: ₹0     │ │
│  │ [Pay] [Pay Tomorrow]      │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Banu Kirana              │ │
│  │ ✓ Fully Paid (₹272)       │ │
│  └───────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ [Home] [Delivery] [Pay] [More] │
└─────────────────────────────────┘
```

---

#### 4. Payment Modal

```
┌─────────────────────────────────┐
│  Collect Payment        [Close] │
├─────────────────────────────────┤
│                                 │
│  Shop: Jai Ambe Kirana          │
│                                 │
│  ┌───────────────────────────┐ │
│  │  PENDING BREAKDOWN        │ │
│  │  Today: ₹544              │ │
│  │  Older: ₹1,000            │ │
│  │  ─────────────────────    │ │
│  │  Total: ₹1,544            │ │
│  └───────────────────────────┘ │
│                                 │
│  Amount Collecting *            │
│  ┌───────────────────────────┐ │
│  │  ₹ [1544]                 │ │
│  │  [Pay Full] [Pay ₹500]    │ │
│  └───────────────────────────┘ │
│                                 │
│  Notes (Optional)               │
│  ┌───────────────────────────┐ │
│  │                           │ │
│  └───────────────────────────┘ │
│                                 │
│  ℹ Payment applied oldest first│
│                                 │
│  ┌───────────────────────────┐ │
│  │    COLLECT PAYMENT        │ │
│  └───────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

---

#### 5. Reports Screen

```
┌─────────────────────────────────┐
│  Reports                [Date]  │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │  DAILY SUMMARY            │ │
│  │  Total Delivered: ₹12,500 │ │
│  │  Total Collected: ₹10,200 │ │
│  │  Total Pending: ₹2,300    │ │
│  │  Collection Rate: 81.6%   │ │
│  │  Shops Served: 25         │ │
│  │  Deliveries: 45           │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │  TOP PENDING SHOPS        │ │
│  │  1. Shop A - ₹1,544       │ │
│  │  2. Shop B - ₹915         │ │
│  │  3. Shop C - ₹730         │ │
│  └───────────────────────────┘ │
│                                 │
│  [Export PDF] [Export CSV]     │
│                                 │
├─────────────────────────────────┤
│ [Home] [Delivery] [Pay] [More] │
└─────────────────────────────────┘
```

---

### UI Components Library

#### Using Shadcn/ui

- **Button** - Primary actions (Save, Collect Payment, etc.)
- **Input** - Text entry, number entry
- **Select** - Dropdowns (shop, milk type)
- **Card** - Shop cards, summary cards
- **Dialog** - Modals (payment modal, reset dialog)
- **Toast** - Success/error notifications
- **Table** - Reports, activity log
- **Tabs** - Filter tabs (All Shops, Pending Only)
- **Badge** - Status badges (Paid, Pending, Partial)
- **Skeleton** - Loading states

### Color Scheme

```css
/* Primary Colors */
--primary: #10b981;        /* Green - success, paid */
--primary-foreground: #fff;

/* Status Colors */
--success: #10b981;        /* Green - paid */
--warning: #f59e0b;        /* Orange - partial */
--danger: #ef4444;         /* Red - pending */
--info: #3b82f6;           /* Blue - info */

/* Neutrals */
--background: #ffffff;
--foreground: #0f172a;
--muted: #f1f5f9;
--muted-foreground: #64748b;
--border: #e2e8f0;

/* Text */
--text-primary: #0f172a;
--text-secondary: #64748b;
--text-muted: #94a3b8;
```

---

## Non-Functional Requirements

### Performance Requirements

| Metric | Target | Critical? |
|--------|--------|-----------|
| Page load time | < 2 seconds | ✅ Yes |
| Time to interactive | < 3 seconds | ✅ Yes |
| API response time | < 500ms | ✅ Yes |
| Database query time | < 200ms | ✅ Yes |
| Real-time update latency | < 1 second | ✅ Yes |
| Delivery entry time | < 30 seconds | ✅ Yes |
| Payment processing time | < 15 seconds | ✅ Yes |

### Reliability Requirements

| Metric | Target | Critical? |
|--------|--------|-----------|
| Uptime | 99.9% | ✅ Yes |
| Data accuracy | 100% | ✅ Yes |
| Transaction success rate | > 99.5% | ✅ Yes |
| Data backup frequency | Daily | ✅ Yes |
| Point-in-time recovery | Yes | ✅ Yes |

### Scalability Requirements

| Metric | Target |
|--------|--------|
| Concurrent users | 100+ |
| Daily deliveries | 1,000+ |
| Total shops | 500+ |
| Database size | Unlimited |
| API rate limit | 1,000 requests/min |

### Usability Requirements

| Requirement | Target |
|-------------|--------|
| Mobile screen support | 4-6 inch screens |
| Minimum touch target | 44×44 px |
| Font size (minimum) | 16px |
| One-hand operation | Yes |
| Offline capability | Future |
| Loading indicators | All async operations |

### Security Requirements

| Requirement | Status |
|-------------|--------|
| Authentication | Future (PIN-based) |
| Authorization | Future (Role-based) |
| Data encryption in transit | ✅ HTTPS |
| Data encryption at rest | ✅ Supabase default |
| Audit logging | ✅ All actions logged |
| Session management | Future |
| Input validation | ✅ Database + Frontend |

### Compatibility Requirements

| Platform | Support |
|----------|---------|
| Android (Chrome) | ✅ Primary |
| iOS (Safari) | ✅ Secondary |
| Desktop (Chrome) | ✅ Secondary |
| Internet Explorer | ❌ Not supported |
| Minimum Android version | 8.0+ |
| Minimum iOS version | 13+ |

### Backup & Recovery

| Requirement | Implementation |
|-------------|----------------|
| Database backup | Automated daily (Supabase) |
| Point-in-time recovery | Last 7 days |
| Backup retention | 30 days |
| Disaster recovery | Cross-region replication |
| Manual backup | Export to CSV |

---

## Success Metrics & KPIs

### Primary Metrics

#### 1. Financial Accuracy
**Target:** 100% payment tracking accuracy

**Measurement:**
```
Accuracy = 1 - (|Calculated_Pending - Actual_Pending| / Total_Delivered)
```

**Success Criteria:**
- Zero discrepancies for 30 consecutive days
- All payment amounts match delivery totals
- No pending payments lost during resets

---

#### 2. User Efficiency
**Target:** 75% reduction in task completion time

**Measurement:**
- Delivery entry time: From shop selection to save
- Payment processing time: From opening modal to confirmation
- Daily reset time: From initiation to completion

**Success Criteria:**
- Delivery entry: ≤ 30 seconds (vs 2 minutes manual)
- Payment processing: ≤ 15 seconds (vs 1 minute manual)
- Daily reset: ≤ 10 seconds (vs 5 minutes manual)

---

#### 3. System Reliability
**Target:** 99.9% uptime

**Measurement:**
```
Uptime = (Total_Time - Downtime) / Total_Time × 100
```

**Success Criteria:**
- < 43 minutes downtime per month
- Zero data loss incidents
- < 0.1% failed transactions

---

### Secondary Metrics

#### 4. User Satisfaction
**Target:** 95%+ satisfaction score

**Measurement:**
- Weekly user surveys (1-5 stars)
- Feature request tracking
- Bug report frequency

**Success Criteria:**
- Average rating > 4.75/5
- < 5 bug reports per month
- < 10% feature request overlap

---

#### 5. Collection Rate
**Target:** Improve by 20%

**Measurement:**
```
Collection_Rate = Total_Collected / Total_Delivered × 100
```

**Success Criteria:**
- Daily collection rate > 80%
- Weekly collection rate > 95%
- Monthly collection rate > 99%

---

#### 6. Pending Payment Aging
**Target:** 90% collected within 7 days

**Measurement:**
```
Age_Distribution:
- 0-7 days: 90%
- 8-15 days: 8%
- 15+ days: 2%
```

**Success Criteria:**
- < 10% pending beyond 7 days
- < 2% pending beyond 30 days
- Zero pending beyond 90 days

---

### Dashboard Metrics (Real-time)

#### Daily
- Total delivered today
- Total collected today
- Collection rate today
- Number of pending shops
- Average delivery value
- Average payment value

#### Weekly
- Weekly delivery trend
- Weekly collection trend
- Top 10 shops by delivery volume
- Top 10 shops by pending amount
- Delivery boy performance
- Collection staff performance

#### Monthly
- Monthly financial summary
- Month-over-month growth
- Customer payment reliability
- Product mix analysis
- Route efficiency analysis

---

## Risk Assessment & Mitigation

### Technical Risks

#### Risk 1: Data Loss During Daily Reset
**Likelihood:** Medium  
**Impact:** Critical  
**Mitigation:**
- ✅ Transaction-safe reset function
- ✅ Comprehensive testing before production
- ✅ Daily database backups
- ✅ Point-in-time recovery capability
- ✅ Activity logging for all resets

---

#### Risk 2: FIFO Payment Logic Errors
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- ✅ Extensive unit testing
- ✅ Integration testing with real data
- ✅ 3-day workflow testing
- ✅ Edge case testing
- ✅ Manual verification before production

---

#### Risk 3: Real-time Sync Failures
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**
- ✅ Supabase handles real-time infrastructure
- ✅ Fallback to polling if WebSocket fails
- ✅ Optimistic UI updates
- ✅ Retry logic on failed updates

---

#### Risk 4: Poor Mobile Performance
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Image optimization
- ✅ Memoization
- ✅ Performance monitoring

---

### Business Risks

#### Risk 5: User Adoption Resistance
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- ✅ Simple, intuitive UI
- ✅ Training sessions for staff
- ✅ Gradual rollout (pilot → full)
- ✅ Continuous support
- ✅ Collect and act on feedback

---

#### Risk 6: Internet Connectivity Issues
**Likelihood:** High  
**Impact:** Medium  
**Mitigation:**
- ✅ Mobile-first design (small payloads)
- ✅ Works on 3G networks
- 🔮 Future: Offline capability
- 🔮 Future: Queue pending actions

---

#### Risk 7: Hardware Limitations
**Likelihood:** Medium  
**Impact:** Low  
**Mitigation:**
- ✅ Support budget Android phones
- ✅ Optimized for 4-6 inch screens
- ✅ Minimal storage requirements
- ✅ Low battery consumption

---

### Operational Risks

#### Risk 8: Data Entry Errors
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- ✅ Input validation (frontend + backend)
- ✅ Auto-calculated amounts
- ✅ Confirmation dialogs for critical actions
- ✅ Ability to edit recent entries
- ✅ Audit log for all actions

---

#### Risk 9: Payment Disputes
**Likelihood:** High  
**Impact:** Medium  
**Mitigation:**
- ✅ Complete audit trail
- ✅ Timestamps on all actions
- ✅ Payment receipts (future)
- ✅ Historical reports
- ✅ Shop-wise financial summaries

---

#### Risk 10: Unauthorized Access
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- 🔮 Future: PIN-based authentication
- 🔮 Future: Role-based access control
- ✅ Activity logging
- ✅ Secure HTTPS connections
- ✅ Supabase security features

---

## Development Roadmap

### Phase 1: Database Setup ✅
**Duration:** 1 week  
**Status:** Completed

**Deliverables:**
- ✅ All tables created
- ✅ Constraints and indexes
- ✅ Sample data inserted
- ✅ PostgreSQL functions created
- ✅ Testing and verification

---

### Phase 2: Core Frontend Development 🚧
**Duration:** 2 weeks  
**Status:** In Progress

**Deliverables:**
- ✅ Project setup (React + Vite + TypeScript)
- ✅ Supabase integration
- ✅ Core components
- ✅ Delivery management
- ✅ Payment collection
- 🚧 Reports and analytics
- 🚧 Settings and admin

---

### Phase 3: Testing & Bug Fixes
**Duration:** 1 week  
**Status:** Pending

**Deliverables:**
- 3-day workflow testing
- FIFO payment logic testing
- Edge case testing
- Data integrity verification
- Performance testing
- Bug fixes

---

### Phase 4: UI/UX Polish
**Duration:** 1 week  
**Status:** Pending

**Deliverables:**
- Mobile responsiveness
- Loading states
- Error handling
- Accessibility improvements
- Performance optimization
- User feedback integration

---

### Phase 5: Production Deployment
**Duration:** 3 days  
**Status:** Pending

**Deliverables:**
- Production build
- Vercel deployment
- Supabase production setup
- Environment variables
- Smoke testing
- Go-live

---

### Future Enhancements (Post-Launch)

#### Phase 6: Authentication & Security
- PIN-based login
- Role-based access control
- Row Level Security (RLS)
- Session management
- Activity monitoring

#### Phase 7: Advanced Features
- Offline mode
- Payment receipts (PDF)
- SMS notifications
- WhatsApp integration
- Voice notes
- Photo attachments

#### Phase 8: Business Intelligence
- Advanced analytics
- Predictive insights
- Customer segmentation
- Route optimization
- Inventory forecasting
- Revenue projections

#### Phase 9: Multi-Business Support
- Multiple business accounts
- Shared infrastructure
- Consolidated reporting
- Franchise management

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| **FIFO** | First In, First Out - payment method where oldest deliveries are paid first |
| **Pending** | Delivery with zero payment (payment_amount = 0) |
| **Partial** | Delivery with some payment (0 < payment_amount < total_amount) |
| **Paid** | Delivery fully paid (payment_amount = total_amount) |
| **Daily Reset** | End-of-day process that archives paid deliveries and preserves pending |
| **Collection View** | Screen showing all shops with pending amounts for payment collection |
| **PWA** | Progressive Web App - web app that works like a native app |
| **ACID** | Atomicity, Consistency, Isolation, Durability - database transaction properties |
| **RLS** | Row Level Security - database-level access control |
| **MCP** | Model Context Protocol - tools for AI assistance |

---

### B. Sample Data

#### Sample Shops
```
1. Jai Ambe Kirana - Route 1
2. Pune Fresh Dairy - Route 1
3. Banu Kirana - Route 2
4. Shivaji Stores - Route 2
5. Modern Bakery - Route 3
```

#### Sample Milk Types
```
1. Smart - 26 (₹272.00 per packet)
2. Vimla (₹185.00 per packet)
3. Full Cream (₹320.00 per packet)
```

#### Sample Delivery Boys
```
1. Ramesh Kumar
2. Suresh Patil
3. Vijay Singh
```

---

### C. API Endpoints

#### Supabase RPC Functions

```typescript
// Get collection view
const { data } = await supabase
  .rpc('get_collection_view', { p_date: '2025-10-27' })

// Process payment
const { data } = await supabase
  .rpc('process_shop_payment', {
    p_shop_id: 'uuid',
    p_amount: 500,
    p_collected_by: 'uuid',
    p_payment_date: '2025-10-27',
    p_notes: 'Partial payment'
  })

// Daily reset
const { data } = await supabase
  .rpc('process_daily_reset', { p_date: '2025-10-27' })

// Shop balance
const { data } = await supabase
  .rpc('get_shop_balance', { p_shop_id: 'uuid' })
```

---

### D. Database Schema Reference

See: `database/schema.sql`

---

### E. Environment Variables

```bash
# Required
VITE_REACT_APP_SUPABASE_URL=https://your-project.supabase.co
VITE_REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Optional
VITE_REACT_APP_DEFAULT_PIN=6969
VITE_REACT_APP_SESSION_TIMEOUT=1800000
VITE_REACT_APP_MAX_LOGIN_ATTEMPTS=3
VITE_REACT_APP_LOCKOUT_DURATION=300000
```

---

### F. Related Documents

- **PROJECT_PLAN.md** - Detailed project plan with tasks
- **TASKS.md** - Task tracking and progress
- **database/README.md** - Database documentation
- **database/API_REFERENCE.md** - Complete API reference
- **DEPLOYMENT_GUIDE.md** - Deployment instructions
- **ENVIRONMENT_SETUP.md** - Local setup guide

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-27 | Product Team | Initial version |

---

**END OF DOCUMENT**

