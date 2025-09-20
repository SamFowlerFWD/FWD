# FWD Agency - Hostinger VPS Setup Guide

## Prerequisites

### 1. Hostinger VPS Requirements
- **Plan**: At least VPS 1 (1 vCPU, 4GB RAM, 50GB SSD)
- **OS**: Ubuntu 22.04 LTS
- **Access**: Root SSH access
- **Domain**: fwd-agency.co.uk pointed to VPS IP

### 2. Local Requirements
- Git repository access
- Node.js installed locally
- OpenAI API key

## Quick Start Deployment

### Step 1: Configure Your VPS Details
```bash
export VPS_HOST="your.hostinger.vps.ip"
export VPS_USER="root"
export VPS_PORT="22"
```

### Step 2: Run Initial Deployment
```bash
./deploy-hostinger.sh deploy
```

### Step 3: Configure Environment Variables
SSH into your VPS and edit the environment file:
```bash
ssh root@your.vps.ip
nano /var/www/fwd-agency/.env
```

Add your OpenAI API key:
```env
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

### Step 4: Set Up SSL
```bash
./deploy-hostinger.sh ssl
```

## Manual VPS Setup (Alternative Method)

### 1. Initial Server Setup
```bash
# Connect to your VPS
ssh root@your.vps.ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install build tools
apt-get install -y build-essential git nginx certbot python3-certbot-nginx

# Install PM2 globally
npm install -g pm2
pm2 startup
```

### 2. Create Application User (Optional but Recommended)
```bash
# Create a dedicated user
adduser fwdapp
usermod -aG sudo fwdapp

# Switch to new user
su - fwdapp
```

### 3. Clone and Setup Application
```bash
# Create application directory
sudo mkdir -p /var/www/fwd-agency
sudo chown -R $USER:$USER /var/www/fwd-agency

# Clone repository
cd /var/www
git clone https://github.com/SamFowlerFWD/FWD.git fwd-agency
cd fwd-agency/fwd-site

# Install dependencies
npm ci

# Copy and configure environment
cp .env.production .env
nano .env  # Add your API keys

# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
```

### 4. Configure Nginx
```bash
# Copy Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/fwd-agency
sudo ln -s /etc/nginx/sites-available/fwd-agency /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 5. Obtain SSL Certificate
```bash
sudo certbot --nginx -d fwd-agency.co.uk -d www.fwd-agency.co.uk
```

## Hostinger VPS Panel Configuration

### 1. Firewall Rules
In Hostinger VPS panel, configure firewall:
- **SSH**: Port 22 (or custom)
- **HTTP**: Port 80
- **HTTPS**: Port 443
- **Node.js**: Port 3000 (internal only)

### 2. DNS Settings
Point your domain to VPS:
- **A Record**: `@` → Your VPS IP
- **A Record**: `www` → Your VPS IP
- **AAAA Record**: (If IPv6 available)

### 3. Backup Configuration
Set up automated backups in Hostinger panel:
- Weekly full backups
- Daily incremental backups

## Application Management Commands

### View Application Status
```bash
./deploy-hostinger.sh status
# Or directly: pm2 status
```

### View Logs
```bash
./deploy-hostinger.sh logs
# Or directly: pm2 logs fwd-agency
```

### Restart Application
```bash
./deploy-hostinger.sh restart
# Or directly: pm2 restart fwd-agency
```

### Update Application
```bash
# Quick update (code only)
./deploy-hostinger.sh update

# Full redeploy
./deploy-hostinger.sh deploy
```

## Monitoring & Maintenance

### 1. Set Up PM2 Monitoring
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 2. Monitor Resources
```bash
# Check memory usage
pm2 monit

# Check system resources
htop

# Check disk usage
df -h
```

### 3. Auto-restart on Reboot
```bash
pm2 startup
pm2 save
```

## Performance Optimization

### 1. Enable HTTP/2
Already configured in nginx.conf

### 2. Enable Brotli Compression
```bash
sudo apt-get install nginx-module-brotli
# Add to nginx.conf: load_module modules/ngx_http_brotli_filter_module.so;
```

### 3. Configure Swap (if needed)
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs fwd-agency --lines 100

# Check port availability
sudo lsof -i :3000

# Restart with verbose output
pm2 delete fwd-agency
pm2 start ecosystem.config.js --env production --log
```

### 502 Bad Gateway
```bash
# Check if app is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/fwd-agency-error.log

# Restart services
pm2 restart fwd-agency
sudo systemctl restart nginx
```

### High Memory Usage
```bash
# Check memory
pm2 monit

# Restart with memory limit
pm2 delete fwd-agency
pm2 start ecosystem.config.js --max-memory-restart 1G
```

### SSL Issues
```bash
# Renew certificate
sudo certbot renew --dry-run  # Test
sudo certbot renew            # Actual renewal

# Force renewal
sudo certbot renew --force-renewal
```

## Security Checklist

- [ ] Change default SSH port
- [ ] Set up SSH key authentication
- [ ] Disable root login
- [ ] Configure UFW firewall
- [ ] Set up fail2ban
- [ ] Regular security updates
- [ ] Implement rate limiting
- [ ] Monitor access logs
- [ ] Keep API keys secure
- [ ] Regular backups

## Support Contacts

- **Hostinger Support**: Available 24/7 via live chat
- **GitHub Issues**: https://github.com/SamFowlerFWD/FWD/issues
- **PM2 Docs**: https://pm2.keymetrics.io/
- **Astro Docs**: https://docs.astro.build/

## Cost Optimization Tips

1. **Use Hostinger's VPS 1** - Sufficient for starting
2. **Enable caching** - Reduces server load
3. **Use Cloudflare** - Free CDN and DDoS protection
4. **Monitor usage** - Upgrade only when needed
5. **Optimize images** - Already handled by Astro

## Next Steps After Deployment

1. **Test all features** - Especially AI playground
2. **Set up monitoring** - Use PM2 Plus or alternative
3. **Configure backups** - Both database and files
4. **Set up analytics** - Google Analytics or Plausible
5. **Enable Cloudflare** - For CDN and security
6. **Test SSL** - Use SSL Labs test
7. **Load testing** - Ensure it handles traffic

---

Last Updated: August 2024
Version: 1.0.0