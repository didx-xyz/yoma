import { zodResolver } from "@hookform/resolvers/zod";
import moment from "moment";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import {
  IoArrowDown,
  IoArrowUp,
  IoChatbubblesOutline,
  IoCheckmarkCircle,
  IoClose,
  IoCloseCircle,
  IoCloudUploadOutline,
  IoDocumentTextOutline,
  IoEllipseOutline,
  IoStorefrontOutline,
  IoTrophy,
} from "react-icons/io5";
import { toast } from "react-toastify";
import z from "zod";
import { SpatialType } from "~/api/models/common";
import type { MyOpportunityRequestVerify } from "~/api/models/myOpportunity";
import type {
  CustomFieldValueRequest,
  OpportunityInfo,
} from "~/api/models/opportunity";
import { performActionSendForVerificationManual } from "~/api/services/myOpportunities";
import { useMyOpportunityCustomFieldDefinitionsQuery } from "~/hooks/useOpportunityMutations";
import {
  BusinessLocationField,
  type BusinessLocation,
} from "./BusinessLocationField";
import {
  CustomFields,
  getCustomFieldErrors,
  isCustomFieldEntryEmpty,
  orderCustomFieldDefinitions,
} from "./CustomFields";
import {
  COMPLETION_SECTION_IDS,
  completionSectionStatus,
  nextCompletionSection,
  type CompletionSectionId,
  type CompletionSectionStatus,
} from "./completionSections";
import {
  ACCEPTED_AUDIO_TYPES,
  ACCEPTED_AUDIO_TYPES_LABEL,
  ACCEPTED_DOC_TYPES,
  ACCEPTED_DOC_TYPES_LABEL,
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_IMAGE_TYPES_LABEL,
  ACCEPTED_VIDEO_TYPES,
  ACCEPTED_VIDEO_TYPES_LABEL,
  CUSTOM_FIELDS_ENABLED,
  DATE_FORMAT_SYSTEM,
  OPPORTUNITY_TYPE_NAME_ENTREPRENEURSHIP,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
  MAX_FILE_VIDEO_SIZE,
  MAX_FILE_VIDEO_SIZE_LABEL,
} from "~/lib/constants";
import { analytics } from "~/lib/analytics";
import { BTN_OUTLINE_GREEN } from "../Common/buttonStyles";
import FormError from "../Common/FormError";
import FormMessage, { FormMessageType } from "../Common/FormMessage";
import { ApiErrors } from "../Status/ApiErrors";
import { Loading } from "../Status/Loading";
import { CelebrationIcon } from "./CelebrationIcon";
import { FileUpload, type FileUploadData } from "./FileUpload";
import LocationPicker from "./LocationPicker";
import { RequiredMark } from "./RequiredMark";
import {
  DIALOG_CLOSE,
  DIALOG_HEADING,
  DIALOG_PRIMARY,
  DIALOG_SECONDARY,
} from "./dialog";
import { DetailDisclosure, TONE } from "./TabbedDetails/DetailDisclosure";

// ─────────────────────────────────────────────────────────────────────────────
// The youth's completion form (2026-10-21 redesign): four `DetailDisclosure` sections — Proof
// of completion, Tell us about it (the completion custom fields), Where is your business?
// (Entrepreneurship) and Before you go — each with a Done / Needs attention / Optional status
// line. Errors show once a submit was tried or the field was changed; a section with required
// fields closes itself and opens the next once it is Done (never while focus is inside any
// section); a failed submit opens every section with an error and focuses the first invalid
// control.
// Which fields are required still comes from the opportunity's verification types and the
// custom-field definitions; the zod rules are unchanged apart from empty feedback.
// ─────────────────────────────────────────────────────────────────────────────

interface InputProps {
  [id: string]: any;
  opportunityInfo: OpportunityInfo | undefined;

  onClose?: () => void;
  onSave?: () => void;
}

/**
 * The Proof items, in order: each verification type's form field, its TUS upload id and, for
 * an upload, its file rules and the noun its messages use ("Upload your certificate.").
 */
const PROOF_FIELDS = [
  {
    type: "FileUpload",
    name: "certificate",
    uploadIdName: "certificateUploadId",
    noun: "certificate",
    accept: [...ACCEPTED_DOC_TYPES, ...ACCEPTED_IMAGE_TYPES],
    labels: [...ACCEPTED_DOC_TYPES_LABEL, ...ACCEPTED_IMAGE_TYPES_LABEL],
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeLabel: MAX_FILE_SIZE_LABEL,
  },
  {
    type: "Picture",
    name: "picture",
    uploadIdName: "pictureUploadId",
    noun: "picture",
    accept: ACCEPTED_IMAGE_TYPES,
    labels: ACCEPTED_IMAGE_TYPES_LABEL,
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeLabel: MAX_FILE_SIZE_LABEL,
  },
  {
    type: "VoiceNote",
    name: "voiceNote",
    uploadIdName: "voiceNoteUploadId",
    noun: "voice note",
    accept: ACCEPTED_AUDIO_TYPES,
    labels: ACCEPTED_AUDIO_TYPES_LABEL,
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeLabel: MAX_FILE_SIZE_LABEL,
  },
  {
    type: "Video",
    name: "video",
    uploadIdName: "videoUploadId",
    noun: "video",
    accept: ACCEPTED_VIDEO_TYPES,
    labels: ACCEPTED_VIDEO_TYPES_LABEL,
    maxFileSize: MAX_FILE_VIDEO_SIZE,
    maxFileSizeLabel: MAX_FILE_VIDEO_SIZE_LABEL,
  },
  { type: "Location", name: "geometry", uploadIdName: null },
] as const;

