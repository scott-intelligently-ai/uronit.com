# Onit website

Static site for Onit, hosted at **uronit.com**.

| File | Purpose |
| --- | --- |
| `index.html` | The whole site: markup, CSS, and page JavaScript. |
| `favicon.svg` | Browser tab icon. |
| `og.png` | Image shown when the link is shared. |
| `api/waitlist.js` | Saves waitlist emails. |
| `api/signups.js` | Shows the saved addresses on an unlisted page. |
| `api/stats.js` | Shows visitor counts on a separate unlisted page. |
| `vercel.json` | Response headers and the unlisted-page routes. |

The page loads Bricolage Grotesque and Plus Jakarta Sans from Google Fonts.

## Waitlist

The form posts to `/api/waitlist`. That function stores the address in the Supabase project **uronit**, table `public.waitlist`. The table is locked down: the public anon key cannot read or write it. Only the server-side service role, set as `SUPABASE_SERVICE_ROLE_KEY` on Vercel, can insert.

Signing up again with the same address is treated as success. A hidden company field is ignored and not stored.

The signup list is a separate page. Its address is `https://uronit.com/` followed by the value of `SIGNUP_VIEW_SECRET`. That value is only stored as a Vercel environment variable. A wrong address returns "Not found". The page is not linked from the public site.

## Visitors

Visitor counts are a separate page. Its address is `https://uronit.com/` followed by the value of `STATS_VIEW_SECRET`. That value is only stored as a Vercel environment variable, and it looks like `stats` plus ten digits. A wrong address returns "Not found". The page is not linked from the public site.

The page reads Vercel Web Analytics with `ANALYTICS_READ_TOKEN`. Until that token is set, the page says how to add it.

Required environment variables, production and preview:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SIGNUP_VIEW_SECRET`
- `STATS_VIEW_SECRET`
- `ANALYTICS_READ_TOKEN`

## Preview locally

```
python3 -m http.server 8000
```

The page loads at http://localhost:8000. The waitlist and the unlisted pages need the deployed API, or `vercel dev` with the environment variables set.

## Deploy

The Vercel project is `uronit` on the team Scott Bohannon's projects. Pushes to the connected GitHub repository deploy automatically. `uronit.com` is the production domain; `www.uronit.com` redirects to it.

DNS for the name is managed at Hover. Use the records Vercel shows for the project domain. Leave mail (MX) records alone.
