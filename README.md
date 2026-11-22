# Onit website

Static site for Onit, hosted at **uronit.com**.

| File | Purpose |
| --- | --- |
| `index.html` | The whole site: markup, CSS, and page JavaScript. |
| `favicon.svg` | Browser tab icon. |
| `og.png` | Image shown when the link is shared. |
| `api/waitlist.js` | Saves waitlist emails. |
| `api/signups.js` | Shows the saved addresses on an unlisted page. |
| `vercel.json` | Response headers and the unlisted-page route. |

The page loads Bricolage Grotesque and Plus Jakarta Sans from Google Fonts.

## Waitlist

The form posts to `/api/waitlist`. That function stores the address in the Supabase project **uronit**, table `public.waitlist`. The table is locked down: the public anon key cannot read or write it. Only the server-side service role, set as `SUPABASE_SERVICE_ROLE_KEY` on Vercel, can insert.

Signing up again with the same address is treated as success. A hidden company field is ignored and not stored.

The signup list is a separate page. Its address is `https://uronit.com/` followed by the value of `SIGNUP_VIEW_SECRET`. That value is only stored as a Vercel environment variable. A wrong address returns "Not found". The page is not linked from the public site.

Required environment variables, production and preview:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SIGNUP_VIEW_SECRET`

## Preview locally

```
python3 -m http.server 8000
```

The page loads at http://localhost:8000. The waitlist call needs the deployed API, or `vercel dev` with the two environment variables set.

## Deploy

The Vercel project is `uronit` on the team Scott Bohannon's projects. Pushes to the connected GitHub repository deploy automatically. `uronit.com` is the production domain; `www.uronit.com` redirects to it.

DNS for the name is managed at Hover. Use the records Vercel shows for the project domain. Leave mail (MX) records alone.
