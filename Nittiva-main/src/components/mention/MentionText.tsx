/**
 * MentionText — render plain text with @-mentions highlighted.
 *
 * Used wherever we display the body of a note or comment: it splits the
 * input on @-tokens and wraps each match in a styled <span>, so users
 * see "hey @sagar please review" with "sagar" rendered as a chip.
 *
 * Mirrors the backend regex from `api/utils/mentions.py`:
 *   `r"(?:^|[\s\(\[\{])(?:@)([\w][\w.\-+_@]*)"`
 *
 * The renderer is intentionally lossless — it preserves the original
 * whitespace and only injects a styled span around the matched portion.
 * Unknown mentions (no matching user) still render as a muted chip so
 * the author can see that the mention didn't resolve.
 */
import React from "react";

// Same shape as the backend regex's capture group, but anchored globally.
const MENTION_GLOBAL_RE = /(?:^|[\s(\[{])@([\w][\w.\-+_@]*)/g;

type Part =
  | { kind: "text"; value: string }
  | { kind: "mention"; value: string; unknown?: boolean };

export function renderContentWithMentions(
  text: string,
  knownUsers?: { name?: string; email?: string }[],
): Part[] {
  if (!text) return [];
  const parts: Part[] = [];
  let cursor = 0;
  MENTION_GLOBAL_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MENTION_GLOBAL_RE.exec(text)) !== null) {
    const fullMatch = m[0];
    const name = m[1];
    // fullMatch starts with the separator char (e.g. " @sagar")
    const sep = fullMatch[0];
    const matchStart = m.index;

    // Push the text up to and including the separator (preserve " " before @)
    if (matchStart > cursor) {
      parts.push({ kind: "text", value: text.slice(cursor, matchStart) });
    }
    if (sep && sep !== "@") {
      parts.push({ kind: "text", value: sep });
    }

    const isKnown =
      !knownUsers ||
      knownUsers.length === 0 ||
      knownUsers.some(
        (u) =>
          (u.name && u.name.toLowerCase() === name.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === name.toLowerCase()) ||
          (u.email &&
            u.email.split("@")[0].toLowerCase() === name.toLowerCase()),
      );

    parts.push({ kind: "mention", value: name, ...(isKnown ? {} : { unknown: true }) });
    cursor = matchStart + fullMatch.length;
  }
  if (cursor < text.length) {
    parts.push({ kind: "text", value: text.slice(cursor) });
  }
  return parts;
}

export interface MentionTextProps {
  text: string;
  /** Optional map of known users (id, name, email) to mark resolved mentions */
  knownUsers?: { name?: string; email?: string }[];
  className?: string;
  /** Optional: when set, wraps the @name in a clickable <button> */
  onMentionClick?: (raw: string) => void;
}

export function MentionText({
  text,
  knownUsers,
  className = "",
  onMentionClick,
}: MentionTextProps) {
  const parts = renderContentWithMentions(text, knownUsers);
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.kind === "text") {
          return <React.Fragment key={i}>{p.value}</React.Fragment>;
        }
        const inner = (
          <span
            className={
              "inline-flex items-center rounded-md px-1.5 py-0.5 text-sm font-medium transition-colors " +
              (p.unknown
                ? "bg-gray-700/40 text-gray-400 line-through"
                : "bg-accent/20 text-accent hover:bg-accent/30")
            }
            title={`@${p.value}${p.unknown ? " (not found)" : ""}`}
          >
            @{p.value}
          </span>
        );
        if (onMentionClick) {
          return (
            <button
              type="button"
              key={i}
              onClick={() => onMentionClick(p.value)}
              className="align-baseline"
            >
              {inner}
            </button>
          );
        }
        return <React.Fragment key={i}>{inner}</React.Fragment>;
      })}
    </span>
  );
}

export default MentionText;
