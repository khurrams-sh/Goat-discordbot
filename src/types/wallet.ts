export interface WalletProvider {
  type: 'evm' | 'solana' | 'cosmos' | 'fuel' | 'radix';
  privateKey: string;
  rpcUrl: string;
  crossmintApiKey?: string;
  address?: string;
  chainId?: number;
}

export interface UserWallet {
  userId: string;
  walletProvider: WalletProvider;
  isActive: boolean;
  createdAt: Date;
  lastUsed: Date;
}

export interface TransactionRequest {
  toolName: string;
  parameters: Record<string, any>;
  userId: string;
  confirmationRequired: boolean;
}

export interface TransactionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  gasUsed?: string;
  blockNumber?: number;
  timestamp: Date;
}
