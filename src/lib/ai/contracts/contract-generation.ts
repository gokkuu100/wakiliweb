import { supabase } from '@/lib/supabase';
import { aiCore } from '../core/ai-core';
import { aiTracking } from '../tracking/usage-tracking';
import type {
  ContractGenerationRequest,
  ContractGenerationSession,
  ContractGenerationStep,
  ContractAIInsight,
} from '../types';

export class ContractAIService {
  
  /**
   * Start a new contract generation session
   */
  async startContractGeneration(request: ContractGenerationRequest): Promise<ContractGenerationSession> {
    try {
      // Create AI session
      const aiSession = await aiCore.createSession(
        request.user_id,
        'contract_generation',
        {
          template_id: request.template_id,
          description: request.description,
        }
      );

      // Create contract generation session
      const { data: session, error } = await supabase
        .from('contract_generation_sessions')
        .insert({
          user_id: request.user_id,
          template_id: request.template_id,
          requirements: {
            description: request.description,
            parties: request.parties,
            initial_requirements: request.requirements,
          },
          session_data: {
            ai_session_id: aiSession.id,
            current_step: 'requirements',
            started_at: new Date().toISOString(),
          },
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      // Initialize the first step
      await this.initializeGenerationSteps(session.id, request.template_id);

      return session;
    } catch (error) {
      console.error('Error starting contract generation:', error);
      throw error;
    }
  }

  /**
   * Process a contract generation step
   */
  async processGenerationStep(
    sessionId: string,
    stepNumber: number,
    userInput: Record<string, any>
  ): Promise<{
    step: ContractGenerationStep;
    nextStep?: ContractGenerationStep;
    aiSuggestions?: any;
    insights?: ContractAIInsight[];
  }> {
    try {
      // Get current step
      const { data: currentStep } = await supabase
        .from('contract_generation_steps')
        .select('*')
        .eq('session_id', sessionId)
        .eq('step_number', stepNumber)
        .single();

      if (!currentStep) {
        throw new Error('Step not found');
      }

      // Get session context
      const { data: session } = await supabase
        .from('contract_generation_sessions')
        .select(`
          *,
          contract_templates (
            name,
            generation_steps,
            ai_prompts,
            compliance_requirements
          )
        `)
        .eq('id', sessionId)
        .single();

      if (!session) {
        throw new Error('Session not found');
      }

      // Build AI prompt for this step
      const aiPrompt = this.buildStepPrompt(currentStep, userInput, session);

      // Get AI response
      const aiResponse = await aiCore.completion({
        prompt: aiPrompt,
        user_id: session.user_id,
        session_id: session.session_data?.ai_session_id,
        context: {
          step_name: currentStep.step_name,
          user_input: userInput,
          previous_steps: await this.getCompletedSteps(sessionId),
        },
      });

      // Parse AI suggestions
      const aiSuggestions = this.parseAISuggestions(aiResponse.content, currentStep.step_name);

      // Update current step
      const updatedStep = await this.updateStep(currentStep.id, {
        step_status: 'completed',
        user_input: userInput,
        ai_response: aiResponse.content,
        ai_suggestions: aiSuggestions,
        tokens_used: aiResponse.tokens_used.total,
        processing_time_ms: aiResponse.processing_time_ms,
        completed_at: new Date().toISOString(),
      });

      // Generate AI insights for this step
      const insights = await this.generateStepInsights(sessionId, currentStep, userInput, aiSuggestions);

      // Prepare next step
      const nextStep = await this.prepareNextStep(sessionId, stepNumber + 1);

      // Update session progress
      await this.updateSessionProgress(sessionId);

      return {
        step: updatedStep,
        nextStep,
        aiSuggestions,
        insights,
      };
    } catch (error) {
      console.error('Error processing generation step:', error);
      throw error;
    }
  }

  /**
   * Get contract generation session with steps
   */
  async getGenerationSession(sessionId: string, userId: string): Promise<ContractGenerationSession | null> {
    try {
      const { data } = await supabase
        .from('contract_generation_sessions')
        .select(`
          *,
          contract_generation_steps (
            id,
            step_number,
            step_name,
            step_status,
            user_input,
            ai_suggestions,
            completed_at,
            created_at
          ),
          contract_templates (
            name,
            description,
            complexity_level,
            estimated_completion_time
          )
        `)
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      return data;
    } catch (error) {
      console.error('Error getting generation session:', error);
      return null;
    }
  }

  /**
   * Generate final contract from completed steps
   */
  async generateFinalContract(sessionId: string): Promise<{
    contractContent: string;
    insights: ContractAIInsight[];
    complianceScore: number;
    riskScore: number;
  }> {
    try {
      // Get session with all completed steps
      const session = await this.getGenerationSession(sessionId, ''); // Will need user validation

      if (!session) {
        throw new Error('Session not found');
      }

      // Compile all user inputs from steps
      const compiledData = this.compileStepData(session.steps || []);

      // Generate final contract content
      const contractPrompt = this.buildFinalContractPrompt(compiledData, session);

      const aiResponse = await aiCore.completion({
        prompt: contractPrompt,
        user_id: session.user_id,
        session_id: session.session_data?.ai_session_id,
        context: {
          step: 'final_generation',
          compiled_data: compiledData,
        },
      });

      // Parse the generated contract
      const contractContent = this.parseGeneratedContract(aiResponse.content);

      // Perform final compliance and risk analysis
      const analysis = await this.performFinalAnalysis(contractContent, compiledData);

      // Generate comprehensive insights
      const insights = await this.generateFinalInsights(sessionId, contractContent, analysis);

      // Update session with final draft
      await supabase
        .from('contract_generation_sessions')
        .update({
          current_draft: contractContent,
          completion_percentage: 100,
          status: 'completed',
        })
        .eq('id', sessionId);

      return {
        contractContent,
        insights,
        complianceScore: analysis.compliance_score,
        riskScore: analysis.risk_score,
      };
    } catch (error) {
      console.error('Error generating final contract:', error);
      throw error;
    }
  }

  /**
   * Get contract templates with AI generation capabilities
   */
  async getAIContractTemplates(): Promise<any[]> {
    try {
      const { data } = await supabase
        .from('contract_templates')
        .select(`
          id,
          name,
          description,
          category,
          complexity_level,
          estimated_completion_time,
          generation_steps,
          is_active
        `)
        .eq('is_active', true)
        .order('name');

      return data || [];
    } catch (error) {
      console.error('Error getting AI contract templates:', error);
      return [];
    }
  }

  /**
   * Analyze uploaded contract with AI
   */
  async analyzeUploadedContract(
    documentId: string,
    userId: string,
    analysisType: 'summary' | 'compliance' | 'risk' | 'full' = 'full'
  ): Promise<any> {
    try {
      // Get document content
      const { data: document } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('uploaded_by', userId)
        .single();

      if (!document) {
        throw new Error('Document not found');
      }

      // Create AI session for document analysis
      const aiSession = await aiCore.createSession(
        userId,
        'document_analysis',
        {
          document_id: documentId,
          analysis_type: analysisType,
        }
      );

      // Extract text from document (you'll need to implement this based on file type)
      const documentText = await this.extractDocumentText(document);

      // Build analysis prompt
      const analysisPrompt = this.buildDocumentAnalysisPrompt(documentText, analysisType);

      // Get AI analysis
      const aiResponse = await aiCore.completion({
        prompt: analysisPrompt,
        user_id: userId,
        session_id: aiSession.id,
        context: {
          document_type: document.type,
          analysis_type: analysisType,
        },
      });

      // Parse analysis results
      const analysis = this.parseDocumentAnalysis(aiResponse.content, analysisType);

      // Save analysis to database
      await supabase
        .from('document_legal_analysis')
        .insert({
          document_id: documentId,
          analysis_session_id: aiSession.id,
          legal_compliance_score: analysis.compliance_score,
          risk_assessment: analysis.risk_assessment,
          applicable_laws: analysis.applicable_laws,
          legal_issues_found: analysis.legal_issues,
          recommendations: analysis.recommendations,
          confidence_level: analysis.confidence_level,
          processing_time_ms: aiResponse.processing_time_ms,
          tokens_used: aiResponse.tokens_used.total,
        });

      // Complete AI session
      await aiCore.completeSession(aiSession.id);

      return analysis;
    } catch (error) {
      console.error('Error analyzing uploaded contract:', error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Initialize generation steps for a template
   */
  private async initializeGenerationSteps(sessionId: string, templateId: string): Promise<void> {
    const { data: template } = await supabase
      .from('contract_templates')
      .select('generation_steps, ai_prompts')
      .eq('id', templateId)
      .single();

    if (!template?.generation_steps) {
      // Default steps if not defined in template
      const defaultSteps = [
        { name: 'requirements', title: 'Requirements Gathering' },
        { name: 'parties', title: 'Party Information' },
        { name: 'terms', title: 'Contract Terms' },
        { name: 'clauses', title: 'Legal Clauses' },
        { name: 'review', title: 'Review & Refinement' },
        { name: 'finalize', title: 'Finalization' },
      ];

      const steps = defaultSteps.map((step, index) => ({
        session_id: sessionId,
        step_number: index + 1,
        step_name: step.name as any,
        step_status: index === 0 ? 'pending' : 'pending',
      }));

      await supabase
        .from('contract_generation_steps')
        .insert(steps);
    } else {
      // Use template-defined steps
      const steps = template.generation_steps.map((step: any, index: number) => ({
        session_id: sessionId,
        step_number: index + 1,
        step_name: step.name,
        step_status: index === 0 ? 'pending' : 'pending',
        ai_prompt: template.ai_prompts?.[step.name] || null,
      }));

      await supabase
        .from('contract_generation_steps')
        .insert(steps);
    }
  }

  /**
   * Build AI prompt for a specific step
   */
  private buildStepPrompt(
    step: ContractGenerationStep,
    userInput: Record<string, any>,
    session: any
  ): string {
    const template = session.contract_templates;
    const basePrompt = `You are helping generate a ${template.name} contract. Current step: ${step.step_name}.

TEMPLATE INFORMATION:
- Type: ${template.name}
- Compliance Requirements: ${JSON.stringify(template.compliance_requirements, null, 2)}

USER INPUT FOR THIS STEP:
${JSON.stringify(userInput, null, 2)}

INSTRUCTIONS:
1. Analyze the user input for this step
2. Provide suggestions and improvements
3. Identify any missing information
4. Flag potential legal issues
5. Ensure compliance with Kenyan law

Please provide your response in the following JSON format:
{
  "suggestions": {
    "field_improvements": {},
    "missing_information": [],
    "recommendations": []
  },
  "legal_analysis": {
    "compliance_issues": [],
    "risk_factors": [],
    "required_clauses": []
  },
  "next_step_preparation": {
    "required_information": [],
    "suggested_clauses": []
  }
}`;

    return basePrompt;
  }

  /**
   * Parse AI suggestions from response
   */
  private parseAISuggestions(content: string, stepName: string): any {
    try {
      return JSON.parse(content);
    } catch (error) {
      // Fallback parsing
      return {
        suggestions: {
          field_improvements: {},
          missing_information: [],
          recommendations: [content.substring(0, 200) + '...'],
        },
        legal_analysis: {
          compliance_issues: [],
          risk_factors: [],
          required_clauses: [],
        },
      };
    }
  }

  /**
   * Update a generation step
   */
  private async updateStep(
    stepId: string,
    updates: Partial<ContractGenerationStep>
  ): Promise<ContractGenerationStep> {
    const { data, error } = await supabase
      .from('contract_generation_steps')
      .update(updates)
      .eq('id', stepId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get completed steps for context
   */
  private async getCompletedSteps(sessionId: string): Promise<ContractGenerationStep[]> {
    const { data } = await supabase
      .from('contract_generation_steps')
      .select('*')
      .eq('session_id', sessionId)
      .eq('step_status', 'completed')
      .order('step_number');

    return data || [];
  }

  /**
   * Prepare next step
   */
  private async prepareNextStep(sessionId: string, stepNumber: number): Promise<ContractGenerationStep | undefined> {
    const { data } = await supabase
      .from('contract_generation_steps')
      .select('*')
      .eq('session_id', sessionId)
      .eq('step_number', stepNumber)
      .single();

    if (data) {
      await supabase
        .from('contract_generation_steps')
        .update({ step_status: 'pending' })
        .eq('id', data.id);

      return { ...data, step_status: 'pending' };
    }

    return undefined;
  }

  /**
   * Generate insights for a step
   */
  private async generateStepInsights(
    sessionId: string,
    step: ContractGenerationStep,
    userInput: Record<string, any>,
    aiSuggestions: any
  ): Promise<ContractAIInsight[]> {
    const insights: ContractAIInsight[] = [];

    // Extract insights from AI suggestions
    if (aiSuggestions.legal_analysis?.compliance_issues?.length > 0) {
      for (const issue of aiSuggestions.legal_analysis.compliance_issues) {
        insights.push({
          id: '', // Will be set by database
          contract_id: '', // Will be set when contract is created
          generation_session_id: sessionId,
          insight_type: 'compliance_note',
          insight_text: issue,
          severity: 'medium',
          is_addressed: false,
          created_at: new Date().toISOString(),
        });
      }
    }

    if (aiSuggestions.legal_analysis?.risk_factors?.length > 0) {
      for (const risk of aiSuggestions.legal_analysis.risk_factors) {
        insights.push({
          id: '',
          contract_id: '',
          generation_session_id: sessionId,
          insight_type: 'risk_warning',
          insight_text: risk,
          severity: 'high',
          is_addressed: false,
          created_at: new Date().toISOString(),
        });
      }
    }

    return insights;
  }

  /**
   * Update session progress
   */
  private async updateSessionProgress(sessionId: string): Promise<void> {
    const { data: steps } = await supabase
      .from('contract_generation_steps')
      .select('step_status')
      .eq('session_id', sessionId);

    if (steps) {
      const totalSteps = steps.length;
      const completedSteps = steps.filter(s => s.step_status === 'completed').length;
      const progress = Math.round((completedSteps / totalSteps) * 100);

      await supabase
        .from('contract_generation_sessions')
        .update({ completion_percentage: progress })
        .eq('id', sessionId);
    }
  }

  /**
   * Compile data from all steps
   */
  private compileStepData(steps: ContractGenerationStep[]): Record<string, any> {
    const compiledData: Record<string, any> = {};

    steps.forEach(step => {
      if (step.user_input) {
        compiledData[step.step_name] = step.user_input;
      }
    });

    return compiledData;
  }

  /**
   * Build final contract generation prompt
   */
  private buildFinalContractPrompt(compiledData: Record<string, any>, session: any): string {
    return `Generate a complete, professional ${session.contract_templates.name} contract based on the following information:

COMPILED CONTRACT DATA:
${JSON.stringify(compiledData, null, 2)}

REQUIREMENTS:
1. Use clear, professional legal language
2. Ensure compliance with Kenyan law
3. Include all necessary clauses and terms
4. Format as a complete, ready-to-sign contract
5. Include proper headers, sections, and signature blocks

Please generate the complete contract in HTML format with proper styling for professional presentation.`;
  }

  /**
   * Parse generated contract content
   */
  private parseGeneratedContract(content: string): string {
    // Clean up and format the generated contract
    return content.trim();
  }

  /**
   * Perform final analysis of generated contract
   */
  private async performFinalAnalysis(contractContent: string, compiledData: Record<string, any>) {
    // This would perform comprehensive analysis
    return {
      compliance_score: 85,
      risk_score: 25,
      issues: [],
      recommendations: [],
    };
  }

  /**
   * Generate final insights for completed contract
   */
  private async generateFinalInsights(
    sessionId: string,
    contractContent: string,
    analysis: any
  ): Promise<ContractAIInsight[]> {
    // Generate comprehensive insights for the final contract
    return [];
  }

  /**
   * Extract text from document (implement based on your needs)
   */
  private async extractDocumentText(document: any): Promise<string> {
    // This would extract text from PDF, DOCX, etc.
    // For now, return placeholder
    return 'Document text extraction not implemented yet';
  }

  /**
   * Build document analysis prompt
   */
  private buildDocumentAnalysisPrompt(documentText: string, analysisType: string): string {
    return `Analyze this legal document according to Kenyan law:

DOCUMENT CONTENT:
${documentText}

ANALYSIS TYPE: ${analysisType}

Please provide analysis including:
1. Document summary
2. Key legal issues
3. Compliance with Kenyan law
4. Risk assessment
5. Recommendations

Respond in JSON format with structured analysis.`;
  }

  /**
   * Parse document analysis results
   */
  private parseDocumentAnalysis(content: string, analysisType: string): any {
    try {
      return JSON.parse(content);
    } catch (error) {
      return {
        summary: content.substring(0, 500),
        compliance_score: 70,
        risk_assessment: {},
        applicable_laws: [],
        legal_issues: [],
        recommendations: [],
        confidence_level: 0.7,
      };
    }
  }
}

export const contractAI = new ContractAIService();
