export const buildingIngestlib = {
  slug: 'building-ingestlib',
  title: 'Building ingestlib',
  subtitle: 'What it took to turn PDFs into cited, retrieval-ready chunks on my own stack',
  date: '2026-07-13',
  readingTime: '14 min read',
  tags: ['RAG', 'Document Intelligence', 'Hybrid Search', 'Evals'],
  summary:
    'LlamaParse charges per page and keeps your documents on their servers. I spent a sprint building the self-hosted alternative — and the hard parts were nothing like what I expected: a tiny vision model that lies about charts, a rate limiter that silently degraded quality, and an eval harness that ended up auditing my own prompts.',
  body: (
    <>
      <p className="lead">
        <em>
          LlamaParse charges per page and keeps your documents on their servers. I spent a sprint
          building the self-hosted alternative — and the hard parts were nothing like what I
          expected: a tiny vision model that lies about charts, a rate limiter that silently
          degraded quality, and an eval harness that ended up auditing my own prompts.
        </em>
      </p>

      <hr />

      <h2 id="toc">Table of Contents</h2>
      <ol>
        <li>
          <a href="#why-i-built-this">Why I Built This</a>
        </li>
        <li>
          <a href="#one-mode">Killing My Own Feature: Three Parse Modes → One</a>
        </li>
        <li>
          <a href="#charts-that-lie">Struggle #1: The 0.9B Model That Lies About Charts</a>
        </li>
        <li>
          <a href="#judgment-vs-guarantees">The Design Principle That Held Everything Together</a>
        </li>
        <li>
          <a href="#chunking">Natural Chunks, No Overlap — and Why</a>
        </li>
        <li>
          <a href="#provenance">Provenance Is the Product</a>
        </li>
        <li>
          <a href="#hybrid">Struggle #2: Hybrid Search and the Corpus-State Problem</a>
        </li>
        <li>
          <a href="#works-in-dev">Struggle #3: &ldquo;Works in Dev&rdquo;</a>
        </li>
        <li>
          <a href="#eval">The Eval Harness That Audited Its Own Author</a>
        </li>
        <li>
          <a href="#numbers">The Numbers</a>
        </li>
        <li>
          <a href="#whats-next">What&apos;s Next</a>
        </li>
        <li>
          <a href="#try-it">Try It</a>
        </li>
      </ol>

      <hr />

      <h2 id="why-i-built-this">Why I Built This</h2>
      <p>
        Every serious RAG pipeline starts the same way: you have a folder of PDFs — earnings decks,
        insurance forms, clinical studies — and you need them as clean, searchable chunks a
        retriever can actually use. The commercial answer is LlamaParse, Reducto, or
        Unstructured.io. They&apos;re good. They also charge per page, and your documents live on
        their servers.
      </p>
      <p>
        I wanted the same capability on <em>my own stack</em>: my GPU for OCR, my AWS account for
        the LLM calls, my vector database, my S3 bucket. And I wanted one thing the commercial tools
        mostly treat as an afterthought: <strong>citations that point somewhere real</strong>. Not
        &ldquo;this answer came from document X&rdquo; — this answer came from{' '}
        <em>this bounding box, on this page, in this document</em>, and here&apos;s the page image
        to prove it.
      </p>
      <p>
        So I built{' '}
        <strong>
          <a href="https://github.com/LangModule/ingestlib">ingestlib</a>
        </strong>
        : one library that takes a raw PDF/DOCX/PPTX and produces searchable, cited, retrieval-ready
        chunks.
      </p>
      <pre>
        <code>pip install ingestlib</code>
      </pre>
      <pre>
        <code>{`from ingestlib.services import ingest, retrieve

ingest("finance-10k.pdf")            # parse → classify → split → embed → vector store
result = retrieve("what were the total revenues?")
print(result.context)                # ranked chunks, each citing doc · page · section`}</code>
      </pre>
      <p>
        This article is the story of how it got built — and, more honestly, the three struggles that
        shaped its architecture more than any upfront design did.
      </p>

      <hr />

      <h2 id="one-mode">Killing My Own Feature: Three Parse Modes → One</h2>
      <p>
        My first parser had three modes: <code>fast</code>, <code>balanced</code>, and{' '}
        <code>agentic</code> — the classic good/better/best menu every parsing product seems to
        offer. Fast used classical OCR, agentic threw a large multimodal LLM at every page and took
        forever.
      </p>
      <p>
        Then I actually compared outputs. The agentic mode wasn&apos;t reliably better — it was
        slower, more expensive, and <em>differently wrong</em>. Three modes meant three code paths
        to test, three quality profiles to explain, and a decision pushed onto users that I
        couldn&apos;t answer myself.
      </p>
      <blockquote>
        💡 <strong>Lesson:</strong> if you can&apos;t tell a user when to pick mode B over mode A,
        you don&apos;t have two modes — you have one mode and a liability.
      </blockquote>
      <p>
        I deleted two of them. The survivor is a single pipeline built around{' '}
        <strong>PaddleOCR-VL-1.6</strong> — a 0.9B-parameter vision-language model that tops
        OmniDocBench — running locally on my M5 Pro&apos;s GPU behind an MLX inference server (vLLM
        on NVIDIA). Layout detection runs on CPU, recognition on GPU, and every region comes back
        typed: text, tables as HTML with merged cells intact, formulas as LaTeX, charts, seals.
      </p>
      <p>Per page, the pipeline is:</p>
      <pre>
        <code>{`render @200dpi + native text (pypdfium2; office → LibreOffice → PDF first)
  → PaddleOCR-VL: layout + recognition (text · tables · formulas · charts)
  → Nova ENRICH: chart/figure crops → data tables / descriptions
  → Nova REVIEW: per-region corrections against the page image
  → assemble markdown in Python — every block traceable to its region`}</code>
      </pre>
      <p>Which brings me to the first real struggle.</p>

      <hr />

      <h2 id="charts-that-lie">Struggle #1: The 0.9B Model That Lies About Charts</h2>
      <p>
        PaddleOCR-VL reads text and tables at state-of-the-art level. Then I fed it an Uber earnings
        deck and watched it read a bar chart. The bars said $56B and $82B. The model confidently
        reported numbers that appeared nowhere on the page. On diagrams, it did something worse: it{' '}
        <em>invented data tables</em> from pictures that contained no data at all.
      </p>
      <p>
        A 0.9B model simply doesn&apos;t have the visual reasoning to estimate bar heights or resist
        hallucinating structure. But throwing a frontier model at <em>every page</em> is exactly the
        expensive-and-slow trap I&apos;d just deleted. The fix was surgical:
      </p>
      <ul>
        <li>
          The local model does what it&apos;s great at — layout, text, tables — for{' '}
          <strong>every region</strong>.
        </li>
        <li>
          Only <strong>chart and figure crops</strong> go to a frontier vision model (Amazon Nova
          Lite), with a prompt that draws a hard line: charts become markdown data tables with
          estimated values prefixed <code>~</code>; diagrams get{' '}
          <em>descriptions, never numbers</em>.
        </li>
        <li>
          A final <strong>review pass</strong> shows Nova the full page image and the extracted
          blocks — but it returns per-region JSON corrections, never a page rewrite. That
          distinction matters more than it looks: a rewrite would destroy the markdown↔bounding-box
          mapping that citations depend on.
        </li>
      </ul>
      <blockquote>
        ⚡ <strong>Cost:</strong> because Nova only sees crops and corrections, the LLM spend lands
        around <strong>$0.002 per page</strong> — parsing quality competitive with the agentic tiers
        of commercial parsers, at a fraction of their list price.
      </blockquote>
      <p>
        Honest footnote: the <code>~</code> prefix is an admission, not a weakness. No parser can
        read numbers that aren&apos;t printed. The commercial tools present chart estimates as
        facts; ingestlib marks them.
      </p>

      <hr />

      <h2 id="judgment-vs-guarantees">The Design Principle That Held Everything Together</h2>
      <p>
        Somewhere in the middle of building the splitter, a principle crystallized that ended up
        governing the whole library:
      </p>
      <blockquote>
        <strong>LLMs propose. Code guarantees.</strong>
      </blockquote>
      <p>
        Models are good at judgment calls — what values does this chart show, where does this
        section end, which pages belong together. They are terrible at invariants. So every place an
        LLM makes a decision, deterministic code enforces the rules around it:
      </p>
      <div className="not-prose my-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="py-2 pr-4 text-left font-semibold">The LLM proposes…</th>
              <th className="py-2 text-left font-semibold">…and code guarantees</th>
            </tr>
          </thead>
          <tbody className="text-ink-soft">
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4">Section vocabulary for the document</td>
              <td className="py-2">
                Role-based names only — layout labels like &ldquo;tables&rdquo; are rejected
              </td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4">A label for each page</td>
              <td className="py-2">
                Invalid labels inherit their left neighbor; grouping is pure Python
              </td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4">Chunk boundaries within a section</td>
              <td className="py-2">
                Spans repaired into a valid partition; tables and figures never split; a heading
                never ends a chunk; micro-chunks merged; then the size ceiling applies
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4">A document-type label</td>
              <td className="py-2">
                Invented categories coerce to <code>uncategorized</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        One ordering bug proved the principle&apos;s worth. My guarantee pipeline originally merged
        undersized chunks <em>after</em> enforcing the max-token ceiling — and an end-to-end test
        caught a chunk at 1,046 tokens sailing past a 1,024 ceiling, because the merge had happened
        last. The fix was one reordering:{' '}
        <strong>merge first, ceiling last — the ceiling gets the final word</strong>. An LLM-only
        pipeline would have shipped that bug forever; a code-guarantee pipeline turned it into a
        failing test.
      </p>

      <hr />

      <h2 id="chunking">Natural Chunks, No Overlap — and Why</h2>
      <p>
        Most RAG pipelines chunk with a fixed-size sliding window and 10–15% overlap. The overlap is
        a bandage: when you blindly cut every 512 tokens, you slice ideas mid-thought, and
        duplicating text at the seams keeps the sliced idea alive in at least one piece.
      </p>
      <p>
        ingestlib cuts at <strong>natural boundaries</strong> instead — an LLM groups a
        section&apos;s blocks into topical chunks, and the guarantees above keep semantic units
        whole. When a chunk ends where a thought actually ends, there&apos;s nothing straddling the
        boundary to protect. No overlap means no duplicated storage, no near-duplicate candidates
        wasting reranker slots, and — critically for this library — no blurring of citations.
      </p>
      <p>
        In place of overlap, every chunk carries a <strong>context breadcrumb</strong> in the text
        that actually gets embedded:
      </p>
      <pre>
        <code>{`[research_paper › methods › Participant recruitment]

Participants were recruited through community centers in Cairo...`}</code>
      </pre>
      <p>
        That one line — document type, section role, chunk topic — gives the embedding model the
        surrounding context that overlap crudely approximates, at a cost of ~15 tokens instead of
        15%.
      </p>

      <hr />

      <h2 id="provenance">Provenance Is the Product</h2>
      <p>
        Everything above serves one chain: a retrieval hit carries{' '}
        <code>{`{doc_id, pages, region_ids}`}</code>; region IDs resolve to bounding boxes; pages
        resolve to rendered PNGs stored in S3. Which means any answer can be traced to a highlighted
        box on a page image — the foundation for a review UI where you hover a chunk and see exactly
        where it came from.
      </p>
      <p>Two design decisions make the chain cheap:</p>
      <ol>
        <li>
          <strong>Documents are content-addressed.</strong> <code>doc_id</code> is the SHA-256 of
          the file bytes. Re-ingesting the same file is a checksum lookup and a skip; vector IDs (
          <code>doc_id:chunk_id</code>) make re-ingestion overwrite instead of duplicate.
        </li>
        <li>
          <strong>There is no database.</strong> S3 holds every artifact under one prefix per
          document; the vector store&apos;s metadata holds the rest. The whole citation chain
          resolves from those two — a jobs/documents table is an app-layer concern, rebuildable from
          S3 if ever needed.
        </li>
      </ol>

      <hr />

      <h2 id="hybrid">Struggle #2: Hybrid Search and the Corpus-State Problem</h2>
      <p>
        Dense embeddings have a known blind spot: exact tokens. Ask for form code &ldquo;ACORD
        25&rdquo; or &ldquo;GPIO25&rdquo; and embedding similarity happily returns something{' '}
        <em>semantically similar</em> — a different form, a different pin. For a library aimed at
        financial filings and technical forms, that&apos;s the exact failure class users will hit.
      </p>
      <p>
        The classic fix is BM25 alongside dense search. The classic problem is that BM25 needs{' '}
        <strong>corpus statistics</strong> — document frequencies that must be fitted, persisted,
        and refreshed as documents come and go. I shelved hybrid search over exactly that
        maintenance burden… and then it dissolved, twice, in two different ways:
      </p>
      <ul>
        <li>
          <strong>Pinecone:</strong> a hosted sparse embedding model (
          <code>pinecone-sparse-english-v0</code>) that weighs tokens by context — no corpus state
          exists at all. A second sparse index sits beside the dense one; queries hit both.
        </li>
        <li>
          <strong>Qdrant:</strong> BM25 where the <em>server</em> computes document frequencies live
          via an IDF modifier — the client only computes stateless term frequencies. One collection,
          named dense + sparse vectors, fused server-side with reciprocal rank fusion in a single
          query.
        </li>
      </ul>
      <p>
        The elegant part: I never had to solve score fusion on the Pinecone side, because the
        reranker was already there. Dense cosine scores and sparse dot-products aren&apos;t
        comparable — but a reranker reads the <em>full text</em> of every candidate and produces one
        order across both signals. The lexical index&apos;s only job is getting the exact-token
        match <em>into the pool</em>; the reranker crowns it.
      </p>
      <blockquote>
        ℹ️ Verified live with a deliberately adversarial test: an off-topic dense query vector plus
        the exact tokens &ldquo;recruited Cairo community centers&rdquo; — the BM25 branch surfaces
        the right chunk through fusion anyway.
      </blockquote>

      <hr />

      <h2 id="works-in-dev">Struggle #3: &ldquo;Works in Dev&rdquo;</h2>
      <p>
        My testing rule for this project was strict: <strong>real APIs, never mocks</strong>. Pure
        logic runs on every test invocation; anything that touches a server is an opt-in end-to-end
        suite against the actual service. That rule paid for itself the day I pointed the Qdrant
        connector at a real cluster.
      </p>
      <p>
        The connector had passed every test against Qdrant&apos;s in-process engine — the official
        embedded mode, real query code, no server. Against Qdrant Cloud, four tests instantly failed
        with:
      </p>
      <pre>
        <code>{`400 Bad Request: Index required but not found for "namespace"
Help: Create an index for this key or use a different filter.`}</code>
      </pre>
      <p>
        The real server requires a payload index on every field you filter by.{' '}
        <strong>The embedded engine doesn&apos;t enforce that rule at all.</strong> Classic
        works-in-dev, breaks-in-prod — except my dev environment was the vendor&apos;s own official
        local mode. The fix: the collection bootstrap now creates keyword indexes for every
        filterable field, idempotently, healing pre-existing collections too.
      </p>
      <blockquote>
        ⚠️ <strong>Lesson:</strong> an official embedded/in-memory mode is a convenience, not a
        contract. If your code will talk to a server, your tests must talk to that server at least
        once before you believe anything.
      </blockquote>

      <hr />

      <h2 id="eval">The Eval Harness That Audited Its Own Author</h2>
      <p>
        With everything built, I had a system that <em>seemed</em> good — five spot-checked queries
        and a feeling. That&apos;s not knowledge. So the last piece was an eval harness: 22
        ground-truth questions over 12 real documents (10-Ks, a clinical trial, a hardware
        datasheet, a catastrophe report…), each answerable from specific pages, run through the real
        retrieval flow under a 2×2 grid — dense/hybrid × rerank on/off — scored by hit@k and MRR.
      </p>
      <p>
        Two deliberate design choices: it lives in <code>evals/</code>, not <code>tests/</code>{' '}
        (quality numbers drift with models and data — a report should tell you, not block CI), and
        ground truth is <strong>(document, pages, keywords)</strong> — never chunk IDs, which change
        whenever splitting logic changes. Pages are forever.
      </p>
      <p>The first run found two real bugs — neither of them where I was looking:</p>
      <ol>
        <li>
          <strong>Parse was dropping chart annotations.</strong> A question about electrolyser
          growth failed in <em>every</em> configuration — not a retrieval problem, but because the
          chart&apos;s printed &ldquo;+360%&rdquo; callout never made it into any chunk. The
          enricher extracted the chart&apos;s data table perfectly and ignored the annotations
          layered on top. One generic prompt line later (&ldquo;include printed callouts, growth
          labels, or annotations&rdquo;), a re-parse captured all six callouts on that chart, and
          the failing question went from unfindable to rank 1 across the board.
        </li>
        <li>
          <strong>My reranker was silently degraded.</strong> The provider&apos;s free tier was
          rate-limiting, and the graceful-degradation path — fall back to raw vector order, log a
          warning — had quietly absorbed 16 of 44 reranked queries. Real users would have gotten
          worse rankings with zero errors. Retry-with-backoff fixed it; only the eval&apos;s
          aggregate numbers made the pattern visible.
        </li>
      </ol>
      <p>
        And one bug the harness caught in <em>me</em>: my first fix for the callout gap included the
        example <code>&quot;+360%&quot;</code> hardcoded in the prompt. Literal examples in
        extraction prompts leak — a model can parrot the example value onto charts that say
        something else. The shipped prompt describes the category generically, and the re-parse
        proved the model extracts the values from the image, not the prompt.
      </p>

      <h3 id="results">The results</h3>
      <div className="not-prose my-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="py-2 pr-4 text-left font-semibold">Config</th>
              <th className="py-2 pr-4 text-left font-semibold">hit@1</th>
              <th className="py-2 pr-4 text-left font-semibold">hit@3</th>
              <th className="py-2 text-left font-semibold">MRR</th>
            </tr>
          </thead>
          <tbody className="text-ink-soft">
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4">dense</td>
              <td className="py-2 pr-4">0.86</td>
              <td className="py-2 pr-4">0.95</td>
              <td className="py-2">0.91</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">dense + rerank</td>
              <td className="py-2 pr-4">0.91–0.95</td>
              <td className="py-2 pr-4 font-semibold">1.00</td>
              <td className="py-2">0.95+</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4">hybrid</td>
              <td className="py-2 pr-4">0.86</td>
              <td className="py-2 pr-4">0.95</td>
              <td className="py-2">0.91</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-semibold">hybrid + rerank (default)</td>
              <td className="py-2 pr-4">0.86–1.00</td>
              <td className="py-2 pr-4 font-semibold">1.00</td>
              <td className="py-2">0.93+</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Three findings I&apos;ll actually stand behind:</p>
      <ul>
        <li>
          <strong>Reranking is the biggest lever</strong> — up to +14 points hit@1, and it rescues
          answers buried inside tables that dense search misses from its top-5 entirely.
        </li>
        <li>
          <strong>With reranking, every answer lands in the top 3, every run.</strong> That&apos;s
          the stable, defensible number.
        </li>
        <li>
          <strong>hit@1 is noisy — and knowing that is itself a result.</strong> Parsing is
          LLM-driven, so a re-parse yields slightly different chunk boundaries, and a 22-question
          dataset means each question is worth 4.5 points. Report the stable metric; disclose the
          noisy one.
        </li>
      </ul>

      <hr />

      <h2 id="numbers">The Numbers</h2>
      <div className="not-prose my-6 overflow-x-auto">
        <table className="w-full text-sm">
          <tbody className="text-ink-soft">
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">Parse cost</td>
              <td className="py-2">~$0.002/page in LLM spend (OCR runs on your GPU)</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">Parse speed</td>
              <td className="py-2">~12s/page on an M5 Pro, pipeline-overlapped</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">Full ingest</td>
              <td className="py-2">
                3-page 10-K in ~32s: parse 26 · classify 2 · split 3 · embed 0.4 · upsert 1
              </td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">Retrieval quality</td>
              <td className="py-2">hit@3 = 1.00 with reranking, across runs</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-semibold">Tests</td>
              <td className="py-2">179 fast tests + 8 opt-in e2e suites — real APIs, zero mocks</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr />

      <h2 id="whats-next">What&apos;s Next</h2>
      <p>
        The library groundwork was always pointed at something visual:{' '}
        <strong>
          <a href="https://github.com/LangModule/ingestlib-studio">ingestlib-studio</a>
        </strong>{' '}
        — and it has since shipped at v1.0.0. A review UI with the page render on the left and
        parsed results on the right, where hovering a chunk highlights its bounding box on the
        page and every retrieval answer points at the exact spot it came from. Plus the parts I
        did not plan at first: a setup wizard that verifies your stack with real calls and
        activates the config with zero restarts, try-before-you-commit pipeline runs, and
        lossless vector-store migration, because S3 is the source of truth.
      </p>
      <p>
        After that: a schema-driven <code>extract</code> operation (pull typed fields with
        provenance), and growing the eval dataset as the corpus does.
      </p>

      <hr />

      <h2 id="try-it">Try It</h2>
      <pre>
        <code>pip install ingestlib</code>
      </pre>
      <ul>
        <li>
          📦 <strong>PyPI</strong>: <a href="https://pypi.org/project/ingestlib/">ingestlib</a>
        </li>
        <li>
          🐙 <strong>GitHub</strong>:{' '}
          <a href="https://github.com/LangModule/ingestlib">LangModule/ingestlib</a>
        </li>
        <li>
          📄 <strong>License</strong>: MIT
        </li>
      </ul>
      <p>
        You&apos;ll need an AWS account with Bedrock access, a Pinecone or Qdrant instance (both
        free tiers work), and a GPU for the OCR server — Apple Silicon or NVIDIA. Everything else
        bootstraps itself on first use.
      </p>
      <blockquote>
        <em>
          If you&apos;re building RAG over real documents — the kind with merged-cell tables, charts
          that matter, and answers that need receipts — I&apos;d genuinely love to hear how it holds
          up against your corpus.
        </em>{' '}
        🚀
      </blockquote>
    </>
  ),
}
