1. Refresh the Google sign-in provider in the backend auth settings
- Reconfigure Google through the managed social-auth setup so the project uses the correct broker/callback configuration for this app.
- Verify Google is enabled in the backend and that the auth setup matches the current published domain.

2. Align the frontend OAuth call with the managed flow
- Update the auth page to use the recommended managed OAuth redirect pattern instead of the current legacy-style `/auth` assumption if needed.
- Keep sign-in and sign-up buttons on the same working Google flow so both entry points behave identically.

3. Replace the current diagnostics with the correct guidance
- Remove the misleading legacy callback instructions that point to Google Cloud Console callback values intended for a different setup.
- Show a clear message only when the app is running on an unsupported origin or when the managed auth setup itself is missing/misconfigured.
- Include exact next steps for published domain vs preview domain cases.

4. Validate the real failure path
- Test the Google auth launch flow on the published URL and confirm the redirect no longer returns `redirect_uri_mismatch`.
- Confirm the auth page returns to the app cleanly after Google and that the existing post-login routing still works.

Technical details
- The app is already using the managed Lovable OAuth SDK, so this is not primarily a button/UI bug.
- The current diagnostics component is built around a legacy callback model and is likely sending you toward the wrong fix.
- I also found a local config mismatch in project metadata, so I’ll treat backend auth configuration as the source of truth and avoid relying on stale local assumptions.