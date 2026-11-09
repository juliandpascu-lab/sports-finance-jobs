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
    method: str = "GET"
    page_size: int = 100
    search_term: str = ""
    site_number: str = ""


# These boards cover professional teams, sports technology, sports media,
# ticketing, sports commerce, sports betting/prediction markets, investment
# banking, credit, fintech, startups, higher education, and general finance.
# The endpoints are public ATS JSON feeds; the pipeline never reads board HTML.
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
    SourceConfig(
        "campusapps",
        "Campus Apps / Financial Technology Partners",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/campusapps/jobs?content=true",
        "https://job-boards.greenhouse.io/campusapps",
    ),
    SourceConfig(
        "ducerapartnerscampus",
        "Ducera Partners",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/ducerapartnerscampus/jobs?content=true",
        "https://job-boards.greenhouse.io/ducerapartnerscampus",
    ),
    SourceConfig(
        "financialtechnologypartners",
        "Financial Technology Partners",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/financialtechnologypartners/jobs?content=true",
        "https://job-boards.greenhouse.io/financialtechnologypartners",
    ),
    SourceConfig(
        "glcadvisors",
        "GLC Advisors",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/glcadvisors/jobs?content=true",
        "https://job-boards.greenhouse.io/glcadvisors",
    ),
    SourceConfig(
        "solomonpartnersprofessionals",
        "Solomon Partners",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/solomonpartnersprofessionals/jobs?content=true",
        "https://job-boards.greenhouse.io/solomonpartnersprofessionals",
    ),
    SourceConfig(
        "saxllp",
        "SAX Advisory Group",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/saxllp/jobs?content=true",
        "https://job-boards.greenhouse.io/saxllp",
    ),
    SourceConfig(
        "offdeal",
        "OffDeal",
        "Ashby",
        "https://api.ashbyhq.com/posting-api/job-board/offdeal",
        "https://jobs.ashbyhq.com/offdeal",
    ),
    SourceConfig(
        "fourhands",
        "Four Hands",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/fourhands/jobs?content=true",
        "https://job-boards.greenhouse.io/fourhands",
    ),
    SourceConfig(
        "capitalfarmcredit",
        "Capital Farm Credit",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/capitalfarmcredit/jobs?content=true",
        "https://job-boards.greenhouse.io/capitalfarmcredit",
    ),
    SourceConfig(
        "successacademycharterschool",
        "Success Academy Charter Schools",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/successacademycharterschool/jobs?content=true",
        "https://job-boards.greenhouse.io/successacademycharterschool",
    ),
    SourceConfig(
        "taketwo",
        "Take-Two Interactive Software",
        "Greenhouse",
        "https://boards-api.greenhouse.io/v1/boards/taketwo/jobs?content=true",
        "https://job-boards.greenhouse.io/taketwo",
    ),
    SourceConfig(
        "utaustin",
        "University of Texas at Austin",
        "Workday",
        "https://utaustin.wd1.myworkdayjobs.com/wday/cxs/utaustin/UTstaff/jobs",
        "https://utaustin.wd1.myworkdayjobs.com/en-US/UTstaff",
        method="POST",
        page_size=20,
    ),
    SourceConfig(
        "nutrabolt",
        "Nutrabolt",
        "Workday",
        "https://nutrabolt.wd108.myworkdayjobs.com/wday/cxs/nutrabolt/Nutrabolt_Careers/jobs",
        "https://nutrabolt.wd108.myworkdayjobs.com/en-US/Nutrabolt_Careers",
        method="POST",
        page_size=20,
    ),
    SourceConfig(
        "fidelity",
        "Fidelity Investments",
        "Workday",
        "https://fmr.wd1.myworkdayjobs.com/wday/cxs/fmr/FidelityCareers/jobs",
        "https://fmr.wd1.myworkdayjobs.com/en-US/FidelityCareers",
        method="POST",
        page_size=20,
    ),
    SourceConfig(
        "intuitive",
        "Intuitive",
        "SmartRecruiters",
        "https://api.smartrecruiters.com/v1/companies/Intuitive/postings",
        "https://jobs.smartrecruiters.com/Intuitive",
        page_size=100,
    ),
    SourceConfig(
        "rrdonnelley",
        "RR Donnelley",
        "SmartRecruiters",
        "https://api.smartrecruiters.com/v1/companies/RRDonnelley/postings",
        "https://jobs.smartrecruiters.com/RRDonnelley",
        page_size=100,
    ),
    SourceConfig(
        "experian",
        "Experian",
        "SmartRecruiters",
        "https://api.smartrecruiters.com/v1/companies/Experian/postings",
        "https://jobs.smartrecruiters.com/Experian",
        page_size=100,
    ),
    SourceConfig(
        "oraclecareers",
        "Oracle",
        "Oracle",
        "https://eeho.fa.us2.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions",
        "https://careers.oracle.com/en/sites/jobsearch/",
        page_size=100,
        site_number="jobsearch",
    ),
)

SOURCE_BY_NAME = {source.name: source for source in SOURCES}

ROLE_NAME = "Entry-level finance, FP&A, analytics, credit, and New York IB/M&A"
ROLE_RULE_SUMMARY = (
    "Include titles containing analyst, analytics, finance, FP&A, financial, "
    "strategy, planning, revenue, pricing, operations, accounting, treasury, "
    "business intelligence, investment banking, investment banker, M&A, "
    "merger, acquisition, corporate development, transaction, or deals; "
    "exclude obvious seniority titles such as "
    "senior, lead, manager, director, VP, head, principal, staff, chief, "
    "and executive."
)
