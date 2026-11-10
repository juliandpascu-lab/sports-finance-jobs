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

SCHOOL_PROGRAM_MARKERS = (
    "usc",
    "ucla",
    "uchicago",
    "u chicago",
    "uc berkeley",
    "washu",
    "nyu",
    "indiana university",
)

SCHOOL_PROGRAM_PATTERN = re.compile(
    r"\b(?:summer|winter|spring|fall)\s+(?:analyst|associate)\b|"
    r"\b(?:campus|undergraduate|graduate|student|intern|internship)\b|"
    r"\b20\d{2}\s+(?:(?:january|july|summer|winter|spring|fall)\s+)?"
    r"(?:ibd|investment banking)\b.*\b(?:full time|analyst)\b|"
    r"\bibd\s+full time\s+analyst\b",
    re.IGNORECASE,
)

NON_FINANCIAL_RISK_MARKERS = (
    "cyber",
    "security",
    "information technology",
    "technology",
    "physical",
    "clinical",
    "environmental",
    "safety",
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
        "dallas-fort worth",
        "dfw",
        "dallas, tx",
        "dallas tx",
        "dallas texas",
        "dallas, texas",
        "fort worth, tx",
        "fort worth tx",
        "fort worth texas",
        "fort worth, texas",
        "arlington, tx",
        "arlington tx",
        "arlington texas",
        "frisco, tx",
        "frisco tx",
        "frisco texas",
        "frisco, texas",
        "irving, tx",
        "irving tx",
        "irving texas",
        "irving, texas",
        "mckinney, tx",
        "mckinney tx",
        "mckinney texas",
        "mckinney, texas",
        "plano, tx",
        "plano tx",
        "plano texas",
        "plano, texas",
        "richardson, tx",
        "richardson tx",
        "richardson texas",
        "richardson, texas",
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
        "austin, tx",
        "austin tx",
        "austin texas",
        "austin, texas",
        "cedar park, tx",
        "cedar park tx",
        "cedar park texas",
        "cedar park, texas",
        "georgetown, tx",
        "georgetown tx",
        "georgetown texas",
        "georgetown, texas",
        "pflugerville, tx",
        "pflugerville tx",
        "pflugerville texas",
        "pflugerville, texas",
        "round rock, tx",
        "round rock tx",
        "round rock texas",
        "round rock, texas",
    ),
    "Fayetteville / Northwest Arkansas": (
        "northwest arkansas",
        "nwa",
        "fayetteville, ar",
        "fayetteville ar",
        "fayetteville, arkansas",
        "fayetteville arkansas",
        "bentonville, ar",
        "bentonville ar",
        "bentonville, arkansas",
        "bentonville arkansas",
        "bella vista, ar",
        "bella vista ar",
        "bella vista, arkansas",
        "bella vista arkansas",
        "rogers, ar",
        "rogers ar",
        "rogers, arkansas",
        "rogers arkansas",
        "springdale, ar",
        "springdale ar",
        "springdale, arkansas",
        "springdale arkansas",
        "lowell, ar",
        "lowell ar",
        "lowell, arkansas",
        "lowell arkansas",
        "johnson, ar",
        "johnson ar",
        "johnson, arkansas",
        "johnson arkansas",
        "tontitown, ar",
        "tontitown ar",
        "tontitown, arkansas",
        "tontitown arkansas",
        "siloam springs, ar",
        "siloam springs ar",
        "siloam springs, arkansas",
        "siloam springs arkansas",
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


def is_school_restricted_program(title: str) -> bool:
    """Return whether an IB/M&A title is tied to a campus recruiting lane."""

    normalized = _normalize_title(title)
    if not any(term in normalized for term in ("ibd", "investment banking", "m&a")):
        return False
    if SCHOOL_PROGRAM_PATTERN.search(normalized):
        return True
    return any(
        re.search(rf"\b{re.escape(marker)}\b", normalized)
        for marker in SCHOOL_PROGRAM_MARKERS
    )


def is_in_role(title: str) -> bool:
    """Return whether a title matches one of the twenty approved job families."""

    normalized = _normalize_title(title)
    if is_school_restricted_program(title):
        return False
    if SENIORITY_PATTERN.search(normalized):
        return False
    if re.search(r"\brisk\s+analyst\b", normalized) and any(
        marker in normalized for marker in NON_FINANCIAL_RISK_MARKERS
    ):
        return False
    return any(re.search(pattern, normalized) for pattern in ROLE_PATTERNS)


def is_investment_banking_or_ma(title: str) -> bool:
    """Return whether a title is specifically investment banking or M&A."""

    normalized = _normalize_title(title)
    if is_school_restricted_program(title):
        return False
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

    All requested markets use the broader finance, FP&A, credit, banking, risk,
    and analyst title rule. School-specific IB recruiting programs are excluded
    even when their title contains ``IBD Analyst``.
    """

    markets = matched_markets(location)
    if not markets:
        return False
    return is_in_role(title)
