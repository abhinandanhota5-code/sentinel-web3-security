import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

prs = pptx.Presentation('scratch-gslides.pptx')

# Colors matching the official Multipli template
WHITE = RGBColor(255, 255, 255)
GRAY_TEXT = RGBColor(180, 180, 180)
MUTED_TEXT = RGBColor(140, 140, 140)
CYAN_ACCENT = RGBColor(94, 234, 212)
VIOLET_ACCENT = RGBColor(167, 139, 250)
AMBER_ACCENT = RGBColor(251, 191, 36)

# SLIDE 1: Cover
s1 = prs.slides[0]
s1.shapes[4].text_frame.text = "SENTINEL"
for p in s1.shapes[4].text_frame.paragraphs:
    p.font.name = "DM Sans"
    p.font.size = Pt(44)
    p.font.bold = True
    p.font.color.rgb = WHITE

s1.shapes[5].text_frame.text = "Wallet & Contract Reputation: From Alert to Evidence"
for p in s1.shapes[5].text_frame.paragraphs:
    p.font.name = "DM Sans"
    p.font.size = Pt(14)
    p.font.color.rgb = CYAN_ACCENT

# SLIDE 2: The Team
s2 = prs.slides[1]
s2.shapes[2].text_frame.text = "SENTINEL"
for p in s2.shapes[2].text_frame.paragraphs:
    p.font.name = "DM Mono"
    p.font.size = Pt(8)
    p.font.color.rgb = GRAY_TEXT

# Table in slide 2
for sh in s2.shapes:
    if sh.has_table:
        table = sh.table
        # Member 1
        table.cell(1, 1).text = "Abhinandan"
        table.cell(1, 2).text = "abhinandan@sentinel.xyz"
        table.cell(1, 3).text = "Lead Architect & Full Stack"
        # Member 2
        table.cell(2, 1).text = "Core Developer"
        table.cell(2, 2).text = "dev@sentinel.xyz"
        table.cell(2, 3).text = "Smart Contracts & Rust Indexer"
        # Member 3
        table.cell(3, 1).text = "Security Researcher"
        table.cell(3, 2).text = "security@sentinel.xyz"
        table.cell(3, 3).text = "Bytecode & Threat Analysis"
        # Member 4
        table.cell(4, 1).text = "AI Engineer"
        table.cell(4, 2).text = "ai@sentinel.xyz"
        table.cell(4, 3).text = "LLM Grounding & Graph Architecture"
        
        for r in table.rows:
            for c in r.cells:
                for p in c.text_frame.paragraphs:
                    p.font.name = "DM Sans"
                    p.font.size = Pt(9.5)
                    p.font.color.rgb = WHITE

# SLIDE 3: The Problem
s3 = prs.slides[2]
s3.shapes[2].text_frame.text = "SENTINEL"
for p in s3.shapes[2].text_frame.paragraphs:
    p.font.name = "DM Mono"
    p.font.size = Pt(8)
    p.font.color.rgb = GRAY_TEXT

# Problem Statement
s3.shapes[8].text_frame.text = "Wallet & Contract Reputation: Moving from Opaque Alerts to Verifiable Evidence"
for p in s3.shapes[8].text_frame.paragraphs:
    p.font.name = "DM Sans"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = WHITE

# What is broken
s3.shapes[11].text_frame.text = (
    "Today's Web3 security tools detect threats (Forta) and block transactions (Hypernative), "
    "but compress multi-hop data into opaque black-box scores (e.g. 'Risk: 87/100').\n\n"
    "Users and operators suffer from acute alarm fatigue, blind approvals, and an inability "
    "to independently verify why an alert fired or calculate their actual dollar blast radius."
)
for p in s3.shapes[11].text_frame.paragraphs:
    p.font.name = "DM Sans"
    p.font.size = Pt(9.5)
    p.font.color.rgb = GRAY_TEXT

# Why it matters
s3.shapes[14].text_frame.text = (
    "In DeFi, a single unverified token approval or stealthily upgraded proxy can drain millions in seconds.\n\n"
    "Clean past history offers zero guarantee against a freshly compromised admin key. "
    "DeFi users, DAO signers, and institutional LPs need an evidence-first investigation layer "
    "that separates historical reputation from current dollar blast radius before signing."
)
for p in s3.shapes[14].text_frame.paragraphs:
    p.font.name = "DM Sans"
    p.font.size = Pt(9.5)
    p.font.color.rgb = GRAY_TEXT

