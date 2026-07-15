export const nav = [
  { label: 'About', href: '#about' },
  { label: 'Work', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'Writing', href: '#writing' },
  { label: 'Skills', href: '#skills' },
  { label: 'Contact', href: '#contact' },
]

export type ProjectBullet = {
  client: string
  text: string
  current?: boolean
  tags?: string[]
}
type Bullet = string | ProjectBullet
export type Job = {
  role: string
  company: string
  period: string
  location: string
  bullets: Bullet[]
}

export const experience: Job[] = [
  {
    role: 'Senior AI Engineer',
    company: 'Feuji INC',
    period: 'Aug 2024 — Present',
    location: 'Dallas, TX',
    bullets: [
      {
        client: 'Focus Financial Partners',
        current: true,
        text: 'AI Data Scientist building production AI/ML for wealth-management workflows.',
      },
      {
        client: 'TriNet · Ask the Prospect (ATP)',
        text: 'TriNet’s sales reps take 2 years to reach proficiency. Expanded scope from a searchable knowledge base into a multi-mode LangGraph agent: RAG Q&A (dual-index on training docs + Gong transcripts), persona-based role-play with AI coaching, sales analytics chat, and gamified Jeopardy generation. Memory continuity via LangGraph PG checkpointer. Sales analytics pipeline enriches each Gong transcript with derived columns (win/loss, objections, competition) and generates OpenSearch queries from natural language. PII protection via Bedrock Guardrails. Langfuse for LLM-as-judge evals, trace-level debugging, and per-call cost tracking. Solution architect across 4 microservices and 2 Airflow pipelines on EKS. Recognized by TriNet CTO, Executive Director, and VP.',
        tags: [
          'Python',
          'FastAPI',
          'LangGraph',
          'AWS Bedrock',
          'Bedrock Guardrails',
          'OpenSearch',
          'Aurora',
          'Langfuse',
          'Airflow',
          'EKS',
        ],
      },
      {
        client: 'PLZ Corp · Customer Analytics',
        text: 'Daily financial intelligence pipeline ingesting 10-K/10-Q filings, dedupes via Azure OpenAI embeddings (cosine ≥ 0.70). Per-company sync state keeps incremental and idempotent. SharePoint-indexed for Copilot Studio Teams Finance Agent (HTML → PDF/text via Microsoft Graph). Terraform IaC provisions the Azure backend with secretless Managed Identity. Daily email blast via Azure Communication Services + Power BI dashboards (revenue, gross profit, EBITDA, operating/net income). Recognized by PLZ Director and CIO.',
        tags: [
          'Python',
          'Microsoft Copilot Studio',
          'Azure OpenAI',
          'Azure PostgreSQL',
          'Communication Services',
          'ACI',
          'ACR',
          'Logic Apps',
          'Key Vault',
          'Terraform',
        ],
      },
      {
        client: 'Cotiviti · AI-Powered IVR Automation',
        text: 'Migrated legacy Jabber-VM Medicare IVR verification to a fully serverless AWS architecture with an autonomous AI agent that discovers the correct IVR path daily — eliminating manual review. LangGraph decision-tree workflow for Medicare flows (RRE, NPI, Contractor) with entitlement checks per transcript. Fine-tuned a Bedrock model on ordered Q/A scripts (100 variations per pair) for next-step selection. Twilio recordings + AWS Transcribe routed per Medicare number, persisting to DynamoDB/PostgreSQL — 200K+ daily calls. Mock IVR simulator for regression + KMS-encrypted PII via CodePipeline. Saved 730+ engineer-hrs/yr and cut 60% infra cost.',
        tags: [
          'Java',
          'Python',
          'LangGraph',
          'AWS Bedrock',
          'AWS Transcribe',
          'DynamoDB',
          'Lambda',
          'SQS',
          'KMS',
          'PostgreSQL',
          'Twilio',
        ],
      },
      {
        client: 'Feuji (Internal) · ReQon',
        text: 'Led internal initiative to free QA engineers from low-level test-case writing. LangGraph agent + Playwright MCP replays a recorded browser flow, navigates every page, and extracts locators/functional elements into S3 + Aurora PostgreSQL. Full QA authoring loop: capture → generate test cases → execute via Playwright MCP → verified pass/fail. Jinja-templated pytest regression scripts with Page Object Model classes for every discovered page. 3 dockerized microservices (Recorder, MCP Service, Execution Service). Saved 100+ team-hrs/week and $230K/yr in QA costs.',
        tags: [
          'Python',
          'LangChain',
          'LangGraph',
          'Google Gemini',
          'Playwright MCP',
          'Aurora PostgreSQL',
          'S3',
          'Docker',
          'pytest',
        ],
      },
    ],
  },
  {
    role: 'AI Research Assistant',
    company: 'University at Buffalo',
    period: 'Jan 2024 — May 2024',
    location: 'Buffalo, NY',
    bullets: [
      {
        client: 'Energy-Efficient LLM Inference & Carbon-Aware Optimization',
        text: 'Benchmarked PEFT techniques — LoRA, knowledge distillation, and post-training 4-/8-bit quantization — on GPT-2, measuring GPU energy consumption and carbon emissions across task configurations. Achieved 19.8% CO₂ reduction with only 6% perplexity increase via 8-bit quantization. Demonstrated 45.2% emissions reduction by combining distillation with quantization, mapping the accuracy–efficiency trade-off curve for carbon-aware deployment.',
        tags: ['Python', 'PyTorch', 'TensorFlow', 'Hugging Face', 'NumPy', 'Pandas'],
      },
    ],
  },
  {
    role: 'Data Scientist',
    company: 'Flable AI',
    period: 'Mar 2023 — Dec 2023',
    location: 'Remote',
    bullets: [
      {
        client: 'Flable Data Insights & Forecasting',
        text: 'Client analytics pipelines on Azure Databricks/Spark transforming clickstream and funnel events into model-ready PostgreSQL datasets. Engineered predictive features for click-rate, success-rate, and funnel progression; validated segments with ANOVA. XGBoost forecasting models to estimate user-progression probabilities and identify key drivers. Operationalized daily scoring via Jenkins-scheduled Python batch jobs. MLflow tracked all runs and metrics.',
        tags: [
          'Python',
          'Azure',
          'Databricks',
          'Spark',
          'MLflow',
          'statsmodels',
          'XGBoost',
          'PostgreSQL',
          'Jenkins',
        ],
      },
      {
        client: 'Flable Digital Assistant',
        text: 'LangChain conversational AI on Telegram that classifies user intent via transformer embeddings, maps queries to PostgreSQL data categories, and returns natural-language responses grounded in real query results. On-the-fly visualization engine renders charts inline. Dockerized FastAPI backend + Telegram bot with GitLab CI/CD and Jenkins pipelines. Cut client weekly analysis time 60%.',
        tags: [
          'Python',
          'LangChain',
          'OpenAI',
          'PostgreSQL',
          'FastAPI',
          'Docker',
          'Jenkins',
          'GitLab',
        ],
      },
    ],
  },
]

