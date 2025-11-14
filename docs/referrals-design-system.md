# Referrals Design System

## Design Principles

### Icon Strategy

- **Use React Icons (react-icons)** for consistency, scalability, and maintainability
- Avoid emojis as they can render inconsistently across platforms
- All icons should be wrapped in rounded containers with gradient backgrounds where appropriate
- Icon sizes should be contextual: `h-3 w-3` for small, `h-4 w-4` for medium, `h-5 w-5` for large

### Color Palette

- Use Tailwind CSS gradient utilities for depth and visual interest
- Maintain sufficient contrast for accessibility (WCAG AA minimum)
- Use semantic colors that reinforce meaning

---

## Component Themes

### 🚀 Referral Program

**Concept:** The overall program/opportunity that users can refer others to

- **Icon:** `IoRocket` (react-icons/io5)
- **Color:** Orange (`from-orange-400 to-orange-600`)
- **Usage:** Program cards, program headers, program selection
- **Background Gradient:** `bg-gradient-to-br from-orange-400 to-orange-600`
- **Text Color:** `text-orange-600` (dark), `text-orange-50` (light)
- **Border Color:** `border-orange-300` (light), `border-orange-500` (dark)

### 🔗 Referral Link

**Concept:** The shareable link that referrers send to potential referees

- **Icon:** `FaLink` (react-icons/fa)
- **Color:** Blue (`from-blue-400 to-blue-600`)
- **Usage:** Link creation, link management, link sharing
- **Background Gradient:** `bg-gradient-to-br from-blue-400 to-blue-600`
- **Text Color:** `text-blue-600` (dark), `text-blue-50` (light)
- **Border Color:** `border-blue-300` (light), `border-blue-500` (dark)

### 🛣️ Journey (Claim/Progress)

**Concept:** The referee's overall journey through the program

- **Icon:** `FaRoad` (react-icons/fa)
- **Color:** Purple (`from-purple-400 to-purple-600`)
- **Usage:** Progress tracking, journey milestones, pathway navigation
- **Background Gradient:** `bg-gradient-to-br from-purple-400 to-purple-600`
- **Text Color:** `text-purple-600` (dark), `text-purple-50` (light)
- **Border Color:** `border-purple-300` (light), `border-purple-500` (dark)

### 📋 Pathway Step

**Concept:** Individual steps within a pathway that must be completed in sequence or any order

- **Icon:** Contextual (numbered badge or `FaListOl` for sequential, `FaCircle` for any order)
- **Color:** Blue (`from-blue-400 to-blue-600`)
- **Usage:** Step headers, step navigation, step progress
- **Background Gradient:** `bg-gradient-to-br from-blue-400 to-blue-600`
- **Text Color:** `text-blue-600` (dark), `text-blue-50` (light)
- **Border Color:** `border-blue-300` (light), `border-blue-500` (dark)

### ✅ Pathway Task

**Concept:** Individual tasks/opportunities within a step

- **Icon:** Contextual (numbered badge, checkmark `IoCheckmarkCircle`, or `FaQuestion` for any order)
- **Color:** Green (`from-green-400 to-green-600`)
- **Usage:** Task cards, task completion indicators, task lists
- **Background Gradient:** `bg-gradient-to-br from-green-400 to-green-600`
- **Text Color:** `text-green-600` (dark), `text-green-50` (light)
- **Border Color:** `border-green-300` (light), `border-green-500` (dark)

### 🏆 Achievement / Milestone

**Concept:** Completed goals and significant accomplishments

- **Icon:** `IoTrophy` (react-icons/io5)
- **Color:** Gold/Yellow (`from-yellow-400 to-amber-500`)
- **Usage:** Completion badges, achievement displays, milestone markers
- **Background Gradient:** `bg-gradient-to-br from-yellow-400 to-amber-500`
- **Text Color:** `text-yellow-700` (dark), `text-yellow-50` (light)
- **Border Color:** `border-yellow-300` (light), `border-amber-400` (dark)

### ⛰️ Challenge / Obstacle

**Concept:** Blockers, requirements not met, or difficult tasks

- **Icon:** `IoFlag` or `IoWarning` (react-icons/io5)
- **Color:** Red (`from-red-400 to-red-600`)
- **Usage:** Blocked states, requirements not met, challenging tasks
- **Background Gradient:** `bg-gradient-to-br from-red-400 to-red-600`
- **Text Color:** `text-red-700` (dark), `text-red-50` (light)
- **Border Color:** `border-red-300` (light), `border-red-500` (dark)

### 🛟 Support / Help

**Concept:** Help sections, support information, guidance

- **Icon:** `IoHelpCircle` or `IoInformationCircle` (react-icons/io5)
- **Color:** Teal (`from-teal-400 to-teal-600`)
- **Usage:** Help sections, tooltips, support links
- **Background Gradient:** `bg-gradient-to-br from-teal-400 to-teal-600`
- **Text Color:** `text-teal-700` (dark), `text-teal-50` (light)
- **Border Color:** `border-teal-300` (light), `border-teal-500` (dark)

### 👥 Community / Network

**Concept:** Social aspects, referrer network, community features

- **Icon:** `IoPeople` or `IoShare` (react-icons/io5)
- **Color:** Indigo (`from-indigo-400 to-indigo-600`)
- **Usage:** Referrer dashboard, network stats, sharing features
- **Background Gradient:** `bg-gradient-to-br from-indigo-400 to-indigo-600`
- **Text Color:** `text-indigo-700` (dark), `text-indigo-50` (light)
- **Border Color:** `border-indigo-300` (light), `border-indigo-500` (dark)

