# Referrals Page - Multi-Program Support

This page supports two modes for handling referral programs:

## Single Program Mode (Default)

**URL:** `/yoid/referrals` or `/yoid/referrals?multiProgram=false`

**Features:**

- Uses the default referral program (fetched via `getDefaultReferralProgram()`)
- Streamlined UI focused on a single program
- Shows only the user's first/active link
- Displays link usage inline on the page (not in a modal)
- Link creation skips program selection step (auto-uses default program)
- Only supports one link per user
- No "Available Programs" section shown

**Use Case:**

- Initial product launch with a single referral program
- Simplified user experience for users who don't need multiple programs

## Multi-Program Mode

**URL:** `/yoid/referrals?multiProgram=true`

**Features:**

- Shows program selection interface
- Displays list of user's links (paginated)
- Link usage opened via "View Usage" button in modal
- Shows "Available Programs" section
- Supports multiple links across different programs
- Full-featured dashboard with program browsing

**Use Case:**

- Advanced users who need to manage multiple referral programs
- When multiple active programs are available

## Implementation Details

### Server-Side Data Fetching

- **Single Mode:** Fetches default program + first link (pageSize: 1)
- **Multi Mode:** Fetches programs list + links (pageSize: 3)

### Components

- **ReferrerLinkUsage:** New component for inline usage view (single mode)
- **ReferrerLinkUsageModal:** Modal usage view (multi mode)
- **ReferrerCreateLinkModal:** Works in both modes (program pre-selected in single mode)
- **ReferrerLinksList:** Only shown in multi mode
- **ReferrerProgramsList:** Only shown in multi mode

### State Management

- `multiProgram` prop passed from server-side props
- `programs` array: Contains default program (single mode) or programs list (multi mode)
- `firstLink`: User's first link (used in single mode)
- Separate query keys for different page sizes based on mode

## Development Notes

- Keep both modes maintained and tested
- Component reuse is maximized between modes
- Clear separation of concerns with conditional rendering
- Future: Can add mode toggle in UI if needed
