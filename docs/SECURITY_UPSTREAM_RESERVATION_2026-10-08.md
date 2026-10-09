# OrchidPay — Security Upstream Reservation — 2026-10-08

**Status:** BOUNDED UPSTREAM RESERVATION / NO SILENT WAIVER
**Scope:** Expo SDK 55 / React Native build and tooling dependency graph
**Application business logic:** no new direct advisory identified by this record

## 1. Why this record exists

The historical OrchidPay project-state record dated 2026-09-13 correctly documented a zero-audit dependency state at that earlier checkpoint.

As of 2026-10-08, `npm audit --omit=dev` on the supported B12 SDK 55 graph reports:

- critical: **1**
- high: **23**
- moderate: **0**
- low: **0**
- total advisory package entries: **24**

This is not hidden, downgraded or represented as zero.

## 2. Current known advisory package set

The B12 gate currently permits exactly this known upstream set:

- `@expo/cli`
- `@expo/code-signing-certificates`
- `@expo/metro`
- `@expo/metro-config`
- `@jest/environment`
- `@jest/fake-timers`
- `@jest/transform`
- `@react-native/community-cli-plugin`
- `babel-jest`
- `brace-expansion`
- `braces`
- `expo`
- `jest-environment-node`
- `jest-haste-map`
- `jest-message-util`
- `metro`
- `metro-config`
- `metro-file-map`
- `metro-transform-worker`
- `micromatch`
- `node-forge`
- `react-native`
- `shell-quote`
- `source-map-js`

Any drift outside that list is a gate failure.

## 3. Critical advisory

The current critical entry is `shell-quote`.

Observed dependency path:
`react-native -> react-devtools-core -> shell-quote`

Installed/current registry version observed:
`1.10.0`

The advisory range reported by npm requires a patched version beyond what was available in the public registry during the 2026-10-08 verification.

No OrchidPay payment code directly imports `shell-quote`.

## 4. Other inspected leaves

### node-forge
Observed in Expo CLI / code-signing certificate tooling lineage.

Registry inspection on 2026-10-08 returned the same latest release that remained inside the current advisory boundary.

### source-map-js
Observed through PostCSS / Expo Metro configuration lineage.

Registry inspection on 2026-10-08 returned the same latest release that remained inside the current advisory boundary.

### brace-expansion
Observed in legacy glob/minimatch tooling paths and newer fingerprint tooling.

### braces / micromatch
Observed in Metro/Jest/React Native transformation/file-map tooling paths.

## 5. Remediation experiments performed

### npm audit fix
A disposable lab copied from the SDK55-aligned candidate was tested with:

`npm audit fix --package-lock-only --omit=dev --ignore-scripts`

Result:
- package.json unchanged;
- key advisory versions unchanged;
- advisory count unchanged at 24;
- Expo Doctor remained healthy;
- TypeScript remained healthy.

Conclusion:
**the automatic fix path provides no actual remediation.**

### Unsupported broad overrides
An earlier experiment with broad Metro overrides was rejected by Expo Doctor because the installed Metro versions no longer matched the versions required by the installed Expo SDK.

That path was abandoned.

### Major/downgrade suggestions
`npm audit` may suggest version changes that are incompatible with the current SDK line or would constitute a major/downgrade migration.

Those are not treated as safe release fixes.

## 6. Current security decision

B12 does not attempt to manufacture a zero-audit result through unsupported dependency surgery.

Instead:
- supported Expo SDK 55 patch versions are used;
- Expo Doctor must remain 20/20;
- TypeScript must remain clean;
- native/static exports must pass;
- the advisory package set is pinned and bounded;
- counts may not exceed 24 total / 23 high / 1 critical;
- no additional critical is accepted;
- secrets remain separately scanned;
- payment live execution remains OFF.

This is a risk reservation, not a declaration that the advisories are harmless.

## 7. Exposure interpretation

The observed critical/high leaves are currently reached through framework/build/devtools dependency lineages rather than an OrchidPay business-logic dependency directly selected for payment execution.

That reduces but does not eliminate risk.

The project must continue monitoring upstream Expo/React Native releases and should adopt patched supported versions as soon as they are available and pass the full OrchidPay release gate.

## 8. Mandatory future action

At each future release candidate:

1. run `npm audit --omit=dev --json`;
2. compare package names and counts against this baseline;
3. check registry/changelogs for patched compatible Expo/React Native releases;
4. reject any new advisory or increased severity until reviewed;
5. migrate to supported patches when available;
6. rerun Expo Doctor, TypeScript, exports and native prebuild after dependency changes.

## 9. Current verdict

**KNOWN UPSTREAM SECURITY RESERVATION — BOUNDED / MONITORED / NOT FIXABLE WITH CURRENT SUPPORTED REGISTRY SET**

This reservation does not authorize live payment execution or provider activation.
