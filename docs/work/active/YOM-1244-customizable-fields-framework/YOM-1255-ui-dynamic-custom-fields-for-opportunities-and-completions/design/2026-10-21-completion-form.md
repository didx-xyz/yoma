# Completion form: sections, status, validation, and the upload button (2026-10-21)

- **Input:** Jason's round-3 request (2026-10-21), through the lead:
  - **H1:** improve the youth completion form. Make headers, panels, icons and buttons consistent. Split the many fields into collapsible sections like "Before you go". Open and close sections as the youth completes them, open any section that has a validation error, and improve the validation messages and their design.
  - **H3:** "Upload your completion files" uses the same green as the other buttons.
- **Read:** this ticket's `feature.md` (Decisions to 2026-10-20), `handoffs/2026-10-20-a.md`, YOM-1283 `feature.md`, the 2026-10-20 YoID spec, testing-guide decision D-87, and `src/web/AGENTS.md`.
- **Status:** approved by Jason on 2026-10-21 and implemented (later revisions in this ticket's
  `feature.md` Decisions, 2026-10-21 / 10-22).
- **Paths** are relative to `src/web/src/`. Line numbers are from the working tree on 2026-10-21, with round 2 still uncommitted.
- **Screens:** `~/.cache/cdp-tools/shots/2026-10-21-completion-form/` (on this machine only). Signed in as `testuser@gmail.com`, which Jason approved for this task. The form was opened and never submitted with valid data.
  - **Entrepreneurship** "Course Route-to-Market … 443010650" (`eb6de6c5-…`): FileUpload, Picture, VoiceNote and Location, plus 12 completion custom fields (3 required).
  - **Job** "Route-to-Market Program Transformation 1620032617" (`bd0067f7-…`): the same verification types, plus 1 optional field.
  - Files: `detail-{1440,390,320}-top`, `form-1440-initial-01…04`, `form-1440-submitted-empty-01…04`, `form-1440-feedback-open-cleared`, `form-1440-job-submitted-empty-01…03`, `form-390-initial-01…05`, `form-390-submitted-empty-01…05` and `-at-submit`, `form-320-submitted-empty-01…06`, and `detail-1440-section-expanded`, the detail page's disclosure pattern.
  - Headless Chrome has no emoji font, so the 🎉 badge shows as a box. On a device it renders.
- **Data:** no new requests and no new API fields. Which fields are required still comes from the opportunity's `verificationTypes` and the custom-field definitions (`isRequired`). The zod rules stay as they are (one exception, Departure 2).
- **One batch.** The work is presentation and copy on files this ticket already owns, plus the detail page's button.

---

## 1. Completion form (`components/Opportunity/OpportunityCompletionEdit.tsx`)

The form opens in `CustomModal` (`OpportunityPublicDetails.tsx:1000-1016`, `md:max-h-[900px] md:w-[700px]`). Below `md` it fills the screen. The modal's own scroller is the form, which has `overflow-y-auto`.

### Current

1. **One long scroll.** The Entrepreneurship form is 3 157 px tall at 1440 and 3 905 px at 320. It stacks 4 upload cards, a 350 px map, 12 custom fields, the business location and "Before you go". Nothing can be put away, and nothing shows what is done. (`form-1440-initial-01…04`, `form-320-submitted-empty-*`)
2. **Every panel looks different.** Upload cards and the map have a grey card with a large flat-colour `react-icons/fc` icon in a left column (`FileUpload.tsx:253-277`, `LocationPicker.tsx:136-151`). The custom fields have a grey card with an h5 "Additional details", an uppercase green group label with a hairline, and "12 fields" (`CustomFields.tsx:811-865`). The business location is a grey card with a bold h-span and a grey line (`BusinessLocationField.tsx:44-50`). "Before you go" has its own icon column, an italic line and a "Give Feedback" button (`OpportunityCompletionEdit.tsx:873-897`). That makes four header styles in one dialog.
3. **Errors show before the youth has done anything.** On open, every upload card and the map already show the yellow "Please upload a …" box, and the bottom shows "Please supply the required information above." (`form-1440-initial-01`, `-02`, `-04`). This happens because `mode: "onChange"` plus `trigger()` on mount (`:406-423`) fills `errors`, and the boxes render on `errors.x` alone. Custom-field errors, by contrast, wait for submit (`showErrors={isSubmitted}`, `:841`). The same form uses two rules.
4. **The required marker is really an error marker.** Required custom fields show an orange "!" with the tooltip "This field is required." (`FormLabel.tsx:27-31`). It disappears once the field is valid. Optional fields have no marker, so a youth can't tell which fields are optional.
5. **Submitting with errors goes nowhere.** After Submit, focus stays on the Submit button and the scroll does not move. At 390 the screen still shows the bottom of the form (`form-390-submitted-empty-at-submit`). The custom-field errors appear about 1 800 px further up, unseen. React Hook Form's error focus finds no refs, because every value is set through `setValue` or `Controller` with no `ref`.
6. **Two error styles.** Upload, map and feedback errors are yellow warning boxes (`FormMessage` Warning). Custom-field errors are red italic text (`FormError`).
7. **The messages are robotic or technical.**
   - "Business / Venture Name is required."
   - The certificate type error lists MIME types ("application/vnd.openxmlformats-officedocument…", `:141-144`, because it joins `ACCEPTED_DOC_TYPES`, not the labels).
   - "Feedback must be between 1 and 500 characters." appears after the youth types into the optional feedback and then clears it, and it blocks Submit (`form-1440-feedback-open-cleared`; the rule at `:290-299` treats `""` as given).
