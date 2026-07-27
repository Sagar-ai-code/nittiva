/**
 * MentionInput — a plain <textarea> with @-mention autocomplete.
 *
 * How it works:
 *  1. Watches the user's caret position via onSelect/onKeyUp/onChange.
 *  2. Looks backwards from the caret for an `@<query>` token
 *     (delimited by whitespace, start-of-string, or punctuation).
 *  3. If found, opens a dropdown above the caret, debounces a
 *     `apiService.searchUsers(q)` call, and renders the matches.
 *  4. On Enter / click, replaces `@<query>` with `@<name> ` and
 *     re-focuses the textarea.
 *
 * Why a plain textarea (not a rich-text editor)?
 *   Nittiva notes are stored as plain text in `Note.content`. The
 *   backend mention parser (`api/utils/mentions.py`) only matches
 *   plain `@word` patterns, so any rich-text markup would not be
 *   recognised. Keeping the UI in sync with the parser is the path
 *   of least surprise. Plane's Tiptap extension is the obvious next
 *   step if/when we add formatting.
 *
 * Props:
 *   value            — current text value
 *   onChange(value)  — fires on every keystroke; replace the parent state
 *   onKeyDown?       — optional handler (used to also send the comment)
 *   placeholder?     — textarea placeholder
 *   rows?            — textarea rows (default 4)
 *   className?       — extra classes for the textarea
 *   disabled?        — disables the input
 *   autoFocus?       — autofocus on mount
 */
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { apiService, MentionUser } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

// Matches the *trailing* @<query> just before the caret. We only want to
// fire the dropdown when the caret is inside or right after an @-token.
//
// Rules:
//   - `@` must be at start-of-string OR preceded by whitespace / ( [ {
//   - `@` may also follow another `@` (so "@@alex" doesn't break)
//   - Query may contain letters, digits, dot, dash, plus, underscore
//     (mirrors the backend regex in api/utils/mentions.py minus the @ char)
//   - The query must be at the caret's end position (no trailing space)
const ACTIVE_MENTION_RE = /(?:^|[\s(\[{])@([\w.\-+_]*)$/;

function getActiveMention(value: string, caret: number) {
  // Look at the slice from 0..caret
  const before = value.slice(0, caret);
  const match = before.match(ACTIVE_MENTION_RE);
  if (!match) return null;
  // The @ start position in the full value:
  // before = "<prefix> @<query>"
  //         0       ^  ^      ^
  //                m.index+... m.index
  const at = before.lastIndexOf(`@${match[1]}`);
  return { query: match[1], atStart: at, queryEnd: caret };
}

export function MentionInput({
  value,
  onChange,
  onKeyDown,
  placeholder = "Write something... use @ to mention a teammate",
  rows = 4,
  className = "",
  disabled = false,
  autoFocus = false,
}: MentionInputProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [caret, setCaret] = useState(0);
  const [users, setUsers] = useState<MentionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = useMemo(
    () => getActiveMention(value, caret),
    [value, caret],
  );

  // Debounced search when @-query changes
  useEffect(() => {
    if (!active) {
      setUsers([]);
      setDropdownPos(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiService.searchUsers(active.query, 8);
        if (res.success && res.data) {
          setUsers(res.data.results || []);
          setHighlight(0);
        } else {
          setUsers([]);
        }
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [active?.query, active?.atStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Position the dropdown near the caret using a hidden mirror element.
  // Computing caret pixel position from a textarea is fiddly; for v1 we
  // simply anchor the dropdown just under the textarea (the user is
  // looking at the textarea anyway).
  useEffect(() => {
    if (active && users.length > 0) {
      setDropdownPos({ top: 0, left: 0 });
    } else {
      setDropdownPos(null);
    }
  }, [active, users]);

  const insertMention = useCallback(
    (user: MentionUser) => {
      if (!active) return;
      const before = value.slice(0, active.atStart);
      const after = value.slice(active.queryEnd);
      // Use the user's name (matches backend `name__iexact` resolution);
      // backend also accepts exact email / email prefix if name differs.
      const insertion = `@${user.name} `;
      const newValue = `${before}${insertion}${after}`;
      const newCaret = before.length + insertion.length;
      onChange(newValue);
      // Restore caret
      requestAnimationFrame(() => {
        if (taRef.current) {
          taRef.current.focus();
          taRef.current.setSelectionRange(newCaret, newCaret);
          setCaret(newCaret);
        }
      });
      setUsers([]);
    },
    [active, value, onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If dropdown is open and user is navigating it
    if (active && users.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => (h + 1) % users.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => (h - 1 + users.length) % users.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(users[highlight]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setUsers([]);
        return;
      }
    }
    // Otherwise pass through to the parent
    onKeyDown?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const updateCaretFromEvent = (
    e:
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.SyntheticEvent<HTMLTextAreaElement>,
  ) => {
    const el = e.currentTarget;
    setCaret(el.selectionStart ?? el.value.length);
  };

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="relative">
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => {
          handleChange(e);
          updateCaretFromEvent(e);
        }}
        onKeyDown={(e) => {
          handleKeyDown(e);
          updateCaretFromEvent(e);
        }}
        onClick={updateCaretFromEvent}
        onSelect={updateCaretFromEvent}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        autoFocus={autoFocus}
        className={
          "flex w-full rounded-md border border-dashboard-border bg-dashboard-bg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-dashboard-surface disabled:opacity-50 resize-none " +
          className
        }
      />

      {active && (users.length > 0 || loading) && dropdownPos && (
        <div
          className="absolute z-50 mt-1 w-72 max-h-60 overflow-y-auto rounded-md border border-dashboard-border bg-dashboard-surface shadow-2xl"
          style={{ top: "100%", left: 0 }}
          onMouseDown={(e) => e.preventDefault() /* keep focus on textarea */}
        >
          {loading && users.length === 0 ? (
            <div className="p-3 text-xs text-gray-400">Searching…</div>
          ) : (
            <ul className="py-1">
              {users.map((u, i) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => insertMention(u)}
                    onMouseEnter={() => setHighlight(i)}
                    className={
                      "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors " +
                      (i === highlight
                        ? "bg-dashboard-bg text-white"
                        : "text-gray-300 hover:bg-dashboard-bg/60")
                    }
                  >
                    <Avatar className="w-6 h-6 shrink-0">
                      {u.photo_url ? (
                        <img
                          src={u.photo_url}
                          alt={u.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <AvatarFallback className="text-xs bg-accent text-black">
                          {initials(u.name || u.email)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-white">{u.name || u.email}</div>
                      <div className="truncate text-xs text-gray-500">
                        {u.email}
                        {u.role ? ` · ${u.role}` : ""}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-dashboard-border px-3 py-1.5 text-[10px] text-gray-500 flex items-center justify-between">
            <span>↑↓ navigate · Enter select</span>
            <span>Esc dismiss</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MentionInput;
