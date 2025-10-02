# MILK DELIVERY APP - DETAILED TASK LIST

**Last Updated:** October 1, 2025  
**Total Tasks:** 40  
**Completed:** 28 ✅  
**In Progress:** 0  
**Remaining:** 12

---

## PHASE 1: DATABASE SETUP (8 Tasks)

### ✅ Task 1.1: Create `shops` Table
**Status:** ✅ COMPLETE  
**Description:** Create shop master data table with all required fields  
**Verification:** Run `mcp_supabase_list_tables` and confirm shops table exists  
**SQL:**
```sql
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  owner_name TEXT,
  route_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### ✅ Task 1.2: Create `delivery_boys` Table
**Status:** ✅ COMPLETE  
**Description:** Create delivery boy master data table  
**Verification:** Query table and confirm structure  
**SQL:**
```sql
CREATE TABLE delivery_boys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### ✅ Task 1.3: Create `milk_types` Table
**Status:** ✅ COMPLETE  
**Description:** Create product catalog table for 6 milk products  
**Verification:** Insert 6 products and query to confirm prices  
**Products to Insert:**
- Smart - 26: ₹272.00
- Tone milk 180ml: ₹10.50
- DTM 180ml: ₹9.00
- Vikas gold: ₹35.50
- Dahi 180ml: ₹18.00
- Vikas Tak: ₹15.00

**SQL:**
```sql
CREATE TABLE milk_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  price_per_packet NUMERIC NOT NULL CHECK (price_per_packet > 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### ✅ Task 1.4: Create `deliveries` Table (CRITICAL)
**Status:** ✅ COMPLETE  
**Description:** Create main deliveries table - MOST IMPORTANT TABLE  
**Verification:** Check all constraints and indexes are created  
**Critical Features:**
- Stores ALL deliveries (active + archived)
- Never deletes unpaid records
- Has is_archived flag for reset
- Multiple products per delivery (JSON or separate table)

**SQL:**
```sql
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  delivery_boy_id UUID NOT NULL REFERENCES delivery_boys(id),
  delivery_date DATE NOT NULL,
  products JSONB NOT NULL, -- [{milk_type_id, quantity, price, subtotal}]
  total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
  payment_amount NUMERIC NOT NULL DEFAULT 0 CHECK (payment_amount >= 0 AND payment_amount <= total_amount),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'partial', 'pending')),
  is_archived BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CRITICAL INDEXES
CREATE INDEX idx_deliveries_shop_date ON deliveries(shop_id, delivery_date DESC);
CREATE INDEX idx_deliveries_date ON deliveries(delivery_date DESC);
CREATE INDEX idx_deliveries_active ON deliveries(is_archived) WHERE is_archived = false;
CREATE INDEX idx_deliveries_pending ON deliveries(payment_status) WHERE payment_status != 'paid';
```

---

### ✅ Task 1.5: Create `shop_pending_history` Table
**Status:** ✅ COMPLETE  
**Description:** Quick lookup table for old pending amounts  
**Verification:** Test insert and query  
**SQL:**
```sql
CREATE TABLE shop_pending_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  original_delivery_id UUID REFERENCES deliveries(id),
  original_date DATE NOT NULL,
  pending_amount NUMERIC NOT NULL CHECK (pending_amount > 0),
  note TEXT DEFAULT 'Yesterday''s pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pending_shop ON shop_pending_history(shop_id);
CREATE INDEX idx_pending_date ON shop_pending_history(original_date DESC);
```

---

### ✅ Task 1.6: Create `payments` Table
**Status:** ✅ COMPLETE  
**Description:** Payment transaction log  
**Verification:** Test insert payment record  
**SQL:**
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  delivery_boy_id UUID REFERENCES delivery_boys(id),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_type TEXT DEFAULT 'collection',
  applied_to_deliveries JSONB, -- [{delivery_id, amount_applied}]
  collected_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_shop ON payments(shop_id);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);
```

---

