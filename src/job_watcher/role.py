"""The title-only role rule used by the history builder and site."""

from __future__ import annotations

import re

ROLE_TERMS = (
    "analyst",
    "analytics",
    "finance",
    "financial",
    "fp&a",
    "strategy",
    "strategic",
    "planning",
    "revenue",
    "pricing",
    "operations",
    "accounting",
    "treasury",
    "business intelligence",
)

SENIORITY_PATTERN = re.compile(
    r"\b(?:senior|sr\.?|lead|manager|director|vice president|vp|head|"
    r"principal|staff|chief|executive)\b",
    re.IGNORECASE,
)


def is_in_role(title: str) -> bool:
    """Return whether a posting title fits the early-career watchlist."""

    normalized = " ".join(title.casefold().replace("&", " & ").split())
    if SENIORITY_PATTERN.search(normalized):
        return False
    return any(term in normalized for term in ROLE_TERMS)