export const projects = [
  {
    name: 'ingestlib',
    blurb:
      'Self-hosted document intelligence for RAG — PDF/DOCX/PPTX to searchable, cited, retrieval-ready chunks. Layout-aware parsing with charts→data tables and bbox provenance, natural chunking, hybrid (dense+sparse) retrieval with reranking on six vector stores: Pinecone, Qdrant, SQLite, pgvector, MongoDB, Milvus. ~$0.002/page.',
    tags: ['RAG', 'PaddleOCR-VL', 'AWS Bedrock', 'Python'],
    href: 'https://github.com/LangModule/ingestlib',
    pinned: true,
    type: 'OPEN SOURCE',
    cover: '/ingestlib.jpg',
  },
  {
    name: 'checkpoint-cosmos',
    blurb:
      'Drop-in LangGraph checkpoint saver for Azure Cosmos DB. Tip Document pattern + transactional batches deliver 1-RU latest-checkpoint reads. Sync + async APIs, keyless Azure Identity auth.',
    tags: ['LangGraph', 'Cosmos DB', 'Python'],
    href: 'https://github.com/LangModule/checkpoint-cosmos',
    pinned: true,
    type: 'OPEN SOURCE',
    cover: '/cosmos-checkpointer.jpg',
  },
  {
    name: 'langgraph-postgres-memory',
    blurb:
      'Drop-in PostgreSQL memory for LangGraph agents. Short-term per-thread checkpoints + long-term cross-thread knowledge with semantic search. Connection pooling and retries handled.',
    tags: ['LangGraph', 'PostgreSQL', 'Python'],
    href: 'https://github.com/LangModule/langgraph-postgres-memory',
    pinned: true,
    type: 'OPEN SOURCE',
    cover: '/postgres-memory.jpg',
  },
]

