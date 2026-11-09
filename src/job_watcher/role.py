"""Role and preferred-market rules used by the history builder and site."""

from __future__ import annotations

import re

ROLE_PATTERNS = (
    r"\b(?:financial|finance)\s+analyst\b",
    r"\bfp\s*&\s*a\s+analyst\b",
    r"\b(?:corporate finance|revenue finance|strategic finance|treasury|credit|"
    r"commercial banking|corporate banking|valuation|investment|portfolio|risk|"
    r"asset management|private credit|corporate development|transaction advisory)\s+analyst\b",
    r"\binvestment banking\s+analyst\b",
    r"\banalyst\s+(?:corporate finance|revenue finance|strategic finance|treasury|credit|"
    r"commercial banking|corporate banking|valuation|investment|portfolio|risk|"
    r"asset management|private credit|corporate development|transaction advisory)\b",
    r"\b(?:equity research)\s+associate\b",
    r"\bassociate\s+(?:equity research)\b",
    r"\bm\s*&\s*a(?:\s+advisory)?\s+analyst\b",
    r"\banalyst\s+m\s*&\s*a(?:\s+advisory)?\b",
    r"\banalyst\s+fp\s*&\s*a\b",
    r"\btreasury(?:\s+[a-z0-9&]+){0,3}\s+analyst\b",
    r"\banalyst(?:\s+[a-z0-9&]+){0,3}\s+treasury\b",
    r"\bibd(?:\s+[a-z0-9&]+){0,2}\s+analyst\b",
    r"\banalyst\s+investment\s+banking\b",
    r"\banalyst\s+ibd\b",
)

INVESTMENT_BANKING_TERMS = (
    "investment banking analyst",
    "m&a analyst",
    "m&a advisory analyst",
    "ibd",
)

TARGET_MARKETS = (
    "Dallas-Fort Worth",
    "Kansas City",
    "Austin",
    "Fayetteville / Northwest Arkansas",
    "New York",
)

_MARKET_MARKERS = {
    "Dallas-Fort Worth": (
        "dallas",
        "dallas-fort worth",
        "dfw",
        "fort worth",
        "arlington, tx",
        "arlington tx",
        "arlington texas",
        "frisco",
        "irving",
        "mckinney",
        "plano",
        "richardson",
    ),
    "Kansas City": (
        "kansas city",
        "lee's summit",
        "lenexa",
        "olathe",
        "overland park",
        "shawnee",
    ),
    "Austin": (
        "austin",
        "cedar park",
        "georgetown",
        "pflugerville",
        "round rock",
    ),
    "Fayetteville / Northwest Arkansas": (
        "fayetteville",
        "bentonville",
        "bella vista",
        "rogers",
        "springdale",
        "lowell",
        "johnson",
        "tontitown",
        "siloam springs",
    ),
    "New York": (
        "new york",
        "new york city",
        "nyc",
        "brooklyn",
        "bronx",
        "jersey city",
        "manhattan",
        "nassau county",
        "queens",
        "staten island",
        "suffolk county",
        "white plains",
    ),
}

SENIORITY_PATTERN = re.compile(
    r"\b(?:senior|sr\.?|lead|manager|director|vice president|vp|head|"
    r"principal|staff|chief|executive)\b",
    re.IGNORECASE,
)


def _normalize_title(title: str) -> str:
    return re.sub(r"[^a-z0-9&]+", " ", title.casefold()).strip()


def is_in_role(title: str) -> bool:
    """Return whether a title matches one of the twenty approved job families."""

    normalized = _normalize_title(title)
    if SENIORITY_PATTERN.search(normalized):
        return False
    return any(re.search(pattern, normalized) for pattern in ROLE_PATTERNS)


def is_investment_banking_or_ma(title: str) -> bool:
    """Return whether a title is specifically investment banking or M&A."""

    normalized = _normalize_title(title)
    if SENIORITY_PATTERN.search(normalized):
        return False
    return any(term in normalized for term in INVESTMENT_BANKING_TERMS) and "analyst" in normalized


def matched_markets(location: str) -> tuple[str, ...]:
    """Return all preferred markets represented by an ATS location string."""

    normalized = " ".join(location.casefold().split())
    return tuple(
        market
        for market in TARGET_MARKETS
        if any(marker in normalized for marker in _MARKET_MARKERS[market])
    )


def is_target_market(location: str) -> bool:
    """Return whether a posting is located in one of the requested markets."""

    return bool(matched_markets(location))


def is_preferred_posting(title: str, location: str) -> bool:
    """Apply the user's role and market preferences to a normalized posting.

    New York is intentionally narrower: only entry-level investment-banking or
    M&A titles are included there. The other requested markets use the broader
    finance, FP&A, business, and analytics title rule.
    """

    markets = matched_markets(location)
    if not markets:
        return False
    if any(market != "New York" for market in markets):
        return is_in_role(title)
    return is_investment_banking_or_ma(title)
