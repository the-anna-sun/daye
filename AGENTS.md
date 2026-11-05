# Anna diary editing rules

- User-facing conversation, site UI and documentation must be English (updated user preference).
- Never invent Anna's personal experiences. Only use facts she supplies for this diary.
- New content defaults to `published: false`; obtain her approval of the text and publishing intent before publishing personal entries.
- The user explicitly authorized the public `the-anna-sun/daye` repository and public Pages site. Preserve that decision. Never push to the unrelated `annasun04/Sleek-Website` repository.
- Never commit real passwords, tokens or `.env` files. The explicitly public cosmetic demo value in static/config.json is allowed. Configure secrets for the optional private server only in hosting environment settings.
- The primary deliverable is now a public GitHub Pages static site with a cosmetic client-side password screen, explicitly authorized by the user. Never imply that it protects content. Only publish approved entries; no real secrets in static configuration. Keep the older private server as an optional alternative.
- If using the optional private server, production must use HTTPS and one Node process until session/limiter storage is redesigned.
- Use a nonpersonal commit identity; never reintroduce personal email in commit metadata.
- Run `npm run check`, `npm test`, and `npm run build` before deploying source or content updates; verify the actual deployment result before reporting publication.
- Do not promise automatic voice publishing. Use the documented draft-review-publish workflow.
