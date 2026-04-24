# schema-sync skill

Check that the codebase stays in sync with its docs. Run this at the end of any session that touches schema, files, or data model.

## What to check

### 1. Drizzle schema vs data model docs
Read `lib/db/schema.ts`. For every table defined there, verify it matches the corresponding doc in `docs/data-model/`. Check:
- Table name matches (snake_case in schema = camelCase table name in docs)
- All columns documented in the doc exist in the schema
- No columns exist in the schema that are absent from the docs without explanation

If `lib/db/schema.ts` is still a stub (empty), note it and skip.

### 2. file-map.md vs actual files
Read `docs/file-map.md`. For every file path listed in the table:
- Check if the file exists
- If it doesn't exist yet, that's fine (it's a planned file) — note it as `todo`
- If a file exists in `lib/` or `app/api/` that is NOT in file-map.md, flag it as missing from the map

### 3. progress.md accuracy
Read `docs/progress.md`. For each item marked `done`:
- Verify the file(s) actually exist
- Flag any `done` items where the referenced files are missing

### 4. docs/data-model/ coverage
Check that every entity in `docs/data-model/overview.md` has coverage in at least one of the sibling docs (publishers, readers, ads, payments, analytics).

## Output format

Report in four sections:

**Schema ↔ Docs**: list any mismatches or confirm "in sync" (or "schema is a stub — nothing to check yet")

**file-map.md**: list any files that exist but aren't mapped, confirm count of planned-but-not-yet-created entries

**progress.md**: list any `done` items with missing files

**Data model coverage**: confirm all entities documented or list gaps

Keep the report concise — one line per issue. End with a summary: "X issues found" or "Everything in sync."
