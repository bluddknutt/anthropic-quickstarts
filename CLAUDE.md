# Anthropic Quickstarts Development Guide

This repository contains multiple independent quickstart projects demonstrating Claude AI capabilities. Each project lives in its own subdirectory with its own dependencies and tooling.

## Repository Structure

```
anthropic-quickstarts/
├── agents/                    # Minimal agent framework reference implementation
├── computer-use-demo/         # Claude computer-use API demo (Python/Docker)
├── customer-support-agent/    # Customer support chatbot (Next.js/TypeScript)
├── financial-data-analyst/    # Financial data analysis app (Next.js/TypeScript)
├── pyproject.toml             # Root-level pyright config (points to computer-use-demo venv)
└── CLAUDE.md
```

---

## agents/

A minimal, educational reference implementation of LLM agents using the Anthropic API. **Not an SDK** — deliberately <300 lines of core logic to demonstrate foundational patterns.

### Architecture

- `agent.py` — Core `Agent` class: manages Anthropic API interactions, tool execution loop, MCP server connections
- `tools/` — Tool implementations
  - `base.py` — `Tool` dataclass base class with `to_dict()` and async `execute()` interface
  - `think.py` — Internal reasoning tool
  - `web_search.py` — Web search tool
  - `file_tools.py` — File read/write tools
  - `code_execution.py` — Code execution tool
  - `calculator_mcp.py` — Calculator via MCP
  - `mcp_tool.py` — Generic MCP tool wrapper
- `utils/` — Utilities
  - `connections.py` — MCP server connection setup
  - `history_util.py` — `MessageHistory` class with context window management
  - `tool_util.py` — Tool execution helpers
- `agent_demo.ipynb` — Jupyter notebook demo
- `test_message_params.py` — Test suite for `message_params` functionality

### Key Classes

- `ModelConfig` — Dataclass for model parameters (default: `claude-sonnet-4-20250514`, max_tokens=4096, temperature=1.0)
- `Agent` — Main class; supports local tools and MCP server tools
  - `run(user_input)` — Synchronous entry point
  - `run_async(user_input)` — Async entry point with MCP support
  - `message_params` — Dict of additional params passed to `client.messages.create()`

### Setup & Usage

```python
from agents.agent import Agent
from agents.tools.think import ThinkTool

agent = Agent(
    name="MyAgent",
    system="You are a helpful assistant.",
    tools=[ThinkTool()],
    mcp_servers=[{"type": "stdio", "command": "python", "args": ["-m", "mcp_server"]}],
)
response = agent.run("Your question here")
```

### Requirements

- Python 3.8+
- `ANTHROPIC_API_KEY` environment variable
- `anthropic` and `mcp` Python libraries

---

## computer-use-demo/

A Docker-based demo for Claude's computer-use API, using Streamlit as the UI. Supports Anthropic API, AWS Bedrock, and Google Vertex AI providers.

### Architecture

- `computer_use_demo/loop.py` — Core agentic sampling loop; handles API calls, tool dispatch, prompt caching, multi-provider support
- `computer_use_demo/streamlit.py` — Streamlit UI
- `computer_use_demo/tools/` — Computer-use tool implementations
  - `base.py` — `BaseAnthropicTool` (ABC), `ToolResult`, `CLIResult`, `ToolFailure`, `ToolError`
  - `bash.py` — `BashTool20241022`, `BashTool20250124`
  - `computer.py` — `ComputerTool20241022`, `ComputerTool20250124`
  - `edit.py` — `EditTool20241022`, `EditTool20250124`, `EditTool20250429`
  - `groups.py` — `ToolGroup`, `TOOL_GROUPS`, `TOOL_GROUPS_BY_VERSION` — maps API versions to tool sets
  - `collection.py` — `ToolCollection` for managing tool sets
  - `run.py` — Tool runner utilities

### Tool Versions

Three versioned tool groups are supported:
- `computer_use_20241022` → beta flag `computer-use-2024-10-22`
- `computer_use_20250124` → beta flag `computer-use-2025-01-24`
- `computer_use_20250429` → beta flag `computer-use-2025-01-24`

### Setup & Development

```bash
cd computer-use-demo
./setup.sh                    # Set up Python venv
docker build . -t computer-use-demo:local
docker run -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -v $(pwd)/computer_use_demo:/home/computeruse/computer_use_demo/ \
  -v $HOME/.anthropic:/home/computeruse/.anthropic \
  -p 5900:5900 -p 8501:8501 -p 6080:6080 -p 8080:8080 \
  -it computer-use-demo:local
```

### Testing & Code Quality

```bash
cd computer-use-demo
ruff check .          # Lint
ruff format .         # Format
pyright               # Type check (uses .venv in computer-use-demo/)
pytest                # Run all tests
pytest tests/path_to_test.py::test_name -v   # Single test
```

### Requirements

- `computer_use_demo/requirements.txt`: `streamlit==1.41.0`, `anthropic[bedrock,vertex]>=0.39.0`, `jsonschema`, `boto3`, `google-auth`
- `dev-requirements.txt`: above + `ruff==0.6.7`, `pre-commit==3.8.0`, `pytest==8.3.3`, `pytest-asyncio==0.23.6`

### Code Style

