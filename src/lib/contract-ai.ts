import { supabase } from './supabase';

// Type definitions
interface ContractFormData {
  [key: string]: string | number | boolean;
}

interface ClauseConfiguration {
  [clauseKey: string]: {
    active: boolean;
    ai_recommended: boolean;
    risk_level: string;
  };
}

interface AIFieldSuggestion {
  field_suggestions: Record<string, string>;
  validation_issues: Array<{
    field: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;
  improvements: Array<{
    field: string;
    current: string;
    improved: string;
    reason: string;
  }>;
}

interface ClauseRecommendation {
  suggested_clauses: Array<{
    clause_id: string;
    recommendation_strength: 'essential' | 'recommended' | 'optional';
    kenyan_law_rationale: string;
    customizations?: string;
    clause_details?: any;
  }>;
  excluded_clauses: Array<{
    clause_id: string;
    reason: string;
  }>;
  confidence: number;
}

interface ContractReview {
  compliance_score: number;
  risk_score: number;
  clarity_score: number;
  overall_confidence: number;
  strengths: string[];
  weaknesses: string[];
  legal_compliance: {
    kenyan_law_alignment: string;
    enforceability: string;
    required_modifications: string[];
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    issue: string;
    solution: string;
  }>;
}

export class ContractAIService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    this.baseURL = 'https://api.openai.com/v1';
  }

  /**
   * Create a new AI-guided contract generation session
   */
  async createGenerationSession(
    userId: string, 
    templateId: string, 
    initialRequirements: Record<string, any> = {}
  ) {
    try {
      const { data, error } = await supabase
        .from('contract_generation_sessions')
        .insert({
          user_id: userId,
          template_id: templateId,
          requirements: initialRequirements,
          session_data: {
            current_step: 'requirements_gathering',
            started_at: new Date().toISOString()
          },
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating generation session:', error);
      throw error;
    }
  }

  /**
   * Get AI assistance for contract field completion
   */
  async getAIFieldAssistance(
    sessionId: string, 
    context: string, 
    currentData: ContractFormData
  ): Promise<AIFieldSuggestion> {
    try {
      // Get contract template and context
      const { data: session } = await supabase
        .from('contract_generation_sessions')
        .select(`
          *,
          contract_templates (
            name,
            template_schema,
            default_clauses,
            compliance_requirements
          )
        `)
        .eq('id', sessionId)
        .single();

      const aiPrompt = this.buildFieldAssistancePrompt(context, currentData, session);
      const aiResponse = await this.callOpenAI(aiPrompt, 'gpt-4');

      // Update session with AI conversation
      await this.updateSessionHistory(sessionId, 'field_assistance', {
        context,
        prompt: aiPrompt,
        response: aiResponse,
        timestamp: new Date().toISOString()
      });

      return this.parseAIFieldResponse(aiResponse);
    } catch (error) {
      console.error('Error getting AI field assistance:', error);
      throw error;
    }
  }

  /**
   * Get AI clause recommendations based on contract context
   */
  async getClauseRecommendations(
    sessionId: string, 
    contractData: ContractFormData
  ): Promise<ClauseRecommendation> {
    try {
      // Get relevant clauses from database
      const { data: availableClauses } = await supabase
        .from('contract_clauses')
        .select('*')
        .contains('applicable_contracts', [contractData.contract_type || 'nda']);

      const clauses = availableClauses || [];
      const aiPrompt = this.buildClauseRecommendationPrompt(contractData, clauses);
      const aiResponse = await this.callOpenAI(aiPrompt, 'gpt-4');

      const recommendations = this.parseClauseRecommendations(aiResponse, clauses);

      // Store AI analysis
      await supabase
        .from('contract_ai_analysis')
        .insert({
          generation_session_id: sessionId,
          analysis_type: 'clause_suggestion',
          findings: recommendations,
          confidence_score: recommendations.confidence || 0.8,
          recommendations: recommendations.suggested_clauses
        });

      return recommendations;
    } catch (error) {
      console.error('Error getting clause recommendations:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive contract review
   */
  async performContractReview(
    contractId: string, 
    contractData: ContractFormData
  ): Promise<ContractReview> {
    try {
      const reviewPrompt = this.buildContractReviewPrompt(contractData);
      const aiResponse = await this.callOpenAI(reviewPrompt, 'gpt-4');

      const analysis = this.parseContractReview(aiResponse);

      // Store comprehensive analysis
      const { data } = await supabase
        .from('contract_ai_analysis')
        .insert({
          contract_id: contractId,
          analysis_type: 'comprehensive_review',
          findings: analysis,
          confidence_score: analysis.overall_confidence || 0.85,
          recommendations: analysis.recommendations,
          kenyan_law_considerations: analysis.legal_compliance
        })
        .select()
        .single();

      // Update contract scores
      await supabase
        .from('contracts')
        .update({
          compliance_score: analysis.compliance_score,
          risk_score: analysis.risk_score,
          ai_assistance_used: true
        })
        .eq('id', contractId);

      return analysis;
    } catch (error) {
      console.error('Error performing contract review:', error);
      throw error;
    }
  }

  /**
   * Generate contract content based on filled data
   */
  async generateContractContent(
    sessionId: string, 
    formData: ContractFormData, 
    selectedClauses: ClauseConfiguration
  ) {
    try {
      const { data: session } = await supabase
        .from('contract_generation_sessions')
        .select(`
          *,
          contract_templates (*)
        `)
        .eq('id', sessionId)
        .single();

      const generationPrompt = this.buildContentGenerationPrompt(
        formData, 
        selectedClauses, 
        session.contract_templates
      );

      const aiResponse = await this.callOpenAI(generationPrompt, 'gpt-4');
      const generatedContent = this.parseGeneratedContent(aiResponse);

      // Update session with generated content
      await supabase
        .from('contract_generation_sessions')
        .update({
          current_draft: generatedContent.contract_text,
          completion_percentage: this.calculateCompletionPercentage(formData, selectedClauses),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      return generatedContent;
    } catch (error) {
      console.error('Error generating contract content:', error);
      throw error;
    }
  }

  /**
   * Validate contract for Kenyan law compliance
   */
  async validateKenyanCompliance(contractData: ContractFormData) {
    try {
      const compliancePrompt = this.buildKenyanCompliancePrompt(contractData);
      const aiResponse = await this.callOpenAI(compliancePrompt, 'gpt-4');

      return this.parseComplianceValidation(aiResponse);
    } catch (error) {
      console.error('Error validating Kenyan compliance:', error);
      throw error;
    }
  }

  // Private helper methods

  private async callOpenAI(prompt: string, model: string = 'gpt-4'): Promise<string> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a legal AI assistant specialized in Kenyan contract law. Provide precise, compliant, and practical advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private buildFieldAssistancePrompt(
    context: string, 
    currentData: ContractFormData, 
    session: any
  ): string {
    const template = session.contract_templates;
    
    return `
As a Kenyan legal AI assistant, help complete this ${template.name} contract.

Context: ${context}
Current form data: ${JSON.stringify(currentData, null, 2)}
Template requirements: ${JSON.stringify(template.compliance_requirements, null, 2)}

Please provide:
1. Suggestions for empty required fields
2. Validation of existing entries under Kenyan law
3. Recommended improvements for clarity and enforceability
4. Any missing information that would strengthen the contract

Respond in JSON format:
{
  "field_suggestions": {
    "field_name": "suggested_value_or_guidance"
  },
  "validation_issues": [
    {
      "field": "field_name",
      "issue": "description",
      "severity": "low|medium|high",
      "suggestion": "how_to_fix"
    }
  ],
  "improvements": [
    {
      "field": "field_name", 
      "current": "current_value",
      "improved": "better_value",
      "reason": "why_this_is_better"
    }
  ]
}`;
  }

  private buildClauseRecommendationPrompt(
    contractData: ContractFormData, 
    availableClauses: any[]
  ): string {
    return `
Based on this contract information and Kenyan law, recommend appropriate clauses:

Contract Details:
${JSON.stringify(contractData, null, 2)}

Available Clauses:
${JSON.stringify(availableClauses.map((c: any) => ({
  name: c.name,
  description: c.description,
  risk_level: c.risk_level,
  kenyan_law_compliance: c.kenyan_law_compliance
})), null, 2)}

Consider:
1. Contract purpose and parties involved
2. Risk mitigation appropriate for this agreement
3. Kenyan legal requirements and enforceability
4. Business context and reasonableness

Respond in JSON format:
{
  "suggested_clauses": [
    {
      "clause_id": "uuid",
      "recommendation_strength": "essential|recommended|optional",
      "kenyan_law_rationale": "why this clause is important under Kenyan law",
      "customizations": "any suggested modifications"
    }
  ],
  "excluded_clauses": [
    {
      "clause_id": "uuid", 
      "reason": "why this clause is not recommended"
    }
  ],
  "confidence": 0.85
}`;
  }

  private buildContractReviewPrompt(contractData: ContractFormData): string {
    return `
Perform a comprehensive legal review of this contract under Kenyan law:

Contract Data:
${JSON.stringify(contractData, null, 2)}

Analyze:
1. Legal compliance with Kenyan Contract Law, Employment Act 2007, Data Protection Act 2019
2. Enforceability of terms and conditions
3. Risk assessment for both parties
4. Clarity and unambiguous language
5. Missing essential clauses
6. Potential areas of dispute

Provide scores (0-100) for:
- Overall compliance with Kenyan law
- Risk level for the disclosing party
- Contract completeness and clarity

Respond in JSON format:
{
  "compliance_score": 85,
  "risk_score": 25,
  "clarity_score": 90,
  "overall_confidence": 0.88,
  "strengths": ["list of contract strengths"],
  "weaknesses": ["list of concerns"],
  "legal_compliance": {
    "kenyan_law_alignment": "assessment",
    "enforceability": "assessment", 
    "required_modifications": ["if any"]
  },
  "recommendations": [
    {
      "priority": "high|medium|low",
      "issue": "description",
      "solution": "how to address"
    }
  ]
}`;
  }

  private buildContentGenerationPrompt(
    formData: ContractFormData, 
    selectedClauses: ClauseConfiguration, 
    template: any
  ): string {
    return `
Generate a complete, professional contract based on this information:

Form Data: ${JSON.stringify(formData, null, 2)}
Selected Clauses: ${JSON.stringify(selectedClauses, null, 2)}
Template: ${template.name}
Compliance Requirements: ${JSON.stringify(template.compliance_requirements, null, 2)}

Generate a complete contract that:
1. Is compliant with Kenyan law
2. Uses clear, unambiguous language
3. Includes all selected clauses integrated naturally
4. Has proper legal structure and formatting
5. Includes signature blocks and execution details

Respond in JSON format:
{
  "contract_text": "complete_contract_html_formatted",
  "metadata": {
    "word_count": 1200,
    "estimated_complexity": "medium",
    "key_terms_highlighted": ["term1", "term2"]
  }
}`;
  }

  private buildKenyanCompliancePrompt(contractData: ContractFormData): string {
    return `
Validate this contract for strict compliance with Kenyan law:

Contract: ${JSON.stringify(contractData, null, 2)}

Check against:
1. Contract Law principles
2. Employment Act 2007 (if applicable)
3. Data Protection Act 2019
4. Competition Act
5. Consumer Protection Act
6. Constitutional requirements

Respond in JSON format:
{
  "is_compliant": true/false,
  "compliance_percentage": 95,
  "violations": [
    {
      "law": "specific_law",
      "section": "section_reference",
      "issue": "description",
      "severity": "minor|major|critical"
    }
  ],
  "recommendations": ["specific fixes needed"]
}`;
  }

  private parseAIFieldResponse(response: string): AIFieldSuggestion {
    try {
      return JSON.parse(response);
    } catch (error) {
      // Fallback parsing if JSON is malformed
      return {
        field_suggestions: {},
        validation_issues: [],
        improvements: []
      };
    }
  }

  private parseClauseRecommendations(
    response: string, 
    availableClauses: any[]
  ): ClauseRecommendation {
    try {
      const parsed = JSON.parse(response);
      
      // Enrich with clause details
      parsed.suggested_clauses = parsed.suggested_clauses?.map((suggestion: any) => {
        const clause = availableClauses.find(c => c.id === suggestion.clause_id);
        return {
          ...suggestion,
          clause_details: clause
        };
      }) || [];

      return parsed;
    } catch (error) {
      return {
        suggested_clauses: [],
        excluded_clauses: [],
        confidence: 0.5
      };
    }
  }

  private parseContractReview(response: string): ContractReview {
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        compliance_score: 70,
        risk_score: 50,
        clarity_score: 70,
        overall_confidence: 0.6,
        strengths: [],
        weaknesses: [],
        legal_compliance: {
          kenyan_law_alignment: "Unknown",
          enforceability: "Unknown",
          required_modifications: []
        },
        recommendations: []
      };
    }
  }

  private parseGeneratedContent(response: string) {
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        contract_text: response, // Use raw response as fallback
        metadata: {
          word_count: response.length,
          estimated_complexity: "unknown"
        }
      };
    }
  }

  private parseComplianceValidation(response: string) {
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        is_compliant: false,
        compliance_percentage: 50,
        violations: [],
        recommendations: ["Manual legal review required"]
      };
    }
  }

  private calculateCompletionPercentage(
    formData: ContractFormData, 
    selectedClauses: ClauseConfiguration
  ): number {
    const totalFields = Object.keys(formData).length;
    const filledFields = Object.values(formData).filter(value => 
      value !== null && value !== undefined && value !== ''
    ).length;
    
    const fieldCompletion = (filledFields / totalFields) * 0.7; // 70% weight
    const clauseCompletion = Object.values(selectedClauses).filter(clause => clause.active).length > 0 ? 0.3 : 0; // 30% weight
    
    return Math.round((fieldCompletion + clauseCompletion) * 100);
  }

  private async updateSessionHistory(
    sessionId: string, 
    actionType: string, 
    data: any
  ) {
    const { data: session } = await supabase
      .from('contract_generation_sessions')
      .select('ai_conversation_history')
      .eq('id', sessionId)
      .single();

    const history = session?.ai_conversation_history || [];
    history.push({
      action_type: actionType,
      timestamp: new Date().toISOString(),
      data
    });

    await supabase
      .from('contract_generation_sessions')
      .update({ 
        ai_conversation_history: history,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
  }
}

export const contractAI = new ContractAIService();