### ✅ Task 1.7: Create `activity_log` Table
**Status:** ✅ COMPLETE  
**Description:** Complete audit trail of all actions  
**Verification:** Insert test activity and query  
**SQL:**
```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id),
  delivery_boy_id UUID REFERENCES delivery_boys(id),
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'delivery_added', 'payment_collected', 'payment_partial', 
    'payment_pending', 'reset_daily', 'delivery_updated'
  )),
  message TEXT NOT NULL,
  amount NUMERIC,
  delivery_date DATE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_date ON activity_log(created_at DESC);
CREATE INDEX idx_activity_shop ON activity_log(shop_id);
```

---

### ✅ Task 1.8: Insert Sample Data
**Status:** ✅ COMPLETE  
**Description:** Insert test shops, delivery boys, and products  
**Verification:** Query each table and confirm data exists  
**Sample Data:**

**Shops:**
- jai ambe kirana
- Pune Fresh Dairy
- banu kirana

**Delivery Boys:**
- Raj Kumar
- Amit Sharma

**Products:** (All 6 from Task 1.3)

**SQL:**
```sql
-- Insert sample shops
INSERT INTO shops (name, address, phone, owner_name) VALUES
  ('jai ambe kirana', 'Shop 123, MG Road', '9876543210', 'Ramesh Patel'),
  ('Pune Fresh Dairy', 'Shop 456, FC Road', '9876543211', 'Suresh Kumar'),
  ('banu kirana', 'Shop 789, JM Road', '9876543212', 'Banu Devi');

-- Insert delivery boys
INSERT INTO delivery_boys (name, phone) VALUES
  ('Raj Kumar', '9123456789'),
  ('Amit Sharma', '9123456790');

-- Insert milk products
INSERT INTO milk_types (name, price_per_packet) VALUES
  ('Smart - 26', 272.00),
  ('Tone milk 180ml', 10.50),
  ('DTM 180ml', 9.00),
  ('Vikas gold', 35.50),
  ('Dahi 180ml', 18.00),
  ('Vikas Tak', 15.00);
```

---

## PHASE 2: POSTGRESQL FUNCTIONS (5 Tasks)

### ✅ Task 2.1: Create `add_delivery()` Function
**Status:** ✅ COMPLETE  
**Description:** Function to add delivery with products  
**Verification:** Call function with test data, verify delivery inserted  
**Inputs:**
- shop_id UUID
- delivery_boy_id UUID
- products JSONB (array of {milk_type_id, quantity})
- delivery_date DATE
- notes TEXT

**Returns:** Delivery ID + total amount calculated

---

### ✅ Task 2.2: Create `get_collection_view()` Function
**Status:** ✅ COMPLETE  
**Description:** Get all shops with pending amounts for a date  
**Verification:** Call with test date, verify totals are correct  
**Logic:**
- Get today's deliveries (not archived)
- Get old pending from shop_pending_history
- Calculate total pending per shop
- Sort by biggest pending first

**Returns:**
```json
{
  "shop_id": "uuid",
  "shop_name": "jai ambe kirana",
  "today_delivered": 500.00,
  "today_paid": 0.00,
  "old_pending": 1300.00,
  "total_pending": 1800.00,
  "status": "pending"
}
```

---

### ✅ Task 2.3: Create `process_payment()` Function (CRITICAL)
**Status:** ✅ COMPLETE  
**Description:** FIFO payment processing - oldest pending paid first  
**Verification:** Test with multiple pending deliveries, verify FIFO  
**Inputs:**
- shop_id UUID
- amount NUMERIC
- collected_by TEXT
- payment_date DATE
- notes TEXT

**FIFO Logic:**
1. Get all pending from shop_pending_history (oldest first)
2. Apply payment to pending_history first
3. Then get deliveries (oldest first)
4. Apply remaining to deliveries
5. Update payment_amount and status
6. Create payment record
7. Log activity

**Returns:**
```json
{
  "success": true,
  "payment_id": "uuid",
  "amount_paid": 1300.00,
  "applied_to_history": 1000.00,
  "applied_to_deliveries": 300.00,
  "affected_records": ["uuid1", "uuid2"]
}
```

---

### ✅ Task 2.4: Create `reset_daily_data()` Function
**Status:** ✅ COMPLETE  
**Description:** Daily reset - archive deliveries, preserve unpaid  
**Verification:** Test reset, verify paid archived, unpaid moved to history  
**Inputs:**
- reset_date DATE

