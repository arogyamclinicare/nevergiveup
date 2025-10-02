# MILK DELIVERY APP - PROJECT PLAN

## PROJECT UNDERSTANDING

We are building an enterprise-grade milk delivery management system to replace a fundamentally broken implementation. This is a financial application that tracks daily milk deliveries, payment collection, and business reporting.

**Critical Problem We're Solving:**
The previous implementation had severe data integrity issues:
- Payment data inconsistencies between views
- Payment processing not working
- Wrong shop data loading
- Duplicate database columns causing confusion
- Pending payments being deleted instead of preserved
- Business logic scattered between frontend and backend

**What We're Building:**
A mobile-first Progressive Web App with 3 user roles:
1. **Delivery Boys** - Record daily milk deliveries to shops
2. **Collection Staff** - Collect payments (full/partial/mark pending)
3. **Business Owner** - View reports, manage system, perform daily resets

**Core Business Logic:**
- Daily milk deliveries with multiple products (milk types) at different prices
- Payment collection with 3 states: fully paid, partially paid, pending
- FIFO (First In, First Out) payment processing - oldest deliveries get paid first
- Multi-day pending accumulation - unpaid amounts carry forward across days
- Daily reset that preserves pending/partial payments by moving them to history
- Real-time financial reporting with complete audit trail

---

## ARCHITECTURE DECISIONS

### Database: Supabase (PostgreSQL)
**Why:**
- Already configured with MCP integration
- Enterprise-grade PostgreSQL for financial data integrity
- Real-time subscriptions for instant UI updates
- Native support for complex business logic via PostgreSQL functions
- ACID transactions ensure every rupee is accounted for

### Backend Logic: PostgreSQL Functions
**Why:**
- Business logic in database ensures data consistency
- Single source of truth - no sync issues between frontend/backend
- Atomic operations with transaction support
- Complex calculations (FIFO payment processing) done efficiently in SQL
- Frontend becomes a "thin client" - just displays data

**Critical Functions:**
1. `get_collection_view(date)` - Aggregates all pending amounts per shop
2. `process_shop_payment(...)` - FIFO payment processing with ACID guarantees
3. `reset_daily_data(date)` - Preserves pending deliveries in history
4. `get_shop_balance(shop_id)` - Complete financial summary

### Frontend: React 18 + TypeScript + Vite
**Why:**
- Type safety with TypeScript prevents runtime errors
- Vite for fast development and optimized builds
- React 18 for modern features (concurrent rendering, automatic batching)
- Mobile-first responsive design

**State Management:**
- Supabase real-time subscriptions (no need for Redux/Zustand)
- React Query for caching and optimistic updates
- Local state with useState/useReducer for UI-only state

**UI Components:**
- Tailwind CSS for utility-first styling
- Shadcn/ui for accessible, customizable components
- Mobile-first design patterns

### Data Integrity Strategy
**Database Constraints:**
- CHECK constraints on amounts (must be positive, payment ≤ total)
- FOREIGN KEY constraints for referential integrity
- UNIQUE constraints on shop names, milk type names
- NOT NULL on critical fields
- Composite indexes for query performance

**Transaction Handling:**
- All payment processing in single transaction
- Rollback on any error
- No partial state changes

**Validation:**
- Database-level validation (constraints)
- Function-level validation (input checks)
- Frontend validation (user experience)

### Data Flow Architecture
```
User Action (Frontend)
    ↓
Supabase Client Call
    ↓
PostgreSQL Function (Business Logic)
    ↓
Database Update (ACID Transaction)
    ↓
Real-time Subscription Trigger
    ↓
Frontend Auto-Update (No Manual Refresh)
```

**Key Principle:** Frontend never calculates financial data. It only:
1. Sends user actions to database
2. Receives computed results
3. Displays data
4. Handles UI state

---

## PHASE 1: DATABASE SCHEMA SETUP

### 1.1 Core Tables Creation
- [ ] **Task 1.1.1:** Create `shops` table
  - Columns: id, name (unique), address, phone, owner_name, route_number, is_active, timestamps
  - Constraints: UNIQUE(name), NOT NULL on name
  
- [ ] **Task 1.1.2:** Create `delivery_boys` table
  - Columns: id, name, phone, is_active, timestamps
  - Constraints: NOT NULL on name
  
- [ ] **Task 1.1.3:** Create `milk_types` table
  - Columns: id, name (unique), price_per_packet, is_active, timestamps
  - Constraints: UNIQUE(name), CHECK(price_per_packet > 0)