### 💡 Learning / Knowledge

**Concept:** Educational content, instructions, how-to information

- **Icon:** `IoBook` or `IoBulb` (react-icons/io5)
- **Color:** Cyan (`from-cyan-400 to-cyan-600`)
- **Usage:** Instructions, educational sections, learning resources
- **Background Gradient:** `bg-gradient-to-br from-cyan-400 to-cyan-600`
- **Text Color:** `text-cyan-700` (dark), `text-cyan-50` (light)
- **Border Color:** `border-cyan-300` (light), `border-cyan-500` (dark)

### 🎁 Reward / Incentive

**Concept:** ZLTO rewards, incentives, benefits

- **Icon:** `IoGift` or `IoStar` (react-icons/io5)
- **Color:** Amber (`from-amber-400 to-amber-600`)
- **Usage:** Reward displays, incentive information, ZLTO amounts
- **Background Gradient:** `bg-gradient-to-br from-amber-400 to-amber-600`
- **Text Color:** `text-amber-700` (dark), `text-amber-50` (light)
- **Border Color:** `border-amber-300` (light), `border-amber-500` (dark)

### 🛡️ Verification / Approval

**Concept:** Verification status, approval states, authenticated users

- **Icon:** `IoShieldCheckmark` or `IoCheckmarkCircle` (react-icons/io5)
- **Color:** Dark Green (`from-emerald-500 to-emerald-700`)
- **Usage:** Verification badges, approval indicators, proof of personhood
- **Background Gradient:** `bg-gradient-to-br from-emerald-500 to-emerald-700`
- **Text Color:** `text-emerald-700` (dark), `text-emerald-50` (light)
- **Border Color:** `border-emerald-400` (light), `border-emerald-600` (dark)

### ⏳ Pending / Waiting

**Concept:** In-progress states, awaiting action, time-based conditions

- **Icon:** `IoTimeOutline` or `IoHourglassOutline` (react-icons/io5)
- **Color:** Gray (`from-gray-400 to-gray-600`)
- **Usage:** Pending states, loading indicators, waiting periods
- **Background Gradient:** `bg-gradient-to-br from-gray-400 to-gray-600`
- **Text Color:** `text-gray-700` (dark), `text-gray-50` (light)
- **Border Color:** `border-gray-300` (light), `border-gray-500` (dark)

### ⚠️ Error / Issue

**Concept:** Errors, warnings, problems that need attention

- **Icon:** `IoWarning` or `IoCloseCircle` (react-icons/io5)
- **Color:** Bright Red (`from-red-500 to-red-700`)
- **Usage:** Error messages, warning banners, problem indicators
- **Background Gradient:** `bg-gradient-to-br from-red-500 to-red-700`
- **Text Color:** `text-red-700` (dark), `text-red-50` (light)
- **Border Color:** `border-red-400` (light), `border-red-600` (dark)

### ✔️ Success / Completion

**Concept:** Successfully completed actions, positive confirmations

- **Icon:** `IoCheckmarkCircle` (react-icons/io5)
- **Color:** Bright Green (`from-green-500 to-green-700`)
- **Usage:** Success messages, completion badges, positive feedback
- **Background Gradient:** `bg-gradient-to-br from-green-500 to-green-700`
- **Text Color:** `text-green-700` (dark), `text-green-50` (light)
- **Border Color:** `border-green-400` (light), `border-green-600` (dark)

---

## Implementation Guidelines

### Icon Container Pattern

```tsx
<span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[color]-400 to-[color]-600">
  <IconComponent className="h-3 w-3 text-white" />
</span>
```

### Badge Pattern

```tsx
<div className="inline-flex items-center gap-2 rounded-full bg-[color]-50 px-4 py-2 ring-1 ring-[color]-200">
  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[color]-400 to-[color]-600">
    <IconComponent className="h-2.5 w-2.5 text-white" />
  </span>
  <span className="text-sm font-semibold text-[color]-900">Label</span>
</div>
```

### Alert/Banner Pattern

```tsx
<div className="flex items-start gap-3 rounded-lg border-2 border-[color]-300 bg-[color]-50 p-4">
  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[color]-400 to-[color]-600">
    <IconComponent className="h-3 w-3 text-white" />
  </span>
  <div className="flex-1">
    <h4 className="text-sm font-semibold text-[color]-900">Title</h4>
    <p className="text-xs text-[color]-700">Description</p>
  </div>
</div>
```

---

## Accessibility Notes

- All icon containers must have sufficient color contrast (4.5:1 minimum for normal text)
- Use `aria-label` or `aria-hidden` appropriately for icons
- Ensure focus states are visible with ring utilities
- Test with screen readers to ensure semantic meaning is conveyed
- Don't rely solely on color to convey information

---

## File Locations

### Components

- `/src/web/src/components/Referrals/` - All referral-related components

### Pages

- `/src/web/src/pages/yoid/referrals/` - Referrer pages (dashboard, links)
- `/src/web/src/pages/yoid/referee/` - Referee pages (claim, progress)
- `/src/web/src/pages/admin/referrals/` - Admin pages

---

## Version History

- **v1.0** (2025-11-13) - Initial design system documentation
