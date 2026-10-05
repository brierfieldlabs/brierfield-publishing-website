# Brierfield Publishing Website Rule Book

This file contains mandatory operating rules for the Brierfield Publishing public website.

## 1. Production release gate

This is a hard rule.

**Every website change MUST go to the `staging` branch first. Production MUST NOT be changed until Darren explicitly authorises promotion to live.**

The normal sequence is:

1. Make the requested change on `staging`.
2. Run the normal build, validation and staging deployment.
3. Stop.
4. Tell Darren the staging version is ready for review.
5. Wait for an explicit instruction to promote it.
6. Only then apply or merge the tested change to `main`.

### What counts as approval

Clear instructions such as these authorise promotion:

- "Make it live."
- "Promote it."
- "Publish it."
- "Push that to live."
- An equally unambiguous instruction that explicitly refers to production/live deployment.

### What does NOT count as approval

The following do **not** authorise a production change:

- "Add this."
- "Change this."
- "Fix this."
- "Update the website."
- "Put this on the website."
- Approval of the content or appearance without an explicit live/publish instruction.
- A successful staging build, CI run or Pages deployment.
- The fact that a change appears safe, small, obvious or urgent.
- An assumption that Darren probably wants it live.

If an instruction is ambiguous, **leave the change on staging and ask or wait for explicit promotion approval**.

## 2. No direct production editing

Normal development work MUST NOT be performed directly on `main`.

`main` is the production source. It is a release target, not a working branch.

A tool, assistant, automation or contributor MUST NOT copy a staging change to `main` simply because staging validation passed. Passing validation means the change is technically ready for review. It does not grant release approval.

## 3. Staging is the review boundary

The protected staging site at `/staging/` is the place for Darren to review website changes before release.

The workflow must preserve the distinction between:

- **staging:** proposed/tested website state;
- **main:** explicitly approved live website state.

No process should blur those states or silently promote between them.

## 4. Scope

These rules apply to all Brierfield Publishing website changes, including:

- text and catalogue changes;
- author and title additions;
- artwork and image changes;
- navigation and layout changes;
- SEO and metadata changes;
- CSS and JavaScript changes;
- fixes, maintenance and housekeeping;
- changes made by people, AI assistants, scripts or automation.

## 5. Exceptions

There is no implied emergency exception.

A direct or immediate production change requires Darren's explicit instruction to do so. If that instruction is not present, use staging first.

## 6. Conflict rule

If another instruction, habit or workflow appears to conflict with this release gate, this rule wins unless Darren explicitly overrides it for that specific change.

**Safe default: staging first, then stop.**
