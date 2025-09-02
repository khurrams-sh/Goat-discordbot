import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { SecurityManager } from './SecurityManager';
import { UserWallet, WalletProvider } from '../types/wallet';
import { GoatService } from './GoatService';

export class WalletManager {
  private wallets: Map<string, UserWallet> = new Map();
  private securityManager: SecurityManager;
  private goatService: GoatService;

  constructor() {
    this.securityManager = new SecurityManager();
    this.goatService = new GoatService();
  }

  /**
   * Register a new wallet for a user
   */
  public async registerWallet(userId: string, walletProvider: WalletProvider): Promise<boolean> {
    try {
      // Derive wallet address from private key for EVM wallets
      let walletAddress = walletProvider.address;
      if (walletProvider.type === 'evm' && !walletAddress) {
        const wallet = new ethers.Wallet(walletProvider.privateKey);
        walletAddress = wallet.address;
        logger.info(`Derived wallet address: ${walletAddress}`);
      }

      // Encrypt sensitive data before storing
      const encryptedPrivateKey = await this.securityManager.encrypt(walletProvider.privateKey);
      const encryptedCrossmintKey = walletProvider.crossmintApiKey
        ? await this.securityManager.encrypt(walletProvider.crossmintApiKey)
        : undefined;

      const completeWalletProvider: WalletProvider = {
        ...walletProvider,
        privateKey: encryptedPrivateKey,
        crossmintApiKey: encryptedCrossmintKey,
        address: walletAddress,
      };

      const userWallet: UserWallet = {
        userId,
        walletProvider: completeWalletProvider,
        isActive: true,
        createdAt: new Date(),
        lastUsed: new Date(),
      };

      this.wallets.set(userId, userWallet);

      // Initialize GOAT tools for this user
      try {
        await this.goatService.initializeTools({
          walletProvider: {
            ...walletProvider,
            address: walletAddress,
          },
          plugins: ['erc20', 'uniswap', 'crossmint']
        });
        logger.info(`GOAT tools initialized for user ${userId}`);
      } catch (goatError) {
        logger.error(`Failed to initialize GOAT tools for user ${userId}:`, goatError);
        // Don't fail wallet registration if GOAT initialization fails
      }

      logger.info(`Wallet registered for user ${userId} with address ${walletAddress}`);
      return true;
    } catch (error) {
      logger.error(`Failed to register wallet for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get decrypted wallet for a user
   */
  public async getWallet(userId: string): Promise<WalletProvider | null> {
    try {
      const userWallet = this.wallets.get(userId);
      if (!userWallet || !userWallet.isActive) {
        return null;
      }

      // Decrypt sensitive data
      const decryptedPrivateKey = await this.securityManager.decrypt(userWallet.walletProvider.privateKey);
      const decryptedCrossmintKey = userWallet.walletProvider.crossmintApiKey
        ? await this.securityManager.decrypt(userWallet.walletProvider.crossmintApiKey)
        : undefined;

      // Update last used timestamp
      userWallet.lastUsed = new Date();

      return {
        ...userWallet.walletProvider,
        privateKey: decryptedPrivateKey,
        crossmintApiKey: decryptedCrossmintKey,
      };
    } catch (error) {
      logger.error(`Failed to get wallet for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Check if user has a registered wallet
   */
  public hasWallet(userId: string): boolean {
    const userWallet = this.wallets.get(userId);
    return userWallet?.isActive ?? false;
  }

  /**
   * Remove wallet for a user
   */
  public async removeWallet(userId: string): Promise<boolean> {
    try {
      const userWallet = this.wallets.get(userId);
      if (userWallet) {
        userWallet.isActive = false;
        logger.info(`Wallet removed for user ${userId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Failed to remove wallet for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Update wallet configuration
   */
  public async updateWallet(userId: string, updates: Partial<WalletProvider>): Promise<boolean> {
    try {
      const userWallet = this.wallets.get(userId);
      if (!userWallet || !userWallet.isActive) {
        return false;
      }

      // Encrypt any sensitive updates
      if (updates.privateKey) {
        updates.privateKey = await this.securityManager.encrypt(updates.privateKey);
      }
      if (updates.crossmintApiKey) {
        updates.crossmintApiKey = await this.securityManager.encrypt(updates.crossmintApiKey);
      }

      userWallet.walletProvider = {
        ...userWallet.walletProvider,
        ...updates,
      };

      logger.info(`Wallet updated for user ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to update wallet for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get wallet statistics
   */
  public getStats(): { totalWallets: number; activeWallets: number } {
    const totalWallets = this.wallets.size;
    const activeWallets = Array.from(this.wallets.values()).filter(w => w.isActive).length;
    
    return { totalWallets, activeWallets };
  }

  /**
   * Validate wallet provider configuration
   */
  public validateWalletProvider(provider: WalletProvider): boolean {
    try {
      // Basic validation
      if (!provider.type || !provider.privateKey || !provider.rpcUrl) {
        return false;
      }

      // Type-specific validation
      switch (provider.type) {
        case 'evm':
          return this.validateEvmWallet(provider);
        case 'solana':
          return this.validateSolanaWallet(provider);
        default:
          return false;
      }
    } catch (error) {
      logger.error('Wallet provider validation failed:', error);
      return false;
    }
  }

  private validateEvmWallet(provider: WalletProvider): boolean {
    // Validate EVM private key format (64 hex characters)
    const privateKeyRegex = /^[0-9a-fA-F]{64}$/;
    return privateKeyRegex.test(provider.privateKey.replace('0x', ''));
  }

  private validateSolanaWallet(provider: WalletProvider): boolean {
    // Validate Solana private key format (base58 encoded)
    return provider.privateKey.length >= 32;
  }
}
