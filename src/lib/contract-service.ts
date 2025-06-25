import { supabase } from './supabase';
import { contractAI } from './contract-ai';

export interface ContractParty {
  name: string;
  email: string;
  user_id?: string;
  role: 'creator' | 'signatory' | 'witness';
  party_type: 'individual' | 'company';
  id_number?: string;
  company_registration?: string;
}

export interface ContractCreationData {
  title: string;
  type: string;
  template_id: string;
  form_data: Record<string, any>;
  selected_clauses: Record<string, any>;
  parties: ContractParty[];
  value_amount?: number;
  value_currency?: string;
  expires_at?: string;
}

export interface SignatureData {
  digital_signature_data: {
    full_name: string;
    id_number: string;
    timestamp: string;
    ip_address: string;
    user_agent: string;
  };
}

export class ContractService {
  
  /**
   * Create a new contract with AI assistance
   */
  async createContract(userId: string, contractData: ContractCreationData) {
    try {
      // Start a generation session
      const session = await contractAI.createGenerationSession(
        userId,
        contractData.template_id,
        { form_data: contractData.form_data }
      );

      // Generate the contract content using AI
      const generatedContent = await contractAI.generateContractContent(
        session.id,
        contractData.form_data,
        contractData.selected_clauses
      );

      // Perform AI review
      const aiReview = await contractAI.performContractReview(
        'temp-id', // Will be replaced with actual contract ID
        contractData.form_data
      );

      // Create the contract record
      const { data: contract, error } = await supabase
        .from('contracts')
        .insert({
          title: contractData.title,
          type: contractData.type,
          template_id: contractData.template_id,
          content: generatedContent.contract_text,
          template_data: {
            form_fields: contractData.form_data,
            selected_clauses: contractData.selected_clauses,
            ai_generated: true,
            generation_session_id: session.id
          },
          status: 'draft',
          value_amount: contractData.value_amount,
          value_currency: contractData.value_currency || 'KSH',
          created_by: userId,
          expires_at: contractData.expires_at,
          ai_assistance_used: true,
          compliance_score: aiReview.compliance_score,
          risk_score: aiReview.risk_score
        })
        .select()
        .single();

      if (error) throw error;

      // Add contract parties
      for (const party of contractData.parties) {
        await this.addContractParty(contract.id, party);
      }

      // Update the generation session with final contract ID
      await supabase
        .from('contract_generation_sessions')
        .update({ 
          contract_id: contract.id,
          status: 'completed'
        })
        .eq('id', session.id);

      // Create initial execution flow
      await this.initializeExecutionFlow(contract.id, userId);

      // Generate initial PDF
      await this.generateContractPDF(contract.id, 'draft');

      return {
        contract,
        ai_review: aiReview,
        session_id: session.id
      };

    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  }

  /**
   * Add a party to a contract
   */
  async addContractParty(contractId: string, party: ContractParty) {
    try {
      const { data, error } = await supabase
        .from('contract_parties')
        .insert({
          contract_id: contractId,
          user_id: party.user_id,
          name: party.name,
          email: party.email,
          role: party.role,
          party_type: party.party_type,
          id_number: party.id_number,
          company_registration: party.company_registration
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to party
      if (party.user_id) {
        await this.createNotification(
          party.user_id,
          'signature_request',
          'Contract Signature Request',
          `You have been added to a contract that requires your signature: ${contractId}`,
          { contract_id: contractId }
        );
      }

      return data;
    } catch (error) {
      console.error('Error adding contract party:', error);
      throw error;
    }
  }

  /**
   * Send contract for signatures
   */
  async sendForSignatures(contractId: string, senderId: string) {
    try {
      // Update contract status
      await supabase
        .from('contracts')
        .update({ status: 'pending_signature' })
        .eq('id', contractId);

      // Update execution flow
      await supabase
        .from('contract_execution_flow')
        .update({ 
          current_step: 'signing',
          step_data: { sent_for_signatures_at: new Date().toISOString() }
        })
        .eq('contract_id', contractId)
        .eq('current_step', 'draft');

      // Get all parties that need to sign
      const { data: parties } = await supabase
        .from('contract_parties')
        .select('*')
        .eq('contract_id', contractId)
        .eq('role', 'signatory');

      // Send notifications to all signing parties
      for (const party of parties || []) {
        if (party.user_id) {
          await this.createNotification(
            party.user_id,
            'signature_request',
            'Contract Ready for Signature',
            `Please review and sign the contract: ${contractId}`,
            { 
              contract_id: contractId,
              party_id: party.id,
              action_required: true,
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            }
          );
        }
      }

      return { success: true, parties_notified: parties?.length || 0 };
    } catch (error) {
      console.error('Error sending for signatures:', error);
      throw error;
    }
  }

  /**
   * Sign a contract
   */
  async signContract(
    contractId: string, 
    partyId: string, 
    userId: string, 
    signatureData: SignatureData
  ) {
    try {
      // Verify user is authorized to sign for this party
      const { data: party } = await supabase
        .from('contract_parties')
        .select('*')
        .eq('id', partyId)
        .eq('contract_id', contractId)
        .eq('user_id', userId)
        .single();

      if (!party) {
        throw new Error('Unauthorized to sign this contract');
      }

      // Update party with signature
      await supabase
        .from('contract_parties')
        .update({
          signed_at: new Date().toISOString(),
          digital_signature_data: signatureData.digital_signature_data,
          signature_ip_address: signatureData.digital_signature_data.ip_address,
          signature_timestamp: signatureData.digital_signature_data.timestamp,
          signature_verification_status: 'verified'
        })
        .eq('id', partyId);

      // Create signature verification record
      await supabase
        .from('signature_verifications')
        .insert({
          contract_party_id: partyId,
          verification_method: 'digital_signature',
          verification_data: signatureData.digital_signature_data,
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: userId
        });

      // Check if all parties have signed
      const { data: allParties } = await supabase
        .from('contract_parties')
        .select('signed_at')
        .eq('contract_id', contractId)
        .eq('role', 'signatory');

      const allSigned = allParties?.every(p => p.signed_at !== null);

      if (allSigned) {
        // All parties signed - finalize contract
        await this.finalizeContract(contractId);
      }

      // Send confirmation notification
      await this.createNotification(
        userId,
        'contract_signed',
        'Contract Signed Successfully',
        `You have successfully signed the contract: ${contractId}`,
        { contract_id: contractId }
      );

      return { 
        success: true, 
        all_signed: allSigned,
        contract_finalized: allSigned 
      };

    } catch (error) {
      console.error('Error signing contract:', error);
      throw error;
    }
  }

  /**
   * Finalize a fully signed contract
   */
  async finalizeContract(contractId: string) {
    try {
      // Update contract status
      await supabase
        .from('contracts')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString()
        })
        .eq('id', contractId);

      // Update execution flow
      await supabase
        .from('contract_execution_flow')
        .update({
          current_step: 'execution',
          completed_at: new Date().toISOString(),
          step_data: { fully_executed_at: new Date().toISOString() }
        })
        .eq('contract_id', contractId)
        .eq('current_step', 'signing');

      // Generate final signed PDF
      await this.generateContractPDF(contractId, 'signed');

      // Notify all parties
      const { data: parties } = await supabase
        .from('contract_parties')
        .select('user_id')
        .eq('contract_id', contractId)
        .not('user_id', 'is', null);

      for (const party of parties || []) {
        await this.createNotification(
          party.user_id,
          'contract_signed',
          'Contract Fully Executed',
          `The contract has been fully executed by all parties: ${contractId}`,
          { contract_id: contractId }
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Error finalizing contract:', error);
      throw error;
    }
  }

  /**
   * Generate PDF version of contract
   */
  async generateContractPDF(contractId: string, documentType: 'draft' | 'final' | 'signed') {
    try {
      // Get contract with all related data
      const { data: contract } = await supabase
        .from('contracts')
        .select(`
          *,
          contract_parties (*),
          contract_templates (name, category)
        `)
        .eq('id', contractId)
        .single();

      if (!contract) throw new Error('Contract not found');

      // Generate PDF using a PDF service (you'll need to implement this)
      const pdfBuffer = await this.generatePDFFromHTML(contract);
      
      // Upload to storage
      const fileName = `${contractId}_${documentType}_${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('contracts')
        .getPublicUrl(fileName);

      // Save document record
      await supabase
        .from('contract_documents')
        .insert({
          contract_id: contractId,
          document_type: documentType,
          file_url: urlData.publicUrl,
          file_size: pdfBuffer.length,
          mime_type: 'application/pdf',
          version_number: 1,
          watermark_applied: documentType === 'draft',
          generated_by: contract.created_by
        });

      // Update contract with PDF URL if this is the final version
      if (documentType === 'signed') {
        await supabase
          .from('contracts')
          .update({ pdf_url: urlData.publicUrl })
          .eq('id', contractId);
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Get contract status and progress
   */
  async getContractStatus(contractId: string, userId: string) {
    try {
      const { data: contract } = await supabase
        .from('contracts')
        .select(`
          *,
          contract_parties (*),
          contract_execution_flow (*),
          contract_documents (*)
        `)
        .eq('id', contractId)
        .or(`created_by.eq.${userId},contract_parties.user_id.eq.${userId}`)
        .single();

      if (!contract) throw new Error('Contract not found or access denied');

      // Calculate signing progress
      const signatories = contract.contract_parties.filter((p: any) => p.role === 'signatory');
      const signedParties = signatories.filter((p: any) => p.signed_at !== null);
      
      const progress = {
        total_signatories: signatories.length,
        signed_count: signedParties.length,
        percentage: signatories.length > 0 ? (signedParties.length / signatories.length) * 100 : 0,
        pending_parties: signatories.filter((p: any) => p.signed_at === null)
      };

      return {
        contract,
        signing_progress: progress,
        execution_flow: contract.contract_execution_flow,
        documents: contract.contract_documents
      };
    } catch (error) {
      console.error('Error getting contract status:', error);
      throw error;
    }
  }

  /**
   * Download contract PDF
   */
  async downloadContract(contractId: string, userId: string, documentType: 'signed' | 'draft' = 'signed') {
    try {
      // Verify user has access
      const hasAccess = await this.verifyContractAccess(contractId, userId);
      if (!hasAccess) throw new Error('Access denied');

      // Get the document
      const { data: document } = await supabase
        .from('contract_documents')
        .select('file_url')
        .eq('contract_id', contractId)
        .eq('document_type', documentType)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (!document) throw new Error('Document not found');

      return document.file_url;
    } catch (error) {
      console.error('Error downloading contract:', error);
      throw error;
    }
  }

  // Private helper methods

  private async initializeExecutionFlow(contractId: string, userId: string) {
    await supabase
      .from('contract_execution_flow')
      .insert({
        contract_id: contractId,
        current_step: 'draft',
        assigned_to: userId,
        step_data: { created_at: new Date().toISOString() }
      });
  }

  private async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data: Record<string, any> = {}
  ) {
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
        contract_id: data.contract_id,
        expires_at: data.expires_at,
        action_required: data.action_required || false
      });
  }

  private async verifyContractAccess(contractId: string, userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('contracts')
      .select('id')
      .eq('id', contractId)
      .or(`created_by.eq.${userId},contract_parties.user_id.eq.${userId}`)
      .single();

    return !!data;
  }

  private async generatePDFFromHTML(contract: any): Promise<Buffer> {
    // This is a placeholder - you'll need to implement PDF generation
    // You could use libraries like puppeteer, jsPDF, or a service like HTMLtoPDF
    
    // For now, return a dummy buffer
    return Buffer.from('PDF content placeholder');
  }
}

export const contractService = new ContractService();