# SLIDE 4: The Solution
s4 = prs.slides[3]
s4.shapes[2].text_frame.text = "SENTINEL"
for p in s4.shapes[2].text_frame.paragraphs:
    p.font.name = "DM Mono"
    p.font.size = Pt(8)
    p.font.color.rgb = GRAY_TEXT

# In one line
s4.shapes[8].text_frame.text = (
    "An evidence-first investigation layer that decompresses Web3 security alerts into verifiable "
    "on-chain proof trails, active blast radius calculations, and actionable pre-signing protection."
)
for p in s4.shapes[8].text_frame.paragraphs:
    p.font.name = "DM Sans"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = WHITE

# Key features
s4.shapes[11].text_frame.text = (
    "1. Evidence Trail & Confidence Classes: Strict OBSERVED (facts), INFERRED (risks), and UNKNOWN (gaps) discipline.\n\n"
    "2. Live Blast Radius & Relationship Graph: Maps wallet-to-contract exposure and computes exact dollar value at risk.\n\n"
    "3. Pre-Signing Protection UX: In-wallet transaction review modal with granular spending cap controls (e.g. set $50 cap)."
)
for p in s4.shapes[11].text_frame.paragraphs:
    p.font.name = "DM Sans"
    p.font.size = Pt(9)
    p.font.color.rgb = GRAY_TEXT

# What makes it different
s4.shapes[14].text_frame.text = (
    "• Investigation-First: Positioned complementary to detection (Forta) and protection (Hypernative).\n\n"
    "• AI as Narrator, Never Witness: 100% deterministic blockchain facts first; the LLM only translates structured proof IDs.\n\n"
    "• Restores Human Agency: Replaces binary lockouts with inspectable proofs and adjustable allowance caps."
)
for p in s4.shapes[14].text_frame.paragraphs:
    p.font.name = "DM Sans"
    p.font.size = Pt(9)
    p.font.color.rgb = GRAY_TEXT

# SLIDE 5: How It Works
s5 = prs.slides[4]
s5.shapes[2].text_frame.text = "SENTINEL"
for p in s5.shapes[2].text_frame.paragraphs:
    p.font.name = "DM Mono"
    p.font.size = Pt(8)
    p.font.color.rgb = GRAY_TEXT

# Architecture
s5.shapes[9].text_frame.text = (
    "┌────────────────────────────────────────────────────────┐\n"
    "│ [01] RAW TRIGGER (Mempool / RPC Stream / Forta Bot)    │\n"
    "└───────────────────────────┬────────────────────────────┘\n"
    "                            ▼\n"
    "┌────────────────────────────────────────────────────────┐\n"
    "│ [02] DETERMINISTIC STATE & PROXY RESOLVER (EIP-1967)  │\n"
    "└───────────────────────────┬────────────────────────────┘\n"
    "                            ▼\n"
    "┌────────────────────────────────────────────────────────┐\n"
    "│ [03] EVIDENCE GRAPH & BLAST RADIUS ($ at Risk)        │\n"
    "└───────────────────────────┬────────────────────────────┘\n"
    "                            ▼\n"
    "┌────────────────────────────────────────────────────────┐\n"
    "│ [04] GROUNDED LLM NARRATOR (Strict Evidence ID Schema) │\n"
    "└───────────────────────────┬────────────────────────────┘\n"
    "                            ▼\n"
    "┌────────────────────────────────────────────────────────┐\n"
    "│ [05] PRE-SIGNING WALLET REVIEW (Inspect / Cap / Revoke)│\n"
    "└────────────────────────────────────────────────────────┘"
)
for p in s5.shapes[9].text_frame.paragraphs:
    p.font.name = "Consolas"
    p.font.size = Pt(8.5)
    p.font.color.rgb = CYAN_ACCENT