### 1.2 Critical Financial Table
- [ ] **Task 1.2.1:** Create `deliveries` table (MOST CRITICAL)
  - Columns: id, shop_id, delivery_boy_id, delivery_date, milk_type_id, quantity, total_amount, payment_status, payment_amount, notes, timestamps
  - Constraints:
    - FOREIGN KEYs to shops, delivery_boys, milk_types
    - CHECK(quantity > 0)
    - CHECK(total_amount > 0)
    - CHECK(payment_amount >= 0 AND payment_amount <= total_amount)
    - CHECK(payment_status IN ('paid', 'partial', 'pending'))
  - Indexes:
    - idx_deliveries_shop_date (shop_id, delivery_date DESC)
    - idx_deliveries_date (delivery_date DESC)
    - idx_deliveries_pending (payment_status) WHERE payment_status != 'paid'

### 1.3 Supporting Tables
- [ ] **Task 1.3.1:** Create `payments` table
  - Tracks individual payment transactions
  - Links to multiple deliveries via UUID array
  
- [ ] **Task 1.3.2:** Create `pending_payments_tracking` table
  - Tracks pending payment notes/reasons
  
- [ ] **Task 1.3.3:** Create `activity_log` table
  - Complete audit trail of all actions
  
- [ ] **Task 1.3.4:** Create `daily_notes` table
  - Delivery boy daily notes

### 1.4 Sample Data Insertion
- [ ] **Task 1.4.1:** Insert sample shops
  - jai ambe kirana
  - Pune Fresh Dairy
  - banu kirana
  
- [ ] **Task 1.4.2:** Insert sample delivery boys
  - At least 2-3 delivery boys
  
- [ ] **Task 1.4.3:** Insert milk types
  - Smart - 26: ₹272.00
  - Vimla: ₹185.00

### 1.5 Verification
- [ ] **Task 1.5.1:** Verify all tables created using `mcp_supabase_list_tables`
- [ ] **Task 1.5.2:** Verify sample data inserted using `mcp_supabase_execute_sql`
- [ ] **Task 1.5.3:** Run security advisor check using `mcp_supabase_get_advisors`

---

## PHASE 2: POSTGRESQL FUNCTIONS

### 2.1 Collection View Function
- [ ] **Task 2.1.1:** Create `get_collection_view(p_date DATE)` function
  - Calculate per shop:
    - today_delivered (deliveries on p_date)
    - today_paid (payments on p_date)
    - today_pending (today_delivered - today_paid)
    - historical_pending (unpaid from dates < p_date)
    - pending_tracking (from pending_payments_tracking table)
    - total_pending (sum of all pending)
    - overall_status (paid/partial/pending)
  - Return: All shops with deliveries OR pending amounts
  - Sort: By total_pending DESC
  
- [ ] **Task 2.1.2:** Test `get_collection_view` with sample data
  - Verify calculations are correct
  - Verify sorting works
  - Test with multiple dates

### 2.2 Payment Processing Function (MOST CRITICAL)
- [ ] **Task 2.2.1:** Create `process_shop_payment(...)` function
  - Parameters: shop_id, amount, delivery_boy_id, payment_date, notes
  - Implementation:
    1. Validate amount > 0
    2. Create payment record
    3. Get all pending deliveries (ORDER BY delivery_date ASC, created_at ASC)
    4. FIFO loop: Apply payment to oldest first
    5. Update delivery payment_amount and status
    6. Track affected delivery IDs
    7. Delete from pending_payments_tracking
    8. Log activity
  - Return: JSON with success, payment details, affected deliveries
  
- [ ] **Task 2.2.2:** Test FIFO payment processing
  - Test: Pay full amount across multiple deliveries
  - Test: Pay partial amount - verify oldest paid first
  - Test: Pay exact amount for one delivery
  - Test: Error handling for invalid amounts

### 2.3 Daily Reset Function
- [ ] **Task 2.3.1:** Create `reset_daily_data(p_date DATE)` function
  - Logic:
    - IF payment_status = 'paid': DELETE
    - IF payment_status IN ('pending', 'partial'): Move to history (delivery_date = p_date - 1 day)
    - DELETE daily_notes for p_date
    - Log reset activity
  - Return: JSON with counts (deleted, moved, notes deleted)
  
- [ ] **Task 2.3.2:** Test reset function
  - Test: Reset with mix of paid/pending/partial
  - Test: Verify paid deliveries deleted
  - Test: Verify pending deliveries moved to history
  - Test: Verify data integrity after reset

### 2.4 Shop Balance Function
- [ ] **Task 2.4.1:** Create `get_shop_balance(p_shop_id UUID)` function
  - Calculate:
    - total_delivered, total_paid, total_pending (all time)
    - today_delivered, today_paid, today_pending
    - historical_pending
    - deliveries_count, pending_deliveries_count
    - last_delivery_date
  - Return: Complete financial summary
  
