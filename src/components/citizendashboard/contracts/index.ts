/**
 * Contract Generation Components - Index
 * Centralized exports for all contract generation components
 */

// Main Layout and Context
export { ContractGenerationLayout } from './ContractGenerationLayout';
export { useContractGeneration, ContractGenerationProvider, WORKFLOW_STEPS } from './ContractGenerationContext';

// Supporting Components
export { AIAssistantPanel } from './AIAssistantPanel';
export { ContractSidebar } from './ContractSidebar';

// Step Components
export {
  UserInputStep,
  TemplateSelectionStep,
  ContractDetailsStep,
  MandatoryClausesStep,
  OptionalClausesStep,
  RecipientStep,
  FinalReviewStep,
  SignatureStep
} from './steps';

// API and Types
export * from './contractsApi';
