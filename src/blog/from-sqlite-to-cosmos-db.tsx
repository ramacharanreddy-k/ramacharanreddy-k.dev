export const fromSqliteToCosmosDb = {
  slug: 'from-sqlite-to-cosmos-db',
  title: 'From SQLite to Cosmos DB',
  subtitle: 'How I built a production-grade checkpoint saver for LangGraph',
  date: '2026-05-16',
  readingTime: '15 min read',
  tags: ['LangGraph', 'Cosmos DB', 'Azure', 'Production'],
  summary:
    "Your AI agent remembers everything — until the server restarts. Here's how I adapted LangGraph's persistence layer from a local SQLite file to a globally distributed Azure Cosmos DB backend, one design decision at a time.",
  body: (
    <>
      <p className="lead">
        <em>
          Your AI agent remembers everything — until the server restarts. Here&apos;s how I adapted
          LangGraph&apos;s persistence layer from a local SQLite file to a globally distributed
          Azure Cosmos DB backend, one design decision at a time.
        </em>
      </p>

      <hr />

      <h2 id="toc">Table of Contents</h2>
      <ol>
        <li>
          <a href="#why-i-built-this">Why I Built This</a>
        </li>
        <li>
          <a href="#starting-point">Understanding the Starting Point: How the SQLite Saver Works</a>
        </li>
        <li>
          <a href="#adaptation">The Adaptation: SQLite → Cosmos DB</a>
          <ul>
            <li>
              <a href="#adaptation-1">Tables → Documents (Data Modeling)</a>
            </li>
            <li>
              <a href="#adaptation-2">
                <code>ORDER BY DESC LIMIT 1</code> → The Tip Document Pattern
              </a>
            </li>
            <li>
              <a href="#adaptation-3">SQL Transactions → Transactional Batches</a>
            </li>
            <li>
              <a href="#adaptation-4">Single Table → Dual-Partition Strategy</a>
            </li>
            <li>
              <a href="#adaptation-5">BLOB Columns → Base64 Encoding</a>
            </li>
            <li>
              <a href="#adaptation-6">Thread Lock → Concurrency via Document Semantics</a>
            </li>
            <li>
              <a href="#adaptation-7">
                <code>?</code> Placeholders → <code>@</code> Parameters + Injection Prevention
              </a>
            </li>
            <li>
              <a href="#adaptation-8">Connection String → Azure Identity</a>
            </li>
          </ul>
        </li>
        <li>
          <a href="#full-picture">The Full Picture: A Side-by-Side Comparison</a>
        </li>
        <li>
          <a href="#async-support">Full Async Support: Not an Afterthought</a>
        </li>
        <li>
          <a href="#in-practice">In Practice: Using It with LangGraph</a>
        </li>
        <li>
          <a href="#setup">Setting Up Azure Cosmos DB</a>
        </li>
        <li>
          <a href="#key-design">Document Key Design: The Hidden Architecture</a>
        </li>
        <li>
          <a href="#thread-deletion">Thread Deletion: Server-Side Bulk Operations</a>
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
        If you&apos;ve spent any time building with{' '}
        <a href="https://github.com/langchain-ai/langgraph">LangGraph</a> — LangChain&apos;s
        framework for building stateful, multi-step AI agents — you&apos;ve probably experienced
        the magic moment where your agent <em>remembers</em> a conversation across multiple turns.
      </p>
      <p>
        That magic comes from <strong>checkpointing</strong>: LangGraph takes a snapshot of graph
        state after every node execution and saves it somewhere. By default, that &ldquo;somewhere&rdquo;
        is a SQLite file.
      </p>
      <blockquote>
        💡 <strong>Note:</strong> SQLite is <em>great</em> — for demos.
      </blockquote>
      <p>But the moment you try to:</p>
      <ul>
        <li>
          <strong>Run multiple instances</strong> of your agent behind a load balancer
        </li>
        <li>
          <strong>Deploy to Kubernetes</strong> or Azure Container Apps
        </li>
        <li>
          <strong>Handle thousands of concurrent conversations</strong>
        </li>
        <li>
          <strong>Serve users across geographies</strong> with low latency
        </li>
        <li>
          <strong>Guarantee durability</strong> — your agent&apos;s memory must survive hardware
          failures
        </li>
      </ul>
      <p>
        …SQLite becomes a bottleneck. It&apos;s a single file on a single disk. It doesn&apos;t
        replicate. It doesn&apos;t distribute. And when your container restarts, that file might
        just disappear.
      </p>
      <p>
        I needed something better. So I built{' '}
        <strong>
          <a href="https://github.com/LangModule/checkpoint-cosmos">langgraph-checkpoint-cosmos</a>
        </strong>{' '}
        — a drop-in replacement that swaps SQLite for Azure Cosmos DB, while preserving every bit
        of the LangGraph checkpoint interface.
      </p>
      <pre>
        <code>pip install langgraph-checkpoint-cosmos</code>
      </pre>
      <p>
        This article is the story of <em>how</em> I adapted the original SQLite implementation to
        work with a globally distributed document database — every trade-off, every design pattern,
        every decision.
      </p>

      <hr />

      <h2 id="starting-point">Understanding the Starting Point: How the SQLite Saver Works</h2>
      <p>
        Before we can talk about adaptation, we need to understand what we&apos;re adapting{' '}
        <em>from</em>. The original from the LangGraph repo is clean, well-designed, and —
        crucially — simple. Let&apos;s break down its architecture.
      </p>

      <h3 id="schema">The Schema: Two Tables</h3>
      <p>The SQLite saver creates two tables at startup:</p>
      <pre>
        <code>{`CREATE TABLE IF NOT EXISTS checkpoints (
    thread_id TEXT NOT NULL,
    checkpoint_ns TEXT NOT NULL DEFAULT '',
    checkpoint_id TEXT NOT NULL,
    parent_checkpoint_id TEXT,
    type TEXT,
    checkpoint BLOB,
    metadata BLOB,
    PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
);

CREATE TABLE IF NOT EXISTS writes (
    thread_id TEXT NOT NULL,
    checkpoint_ns TEXT NOT NULL DEFAULT '',
    checkpoint_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    idx INTEGER NOT NULL,
    channel TEXT NOT NULL,
    type TEXT,
    value BLOB,
    PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, idx)
);`}</code>
      </pre>
      <p>Simple. Elegant. Two tables, primary keys, BLOB columns for serialized data.</p>

      <h3 id="core-operations">The Core Operations</h3>
      <p>
        The SQLite saver implements five key methods from <code>BaseCheckpointSaver</code>:
      </p>
      <div className="not-prose my-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="py-2 pr-4 text-left font-semibold">Method</th>
              <th className="py-2 text-left font-semibold">What It Does</th>
            </tr>
          </thead>
          <tbody className="text-ink-soft">
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-mono text-[12px]">get_tuple(config)</td>
              <td className="py-2">Fetches the latest (or specific) checkpoint + associated writes</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-mono text-[12px]">list(config, ...)</td>
              <td className="py-2">Lists/searches checkpoints with filters and pagination</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-mono text-[12px]">put(config, checkpoint, metadata, ...)</td>
              <td className="py-2">Saves a new checkpoint</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-mono text-[12px]">put_writes(config, writes, task_id)</td>
              <td className="py-2">Stores intermediate writes for a checkpoint</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono text-[12px]">get_next_version(current, channel)</td>
              <td className="py-2">Generates monotonic version IDs</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 id="get-latest-query">The &ldquo;Get Latest&rdquo; Query</h3>
      <p>
        Here&apos;s how SQLite finds the latest checkpoint — the most frequent operation in any
        LangGraph workflow:
      </p>
      <pre>
        <code>{`SELECT thread_id, checkpoint_id, parent_checkpoint_id, type, checkpoint, metadata
FROM checkpoints
WHERE thread_id = ? AND checkpoint_ns = ?
ORDER BY checkpoint_id DESC
LIMIT 1`}</code>
      </pre>
      <p>
        It queries <em>all</em> checkpoints for a thread, sorts them by ID in descending order, and
        grabs the first result. For SQLite with a small dataset on a local disk, this is fine. But
        for a distributed database where queries cost money (measured in{' '}
        <a href="https://learn.microsoft.com/en-us/azure/cosmos-db/request-units">Request Units</a>
        ) and data could be spread across partitions… this pattern is expensive.
      </p>
      <p>
        <strong>This is where the adaptation story begins.</strong>
      </p>

      <hr />

      <h2 id="adaptation">The Adaptation: SQLite → Cosmos DB</h2>
      <p>
        Adapting a relational checkpoint saver to a document database isn&apos;t a line-by-line
        translation. It requires rethinking data modeling, access patterns, consistency guarantees,
        and performance characteristics from the ground up.
      </p>
      <p>
        Here&apos;s every major adaptation I made, and <em>why</em>.
      </p>

      <h3 id="adaptation-1">Adaptation 1: Tables → Documents (Data Modeling)</h3>
      <p>
        <strong>SQLite</strong> stores data in <em>rows</em> within <em>tables</em>. Each
        checkpoint is a row with typed columns.
      </p>
      <p>
        <strong>Cosmos DB</strong> stores data as <em>JSON documents</em> within{' '}
        <em>containers</em>. There are no tables, no columns — just documents with properties.
      </p>

      <h4>The SQLite Row</h4>
      <pre>
        <code>{`| thread_id | checkpoint_ns | checkpoint_id | type | checkpoint (BLOB) | metadata (BLOB) |
| "user-1"  | ""            | "abc123"      | ...  | <binary>          | <binary>        |`}</code>
      </pre>

      <h4>The Cosmos DB Document</h4>
      <pre>
        <code>{`{
    "id": "checkpoint$user-1$$abc123",
    "partition_key": "checkpoint$user-1$",
    "thread_id": "user-1",
    "checkpoint_ns": "",
    "checkpoint_id": "abc123",
    "parent_checkpoint_id": "xyz789",
    "type": "msgpack",
    "checkpoint": "base64-encoded-string...",
    "metadata": { "step": 3, "source": "loop" },
    "metadata_type": "json",
    "metadata_blob": "base64-encoded-string..."
}`}</code>
      </pre>

      <h4>Key Differences</h4>
      <div className="not-prose my-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="py-2 pr-4 text-left font-semibold">Aspect</th>
              <th className="py-2 pr-4 text-left font-semibold">SQLite</th>
              <th className="py-2 text-left font-semibold">Cosmos DB</th>
            </tr>
          </thead>
          <tbody className="text-ink-soft">
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">Primary Key</td>
              <td className="py-2 pr-4">Composite (thread_id, ns, id)</td>
              <td className="py-2">Single id field — composite key encoded as checkpoint$thread$ns$id</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">Binary Data</td>
              <td className="py-2 pr-4">Native BLOB columns</td>
              <td className="py-2">Base64-encoded strings (JSON doesn&apos;t support binary)</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">Partition Key</td>
              <td className="py-2 pr-4">Not applicable</td>
              <td className="py-2">/partition_key — determines data distribution</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-semibold">Metadata</td>
              <td className="py-2 pr-4">Single BLOB</td>
              <td className="py-2">
                <strong>Dual storage</strong>: searchable JSON + high-fidelity Base64 blob
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <blockquote>
        ℹ️ <strong>Note on Metadata:</strong> That last point — <strong>dual metadata storage</strong>{' '}
        — is worth explaining. SQLite stores metadata as a single BLOB and deserializes it when
        reading. But Cosmos DB supports SQL queries over JSON properties. I wanted to enable{' '}
        <code>list()</code> with metadata filters (e.g., &ldquo;find all checkpoints where{' '}
        <code>metadata.source == &apos;input&apos;</code>&rdquo;) without deserializing every
        document.
      </blockquote>
      <p>So I store metadata twice:</p>
      <ol>
        <li>
          <strong>
            <code>metadata</code>
          </strong>{' '}
          (JSON) — the raw dict, queryable via Cosmos DB SQL.
        </li>
        <li>
          <strong>
            <code>metadata_blob</code>
          </strong>{' '}
          (Base64 string) — the serialized bytes, for perfect fidelity during deserialization.
        </li>
      </ol>
      <p>
        This way, you get the best of both worlds: fast filtered queries <em>and</em> lossless
        checkpoint recovery.
      </p>
      <pre>
        <code>{`# From __init__.py — the dual metadata storage
data = {
    "id": key,
    "partition_key": partition_key,
    # ...
    "metadata": metadata,          # Searchable JSON
    "metadata_type": md_type,
    "metadata_blob": metadata_b64  # High-fidelity blob
}`}</code>
      </pre>

      <h3 id="adaptation-2">
        Adaptation 2: <code>ORDER BY DESC LIMIT 1</code> → The Tip Document Pattern
      </h3>
      <p>This is the single most important architectural change in the entire project.</p>

      <h4>The SQLite way</h4>
      <pre>
        <code>{`SELECT * FROM checkpoints
WHERE thread_id = ? AND checkpoint_ns = ?
ORDER BY checkpoint_id DESC
LIMIT 1`}</code>
      </pre>
      <p>
        This works because SQLite can sort rows efficiently with local indexes. The cost is
        negligible.
      </p>

      <h4>The Cosmos DB problem</h4>
      <p>In Cosmos DB, the equivalent query would be:</p>
      <pre>
        <code>{`SELECT TOP 1 * FROM c
WHERE c.thread_id = @thread_id AND c.checkpoint_ns = @ns
ORDER BY c.checkpoint_id DESC`}</code>
      </pre>
      <p>This requires:</p>
      <ul>
        <li>
          A <strong>composite index</strong> on (thread_id, checkpoint_ns, checkpoint_id DESC) —
          which you&apos;d have to configure manually.
        </li>
        <li>
          A <strong>query</strong> — which costs more Request Units (RU) than a point-read.
        </li>
        <li>
          <strong>Sorting within the partition</strong> — still <code>O(n)</code> relative to
          checkpoint count.
        </li>
      </ul>

      <h4>The Tip Document solution</h4>
      <p>
        Instead, I introduced a <strong>Tip Document</strong> — a lightweight pointer that always
        references the latest checkpoint:
      </p>
      <pre>
        <code>{`{
    "id": "tip$user-1$",
    "partition_key": "checkpoint$user-1$",
    "thread_id": "user-1",
    "checkpoint_ns": "",
    "checkpoint_id": "abc123",
    "type": "tip"
}`}</code>
      </pre>
      <p>
        <strong>Reading the latest checkpoint is now two point-reads:</strong>
      </p>
      <ol>
        <li>
          Read the Tip Document by its deterministic ID → get <code>checkpoint_id</code>.
        </li>
        <li>Read the actual checkpoint by its ID → get the full state.</li>
      </ol>
      <blockquote>
        ⚡ <strong>Performance:</strong> Point-reads in Cosmos DB are the cheapest possible
        operation — guaranteed <strong>1 RU</strong> each, with{' '}
        <strong>single-digit millisecond latency</strong>, regardless of container size. No indexes
        needed. No sorting. No scanning.
      </blockquote>
      <p>Here&apos;s the implementation:</p>
      <pre>
        <code>{`def get_tuple(self, config: RunnableConfig) -> CheckpointTuple | None:
    thread_id = config["configurable"]["thread_id"]
    checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
    checkpoint_id = get_checkpoint_id(config)

    partition_key = _make_cosmosdb_checkpoint_key(thread_id, checkpoint_ns, '')

    if checkpoint_id:
        # Direct access — the caller knows which checkpoint they want
        key = _make_cosmosdb_checkpoint_key(thread_id, checkpoint_ns, checkpoint_id)
        item = self.container.read_item(item=key, partition_key=partition_key)
    else:
        # Tip Document optimization — O(1) lookup of the latest checkpoint
        tip_key = _make_cosmosdb_tip_key(thread_id, checkpoint_ns)
        tip_item = self.container.read_item(item=tip_key, partition_key=partition_key)
        latest_checkpoint_id = tip_item["checkpoint_id"]

        key = _make_cosmosdb_checkpoint_key(
            thread_id, checkpoint_ns, latest_checkpoint_id
        )
        item = self.container.read_item(item=key, partition_key=partition_key)`}</code>
      </pre>
      <p>
        <strong>Compare this to the original SQLite code:</strong>
      </p>
      <pre>
        <code>{`# SQLite: Query + sort + limit
cur.execute(
    "SELECT ... FROM checkpoints "
    "WHERE thread_id = ? AND checkpoint_ns = ? "
    "ORDER BY checkpoint_id DESC LIMIT 1",
    (thread_id, checkpoint_ns),
)
value = cur.fetchone()`}</code>
      </pre>
      <p>
        Same result. Fundamentally different execution path. The Cosmos DB version scales to{' '}
        <em>millions</em> of checkpoints per thread with zero performance degradation.
      </p>

      <h3 id="adaptation-3">Adaptation 3: SQL Transactions → Transactional Batches</h3>
      <p>
        In SQLite, the <code>put()</code> method simply inserts a row. The connection&apos;s
        transaction ensures atomicity.
      </p>
      <p>
        In Cosmos DB, saving a checkpoint requires <strong>two</strong> document operations:
      </p>
      <ol>
        <li>
          <strong>Upsert</strong> the checkpoint document.
        </li>
        <li>
          <strong>Upsert</strong> the Tip Document to point to the new checkpoint.
        </li>
      </ol>
      <blockquote>
        ⚠️ <strong>Risk:</strong> If operation 1 succeeds but operation 2 fails, you have a phantom
        checkpoint — saved but invisible. If operation 2 succeeds but operation 1 fails, the Tip
        points to nothing.
      </blockquote>

      <h4>The solution: Cosmos DB Transactional Batches</h4>
      <p>
        Cosmos DB supports <strong>transactional batches</strong> — a set of operations on
        documents within the <em>same logical partition</em> that execute atomically. All succeed,
        or all roll back.
      </p>
      <pre>
        <code>{`def put(self, config, checkpoint, metadata, new_versions):
    # ... serialize checkpoint and metadata ...

    # Checkpoint document
    data = {
        "id": key,
        "partition_key": partition_key,
        "checkpoint": checkpoint_b64,
        "metadata": metadata,
        "metadata_blob": metadata_b64,
        # ...
    }

    # Tip Document — always points to the latest
    tip_data = {
        "id": tip_key,
        "partition_key": partition_key,  # Same partition = atomic!
        "checkpoint_id": checkpoint_id,
        "type": "tip"
    }

    # Both operations execute as ONE atomic unit
    batch_operations = [
        ("upsert", (data,), {}),
        ("upsert", (tip_data,), {})
    ]

    self.container.execute_item_batch(batch_operations, partition_key)`}</code>
      </pre>
      <p>
        <strong>The critical insight:</strong> The Tip Document lives in the <em>same partition</em>{' '}
        as the checkpoints. This is by design — Cosmos DB transactional batches only work within a
        single logical partition. By co-locating them, we get atomicity for free.
      </p>

      <h3 id="adaptation-4">Adaptation 4: Single Table → Dual-Partition Strategy</h3>
      <p>
        In SQLite, checkpoints and writes live in separate <em>tables</em> but the same{' '}
        <em>database file</em>. Queries to either table are equally fast.
      </p>
      <p>
        In Cosmos DB, everything lives in <em>one container</em>, but the{' '}
        <strong>partition key</strong> determines which logical partition a document belongs to.
        Documents in different partitions are physically separated and can be on different servers.
      </p>
      <p>
        I designed a <strong>dual-partition strategy</strong> that separates checkpoints from
        writes:
      </p>
      <div className="not-prose border-border/40 my-6 rounded-md border p-5">
        <p className="text-muted mb-4 text-center font-mono text-[10px] font-semibold tracking-widest uppercase">
          Cosmos DB Container
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-accent-soft/40 border-accent/30 rounded-md border p-4">
            <p className="text-accent-deep mb-3 font-mono text-[10px] font-bold tracking-widest uppercase">
              Partition: checkpoint$user-1$
            </p>
            <ul className="space-y-1.5 font-mono text-[11px] leading-relaxed">
              <li>
                📄 tip$user-1$ <span className="text-muted">(Tip)</span>
              </li>
              <li>
                📄 checkpoint$user-1$$abc123 <span className="text-muted">(Checkpoint)</span>
              </li>
              <li>
                📄 checkpoint$user-1$$def456 <span className="text-muted">(Checkpoint)</span>
              </li>
            </ul>
          </div>
          <div className="border-border/60 bg-bg-soft/5 rounded-md border p-4">
            <p className="text-ink-soft mb-3 font-mono text-[10px] font-bold tracking-widest uppercase">
              Partition: writes$user-1$
            </p>
            <ul className="space-y-1.5 font-mono text-[11px] leading-relaxed">
              <li>
                📝 writes$user-1$$abc123$t1$0 <span className="text-muted">(Write)</span>
              </li>
              <li>
                📝 writes$user-1$$abc123$t1$1 <span className="text-muted">(Write)</span>
              </li>
              <li>
                📝 writes$user-1$$abc123$t2$0 <span className="text-muted">(Write)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <h4>Why split them?</h4>
      <ol>
        <li>
          <strong>Performance isolation</strong>: Writes can be bursty. An agent making 20 parallel
          tool calls generates 20 write documents in rapid succession. If these were in the
          checkpoint partition, they&apos;d compete with the fast point-reads of{' '}
          <code>get_tuple()</code>.
        </li>
        <li>
          <strong>Cost optimization</strong>: Cosmos DB charges RU/s (Request Units per second) and
          throttles at the partition level. Separating workloads means bursty writes don&apos;t
          cause checkpoint reads to be throttled.
        </li>
        <li>
          <strong>Clean deletion</strong>: When you delete a thread, you can target each partition
          independently using <code>delete_all_items_by_partition_key()</code> — a server-side bulk
          operation that&apos;s <em>dramatically</em> cheaper than item-by-item deletion.
        </li>
      </ol>
      <pre>
        <code>{`def _make_cosmosdb_writes_partition_key(thread_id: str, checkpoint_ns: str) -> str:
    """Writes get their own partition: writes$thread-1$namespace"""
    return COSMOSDB_KEY_SEPARATOR.join(["writes", thread_id, checkpoint_ns])`}</code>
      </pre>

      <h3 id="adaptation-5">Adaptation 5: BLOB Columns → Base64 Encoding</h3>
      <p>
        SQLite has native support for <code>BLOB</code> (Binary Large Object) columns. You can
        store raw bytes directly:
      </p>
      <pre>
        <code>{`# SQLite — binary data stored directly
cur.execute("INSERT INTO checkpoints ... VALUES (?, ?, ?, ?, ?, ?)",
    (thread_id, ns, id, parent_id, type_, checkpoint_bytes))`}</code>
      </pre>
      <p>
        Cosmos DB documents are JSON. JSON has no binary type. Every piece of binary data needs to
        be encoded as a string.
      </p>
      <p>
        I chose <strong>Base64 encoding</strong>, which increases size by ~33% but is universally
        supported and safe for storage:
      </p>
      <pre>
        <code>{`# Cosmos DB — binary serialized to Base64
type_, checkpoint_bytes = self.serde.dumps_typed(checkpoint)
checkpoint_b64 = base64.b64encode(checkpoint_bytes).decode('utf-8')

# Reading back
c_bytes = base64.b64decode(item["checkpoint"])
checkpoint = self.serde.loads_typed((c_type, c_bytes))`}</code>
      </pre>
      <p>
        This adds a tiny bit of CPU overhead, but it&apos;s negligible compared to network latency.
        And it keeps our documents as standard JSON — no tricks, no hacks.
      </p>

      <h3 id="adaptation-6">Adaptation 6: Thread Lock → Concurrency via Document Semantics</h3>
      <p>
        SQLite uses a <strong>threading lock</strong> to ensure only one thread accesses the
        database at a time:
      </p>
      <pre>
        <code>{`# SQLite saver — manual thread safety
class SqliteSaver:
    def __init__(self, conn):
        self.lock = threading.Lock()

    @contextmanager
    def cursor(self, transaction=True):
        with self.lock:  # Only one caller at a time
            self.setup()
            cur = self.conn.cursor()
            try:
                yield cur
            finally:
                if transaction:
                    self.conn.commit()
                cur.close()`}</code>
      </pre>
      <p>
        In Cosmos DB, there&apos;s no shared file. Each operation is an HTTP request.{' '}
        <strong>Concurrency is handled by the database itself</strong>, through document-level
        optimistic concurrency and partition-level batch atomicity.
      </p>
      <p>
        My implementation doesn&apos;t need a lock for regular operations. But for writes (
        <code>put_writes</code>), I needed to handle a subtle concurrency case:
      </p>
      <p>
        <strong>What happens when two parallel tasks try to create the same write document?</strong>
      </p>
      <pre>
        <code>{`def _execute_batch_with_fallback(self, batch_ops, pk, is_upsert):
    """Execute batch with graceful conflict handling."""
    try:
        self.container.execute_item_batch(batch_ops, pk)
    except CosmosBatchOperationError as e:
        if not is_upsert and e.status_code == 409:
            # Batch failed due to conflict — retry each item individually
            for op in batch_ops:
                item = op[1][0]
                try:
                    self.container.create_item(item)
                except CosmosHttpResponseError as e2:
                    if e2.status_code == 409:
                        pass  # Already exists — safe to skip
                    else:
                        raise
        else:
            raise`}</code>
      </pre>
      <p>The design here is intentional:</p>
      <ul>
        <li>
          <strong>System channels</strong> (like <code>__start__</code>) use <strong>upsert</strong>{' '}
          — last write wins, idempotent.
        </li>
        <li>
          <strong>Stream channels</strong> use <strong>create</strong> — if it already exists, we
          get a <code>409 Conflict</code>, which we skip.
        </li>
      </ul>
      <p>
        This gives us exactly the same semantics as SQLite&apos;s <code>INSERT OR REPLACE</code> and{' '}
        <code>INSERT OR IGNORE</code>, but expressed through HTTP status codes instead of SQL
        constraints.
      </p>

      <h3 id="adaptation-7">
        Adaptation 7: <code>?</code> Placeholders → <code>@</code> Parameters + Injection Prevention
      </h3>
      <p>
        SQLite uses <code>?</code> positional placeholders for parameterized queries. Cosmos DB
        uses named <code>@parameters</code>.
      </p>
      <p>
        But the adaptation goes deeper than just syntax. In SQLite, you typically trust the schema
        — the columns are fixed and defined at table creation. In Cosmos DB, metadata filters query
        into <em>arbitrary JSON paths</em>, which opens the door to injection attacks if
        you&apos;re not careful.
      </p>
      <p>I built a multi-layer defense:</p>

      <h4>Layer 1: Key Validation</h4>
      <p>
        Every metadata filter key is validated against a strict regex before it touches any query:
      </p>
      <pre>
        <code>{`_FILTER_PATTERN = re.compile(r"^[a-zA-Z0-9_.-]+$")

def _validate_filter_key(key: str) -> None:
    if not _FILTER_PATTERN.match(key):
        raise ValueError(
            f"Invalid filter key: '{key}'. "
            "Filter keys must contain only alphanumeric characters, "
            "underscores, dots, and hyphens."
        )`}</code>
      </pre>

      <h4>Layer 2: Bracket Notation</h4>
      <p>
        Cosmos DB SQL uses bracket notation for property access — which sidesteps any
        interpretation of special characters in key names:
      </p>
      <pre>
        <code>{`# "source.type" becomes c.metadata["source"]["type"]
path_parts = query_key.split(".")
path = "".join([f'["{p}"]' for p in path_parts])
predicates.append(f"c.metadata{path} = {param_name}")`}</code>
      </pre>

      <h4>Layer 3: Parameterized Values</h4>
      <p>
        All values are passed as <code>@parameters</code>, never interpolated into the query
        string:
      </p>
      <pre>
        <code>{`parameters.append({"name": "@metadata_0", "value": query_value})`}</code>
      </pre>
      <p>
        <strong>The SQLite version</strong> relies on <code>?</code> placeholders (which are also
        safe), but doesn&apos;t need key validation because column names are fixed at schema time.
        In a document database with dynamic schemas, you need to be more defensive.
      </p>

      <h3 id="adaptation-8">Adaptation 8: Connection String → Azure Identity</h3>
      <p>SQLite connections are simple — a file path:</p>
      <pre>
        <code>{`# SQLite
conn = sqlite3.connect("checkpoints.sqlite")
saver = SqliteSaver(conn)`}</code>
      </pre>
      <p>For Cosmos DB, I designed two authentication paths:</p>
      <pre>
        <code>{`# Development: connection key
with CosmosDBSaver.from_conn_info(
    endpoint="https://account.documents.azure.com:443/",
    credential="your-key-here",
    database_name="langgraph",
    container_name="checkpoints"
) as checkpointer:
    ...

# Production: Azure Identity (keyless)
from azure.identity import DefaultAzureCredential

with CosmosDBSaver.from_conn_info(
    endpoint="https://account.documents.azure.com:443/",
    credential=DefaultAzureCredential(),  # No keys in code!
    database_name="langgraph",
    container_name="checkpoints"
) as checkpointer:
    ...`}</code>
      </pre>
      <p>
        If you pass <code>None</code> for <code>credential</code>, the library automatically uses{' '}
        <code>DefaultAzureCredential()</code>:
      </p>
      <pre>
        <code>{`@classmethod
@contextmanager
def from_conn_info(cls, *, endpoint, database_name, container_name, credential=None):
    if not credential:
        credential = DefaultAzureCredential()

    client = CosmosClient(endpoint, credential=credential)
    database = client.get_database_client(database_name)
    container = database.get_container_client(container_name)
    yield cls(container)`}</code>
      </pre>
      <p>
        This means <strong>zero secrets in code</strong> when running on Azure — Managed Identity
        handles everything.
      </p>

      <hr />

      <h2 id="full-picture">The Full Picture: A Side-by-Side Comparison</h2>
      <p>Here&apos;s every adaptation at a glance:</p>
      <div className="not-prose my-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="py-2 pr-4 text-left font-semibold">Area</th>
              <th className="py-2 pr-4 text-left font-semibold">SQLite (SqliteSaver)</th>
              <th className="py-2 text-left font-semibold">Cosmos DB (CosmosDBSaver)</th>
            </tr>
          </thead>
          <tbody className="text-ink-soft">
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">Data Model</td>
              <td className="py-2 pr-4">Two tables with typed columns</td>
              <td className="py-2">JSON documents with structured IDs</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">Get Latest</td>
              <td className="py-2 pr-4">ORDER BY DESC LIMIT 1 (scan)</td>
              <td className="py-2">Tip Document → point-read (O(1))</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">Binary Storage</td>
              <td className="py-2 pr-4">Native BLOB columns</td>
              <td className="py-2">Base64-encoded strings</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">Atomicity</td>
              <td className="py-2 pr-4">SQL transactions + thread lock</td>
              <td className="py-2">Transactional batches (same partition)</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">Data Isolation</td>
              <td className="py-2 pr-4">Separate tables</td>
              <td className="py-2">Dual-partition strategy</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">Concurrency</td>
              <td className="py-2 pr-4">threading.Lock()</td>
              <td className="py-2">Optimistic concurrency + batch fallback</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">Query Params</td>
              <td className="py-2 pr-4">? positional</td>
              <td className="py-2">@named + key validation + bracket notation</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">Authentication</td>
              <td className="py-2 pr-4">File path</td>
              <td className="py-2">Azure Identity / connection key</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">Scaling</td>
              <td className="py-2 pr-4">Single process</td>
              <td className="py-2">Globally distributed, auto-scale</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">Thread Deletion</td>
              <td className="py-2 pr-4">DELETE WHERE thread_id = ?</td>
              <td className="py-2">delete_all_items_by_partition_key()</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-semibold">Async Support</td>
              <td className="py-2 pr-4">Separate aiosqlite package</td>
              <td className="py-2">Built-in AsyncCosmosDBSaver with sync bridges</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr />

      <h2 id="async-support">Full Async Support: Not an Afterthought</h2>
      <p>
        The SQLite saver has a separate async variant (<code>AsyncSqliteSaver</code>) that depends
        on the <code>aiosqlite</code> third-party package. It&apos;s a community library that wraps
        SQLite in an async interface.
      </p>
      <p>
        For Cosmos DB, async is <strong>first-class</strong>. The Azure Cosmos DB SDK provides a
        native async client (<code>azure.cosmos.aio</code>). I built <code>AsyncCosmosDBSaver</code>{' '}
        as a full-featured async implementation — not a wrapper:
      </p>
      <pre>
        <code>{`from langgraph_checkpoint_cosmos.aio import AsyncCosmosDBSaver

async with AsyncCosmosDBSaver.from_conn_info(
    endpoint="https://your-account.documents.azure.com:443/",
    credential="your-key",
    database_name="langgraph",
    container_name="checkpoints"
) as checkpointer:
    graph = builder.compile(checkpointer=checkpointer)

    config = {"configurable": {"thread_id": "user-456"}}
    result = await graph.ainvoke(1, config)`}</code>
      </pre>
      <p>
        But I went a step further. LangGraph&apos;s <code>BaseCheckpointSaver</code> requires{' '}
        <em>both</em> sync and async methods. So <code>AsyncCosmosDBSaver</code> also provides{' '}
        <strong>synchronous bridge methods</strong> that transparently call the async versions:
      </p>
      <pre>
        <code>{`class AsyncCosmosDBSaver(BaseCheckpointSaver[str]):
    def get_tuple(self, config):
        """Sync bridge — calls async aget_tuple under the hood."""
        # Uses asyncio event loop to run the async version
        ...

    async def aget_tuple(self, config):
        """Native async implementation."""
        # Uses azure.cosmos.aio.ContainerProxy
        ...`}</code>
      </pre>
      <p>
        This means you can use <code>AsyncCosmosDBSaver</code> in <em>any</em> context — fully
        async FastAPI handlers, mixed sync/async LangGraph subgraphs, or traditional synchronous
        code.
      </p>

      <hr />

      <h2 id="in-practice">In Practice: Using It with LangGraph</h2>
      <p>
        Let me show you how this looks in a real-world scenario — a conversational AI agent with
        multi-turn memory:
      </p>
      <pre>
        <code>{`from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph_checkpoint_cosmos import CosmosDBSaver

# Define a simple chatbot graph
def chatbot(state: MessagesState):
    # Your LLM logic here
    return {"messages": [ai_response]}

builder = StateGraph(MessagesState)
builder.add_node("chatbot", chatbot)
builder.add_edge(START, "chatbot")
builder.add_edge("chatbot", END)

# Plug in Cosmos DB persistence
with CosmosDBSaver.from_conn_info(
    endpoint="https://my-account.documents.azure.com:443/",
    credential="my-key",
    database_name="langgraph",
    container_name="checkpoints"
) as checkpointer:
    graph = builder.compile(checkpointer=checkpointer)

    # Every invocation with the same thread_id builds on previous state
    config = {"configurable": {"thread_id": "conversation-42"}}

    # Turn 1
    graph.invoke({"messages": [("user", "Hi, I'm Ram")]}, config)

    # Turn 2 — the agent remembers Turn 1
    graph.invoke({"messages": [("user", "What's my name?")]}, config)

    # Turn 3 — even after a server restart, state persists
    state = graph.get_state(config)
    print(state.values)  # Full conversation history`}</code>
      </pre>
      <blockquote>
        <strong>Nothing changes in your graph code.</strong> The only difference is swapping{' '}
        <code>SqliteSaver</code> for <code>CosmosDBSaver</code>. That&apos;s the beauty of the{' '}
        <code>BaseCheckpointSaver</code> abstraction — and exactly why I built strictly against it.
      </blockquote>

      <hr />

      <h2 id="setup">Setting Up Azure Cosmos DB</h2>
      <p>The setup is intentionally minimal:</p>
      <ol>
        <li>
          <strong>Create an Azure Cosmos DB account</strong> — NoSQL API.
        </li>
        <li>
          <strong>Create a database</strong> — e.g., <code>langgraph</code>.
        </li>
        <li>
          <strong>Create a container</strong> — partition key must be <code>/partition_key</code>.
        </li>
        <li>
          <em>(Optional)</em> <strong>Enable &ldquo;Delete All Items By Partition Key&rdquo;</strong> —
          for efficient <code>delete_thread()</code> support.
        </li>
      </ol>
      <p>
        No schema definitions. No index configuration. No migrations. The library handles
        everything at the document level.
      </p>

      <h3 id="env-vars">Environment Variables (for testing)</h3>
      <pre>
        <code>{`export COSMOS_DB_ENDPOINT="https://your-account.documents.azure.com:443/"
export COSMOS_DB_KEY="your-primary-key"
export COSMOS_DB_NAME="langgraph"
export COSMOS_DB_CONTAINER="checkpoints"`}</code>
      </pre>

      <hr />

      <h2 id="key-design">Document Key Design: The Hidden Architecture</h2>
      <p>
        One thing I haven&apos;t fully shown yet is the <strong>key generation system</strong> —
        the underlying naming convention that makes everything work. This is the glue that enables
        point-reads, partition isolation, and predictable IDs.
      </p>
      <pre>
        <code>{`# Composite document IDs — uses '$' as separator
COSMOSDB_KEY_SEPARATOR = "$"

# Checkpoint: checkpoint$thread-1$namespace$abc123
def _make_cosmosdb_checkpoint_key(thread_id, checkpoint_ns, checkpoint_id):
    return "$".join(["checkpoint", thread_id, checkpoint_ns, checkpoint_id])

# Write: writes$thread-1$namespace$abc123$task-1$0
def _make_cosmosdb_checkpoint_writes_key(thread_id, ns, cp_id, task_id, idx):
    return "$".join(["writes", thread_id, ns, cp_id, task_id, str(idx)])

# Tip: tip$thread-1$namespace
def _make_cosmosdb_tip_key(thread_id, checkpoint_ns):
    return "$".join(["tip", thread_id, checkpoint_ns])

# Writes partition: writes$thread-1$namespace
def _make_cosmosdb_writes_partition_key(thread_id, checkpoint_ns):
    return "$".join(["writes", thread_id, checkpoint_ns])`}</code>
      </pre>
      <p>
        Every ID is <strong>deterministic</strong>. Given a <code>thread_id</code>,{' '}
        <code>checkpoint_ns</code>, and <code>checkpoint_id</code>, you can compute the exact
        document ID and read it directly — no query required.
      </p>
      <p>
        The <code>$</code> separator was chosen because it&apos;s:
      </p>
      <ul>
        <li>URL-safe (important for Cosmos DB REST API).</li>
        <li>Unlikely to appear in user-provided IDs.</li>
        <li>Visually clear when debugging.</li>
      </ul>

      <hr />

      <h2 id="thread-deletion">Thread Deletion: Server-Side Bulk Operations</h2>
      <p>
        In SQLite, deleting a thread is a simple <code>DELETE WHERE</code>:
      </p>
      <pre>
        <code>{`DELETE FROM checkpoints WHERE thread_id = ?;
DELETE FROM writes WHERE thread_id = ?;`}</code>
      </pre>
      <p>
        In Cosmos DB, deleting items one-by-one is expensive. Each delete costs RUs, and a busy
        thread could have hundreds of checkpoint and write documents.
      </p>
      <p>
        Instead, I use Cosmos DB&apos;s <strong>&ldquo;Delete All Items By Partition Key&rdquo;</strong>{' '}
        feature — a server-side operation that wipes an entire logical partition in one call:
      </p>
      <pre>
        <code>{`def delete_thread(self, thread_id):
    # Find all partitions for this thread
    query = """
    SELECT DISTINCT c.partition_key FROM c
    WHERE STARTSWITH(c.partition_key, @cp_prefix)
       OR STARTSWITH(c.partition_key, @wr_prefix)
    """
    params = [
        {"name": "@cp_prefix", "value": f"checkpoint\${thread_id}$"},
        {"name": "@wr_prefix", "value": f"writes\${thread_id}$"}
    ]

    # Server-side bulk delete — no item-by-item loop
    for item in self.container.query_items(query=query, parameters=params, ...):
        self.container.delete_all_items_by_partition_key(item["partition_key"])`}</code>
      </pre>
      <p>
        This is <em>orders of magnitude</em> faster and cheaper than item-level deletion,
        especially for threads with long conversation histories.
      </p>

      <hr />

      <h2 id="whats-next">What&apos;s Next</h2>
      <p>
        This is <strong>v0.1.0</strong> — the foundation is solid, battle-tested, and ready for
        use. Here&apos;s where I&apos;m going next:
      </p>
      <div className="not-prose my-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="py-2 pr-4 text-left font-semibold">Feature</th>
              <th className="py-2 pr-4 text-left font-semibold">Description</th>
              <th className="py-2 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="text-ink-soft">
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">📊 TTL Support</td>
              <td className="py-2 pr-4">Auto-expire old checkpoints to manage costs</td>
              <td className="py-2">Planned</td>
            </tr>
            <tr className="border-border/40 border-b">
              <td className="py-2 pr-4 font-semibold">🧠 Semantic Cache</td>
              <td className="py-2 pr-4">
                <code>CosmosDBCache</code> for LLM caching (node-level optimization)
              </td>
              <td className="py-2">Planned</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-semibold">📚 Long-Term Memory</td>
              <td className="py-2 pr-4">
                <code>CosmosDBStore</code> for cross-thread shared state
              </td>
              <td className="py-2">Planned</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr />

      <h2 id="try-it">Try It</h2>
      <pre>
        <code>pip install langgraph-checkpoint-cosmos</code>
      </pre>
      <ul>
        <li>
          📦 <strong>PyPI</strong>:{' '}
          <a href="https://pypi.org/project/langgraph-checkpoint-cosmos/">
            langgraph-checkpoint-cosmos
          </a>
        </li>
        <li>
          🐙 <strong>GitHub</strong>:{' '}
          <a href="https://github.com/LangModule/checkpoint-cosmos">
            LangModule/checkpoint-cosmos
          </a>
        </li>
        <li>
          📄 <strong>License</strong>: MIT
        </li>
      </ul>
      <p>
        The entire codebase is open source, well-documented, and ready for contributions. If
        you&apos;re building AI agents on Azure, this library will save you weeks of infrastructure
        work.
      </p>
      <p>
        Drop a ⭐ on GitHub if it&apos;s useful, or open an issue if you&apos;ve got ideas.
        I&apos;d love to hear what you&apos;re building.
      </p>
      <blockquote>
        <em>
          If you enjoyed this article, consider sharing it with someone building AI agents. The
          more people stress-test this library, the better it gets for everyone.
        </em>{' '}
        🚀
      </blockquote>
    </>
  ),
}
