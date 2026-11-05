# Anna / little days — static edition

The primary website is now a simple **GitHub Pages-compatible static site**, as requested. Its shared-password screen is cosmetic: visitors can find the password and all published entries in downloaded files. Treat it as public. No real secrets or sensitive entries belong in this version.

## Open and test

Run `npm start` (Node.js 24+) and open http://127.0.0.1:3211 on this computer.

Demo password: **little-days**. It is deliberately public and is not a production secret.

Try a wrong password, then the correct password, then **Close diary / Log out**. Reloading also returns to the gate. Resize the browser to test the phone layout. The local URL only works on this computer; a hosted GitHub Pages URL will work on other devices, subject to network availability.

There are no personal entries. The empty state is intentional. The local server only serves static files; login does not submit to a server or depend on Origin headers.

## GitHub Pages publication

Repository: https://github.com/the-anna-sun/daye (public, explicitly authorized).
Website: https://the-anna-sun.github.io/daye/

The Pages workflow publishes only `docs/` on pushes to main. After changing entries, styles or the cosmetic password, run `npm run check`, `npm test`, and `npm run build`, then commit the updated source and built `docs/` files. Verify the Pages workflow succeeds before reporting an update as live.

Commit history was replaced using a nonpersonal placeholder identity. Future GitHub browser edits can reintroduce your personal email: enable **Keep my email addresses private** in GitHub email settings before making web edits. Local Git for this project should use a neutral identity or your GitHub-provided noreply address. Removing reachable history does not guarantee deletion from caches, old links, clones or GitHub internal objects.

No application server or production secret is needed. This public site has only a cosmetic password screen. Mainland China reachability is unverified; test the final address there.

## Change the cosmetic password

Edit `static/config.json`, then run `npm run build` and publish the updated `docs/`. Never reuse a real account password. The password is visible to anyone who downloads the site.

## Write entries, including through voice conversations

Describe your day to Codex, specify its date, and request a draft. The assistant should only use facts you provide. Review the draft, then explicitly ask to publish. There is no automatic voice recording or background publishing integration.

Edit `content/entries.json`, using this structure (format example only, not a real diary entry):

```json
[
  {
    "id": "2026-11-04-first-note",
    "date": "2026-11-04",
    "title": "Your approved title",
    "body": "Your approved text.\n\nA second paragraph.",
    "mood": "Optional mood",
    "published": false
  }
]
```

Use unique IDs and real calendar dates. Entries are newest first. Change `published` to true only after approval. Build again and publish `docs/`; otherwise edits will not appear on the static website. Only published entries are included in generated pages. However, drafts in a public source repository or its history are still public. Keep sensitive drafts out of any public repository. Removing an entry does not erase Git history or copies downloaded by visitors.

## Files and checks

- `docs/`: complete built static site; works at a project subpath without external assets.
- `static/`: cosmetic password configuration and browser behavior.
- `lib/views.mjs`, `public/style.css`: English page design.
- `scripts/build-static.mjs`: generates Pages output.
- `npm test`: checks retained private-server behavior and content validation; browser tests additionally verify the static password gate.
- `npm run check`: validates content.

The older server-side private version remains in `server.mjs`, available through `npm run start:private`. It is not used by GitHub Pages. It still requires private environment values DIARY_PASSWORD and PUBLIC_ORIGIN plus NODE_ENV=production and HTTPS for real hosting. Its browser form Referrer-Policy was corrected to same-origin, with strict Origin checks and an exact Referer fallback only when Origin is absent. Do not confuse the static cosmetic gate with that optional private server.