- [ ] **Task 2.4.2:** Test shop balance function
  - Test with shop having multiple deliveries
  - Test with shop having pending amounts
  - Verify all calculations are accurate

### 2.5 Function Verification
- [ ] **Task 2.5.1:** Run all functions with test data
- [ ] **Task 2.5.2:** Verify transaction rollback on errors
- [ ] **Task 2.5.3:** Performance test with large datasets

---

## PHASE 3: FRONTEND DEVELOPMENT

### 3.1 Project Setup
- [ ] **Task 3.1.1:** Initialize Vite + React + TypeScript project
- [ ] **Task 3.1.2:** Install dependencies
  - @supabase/supabase-js
  - @tanstack/react-query
  - tailwindcss + shadcn/ui
  - react-router-dom
  - date-fns (date handling)
  
- [ ] **Task 3.1.3:** Configure Tailwind CSS
- [ ] **Task 3.1.4:** Setup Shadcn/ui components
- [ ] **Task 3.1.5:** Configure environment variables

### 3.2 Supabase Integration
- [ ] **Task 3.2.1:** Create Supabase client configuration
- [ ] **Task 3.2.2:** Create TypeScript types from database schema
- [ ] **Task 3.2.3:** Create service layer for database operations
  - deliveriesService.ts
  - paymentsService.ts
  - reportsService.ts
  - shopsService.ts
  
- [ ] **Task 3.2.4:** Setup real-time subscriptions
  - Subscribe to deliveries table
  - Subscribe to payments table
  - Auto-refresh UI on changes

### 3.3 Core Components
- [ ] **Task 3.3.1:** Create Layout components
  - AppLayout (header, navigation, content)
  - TabNavigation (Delivery, Collection, Reports, Chat, Settings)
  
- [ ] **Task 3.3.2:** Create Delivery components
  - ShopList (all shops)
  - DeliveryForm (add delivery to shop)
  - ProductSelector (milk type + quantity)
  
- [ ] **Task 3.3.3:** Create Collection components
  - CollectionView (list of shops with pending amounts)
  - PaymentModal (payment processing)
  - PendingList (all pending shops)
  
- [ ] **Task 3.3.4:** Create Reports components
  - DailyReport (financial summary)
  - ShopDetails (individual shop breakdown)
  
- [ ] **Task 3.3.5:** Create Chat/Activity Log components
  - ActivityFeed (timeline of all actions)
  
- [ ] **Task 3.3.6:** Create Settings components
  - ResetDialog (daily reset with confirmation)

### 3.4 State Management
- [ ] **Task 3.4.1:** Setup React Query
  - Query keys configuration
  - Cache invalidation strategy
  
- [ ] **Task 3.4.2:** Create custom hooks
  - useDeliveries
  - useCollectionView
  - useShopBalance
  - usePaymentProcessing
  
- [ ] **Task 3.4.3:** Error handling
  - Error boundaries
  - Toast notifications
  - Retry logic

### 3.5 UI/UX Polish
- [ ] **Task 3.5.1:** Mobile-first responsive design
- [ ] **Task 3.5.2:** Loading states (skeletons)
- [ ] **Task 3.5.3:** Success/error feedback
- [ ] **Task 3.5.4:** Form validation
- [ ] **Task 3.5.5:** Accessibility (ARIA labels, keyboard navigation)

---

## PHASE 4: COMPREHENSIVE TESTING

### 4.1 3-Day Workflow Test
- [ ] **Task 4.1.1:** Day 1 - Add deliveries
  - Add 3 deliveries to different shops
  - Verify all saved correctly
  
- [ ] **Task 4.1.2:** Day 1 - Process payments
  - Full payment for 1 shop
  - Partial payment for 1 shop
  - Mark pending for 1 shop
  - Verify collection view updates
  
- [ ] **Task 4.1.3:** Day 1 - Daily reset
  - Run reset function
  - Verify paid deleted, pending preserved
  
- [ ] **Task 4.1.4:** Day 2 - Add new deliveries
  - Add deliveries to same shops
  - Verify pending amounts accumulated
  
- [ ] **Task 4.1.5:** Day 2 - Pay accumulated amounts
  - Pay full amount spanning multiple days
  - Verify FIFO processing
  
- [ ] **Task 4.1.6:** Day 3 - Continue workflow
  - Test multi-day scenarios

### 4.2 FIFO Payment Logic Test
- [ ] **Task 4.2.1:** Create shop with 3 deliveries on different dates
- [ ] **Task 4.2.2:** Pay amount that covers oldest 2 deliveries
- [ ] **Task 4.2.3:** Verify oldest 2 fully paid, 3rd still pending
- [ ] **Task 4.2.4:** Pay remaining amount
- [ ] **Task 4.2.5:** Verify all deliveries fully paid