8. **The dialog's font isn't the site's.** `CustomModal` portals to `<body>` (`CustomModal.tsx:57-60`), outside `#mainContent`. The fonts' CSS variables (`_app.tsx:99`) and the family rule (`globals.css:473-477`) only apply inside `#mainContent`, so every text node in the dialog renders in `ui-sans-serif, system-ui` (measured). The page behind it uses Open Sans and Nunito. This affects every `CustomModal`.
9. **The group count overflows at 320.** "12 fields" sits at right = 355 px in a 320 px form and is clipped by `overflow-x-hidden`. The group label is `shrink-0` with `tracking-[0.2em]` (`CustomFields.tsx:852-857`; `form-320-submitted-empty-03`).
10. **Controls have mixed widths.** Custom-field inputs are about 296 px wide, which is daisyUI's default `.input` width, inside a 600 px panel. The country select beside them is full width (`form-1440-initial-03`, `-04`).
11. **"Before you go" is not a component.** It is inline markup (`:872-984`) with a show/hide button, `showFeedback` state, no `aria-expanded`, no motion and no shared styling. The page already has a real collapsible: **`DetailDisclosure`** (`components/Opportunity/TabbedDetails/DetailDisclosure.tsx`), the detail page's section card (`detail-1440-section-expanded`). It has an icon square, a title, a one-line preview, a rotating chevron, `aria-expanded` and `aria-controls`, a 220 ms grid-rows ease that honours `motion-reduce`, and `inert` while closed. **This spec reuses `DetailDisclosure`.** "Before you go" becomes one of its sections, not the template.

### Changes

#### 1.1 Shell

- **Font (every modal).** The modal root gets the site fonts.
  - Move the two `next/font` objects from `pages/_app.tsx:31-44` to a new `lib/fonts.ts`, and import them back into `_app`.
  - In `CustomModal.tsx`, give the portal container the variables and the family: `div.className = \`${openSans.variable} ${nunito.variable} font-sans\``, where the `div` is the one created at `:58`.
  - Add `#modal-root` to the `#mainContent` font rule in `globals.css:473`.
  - See Departure 3.
- **Header** (`:435-464`): keep the green band, the close button and the 🎉 badge.
  - Swap the close icon `IoMdClose` for io5 `IoClose` (`h-5 w-5`) and give the button `aria-label="Close"`.
  - The headline stays an `h4` (`text-xl font-bold`, no negative tracking).
  - The intro drops `tracking-wide` and uses `text-gray-dark text-sm md:text-base`.
- **Body:** `flex flex-col gap-3 px-4 md:px-6`. The sections sit in one column under the intro. The error summary (1.6) goes between the intro and the first section.
- **Icons:** io5 only. Remove the `react-icons/fc` imports from this file, `FileUpload` (it takes `iconAlt`) and `LocationPicker` (`FcGlobe`). Also replace the `react-icons/io` imports (`IoMdArrowUp`, `IoMdChatbubbles`, `IoMdClose`) with io5 `IoArrowUp`, `IoChatbubblesOutline` and `IoClose`.

#### 1.2 Sections

Each section is a `DetailDisclosure` card (white, `border-gray rounded-[18px] border`). The cards appear in this order, and each uses the same render condition as the block it replaces:

| # | `id` | Shown when (unchanged) | Icon (io5, `h-5 w-5`) | Tone | Title | Contents |
|---|---|---|---|---|---|---|
| 1 | `completion-proof` | `verificationTypes.length > 0` (`:467`) | `IoCloudUploadOutline` | `TONE.green` | Proof of completion | One item per verification type, in today's order: certificate, picture, voice note, video, then the map pin |
| 2 | `completion-details` | `CUSTOM_FIELDS_ENABLED` and the definitions are loaded and non-empty, or failed to load (`:806-852`) | `IoDocumentTextOutline` | `TONE.blue` | The definitions' group name, with the count of fields: "Completion Details · 12". If there is more than one group: "Your answers · N" (open question 3) | `CustomFields` (1.4) |
| 3 | `completion-business` | `isEntrepreneurship` (`:854`) | `IoStorefrontOutline` | `TONE.lilac` | Where is your business? | `BusinessLocationField` without its own heading (1.4) |
| 4 | `completion-feedback` | always | `IoChatbubblesOutline` | `TONE.gold` | Before you go | Rating, feedback and recommend (1.4) |