type ProofField = (typeof PROOF_FIELDS)[number];
type ProofUpload = Exclude<ProofField, { uploadIdName: null }>;
const isUpload = (f: ProofField): f is ProofUpload => f.uploadIdName !== null;

const FEEDBACK_MAX = 500;

/** The first control a youth can act on inside a field's wrapper. */
const FOCUSABLE =
  'button:not([disabled]), input:not([type="hidden"]):not([hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const reducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Runs `fn` once a section's body has eased open or shut (`transitionend` on the body, or a
 * fallback when its height did not change). Under reduced motion, or with no body to watch,
 * after two frames, so the open/closed state has committed to the DOM.
 */
const afterSectionTransition = (
  id: CompletionSectionId | undefined,
  fn: () => void,
): void => {
  const body = id ? document.getElementById(`section-${id}-body`) : null;
  if (!body || reducedMotion()) {
    requestAnimationFrame(() => requestAnimationFrame(fn));
    return;
  }
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    body.removeEventListener("transitionend", onEnd);
    clearTimeout(fallback);
    fn();
  };
  const onEnd = (event: TransitionEvent) => {
    if (event.target === body) finish();
  };
  body.addEventListener("transitionend", onEnd);
  const fallback = setTimeout(finish, 320);
};

/**
 * The status line under a section title (1.3): only the icon carries the colour — the same
 * check / cross as the fields' `RequiredMark`, so header and fields read as one.
 */
const StatusLine: React.FC<{ status: CompletionSectionStatus }> = ({
  status,
}) => {
  const base = "mt-0.5 flex items-center gap-1 text-[13px] leading-snug";
  const icon = "h-4 w-4 shrink-0";
  switch (status.kind) {
    case "done":
      return (
        <span className={`${base} text-green font-semibold`}>
          <IoCheckmarkCircle className={icon} />
          <span>Done</span>
        </span>
      );
    case "attention": {
      const count =
        status.count > 0
          ? ` · ${status.count} to ${status.afterSubmit ? "fix" : "do"}`
          : "";
      return (
        <span
          className={`${base} ${
            status.afterSubmit ? "font-semibold text-black" : "text-gray-dark"
          }`}
        >
          <IoCloseCircle
            className={`${icon} ${status.afterSubmit ? "text-pink" : "text-orange"}`}
          />
          <span>Needs attention{count}</span>
        </span>
      );
    }
    case "optional":
      return (
        <span className={`${base} text-gray-dark`}>
          <IoEllipseOutline className={icon} />
          <span>Optional</span>
        </span>
      );
  }
};

const OUTLINE_BUTTON = `${BTN_OUTLINE_GREEN} h-10 px-4`;

interface Section {
  id: CompletionSectionId;
  icon: React.ReactNode;
  toneClass: string;
  title: string;
  count?: number;
  note?: string;
  status: CompletionSectionStatus;
  /** Only a section with required fields auto-advances and offers Continue. */
  hasRequired: boolean;
  content: React.ReactNode;
}

/** The static "Loading questions…" row that stands in for section 2 while they load. */
interface LoadingRow {
  id: CompletionSectionId;
  loading: true;
  icon: React.ReactNode;
  toneClass: string;
  title: string;
}

const isSection = (row: Section | LoadingRow): row is Section =>
  !("loading" in row);

interface SummaryItem {
  key: string;
  section: CompletionSectionId;
  /** The field wrapper, for the scroll-and-focus. */
  selector: string;
  message: string;
}