### 4.3 Edge Cases
- [ ] **Task 4.3.1:** Test: Pay exact total amount
- [ ] **Task 4.3.2:** Test: Pay 1 rupee less than total
- [ ] **Task 4.3.3:** Test: Try to pay more than total (should error)
- [ ] **Task 4.3.4:** Test: Try to pay negative amount (should error)
- [ ] **Task 4.3.5:** Test: Reset with no deliveries
- [ ] **Task 4.3.6:** Test: Shop with 10+ pending deliveries
- [ ] **Task 4.3.7:** Test: Multiple payments same day to same shop

### 4.4 Data Integrity Verification
- [ ] **Task 4.4.1:** Verify: Every rupee accounted for
  - Sum of all total_amounts = Sum of all payment_amounts + Sum of all pending
  
- [ ] **Task 4.4.2:** Verify: No negative amounts anywhere
- [ ] **Task 4.4.3:** Verify: No payment_amount > total_amount
- [ ] **Task 4.4.4:** Verify: Status always matches payment_amount
- [ ] **Task 4.4.5:** Verify: Pending deliveries never deleted

### 4.5 Performance Testing
- [ ] **Task 4.5.1:** Test with 100 shops
- [ ] **Task 4.5.2:** Test with 1000 deliveries
- [ ] **Task 4.5.3:** Test collection view query speed
- [ ] **Task 4.5.4:** Test payment processing with 50 pending deliveries

---

## PHASE 5: FINAL POLISH & DEPLOYMENT

### 5.1 Code Quality
- [ ] **Task 5.1.1:** Remove any console.logs
- [ ] **Task 5.1.2:** Add code comments for complex logic
- [ ] **Task 5.1.3:** Ensure consistent code formatting
- [ ] **Task 5.1.4:** Remove unused imports/variables

### 5.2 Documentation
- [ ] **Task 5.2.1:** Create README.md with setup instructions
- [ ] **Task 5.2.2:** Document all PostgreSQL functions
- [ ] **Task 5.2.3:** Create user guide for each role

### 5.3 Deployment Preparation
- [ ] **Task 5.3.1:** Build production bundle
- [ ] **Task 5.3.2:** Test production build locally
- [ ] **Task 5.3.3:** Verify Supabase connection in production
- [ ] **Task 5.3.4:** Final smoke test

---

## CURRENT STATUS

**Current Phase:** PHASE 1 - Database Setup

**Current Task:** Creating TASKS.md and beginning database schema creation

**Completed:** 0/40 tasks

**Blockers:** None - Ready to build!

## FINAL DECISIONS CONFIRMED ✅

1. **Historical Data**: Keep ALL records forever (never delete paid deliveries)
2. **Reports Detail**: Full detail - products, quantities, timestamps, who collected
3. **Task Granularity**: Medium (30-40 tasks)
4. **No Manual Pending Table**: Using shop_pending_history for all old pending
5. **FIFO**: Hardcoded, automatic (oldest first)
6. **Mobile-First**: Phone screens only
7. **UI Components**: Research and install free MCPs

---

## CRITICAL SUCCESS CRITERIA CHECKLIST

### Must Work Perfectly:
- [ ] Add delivery → Shows in database immediately
- [ ] Process full payment → Status changes to 'paid'
- [ ] Process partial payment → Status 'partial', correct remaining amount shown
- [ ] Mark "Pay Tomorrow" → Creates pending record correctly
- [ ] Multi-day pending → Accumulates correctly across days
- [ ] FIFO payment → Always pays oldest deliveries first
- [ ] Collection view → Shows correct pending amounts for all shops
- [ ] Reset → Deletes paid, preserves pending/partial
- [ ] Reports → Shows accurate financial data
- [ ] Real-time updates → UI auto-refreshes without manual refresh
- [ ] Data integrity → Every rupee accounted for, no data loss

---

## NOTES & DECISIONS

### Key Decisions Made:
1. **Single payment_amount column** - No paid_amount column to avoid confusion
2. **Business logic in PostgreSQL** - Frontend is thin client
3. **FIFO hardcoded** - No configuration, always oldest first
4. **No authentication** - Disabled for development phase
5. **Real-time subscriptions** - For instant UI updates

### Risk Mitigation:
- Database constraints prevent invalid data
- Transactions ensure atomic operations
- Comprehensive testing before moving phases
- MCP tools for verification at each step

### Performance Optimizations:
- Indexes on frequently queried columns
- PostgreSQL functions for complex calculations
- React Query for caching
- Mobile-first design (smaller payloads)

