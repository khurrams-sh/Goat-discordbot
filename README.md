# 🤖 Crossmint Discord Bot

A Discord bot that integrates with the GOAT SDK for secure wallet management and basic DeFi operations. Currently supports EVM wallet connections and token swapping through Discord commands.

## ✨ Features

### 🔐 Wallet Management
- Secure EVM wallet setup via Discord DMs
- Encrypted storage of private keys
- Wallet connection status checking
- Real-time balance checking via GOAT SDK

### 💱 Trading & DeFi
- **Token Swapping**: Trade tokens on Uniswap (UI ready, integration planned)
- **Planned**: Yield farming, prediction markets, advanced portfolio management

### 🛒 Commerce
- **Amazon Integration**: Search and purchase products via GOAT SDK
- **Crossmint Payments**: Crypto-to-fiat conversion for purchases
- **Headless Checkout**: Seamless commerce through Discord

### 🔒 Security
- End-to-end encryption for sensitive data
- Rate limiting and abuse protection
- Secure DM-based wallet setup
- No private keys stored in plain text

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Discord Bot Token (from Discord Developer Portal)
- Crossmint API Key (optional, for commerce features)
- RPC endpoints for desired blockchains

### Configuration

The bot requires environment variables for configuration. Copy `env.example` to `.env` and fill in your values:

```env
# Required
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here

# Optional (users can provide their own)
CROSSMINT_API_KEY=your_crossmint_api_key_here
INFURA_PROJECT_ID=your_infura_project_id_here

# Security (generate secure random strings)
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
```

### Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token and client ID to your `.env` file
5. Invite the bot to your server with these permissions:
   - `Send Messages`
   - `Use Slash Commands`
   - `Send Messages in Threads`
   - `Read Message History`

## 📋 Commands

### Wallet Commands
- `/setup-wallet` - Configure your EVM crypto wallet securely via DM
- `/wallet-status` - Check wallet connection and status
- `/balance` - View real-time wallet balance

### Trading Commands
- `/swap <from-token> <to-token> <amount>` - Swap tokens on Uniswap (UI ready)
- `/buy <token> <amount>` - Purchase crypto assets (planned)

### Commerce Commands
- `/buy-amazon <search-term> [max-price]` - Search and purchase Amazon items with crypto

### Utility Commands
- `/help` - Get help with bot commands

## 🏗️ Architecture

The bot is built with a clean, modular architecture:

- **Commands**: Discord slash command handlers
- **Services**: Core business logic (wallet, security, GOAT SDK)
- **Config**: Environment and configuration management
- **Utils**: Logging and helper utilities

Built with TypeScript for type safety and maintainability.

## 🔐 Security Best Practices

### For Users
- **Never share your private key** with anyone
- Use the bot's secure DM setup process
- Regularly check your wallet balances
- Set reasonable transaction limits

### For Developers
- Always encrypt sensitive data
- Implement proper rate limiting
- Validate all user inputs
- Log security events
- Use secure random key generation

## 🌐 Supported Blockchains

| Blockchain | Status | Wallet Support | Trading | Commerce |
|------------|--------|----------------|---------|----------|
| Ethereum   | ✅     | ✅             | 🔄      | ⏳       |
| Polygon    | ⏳     | ⏳             | ⏳      | ⏳       |
| Solana     | ⏳     | ⏳             | ⏳      | ❌       |
| Other EVM  | ⏳     | ⏳             | ⏳      | ❌       |

*🔄 = Ready for integration, ⏳ = Planned, ❌ = Not planned*

## 🛠️ Built With

- **[GOAT SDK](https://github.com/goat-sdk/goat)** - Agentic finance toolkit
- **[Crossmint](https://crossmint.com)** - Web3 infrastructure
- **[Discord.js](https://discord.js.org)** - Discord API wrapper
- **[TypeScript](https://typescriptlang.org)** - Type-safe JavaScript
- **[Ethers.js](https://ethers.io)** - Ethereum library

## 📝 API Reference

### GoatService Methods

```typescript
// Initialize GOAT tools for a wallet
await goatService.initializeTools({
  walletProvider: userWallet,
  plugins: ['erc20', 'uniswap'] // crossmint integration ready
});

// Execute a transaction (planned implementation)
const result = await goatService.executeTransaction('swap-tokens', {
  fromToken: 'USDC',
  toToken: 'ETH',
  amount: '100'
});
```

### WalletManager Methods

```typescript
// Register a new wallet
await walletManager.registerWallet(userId, walletProvider);

// Get user's wallet
const wallet = await walletManager.getWallet(userId);

// Check if user has wallet
const hasWallet = walletManager.hasWallet(userId);
```

## 🤝 Contributing

This project welcomes contributions! The codebase is built with TypeScript and follows standard Node.js project structure.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Check the [GOAT SDK Documentation](https://github.com/goat-sdk/goat)
- Visit [Crossmint Docs](https://docs.crossmint.com)
- Join the [Crossmint Discord](https://discord.gg/crossmint)

## ⚠️ Disclaimer

This bot handles real cryptocurrency transactions. Always:
- Test with small amounts first
- Understand the risks involved
- Keep your private keys secure
- Use at your own risk

---

**Made with ❤️ using GOAT SDK and Crossmint**
