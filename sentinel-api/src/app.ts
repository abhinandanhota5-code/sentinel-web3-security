    1	/**
    2	 * Wiring for the Sentinel backend: builds the grounded explanation engine and
    3	 * the (default no-op) PRISM client. The Gemini API key never leaves this
    4	 * process; responses never include it.
    5	 */
    6	
    7	import express, { type Express, type Request, type Response, type NextFunction } from "express";
    8	import {
    9	  createSentinelAi,
   10	  GeminiExplanationProvider,
   11	  OllamaExplanationProvider,
   12	  OpenRouterExplanationProvider,
   13	  MockExplanationProvider,
   14	  NullPrismClient,
   15	  evaluateExplanation,
   16	  parseEvidenceBundle,
   17	  validateDraft,
   18	  EvidenceValidationError,
   19	  EvidenceIndex,
   20	  type EvidenceBundle,
   21	  type Explanation,
   22	  type ExplanationProvider,
   23	  type UnknownField,
   24	} from "@sentinel/ai";
   25	import { createRequire } from "node:module";
   26	import { fileURLToPath } from "node:url";
   27	import path from "node:path";
   28	import type { ApiConfig, ExplainRequestBody } from "./config.js";
   29	import {
   30	  adaptEngineBundle,
   31	  normalizeChain,
   32	  type EngineBundle,
   33	} from "./engine-adapter.js";
   34	
   35	/**
   36	 * Port of the deterministic security engine. The real implementation is the
   37	 * CJS `src/security-engine` package; tests inject fakes. sentinel-api contains
   38	 * no blockchain logic of its own — it only invokes this port.
   39	 */
   40	export interface SecurityEnginePort {
   41	  analyzeAddressSecurity(args: {
   42	    provider: unknown;
   43	    address: string;
   44	    chain: string;
   45	  }): Promise<EngineBundle>;
   46	}
   47	
   48	export interface AppDeps {
   49	  config: ApiConfig;
   50	  /** Deterministic engine; defaults to the real CJS security engine. */
   51	  securityEngine?: SecurityEnginePort | undefined;
   52	  /** Blockchain provider for the engine; defaults to createEthereumProvider(). */
   53	  blockchainProvider?: unknown;
   54	  /** Explanation provider override (tests); defaults from the provider config. */
   55	  explanationProvider?: ExplanationProvider | undefined;
   56	}
   57	
   58	interface RealSecurityEngineModule {
   59	  createEthereumProvider: (opts?: Record<string, unknown>) => unknown;
   60	  analyzeAddressSecurity: SecurityEnginePort["analyzeAddressSecurity"];
   61	}
   62	
   63	/**
   64	 * Resolve the deterministic CJS security engine relative to this compiled
   65	 * file (dist/), independent of the process cwd. Returns undefined when the
   66	 * engine is not present so the AI-only routes still boot.
   67	 */
   68	function loadRealSecurityEngine(): RealSecurityEngineModule | undefined {
   69	  try {
   70	    const here = fileURLToPath(new URL(".", import.meta.url));
   71	    const enginePath = path.resolve(here, "..", "..", "src", "security-engine", "index.js");
   72	    return createRequire(import.meta.url)(enginePath) as RealSecurityEngineModule;
   73	  } catch {
   74	    return undefined;
   75	  }
   76	}
   77	
   78	/** Real engine + provider, loaded lazily so AI-only routes work without it. */
   79	function createDefaultSecurityEngine(): SecurityEnginePort & {
   80	  provider: () => unknown;
   81	} {
   82	  let mod: RealSecurityEngineModule | undefined;
   83	  let provider: unknown;
   84	  const load = (): RealSecurityEngineModule => {
   85	    if (!mod) {
   86	      mod = loadRealSecurityEngine();
   87	      if (!mod) throw new Error("security engine module not found");
   88	    }
   89	    return mod;
   90	  };
   91	  return {
   92	    provider: () => {
   93	      if (provider === undefined) provider = load().createEthereumProvider();
   94	      return provider;
   95	    },
   96	    analyzeAddressSecurity: (args) => load().analyzeAddressSecurity(args),
   97	  };
   98	}
   99	
  100	const UNKNOWN_REASONS: readonly UnknownField["reason"][] = [
  101	  "no_evidence",
  102	  "source_unreachable",
  103	  "out_of_scope",
  104	  "contradicted",
  105	  "deprecated",
  106	];
  107	
  108	/** Which explanation provider the given config resolves to (never secrets). */
  109	export function configuredProviderName(config: ApiConfig): string {
  110	  if (
  111	    config.explanationProvider === "ollama" &&
  112	    (config.ollamaBaseUrl ?? true)
  113	  ) {
  114	    // Ollama needs no API key; a local server URL (or the default) suffices.
  115	    return "ollama";
  116	  }
  117	  if (
  118	    config.explanationProvider === "openrouter" &&
  119	    config.openrouterApiKey &&
  120	    config.openrouterApiKey.trim().length > 0
  121	  ) {
  122	    return "openrouter";
  123	  }
  124	  if (config.explanationProvider === "gemini" && config.geminiApiKey && config.geminiApiKey.trim().length > 0) {
  125	    return "gemini";
  126	  }
  127	  return "mock";
  128	}
  129	
  130	/** Minimal request validation; errors carry an HTTP status. */
  131	export class BadRequestError extends Error {
  132	  constructor(
  133	    message: string,
  134	    readonly status: number = 400,
  135	  ) {
  136	    super(message);
  137	    this.name = "BadRequestError";
  138	  }
  139	}
  140	
  141	function parseUnknowns(raw: unknown): UnknownField[] {
  142	  if (raw === undefined) return [];
  143	  if (!Array.isArray(raw)) throw new BadRequestError("unknowns must be an array");
  144	  return raw.map((u) => {
  145	    if (typeof u !== "object" || u === null) throw new BadRequestError("each unknown must be an object");
  146	    const rec = u as Record<string, unknown>;
  147	    if (typeof rec.field !== "string" || rec.field.length === 0) {
  148	      throw new BadRequestError("unknown.field must be a non-empty string");
  149	    }
  150	    if (typeof rec.reason !== "string" || !UNKNOWN_REASONS.includes(rec.reason as UnknownField["reason"])) {
  151	      throw new BadRequestError(`unknown.reason must be one of ${UNKNOWN_REASONS.join("|")}`);
  152	    }
  153	    const out: UnknownField = { field: rec.field, reason: rec.reason as UnknownField["reason"] };
  154	    if (typeof rec.detail === "string") out.detail = rec.detail;
  155	    return out;
  156	  });
  157	}
  158	
  159	function parseBody(raw: unknown): ExplainRequestBody {
  160	  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
  161	    throw new BadRequestError("body must be a JSON object");
  162	  }
  163	  const body = raw as Record<string, unknown>;
  164	  if (typeof body.question !== "string" || body.question.trim().length === 0) {
  165	    throw new BadRequestError("question is required");
  166	  }
  167	  if (body.question.length > 2_000) throw new BadRequestError("question too long (max 2000 chars)");
  168	  if (body.audience !== undefined && !["retail", "analyst", "developer"].includes(body.audience as string)) {
  169	    throw new BadRequestError("audience must be retail|analyst|developer");
  170	  }
  171	  return body as unknown as ExplainRequestBody;
  172	}
  173	
  174	function guardBundleSize(bundle: EvidenceBundle, max: number): void {
  175	  if (bundle.records.length > max) {
  176	    throw new BadRequestError(`bundle exceeds ${max} evidence records`, 413);
  177	  }
  178	}
  179	
  180	/** Serialize an Explanation for the client. Never includes secrets. */
  181	export function serializeExplanation(e: Explanation): Record<string, unknown> {
  182	  return {
  183	    text: e.text,
  184	    blocked: e.blocked,
  185	    refused: e.refused ?? null,
  186	    // Exact provider failure cause (already sanitized upstream: secrets
  187	    // redacted, message text only). Present only for provider_error so clients
  188	    // can report e.g. "Gemini 429 quota" instead of an opaque refusal.
  189	    // providerCode is the machine-readable classification (OLLAMA_UNAVAILABLE,
  190	    // MODEL_NOT_FOUND, TIMEOUT, INVALID_RESPONSE) for UI root-cause display.
  191	    ...(e.refused === "provider_error" && e.providerError
  192	      ? { providerError: e.providerError }
  193	      : {}),
  194	    ...(e.refused === "provider_error" && e.providerCode
  195	      ? { providerCode: e.providerCode }
  196	      : {}),
  197	    citations: Object.fromEntries(e.citations),
  198	    knowledgeByCitation: Object.fromEntries(e.knowledgeByCitation),
  199	    validation: {
  200	      clean: e.validation.clean,
  201	      strippedCitations: e.validation.strippedCitations,
  202	      unsupportedClaims: e.validation.unsupportedClaims,
  203	    },
  204	  };
  205	}
  206	
  207	const HEX_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
  208	
  209	/** Chains the deterministic engine currently supports. */
  210	const SUPPORTED_CHAINS = new Set(["ethereum"]);
  211	
  212	export function buildApp(deps: AppDeps): Express {
  213	  const { config } = deps;
  214	
  215	  // Deterministic engine wiring: injected port, else the real CJS engine.
  216	  const defaultEngine = deps.securityEngine ? undefined : createDefaultSecurityEngine();
  217	  const securityEngine: SecurityEnginePort = deps.securityEngine ?? defaultEngine!;
  218	  let blockchainProvider: unknown = deps.blockchainProvider;
  219	  if (blockchainProvider === undefined && defaultEngine) {
  220	    try {
  221	      blockchainProvider = defaultEngine.provider();
  222	    } catch {
  223	      blockchainProvider = undefined; // /analyze will fail per-request, AI routes still serve
  224	    }
  225	  }
  226	
  227	  /** Resolve the vendor-agnostic explanation provider from server config. */
  228	  function defaultExplanationProvider(): ExplanationProvider {
  229	    if (config.explanationProvider === "ollama") {
  230	      return new OllamaExplanationProvider({
  231	        timeoutMs: Math.max(config.timeoutMs, 120_000), // local inference needs headroom
  232	        ...(config.ollamaBaseUrl ? { baseUrl: config.ollamaBaseUrl } : {}),
  233	        ...(config.ollamaModel ? { model: config.ollamaModel } : {}),
  234	      });
  235	    }
  236	    const openrouterReady = config.explanationProvider === "openrouter" && !!config.openrouterApiKey;
  237	    const geminiReady = config.explanationProvider === "gemini" && !!config.geminiApiKey;
  238	    if (openrouterReady) {
  239	      return new OpenRouterExplanationProvider({
  240	        timeoutMs: config.timeoutMs,
  241	        maxRetries: config.maxRetries,
  242	        ...(config.openrouterModel ? { model: config.openrouterModel } : {}),
  243	      });
  244	    }
  245	    if (geminiReady) {
  246	      return new GeminiExplanationProvider({
  247	        timeoutMs: config.timeoutMs,
  248	        maxRetries: config.maxRetries,
  249	        ...(config.model ? { model: config.model } : {}),
  250	      });
  251	    }
  252	    return new MockExplanationProvider();
  253	  }
  254	
  255	  const provider = deps.explanationProvider ?? defaultExplanationProvider();
  256	
  257	  const { engine, prism } = createSentinelAi({ provider, prismClient: new NullPrismClient() });
  258	
  259	  const app = express();
  260	  app.disable("x-powered-by");
  261	  app.use(express.json({ limit: config.bodyLimit }));
  262	
  263	  // Desktop packaging only: the packaged renderer runs from a file:// page
  264	  // (origin "null"), so its fetches to the loopback API need an explicit,
  265	  // minimal JSON CORS policy. The web deployment stays same-origin and never
  266	  // enables this; the Electron main process sets SENTINEL_DESKTOP=1.
  267	  if (config.desktopCors) {
  268	    app.use((req: Request, res: Response, next: NextFunction) => {
  269	      res.setHeader("Access-Control-Allow-Origin", "*");
  270	      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  271	      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  272	      // Chromium Private Network Access preflight support for loopback calls.
  273	      res.setHeader("Access-Control-Allow-Private-Network", "true");
  274	      if (req.method === "OPTIONS") {
  275	        res.sendStatus(204);
  276	        return;
  277	      }
  278	      next();
  279	    });
  280	  }
  281	
  282	  app.get("/healthz", (_req: Request, res: Response) => {
  283	    res.json({
  284	      ok: true,
  285	      provider: configuredProviderName(config),
  286	      prism: prism.name,
  287	    });
  288	  });
  289	
  290	  app.post("/api/v1/explain", async (req: Request, res: Response, next: NextFunction) => {
  291	    try {
  292	      const body = parseBody(req.body);
  293	      let bundle: EvidenceBundle;
  294	      try {
  295	        bundle = parseEvidenceBundle(body.bundle);
  296	      } catch (err) {
  297	        throw new BadRequestError(
  298	          `invalid evidence bundle: ${err instanceof EvidenceValidationError ? err.message : "malformed"}`,
  299	        );
  300	      }
  301	      guardBundleSize(bundle, config.maxEvidenceRecords);
  302	      const unknowns = parseUnknowns(body.unknowns);
  303	
  304	      const explanation = await engine.explain({
  305	        bundle,
  306	        question: body.question,
  307	        audience: body.audience ?? "retail",
  308	        unknowns,
  309	      });
  310	
  311	      res.json(serializeExplanation(explanation));
  312	    } catch (err) {
  313	      next(err);
  314	    }
  315	  });
  316	
  317	  app.post("/api/v1/evaluate", async (req: Request, res: Response, next: NextFunction) => {
  318	    try {
  319	      const raw = typeof req.body === "object" && req.body !== null ? (req.body as Record<string, unknown>) : {};
  320	      const body = parseBody(raw);
  321	      const draft = raw.draft;
  322	      if (typeof draft !== "string" || draft.trim().length === 0) {
  323	        throw new BadRequestError("draft is required");
  324	      }
  325	      const bundle = parseEvidenceBundle(body.bundle);
  326	      guardBundleSize(bundle, config.maxEvidenceRecords);
  327	      const unknowns = parseUnknowns(body.unknowns);
  328	
  329	      // Deterministic evaluation of the draft against the bundle — same
  330	      // validator the explanation pipeline uses.
  331	      const index = new EvidenceIndex(bundle);
  332	      const validation = validateDraft(draft, bundle, index.knowledgeMap());
  333	
  334	      const evaluation = evaluateExplanation({
  335	        requestId:
  336	          typeof req.headers["x-request-id"] === "string"
  337	            ? (req.headers["x-request-id"] as string)
  338	            : crypto.randomUUID(),
  339	        bundle,
  340	        requestQuestion: body.question,
  341	        draft,
  342	        validation,
  343	        unknowns,
  344	      });
  345	
  346	      await prism.submitEvaluation(evaluation);
  347	      res.json(evaluation);
  348	    } catch (err) {
  349	      next(err);
  350	    }
  351	  });
  352	
  353	  app.post("/api/v1/analyze", async (req: Request, res: Response, next: NextFunction) => {
  354	    try {
  355	      if (typeof req.body !== "object" || req.body === null || Array.isArray(req.body)) {
  356	        throw new BadRequestError("body must be a JSON object");
  357	      }
  358	      const body = req.body as Record<string, unknown>;
  359	      const address = body.address;
  360	      if (typeof address !== "string" || !HEX_ADDRESS.test(address)) {
  361	        throw new BadRequestError("address must be a 20-byte hex address");
  362	      }
  363	      const chain = typeof body.chain === "string" && body.chain.length > 0 ? body.chain : "ethereum";
  364	      if (!SUPPORTED_CHAINS.has(chain)) {
  365	        throw new BadRequestError(`unsupported chain: ${chain}`);
  366	      }
  367	      const question =
  368	        typeof body.question === "string" && body.question.trim().length > 0
  369	          ? body.question
  370	          : `Explain the security posture of ${address} on ${chain}.`;
  371	      if (body.audience !== undefined && !["retail", "analyst", "developer"].includes(body.audience as string)) {
  372	        throw new BadRequestError("audience must be retail|analyst|developer");
  373	      }
  374	      const audience = (body.audience as "retail" | "analyst" | "developer" | undefined) ?? "retail";
  375	
  376	      // 1-2. Deterministic engine runs first; it is the sole source of truth.
  377	      if (blockchainProvider === undefined) {
  378	        throw new BadRequestError("blockchain provider unavailable", 503);
  379	      }
  380	      const rawEngineBundle = await securityEngine.analyzeAddressSecurity({
  381	        provider: blockchainProvider,
  382	        address,
  383	        chain,
  384	      });
  385	
  386	      // 3. Deterministic adapter: engine findings -> AI EvidenceBundle.
  387	      const adapted = adaptEngineBundle(rawEngineBundle);
  388	      // Defense-in-depth: the adapted bundle must satisfy the AI schema's
  389	      // epistemic invariants before it may reach the explanation engine.
  390	      parseEvidenceBundle(adapted.bundle);
  391	
  392	      // 4. Grounded AI explanation. The engine already refuses empty evidence.
  393	      const explanation = await engine.explain({
  394	        bundle: adapted.bundle,
  395	        question,
  396	        audience,
  399	        unknowns: adapted.unknowns,
  400	      });
  401	
  402	      // --- RESTRUCTURED RESPONSE FOR EVIDENCE-FIRST REPORTING ---
  403	      // Organize deterministic findings and AI explanation into structured sections.
  404	      const findings = adapted.findings;
  405	      const metadataFindings = findings.filter(f => f.findingType === 'ETHERSCAN_LABEL' || f.findingType === 'EXPLOIT_WARNING' || f.findingType.includes('REPUTATION'));
  406	      const relationshipFindings = findings.filter(f => f.findingType === 'FUNDING_RELATIONSHIP');
  407	      const approvalFindings = findings.filter(f => f.findingType === 'ACTIVE_APPROVAL'); // Assuming 'ACTIVE_APPROVAL' is used
  408	      const unknownFindings = adapted.unknowns.map(u => ({ field: u.field, reason: u.reason, detail: u.detail }));
  409	      const historyFindings = findings.filter(f => f.findingType === 'TRANSACTION_COUNT' || f.findingType === 'CONTRACT_INTERACTION' || f.findingType === 'TOKEN_TRANSFER');
  410	      const currentExposureFindings = findings.filter(f => f.findingType === 'NATIVE_BALANCE' || f.findingType === 'EIP7702_DELEGATION' || f.findingType === 'CURRENT_TOKEN_EXPOSURE');
  411	
  412	      // Map findings to UI-friendly categories
  413	      const securitySignals = metadataFindings.concat(relationshipFindings).concat(findings.filter(f => f.severity === 'high' || f.severity === 'warning'));
  414	      const permissions = approvalFindings; // Assuming findings cover approvals/permissions
  415	      const addressRelationships = relationshipFindings;
  416	
  417	      // Prepare structured response
  418	      res.json({
  419	        walletOverview: {
  420	          address: address,
  421	          chain: normalizeChain(chain),
  422	          addressType: rawEngineBundle.addressType ?? null,
  423	        },
  424	        currentExposure: {
  425	          nativeBalanceWei: nativeRec?.nativeBalanceWei ?? null,
  426	          eip7702: delegationRec ?? null,
  427	          tokens: tokens.map(t => ({ // Ensure tokens are structured well
  428	             token: t.token,
  429	             symbol: t.symbol,
  430	             balance: t.balance,
  431	             positive: t.positive,
  432	             knowledgeType: t.knowledgeType
  433	           })),
  434	        },
  435	        securitySignals: securitySignals.map(f => ({ // Map findings to signals
  436	          type: f.findingType,
  437	          severity: f.severity,
  438	          entity: f.entity,
  439	          description: f.evidence?.description || f.evidence?.label || f.findingType,
  440	          source: f.evidence?.source,
  441	          url: f.evidence?.url,
  442	        })),
  443	        permissions: permissions.map(p => ({ // Map approval findings
  444	          type: p.findingType,
  445	          token: p.token,
  446	          spender: p.spender,
  447	          allowance: p.allowance,
  448	          active: p.evidence?.active, // Assuming 'active' field exists in evidence
  449	          transactionHash: p.transactionHash,
  450	          blockNumber: p.blockNumber,
  451	        })),
  452	        transactions: {
  453	           count: txCountRec?.transactionCount ?? null,
  454	           contractInteractions: byType("CONTRACT_INTERACTION").length,
  455	           tokenTransfers: byType("TOKEN_TRANSFER").length,
  456	           // Potentially list key transactions here or link to full history
  457	        },
  458	        tokenActivity: tokens.filter(t => t.positive), // Simplified token activity
  459	        addressRelationships: addressRelationships.map(r => ({ // Map funding relationships
  460	          type: r.evidence?.relationship,
  461	          relatedAddress: r.evidence?.relatedAddress,
  462	          relatedLabel: r.evidence?.relatedLabel,
  463	          transactionHash: r.evidence?.transactionHash,
  464	          amount: r.evidence?.amount,
  465	          token: r.evidence?.tokenAddress,
  466	          timestamp: r.evidence?.timestamp,
  467	          metadataSource: r.evidence?.metadataSource,
  468	          metadataUrl: r.evidence?.metadataUrl
  469	        })),
  470	        externalReputation: metadataFindings.map(m => ({ // Map metadata findings explicitly as external
  471	          source: m.evidence?.source,
  472	          url: m.evidence?.url,
  473	          label: m.evidence?.label,
  474	          description: m.evidence?.description,
  475	          retrievedAt: m.evidence?.retrievedAt
  476	        })),
  477	        unknownOrUnverifiedData: {
  478	          coverageGaps: adapted.coverageGaps,
  479	          engineUnknowns: engineUnknowns,
  480	          // Explicitly mention limitations from providers if known
  481	          providerLimitations: [
  482	            // Check if RPC provider limitations are surfaced in findings or coverageGaps
  483	            // e.g., "Historical approval state unavailable from current RPC provider."
  484	          ].filter(Boolean)
  485	        },
  486	        evidence: adapted.bundle, // Include the full evidence bundle
  487	        explanation: serializeExplanation(explanation), // AI-generated explanation
  488	      });
  489	    } catch (err) {
  490	      next(err);
  491	    }
  492	  });
  493	
  494	  // 404 for unknown routes.
  495	  app.use((_req: Request, res: Response) => {
  496	    res.status(404).json({ error: "not found" });
  497	  });
  498	
  499	  // Central error handler: never leaks internals or secrets.
  500	  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  501	    if (err instanceof BadRequestError) {
  502	      res.status(err.status).json({ error: err.message });
  503	      return;
  504	    }
  505	    if (err instanceof EvidenceValidationError) {
  506	      res.status(400).json({ error: `invalid evidence: ${err.message}` });
  507	      return;
  508	    }
  509	    const anyErr = err as { status?: number; type?: string; message?: string };
  510	    if (anyErr?.type === "entity.too.large") {
  511	      res.status(413).json({ error: "request body too large" });
  512	      return;
  513	    }
  514	    if (anyErr?.type === "entity.parse.failed") {
  515	      res.status(400).json({ error: "malformed JSON body" });
  516	      return;
  517	    }
  518	    // Provider errors: sanitized upstream (secrets redacted, message only).
  519	    // Report the exact provider failure (e.g. HTTP 429 quota exhaustion)
  520	    // instead of hiding it behind a generic 500. Structural name check avoids
  521	    // importing vendor SDKs into the API layer while still surfacing exactly
  522	    // the provider's sanitized message.
  523	    const providerMessage =
  524	      anyErr instanceof Error &&
  525	      (anyErr.name === "GeminiProviderError" ||
  526	        anyErr.name === "OpenRouterProviderError" ||
  527	        anyErr.name === "OllamaProviderError")
  528	        ? anyErr.message
  529	        : undefined;
  530	    if (providerMessage) {
  531	      res.status(502).json({ error: providerMessage });
  532	      return;
  533	    }
  534	    // Unknown errors: generic message, no stack, no provider details.
  535	    res.status(500).json({ error: "internal server error" });
  536	  });
  537	
  538	  return app;
  539	}