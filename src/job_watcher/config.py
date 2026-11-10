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
        "southwest",
        "Southwest Airlines",
        "Workday",
        "https://swa.wd1.myworkdayjobs.com/wday/cxs/swa/external/jobs",
        "https://swa.wd1.myworkdayjobs.com/en-US/external",
        method="POST",
        page_size=20,
    ),
    SourceConfig(
        "tysonfoods",
        "Tyson Foods",
        "Workday",
        "https://tysonfoods.wd5.myworkdayjobs.com/wday/cxs/tysonfoods/TSN/jobs",
        "https://tysonfoods.wd5.myworkdayjobs.com/en-US/TSN",
        method="POST",
        page_size=20,
    ),
    SourceConfig(
        "jbhunt",
        "J.B. Hunt Transport Services",
        "Workday",
        "https://jbhunt.wd501.myworkdayjobs.com/wday/cxs/jbhunt/careers/jobs",
        "https://jbhunt.wd501.myworkdayjobs.com/en-us/careers",
        method="POST",
        page_size=20,
    ),
    SourceConfig(
        "uasys",
        "University of Arkansas System",
        "Workday",
        "https://uasys.wd5.myworkdayjobs.com/wday/cxs/uasys/UASYS/jobs",
        "https://uasys.wd5.myworkdayjobs.com/en-US/UASYS",
        method="POST",
        page_size=20,
    ),
    SourceConfig(
        "q2",
        "Q2 Holdings",
        "Workday",
        "https://q2ebanking.wd5.myworkdayjobs.com/wday/cxs/q2ebanking/Q2/jobs",
        "https://q2ebanking.wd5.myworkdayjobs.com/en-US/Q2",
        method="POST",
        page_size=20,
    ),
    SourceConfig(
        "umb",
        "UMB Financial",
        "Workday",
        "https://umb.wd1.myworkdayjobs.com/wday/cxs/umb/UMBExternal/jobs",
        "https://umb.wd1.myworkdayjobs.com/en-US/UMBExternal",
        method="POST",
        page_size=20,
    ),
    SourceConfig(
        "capitalone",
        "Capital One",
        "Workday",
        "https://capitalone.wd12.myworkdayjobs.com/wday/cxs/capitalone/Capital_One/jobs",
        "https://capitalone.wd12.myworkdayjobs.com/en-US/Capital_One",
        method="POST",
        page_size=20,
        search_term="finance",
    ),
    SourceConfig(
        "blackrock",
        "BlackRock",
        "Workday",
        "https://blackrock.wd1.myworkdayjobs.com/wday/cxs/blackrock/BlackRock_Professional/jobs",
        "https://blackrock.wd1.myworkdayjobs.com/en-US/BlackRock_Professional",
        method="POST",
        page_size=20,
    ),
    SourceConfig(
        "barclays",
        "Barclays",
        "Workday",
        "https://barclays.wd3.myworkdayjobs.com/wday/cxs/barclays/External_Career_Site_Barclays/jobs",
        "https://barclays.wd3.myworkdayjobs.com/en-US/External_Career_Site_Barclays",
        method="POST",
        page_size=20,
    ),
    SourceConfig(
        "guggenheim",
        "Guggenheim Securities",
        "Workday",
        "https://guggenheim.wd1.myworkdayjobs.com/wday/cxs/guggenheim/Guggenheim_Careers_Campus/jobs",
        "https://guggenheim.wd1.myworkdayjobs.com/en-US/Guggenheim_Careers_Campus",
        method="POST",
        page_size=20,
    ),
    SourceConfig(
        "morningstar",
        "Morningstar",
        "Workday",
        "https://morningstar.wd5.myworkdayjobs.com/wday/cxs/morningstar/morningstar/jobs",
        "https://morningstar.wd5.myworkdayjobs.com/en-US/morningstar",
        method="POST",
        page_size=20,
    ),
    SourceConfig(
        "keybank",
        "KeyBank",
        "Workday",
        "https://keybank.wd5.myworkdayjobs.com/wday/cxs/keybank/external_career_site/jobs",
        "https://keybank.wd5.myworkdayjobs.com/en-US/external_career_site",
        method="POST",
        page_size=20,
    ),
    SourceConfig(
        "jll",
        "JLL",
        "Workday",
        "https://jll.wd1.myworkdayjobs.com/wday/cxs/jll/jllcareers/jobs",
        "https://jll.wd1.myworkdayjobs.com/en-US/jllcareers",
        method="POST",
        page_size=20,
        search_term="finance",
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
    SourceConfig(
        "jpmorgan",
        "JPMorgan Chase",
        "Oracle",
        "https://jpmc.fa.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions",
        "https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1002",
        page_size=100,
        search_term="finance",
        site_number="CX_1002",
    ),
    SourceConfig(
        "commercebank",
        "Commerce Bank",
        "Workday",
        "https://commercebank.wd1.myworkdayjobs.com/wday/cxs/commercebank/CommerceJobs/jobs",
        "https://commercebank.wd1.myworkdayjobs.com/en-US/CommerceJobs",
        method="POST",
        page_size=20,
    ),
    SourceConfig(
        "federalreserve",
        "Federal Reserve System",
        "Workday",
        "https://rb.wd5.myworkdayjobs.com/wday/cxs/rb/FRS/jobs",
        "https://rb.wd5.myworkdayjobs.com/en-US/FRS",
        method="POST",
        page_size=20,
    ),
)

SOURCE_BY_NAME = {source.name: source for source in SOURCES}

ROLE_NAME = "Entry-level finance, banking, valuation, investment, risk, and M&A analyst roles"
ROLE_RULE_SUMMARY = (
    "Include only Financial Analyst I/II, FP&A Analyst, Corporate Finance Analyst, "
    "Revenue Finance Analyst, Strategic Finance Analyst, Treasury Analyst, "
    "Credit Analyst, Commercial Banking Analyst, Corporate Banking Analyst, "
    "Valuation Analyst, Equity Research Associate, Investment Analyst, "
    "Investment Banking Analyst, M&A Analyst, Transaction Advisory Analyst, "
    "Portfolio Analyst, Financial Risk Analyst, Asset Management Analyst, "
    "Private Credit Analyst, and Corporate Development Analyst; "
    "prioritize Financial Analyst, FP&A, Corporate Finance, Treasury, Credit, "
    "Commercial Banking, Corporate Banking, and Financial Risk roles over "
    "school-specific investment-banking recruiting programs; exclude campus, "
    "summer, student, internship, and school-tagged IBD programs; "
    "exclude obvious seniority titles such as "
    "senior, lead, manager, director, VP, head, principal, staff, chief, "
    "and executive."
)
