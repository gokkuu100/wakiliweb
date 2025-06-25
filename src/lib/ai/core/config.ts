/**
 * AI Configuration Service
 * Centralized configuration for AI models, costs, and operational settings
 */

export interface AIModelConfig {
  model: string;
  costPer1kInputTokens: number;  // USD
  costPer1kOutputTokens: number; // USD
  contextWindow: number;
  maxOutputTokens: number;
  supportedFeatures: string[];
  defaultTemperature: number;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface AIFeatureConfig {
  chat: {
    maxContextMessages: number;
    defaultModel: string;
    maxResponseTokens: number;
    enableKnowledgeBase: boolean;
    enableCitations: boolean;
  };
  contracts: {
    defaultModel: string;
    maxSteps: number;
    enableTemplates: boolean;
    requireReview: boolean;
  };
  documents: {
    supportedFormats: string[];
    maxFileSizeMB: number;
    enableOCR: boolean;
    analysisTypes: string[];
  };
  knowledgeBase: {
    chunkSize: number;
    chunkOverlap: number;
    embeddingModel: string;
    maxRetrievedDocs: number;
    similarityThreshold: number;
  };
}

export class AIConfigService {
  private static instance: AIConfigService;
  private modelConfigs: Map<string, AIModelConfig> = new Map();
  private featureConfig!: AIFeatureConfig;

  constructor() {
    this.initializeModelConfigs();
    this.initializeFeatureConfig();
  }

  static getInstance(): AIConfigService {
    if (!AIConfigService.instance) {
      AIConfigService.instance = new AIConfigService();
    }
    return AIConfigService.instance;
  }

  private initializeModelConfigs(): void {
    // OpenAI GPT-4 models
    this.modelConfigs.set('gpt-4', {
      model: 'gpt-4',
      costPer1kInputTokens: 0.03,
      costPer1kOutputTokens: 0.06,
      contextWindow: 8192,
      maxOutputTokens: 4096,
      supportedFeatures: ['chat', 'contracts', 'analysis', 'research'],
      defaultTemperature: 0.7,
      rateLimit: {
        requestsPerMinute: 200,
        tokensPerMinute: 40000
      }
    });

    this.modelConfigs.set('gpt-4-turbo', {
      model: 'gpt-4-turbo',
      costPer1kInputTokens: 0.01,
      costPer1kOutputTokens: 0.03,
      contextWindow: 128000,
      maxOutputTokens: 4096,
      supportedFeatures: ['chat', 'contracts', 'analysis', 'research', 'large_documents'],
      defaultTemperature: 0.7,
      rateLimit: {
        requestsPerMinute: 500,
        tokensPerMinute: 150000
      }
    });

    this.modelConfigs.set('gpt-3.5-turbo', {
      model: 'gpt-3.5-turbo',
      costPer1kInputTokens: 0.0015,
      costPer1kOutputTokens: 0.002,
      contextWindow: 16385,
      maxOutputTokens: 4096,
      supportedFeatures: ['chat', 'basic_analysis'],
      defaultTemperature: 0.7,
      rateLimit: {
        requestsPerMinute: 1000,
        tokensPerMinute: 90000
      }
    });

    // Embedding models
    this.modelConfigs.set('text-embedding-3-large', {
      model: 'text-embedding-3-large',
      costPer1kInputTokens: 0.00013,
      costPer1kOutputTokens: 0,
      contextWindow: 8191,
      maxOutputTokens: 0,
      supportedFeatures: ['embeddings', 'search'],
      defaultTemperature: 0
    });

    this.modelConfigs.set('text-embedding-3-small', {
      model: 'text-embedding-3-small',
      costPer1kInputTokens: 0.00002,
      costPer1kOutputTokens: 0,
      contextWindow: 8191,
      maxOutputTokens: 0,
      supportedFeatures: ['embeddings', 'search'],
      defaultTemperature: 0
    });
  }

  private initializeFeatureConfig(): void {
    this.featureConfig = {
      chat: {
        maxContextMessages: 20,
        defaultModel: process.env.NODE_ENV === 'production' ? 'gpt-4-turbo' : 'gpt-3.5-turbo',
        maxResponseTokens: 2048,
        enableKnowledgeBase: true,
        enableCitations: true
      },
      contracts: {
        defaultModel: 'gpt-4-turbo',
        maxSteps: 10,
        enableTemplates: true,
        requireReview: true
      },
      documents: {
        supportedFormats: ['pdf', 'docx', 'txt', 'rtf'],
        maxFileSizeMB: 50,
        enableOCR: false, // TODO: Add OCR capability
        analysisTypes: ['summary', 'legal_review', 'risk_assessment', 'compliance_check']
      },
      knowledgeBase: {
        chunkSize: 1000,
        chunkOverlap: 200,
        embeddingModel: 'text-embedding-3-large',
        maxRetrievedDocs: 5,
        similarityThreshold: 0.7
      }
    };
  }

