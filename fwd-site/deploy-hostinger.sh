#!/bin/bash

# ================================================
# FWD Agency - Hostinger VPS Deployment Script
# ================================================
# This script handles the complete deployment process
# to your Hostinger VPS with Node.js support

set -e  # Exit on error

# Configuration
VPS_HOST="${VPS_HOST:-your-vps-ip}"
VPS_USER="${VPS_USER:-root}"
VPS_PORT="${VPS_PORT:-22}"
DEPLOY_PATH="/var/www/fwd-agency"
DOMAIN="fwd-agency.co.uk"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() { echo -e "${BLUE}ℹ ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }

# ================================================
# LOCAL DEPLOYMENT PREPARATION
# ================================================

deploy_local() {
    echo -e "${GREEN}🚀 FWD Agency - Hostinger VPS Deployment${NC}"
    echo "============================================"
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        log_error ".env file not found!"
        log_warning "Please create .env with your OPENAI_API_KEY"
        exit 1
    fi
    
    # Build the project
    log_info "Building production bundle..."
    npm run build
    
    if [ $? -ne 0 ]; then
        log_error "Build failed! Please fix errors and try again."
        exit 1
    fi
    log_success "Build completed successfully"
    
    # Create deployment package
    log_info "Creating deployment package..."
    tar -czf deploy-package.tar.gz \
        dist/ \
        package*.json \
        ecosystem.config.js \
        .env.production \
        nginx.conf \
        --exclude=node_modules \
        --exclude=.git
    
    log_success "Deployment package created"
    
    # Transfer to VPS
    log_info "Transferring to Hostinger VPS..."
    scp -P $VPS_PORT deploy-package.tar.gz $VPS_USER@$VPS_HOST:/tmp/
    
    if [ $? -eq 0 ]; then
        log_success "Package transferred successfully"
        rm deploy-package.tar.gz
    else
        log_error "Transfer failed!"
        exit 1
    fi
}

# ================================================
# REMOTE VPS SETUP
# ================================================

setup_vps() {
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << 'ENDSSH'
    set -e
    
    echo "🔧 Setting up VPS environment..."
    
    # Install Node.js 20 LTS if not present
    if ! command -v node &> /dev/null; then
        echo "Installing Node.js 20 LTS..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Install PM2 globally
    if ! command -v pm2 &> /dev/null; then
        echo "Installing PM2..."
        sudo npm install -g pm2
        pm2 startup systemd -u $USER --hp /home/$USER
    fi
    
    # Install Nginx if not present
    if ! command -v nginx &> /dev/null; then
        echo "Installing Nginx..."
        sudo apt-get update
        sudo apt-get install -y nginx
    fi
    
    # Create application directory
    sudo mkdir -p /var/www/fwd-agency
    sudo chown -R $USER:$USER /var/www/fwd-agency
    
    # Extract deployment package
    cd /var/www/fwd-agency
    tar -xzf /tmp/deploy-package.tar.gz
    rm /tmp/deploy-package.tar.gz
    
    # Install dependencies
    echo "Installing dependencies..."
    npm ci --production
    
    # Copy environment file
    if [ -f .env.production ]; then
        cp .env.production .env
        echo "⚠️  Remember to edit /var/www/fwd-agency/.env with your actual API keys!"
    fi
    
    # Create logs directory
    mkdir -p logs
    
    echo "✓ VPS setup completed"
ENDSSH
}

# ================================================
# NGINX CONFIGURATION
# ================================================

configure_nginx() {
    log_info "Configuring Nginx..."
    
    # Copy Nginx config to VPS
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
    sudo tee /etc/nginx/sites-available/fwd-agency > /dev/null << 'NGINXCONF'
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (update paths after setting up SSL)
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy to Node.js app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static file caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml application/atom+xml image/svg+xml text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype;
}
NGINXCONF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/fwd-agency /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    
    echo "✓ Nginx configured successfully"
ENDSSH
    
    log_success "Nginx configuration completed"
}

# ================================================
# PM2 APPLICATION START
# ================================================

start_application() {
    log_info "Starting application with PM2..."
    
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << 'ENDSSH'
    cd /var/www/fwd-agency
    
    # Stop existing PM2 process if running
    pm2 delete fwd-agency 2>/dev/null || true
    
    # Start application with PM2
    pm2 start ecosystem.config.js --env production
    pm2 save
    
    # Show status
    pm2 status
    echo "✓ Application started successfully"
ENDSSH
    
    log_success "Application is running!"
}

# ================================================
# SSL SETUP WITH CERTBOT
# ================================================

setup_ssl() {
    log_info "Setting up SSL with Let's Encrypt..."
    
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
    # Install Certbot
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
    
    # Obtain SSL certificate
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    # Set up auto-renewal
    sudo systemctl enable certbot.timer
    sudo systemctl start certbot.timer
    
    echo "✓ SSL certificate installed"
ENDSSH
    
    log_success "SSL setup completed"
}

# ================================================
# MAIN DEPLOYMENT FLOW
# ================================================

main() {
    case "${1:-deploy}" in
        deploy)
            deploy_local
            setup_vps
            configure_nginx
            start_application
            
            echo ""
            echo -e "${GREEN}✨ Deployment Complete!${NC}"
            echo "======================================"
            echo -e "🌐 Your site should be live at: ${BLUE}https://$DOMAIN${NC}"
            echo ""
            echo -e "${YELLOW}⚠️  Important Next Steps:${NC}"
            echo "1. SSH into your VPS and edit the .env file:"
            echo "   ssh -p $VPS_PORT $VPS_USER@$VPS_HOST"
            echo "   nano /var/www/fwd-agency/.env"
            echo ""
            echo "2. Add your OpenAI API key to the .env file"
            echo ""
            echo "3. Restart the application:"
            echo "   pm2 restart fwd-agency"
            echo ""
            echo "4. Set up SSL (if not done):"
            echo "   ./deploy-hostinger.sh ssl"
            ;;
            
        ssl)
            setup_ssl
            ;;
            
        restart)
            ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "cd /var/www/fwd-agency && pm2 restart fwd-agency"
            log_success "Application restarted"
            ;;
            
        logs)
            ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "pm2 logs fwd-agency --lines 100"
            ;;
            
        status)
            ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "pm2 status fwd-agency"
            ;;
            
        update)
            deploy_local
            ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "cd /var/www/fwd-agency && tar -xzf /tmp/deploy-package.tar.gz && npm ci --production && pm2 restart fwd-agency"
            log_success "Application updated"
            ;;
            
        *)
            echo "Usage: $0 {deploy|ssl|restart|logs|status|update}"
            echo ""
            echo "Commands:"
            echo "  deploy  - Full deployment (default)"
            echo "  ssl     - Set up SSL certificate"
            echo "  restart - Restart the application"
            echo "  logs    - View application logs"
            echo "  status  - Check application status"
            echo "  update  - Quick update (code only)"
            exit 1
            ;;
    esac
}

# Check for required environment variables
if [ "$1" != "ssl" ] && [ "$1" != "logs" ] && [ "$1" != "status" ]; then
    if [ -z "$VPS_HOST" ] || [ "$VPS_HOST" == "your-vps-ip" ]; then
        log_warning "Please set your VPS details:"
        echo "  export VPS_HOST=your-hostinger-vps-ip"
        echo "  export VPS_USER=root  # or your username"
        echo "  export VPS_PORT=22    # if different"
        echo ""
        echo "Or edit this script directly with your VPS details"
        exit 1
    fi
fi

# Run main deployment
main "$@"