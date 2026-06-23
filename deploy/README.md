# Deploy — HTTPS reverse proxy (Caddy)

This sets up **automatic, free HTTPS** for every domain on the server using
**Caddy + Let's Encrypt**. Caddy obtains the certificates and **auto-renews
them forever** — you never touch SSL again.

> **About "1-year licenses":** free SSL providers no longer issue 1-year certs.
> Let's Encrypt certs are valid **90 days** but are **renewed automatically** by
> Caddy well before expiry, so HTTPS keeps working permanently at no cost. This
> is the standard, correct setup.

---

## What it does

```
                        ┌─────────────── Caddy (this) ───────────────┐
  https://eco-taom.uz ─►│  :443  TLS termination + auto Let's Encrypt │─► host:3003  (restaurant frontend)
  https://CLINIC    ───►│        HTTP→HTTPS redirect, WebSockets      │─► host:PORT  (clinic app)
                        └────────────────────────────────────────────┘
```

- `eco-taom.uz` + `www.eco-taom.uz` → restaurant frontend (port **3003**), which
  already proxies `/api` and `/ws` to the backend (8080).
- Clinic domain → clinic app (port to be filled in).

---

## Prerequisites (check ONCE on the server)

1. **DNS** — `eco-taom.uz` (and `www`) must have an **A record** pointing to this
   server's public IP. You said you already did this. Verify:
   ```bash
   dig +short eco-taom.uz
   ```

2. **Ports 80 and 443 must be FREE** on the host. If the clinic project (or an
   old nginx/apache) is already listening there, Caddy can't start. Check:
   ```bash
   sudo ss -tlnp '( sport = :80 or sport = :443 )'
   docker ps   # see which containers publish 80/443
   ```
   If something else owns 80/443, that app must stop publishing them and instead
   be routed *through* Caddy (add a block in the `Caddyfile`). See "Add the
   clinic" below.

3. **The restaurant app must be running** (so port 3003 responds):
   ```bash
   docker compose up -d            # from the repo root
   ```

---

## Start the proxy

```bash
cd deploy
docker compose up -d
docker compose logs -f caddy      # watch it obtain the certificate
```

Then open **https://eco-taom.uz** — it should load with a valid padlock.
HTTP automatically redirects to HTTPS.

---

## Add the clinic

1. Find the clinic's port:
   ```bash
   docker ps    # PORTS column, e.g. 0.0.0.0:3001->80/tcp  →  port is 3001
   ```
2. Edit `Caddyfile`, uncomment and fill the clinic block:
   ```
   clinic-domain.uz, www.clinic-domain.uz {
       encode gzip zstd
       reverse_proxy host.docker.internal:3001
   }
   ```
3. Make sure the clinic's DNS A record also points to this server, then reload:
   ```bash
   docker compose -f deploy/docker-compose.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
   ```

---

## Notes / troubleshooting

- **Certificate issuance fails?** Almost always DNS not pointing here yet, or
  port 80 blocked by a firewall (Let's Encrypt validates over port 80/443). Open
  them: `sudo ufw allow 80,443/tcp`.
- **Don't delete the `caddy_data` volume** — it stores your certificates and
  ACME account. Deleting it forces re-issuance (and risks Let's Encrypt rate
  limits).
- **Rate limits:** Let's Encrypt allows ~5 certs per domain per week. While
  testing, you can add `acme_ca https://acme-staging-v02.api.letsencrypt.org/directory`
  to the global block to use the staging CA (untrusted certs, but unlimited).
- Caddy also serves **HTTP/3** (UDP 443) automatically.