- **Python**: `snake_case` for functions/variables, `PascalCase` for classes
- **Imports**: isort with `combine-as-imports = true`
- **Error handling**: Raise `ToolError` for tool-level errors
- **Types**: Full type annotations on all parameters and return values
- **Classes**: Use `dataclasses` and abstract base classes (`ABCMeta`)
- **Linting rules**: A, ASYNC, B, E, F, I, PIE, RUF200, T20, UP, W (ignore E501, ASYNC230)

---

## customer-support-agent/

A Next.js customer support chat application powered by Claude with Amazon Bedrock Knowledge Bases for RAG (retrieval-augmented generation).

### Architecture

- `app/api/chat/route.ts` — Main API route; calls Anthropic API with structured output (Zod schema validation), integrates Bedrock knowledge retrieval
- `app/lib/` — Utilities and RAG helpers
- `components/` — React UI components (shadcn/ui based)
- `config.ts` — UI config: reads `NEXT_PUBLIC_INCLUDE_LEFT_SIDEBAR` / `NEXT_PUBLIC_INCLUDE_RIGHT_SIDEBAR` env vars

### Key Features

- Claude integration with extended thinking
- Amazon Bedrock Knowledge Base RAG
- Structured AI responses: `response`, `thinking`, `user_mood`, `suggested_questions`, `debug`, `matched_categories`, `redirect_to_agent`
- User mood detection (positive/neutral/negative/curious/frustrated/confused)
- Configurable sidebar layout via environment variables

### Setup & Development

```bash
cd customer-support-agent
npm install
cp .env.example .env.local   # Add ANTHROPIC_API_KEY, BAWS_ACCESS_KEY_ID, BAWS_SECRET_ACCESS_KEY
npm run dev                  # Full UI (both sidebars)
```

### UI Variants

```bash
npm run dev:full    # Both sidebars
npm run dev:left    # Left sidebar only
npm run dev:right   # Right sidebar only
npm run dev:chat    # Chat only
```

### Build Variants

```bash
npm run build          # Full build
npm run build:left     # Left sidebar only
npm run build:right    # Right sidebar only
npm run build:chat     # Chat only
```

### Environment Variables

```
ANTHROPIC_API_KEY=your_key
BAWS_ACCESS_KEY_ID=your_aws_key          # Note: 'B' prefix for AWS vars
BAWS_SECRET_ACCESS_KEY=your_aws_secret
```

### Code Style

- **TypeScript**: Strict mode with proper interfaces
- **Components**: Function components with React hooks
- **Formatting**: Follow ESLint Next.js configuration (`eslint-config-next`)
- **UI components**: shadcn/ui component library (Radix UI primitives + Tailwind)
- **Validation**: Zod schemas for API response validation
- **Node**: Requires >= 18.17.0

### Key Dependencies

- `@anthropic-ai/sdk ^0.27.1`, `ai ^3.2.38`, `@ai-sdk/anthropic ^0.0.34`
- `@aws-sdk/client-bedrock-agent-runtime ^3.621.0`
- `next 14.2.5`, `react ^18`
- `react-markdown`, `rehype-highlight`, `rehype-raw` for markdown rendering
- shadcn/ui: `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`

---

## financial-data-analyst/

A Next.js application for financial data analysis via chat, with interactive chart generation powered by Claude.

### Architecture

- `app/api/finance/route.ts` — Edge runtime API route; handles file uploads, calls Claude with `generate_graph_data` tool for structured chart output
- `app/finance/` — Finance analysis page
- `components/` — Chart and UI components
- `hooks/` — Custom React hooks
- `lib/` — Utilities
- `types/` — TypeScript type definitions (including `ChartData`)
- `utils/` — Helper utilities

### Key Features

- Multi-format file upload: text, CSV, PDF, images
- Claude tool use (`generate_graph_data`) for structured chart JSON
- Chart types: `bar`, `multiBar`, `line`, `area`, `stackedArea`, `pie`
- Edge runtime API (`export const runtime = "edge"`)
- Dark/light theme support

### Setup & Development

```bash
cd financial-data-analyst
npm install
echo "ANTHROPIC_API_KEY=your_key" > .env.local
npm run dev
```

### Testing & Code Quality

```bash
npm run lint    # ESLint
npm run build   # Production build
```

### Code Style

- **TypeScript**: Strict mode with proper type definitions
- **Components**: Function components with type annotations
- **Visualization**: Recharts library for all data visualization
- **State management**: React hooks
- **API**: Edge runtime with streaming support

### Key Dependencies

- `@anthropic-ai/sdk ^0.29.0`
- `next 14.2.15`, `react ^18`
- `recharts ^2.13.0` — charts
- `pdfjs-dist ^4.7.76` — PDF parsing
- shadcn/ui: `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`

---

## Cross-Project Conventions

### API Key

All projects require `ANTHROPIC_API_KEY` as an environment variable.

### Claude Models

- Default model in `agents/`: `claude-sonnet-4-20250514`
- Latest capable models: Claude Opus 4.6 (`claude-opus-4-6`), Sonnet 4.6 (`claude-sonnet-4-6`), Haiku 4.5 (`claude-haiku-4-5-20251001`)
- When building new AI features, default to the latest Claude model

### Project Independence

Each subdirectory is a fully independent project. When working in one project:
- `cd` into that project's directory before running commands
- Each has its own `node_modules` / Python venv
- Do not mix dependencies across projects

### Git Workflow

- Feature branches follow the pattern: `claude/<description>-<sessionId>`
- Commit messages should be descriptive and reference what changed
