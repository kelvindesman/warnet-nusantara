## Apa yang berubah / What changed

<!-- One or two sentences. Link the issue: "Closes #123". -->

Closes #

## Gate output

<!-- Required. Paste the tail of `npm run gate` run on the final commit of this PR,
     including the e2e results for both the root (/) and subpath (/warnet/) layouts and the coverage summary. -->

```
paste npm run gate output here
```

## Screenshots

<!-- Required for anything visual: before/after, desktop and phone width. -->

## Checklist

- [ ] `npm run gate` passes on the final commit, output pasted above (e2e on `/` and `/warnet/`, 100% coverage).
- [ ] Screenshots attached for visual changes (or "no visual change").
- [ ] Every new or changed test has a `// source:` comment citing a README feature, issue number or maintainer request.
- [ ] New app specs are tagged `@app:<id>` and the app is in the tests matrix (if applicable).
- [ ] Content source cited for any new site, game or text (Wayback snapshot link, license page, Internet Archive item, legality tier A/B/C, embed vs tab header check).
- [ ] All rendered strings are escaped; no untrusted `innerHTML`; relative paths only; no new runtime dependencies.
- [ ] No credentials, personal contact info, account handles, local paths or ops notes in tracked files.
- [ ] I have signed the [CLA](../CLA.md) (the CLA Assistant bot will ask on your first PR).

## AI-assisted?

- [ ] No
- [ ] Yes. Tool(s) and model: <!-- e.g. Claude Code, Codex, Copilot, Cursor, opencode --> ___
  What it did: <!-- e.g. wrote the first draft of the module and tests; I reviewed and edited every line --> ___
