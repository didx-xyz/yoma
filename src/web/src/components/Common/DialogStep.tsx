/**
 * One row of a dialog's "what happens next" list (the completion dialogs' chrome, `dialog.ts`):
 * a tinted icon square, a bold title and a one-line note. Shared by the opportunity page's
 * submitted / pending dialogs and the Yo-ID dialogs.
 */
export const DialogStep: React.FC<{
  icon: React.ReactNode;
  toneClass: string;
  title: string;
  note: React.ReactNode;
}> = ({ icon, toneClass, title, note }) => (
  <li className="flex items-start gap-3">
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass}`}
    >
      {icon}
    </span>
    <span className="min-w-0">
      <span className="block text-[15px] font-extrabold text-black">
        {title}
      </span>
      <span className="text-gray-dark block text-sm leading-snug">{note}</span>
    </span>
  </li>
);