export type WritingEntry = {
  date: string
  title: string
  summary: string
  tags: string[]
  /** Internal slug → renders on `/writing/:slug`. Use `href` instead for external/coming-soon. */
  slug?: string
  href?: string
}

export const writing: WritingEntry[] = [
  {
    date: '2026-07-13',
    title: 'Building ingestlib',
    summary:
      'LlamaParse charges per page and keeps your documents on their servers. I spent a sprint building the self-hosted alternative — and the hard parts were nothing like what I expected: a tiny vision model that lies about charts, a rate limiter that silently degraded quality, and an eval harness that ended up auditing my own prompts.',
    tags: ['RAG', 'Document Intelligence', 'Evals'],
    slug: 'building-ingestlib',
  },
  {
    date: '2026-05-16',
    title: 'From SQLite to Cosmos DB',
    summary:
      "LangGraph's default SQLite checkpointer works for dev — but breaks in production. Here's the eight adaptations I made to swap it for a globally distributed Cosmos DB backend, keeping the LangGraph interface intact.",
    tags: ['LangGraph', 'Cosmos DB', 'Production'],
    slug: 'from-sqlite-to-cosmos-db',
  },
]

export const skillGroups = [
  {
    label: 'AI/ML & LLMs',
    items: [
      'LangChain',
      'LangGraph',
      'MCP',
      'RAG (hybrid k-NN + BM25)',
      'Prompt Engineering',
      'Fine-Tuning',
      'Multi-Agent Systems',
      'ReAct',
      'Tool Calling',
      'Structured Outputs',
      'Guardrails',
      'Langfuse',
      'Semantic Search',
      'Conversational AI',
    ],
  },
  {
    label: 'LLM Platforms',
    items: [
      'Azure OpenAI (GPT-4, Embeddings)',
      'AWS Bedrock (Claude, Nova, Titan Embeddings)',
      'Google Gemini',
    ],
  },
  {
    label: 'Deep Learning',
    items: [
      'PyTorch',
      'TensorFlow',
      'HuggingFace Transformers',
      'LoRA',
      'PEFT',
      'QLoRA',
      'Quantization',
      'Distillation',
    ],
  },
  {
    label: 'Programming',
    items: [
      'Python',
      'SQL',
      'pandas',
      'statsmodels',
      'scikit-learn',
      'Java',
      'FastAPI',
      'Uvicorn',
      'Pydantic',
      'Jinja',
      'Playwright',
      'pytest',
    ],
  },
  {
    label: 'Data & APIs',
    items: [
      'PostgreSQL',
      'Cosmos DB',
      'Pinecone',
      'Qdrant',
      'pgvector',
      'Milvus',
      'MongoDB Atlas',
      'OpenSearch',
      'SQLAlchemy',
      'RESTful APIs',
      'OpenAPI/Swagger',
      'OAuth 2.0',
      'JWT',
      'MSAL',
      'JWKS',
      'SSE',
      'WebSockets',
    ],
  },
  {
    label: 'AWS',
    items: [
      'Bedrock',
      'Bedrock Guardrails',
      'OpenSearch',
      'EKS',
      'ECR',
      'Lambda',
      'SQS',
      'S3',
      'Transcribe',
      'DynamoDB',
      'CodePipeline',
      'KMS',
      'IAM (IRSA)',
    ],
  },
  {
    label: 'Azure',
    items: [
      'OpenAI Service',
      'Cosmos DB',
      'ACR',
      'Azure Container Instance',
      'Azure Communication Services',
      'Key Vault',
      'SharePoint',
      'Microsoft Graph',
      'Managed Identity',
      'Logic Apps',
    ],
  },
  {
    label: 'DevOps & Tools',
    items: [
      'Docker',
      'Kubernetes',
      'Helm',
      'Terraform',
      'Airflow',
      'Databricks',
      'Spark',
      'MLflow',
      'Git',
      'GitHub Actions',
      'Jenkins',
      'GitLab CI/CD',
      'GitHub Copilot',
      'Cursor',
      'Claude Code',
    ],
  },
]

export const clientLogos: { name: string; src: string; href?: string }[] = [
  { name: 'Cotiviti', src: '/logos/cotiviti.png', href: '#projects' },
  { name: 'PLZ Corp', src: '/logos/plz-corp.png', href: '#projects' },
  { name: 'TriNet', src: '/logos/trinet.png', href: '#projects' },
  {
    name: 'Focus Financial Partners',
    src: '/logos/focus-partners.png',
    href: '#experience',
  },
]