**Logic:**
1. Find all deliveries WHERE delivery_date = reset_date
2. For each delivery:
   - IF payment_status = 'paid': Mark is_archived = true
   - IF payment_status IN ('pending', 'partial'):
     - Mark is_archived = true
     - INSERT into shop_pending_history (amount remaining)
3. Log reset activity

**Returns:**
```json
{
  "success": true,
  "archived_paid": 5,
  "moved_to_pending": 3,
  "total_pending_amount": 2500.00
}
```

---

### ✅ Task 2.5: Create `get_shop_balance()` Function
**Status:** ✅ COMPLETE  
**Description:** Complete financial summary for one shop  
**Verification:** Test with shop having multiple deliveries  
**Inputs:**
- shop_id UUID

**Returns:**
```json
{
  "shop_id": "uuid",
  "shop_name": "jai ambe kirana",
  "total_delivered": 5000.00,
  "total_paid": 3200.00,
  "total_pending": 1800.00,
  "today_delivered": 500.00,
  "today_paid": 0.00,
  "old_pending": 1300.00,
  "deliveries_count": 10,
  "pending_deliveries_count": 3,
  "last_delivery_date": "2025-10-01"
}
```

---

## PHASE 3: UI COMPONENT SETUP (4 Tasks)

### ✅ Task 3.1: Research and Install UI MCPs
**Status:** ✅ COMPLETE (Using standard Shadcn/ui CLI - no MCP needed)  
**Description:** Find and install free MCPs for UI components  
**Research:**
- Shadcn/ui MCP (if available)
- Tailwind CSS utilities MCP
- Mobile UI component libraries
- Form component MCPs

**Install:** Add to MCP config and test

---

### ✅ Task 3.2: Initialize Vite + React + TypeScript Project
**Status:** ✅ COMPLETE  
**Description:** Setup frontend project structure  
**Verification:** Run dev server and see default page  
**Commands:**
```bash
npm create vite@latest milk-delivery-app -- --template react-ts
cd milk-delivery-app
npm install
```

---

