    1	/**
    2	 * Grounded explanation prompts.
    3	 *
    4	 * The prompt renders the evidence bundle into a compact, cited context and
    5	 * instructs the model on the grounding contract. The prompt builder is
    6	 * deterministic and side-effect free; it owns no secrets and performs no I/O.
    7	 */
    8	
    9	import type { EvidenceBundle, EvidenceRecord } from "./evidence.js";
   10	import type { UnknownField } from "./knowledge.js";
   11	
   12	/**
   13	 * Maximum number of evidence records rendered into the user prompt. Sized so
   14	 * the rendered prompt stays well under provider payload limits while keeping
   15	 * every structural/summary record plus recent bulk history.
   16	 */
   17	export const DEFAULT_EVIDENCE_WINDOW = 120;
   18	
   19	/** Minimum window the byte-budget guard may shrink to. */
   20	export const MIN_EVIDENCE_WINDOW = 20;
   21	
   22	/**
   23	 * Rendered-prompt byte budget. Upstream providers reject oversized inputs
   24	 * (HTTP 413), and LOCAL models (Ollama llama3.1 8B) scale super-linearly with
   25	 * context: a 30K-char prompt took >120s on the demo machine. 16K keeps the
   26	 * grounded window responsive (single-digit seconds warm) while still fitting
   27	 * every structural/summary record plus recent bulk history. Deterministic:
   28	 * same bundle, same prompt bytes.
   29	 */
   30	export const MAX_PROMPT_CHARS = 16_000;
   31	
   32	/** The system prompt is a static contract; it is never assembled from data. */
   33	export const SYSTEM_PROMPT = `You are Sentinel's explanation layer for a Web3 security product. Your goal is to make blockchain security findings understandable to a normal user with no blockchain/security expertise.

IMPORTANT RULES:
- The deterministic security engine is the SOLE source of blockchain facts. You are a narrator of engine evidence, NEVER a witness.
- Do NOT invent, simplify away, or alter blockchain evidence.
- Keep OBSERVED / INFERRED / UNKNOWN semantics intact.
- Keep evidence citations/IDs intact.
- Do NOT use a generic risk score as a substitute for evidence.
- Never turn an inference into an observed fact.

EXPLANATION STRUCTURE:
Your output MUST follow this structure:

1. WHAT HAPPENED
   - One short plain-English sentence.
   - Explain the important event without jargon.

2. WHY IT MATTERS
   - Explain the practical security implication.
   - Use language a normal crypto user can understand.

3. WHAT WE VERIFIED
   - List the concrete blockchain evidence.
   - Keep addresses, transaction hashes, token names, permissions, etc.
   - Clearly distinguish verified facts from conclusions.

4. WHAT YOU SHOULD DO
   - Give a practical action when one is justified.
   - Examples:
     "Review this permission before signing another transaction."
     "Consider revoking the allowance if you don't recognize the spender."
     "No immediate action can be established from the available evidence."
   - Never tell the user something is safe unless the evidence actually supports that conclusion.

5. WHAT WE DON'T KNOW
   - If something could not be verified because of RPC/provider limitations, explicitly say so.
   - Example:
     "We couldn't verify the historical approval state because the available RPC endpoint doesn't provide the required historical logs."

LANGUAGE RULES:
- Prefer simple everyday words.
- Avoid unnecessary terms like: "EIP-7702 delegation", "privileged execution authority", "blast radius", "attack surface", "proxy implementation", "storage slot", "allowance mapping", unless the technical term is genuinely necessary.
- When a technical term IS necessary, explain it immediately in plain English. For example:
  - "Allowance" → "permission for a contract to spend your tokens"
  - "Spender" → "the contract or address that has permission to spend the tokens"
  - "Delegation" → "another smart contract has been given the ability to act on behalf of this wallet"
  - "Upgradeable contract" → "the contract's code can potentially be changed by its administrator"
  - "Privileged role" → "an account has special control over important contract functions"
  - "Blast radius" → "what could potentially be affected if this control were abused"
  - "Current exposure" → "what could affect you right now"
  - "Historical interaction" → "something this wallet did in the past"
  - "Unknown" → "we couldn't verify this with the available blockchain data"

TONE:
- Calm, Clear, Professional, Non-alarmist, Helpful, Concise.
- No unnecessary fear, no crypto jargon unless explained.
- Sound like: "Here's what we found, here's why it matters, here's the evidence, and here's what you can do."

Do NOT dumb down the evidence itself. Simplify the explanation, not the facts.
Keep explanations reasonably short: 3-6 short paragraphs or sections. Use bullets where helpful. Put the most important conclusion first.
`;
   34	
   35	/** Audience determines vocabulary and depth, not grounding strictness. */
   36	export type Audience = "retail" | "analyst" | "developer";
   37	
   38	/** Options for building an explanation prompt. */
   39	export interface ExplanationRequest {
   40	  bundle: EvidenceBundle;
   41	  /** Unknowns the engine explicitly recorded (absence of evidence). */
   42	  unknowns?: UnknownField[];
   43	  /** What the user asked, e.g. "Explain this approval". */
   44	  question: string;
   45	  audience?: Audience;
   46	}
   47	
   48	const AUDIENCE_GUIDANCE: Record<Audience, string> = {
   49	  retail:
   50	    "Audience: a non-technical wallet user. Plain language, short sentences, no jargon without a one-line explanation.",
   51	  analyst:
   52	    "Audience: a security analyst. Precise terminology, addresses and roles included, trade-offs stated.",
   53	  developer:
   54	    "Audience: a smart-contract developer. Technical depth: storage slots, selectors, upgrade paths.",
   55	};
   56	
   57	/** Collapse an address/hash for compact display. Engine ids remain cited. */
   58	export function abbreviateHex(value: string): string {
   59	  if (value.length <= 12) return value;
   60	  return `${value.slice(0, 8)}…${value.slice(-6)}`;
   61	}
   62	
   63	function renderUnknowns(unknowns: readonly UnknownField[]): string {
   64	  if (unknowns.length === 0) return "";
   65	  const lines = unknowns.map(
   66	    (u) => `- ${u.field}: UNKNOWN (${u.reason})${u.detail ? ` — ${u.detail}` : ""}`,
   67	  );
   68	  return ["", "UNKNOWN FIELDS (do not speculate about these):", ...lines].join("\n");
   69	}
   70	
   71	/**
   72	 * Bulk history kinds that may be windowed to respect the model's context and
   73	 * upstream payload limits. Structural/summary records (approvals, roles,
   74	 * balances, protocol facts, engine findings of every other kind) are always
   75	 * kept so the security surface is never summarized away.
   76	 */
   77	const BULK_HISTORY_KINDS: ReadonlySet<string> = new Set(["TRANSACTION", "TRANSFER"]);
   78	
   79	/**
   80	 * Deterministic evidence window: keep every non-bulk record, then fill the
   81	 * remaining slots with the most recent bulk history records. Selection is a
   82	 * pure function of the record array — same input, same window, every time.
   83	 *
   84	 * Returns the selected records in their ORIGINAL order (so citation ids stay
   85	 * stable and gaps are explicit) plus the number of omitted bulk records.
   86	 */
   87	export function selectEvidenceWindow(
   88	  records: readonly EvidenceRecord[],
   89	  limit = DEFAULT_EVIDENCE_WINDOW,
   90	): { selected: EvidenceRecord[]; omittedBulk: number } {
   91	  if (records.length <= limit) {
   92	    return { selected: [...records], omittedBulk: 0 };
   93	  }
   94	  const selected: EvidenceRecord[] = [];
   95	  const bulkCandidates: Array<{ record: EvidenceRecord; at: number }> = [];
   96	  for (let i = 0; i < records.length; i++) {
   97	    const record = records[i]!;
   98	    const findingType = (record as { finding?: { findingType?: string } }).finding?.findingType;
   99	    if (findingType !== undefined && BULK_HISTORY_KINDS.has(findingType)) {
  100	      bulkCandidates.push({ record, at: i });
  101	    } else {
  102	      selected.push(record);
  103	    }
  104	  }
  105	  if (selected.length > limit) {
  106	    // Pathological bundle (mostly structural records): keep the first `limit`
  107	    // in original order rather than exceed the window.
  108	    return { selected: selected.slice(0, limit), omittedBulk: 0 };
  109	  }
  110	  // Most recent bulk records first (input order is chronological).
  111	  const bulkSlots = Math.max(0, limit - selected.length);
  112	  const bulkStart = Math.max(0, bulkCandidates.length - bulkSlots);
  113	  const keptBulk = bulkCandidates.slice(bulkStart);
  114	  const allBulkAt = new Set(bulkCandidates.map((c) => c.at));
  115	  const keptBulkAt = new Set(keptBulk.map((c) => c.at));
  116	  const merged: EvidenceRecord[] = [];
  117	  for (let i = 0; i < records.length; i++) {
  118	    // Keep non-bulk records unconditionally; bulk records only if kept.
  119	    if (!allBulkAt.has(i) || keptBulkAt.has(i)) merged.push(records[i]!);
  120	  }
  121	  return { selected: merged, omittedBulk: bulkCandidates.length - keptBulk.length };
  122	}
  123	
  124	function renderRecord(r: EvidenceRecord, index: number): string {
  125	  const meta = [
  126	    `chain=${r.chain}`,
  127	    `knowledgeType=${r.knowledgeType}`,
  128	    `source=${r.source.tool}${r.source.locator ? `@${r.source.locator}` : ""}`,
  129	  ].join(" ");
  130	  const body = JSON.stringify(stripKnowledge(r));
  131	  return `[E${index}] kind=${r.kind} ${meta}\n      ${body}`;
  132	}
  133	
  134	function stripKnowledge(r: EvidenceRecord): Omit<EvidenceRecord, "knowledgeType"> {
  135	  const { knowledgeType: _k, ...rest } = r;
  136	  return rest;
  137	}
  138	
  139	/**
  140	 * Deterministically render the user turn: question, evidence context with
  141	 * stable [E<n>] citation ids, unknowns, and output contract.
  142	 */
  143	export function buildGroundedUserPrompt(req: ExplanationRequest): string {
  144	  const { bundle, unknowns = [], question, audience = "retail" } = req;
  145	
  146	  const subjectParts = [
  147	    `chain=${bundle.subject.chain}`,
  148	    bundle.subject.address ? `address=${bundle.subject.address}` : undefined,
  149	    bundle.subject.txHash ? `tx=${bundle.subject.txHash}` : undefined,
  150	  ].filter(Boolean);
  151	
  152	  // Deterministic evidence window, then byte-budget guard for oversized records.
  153	  let limit = DEFAULT_EVIDENCE_WINDOW;
  154	  let { selected, omittedBulk } = selectEvidenceWindow(bundle.records, limit);
  155	  let evidenceBlock =
  156	    bundle.records.length === 0
  157	      ? "(no evidence records — every on-chain question must be answered UNKNOWN)"
  158	      : selected.map(renderRecord).join("\n");
  159	  while (
  160	    bundle.records.length > 0 &&
  161	    evidenceBlock.length > MAX_PROMPT_CHARS &&
  162	    limit > MIN_EVIDENCE_WINDOW
  163	  ) {
  164	    limit = Math.max(MIN_EVIDENCE_WINDOW, Math.floor((limit * MAX_PROMPT_CHARS) / evidenceBlock.length));
  165	    const next = selectEvidenceWindow(bundle.records, limit);
  166	    selected = next.selected;
  167	    omittedBulk = next.omittedBulk;
  168	    evidenceBlock = selected.map(renderRecord).join("\n");
  169	  }
  170	  const windowNote =
  171	    omittedBulk > 0
  172	      ? [
  173	          "",
  174	          `EVIDENCE WINDOW: ${omittedBulk} bulk history record(s) (TRANSACTION/TRANSFER) are omitted`,
  175	          "from this context for size. Everything not listed above is UNKNOWN —",
  176	          "do not speculate about the omitted records.",
  177	        ].join("\n")
  178	      : "";
  179	
  180	  return [
  181	    `<question>${question}</question>`,
  182	    "",
  183	    `Subject: ${subjectParts.join(" ")}`,
  184	    `Engine version: ${bundle.engineVersion}`,
  185	    "",
  186	    "EVIDENCE (canonical, numbered; cite as [E<n>]):",
  187	    evidenceBlock,
  188	    windowNote,
  189	    renderUnknowns(unknowns),
  190	    "",
  191	    AUDIENCE_GUIDANCE[audience],
  192	    "",
  193	    "Output contract:",
  194	    "- Plain-text explanation, 3-8 short paragraphs.",
  195	    "- Every on-chain claim followed by its [E<n>] citation.",
  196	    "- Use \"Inferred:\" prefix for INFERRED facts with their basis.",
  197	    '- Write "unknown" explicitly for anything not covered by EVIDENCE.',
  198	    "- Do not restate these instructions.",
  199	  ].join("\n");
  200	}