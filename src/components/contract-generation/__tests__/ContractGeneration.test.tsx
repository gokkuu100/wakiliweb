// Test file for Contract Generation Components
// This can be used to test the components in isolation

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import ContractCreationFlow from '../ContractCreationFlow';
import Step1InitialPrompt from '../steps/Step1InitialPrompt';
import { Step1Data, AIAnalysisResult } from '../types';

// Mock data for testing
const mockAIAnalysis: AIAnalysisResult = {
  can_handle: true,
  suggested_templates: [
    {
      id: 'nda-template-1',
      template_name: 'Non-Disclosure Agreement',
      contract_type: 'nda',
      description: 'Standard NDA template for business confidentiality',
      keywords: ['confidentiality', 'non-disclosure', 'secret'],
      use_cases: ['Business partnerships', 'Employee contracts'],
      mandatory_clauses: {},
      optional_clauses: {},
      is_active: true,
      match_percentage: 85
    }
  ],
  confidence_scores: { 'nda-template-1': 85 },
  reasoning: 'Based on your description, a Non-Disclosure Agreement would be most appropriate',
  extracted_keywords: ['confidentiality', 'business', 'contract'],
  ai_analysis_timestamp: new Date().toISOString(),
  user_prompt: 'I need a contract to protect business confidentiality'
};

const mockStep1Data: Step1Data = {
  user_prompt: 'I need a contract to protect business confidentiality',
  ai_analysis: mockAIAnalysis
};

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Contract Generation Components', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Step1InitialPrompt', () => {
    it('renders initial prompt step correctly', () => {
      const mockOnComplete = jest.fn();
      const mockOnSessionCreated = jest.fn();

      render(
        <Step1InitialPrompt
          data={mockStep1Data}
          onComplete={mockOnComplete}
          onSessionCreated={mockOnSessionCreated}
          loading={false}
        />
      );

      expect(screen.getByText('Describe Your Contract Needs')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Describe your contract needs in detail...')).toBeInTheDocument();
    });

    it('validates minimum character requirement', () => {
      const mockOnComplete = jest.fn();
      const mockOnSessionCreated = jest.fn();

      render(
        <Step1InitialPrompt
          data={{ user_prompt: '' }}
          onComplete={mockOnComplete}
          onSessionCreated={mockOnSessionCreated}
          loading={false}
        />
      );

      const analyzeButton = screen.getByText('Analyze Requirements');
      fireEvent.click(analyzeButton);

      expect(screen.getByText(/Please provide a more detailed description/)).toBeInTheDocument();
    });

    it('calls API when analyzing valid prompt', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAIAnalysis,
      });

      const mockOnComplete = jest.fn();
      const mockOnSessionCreated = jest.fn();

      render(
        <Step1InitialPrompt
          data={{ user_prompt: '' }}
          onComplete={mockOnComplete}
          onSessionCreated={mockOnSessionCreated}
          loading={false}
        />
      );

      const textarea = screen.getByPlaceholderText('Describe your contract needs in detail...');
      fireEvent.change(textarea, { 
        target: { value: 'I need a comprehensive non-disclosure agreement for my business' }
      });

      const analyzeButton = screen.getByText('Analyze Requirements');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/contract-generation/analyze-prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({
            user_prompt: 'I need a comprehensive non-disclosure agreement for my business'
          })
        });
      });
    });

    it('displays AI analysis results', async () => {
      const mockOnComplete = jest.fn();
      const mockOnSessionCreated = jest.fn();

      render(
        <Step1InitialPrompt
          data={mockStep1Data}
          onComplete={mockOnComplete}
          onSessionCreated={mockOnSessionCreated}
          loading={false}
        />
      );

      expect(screen.getByText('AI Analysis Results')).toBeInTheDocument();
      expect(screen.getByText('Non-Disclosure Agreement')).toBeInTheDocument();
      expect(screen.getByText('85% match')).toBeInTheDocument();
    });
  });

  describe('ContractCreationFlow', () => {
    it('renders the main flow component', () => {
      render(<ContractCreationFlow />);

      expect(screen.getByText('Create Legal Contract')).toBeInTheDocument();
      expect(screen.getByText('AI-powered contract generation for Kenyan legal standards')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    });

    it('shows progress correctly', () => {
      render(<ContractCreationFlow />);

      // Check if all step indicators are present
      expect(screen.getByText('Initial Prompt')).toBeInTheDocument();
      expect(screen.getByText('Template Selection')).toBeInTheDocument();
      expect(screen.getByText('Clause Creation')).toBeInTheDocument();
      expect(screen.getByText('Custom Clauses')).toBeInTheDocument();
      expect(screen.getByText('Final Review')).toBeInTheDocument();
    });

    it('handles step navigation correctly', () => {
      render(<ContractCreationFlow />);

      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled(); // Should be disabled on first step
    });
  });

  describe('Utility Functions', () => {
    it('validates step 1 data correctly', () => {
      const { validateStep1Data } = require('../utils');

      // Valid input
      const validResult = validateStep1Data('This is a valid prompt with enough characters');
      expect(validResult.isValid).toBe(true);

      // Invalid input - too short
      const invalidResult = validateStep1Data('short');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('more detailed description');

      // Empty input
      const emptyResult = validateStep1Data('');
      expect(emptyResult.isValid).toBe(false);
    });

    it('calculates progress correctly', () => {
      const { calculateStepProgress } = require('../utils');

      expect(calculateStepProgress(1, 5)).toBe(0);
      expect(calculateStepProgress(3, 5)).toBe(50);
      expect(calculateStepProgress(5, 5)).toBe(100);
    });

    it('formats contract types correctly', () => {
      const { formatContractType } = require('../utils');

      expect(formatContractType('nda')).toBe('Nda');
      expect(formatContractType('service_agreement')).toBe('Service Agreement');
      expect(formatContractType('employment_contract')).toBe('Employment Contract');
    });
  });
});

// Integration test for the complete workflow
describe('Contract Generation Workflow Integration', () => {
  it('completes the full contract creation workflow', async () => {
    // Mock all API responses
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAIAnalysis,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          session_id: 'mock-session-id',
          current_step: 2,
          template: mockAIAnalysis.suggested_templates[0]
        }),
      });

    const mockOnComplete = jest.fn();
    
    render(<ContractCreationFlow onComplete={mockOnComplete} />);

    // Step 1: Enter prompt and analyze
    const textarea = screen.getByPlaceholderText('Describe your contract needs in detail...');
    fireEvent.change(textarea, { 
      target: { value: 'I need a comprehensive non-disclosure agreement for my business' }
    });

    const analyzeButton = screen.getByText('Analyze Requirements');
    fireEvent.click(analyzeButton);

    // Wait for AI analysis results
    await waitFor(() => {
      expect(screen.getByText('AI Analysis Results')).toBeInTheDocument();
    });

    // Continue to template selection
    const continueButton = screen.getByText('Continue to Template Selection');
    fireEvent.click(continueButton);

    // Verify API calls were made
    expect(fetch).toHaveBeenCalledWith('/api/contract-generation/analyze-prompt', 
      expect.objectContaining({
        method: 'POST'
      })
    );
  });
});

export default {};
