"""
@mention parser.

Extracts @-mentions from freeform text and resolves them to user IDs within
a tenant. Patterned after Plane's mention extraction (uses BeautifulSoup on
HTML), but simpler: we match plain text because the @-syntax we use is
@<word> (e.g., "@sagar" or "@sagar@example.com").

Resolution order (first match wins):
  1. Exact email match (case-insensitive)
  2. Email-prefix match:  "@sagar" matches "sagar@example.com"
  3. Exact name match (case-insensitive)

Returns a list of user IDs. Duplicates removed.
"""
import re
from typing import List, Optional

from django.db.models import Q

# Match @<word> where word is one or more of:
#   - letters / digits
#   - . - + _
#   - @ (so we can match @user@example.com too)
# Requires the @ to be at the start OR preceded by whitespace / punctuation
# (so we don't match "user@example.com" as a mention).
_MENTION_RE = re.compile(r"(?:^|[\s\(\[\{])(?:@)([\w][\w.\-+_@]*)")


def parse_mentions(text: Optional[str], tenant_id) -> List:
    """Extract @-mentions from `text` and resolve them to user IDs.

    Args:
        text: The freeform text to parse. Falsy values return [].
        tenant_id: UUID of the tenant to scope user lookups to.

    Returns:
        List of user IDs (deduplicated). Order is not guaranteed.
    """
    if not text or not tenant_id:
        return []

    candidates = set(_MENTION_RE.findall(text))
    if not candidates:
        return []

    # Lazy import to avoid circular deps
    from api.models import User

    user_ids: set = set()
    for candidate in candidates:
        # 1. Exact email match
        user = User.objects.filter(tenant_id=tenant_id, email__iexact=candidate).first()
        if user:
            user_ids.add(user.id)
            continue
        # 2. Email-prefix match: "@sagar" → "sagar@*"
        if "@" not in candidate:
            user = User.objects.filter(
                tenant_id=tenant_id, email__istartswith=candidate + "@"
            ).first()
            if user:
                user_ids.add(user.id)
                continue
        # 3. Full-name match (case-insensitive): "@priya sharma"
        user = User.objects.filter(tenant_id=tenant_id, name__iexact=candidate).first()
        if user:
            user_ids.add(user.id)
            continue
        # 4. First-name or last-name match: "@priya" or "@sharma"
        #     Matches anyone in the tenant whose name (lowercased) starts
        #     with the candidate (lowercased). If multiple match, the first
        #     one (by created_at) wins. (Plane's "loose" behavior; precise
        #     pickers are handled by the @mention UI's dropdown.)
        if " " not in candidate:
            user = (
                User.objects
                .filter(tenant_id=tenant_id)
                .filter(Q(name__istartswith=candidate) | Q(name__icontains=" " + candidate))
                .order_by("id")
                .first()
            )
            if user:
                user_ids.add(user.id)

    return list(user_ids)


def extract_mention_candidates(text: Optional[str]) -> List[str]:
    """Return just the raw mention strings (no user lookup). Useful for UI previews."""
    if not text:
        return []
    return list(set(_MENTION_RE.findall(text)))
