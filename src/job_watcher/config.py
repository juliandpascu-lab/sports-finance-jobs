"""Watchlist and project-level role configuration."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SourceConfig:
    """One public employer board that can be fetched without authentication."""

    name: str
    employer: str
    ats: str
    endpoint: str
    board_url: str


# These boards cover professional teams, sports technology, sports media,
# ticketing, sports commerce, and sports betting/prediction markets. The
# endpoints are public ATS JSON feeds; the pipeline never reads board HTML.
SOURCES: tuple[SourceConfig, ...] = (
    SourceConfig(
        "baltimoreorioles",
        "Baltimore Orioles",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/baltimoreorioles/jobs?content=true",
        "https://job-boards.greenhouse.io/baltimoreorioles",
    ),
    SourceConfig(
        "nflcareers",
        "NFL",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/nflcareers/jobs?content=true",
        "https://job-boards.greenhouse.io/nflcareers",
    ),
    SourceConfig(
        "lions",
        "Detroit Lions",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/lions/jobs?content=true",
        "https://job-boards.greenhouse.io/lions",
    ),
    SourceConfig(
        "fccincinnati",
        "FC Cincinnati",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/fccincinnati/jobs?content=true",
        "https://job-boards.greenhouse.io/fccincinnati",
    ),
    SourceConfig(
        "hudl",
        "Hudl",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/hudl/jobs?content=true",
        "https://job-boards.greenhouse.io/hudl",
    ),
    SourceConfig(
        "geniussports",
        "Genius Sports",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/geniussports/jobs?content=true",
        "https://job-boards.greenhouse.io/geniussports",
    ),
    SourceConfig(
        "seatgeek",
        "SeatGeek",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/seatgeek/jobs?content=true",
        "https://job-boards.greenhouse.io/seatgeek",
    ),
    SourceConfig(
        "sbnation",
        "SB Nation",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/sbnation/jobs?content=true",
        "https://job-boards.greenhouse.io/sbnation",
    ),
    SourceConfig(
        "fanaticsfbg",
        "Fanatics Betting & Gaming",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/fanaticsfbg/jobs?content=true",
        "https://job-boards.greenhouse.io/fanaticsfbg",
    ),
    SourceConfig(
        "theathletic",
        "The Athletic",
        "Lever",
        "https://api.lever.co/v0/postings/theathletic?mode=json",
        "https://jobs.lever.co/theathletic",
    ),
    SourceConfig(
        "legend",
        "Legend",
        "Lever",
        "https://api.lever.co/v0/postings/Legend?mode=json",
        "https://jobs.lever.co/Legend",
    ),
    SourceConfig(
        "flosports",
        "FloSports",
        "Ashby",
        "https://api.ashbyhq.com/posting-api/job-board/flosports",
        "https://jobs.ashbyhq.com/flosports",
    ),
    SourceConfig(
        "novig",
        "Novig",
        "Ashby",
        "https://api.ashbyhq.com/posting-api/job-board/novig",
        "https://jobs.ashbyhq.com/novig",
    ),
    SourceConfig(
        "onyx",
        "Onyx Games",
        "Ashby",
        "https://api.ashbyhq.com/posting-api/job-board/onyx",
        "https://jobs.ashbyhq.com/onyx",
    ),
    SourceConfig(
        "brodie_rec_league",
        "Brodie Rec League",
        "Ashby",
        "https://api.ashbyhq.com/posting-api/job-board/Brodie%20Rec%20League",
        "https://jobs.ashbyhq.com/Brodie%20Rec%20League",
    ),
)

SOURCE_BY_NAME = {source.name: source for source in SOURCES}

ROLE_NAME = "Early-career sports finance, business, and analytics"
ROLE_RULE_SUMMARY = (
    "Include titles containing analyst, analytics, finance, FP&A, financial, "
    "strategy, planning, revenue, pricing, operations, accounting, treasury, "
    "or business intelligence; exclude obvious seniority titles such as "
    "senior, lead, manager, director, VP, head, principal, staff, chief, "
    "and executive."
)
