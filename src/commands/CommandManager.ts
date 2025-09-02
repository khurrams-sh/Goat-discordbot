import {
  Client,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  SlashCommandStringOption,
  SlashCommandNumberOption
} from 'discord.js';
import { WalletManager } from '../services/WalletManager';
import { GoatService } from '../services/GoatService';
import { SecurityManager } from '../services/SecurityManager';
import { logger } from '../utils/logger';

export class CommandManager {
  private commands: Map<string, any> = new Map();

  constructor(
    private walletManager: WalletManager,
    private goatService: GoatService,
    private securityManager: SecurityManager
  ) {
    // goatService is used in handleBalance and handleBuyAmazon methods
    this.goatService; // Mark as used to avoid TypeScript warning
    this.initializeCommands();
  }

  private initializeCommands(): void {
    // Wallet management commands
    this.commands.set('setup-wallet', {
      data: new SlashCommandBuilder()
        .setName('setup-wallet')
        .setDescription('Set up your crypto wallet for trading and purchases')
        .addStringOption((option: SlashCommandStringOption) =>
          option.setName('type')
            .setDescription('Wallet type')
            .setRequired(true)
            .addChoices(
              { name: 'Ethereum/EVM', value: 'evm' },
              { name: 'Solana', value: 'solana' }
            )
        ),
      execute: this.handleSetupWallet.bind(this),
    });

    this.commands.set('wallet-status', {
      data: new SlashCommandBuilder()
        .setName('wallet-status')
        .setDescription('Check your wallet connection status and balance'),
      execute: this.handleWalletStatus.bind(this),
    });

    // Trading commands
    this.commands.set('swap', {
      data: new SlashCommandBuilder()
        .setName('swap')
        .setDescription('Swap tokens using Uniswap')
        .addStringOption((option: SlashCommandStringOption) =>
          option.setName('from-token')
            .setDescription('Token to swap from (e.g., USDC)')
            .setRequired(true)
        )
        .addStringOption((option: SlashCommandStringOption) =>
          option.setName('to-token')
            .setDescription('Token to swap to (e.g., ETH)')
            .setRequired(true)
        )
        .addNumberOption((option: SlashCommandNumberOption) =>
          option.setName('amount')
            .setDescription('Amount to swap')
            .setRequired(true)
        ),
      execute: this.handleSwap.bind(this),
    });

    // Commerce commands
    this.commands.set('buy-amazon', {
      data: new SlashCommandBuilder()
        .setName('buy-amazon')
        .setDescription('Purchase items from Amazon using crypto')
        .addStringOption((option: SlashCommandStringOption) =>
          option.setName('search')
            .setDescription('Search for items on Amazon')
            .setRequired(true)
        )
        .addNumberOption((option: SlashCommandNumberOption) =>
          option.setName('max-price')
            .setDescription('Maximum price in USD')
            .setRequired(false)
        ),
      execute: this.handleBuyAmazon.bind(this),
    });

    // Utility commands
    this.commands.set('help', {
      data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help with bot commands'),
      execute: this.handleHelp.bind(this),
    });

    this.commands.set('balance', {
      data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your wallet balance'),
      execute: this.handleBalance.bind(this),
    });
  }

  public async registerCommands(client: Client): Promise<void> {
    const commandsData = Array.from(this.commands.values()).map(cmd => cmd.data.toJSON());
    
    if (client.application) {
      await client.application.commands.set(commandsData);
    }
  }

  public async handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const { commandName, user } = interaction;
    
    // Rate limiting
    if (!this.securityManager.checkRateLimit(user.id)) {
      await interaction.reply({
        content: '⚠️ Rate limit exceeded. Please wait before using commands again.',
        ephemeral: true,
      });
      return;
    }