### ✅ Task 3.3: Configure Tailwind CSS + Shadcn/ui
**Status:** ✅ COMPLETE  
**Description:** Setup styling framework  
**Verification:** Create test component with Tailwind classes  
**Install:**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn-ui@latest init
```

---

### ✅ Task 3.4: Install Dependencies and Setup Supabase Client
**Status:** ✅ COMPLETE  
**Description:** Install all required packages  
**Verification:** Import Supabase client and test connection  
**Packages:**
```bash
npm install @supabase/supabase-js
npm install @tanstack/react-query
npm install react-router-dom
npm install date-fns
npm install lucide-react (for icons)
```

**Create:** `src/lib/supabase.ts` with client configuration

---

## PHASE 4: FRONTEND - DELIVERY FLOW (5 Tasks)

### ✅ Task 4.1: Create App Layout with Bottom Navigation
**Status:** ✅ COMPLETE  
**Description:** Mobile-first layout with fixed bottom nav  
**Verification:** See navigation bar at bottom on mobile  
**Components:**
- AppLayout.tsx
- BottomNav.tsx (5 icons: Home, Delivery, Collection, Report, Settings)

---

### ✅ Task 4.2: Create Shop List Screen
**Status:** ✅ COMPLETE  
**Description:** Show all shops in list for delivery selection  
**Verification:** Click shop, navigate to delivery screen  
**Features:**
- Load shops from database
- Search/filter shops
- Show shop name, address
- Click to open delivery screen

---

### ✅ Task 4.3: Create Product Selection Screen
**Status:** ✅ COMPLETE  
**Description:** Show all 6 products with [-] [qty] [+] buttons  
**Verification:** Add quantities, see total calculate  
**Features:**
- List all milk products with prices
- [-] button (decrement)
- [+] button (increment)
- Input field for direct entry
- Running total at bottom
- Save button

---

### ✅ Task 4.4: Implement Save Delivery Function
**Status:** ✅ COMPLETE  
**Description:** Call add_delivery() function and save to database  
**Verification:** Save delivery, verify in database  
**Features:**
- Call Supabase RPC: add_delivery()
- Show success toast
- Clear form
- Navigate back to shop list

---

### ✅ Task 4.5: Test Complete Delivery Flow
**Status:** ✅ COMPLETE  
**Description:** End-to-end test of delivery entry  
**Verification:** Add 3 deliveries, verify all saved correctly  
**Test Steps:**
1. Select shop
2. Add 2 products with quantities
3. Save delivery
4. Verify in database
5. Repeat for 3 different shops

---

## PHASE 5: FRONTEND - COLLECTION FLOW (6 Tasks)

### ✅ Task 5.1: Create Collection List View
**Status:** ✅ COMPLETE  
**Description:** Show all shops with pending amounts  
**Verification:** See shops sorted by biggest pending first  
**Features:**
- Call get_collection_view()
- Show: Shop name, Today amount, Old pending, Total
- Color coding: 🔴 Pending, 🟡 Partial, 🟢 Paid
- Click shop to open payment modal

---

### ✅ Task 5.2: Create Payment Modal
**Status:** ✅ COMPLETE  
**Description:** Payment collection screen  
**Verification:** Enter amount, process payment  
**Features:**
- Show shop name
- Show breakdown: Today, Old, Total
- 3 Quick buttons: Pay Today, Pay Old, Pay Total
- Custom amount input
- Notes field
- Process Payment button

---

### ✅ Task 5.3: Implement Payment Processing
**Status:** ✅ COMPLETE  
**Description:** Call process_payment() function  
**Verification:** Process payment, verify FIFO works  
**Features:**
- Call Supabase RPC: process_payment()
- Show success message
- Update collection view
- Log activity

---

### ✅ Task 5.4: Create Pending List View
**Status:** ✅ COMPLETE  
**Description:** Show all shops with old pending  
**Verification:** Click "Show Pending List" button  
**Features:**
- Button at bottom of collection screen
- Shows only shops with shop_pending_history records
- Sort by biggest pending first
- Click to open payment modal

---

### ✅ Task 5.5: Test Collection Flow
**Status:** ✅ COMPLETE  
**Description:** End-to-end test of payment collection  
**Verification:** Process full, partial, and pending payments  
**Test Steps:**
1. Add 3 deliveries
2. Collect full payment for 1 shop
3. Collect partial payment for 1 shop
4. Leave 1 shop pending
5. Verify statuses updated correctly

---

### ✅ Task 5.6: Verify FIFO Payment Logic
**Status:** ✅ COMPLETE  
**Description:** Test FIFO with multiple days pending  
**Verification:** Oldest deliveries get paid first  
**Test Steps:**
1. Create shop with 3 deliveries on different dates
2. Pay amount covering oldest 2 deliveries
3. Verify oldest 2 marked paid
4. Verify newest still pending

---

## PHASE 6: FRONTEND - REPORTS (4 Tasks)

### ✅ Task 6.1: Create Daily Report Summary
**Status:** ⏳ Pending  
**Description:** Show today's financial summary  
**Verification:** See total delivered, collected, pending  
**Features:**
- Date selector (default today)
- Total Delivered
- Total Collected
- Total Pending
- Breakdown: Fully Paid, Partially Paid, Pending shops

---

### ✅ Task 6.2: Create Date Selector
**Status:** ⏳ Pending  
**Description:** Calendar to select any historical date  
**Verification:** Select past date, see that day's data  
**Features:**
- Calendar component (Shadcn/ui)
- Select any date
- Load data for that date
- Show shop list for selected date

---

### ✅ Task 6.3: Create Shop Detail View (Historical)
**Status:** ⏳ Pending  
**Description:** Detailed delivery info for selected date  
**Verification:** Click shop, see products, quantities, payment details  
**Features:**
- Shop name
- Delivery date
- Products list (Smart-26: 5 packets @ ₹272 = ₹1,360)
- Total amount
- Payment amount
- Payment status
- Who collected (if paid)
- Timestamp
- Notes

---

### ✅ Task 6.4: Test Reports Functionality
**Status:** ⏳ Pending  
**Description:** Verify historical data retrieval  
**Verification:** View different dates, verify data accuracy  
**Test Steps:**
1. Add deliveries on Day 1
2. Process some payments
3. Reset daily data
4. Add deliveries on Day 2
5. Select Day 1 from reports
6. Verify all Day 1 data still visible

---

## PHASE 7: FRONTEND - SETTINGS (2 Tasks)

### ✅ Task 7.1: Create Reset Dialog
**Status:** ⏳ Pending  
**Description:** Daily reset confirmation screen  
**Verification:** Show warning before reset  
**Features:**
- Warning message
- Show what will happen (paid archived, unpaid moved)
- Confirm button
- Cancel button

---

### ✅ Task 7.2: Implement Reset Functionality
**Status:** ⏳ Pending  
**Description:** Call reset_daily_data() function  
**Verification:** Reset data, verify results  
**Features:**
- Call Supabase RPC: reset_daily_data()
- Show success summary
- Refresh collection view (should show empty or pending only)
- Log reset activity

---

## PHASE 8: TESTING & POLISH (6 Tasks)

### ✅ Task 8.1: 3-Day Workflow Test
**Status:** ⏳ Pending  
**Description:** Complete end-to-end test across 3 days  
**Verification:** Verify all data flows correctly  
**Test Scenario:**
- Day 1: Add deliveries, collect some payments, reset
- Day 2: Add new deliveries, pay accumulated pending, reset
- Day 3: Verify pending from Day 1 carried forward correctly

---

### ✅ Task 8.2: FIFO Payment Comprehensive Test
**Status:** ⏳ Pending  
**Description:** Test edge cases in FIFO payment  
**Verification:** All scenarios work correctly  
**Test Cases:**
- Pay exact amount for one delivery
- Pay amount spanning multiple deliveries
- Pay more than today but less than total
- Pay full amount covering all pending

---

### ✅ Task 8.3: Reset Behavior Verification
**Status:** ⏳ Pending  
**Description:** Verify reset preserves financial data  
**Verification:** No data loss after reset  
**Test Cases:**
- Reset with all paid deliveries
- Reset with all pending deliveries
- Reset with mix of paid/partial/pending
- Verify archived records still queryable

---

### ✅ Task 8.4: Reports Historical Data Test
**Status:** ⏳ Pending  
**Description:** Verify reports show accurate historical data  
**Verification:** All dates retrievable with correct data  
**Test Cases:**
- View reports for 7 different dates
- Verify product quantities correct
- Verify payment amounts correct
- Verify timestamps accurate

---

### ✅ Task 8.5: Mobile Responsive Test
**Status:** ⏳ Pending  
**Description:** Test on various phone screen sizes  
**Verification:** Works on small, medium, large phones  
**Test Devices:**
- iPhone SE (small)
- iPhone 12/13/14 (medium)
- iPhone 14 Plus/Max (large)
- Android small screens
- Android large screens

---

### ✅ Task 8.6: Final Verification and Cleanup
**Status:** ⏳ Pending  
**Description:** Final checks before delivery  
**Verification:** All features working perfectly  
**Checklist:**
- [ ] All 40 tasks completed
- [ ] No console errors
- [ ] All database functions tested
- [ ] Mobile UI responsive
- [ ] FIFO working correctly
- [ ] Reset preserving data
- [ ] Reports showing historical data
- [ ] Code cleaned up (no console.logs)
- [ ] README.md created
- [ ] User guide created

---

## PROGRESS TRACKER

### Completed Tasks by Phase:
- Phase 1 (Database Setup): 8/8 ✅ COMPLETE
- Phase 2 (PostgreSQL Functions): 5/5 ✅ COMPLETE
- Phase 3 (UI Component Setup): 4/4 ✅ COMPLETE
- Phase 4 (Delivery Flow): 5/5 ✅ COMPLETE
- Phase 5 (Collection Flow): 6/6 ✅ COMPLETE
- Phase 6 (Reports): 0/4
- Phase 7 (Settings): 0/2
- Phase 8 (Testing): 0/6

### Overall Progress: 28/40 (70%)

---

## NEXT ACTION

**Ready to start:** Task 6.1 - Create Daily Report Summary

**Phase:** PHASE 6 - Reports (Historical Data & Analytics)

**Will build:**
- Daily financial summary with totals
- Date selector for historical reports
- Shop detail view with delivery history
- Complete financial breakdown per shop
- Historical data preservation verification

