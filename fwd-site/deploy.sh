#!/bin/bash

# FWD Agency - Deployment Script
# Prepares and deploys the site to shared hosting

echo "🚀 FWD Agency Deployment Script"
echo "================================"

# Build the production site
echo "📦 Building production site..."
npm run build

# Check if build succeeded
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Copy .htaccess to dist folder
echo "📋 Copying deployment files..."
cp .htaccess dist/

# Create deployment package
echo "🗜️ Creating deployment package..."
tar -czf fwd-site-deploy.tar.gz -C dist .

echo "✅ Deployment package created: fwd-site-deploy.tar.gz"
echo ""
echo "📌 Deployment Instructions:"
echo "1. Upload fwd-site-deploy.tar.gz to your hosting server"
echo "2. Extract in your public_html directory:"
echo "   tar -xzf fwd-site-deploy.tar.gz"
echo "3. Ensure .htaccess is in the root directory"
echo "4. Test the site and verify all features work"
echo ""
echo "🔧 Server Requirements:"
echo "- Apache with mod_rewrite enabled"
echo "- PHP 7.4+ (for contact forms if added)"
echo "- SSL certificate installed"
echo ""
echo "🎉 Deployment package ready!"