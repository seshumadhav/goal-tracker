# Server Info

- **IP**: `44.192.81.22` (shared EC2 instance — also hosts image-hospital and the-chocolate-room)
- **Domain**: `goat.duckdns.org`
- **SSH**: `ssh -i ~/.keys/image-hospital-key.pem ec2-user@44.192.81.22`
- **Project path**: `/home/ec2-user/goal-tracker`
- **PM2 process name**: `goat`
- **Port**: `3002`
- **Nginx config**: `/etc/nginx/conf.d/goat.conf`

## Access URLs

- App: `https://goat.duckdns.org`
- Health: `https://goat.duckdns.org/health`

## Quick Commands (run on EC2)

```bash
pm2 restart goat                           # restart backend
sudo systemctl reload nginx                # reload nginx
sudo /opt/certbot/bin/certbot certificates # check SSL cert status
```

## Environment Variables (set once directly on the server)

`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set once on the running PM2 process (`pm2 restart goat --update-env` with the vars inline, then `pm2 save`) — not passed through `deploy.sh` or CI, matching how `image-hospital`'s `config/config.json` is set up once on the server and left alone by subsequent deploys. Plain `pm2 restart goat` (no `--update-env`) preserves them across deploys.

To rotate the OAuth client secret: SSH in, then
```bash
cd /home/ec2-user/goal-tracker
GOOGLE_CLIENT_ID='<id>' GOOGLE_CLIENT_SECRET='<secret>' PORT=3002 pm2 restart goat --update-env
pm2 save
```

## First-Time Cert Issuance

Once `goat.duckdns.org` resolves to this server's IP (via DuckDNS), obtain the Let's Encrypt cert:

```bash
sudo /opt/certbot/bin/certbot certonly \
  --authenticator dns-duckdns \
  --dns-duckdns-credentials /etc/letsencrypt/duckdns/credentials.ini \
  --dns-duckdns-propagation-seconds 60 \
  -d "goat.duckdns.org" --non-interactive
```