- **`DetailDisclosure` changes**, all additive. The detail page passes none of the new props, so it is unchanged.
  - `status?: React.ReactNode`: a line under the title, shown both open and closed. When given, it takes the `preview` and `note` slot.
  - The header button gets `id={\`section-${id}-header\`}`.
  - A `className?: string` goes on the outer card, for `scroll-mt-4`.
  - Move `TONE` from `OpportunityDetailSections.tsx:134-140` into `DetailDisclosure.tsx` as an export, and import it back.
- **Ids carry the `completion-` prefix.** The modal sits on the detail page, which already uses `section-how-body` and similar ids, so the prefix keeps every `section-*-body` id unique.
- **Mounting:** `DetailDisclosure` mounts a section's content on first open and keeps it mounted. That is right here: the map loads Google Maps only when Proof first opens. Values live in react-hook-form, so validation never depends on mounting.
- **While the definitions load,** section 2 is a static `DetailDisclosure` row (`static`). Its title is "Loading questions…" and a `loading loading-spinner loading-xs` sits in the icon square. It replaces `CustomFields.tsx:792-798` in this form. If the definitions fail, section 2 shows with the status "Needs attention", opens, and holds the retry message (copy table).

#### 1.3 Section header: status line

The `status` slot holds one line: `mt-0.5 flex items-center gap-1 text-[13px] leading-snug`, with the icon at `h-4 w-4 shrink-0`. The line may wrap at 320. It never truncates and never overflows.

| Status | When | Icon | Text |
|---|---|---|---|
| **Done** | The section has at least one field, none of them has an error, and every required one has a value. For a section with no required fields, at least one value has been given. | `IoCheckmarkCircle text-green` | `text-green font-semibold` "Done" |
| **Needs attention** (before a submit) | At least one field in the section has an error (missing required or invalid). `n` = the number of such fields | `IoAlertCircle text-yellow` | `text-gray-dark` "Needs attention · {n} to do" |
| **Needs attention** (after a failed submit) | Same, once `isSubmitted` is true | `IoAlertCircle text-red-500` | `text-black font-semibold` "Needs attention · {n} to fix" |
| **Optional** | No required fields, nothing given, no errors | `IoEllipseOutline text-gray-dark` | `text-gray-dark` "Optional" |