export const OpportunityCompletionEdit: React.FC<InputProps> = ({
  id,
  opportunityInfo,
  onClose,
  onSave,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  // Only an Entrepreneurship completion asks where the venture is (2026-10-11).
  const isEntrepreneurship =
    opportunityInfo?.type === OPPORTUNITY_TYPE_NAME_ENTREPRENEURSHIP;

  // Definition-driven completion custom fields (YOM-1244 / YOM-1255), loaded per
  // opportunity (type resolved server-side). The section renders only when some apply.
  const {
    data: customFieldDefinitions,
    isLoading: customFieldDefinitionsIsLoading,
    isError: customFieldDefinitionsIsError,
    refetch: refetchCustomFieldDefinitions,
  } = useMyOpportunityCustomFieldDefinitionsQuery(opportunityInfo?.id ?? "", {
    enabled: !!opportunityInfo?.id,
  });

  const hasVerificationType = useCallback(
    (type: ProofField["type"]) =>
      !!opportunityInfo?.verificationTypes?.find((x) => x.type == type),
    [opportunityInfo],
  );

  const schema = z
    .object({
      certificate: z.any(),
      certificateUploadId: z.string().optional(),
      picture: z.any(),
      pictureUploadId: z.string().optional(),
      voiceNote: z.any(),
      voiceNoteUploadId: z.string().optional(),
      geometry: z.any(),
      video: z.any(),
      videoUploadId: z.string().optional(),
      dateStart: z.union([z.string(), z.null()]).optional(),

      recommendable: z.boolean().nullable().optional(),
      starRating: z.preprocess(
        (val) => (val === 0 ? null : val),
        z.number().nullable().optional(),
      ),
      // optional: feedback typed and cleared again is no feedback, not an error
      feedback: z.preprocess(
        (val) => (typeof val === "string" && val.trim() === "" ? null : val),
        z.string().nullable().optional(),
      ),
      // definition-driven custom fields; validated against their definitions below
      customFields: z.array(z.any()).nullish(),
      // Entrepreneurship only: where the venture is based (`BusinessLocationField`)
      businessLocation: z.any().optional(),
    })
    .superRefine((values, ctx) => {
      // custom fields must be valid before submitting (required + typed rules).
      // Per-field errors also render inline in the CustomFields component.
      for (const { error } of getCustomFieldErrors(
        customFieldDefinitions,
        values.customFields as CustomFieldValueRequest[] | null | undefined,
      )) {
        ctx.addIssue({
          message: error,
          code: z.ZodIssueCode.custom,
          path: ["customFields"],
        });
      }

      // Uploads: required when the opportunity asks for them; a file not yet uploaded
      // through TUS is checked for type and size here
      for (const f of PROOF_FIELDS) {
        if (!isUpload(f) || !hasVerificationType(f.type)) continue;
        const file = values[f.name];
        const uploaded = !!values[f.uploadIdName];
        const issue = (message: string) =>
          ctx.addIssue({
            message,
            code: z.ZodIssueCode.custom,
            path: [f.name],
            fatal: true,
          });
        if (!file && !uploaded) issue(`Upload your ${f.noun}.`);
        else if (file && !uploaded) {
          if (file.type && !f.accept.includes(file.type))
            issue(
              `Your ${f.noun} must be one of these file types: ${f.labels.join(", ")}.`,
            );
          if (file.size && file.size > f.maxFileSize)
            issue(
              `Your ${f.noun} is too big. Upload a file of ${f.maxFileSizeLabel} or less.`,
            );
        }
      }

      // Geometry validation
      if (hasVerificationType("Location")) {
        if (!values.geometry) {
          ctx.addIssue({
            message: "Drop a pin on the map, or use your current location.",
            code: z.ZodIssueCode.custom,
            path: ["geometry"],
            fatal: true,
          });
        } else if (
          !values.geometry.coordinates ||
          !Array.isArray(values.geometry.coordinates) ||
          values.geometry.coordinates.length === 0
        ) {
          ctx.addIssue({
            message: "We couldn't read that pin. Drop it on the map again.",
            code: z.ZodIssueCode.custom,
            path: ["geometry"],
            fatal: true,
          });
        }
      }

      // Feedback validation
      if (values.feedback != null && values.feedback.length > FEEDBACK_MAX) {
        ctx.addIssue({
          message: `Keep your feedback to ${FEEDBACK_MAX} characters or fewer.`,
          code: z.ZodIssueCode.custom,
          path: ["feedback"],
        });
      }
    });

  type SchemaType = z.infer<typeof schema>;

  const onSubmit = useCallback(
    (data: SchemaType) => {
      if (!session) {
        toast.warning("Sign in to submit your completion.");
        return;
      }
      if (!opportunityInfo) {
        toast.warning("Something went wrong. Please try again.");
        return;
      }

      const request: MyOpportunityRequestVerify = {
        certificate: data.certificateUploadId ? undefined : data.certificate,
        certificateUploadId: data.certificateUploadId || undefined,
        picture: data.pictureUploadId ? undefined : data.picture,
        pictureUploadId: data.pictureUploadId || undefined,
        voiceNote: data.voiceNoteUploadId ? undefined : data.voiceNote,
        voiceNoteUploadId: data.voiceNoteUploadId || undefined,
        video: data.videoUploadId ? undefined : data.video,
        videoUploadId: data.videoUploadId || undefined,
        geometry: data.geometry,
        dateStart: data.dateStart || null,
        dateEnd: null,
        commitmentInterval: null,
        recommendable: data.recommendable || null,
        starRating: data.starRating || null,
        feedback: data.feedback || null,
        // custom fields: submit the FULL applicable collection (replacement semantics —
        // the API clears any custom field omitted from the payload). Reconcile against
        // the current definitions so stale keys are dropped, and drop empty entries.
        customFields: (() => {
          const definitionKeys = new Set(
            (customFieldDefinitions ?? []).map((d) => d.key),
          );
          return (
            (data.customFields ?? []) as CustomFieldValueRequest[]
          ).filter(
            (v) =>
              definitionKeys.has(v.key) &&
              ((v.value != null && v.value.trim() !== "") ||
                (v.values != null && v.values.length > 0)),
          );
        })(),
      };

      // The business location, for Entrepreneurship only: the API rejects a manual location for
      // any other type. Unset parts are left out (`objectToFormData` skips them).
      const business = data.businessLocation as BusinessLocation | undefined;
      if (isEntrepreneurship && business?.countryId) {
        request.countryId = business.countryId;
        request.region = business.place.region;
        request.city = business.place.city;
      }

      // convert dates to UTC string in format "YYYY-MM-DD" while preserving UTC timezone
      if (request.dateStart) {
        request.dateStart = request.dateStart
          ? moment.utc(request.dateStart).format(DATE_FORMAT_SYSTEM)
          : null;
      }

      setIsLoading(true);

      performActionSendForVerificationManual(opportunityInfo.id, request)
        .then(() => {
          // Track opportunity completion
          analytics.opportunity.completed(
            opportunityInfo.id,
            opportunityInfo.title,
          );

          setIsLoading(false);
          if (onSave) {
            onSave();
          }
        })
        .catch((error: unknown) => {
          setIsLoading(false);
          toast(<ApiErrors error={error} />, {
            type: "error",
            toastId: "opportunityCompleteError",
            autoClose: false,
            icon: false,
          });
        });
    },
    [
      onSave,
      opportunityInfo,
      session,
      customFieldDefinitions,
      isEntrepreneurship,
    ],
  );

  const {
    handleSubmit,
    setValue,
    formState: { errors, isSubmitted, touchedFields, dirtyFields },
    control,
    watch,
    trigger,
  } = useForm({
    mode: "onChange", // Validates on change
    reValidateMode: "onChange", // Re-validates on change
    resolver: zodResolver(schema),
    // the form scrolls to and focuses the first error itself (`onInvalid`): the values are
    // set through `setValue` and `Controller`, so react-hook-form has no refs to focus
    shouldFocusError: false,
  });
  const values = watch();

  // ── error visibility: once a submit was tried, or once the youth changed the field ──
  const shown = (name: string): boolean =>
    isSubmitted || !!touchedFields[name] || !!dirtyFields[name];
  const messageOf = (name: string): string | undefined => {
    const error = errors[name];
    return error && shown(name) ? String(error.message) : undefined;
  };
  const feedbackMessage = messageOf("feedback");

  // ── the sections' statuses, from the values the form already has ──
  const proofFields = useMemo(
    () => PROOF_FIELDS.filter((f) => hasVerificationType(f.type)),
    [hasVerificationType],
  );
  const proofGiven = (f: ProofField): boolean =>
    f.uploadIdName
      ? !!(values[f.name] || values[f.uploadIdName])
      : !!values[f.name];
  const proofGivenCount = proofFields.filter(proofGiven).length;
  const proofStatus = completionSectionStatus(
    {
      required: proofFields.length,
      requiredGiven: proofGivenCount,
      given: proofGivenCount,
      errors: proofFields.filter((f) => !!errors[f.name]).length,
    },
    isSubmitted,
  );

  const customFieldValues = values.customFields as
    | CustomFieldValueRequest[]
    | null
    | undefined;
  const customFieldErrors = useMemo(
    () => getCustomFieldErrors(customFieldDefinitions, customFieldValues),
    [customFieldDefinitions, customFieldValues],
  );
  const orderedDefinitions = useMemo(
    () => orderCustomFieldDefinitions(customFieldDefinitions),
    [customFieldDefinitions],
  );
  const detailsHasRequired = orderedDefinitions.some((d) => d.isRequired);
  const detailsStatus = (() => {
    const byKey = new Map<string, CustomFieldValueRequest>();
    (customFieldValues ?? []).forEach((v) => byKey.set(v.key, v));
    const givenOf = (required: boolean) =>
      orderedDefinitions.filter(
        (d) =>
          (!required || d.isRequired) &&
          !isCustomFieldEntryEmpty(byKey.get(d.key)),
      ).length;
    return completionSectionStatus(
      {
        required: orderedDefinitions.filter((d) => d.isRequired).length,
        requiredGiven: givenOf(true),
        given: givenOf(false),
        errors: customFieldErrors.length,
      },
      isSubmitted,
    );
  })();

  const businessLocation = values.businessLocation as
    | BusinessLocation
    | undefined;
  const businessStatus = completionSectionStatus(
    {
      required: 0,
      requiredGiven: 0,
      given: businessLocation?.countryId ? 1 : 0,
      errors: 0,
    },
    isSubmitted,
  );

  const feedbackText: string = values.feedback || "";
  const feedbackStatus = completionSectionStatus(
    {
      required: 0,
      requiredGiven: 0,
      given:
        (values.starRating ? 1 : 0) +
        (feedbackText.trim() ? 1 : 0) +
        (values.recommendable ? 1 : 0),
      errors: errors.feedback ? 1 : 0,
    },
    isSubmitted,
  );

  // ── open / closed, and the auto-advance machinery ──
  // Proof is always required and always empty at mount, so with it present the first-open
  // decision is already made: it opens in the first paint instead of easing open a tick after
  // the sheet appears, which read as a layout shift (Jason, 2026-10-22). Without it the
  // decision waits for the definitions (below).
  const [open, setOpen] = useState<
    Partial<Record<CompletionSectionId, boolean>>
  >(() => (proofFields.length > 0 ? { "completion-proof": true } : {}));
  const decidedRef = useRef(proofFields.length > 0);
  const formRef = useRef<HTMLFormElement>(null);
  const sectionEls = useRef<
    Partial<Record<CompletionSectionId, HTMLDivElement | null>>
  >({});
  /** The Done section waiting for focus to leave it before it advances. */
  const pendingRef = useRef<CompletionSectionId | null>(null);
  const pointerDownRef = useRef(false);
  /** Each section's last status kind, to spot the youth's own change to Done. */
  const lastKindRef = useRef<
    Partial<Record<CompletionSectionId, CompletionSectionStatus["kind"]>>
  >({});

  useEffect(() => {
    const down = () => (pointerDownRef.current = true);
    const up = () => (pointerDownRef.current = false);
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointerup", up, true);
    document.addEventListener("pointercancel", up, true);
    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointerup", up, true);
      document.removeEventListener("pointercancel", up, true);
    };
  }, []);

  /**
   * Scrolls a section's header into view when it is not fully visible. The dialog box is the one
   * scroller (`CustomModal`'s `#custom-modal-content`); the form itself never scrolls, so a second
   * scrollbar never appears inside the first (Jason, 2026-10-22).
   */
  const revealSection = useCallback((sectionId: CompletionSectionId) => {
    const el = sectionEls.current[sectionId];
    const form = formRef.current;
    if (!el || !form) return;
    const viewport = form.closest<HTMLElement>("#custom-modal-content") ?? form;
    const header = document.getElementById(`section-${sectionId}-header`) ?? el;
    const h = header.getBoundingClientRect();
    const f = viewport.getBoundingClientRect();
    if (h.top >= f.top && h.bottom <= f.bottom) return;
    el.scrollIntoView({
      block: "start",
      behavior: reducedMotion() ? "auto" : "smooth",
    });
  }, []);

  // The latest statuses, for callbacks that run outside a render.
  const latestStatuses = useRef<
    Partial<Record<CompletionSectionId, CompletionSectionStatus>>
  >({});

  /** Whether focus is inside a section other than `sectionId`. */
  const focusInOtherSection = (sectionId: CompletionSectionId): boolean => {
    const active = document.activeElement;
    return COMPLETION_SECTION_IDS.some(
      (other) =>
        other !== sectionId && !!sectionEls.current[other]?.contains(active),
    );
  };

  /**
   * Close a Done section and open the next one that is not Done (1.5, step 3). With nothing
   * after it to go to, the section stays open.
   */
  const advance = useCallback(
    (sectionId: CompletionSectionId) => {
      pendingRef.current = null;
      const next = nextCompletionSection(sectionId, latestStatuses.current);
      if (!next) return;
      setOpen((prev) => ({
        ...prev,
        [sectionId]: false,
        ...(prev[next] ? {} : { [next]: true }),
      }));
      afterSectionTransition(sectionId, () => revealSection(next));
    },
    [revealSection],
  );

  /**
   * A Done section advances now if focus is outside every section; once focus leaves if it is
   * inside this one; and not at all if it is in another (the youth is already working there).
   */
  const requestAdvance = (sectionId: CompletionSectionId) => {
    const own = sectionEls.current[sectionId];
    if (own?.contains(document.activeElement)) pendingRef.current = sectionId;
    else if (!focusInOtherSection(sectionId)) advance(sectionId);
  };

  /**
   * Focus left a section with a pending advance. Once the pointer is up and a frame has
   * passed: focus still inside keeps it pending, focus in another section cancels it (the
   * youth chose where to go), and focus anywhere else runs it.
   */
  const onSectionBlur = (sectionId: CompletionSectionId) => {
    if (pendingRef.current !== sectionId) return;
    const check = () =>
      requestAnimationFrame(() => {
        if (pendingRef.current !== sectionId) return;
        const own = sectionEls.current[sectionId];
        if (own?.contains(document.activeElement)) return;
        if (focusInOtherSection(sectionId)) pendingRef.current = null;
        else advance(sectionId);
      });
    if (pointerDownRef.current)
      document.addEventListener("pointerup", check, { once: true });
    else check();
  };

  const toggleSection = (sectionId: CompletionSectionId) => {
    // the youth's toggles always win over a pending advance
    if (pendingRef.current === sectionId) pendingRef.current = null;
    setOpen((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  /** Scroll a field's wrapper to the centre of the form and focus its first control. */
  const focusField = useCallback((wrapper: HTMLElement) => {
    wrapper.scrollIntoView({
      block: "center",
      behavior: reducedMotion() ? "auto" : "smooth",
    });
    wrapper.querySelector<HTMLElement>(FOCUSABLE)?.focus({
      preventScroll: true,
    });
  }, []);

  const openAndFocus = useCallback(
    (sectionId: CompletionSectionId, selector: string) => {
      pendingRef.current = null;
      setOpen((prev) => ({ ...prev, [sectionId]: true }));
      afterSectionTransition(sectionId, () => {
        const wrapper = formRef.current?.querySelector<HTMLElement>(selector);
        if (wrapper) focusField(wrapper);
      });
    },
    [focusField],
  );

  /** Submit with errors: open every section with an error, then focus the first. */
  const onInvalid = useCallback(
    (fieldErrors: FieldErrors) => {
      pendingRef.current = null;
      const withErrors: CompletionSectionId[] = [];
      if (PROOF_FIELDS.some((f) => fieldErrors[f.name]))
        withErrors.push("completion-proof");
      if (fieldErrors.customFields) withErrors.push("completion-details");
      if (fieldErrors.feedback) withErrors.push("completion-feedback");
      setOpen((prev) => ({
        ...prev,
        ...Object.fromEntries(withErrors.map((s) => [s, true])),
      }));
      // the first invalid control is in the first section with errors (document order)
      afterSectionTransition(withErrors[0], () => {
        const first = formRef.current?.querySelector<HTMLElement>(
          "[data-completion-error]",
        );
        if (first) focusField(first);
      });
    },
    [focusField],
  );

  // ── the error summary (after a failed submit), in document order ──
  const summaryItems: SummaryItem[] = isSubmitted
    ? [
        ...proofFields.flatMap((f) => {
          const message = messageOf(f.name);
          return message
            ? [
                {
                  key: f.name,
                  section: "completion-proof" as const,
                  selector: `[data-completion-field="${f.name}"]`,
                  message,
                },
              ]
            : [];
        }),
        ...orderedDefinitions.flatMap((d) => {
          const error = customFieldErrors.find((e) => e.key === d.key);
          return error
            ? [
                {
                  key: d.key,
                  section: "completion-details" as const,
                  selector: `[data-custom-field-key="${CSS.escape(d.key)}"]`,
                  message: error.error,
                },
              ]
            : [];
        }),
        ...(feedbackMessage
          ? [
              {
                key: "feedback",
                section: "completion-feedback" as const,
                selector: '[data-completion-field="feedback"]',
                message: feedbackMessage,
              },
            ]
          : []),
      ]
    : [];

  // ── upload handlers: one per proof field ──
  const onUploadComplete = (f: ProofUpload) => (files: FileUploadData[]) => {
    const set = (name: string, value: unknown) =>
      setValue(name, value, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    const fileData = files[0];
    if (fileData) {
      if (fileData.uploadId) {
        // TUS upload complete, set upload ID
        set(f.uploadIdName, fileData.uploadId);
        set(f.name, undefined);

        // Track file upload completion
        analytics.trackEvent("opportunity_completion_file_uploaded", {
          opportunityId: opportunityInfo?.id,
          opportunityTitle: opportunityInfo?.title,
          fileType: f.name,
          uploadId: fileData.uploadId,
          fileName: fileData.file?.name,
          fileSize: fileData.file?.size,
        });
      } else {
        // Legacy mode or upload in progress; clear the upload ID when the file changes
        set(f.name, fileData.file);
        set(f.uploadIdName, undefined);
      }
    } else {
      // File removed, clear both fields
      set(f.name, undefined);
      set(f.uploadIdName, undefined);
    }
  };

  const proofItem = (f: ProofField, index: number) => {
    const message = messageOf(f.name);
    const label = opportunityInfo?.verificationTypes?.find(
      (x) => x.type == f.type,
    )?.description;
    // every proof item is required: given and valid is done, else missing
    const mark = (
      <RequiredMark
        done={proofGiven(f) && !errors[f.name]}
        afterSubmit={isSubmitted}
      />
    );
    const control = isUpload(f) ? (
      <FileUpload
        id={`fileUpload_${f.name}`}
        plain
        files={[]}
        fileTypes={f.accept.join(", ")}
        fileTypesLabels={f.labels.join(", ")}
        allowMultiple={false}
        maxFileSize={f.maxFileSize}
        maxFileSizeLabel={f.maxFileSizeLabel}
        label={label}
        mark={mark}
        inlineUpload={true}
        onUploadComplete={onUploadComplete(f)}
      />
    ) : (
      <LocationPicker
        id="locationpicker"
        plain
        label={label}
        mark={mark}
        onSelect={(coords) => {
          const result = coords
            ? {
                type: SpatialType.Point,
                coordinates: [[coords.lng, coords.lat, 0]],
              }
            : null;
          setValue("geometry", result, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
        }}
      />
    );
    return (
      <div
        key={f.name}
        data-completion-field={f.name}
        data-completion-error={message ? "" : undefined}
        className={index > 0 ? "border-gray border-t pt-4" : undefined}
      >
        {control}
        {message && (
          <div className="mt-2">
            <FormError label={message} />
          </div>
        )}
      </div>
    );
  };

  // ── the sections, in table order; each only when it applies ──
  const definitionsSettled =
    !CUSTOM_FIELDS_ENABLED ||
    (!customFieldDefinitionsIsLoading &&
      (customFieldDefinitions !== undefined || customFieldDefinitionsIsError));
  const showDetails =
    CUSTOM_FIELDS_ENABLED &&
    !!opportunityInfo &&
    (customFieldDefinitionsIsError || orderedDefinitions.length > 0);

  const rows: (Section | LoadingRow)[] = [];
  if (proofFields.length > 0)
    rows.push({
      id: "completion-proof",
      icon: <IoCloudUploadOutline className="h-5 w-5" />,
      toneClass: TONE.green,
      title: "Proof of completion",
      status: proofStatus,
      hasRequired: true,
      content: (
        <div className="flex flex-col gap-4">{proofFields.map(proofItem)}</div>
      ),
    });
  if (CUSTOM_FIELDS_ENABLED && !!opportunityInfo && !definitionsSettled)
    // a static row while the definitions load; it never opens and never advances
    rows.push({
      id: "completion-details",
      loading: true,
      icon: <span className="loading loading-spinner loading-xs" />,
      toneClass: TONE.blue,
      title: "Loading questions…",
    });
  if (showDetails)
    rows.push({
      id: "completion-details",
      icon: <IoDocumentTextOutline className="h-5 w-5" />,
      toneClass: TONE.blue,
      title: "Tell us about it",
      count: customFieldDefinitionsIsError
        ? undefined
        : orderedDefinitions.length,
      status: customFieldDefinitionsIsError
        ? { kind: "attention", count: 0, afterSubmit: false }
        : detailsStatus,
      hasRequired: detailsHasRequired,
      content: customFieldDefinitionsIsError ? (
        <div className="flex flex-col items-start gap-3">
          <FormMessage
            messageType={FormMessageType.Error}
            classNameLabel="text-sm"
          >
            We couldn&apos;t load these questions. Try again.
          </FormMessage>
          <button
            type="button"
            className={OUTLINE_BUTTON}
            onClick={() => void refetchCustomFieldDefinitions()}
          >
            Try again
          </button>
        </div>
      ) : (
        <Controller
          control={control}
          name="customFields"
          render={({ field: { onChange, value } }) => (
            <CustomFields
              variant="completion"
              definitions={customFieldDefinitions}
              values={value as CustomFieldValueRequest[] | null | undefined}
              onChange={onChange}
              showErrors={isSubmitted}
              // No intro line, and no definition descriptions: they're written
              // for admins, and the titles and options carry the meaning
              hideDescriptions
              // the section header carries the title and count; several groups keep their
              // headings
              hideGrouping={
                new Set(orderedDefinitions.map((d) => d.group)).size <= 1
              }
            />
          )}
        />
      ),
    });
  if (isEntrepreneurship)
    rows.push({
      id: "completion-business",
      icon: <IoStorefrontOutline className="h-5 w-5" />,
      toneClass: TONE.lilac,
      title: "Where is your business?",
      note: "Where your business is based, not where you took part.",
      status: businessStatus,
      hasRequired: false,
      content: (
        <Controller
          control={control}
          name="businessLocation"
          render={({ field: { onChange, value } }) => (
            <BusinessLocationField
              value={value as BusinessLocation | undefined}
              onChange={onChange}
            />
          )}
        />
      ),
    });
  rows.push({
    id: "completion-feedback",
    icon: <IoChatbubblesOutline className="h-5 w-5" />,
    toneClass: TONE.gold,
    title: "Before you go",
    note: "Rate this opportunity and tell us how it went.",
    status: feedbackStatus,
    hasRequired: false,
    content: (
      <div className="flex flex-col gap-4">
        {/* STAR RATING */}
        <div className="flex flex-col gap-2">
          <div id="completion-rating-label" className="text-sm font-semibold">
            Rating
          </div>
          <Controller
            control={control}
            name="starRating"
            defaultValue={0}
            render={({ field: { onChange, value } }) => (
              <div
                className="rating"
                role="radiogroup"
                aria-labelledby="completion-rating-label"
              >
                <input
                  type="radio"
                  name="rating-2"
                  className="rating-hidden"
                  aria-label="No rating"
                  checked={value === 0}
                  readOnly
                />
                {[1, 2, 3, 4, 5].map((x) => (
                  <input
                    key={x}
                    type="radio"
                    name="rating-2"
                    className="mask bg-orange mask-star-2"
                    aria-label={`${x} ${x === 1 ? "star" : "stars"}`}
                    checked={value === x}
                    onChange={() => onChange(x)}
                  />
                ))}
              </div>
            )}
          />
        </div>

        {/* FEEDBACK */}
        <div
          className="flex flex-col gap-2"
          data-completion-field="feedback"
          data-completion-error={feedbackMessage ? "" : undefined}
        >
          <label
            htmlFor="completion-feedback-text"
            className="text-sm font-semibold"
          >
            Your feedback
          </label>
          <Controller
            control={control}
            name="feedback"
            render={({ field: { onChange, onBlur, value } }) => (
              <textarea
                id="completion-feedback-text"
                className="textarea border-gray focus:border-green w-full rounded-lg focus:outline-none"
                placeholder="What went well? What could be better?"
                value={value || ""}
                onChange={onChange}
                onBlur={onBlur}
              />
            )}
          />
          <div
            className={`text-right text-xs ${
              feedbackText.length > FEEDBACK_MAX
                ? "text-red-500"
                : "text-gray-dark"
            }`}
          >
            {feedbackText.length}/{FEEDBACK_MAX}
          </div>
          {feedbackMessage && <FormError label={feedbackMessage} />}
        </div>

        {/* RECOMMENDABLE */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="completion-recommendable"
            className="text-sm font-semibold"
          >
            Would you recommend this opportunity to a friend?
          </label>
          <Controller
            control={control}
            name="recommendable"
            render={({ field: { onChange, value } }) => (
              <input
                id="completion-recommendable"
                type="checkbox"
                className="toggle toggle-success"
                checked={value || false}
                onChange={(e) => onChange(e.target.checked)}
              />
            )}
          />
        </div>
      </div>
    ),
  });

  const sections = rows.filter(isSection);
  const statuses: Partial<
    Record<CompletionSectionId, CompletionSectionStatus>
  > = Object.fromEntries(sections.map((s) => [s.id, s.status]));
  latestStatuses.current = statuses;

  // ── first validation once the definitions have settled (and again should they change, e.g.
  //    after Try again); the first pass decides which section opens: the first that needs
  //    attention, else the first ──
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!definitionsSettled) return;
    let cancelled = false;
    void trigger().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [definitionsSettled, customFieldDefinitions, trigger]);
  useEffect(() => {
    if (!ready || decidedRef.current) return;
    decidedRef.current = true;
    const statuses = latestStatuses.current;
    const present = COMPLETION_SECTION_IDS.filter((s) => statuses[s]);
    const first =
      present.find((s) => statuses[s]?.kind === "attention") ?? present[0];
    if (first) setOpen({ [first]: true });
  }, [ready]);

  // ── auto-advance: a section with required fields that the youth just brought to Done ──
  useEffect(() => {
    for (const s of sections) {
      const prev = lastKindRef.current[s.id];
      lastKindRef.current[s.id] = s.status.kind;
      if (!s.hasRequired || !decidedRef.current) continue;
      if (prev === "attention" && s.status.kind === "done")
        requestAdvance(s.id);
      else if (
        prev === "done" &&
        s.status.kind !== "done" &&
        pendingRef.current === s.id
      )
        pendingRef.current = null;
    }
  });

  const count = summaryItems.length;

  return (
    <>
      {/* On <body>, not inside the dialog: the dialog box keeps a transform from its entry
          animation, which would pin a fixed overlay to the box and leave the scrolled part of
          the form uncovered. */}
      {isLoading && createPortal(<Loading />, document.body)}

      <form
        key={`OpportunityComplete_${id}`}
        ref={formRef}
        className="flex flex-col overflow-x-hidden"
        onSubmit={handleSubmit(onSubmit, onInvalid)}
      >
        <div className="flex flex-col">
          <div className="flex justify-end p-3">
            <button
              type="button"
              aria-label="Close"
              className={DIALOG_CLOSE}
              onClick={onClose}
            >
              <IoClose className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-col">
            <div className="flex flex-col gap-3 px-4 pb-6 md:px-6">
              <div className="flex flex-col items-center gap-5 text-center">
                <CelebrationIcon
                  icon={<IoTrophy className="text-yellow h-10 w-10" />}
                />
                <div className="flex flex-col gap-2">
                  <h3 className={DIALOG_HEADING}>Completed an opportunity?</h3>
                  <p className="text-gray-dark text-sm md:text-base">
                    Fill in the sections below. Once your completion is
                    approved, we&apos;ll add it to your CV.
                  </p>
                </div>
              </div>

              {/* ERROR SUMMARY — after a failed submit, one line per field, in document order */}
              {count > 0 && (
                <div role="alert" tabIndex={-1}>
                  <FormMessage
                    messageType={FormMessageType.Error}
                    classNameLabel="text-sm"
                  >
                    <span className="block font-semibold">
                      {count} {count === 1 ? "thing" : "things"} to fix before
                      you submit
                    </span>
                    <ul className="list-disc pl-5">
                      {summaryItems.map((item) => (
                        <li key={item.key}>
                          <button
                            type="button"
                            className="block text-left underline"
                            onClick={() =>
                              openAndFocus(item.section, item.selector)
                            }
                          >
                            {item.message}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </FormMessage>
                </div>
              )}

              {/* SECTIONS */}
              {rows.map((s) => {
                if (!isSection(s))
                  return (
                    <DetailDisclosure
                      key={s.id}
                      id={s.id}
                      icon={s.icon}
                      toneClass={s.toneClass}
                      title={s.title}
                      static
                      open={false}
                      onToggle={() => undefined}
                    />
                  );
                const isOpen = !!open[s.id];
                const canContinue =
                  s.hasRequired &&
                  s.status.kind === "done" &&
                  isOpen &&
                  nextCompletionSection(s.id, statuses) !== null;
                return (
                  <div
                    key={s.id}
                    ref={(el) => {
                      sectionEls.current[s.id] = el;
                    }}
                    className="scroll-mt-4"
                    onBlur={() => onSectionBlur(s.id)}
                  >
                    <DetailDisclosure
                      id={s.id}
                      icon={s.icon}
                      toneClass={s.toneClass}
                      title={s.title}
                      count={s.count}
                      note={s.note}
                      status={<StatusLine status={s.status} />}
                      open={isOpen}
                      onToggle={() => toggleSection(s.id)}
                    >
                      <div className="flex flex-col gap-4">
                        {s.content}
                        {canContinue && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              className={OUTLINE_BUTTON}
                              onClick={() => advance(s.id)}
                            >
                              Continue
                              <IoArrowDown className="ml-1 h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </DetailDisclosure>
                  </div>
                );
              })}

              {count > 0 && (
                <FormMessage
                  messageType={FormMessageType.Error}
                  classNameLabel="text-sm"
                >
                  Fix the {count} {count === 1 ? "thing" : "things"} marked
                  above, then submit again.
                </FormMessage>
              )}

              <div className="mt-2 flex w-full flex-col-reverse gap-3 md:flex-row">
                <button
                  type="button"
                  className={`${DIALOG_SECONDARY} md:flex-1`}
                  onClick={onClose}
                >
                  <IoClose className="mr-2 h-5 w-5" />
                  Close
                </button>
                <button type="submit" className={`${DIALOG_PRIMARY} md:flex-1`}>
                  <IoArrowUp className="mr-2 h-5 w-5" />
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};
