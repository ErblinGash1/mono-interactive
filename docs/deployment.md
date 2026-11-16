# Static hosting procedure

MONO is a client-only Vite site. No backend, secrets, server functions, or SPA path rewrites are required: navigation uses native URL fragments on one HTML document. These are instructions for a future, explicitly authorized deployment; no hosting has been configured or published.

## Prepare locally

Use the Node release in `.nvmrc` and run:

```bash
npm ci
npm run check
npm run test:browser
npm run preview
```

`npm run build` verifies the generated relative asset references, page metadata, font license, and separate lazy scene chunk. `dist/` is the complete static output; never upload the source directory, `.env` files, local profiles, or `test-results/`. A subdirectory host must serve `dist/index.html` at the directory's trailing-slash URL. Keep hashed assets alongside that HTML; retain prior hashed assets during a rolling replacement so already-open pages can finish lazy loading.

## Vercel

When publication is authorized, import the repository in Vercel, select the Vite framework preset, and use repository root, install command `npm ci`, build command `npm run build`, and output directory `dist`. Select a supported Node release matching `package.json#engines`. No environment variables are needed. Inspect a preview before promoting it to production. See [Vercel build configuration](https://vercel.com/docs/builds/configure-a-build).

## Netlify

When publication is authorized, import the repository in Netlify. Use repository root as base directory, build command `npm run build`, publish directory `dist`, and the Node version in `.nvmrc`. No functions or integrations are needed for this static app. Alternatively, upload an already-validated `dist/` through Netlify's manual deploy flow; manual uploads do not build source. See [Netlify's Vite guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/) and [manual deployment guide](https://docs.netlify.com/deploy/create-deploys/).

## Verify a future preview

- Check the favicon, local font, lazy WebGL chunk, and font license URL for successful responses.
- Open `#construction-inspect`, `#signature-key`, and `#finale-composition` directly, then reload each URL.
- Exercise both CTA links, mobile menu, keyboard focus, reduced motion, and unavailable-WebGL fallback.
- Check network and console diagnostics; distinguish deliberate WebGL teardown warnings from normal operation.
- Validate on physical mobile hardware and Firefox / Safari before declaring cross-browser production support.

Configure conservative HTML caching and long-lived immutable caching only for hashed assets. If adding a Content Security Policy later, validate the compiled legend shader and local font / module loading before enforcing it. Do not copy a policy from a different application without testing.
