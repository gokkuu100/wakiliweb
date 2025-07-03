/**
 * Contract Generation Steps - Index Export
 * Centralized export for all step components
 */

// Re-export all step components
export { UserInputStep } from './UserInputStep';
export { TemplateSelectionStep } from './TemplateSelectionStep';
export { default as ContractDetailsStep } from './ContractDetailsStep';
export { default as MandatoryClausesStep } from './MandatoryClausesStep';
export { default as OptionalClausesStep } from './OptionalClausesStep';
export { default as RecipientStep } from './RecipientStep';
export { default as FinalReviewStep } from './FinalReviewStep';
export { default as SignatureStep } from './SignatureStep';

// Import for mapping
import { UserInputStep } from './UserInputStep';
import { TemplateSelectionStep } from './TemplateSelectionStep';
import ContractDetailsStep from './ContractDetailsStep';
import MandatoryClausesStep from './MandatoryClausesStep';
import OptionalClausesStep from './OptionalClausesStep';
import RecipientStep from './RecipientStep';
import FinalReviewStep from './FinalReviewStep';
import SignatureStep from './SignatureStep';

// Step component mapping for dynamic rendering
export const stepComponents = {
  UserInputStep,
  TemplateSelectionStep,
  ContractDetailsStep,
  MandatoryClausesStep,
  OptionalClausesStep,
  RecipientStep,
  FinalReviewStep,
  SignatureStep,
};

// Get step component by name
export const getStepComponent = (stepName: string) => {
  return stepComponents[stepName as keyof typeof stepComponents];
};
