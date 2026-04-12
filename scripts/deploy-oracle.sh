#!/bin/bash

# VisaRoute Oracle Ampere A1 Deployment Script
# Run this script on your Oracle A1 instance as root or with sudo

set -e

echo "=========================================="
echo "VisaRoute Deployment Script"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ] && [ "$1" != "install-deps" ]; then
  echo "Please run as root or use: sudo bash deploy.sh"
  exit 1
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
  echo -e "${GREEN}[STEP]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check OS
if [ ! -f /etc/os-release ]; then
  echo "Cannot detect OS"
  exit 1
fi

. /etc/os-release
OS=$ID
print_step "Detected OS: $OS"

# Update and install dependencies
install_deps() {
  print_step "Installing dependencies..."

  # Install Node.js 20.x
  if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  fi

  # Install Playwright dependencies
  print_step "Installing Playwright system dependencies..."
  apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    libxshmfence1 \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils \
    wget \
    gnupg

  # Install Chromium for Playwright
  print_step "Installing Playwright Chromium..."
  cd /opt
  npm install -g playwright
  npx playwright install chromium

  # Install PM2
  print_step "Installing PM2..."
  npm install -g pm2

  print_step "Dependencies installed successfully!"
}

# Setup application
setup_app() {
  print_step "Setting up application..."

  # Create app directory
  APP_DIR="/home/ubuntu/visaroute"
  mkdir -p $APP_DIR
  mkdir -p $APP_DIR/logs

  # Copy application files (do this from your local machine)
  print_warning "Please copy your application files to $APP_DIR"
  print_warning "Example: rsync -avz --exclude node_modules --exclude .git ./ ubuntu@YOUR_ORACLE_IP:$APP_DIR/"

  cd $APP_DIR

  # Install npm dependencies
  print_step "Installing npm dependencies..."
  npm install

  # Generate Prisma client
  print_step "Generating Prisma client..."
  npx prisma generate

  # Run main seed (countries, visa types, etc.)
  print_step "Running main database seed..."
  npm run db:seed

  # Run scraper config seed
  print_step "Running scraper config seed..."
  npm run db:seed-scraper

  # Create production environment file
  print_warning "Please create .env.production with your configuration"
  print_warning "Copy from .env.oracle.template and fill in values"
}

# Configure PM2
configure_pm2() {
  print_step "Configuring PM2..."

  APP_DIR="/home/ubuntu/visaroute"

  # Start application with PM2
  cd $APP_DIR
  pm2 start ecosystem.config.js
  pm2 save

  # Setup PM2 startup script
  pm2 startup
}

# Configure systemd
configure_systemd() {
  print_step "Configuring systemd service..."

  # Copy service file
  cp /home/ubuntu/visaroute/visaroute.service /etc/systemd/system/

  # Reload systemd
  systemctl daemon-reload

  # Enable service
  systemctl enable visaroute

  # Start service
  systemctl start visaroute

  print_step "Systemd service configured!"
}

# Main menu
case "$1" in
  install-deps)
    install_deps
    ;;
  setup)
    setup_app
    ;;
  pm2)
    configure_pm2
    ;;
  systemd)
    configure_systemd
    ;;
  full)
    install_deps
    setup_app
    configure_pm2
    configure_systemd
    ;;
  *)
    echo "Usage: $0 {install-deps|setup|pm2|systemd|full}"
    echo ""
    echo "  install-deps  - Install system dependencies (Node.js, Playwright, PM2)"
    echo "  setup         - Setup application directory and install npm packages"
    echo "  pm2           - Configure and start PM2"
    echo "  systemd       - Configure systemd service for auto-restart"
    echo "  full          - Run all steps (install-deps + setup + pm2 + systemd)"
    echo ""
    echo "Recommended deployment order:"
    echo "  1. $0 install-deps"
    echo "  2. Copy application files to server"
    echo "  3. $0 setup"
    echo "  4. $0 pm2"
    echo "  5. $0 systemd"
    exit 1
    ;;
esac

echo ""
print_step "Done!"
