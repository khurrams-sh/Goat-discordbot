import crypto from 'crypto';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export class SecurityManager {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;

  /**
   * Encrypt sensitive data
   */
  public async encrypt(text: string): Promise<string> {
    try {
      const key = crypto.scryptSync(config.security.encryptionKey, 'salt', this.keyLength);
      const iv = crypto.randomBytes(this.ivLength);

      const cipher = crypto.createCipherGCM(this.algorithm, key, iv);
      cipher.setAAD(Buffer.from('crossmint-discord-bot'));

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get the auth tag for GCM mode
      const tag = cipher.getAuthTag();

      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  public async decrypt(encryptedData: string): Promise<string> {
    try {
      const [ivHex, tagHex, encrypted] = encryptedData.split(':');
      if (!ivHex || !tagHex || !encrypted) {
        throw new Error('Invalid encrypted data format');
      }

      const key = crypto.scryptSync(config.security.encryptionKey, 'salt', this.keyLength);
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');

      const decipher = crypto.createDecipherGCM(this.algorithm, key, iv);
      decipher.setAAD(Buffer.from('crossmint-discord-bot'));
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash data for storage/comparison
   */
  public hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate secure random string
   */
  public generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate Discord user ID format
   */
  public validateDiscordUserId(userId: string): boolean {
    // Discord user IDs are 17-19 digit snowflakes
    return /^\d{17,19}$/.test(userId);
  }

  /**
   * Sanitize user input
   */
  public sanitizeInput(input: string): string {
    // Remove potential malicious characters
    return input.replace(/[<>\"'%;()&+]/g, '');
  }

  /**
   * Validate wallet address format
   */
  public validateWalletAddress(address: string, type: 'evm' | 'solana'): boolean {
    switch (type) {
      case 'evm':
        // Ethereum address: 42 characters starting with 0x
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      case 'solana':
        // Solana address: 32-44 characters, base58
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
      default:
        return false;
    }
  }

  /**
   * Rate limiting check (simple in-memory implementation)
   */
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  public checkRateLimit(userId: string, limit: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const userLimit = this.rateLimitMap.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      this.rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (userLimit.count >= limit) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  /**
   * Clean up expired rate limit entries
   */
  public cleanupRateLimits(): void {
    const now = Date.now();
    for (const [userId, data] of this.rateLimitMap.entries()) {
      if (now > data.resetTime) {
        this.rateLimitMap.delete(userId);
      }
    }
  }
}