export const recognition = [
  {
    client: 'TriNet · Ask the Prospect',
    text: 'Recognized by TriNet’s CTO, Executive Director, and VP for delivering measurable impact beyond original scope.',
    source: 'TriNet leadership',
  },
  {
    client: 'PLZ Corp · Customer Analytics',
    text: 'Recognized by PLZ Corp’s Director and CIO for exceeding expectations with faster, verified decision support.',
    source: 'PLZ Corp leadership',
  },
]

export const heroStats = [
  { value: '4', label: 'enterprise clients shipped' },
  { value: '3+', label: 'yrs production AI/ML' },
  { value: '4', label: 'open-source packages on PyPI' },
]

/**
 * Status drives BOTH the availability card status line AND the identity card pills.
 * Flip this single value to toggle the whole hero between "open to work" and "heads down" modes.
 */
export type Status = 'heads-down' | 'active'
export const status: Status = 'heads-down'

export const statusByMode: Record<Status, { emoji: string; label: string; detail: string }> = {
  'heads-down': { emoji: '🟡', label: 'Heads down', detail: '· building' },
  active: { emoji: '🟢', label: 'Active', detail: '· open to roles' },
}

export const upForByMode: Record<Status, { eyebrow: string; pills: string[] }> = {
  'heads-down': {
    eyebrow: 'always up for',
    pills: ['Coffee', 'Mentoring', 'Speaking', 'Pair programming', 'Open source'],
  },
  active: {
    eyebrow: 'open to',
    pills: ['Full-time', 'Freelance', 'Consulting', 'Advisory'],
  },
}

export const heroPillars: {
  num: string
  verb: string
  area: string
  body: string
  punchline: string
}[] = [
  {
    num: '01',
    verb: 'SEE',
    area: 'Discovery & planning',
    body: 'Understand the situation, the need, and the data — then ship a discovery plan.',
    punchline: 'Build the right thing first.',
  },
  {
    num: '02',
    verb: 'SHAPE',
    area: 'Custom AI builds',
    body: 'RAG, custom workflows, persona agents with gamification, memory, fine-tuned SLMs.',
    punchline: 'Purpose-built for the use case.',
  },
  {
    num: '03',
    verb: 'SHIP',
    area: 'DevOps + delivery',
    body: 'Architecture, CI/CD, infra-as-code, secure deploys, observability.',
    punchline: 'From design to production.',
  },
]

export const availability = {
  timezone: 'Central Time',
  gmtOffset: '· GMT-5',
  employer: 'Feuji',
  calUrl: 'https://cal.com/ramacharan-reddy-kasireddy',
}

export const buildingNow = {
  client: 'Focus Partners',
  role: 'AI Data Scientist',
  blurb: 'Production AI/ML for wealth-management workflows.',
  href: '#projects',
}

export type SocialKind = 'github' | 'linkedin' | 'email'
type IdentityFact = { label: string; value: string }
type IdentitySocial = { href: string; label: string; kind: SocialKind }

export const identity: {
  name: string
  role: string
  photo: string
  facts: IdentityFact[]
  socials: IdentitySocial[]
} = {
  name: 'Ramacharan Reddy K.',
  role: 'Senior AI Engineer · 3+ yrs',
  photo: '/me.jpg',
  facts: [
    { label: 'Based', value: 'Dallas, TX' },
    { label: 'Edu', value: 'MS CS · UB' },
    { label: 'OSS', value: '@ LangModule' },
  ],
  socials: [
    { href: 'https://github.com/ramacharanreddy-k', label: 'GitHub', kind: 'github' },
    {
      href: 'https://www.linkedin.com/in/ramacharanreddy-k',
      label: 'LinkedIn',
      kind: 'linkedin',
    },
    { href: 'mailto:ramacharanreddykasireddy@gmail.com', label: 'Email', kind: 'email' },
  ],
}

type PitchCta = { label: string; href: string; variant: 'primary' | 'outline' | 'ghost' }
export const pitch: {
  headline: { before: string; highlight: string; after: string }
  caption: string
  ctas: PitchCta[]
} = {
  headline: {
    before: 'I ship AI that survives ',
    highlight: 'Monday morning.',
    after: ' Not just demo day.',
  },
  caption:
    'Multi-agent systems, RAG pipelines, and the unglamorous evals that keep production models honest.',
  ctas: [
    { label: 'See my work →', href: '#projects', variant: 'primary' },
    { label: 'Chat with me', href: '#chat', variant: 'outline' },
  ],
}