- **The text sits in black or grey.** `text-yellow` (#d48414) and `text-red-500` are under 4.5:1 for 13 px text on white, so only the icons carry the colour.
- **Errors per section**, from the values the form already has (no new state):
  - Proof: `errors.certificate`, `picture`, `voiceNote`, `video` and `geometry`.
  - Details: `getCustomFieldErrors(customFieldDefinitions, watch("customFields"))`, which is exported and pure, one entry per field.
  - Business: none, because the section is optional and has no rule.
  - Feedback: `errors.feedback`.
- **Write the rule as a pure helper**, `completionSectionStatus(…)`, in a new `components/Opportunity/completionSections.ts` with unit tests.
- **Custom-field status lags by up to 400 ms.** `CustomFields` debounces `onChange` by 400 ms and flushes on blur. That's acceptable.

#### 1.4 Inside the sections

Each section body uses `DetailDisclosure`'s padding: `px-5 pb-5`, plus `md:pl-[74px]` so the content lines up under the title. Within a body, fields are `flex flex-col gap-4`. Proof items are separated by `border-gray border-t pt-4`.

- **Proof items:** `FileUpload` and `LocationPicker` each get a `plain?: boolean` prop. The default `false` keeps the grey card for `Admin/VerificationImport.tsx` and `Admin/OpportunityImport.tsx`. With `plain`:
  - No grey card and no icon column.
  - The label (the verification type's `description`, as today) in `text-sm font-semibold text-black`.
  - One hint line in `text-gray-dark text-[13px]`: "{type labels joined ', '} · up to {size}". It replaces the two italic-bold lines at `FileUpload.tsx:271-278`.
  - The Upload button in the outline-green style (1.7), `h-10 px-4`, with `IoArrowUp`. The file list, progress bar and remove button stay as they are.
  - The error (1.5) under the item, `mt-2`.
  - For the map: the label, then the line "Drop a pin on the map, or **use your current location**". The link is the existing button at `LocationPicker.tsx:146-152`, restyled `text-green font-semibold underline`, not italic. Under it, the map in a `rounded-xl overflow-hidden` frame (height unchanged, 350 px).
- **Custom fields:** `CustomFields` gets `variant?: "editor" | "completion"` (default `"editor"`, unchanged everywhere else). `"completion"` does three things:
  - drops the "Additional details" h5 (`:810-813`), because the section header replaces it;
  - appends " (optional)" in `text-gray-dark font-normal` to the label of every definition with `isRequired = false`, and passes `showWarningIcon={false}`, so required fields carry no marker and optional ones say so;
  - makes every control `w-full`: the inputs, the react-select controls and the date input.
  The form passes `variant="completion"`, `hideDescriptions` (as today, D-87), and `hideGrouping` when exactly one group applies. The group's name and count are then in the section header, so D-87's "N fields" count survives as "· 12".
- **Group heading at 320** (editor and completion with several groups): at `CustomFields.tsx:852`, change `shrink-0 … tracking-[0.2em]` to `min-w-0 … tracking-[0.12em]`, so the label wraps before the count is pushed out.
- **Business location:** remove `BusinessLocationField.tsx:45-50`, the heading and the "Optional." line. Its title and note now live in the section header. The component is used only here. Pass the section `note` "Where your business is based, not where you took part." The country, region and city controls are unchanged.
- **Before you go:**
  - Labels in `text-sm font-semibold`: "Rating", "Your feedback", and "Would you recommend this opportunity to a friend?".
  - The textarea in `textarea border-gray focus:border-green w-full rounded-lg`. Remove the stray `blockx` class and the commented-out class.
  - A counter under it, right-aligned, `text-gray-dark text-xs`, "{length}/500". It turns `text-red-500` above 500.
  - The stars and the toggle stay as they are.
  - Remove the "Give Feedback / Hide Feedback" button and `showFeedback` (`:68`, `:886-899`). The section header is the toggle.

#### 1.5 Behaviour: which section opens, auto-advance, errors

**Error visibility, one rule for the whole form.** A field's message shows once a submit has been tried (`isSubmitted`), or once the youth has changed that field. Upload and map fields count as changed through `setValue(…, { shouldDirty: true })` and `dirtyFields`. Custom fields keep their existing `touched` logic. Nothing shows on open. The validity rules, `isValid` and the requiredness are unchanged.

**First open.** When the form first renders with the definitions settled (loaded, empty or failed), open the first section whose status is "Needs attention". If none, open the first section. This is decided once. The usual result is that Proof opens and the rest are closed.

**Manual toggle.** A header click or Enter/Space toggles that section only. Any number of sections may be open, and the youth's toggles always win.

**Auto-advance** applies only to sections with at least one required field (Proof, and Details when a definition is required). Business and Before you go never auto-collapse.

1. **Trigger.** The section's status changes from "Needs attention" to "Done" because of the youth's own change: a value, an upload finishing, or a pin. This fires once per change to Done. If the youth reopens a Done section by hand, it stays open until it leaves Done and comes back.
2. **The section never collapses while focus is inside it** (`section.contains(document.activeElement)`).
   - If focus is outside when the trigger fires, which is typical for an upload finishing, advance now.
   - If focus is inside, keep the advance pending until the section's next `focusout`. Run it only if, after the pointer is released (`pointerup` plus one animation frame), `document.activeElement` is outside every section card: the body, the modal background or the header. If focus or the click went into another section's header or control, cancel the advance. The youth chose where to go, and the Done section stays open.
   - If the section leaves Done while an advance is pending, cancel it.
3. **Advance** means three steps:
   - close the section;
   - open the next section after it, in table order, whose status is not "Done", unless it is already open;
   - after the close transition (`transitionend` on the closing body, or at once under `prefers-reduced-motion`), if the opened section's header is not fully visible in the form's scroller, `scrollIntoView({ block: "start", behavior })` with `scroll-mt-4`. `behavior` is `"smooth"`, or `"auto"` under reduced motion.
   Focus is never moved by an advance.
4. **Continue button.** A section with required fields gets a footer button when it is Done and still open: outline green, `h-10`, right-aligned, "Continue" with `IoArrowDown`. It runs the advance at once. This covers the case where focus sits on the last field, such as a radio. The button shows only in the Done state, so it never invites skipping a required field.

**Submit with errors.** Call `handleSubmit(onSubmit, onInvalid)` and set `shouldFocusError: false` in `useForm`.

- `onInvalid` opens every section with an error. Sections that are already open stay open, and closed ones without errors stay closed. Pending advances are cancelled.
- After the opening transition (220 ms, or the next frame under reduced motion), it scrolls the **first error in document order** to the centre of the scroller and focuses its first focusable control with `focus({ preventScroll: true })`:
  - an upload: its Upload button;
  - the map: the "use your current location" button;
  - a custom field: the first focusable element inside `[data-custom-field-key="{key}"]`, which already exists at `CustomFields.tsx:836` and `:893`;
  - feedback: the textarea.
- Mark each field's wrapper with `data-completion-error` while its message shows, so the "first in document order" query is a single `querySelector`.

**Error summary at the top.**

- It shows only after a failed submit and holds one line per field with an error, in document order.
- It updates live and disappears when nothing is left.
- Use `FormMessage` with `messageType={FormMessageType.Error}` and `classNameLabel="text-sm"`, wrapped in `role="alert" tabIndex={-1}`.
- Inside: a `font-semibold` line with the count, then a `list-disc pl-5` list. Each item is a `button type="button"` in `text-left underline`, labelled with the field's message.
- A click opens the section, then scrolls to and focuses the field, as above.
- There is a matching line above the buttons (copy table) while errors remain after a submit. It replaces the always-on warning at `:986-990`.

**Server errors** keep today's toast (`ApiErrors`). They are not field errors.

#### 1.6 Error design

- **Field messages:** `FormError` everywhere: `text-xs text-red-500 italic`, `role="alert"`. This replaces the yellow `FormMessage` Warning boxes at `:540-544`, `:611-615`, `:682-686`, `:755-759`, `:786-792`, `:929-933`, `:952-956` and `:976-980`. A field-level message is one line of red text in every section.
- **Summaries** (top and bottom): `FormMessage` Error. It is the codebase's error colour (`text-red-500` / `border-red-500`, the same as `FormError`). Yoma's palette has no dedicated error token. The palette's `--color-pink` is used for urgency, so it isn't used here.

#### 1.7 Buttons (one set across the form)

- **Primary:** Submit stays `btn bg-green hover:bg-green-dark w-full text-white md:flex-1` (`:1003`), with `IoArrowUp`.
- **Secondary, outline green:** `btn border-green text-green hover:bg-green-dark bg-white hover:text-white normal-case` (`:995`). It is used for Close, Upload, Continue and Try again. Small buttons add `btn-sm h-10 rounded-full px-4`.
- **Text link:** "use your current location" in `text-green font-semibold underline`.
- **Order** is unchanged: Close then Submit at `md:` and up, and Submit on top below `md` (`flex-col-reverse`).

#### 1.8 Motion

- Open and close use `DetailDisclosure`'s own transitions: 220 ms `ease-out` on `grid-template-rows`, the chevron's 220 ms rotate, and the note's `fade-in` 220 ms. All are already under `motion-reduce:transition-none`.
- Auto-advance and error scrolling are smooth, or instant under `prefers-reduced-motion`.
- No other animation is added.

### Copy

In `OpportunityCompletionEdit.tsx` unless named. `{title}` is the definition's `title`, verbatim, from the API.

| `file:line` | Current | New |
|---|---|---|
| `:129` | Please upload a certificate. | Upload your certificate. |
| `:141-144` | Certificate file type not supported. Please upload a file of type application/pdf, application/msword, … (MIME types) | Your certificate must be one of these file types: .pdf, .doc, .docx, .pptx, .jpg, .jpeg, .png, .webp. *(join the `_LABEL` arrays, not the MIME arrays)* |
| `:155` | Certificate file size should not exceed 10MB. | Your certificate is too big. Upload a file of 10MB or less. |
| `:170` | Please upload a picture. | Upload your picture. |
| `:179-181` | Picture file type not supported. Please upload a file of type .jpg, … | Your picture must be one of these file types: .jpg, .jpeg, .png, .webp. |
| `:189` | Picture file size should not exceed 10MB. | Your picture is too big. Upload a file of 10MB or less. |
| `:204` | Please upload a voice note. | Upload your voice note. |
| `:213-215` | Voice note file type not supported. Please upload a file of type … | Your voice note must be one of these file types: .mp3, .wav, .m4a, .amr, .ogg, .3gp. |
| `:223` | Voice note file size should not exceed 10MB. | Your voice note is too big. Upload a file of 10MB or less. |
| `:236` | Please upload a video. | Upload your video. |
| `:245-247` | Video file type not supported. Please upload a file of type … | Your video must be one of these file types: {video labels}. |
| `:255` | Video file size should not exceed 100MB. | Your video is too big. Upload a file of 100MB or less. |
| `:270` | Please select a location from the map. | Drop a pin on the map, or use your current location. |
| `:281` | The selected location is invalid. | We couldn't read that pin. Drop it on the map again. |
| `:295` | Feedback must be between 1 and 500 characters. | Keep your feedback to 500 characters or fewer. *(empty is no longer an error: Departure 2)* |
| `:307` (toast) | You need to be logged in to save an opportunity | Sign in to submit your completion. |
| `:461-462` | Upload the required documents below, and once approved, we'll add the accreditation to your CV! | Fill in the sections below. Once your completion is approved, we'll add it to your CV. |
| new (section 1 title) | — | Proof of completion |
| new (section 2 title) | "Additional details" + "COMPLETION DETAILS" + "12 fields" (`CustomFields.tsx:811`, `:853`, `:118`) | {group name} · {n}, or "Your answers · {n}" when there are several groups (open question 3) |
| new (section 2, loading) | Loading additional fields... (`CustomFields.tsx:796`) | Loading questions… |
| `:816` | Unable to load additional fields. Please try again. | We couldn't load these questions. Try again. |
| `:823` | Retry | Try again |
| `BusinessLocationField.tsx:46` | Where is your business? | *(becomes the section 3 title, same words)* |
| `BusinessLocationField.tsx:48` | Optional. Where your business is based, not where you took part. | Where your business is based, not where you took part. *(section note; "Optional" is the status)* |
| `:882` | Before you go! | Before you go |
| `:884` | Please rate your experience & provide feedback (optional). | Rate this opportunity and tell us how it went. *(section note, shown when open)* |
| `:893` | Give Feedback / Hide Feedback | *(removed; the header toggles)* |
| `:938` | Feedback | Your feedback |
| `:946` (placeholder) | Enter your feedback | What went well? What could be better? |
| new (counter) | — | {length}/500 |
| `:988` | Please supply the required information above. *(always while invalid)* | Fix the {n} {item\|items} marked above, then submit again. *(only after a failed submit)* |
| new (top summary) | — | {n} {thing\|things} to fix before you submit |
| new (status) | — | Done · Needs attention · {n} to do · Needs attention · {n} to fix · Optional |
| new (Continue) | — | Continue |
| `:999` | Close Window | Close |
| `FileUpload.tsx:271-278` (`plain` only) | Allowed file types: **.pdf, …** / Max file size: **10MB** | .pdf, .doc, .docx, .pptx, .jpg, .jpeg, .png, .webp · up to 10MB |
| `LocationPicker.tsx:144-151` (`plain` only) | *Select a pin location below or* *use your current location* | Drop a pin on the map, or **use your current location** |
| `CustomFields.tsx` label (completion only) | {title} + orange "!" when invalid | {title} for required fields; {title} (optional) for the rest |
| `CustomFields.tsx:270` | {title} is required. | By data type: String, Integer, Decimal, Date, DateTime → "Enter {title}." Option and lookups (Country, Language, Skill), single or multiple → "Choose {title}." Boolean → "Choose Yes or No for {title}." |
| `CustomFields.tsx:169` | Please enter a whole number. | With a title: "{title} must be a whole number, like 3." Without one (filters): "Enter a whole number, like 3." |
| `CustomFields.tsx:172` | Number must be between -2147483648 and 2147483647. | "{title} is too big a number." / "{title} is too small a number." (by sign). Without a title: "That number is too big." / "That number is too small." |
| `CustomFields.tsx:174` | Please enter a valid number. | "{title} must be a number, like 1500 or 12.5." Without a title: "Enter a number, like 1500 or 12.5." |
| `CustomFields.tsx:176` | Number exceeds the maximum allowed value. | "{title} is too big a number." Without a title: "That number is too big." |
| `CustomFields.tsx:278` | Please enter a valid date. | Enter a real date for {title}. |
| `CustomFields.tsx:291` | Please enter a valid value. *(fallback only; the definition's `validationErrorMessage` wins and is API copy)* | Check {title}: it isn't in the format we need. |

`getCustomFieldNumberError(dataType, value, title?)` gains the optional `title`. `getCustomFieldError` passes `definition.title`. `CustomFieldFilters.tsx:202-215` and `:857-864` keep calling it without one and get the title-less wording.

### Acceptance checks

Signed in as `testuser@gmail.com` (Jason-approved). Use an Entrepreneurship opportunity testuser hasn't completed, with all four verification types and the three required venture fields. Look one up through the API, because the ids change with every reseed. Never submit valid data.

**At 1440 (modal 700 px):**

1. All text in the dialog renders in the site font (Open Sans; DevTools → computed `font-family` resolves to the `next/font` family, not `ui-sans-serif`). The same is true in the detail page's other `CustomModal`s, for example the "Go to programme" confirmation (`OpportunityPublicDetails.tsx:882-997`).
2. Under the intro there are 4 white bordered cards: "Proof of completion", "Completion Details · 12", "Where is your business?" and "Before you go". Each has an io5 icon in a tinted 40 px square, a status line and a chevron. No `react-icons/fc` icons and no grey panels remain.
3. On open, only "Proof of completion" is open. Its status reads "Needs attention · 4 to do" with a yellow icon, and Details reads "Needs attention · 3 to do". Business and Before you go read "Optional". No error text or yellow box shows anywhere, and there is no bottom warning.
4. Inside Proof are four items separated by hairlines. Each is a label, one grey hint line ("… · up to 10MB") and an outline-green Upload button. The map item says "Drop a pin on the map, or use your current location".
5. Clicking a closed header opens it with the eased height and rotates the chevron 90°. Clicking again closes it. Several cards can be open at once.
6. In Details, the three required fields have no marker, the other nine end in "(optional)", and every control spans the card width.
7. Press Submit with nothing filled in:
   - Proof and Details are open, and Business and Before you go are unchanged.
   - The form has scrolled to the certificate item, and its Upload button has focus (visible focus ring).
   - The top summary reads "7 things to fix before you submit". Its list runs: Upload your certificate. / Upload your picture. / Upload your voice note. / Drop a pin on the map, or use your current location. / Enter Business / Venture Name. / Enter Business Summary. / Choose Yes or No for Business Registered.
   - Each field shows its message as red italic text, and the statuses read "Needs attention · 4 to fix" and "· 3 to fix" with red icons.
   - Above the buttons: "Fix the 7 items marked above, then submit again."
8. Clicking "Enter Business Summary." in the summary scrolls to that input and focuses it.
9. Close Details, press Submit again: Details reopens.
10. In Details, type a name and a summary, then choose "Yes" for Business Registered with the mouse.
    - The card stays open while focus is on the radio, its status reads "Done", and a "Continue" button appears.
    - Clicking empty modal space closes Details and opens Business, and the view scrolls to it if needed.
    - Repeat, but click "Before you go"'s header instead: Details stays open and Before you go opens.
11. Reopen Details by hand: it stays open. Clear the name: the status returns to "Needs attention" and Continue disappears.
12. Open Before you go, type two letters and delete them. There is no error, the counter shows "0/500", and the card still reads "Optional".
13. Close the dialog with "Close". The page behind is unchanged and nothing was submitted (Network: no `POST …/verify`).

**At 390 (full-screen dialog):**

14. The same cards, full width, with no horizontal scroll (`form.scrollWidth === form.clientWidth`). Status lines fit on one line or wrap under the title, and none is truncated.
15. Press Submit (Submit is above Close): the view jumps from the bottom to the certificate item, with focus on its Upload button. The summary sits above Proof.
16. With reduced motion (DevTools → Rendering → `prefers-reduced-motion: reduce`), open, close, advance and error scrolling are all instant.

**At 320:**

17. There is no horizontal overflow in the dialog. "Completion Details · 12" wraps if it must and nothing is clipped. In the admin editor's step 2 (several groups), the group label wraps and the count stays visible.
18. Every status line, the summary and every error message wraps inside its card.

**Job opportunity (one optional field):**

19. Details reads "Completion Details · 1" with the status "Optional", and it never auto-closes. Entering a valid date turns it "Done" and leaves it open.

### Departures from the current build or decisions

1. **Errors wait for a submit or a change.** Today, upload, map and summary warnings show on open. Showing errors before the youth acts reads as a mistake they haven't made, and custom fields already wait. Only timing changes: `isValid` and the rules don't.
2. **Empty feedback counts as not given.** After a youth types and clears the optional feedback, `""` fails the 1–500 rule and blocks Submit (`form-1440-feedback-open-cleared`). This contradicts "(optional)". Treat `""` (after trimming) as `null` in the schema and in the request (`:330` already sends `data.feedback || null`). The 500 maximum is unchanged.
3. **The font fix reaches every `CustomModal`.** Every modal currently renders in the system font, because they all portal outside `#mainContent`. Fixing the shared root is one change, and it makes the dialogs match the pages (BA R6 "font on headers different from rest of platform" may be this). Open question 2.
4. **The shared validators get the new wording.** The admin editor (`CustomFields`, default variant) shows the same messages. The filters (`getCustomFieldNumberError` without a title) get the title-less versions. One rule set, as the 2026-07-22 Decision requires.
5. **The "!" marker goes in the completion form only.** The youth sees "(optional)" instead. The editor keeps `FormLabel`'s icon.
6. **Grouping heading.** With one group, the h5 and the uppercase group row give way to the section header. D-87's field count is kept as "· N" in the title.
7. **"Before you go" loses its button and gets a header toggle,** like every other section. Its fields and their values are unchanged.
8. **Fc icons go.** The flat-colour illustrations are replaced by one io5 icon per section, in the detail page's tinted squares.

---

## 2. "Upload your completion files" (`OpportunityPublicDetails.tsx:637-661`)

### Current

In the tabbed layout (the live one) the button is grey with purple text: `btn bg-gray-light text-purple … h-12` (`:641`). Beside it, "Go to programme" is solid green and Save and Share are outline green (`detail-1440-top`, `detail-390-top`, `detail-320-top`). It is the only grey-and-purple button on the page.

### Changes

- **Tabbed class string** (`:641`): `btn btn-sm border-green text-green hover:bg-green-dark h-12 w-full rounded-full bg-white px-5 text-sm normal-case hover:text-white md:w-auto`. That is the outline-green tabbed style of Share (`:755`) and Save (`:732`), at Go to programme's 48 px height and full width below `md`.
- **"Go to programme"** stays the only solid green button, the page's primary action. See open question 1.
- **Icon:** `IoMdArrowUp` → io5 `IoArrowUp` (`h-5 w-5 mr-1`), matching the form's Submit.
- **The classic layout's string** (`:642`) is already outline green and stays.
- **Not changed:** the "Pending verification" and "Completed" pills (`:669`, `:689`, `:708`) are still 40 px in the tabbed layout. That is noted, not in scope.

### Copy

| `file:line` | Current | New |
|---|---|---|
| `:660` | Upload your completion files | *(unchanged)* |
| `:644` (title) | Upload your completion files to earn your achievement and have this opportunity added to your CV. | *(unchanged)* |

### Acceptance checks

- **1440:** the button is outline green, white with a green border and green text, the same as Share. It is 48 px tall and right-aligned in the header card. On hover it fills green-dark with white text. Go to programme is the only filled button.
- **390:** full width under Go to programme, Save and Share, 48 px, outline green.
- **320:** it fits on one line in the card, with no overflow.

### Departures

- Grey and purple → outline green, at Jason's request (H3).

---

## Tasks (one developer batch, in order)

1. **Fonts in modals.** Add `lib/fonts.ts` (`openSans`, `nunito`) and use it in `pages/_app.tsx`. Make `CustomModal.tsx`'s portal root carry the variables and `font-sans`, and add `#modal-root` to the `globals.css:473` rule.
2. **`DetailDisclosure`.** Add the `status` slot, the header `id` and a `className` prop. Move `TONE` into the file as an export and update `OpportunityDetailSections.tsx`'s import. The detail page must render as before.
3. **`FileUpload` / `LocationPicker`.** Add `plain` (1.4). The admin imports are unchanged. Swap `IoMdArrowUp` for `IoArrowUp`.
4. **`CustomFields`.**
   - Add `variant="completion"`: no h5, "(optional)" labels, no warning icon, full-width controls.
   - Apply the validator copy, including the `title?` parameter on `getCustomFieldNumberError`.
   - Fix the 320 group-label wrap.
5. **`BusinessLocationField`.** Remove the heading block (`:45-50`).
6. **`completionSections.ts`.** Add the pure status helper (1.3), with unit tests for Done, Needs attention to do / to fix, Optional, and a section with no required fields.
7. **`OpportunityCompletionEdit.tsx`.**
   - Build the four `DetailDisclosure` sections (1.2), the shell and icons (1.1), and the field presentation (1.4).
   - Add the error-visibility rule, first open, manual toggle, auto-advance with the focus and pointer guard, the Continue button, `onInvalid` expand, scroll and focus, and the summary (1.5).
   - Switch to `FormError` (1.6), apply the buttons (1.7) and the copy table.
   - Make empty feedback count as `null` and add the counter.
8. **`OpportunityPublicDetails.tsx:641`.** Apply H3 (section 2).
9. **Docs.**
   - Append a dated Decision to this ticket's `feature.md`: sections, auto-advance rule, error timing, empty feedback, modal font.
   - Write a handoff.
   - Update testing-guide DP-08 (`testing/2026-10-03-discovery-testing-guide.md:1177-1185`) with checks 1–19.
10. **Lead-run checks:** `tsc --noEmit`, `pnpm lint` and `pnpm test`. Then the tester runs the acceptance checks at 1440, 390 and 320.

## Open questions for Jason

1. **H3 style.** I specced **outline green**, like Save and Share, so "Go to programme" stays the one solid call to action. Would you rather have it **solid green**? For a youth who has already finished, uploading is arguably the main action.
2. **Modal font scope.** The fix is in `CustomModal`, so every dialog on the site switches from the system font to Open Sans and Nunito. OK, or limit it to the completion form for now?
3. **Custom-field section title.** It uses the definitions' group name from the API ("Completion Details"), or "Your answers" when there are several groups. Should it be fixed copy instead, such as "About your {type}" or "A few questions"? That would stop the title changing when the BA renames groups (YOM-1264).

## What I couldn't see

- **A real upload:** progress, a finished file, remove, and the wrong-type and too-big errors. The headless browser has no file chooser and I uploaded nothing, so those messages come from the code only.
- **The Video verification type and several custom-field groups:** no local opportunity has either. Their layout is inferred from the code.
- **The custom-field load-error state, a valid submit, the success dialog, and "use your current location"** (headless has no geolocation).
- **The 🎉 badge** shows as a box in headless captures.
- **768:** not captured. The modal is 700 px wide from `md` (768) up.
