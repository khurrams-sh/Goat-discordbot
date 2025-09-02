import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config/environment';
import { logger } from './utils/logger';
import { CommandManager } from './commands/CommandManager';
import { WalletManager } from './services/WalletManager';
import { GoatService } from './services/GoatService';
import { SecurityManager } from './services/SecurityManager';

export class DiscordBot {
  private client: Client;
  private commandManager: CommandManager;
  private walletManager: WalletManager;
  private goatService: GoatService;
  private securityManager: SecurityManager;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
    });

    this.securityManager = new SecurityManager();
    this.walletManager = new WalletManager();
    this.goatService = new GoatService();
    this.commandManager = new CommandManager(
      this.walletManager,
      this.goatService,
      this.securityManager
    );

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.client.once('ready', () => {
      logger.info(`Bot logged in as ${this.client.user?.tag}`);
      this.registerCommands();
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      
      try {
        await this.commandManager.handleCommand(interaction);
      } catch (error) {
        logger.error('Error handling command:', error);
        
        const errorMessage = 'An error occurred while processing your command. Please try again.';
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      }
    });

    this.client.on('error', (error) => {
      logger.error('Discord client error:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  private async registerCommands(): Promise<void> {
    try {
      await this.commandManager.registerCommands(this.client);
      logger.info('Successfully registered application commands');
    } catch (error) {
      logger.error('Failed to register application commands:', error);
    }
  }

  public async start(): Promise<void> {
    try {
      await this.client.login(config.discord.token);
    } catch (error) {
      logger.error('Failed to start bot:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    this.client.destroy();
    logger.info('Bot stopped');
  }
}

// Start the bot
const bot = new DiscordBot();

bot.start().catch((error) => {
  logger.error('Failed to start bot:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  await bot.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await bot.stop();
  process.exit(0);
});