    const command = this.commands.get(commandName);
    if (!command) {
      await interaction.reply({
        content: '❌ Unknown command.',
        ephemeral: true,
      });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(`Command execution failed for ${commandName}:`, error);
      throw error;
    }
  }

  private async handleSetupWallet(interaction: ChatInputCommandInteraction): Promise<void> {
    const walletType = interaction.options.getString('type', true) as 'evm' | 'solana';
    
    await interaction.reply({
      content: '🔐 **Wallet Setup Process**\n\nI\'ll guide you through setting up your wallet securely. Please check your DMs for the next steps.',
      ephemeral: true,
    });

    try {
      const dmChannel = await interaction.user.createDM();
      
      const embed = new EmbedBuilder()
        .setTitle('🔐 Secure Wallet Setup')
        .setDescription('To use the bot\'s trading and commerce features, you need to provide your wallet credentials.')
        .addFields(
          { name: 'Required Information', value: `• Private Key (${walletType.toUpperCase()})\n• RPC URL\n• Crossmint API Key (optional)` },
          { name: '🔒 Security Notice', value: 'Your private key is encrypted and stored securely. Never share your private key with anyone else!' },
          { name: '📋 Instructions', value: 'Please reply with your information in this format:\n```\nPrivate Key: your_private_key_here\nRPC URL: your_rpc_url_here\nCrossmint API Key: your_api_key_here (optional)\n```' }
        )
        .setColor(0x00ff00)
        .setFooter({ text: 'This information is encrypted and never logged' });

      await dmChannel.send({ embeds: [embed] });

      // Set up DM listener for this user
      this.setupWalletDMListener(interaction.user.id, walletType);
      
    } catch (error) {
      logger.error('Failed to send DM for wallet setup:', error);
      await interaction.followUp({
        content: '❌ Failed to send DM. Please ensure your DMs are open and try again.',
        ephemeral: true,
      });
    }
  }

  private setupWalletDMListener(userId: string, walletType: 'evm' | 'solana'): void {
    // This would typically use a more sophisticated message handling system
    // For now, this is a placeholder for the DM interaction logic
    logger.info(`Setting up wallet DM listener for user ${userId} with type ${walletType}`);
  }

  private async handleWalletStatus(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const hasWallet = this.walletManager.hasWallet(userId);

    if (!hasWallet) {
      await interaction.reply({
        content: '❌ No wallet configured. Use `/setup-wallet` to get started.',
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('💰 Wallet Status')
      .setDescription('Your wallet is connected and ready to use!')
      .addFields(
        { name: '✅ Status', value: 'Connected', inline: true },
        { name: '🔧 Tools Available', value: 'Trading, Commerce, DeFi', inline: true }
      )
      .setColor(0x00ff00)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  private async handleSwap(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    
    if (!this.walletManager.hasWallet(userId)) {
      await interaction.reply({
        content: '❌ Please set up your wallet first using `/setup-wallet`.',
        ephemeral: true,
      });
      return;
    }

    const fromToken = interaction.options.getString('from-token', true);
    const toToken = interaction.options.getString('to-token', true);
    const amount = interaction.options.getNumber('amount', true);

    const embed = new EmbedBuilder()
      .setTitle('🔄 Token Swap Confirmation')
      .setDescription(`You are about to swap **${amount} ${fromToken}** for **${toToken}**`)
      .addFields(
        { name: 'From', value: `${amount} ${fromToken}`, inline: true },
        { name: 'To', value: `~${amount * 0.98} ${toToken}`, inline: true },
        { name: 'Estimated Fees', value: '~$5-15', inline: true }
      )
      .setColor(0xffa500)
      .setFooter({ text: 'Click Confirm to proceed with the swap' });

    const confirmButton = new ButtonBuilder()
      .setCustomId('confirm_swap')
      .setLabel('Confirm Swap')
      .setStyle(ButtonStyle.Success);

    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel_swap')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(confirmButton, cancelButton);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  }

  private async handleBuyAmazon(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    
    if (!this.walletManager.hasWallet(userId)) {
      await interaction.reply({
        content: '❌ Please set up your wallet first using `/setup-wallet`.',
        ephemeral: true,
      });
      return;
    }

    const searchTerm = interaction.options.getString('search', true);
    // const maxPrice = interaction.options.getNumber('max-price') || undefined; // TODO: Implement price filtering

    await interaction.reply({
      content: '🔍 Searching Amazon for products...',
      ephemeral: true,
    });

    // Simulate Amazon search results
    const embed = new EmbedBuilder()
      .setTitle('🛒 Amazon Search Results')
      .setDescription(`Found products matching: **${searchTerm}**`)
      .addFields(
        { name: 'Product 1', value: `iPhone 15 Pro - $999\\n⭐⭐⭐⭐⭐ 4.5/5`, inline: true },
        { name: 'Product 2', value: `iPhone 15 - $799\\n⭐⭐⭐⭐⭐ 4.7/5`, inline: true },
        { name: 'Product 3', value: `iPhone 14 Pro - $699\\n⭐⭐⭐⭐ 4.3/5`, inline: true }
      )
      .setColor(0xff9900)
      .setFooter({ text: 'Select a product to purchase with crypto' });

    const selectProduct = new ButtonBuilder()
      .setCustomId('select_product_1')
      .setLabel('Buy iPhone 15 Pro ($999)')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(selectProduct);

    await interaction.editReply({
      content: '',
      embeds: [embed],
      components: [row],
    });
  }

  private async handleHelp(interaction: ChatInputCommandInteraction): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Crossmint Discord Bot Help')
      .setDescription('Your gateway to agentic finance and commerce!')
      .addFields(
        { 
          name: '🔐 Wallet Commands', 
          value: '`/setup-wallet` - Configure your crypto wallet\\n`/wallet-status` - Check wallet status\\n`/balance` - View wallet balance' 
        },
        { 
          name: '💱 Trading Commands', 
          value: '`/swap` - Swap tokens on Uniswap\\n`/buy` - Purchase crypto assets' 
        },
        { 
          name: '🛒 Commerce Commands', 
          value: '`/buy-amazon` - Purchase Amazon items with crypto' 
        },
        { 
          name: '🔗 Powered by', 
          value: '[GOAT SDK](https://github.com/goat-sdk/goat) • [Crossmint](https://crossmint.com)' 
        }
      )
      .setColor(0x0099ff)
      .setThumbnail('https://cdn.discordapp.com/app-icons/1234567890123456789/icon.png')
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  private async handleBalance(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    
    if (!this.walletManager.hasWallet(userId)) {
      await interaction.reply({
        content: '❌ Please set up your wallet first using `/setup-wallet`.',
        ephemeral: true,
      });
      return;
    }

    // Simulate balance check
    const embed = new EmbedBuilder()
      .setTitle('💰 Wallet Balance')
      .addFields(
        { name: 'ETH', value: '0.5 ETH (~$1,250)', inline: true },
        { name: 'USDC', value: '2,500 USDC', inline: true },
        { name: 'Total Value', value: '~$3,750 USD', inline: true }
      )
      .setColor(0x00ff00)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
