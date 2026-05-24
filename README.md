# JIT Heal

JIT Heal is a small Express/TypeScript demo for experimenting with runtime self-healing.

> [!WARNING]
> This repository is a proof of concept and thought experiment. It contains intentional bugs to demonstrate the idea; it is not a recommendation for production error handling or automated code repair.

When a wrapped function throws, the app:

1. fingerprints the failure class,
2. sends an alarm event,
3. asks an LLM for a small healing script,
4. verifies the script in a sandbox,
5. caches the verified script for the same failure fingerprint,
6. opens a GitHub issue with the generated healing script.

The generated script is not applied to the source code. It is executed only as a verified runtime fallback for the failing call.

## Intended Workflow

JIT Heal is meant to keep the system responsive while a real source-code fix is prepared. The goal is to have an immediate, potentially suboptimal fix instead of a crash or complete system failure, and to keep that fix alive only long enough to bridge the permanent triage and merge process.

The healing script is a temporary runtime fallback, not a permanent replacement for a code change. A successful heal should buy time, reduce user impact, and create enough context for a maintainer to make a proper fix quickly.

The intended flow is:

1. A production request hits a runtime error.
2. JIT Heal generates and verifies a temporary healing script for that failure class.
3. The app uses the healing script for the current request and caches it for repeated occurrences.
4. The alarm notifies maintainers or developers that runtime healing was needed.
5. The GitHub issue records the failure fingerprint, affected function, and proposed healing script.
6. A maintainer reviews the proposed behavior, turns it into a real source-code fix, and merges it.
7. After deployment, the runtime heal should no longer be needed for that failure class.

The goal is to shorten the time from failure to merged fix. The LLM-generated heal should not become a quasi-permanent patch layer.

## Setup

```bash
npm install
cp .env.dist .env
```

Configure at least:

```env
OPENAI_API_KEY=
GITHUB_TOKEN=
GITHUB_REPOSITORY=owner/repo
```

Start the app:

```bash
npm run dev
```

Optional alarm receiver:

```bash
npm run alarm:mock
```

## Environment

`OPENAI_API_KEY` is required for requesting healing scripts.

`OPENAI_MODEL` defaults to `gpt-5.4-mini`.

`GITHUB_TOKEN` needs issue read/write access if GitHub issue creation should work.

`GITHUB_REPOSITORY` should be set as `owner/repo`. Alternatively, use `GITHUB_OWNER` and `GITHUB_REPO`.

## Architecture

The generic runtime wrapper lives in `src/jit/withJitHeal.ts`.

Callers provide:

- the function that may fail,
- context for the LLM,
- a verifier that proves whether the generated healing script is safe enough for that use case.

The verifier uses `src/jit/verifyHealingScript.ts`, which runs `heal(...args)` inside a Node `vm` context with a short timeout. The caller still owns the return contract, for example "must be one of these languages" or "must be an integer between 1 and 100".

This keeps the core JIT Heal flow generic while forcing each demo case to define its own safety boundary.

## Healing Cache

Verified healing scripts are cached in memory by failure fingerprint.

The cache lives in `src/jit/withJitHeal.ts` and maps:

```text
failure fingerprint -> verified healing script
```

This means the first occurrence of a new failure class calls the LLM, verifies the returned script, stores it, and opens a GitHub issue. The next occurrence of the same failure class reuses the cached script immediately and skips the LLM call.

The fingerprint intentionally normalizes quoted values in error messages. For example, `invalid lang tag: "deutsch"` and `invalid lang tag: "foobar"` are treated as the same failure class, so one verified healing script can cover both.

The cache is process-local and disappears when the server restarts. It is useful for demonstrating the runtime flow, but it is not a persistent healing registry.

## Demo 1: Language Parsing

Route:

```bash
curl -H 'Accept-Language: deutsch' http://localhost:3000/entry
```

Source function: `src/language/selectLanguage.ts`

The intentionally fragile parser throws on invalid language tags or invalid `q` values. JIT Heal asks for a script with this contract:

```text
function heal(headerValue, config)
```

The verified result must be one of `config.available`.

More trigger examples:

```bash
curl -H 'Accept-Language: en;q=nope,de;q=0.8' http://localhost:3000/entry
curl -H 'Accept-Language: *,de;q=0.9' http://localhost:3000/entry
```

## Demo 2: Page Limit Parsing

Route:

```bash
curl 'http://localhost:3000/items?limit=abc'
```

Source function: `src/demo/parsePageLimit.ts`

The parser expects an integer between `1` and `100`. Invalid input or out-of-range values throw. JIT Heal asks for:

```text
function heal(rawLimit, defaults)
```

The verified result must be an integer between `1` and `100`.

More trigger examples:

```bash
curl 'http://localhost:3000/items?limit=999'
curl 'http://localhost:3000/items?limit=nope'
```

## Demo 3: Preview Flag Parsing

Route:

```bash
curl 'http://localhost:3000/preview?enabled=maybe'
```

Source function: `src/demo/parsePreviewFlag.ts`

The parser accepts only `true` and `false`. Any other value throws. JIT Heal asks for:

```text
function heal(rawFlag, defaults)
```

The verified result must be a boolean.

More trigger examples:

```bash
curl 'http://localhost:3000/preview?enabled=1'
curl 'http://localhost:3000/preview?enabled=yes'
```

## GitHub Issues

After a healing script is verified for a new failure fingerprint, the app opens an issue titled:

```text
[jit-heal:<fingerprint>] <functionName>
```

If an issue with the same fingerprint already exists, no duplicate issue is opened.

## Useful Commands

```bash
npm run dev
npm run alarm:mock
npm run typecheck
npm run build
```
