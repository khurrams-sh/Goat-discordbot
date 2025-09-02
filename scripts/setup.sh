#!/bin/bash

# Crossmint Discord Bot Setup Script

echo "🤖 Setting up Crossmint Discord Bot..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📋 Creating environment file..."
    cp env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit .env file with your configuration before starting the bot"
else
    echo "⚠️  .env file already exists, skipping..."
fi

# Create logs directory
mkdir -p logs
echo "✅ Created logs directory"

# Build the project
echo "🔨 Building TypeScript project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Generate secure keys if needed
echo "🔐 Generating secure keys..."

# Generate JWT secret if not set
if grep -q "your_jwt_secret_here" .env; then
    JWT_SECRET=$(openssl rand -hex 32)
    sed -i "s/your_jwt_secret_here/$JWT_SECRET/" .env
    echo "✅ Generated JWT secret"
fi

# Generate encryption key if not set
if grep -q "your_encryption_key_here" .env; then
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    sed -i "s/your_encryption_key_here/$ENCRYPTION_KEY/" .env
    echo "✅ Generated encryption key"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your Discord bot token and other configuration"
echo "2. Set up your Discord bot in the Discord Developer Portal"
echo "3. Invite the bot to your server with the required permissions"
echo "4. Run 'npm start' to start the bot"
echo ""
echo "📚 Check the README.md for usage instructions"
echo "🆘 Support: Join the Crossmint Discord for help"
echo ""