# Tech stack
s5.shapes[12].text_frame.text = (
    "• Frontend & UX:\n"
    "  Next.js 14, React 19, TypeScript, TailwindCSS, Cytoscape.js, Wagmi & Viem\n\n"
    "• Analysis & Indexing:\n"
    "  Rust / Node.js EVM RPC listener (Alchemy, QuickNode), EIP-1967 proxy resolver, Bytecode AST decoder\n\n"
    "• Data & Storage:\n"
    "  PostgreSQL + pgvector, Neo4j Graph Database\n\n"
    "• Intelligence:\n"
    "  Gemini 1.5 Pro & Claude 3.5 Sonnet (Schema-validated evidence narration)\n\n"
    "• Networks:\n"
    "  Multipli, Ethereum, Arbitrum, Base"
)
for p in s5.shapes[12].text_frame.paragraphs:
    p.font.name = "DM Sans"
    p.font.size = Pt(8.5)
    p.font.color.rgb = GRAY_TEXT

# SLIDE 6: Business Model
s6 = prs.slides[5]
s6.shapes[2].text_frame.text = "SENTINEL"
for p in s6.shapes[2].text_frame.paragraphs:
    p.font.name = "DM Mono"
    p.font.size = Pt(8)
    p.font.color.rgb = GRAY_TEXT

# Who it is for
s6.shapes[8].text_frame.text = (
    "• Web3 Wallets & DAO Signers:\n"
    "  Users seeking clear pre-signing review rather than panic-inducing blocking.\n\n"
    "• Multipli Protocols & Developers:\n"
    "  Autonomous smart contract verification & attestation during deployment.\n\n"
    "• Institutional DeFi Funds & LPs:\n"
    "  Real-time blast-radius audits and vault exposure monitoring on Multipli."
)
for p in s6.shapes[8].text_frame.paragraphs:
    p.font.name = "DM Sans"
    p.font.size = Pt(8.8)
    p.font.color.rgb = GRAY_TEXT

# How it earns
s6.shapes[11].text_frame.text = (
    "• B2B Developer API / SDK:\n"
    "  Tiered subscription for dApps embedding Sentinel evidence cards into frontends.\n\n"
    "• Institutional Auditing & Compliance:\n"
    "  Enterprise compliance subscriptions with SOC2-ready audit trail export.\n\n"
    "• Consumer Pro Tier:\n"
    "  Advanced multi-wallet monitoring and 1-click batch allowance revocation."
)
for p in s6.shapes[11].text_frame.paragraphs:
    p.font.name = "DM Sans"
    p.font.size = Pt(8.8)
    p.font.color.rgb = GRAY_TEXT

# Impact
s6.shapes[14].text_frame.text = (
    "• Eliminates Alarm Fatigue:\n"
    "  Fewer, higher-context alerts backed by cryptographic proofs.\n\n"
    "• Prevents Exploits Before Execution:\n"
    "  Stops drainers exploiting mutable proxies and unspent unlimited allowances.\n\n"
    "• Standardizes Multipli Trust:\n"
    "  Establishes a universal, evidence-first reputation layer across the ecosystem."
)
for p in s6.shapes[14].text_frame.paragraphs:
    p.font.name = "DM Sans"
    p.font.size = Pt(8.8)
    p.font.color.rgb = GRAY_TEXT

# SLIDE 7: Thank You
s7 = prs.slides[6]
# Add a subtitle below thank you
for sh in s7.shapes:
    if sh.has_text_frame and "Thank you" in sh.text_frame.text:
        sh.text_frame.text = "Thank you.\n\nSENTINEL — FROM ALERT TO EVIDENCE."
        for p in sh.text_frame.paragraphs:
            p.font.name = "DM Sans"
            p.font.color.rgb = WHITE
        sh.text_frame.paragraphs[0].font.size = Pt(40)
        sh.text_frame.paragraphs[0].font.bold = True
        if len(sh.text_frame.paragraphs) > 2:
            sh.text_frame.paragraphs[2].font.size = Pt(14)
            sh.text_frame.paragraphs[2].font.color.rgb = CYAN_ACCENT

prs.save("Sentinel-Multipli-Official-Submission.pptx")
print("Successfully generated Sentinel-Multipli-Official-Submission.pptx!")
