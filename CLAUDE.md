# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Headless Movie DB (hmdb) — an Enonic XP sample/demonstration application (`com.enonic.app.hmdb`) that ships sample movie content and renders simple preview pages. Targets XP `8.0.0-SNAPSHOT` (see `gradle.properties`). Not a library/API-only app: it registers a site with controllers and content types, and auto-imports sample data on first install.

## Build & deploy

XP apps compile **through the connected sandbox**, not via the host JDK/Gradle. The Enonic CLI picks the sandbox from the `.enonic` file (gitignored) and the sandbox provides the JDK + Gradle runtime used for the build — don't debug build errors by inspecting local `java -version` or running `./gradlew` directly, and don't assume the host's Java matches what the build uses.

Primary commands:
- `enonic project build` — compile the app inside the connected sandbox.
- `enonic project deploy` — build and deploy the jar to the sandbox.
- `enonic project sandbox` — re-associate or switch the connected sandbox.

The `build.gradle` / `settings.gradle` files are authoritative for dependencies and plugins (`com.enonic.xp.app`, `com.enonic.xp.settings` from `settings.gradle`, and the `xplibs.*` version catalog), but the wrapper is invoked by the CLI against the sandbox runtime, so versions here must be compatible with what the sandbox ships — don't pin library versions inline; always go through `xplibs.*`.

There are no unit tests or lint config wired into this repo; the CI workflow (`.github/workflows/enonic-gradle.yml`) runs the shared `enonic/release-tools/build-and-publish` action.

## First-boot bootstrapping

`src/main/resources/main.js` is the application entry point. On the cluster leader (`clusterLib.isLeader()`) it:

1. Runs in an admin context on repo `com.enonic.cms.hmdb`.
2. If the `hmdb` project does not exist, creates it via `lib-project` (public read access, language `en`).
3. Imports `/import/hmdb` into `/content` using `exportLib.importNodes`, applying `import/replace_app.xsl` with `applicationId=app.name` so the exported XML references to the old app name are rewritten to the currently-deployed app on import.
4. Publishes `/hmdb` from `draft` → `master`.

If you change `appName` in `gradle.properties` the XSLT substitution is what keeps imported content referring to the right app. Don't bypass it by hardcoding app IDs in the exported data.

## Resource layout (XP8)

Under `src/main/resources/`:

- `application.yaml` — top-level app manifest (`kind: "Application"`, title, description, vendor).
- `cms/` — all schemas the CMS cares about:
  - `site.yaml` — portal mappings (controllers matched by content type).
  - `cms.yaml` — app-level mixin bindings (which content types get which mixin fields).
  - `content-types/`, `pages/`, `parts/`, `layouts/`, `macros/`, `mixins/`, `styles/` — all YAML descriptors.
- `controllers/` — portal controllers registered via `cms/site.yaml` mappings:
  - `info.js` — matches `type:'portal:site'`, plain HTML landing page.
  - `preview.js` — matches `type:'.*:person|.*:movie|.*:folder'`, uses `lib-thymeleaf` to render `preview.html`.
- `i18n/` — translation bundles (`phrases.properties`, `phrases_no.properties`). Must live at `/i18n/`, not `/site/i18n/` (XP8 removed the site-scoped lookup).
- `assets/` — static assets (including `styles.css`, served via `portal.assetUrl`).
- `import/hmdb/` — XP content export used for first-boot bootstrapping, with `replace_app.xsl` rewriting app IDs on import.

Controller `.js` files that live alongside descriptors (e.g. `cms/parts/movie-details/movie-details.js`) use uppercase HTTP method exports (`exports.GET`, `exports.POST`) — XP8 deprecated lowercase method names. `exports.all` stays lowercase.

## Samples (not built)

`samples/review/` contains an example `review` content type XML and is **not** under `src/` — it's a copy-paste example for consumers of this demo, not part of the build. Leave it as a sample unless the user explicitly asks.

## Working conventions specific to XP apps

- Resources under `src/main/resources/` are served as classpath resources by XP; paths in controller `require('/lib/...')` and `resolve('...')` calls are classpath-relative, not filesystem-relative.
- Library deps in `build.gradle` use the `xplibs.*` catalog (e.g. `include xplibs.content`), not version-pinned coordinates. Third-party libs like `lib-thymeleaf` still use explicit coordinates.
- `include` vs `implementation` in `build.gradle`: `include` bundles the library inside the deployed app jar (used for `lib-xp:*` runtime libs and third-party `lib-*` deps), `implementation` is a compile-time-only XP API (e.g. `xplibs.api.script`). Keep that distinction when adding dependencies.
- Mixin bindings are split: mixin schemas live in `cms/mixins/<name>/<name>.yaml`, and the binding of "which content types get this mixin" lives in `cms/cms.yaml` under `mixins:` (with an `allowContentTypes` regex). Site mappings live separately in `cms/site.yaml`.
