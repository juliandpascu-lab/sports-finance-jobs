"""Role and preferred-market rules used by the history builder and site."""

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
    "investment banking",
    "investment banker",
    "ibd",
    "m&a",
    "merger",
    "acquisition",
    "corporate development",
    "transaction",
    "deals",
)

INVESTMENT_BANKING_TERMS = (
    "investment banking",
    "investment banker",
    "ibd",
    "m&a",
    "merger",
    "corporate development",
    "transaction",
    "deals",
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
        "arlington",
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


def is_in_role(title: str) -> bool:
    """Return whether a posting title fits the early-career watchlist."""

    normalized = " ".join(title.casefold().split())
    if SENIORITY_PATTERN.search(normalized):
        return False
    return any(term in normalized for term in ROLE_TERMS)


def is_investment_banking_or_ma(title: str) -> bool:
    """Return whether a title is specifically investment banking or M&A."""

    normalized = " ".join(title.casefold().split())
    if SENIORITY_PATTERN.search(normalized):
        return False
    if any(term in normalized for term in INVESTMENT_BANKING_TERMS):
        return True
    return "acquisition" in normalized and any(
        term in normalized
        for term in ("investment", "corporate", "merger", "m&a", "transaction", "deal")
    )


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
