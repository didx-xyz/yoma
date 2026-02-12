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

### **2. Referrals Landing Page** (`/referrals`)
**Purpose:** Main dashboard for both referrers and referees to manage and track their referral activities

**Key Features:**
- **Anonymous View:** Sign-in prompt for unauthenticated users
- **Welcome Section:** Context-aware messaging based on user's referral state
- **My Links (Referrer View):**
  - **Stats Dashboard:** Shows total links created, total earned ZLTO, active/completed/pending counts
  - **Link List:** Paginated table of user's referral links with status, usage stats, and actions
  - **Create Link:** Button to create new referral links
- **Available Programs:**
  - **Program Carousel:** Browse active programs with infinite scroll loading
  - **Country Filter:** Filter programs by country (defaults to user's country + worldwide)
  - **Program Cards:** Display program name, description, reward amounts, and status
  - **Create Link Action:** Direct creation of referral links for specific programs
- **My Referrals (Referee View):**
  - **Referrals List:** Shows pending referrals the user has claimed
  - **Progress Tracking:** Links to detailed progress pages for each referral
  - **Status Indicators:** Visual badges for pending/completed/expired states
- **Blocked State:** Displays suspension notice if user's referral access is blocked
- **Responsive Design:** Optimized layouts for mobile and desktop

### **3. Link Detail Page** (`/referrals/link/[id]`)
**Purpose:** View and manage a specific referral link with sharing functionality

**Key Features:**
- **Link Information:** Display link name, description, and associated program details
- **Share Functionality:**
  - **Share Modal:** Copy link URL, share via social media, WhatsApp, email
  - **QR Code:** Generate QR code for easy mobile sharing
  - **Reward Display:** Shows ZLTO reward amount for referees
- **Link Stats:**
  - **Usage Metrics:** Total referrals, pending, completed, expired counts
  - **Earned ZLTO:** Shows total rewards earned from this link
  - **Status Badge:** Active/Cancelled/Expired/Limit Reached indicators
- **Referral List:**
  - **Usage Table:** Shows all referrals made through this link
  - **Referee Details:** Username, status, claim date, completion progress
  - **Progress Tracking:** Visual indicators for each referee's completion status
- **Breadcrumb Navigation:** Easy navigation back to referrals dashboard
- **Blocked State Handling:** Displays appropriate messaging if user is blocked

### **4. Progress Tracking Page** (`/referrals/progress/[programId]`)
**Purpose:** Detailed progress tracking for referees completing program requirements

**Key Features:**
- **Status Banner:**
  - **Progress Overview:** Visual display of completion status (Pending/Completed/Expired)
  - **Reward Information:** ZLTO rewards to be earned upon completion
  - **Time Remaining:** Countdown for completion window if applicable
  - **Referrer Info:** Shows who referred the user
- **Proof of Personhood Verification (if required):**
  - **Two Verification Methods:**
    - Phone verification: Link to profile to add phone number
    - Social sign-in: Sign in with Google/Facebook
  - **Clear Instructions:** Step-by-step guidance for both methods
  - **Return URL Handling:** Maintains user's place after authentication
- **Next Action Card (Pending Status):**
  - **Step Information:** Current step name and description
  - **Task Instructions:** Context-aware text (e.g., "Complete 2 of 3 tasks")
  - **Task List:** Compact display of required opportunities with completion status
  - **Action Guidance:** Clear instructions on how to complete tasks and upload proof
  - **Non-completable Reasons:** Displays why tasks can't be completed if applicable
- **Completed/Expired States:**
  - **Become Referrer CTA:** Encourages completed referees to become referrers
  - **Alternative Actions:** Suggests other opportunities or programs
- **Error Handling:**
  - **Not Found State:** Clear messaging when referral doesn't exist
  - **Helpful Suggestions:** Lists possible reasons (not claimed, expired, etc.)
  - **Alternative CTAs:** Provides options to become referrer or explore other opportunities
- **Real-time Updates:** Refetches data every 30 seconds to show latest progress
- **Breadcrumb Navigation:** Easy navigation back to referrals dashboard
- **Authentication Checks:** Handles unauthenticated users with appropriate redirects
- **Success Notifications:** Toast message when redirected after claiming a link

### **5. Admin Pages** (`/admin/referrals/*`)

#### **5a. Programs List** (`/admin/referrals`)
**Purpose:** Manage all referral programs

**Key Features:**
- **Program Search:** Filter by status, name, date range
- **Status Tabs:** All, Active, Inactive, Expired, Deleted, LimitReached, UnCompletable
- **Program Display:** Shows name, description, dates, rewards, status badges (responsive for mobile/desktop)
- **Program Actions:** Create, edit, view details, view links, delete programs
- **Badge Counts:** Shows total count for each status tab
- **Pagination:** Browse through large program lists

#### **5b. Program Details/Edit** (`/admin/referrals/[id]`)
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

#### **5c. Links List** (`/admin/referrals/[id]/links`)
**Purpose:** View all referral links for a specific program

**Key Features:**
- **Link Search:** Filter by status, user, name/description
- **Status Tabs:** All, Active, Cancelled, LimitReached, Expired
- **Link Details:** Creator info, usage stats (pending/completed/expired), ZLTO rewards
- **Copy Functionality:** Copy link URLs to clipboard
- **Link Actions:** View usage details, manage link status
- **Badge Counts:** Shows count per status tab
- **Pagination:** Browse through links

#### **5d. Usage List** (`/admin/referrals/[id]/links/[linkId]/usage`)
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