  /**
   * Get model configuration
   */
  getModelConfig(model: string): AIModelConfig | undefined {
    return this.modelConfigs.get(model);
  }

  /**
   * Get all available models
   */
  getAvailableModels(): AIModelConfig[] {
    return Array.from(this.modelConfigs.values());
  }

  /**
   * Get models by feature
   */
  getModelsByFeature(feature: string): AIModelConfig[] {
    return Array.from(this.modelConfigs.values())
      .filter(config => config.supportedFeatures.includes(feature));
  }

  /**
   * Get feature configuration
   */
  getFeatureConfig(): AIFeatureConfig {
    return this.featureConfig;
  }

  /**
   * Calculate cost for token usage
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number = 0): number {
    const config = this.modelConfigs.get(model);
    if (!config) {
      console.warn(`Model config not found for: ${model}`);
      return 0;
    }

    const inputCost = (inputTokens / 1000) * config.costPer1kInputTokens;
    const outputCost = (outputTokens / 1000) * config.costPer1kOutputTokens;
    
    return Number((inputCost + outputCost).toFixed(6));
  }

  /**
   * Get optimal model for a given task and token count
   */
  getOptimalModel(
    feature: string, 
    estimatedTokens: number = 0,
    prioritizeCost: boolean = false
  ): string {
    const availableModels = this.getModelsByFeature(feature)
      .filter(config => estimatedTokens <= config.contextWindow);

    if (availableModels.length === 0) {
      console.warn(`No models available for feature: ${feature} with ${estimatedTokens} tokens`);
      return 'gpt-3.5-turbo';
    }

    if (prioritizeCost) {
      // Sort by cost (input tokens cost since that's most common)
      return availableModels
        .sort((a, b) => a.costPer1kInputTokens - b.costPer1kInputTokens)[0].model;
    } else {
      // Prefer higher quality models
      const modelPriority = ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
      for (const model of modelPriority) {
        const found = availableModels.find(config => config.model === model);
        if (found) return found.model;
      }
      return availableModels[0].model;
    }
  }

  /**
   * Check if user is within rate limits
   */
  isWithinRateLimit(model: string, requestsInLastMinute: number, tokensInLastMinute: number): {
    allowed: boolean;
    reason?: string;
  } {
    const config = this.modelConfigs.get(model);
    if (!config || !config.rateLimit) {
      return { allowed: true };
    }

    if (requestsInLastMinute >= config.rateLimit.requestsPerMinute) {
      return { 
        allowed: false, 
        reason: `Rate limit exceeded: ${requestsInLastMinute}/${config.rateLimit.requestsPerMinute} requests per minute` 
      };
    }

    if (tokensInLastMinute >= config.rateLimit.tokensPerMinute) {
      return { 
        allowed: false, 
        reason: `Token rate limit exceeded: ${tokensInLastMinute}/${config.rateLimit.tokensPerMinute} tokens per minute` 
      };
    }

    return { allowed: true };
  }

  /**
   * Get environment-specific configurations
   */
  getEnvironmentConfig(): {
    isProduction: boolean;
    defaultModel: string;
    enableAnalytics: boolean;
    enableCaching: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  } {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      isProduction,
      defaultModel: isProduction ? 'gpt-4-turbo' : 'gpt-3.5-turbo',
      enableAnalytics: true,
      enableCaching: isProduction,
      logLevel: isProduction ? 'warn' : 'debug'
    };
  }

  /**
   * Validate API keys and configuration
   */
  validateConfiguration(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required environment variables
    if (!process.env.OPENAI_API_KEY) {
      errors.push('Missing OPENAI_API_KEY environment variable');
    }

    if (!process.env.PINECONE_API_KEY) {
      warnings.push('Missing PINECONE_API_KEY - knowledge base features will be disabled');
    }

    if (!process.env.PINECONE_ENVIRONMENT) {
      warnings.push('Missing PINECONE_ENVIRONMENT - knowledge base features will be disabled');
    }

    if (!process.env.PINECONE_INDEX_NAME) {
      warnings.push('Missing PINECONE_INDEX_NAME - knowledge base features will be disabled');
    }

    // Check model configurations
    if (this.modelConfigs.size === 0) {
      errors.push('No model configurations loaded');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Export singleton instance
export const aiConfig = AIConfigService.getInstance();
