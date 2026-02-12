## **Referral Program Functionality Summary**

### **1. Referee Pages** (`/referrals/claim/[programId]`)
**Purpose:** Landing page for users clicking on a referral link

**Key Features:**
- **Link Claiming:** Validates and claims referral links using `linkId`
- **Authentication Flow:** Prompts unauthenticated users to sign in
- **Profile Completion:** Checks if user profile is complete before allowing claim
- **Auto-claim:** Automatically processes claim when user is authenticated and profile is complete
- **Program Display:** Shows detailed program information (description, requirements, rewards)
- **Error Handling:** Displays helpful messages for invalid/expired/cancelled/limit-reached links
- **Alternative Actions:** Suggests becoming a referrer if link unavailable
- **Analytics Tracking:** Tracks login button clicks and claim events

### **2. Referrer Pages** (`/yoid/referrals`)
**Purpose:** Dashboard for users who create and manage referral links

**Key Features:**
- **Stats Dashboard:** Shows referral performance (totals, earned, completed/pending) via analytics
- **Leaderboard:** Displays top referrers with completion counts and highlights the current user
- **Program Browser:** Shows available active programs to create links for
- **Link Management:**
  - Create new referral links for active programs
  - Edit existing active links (name/description/settings)
  - View link usage details with referee completion status
  - Track link stats (pending/completed/expired, rewards)
- **Link Sharing:** QR codes and share functionality for distribution
- **Blocked State:** Displays suspension notice if user's referral access is blocked
- **Welcome/Onboarding:** Help section explaining how referrals work
- **Modals:** Create/edit link modal, usage details (“Link Performance”) modal

### **3. Admin Pages** (`/admin/referrals/*`)

#### **3a. Programs List** (`/admin/referrals`)
**Purpose:** Manage all referral programs

**Key Features:**
- **Program Search:** Filter by status, name, date range
- **Status Tabs:** All, Active, Inactive, Expired, Deleted, LimitReached, UnCompletable
- **Program Display:** Shows name, description, dates, rewards, status badges (responsive for mobile/desktop)
- **Program Actions:** Create, edit, view details, view links, delete programs
- **Badge Counts:** Shows total count for each status tab
- **Pagination:** Browse through large program lists

#### **3b. Program Details/Edit** (`/admin/referrals/[id]`)
**Purpose:** Create and edit referral program configurations

**Key Features:**
- **Multi-step Form:**
  - **Step 1 (Basic Info):** Name, description, image upload
  - **Step 2 (Schedule):** Start/end dates, active period
  - **Step 3 (Limits & Rewards):** Completion window, per-referee limit, ZLTO rewards for referrer/referee
  - **Step 4 (Pathway):** Define required tasks/opportunities, completion rules, ordering
- **Pathway Builder:** Add opportunities as required tasks, set completion rules (All/AtLeastOne)
- **Image Management:** Upload/update program images
- **Validation:** Comprehensive form validation with error messages
- **Status Management:** Activate, deactivate, delete programs
- **Link Access:** Navigate to view program's referral links

#### **3c. Links List** (`/admin/referrals/[id]/links`)
**Purpose:** View all referral links for a specific program

**Key Features:**
- **Link Search:** Filter by status, user, name/description
- **Status Tabs:** All, Active, Cancelled, LimitReached, Expired
- **Link Details:** Creator info, usage stats (pending/completed/expired), ZLTO rewards
- **Copy Functionality:** Copy link URLs to clipboard
- **Link Actions:** View usage details, manage link status
- **Badge Counts:** Shows count per status tab
- **Pagination:** Browse through links

#### **3d. Usage List** (`/admin/referrals/[id]/links/[linkId]/usage`)
**Purpose:** View all usage instances for a specific referral link

**Key Features:**
- **Usage Search:** Filter by status, referee/referrer user, date range
- **Status Tabs:** All, Pending, Completed, Expired
- **User Details Display:**
  - Username, email (with verified badge), phone (with verified badge)
  - YoID onboarding status
  - Display name and contact info
- **Date Tracking:** Shows claimed, completed, and expired dates
- **Usage Actions:** View detailed usage information
- **Mobile/Desktop Views:** Responsive layouts for different screen sizes
- **Badge Counts:** Shows count per status tab

**Common Features Across All Perspectives:**
- Server-side rendering (SSR) with prefetched queries
- React Query for data fetching and caching
- Responsive design (mobile/desktop)
- Authentication/authorization checks
- Error handling (401, 403, 404, 500)
- Breadcrumb navigation
- Real-time analytics data integration
