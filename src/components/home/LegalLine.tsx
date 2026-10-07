"use client";

type LegalLineProps = {
  prefix: string;
  terms: string;
  joiner: string;
  privacy: string;
  onTerms: () => void;
  onPrivacy: () => void;
};

// DESIGN-ASSUMPTION (A-onboarding.md §1.6 #18): inline text buttons, since the Button atom has no inline-text variant.
const linkClass = "font-semibold text-ink underline active:opacity-60 [@media(pointer:fine)]:hover:text-ink-hover";

/** "By continuing you agree to our Terms and Privacy Policy" with the two links as buttons. */
export function LegalLine({ prefix, terms, joiner, privacy, onTerms, onPrivacy }: LegalLineProps) {
  return (
    <p className="mt-0.5 text-center text-13 leading-[1.4] text-muted">
      {prefix}
      <button type="button" onClick={onTerms} className={linkClass}>
        {terms}
      </button>
      {joiner}
      <button type="button" onClick={onPrivacy} className={linkClass}>
        {privacy}
      </button>
    </p>
  );
}
