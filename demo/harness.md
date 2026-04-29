# Demo Harness — Duck `generate-user-docs --local`

You are driving a live demo of the **duck** skills platform.
Duck turns a structured feature spec into polished user-facing MDX documentation using Claude Code.

Everything you need is already in this repo:

| What | Where |
|------|-------|
| The skill | `skills/generate-user-docs.md` |
| App config | `agent.yaml` |
| Demo spec | `specs/demo/` (an Activity Feed feature) |

`--local` mode writes output to `userdocs/` inside this repo instead of pushing to a remote docs site.

## Step 1 — Run the skill

Invoke:

```
/generate-user-docs demo --local
```

Work through the skill steps. At the **approval gate**, show the draft to the audience and
invite feedback before typing `yes`.

## Step 2 — Preview with Mintlify

Once the skill writes `userdocs/demo.mdx`, create `userdocs/mint.json`:

```json
{
  "name": "Demo Docs",
  "navigation": [
    {
      "group": "Features",
      "pages": ["demo"]
    }
  ]
}
```

Then start the preview server from the `userdocs/` directory:

```bash
cd userdocs && mintlify dev
```

Open http://localhost:3000 — the rendered page is live.
