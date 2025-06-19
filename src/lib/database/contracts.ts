import { supabase } from '@/lib/supabase';

// Helper function to transform database contract to Contract interface
const transformContract = (contract: any): Contract => ({
  id: contract.id,
  title: contract.title,
  type: contract.type,
  status: contract.status,
  created_at: contract.created_at,
  value_amount: contract.value_amount,
  value_currency: contract.value_currency,
  parties: contract.contract_parties?.map((p: any) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role,
    signed_at: p.signed_at
  })) || [],
  signed_date: contract.contract_parties?.find((p: any) => p.signed_at)?.signed_at
});

export interface Contract {
  id: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
  value_amount?: number;
  value_currency?: string;
  parties: ContractParty[];
  signed_date?: string;
}

export interface ContractParty {
  id: string;
  name: string;
  email: string;
  role: string;
  signed_at?: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  is_premium: boolean;
  usage_count: number;
}

// Get all contracts for a user
export async function getUserContracts(userId: string): Promise<Contract[]> {
  try {
    const { data: contracts } = await supabase
      .from('contracts')
      .select(`
        id,
        title,
        type,
        status,
        created_at,
        value_amount,
        value_currency,
        contract_parties (
          id,
          name,
          email,
          role,
          signed_at
        )
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    return contracts?.map(transformContract) || [];
  } catch (error) {
    console.error('Error fetching user contracts:', error);
    throw error;
  }
}

// Get contracts by status
export async function getContractsByStatus(userId: string, status: string): Promise<Contract[]> {
  try {
    const { data: contracts } = await supabase
      .from('contracts')
      .select(`
        id,
        title,
        type,
        status,
        created_at,
        value_amount,
        value_currency,
        contract_parties (
          id,
          name,
          email,
          role,
          signed_at
        )
      `)
      .eq('created_by', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    return contracts?.map(transformContract) || [];
  } catch (error) {
    console.error('Error fetching contracts by status:', error);
    throw error;
  }
}

// Get pending signature contracts
export async function getPendingSignatureContracts(userEmail: string): Promise<Contract[]> {
  try {
    const { data: pendingContracts } = await supabase
      .from('contract_parties')
      .select(`
        id,
        name,
        email,
        role,
        signed_at,
        contracts!inner (
          id,
          title,
          type,
          status,
          created_at,
          value_amount,
          value_currency
        )
      `)
      .eq('email', userEmail)
      .is('signed_at', null);

    return pendingContracts?.map((party: any) => ({
      id: party.contracts.id,
      title: party.contracts.title,
      type: party.contracts.type,
      status: party.contracts.status,
      created_at: party.contracts.created_at,
      value_amount: party.contracts.value_amount,
      value_currency: party.contracts.value_currency,
      parties: [{
        id: party.id,
        name: party.name,
        email: party.email,
        role: party.role,
        signed_at: party.signed_at
      }],
      signed_date: party.signed_at
    })) || [];
  } catch (error) {
    console.error('Error fetching pending signature contracts:', error);
    throw error;
  }
}

// Get sent contracts
export async function getSentContracts(userId: string): Promise<Contract[]> {
  try {
    const { data: contracts } = await supabase
      .from('contracts')
      .select(`
        id,
        title,
        type,
        status,
        created_at,
        value_amount,
        value_currency,
        contract_parties (
          id,
          name,
          email,
          role,
          signed_at
        )
      `)
      .eq('created_by', userId)
      .in('status', ['pending_signature', 'signed'])
      .order('created_at', { ascending: false });

    return contracts?.map(transformContract) || [];
  } catch (error) {
    console.error('Error fetching sent contracts:', error);
    throw error;
  }
}

// Get signed contracts
export async function getSignedContracts(userId: string): Promise<Contract[]> {
  try {
    const { data: contracts } = await supabase
      .from('contracts')
      .select(`
        id,
        title,
        type,
        status,
        created_at,
        value_amount,
        value_currency,
        contract_parties (
          id,
          name,
          email,
          role,
          signed_at
        )
      `)
      .eq('created_by', userId)
      .eq('status', 'signed')
      .order('created_at', { ascending: false });

    return contracts?.map(transformContract) || [];
  } catch (error) {
    console.error('Error fetching signed contracts:', error);
    throw error;
  }
}

// Get contract templates
export async function getContractTemplates(): Promise<ContractTemplate[]> {
  try {
    const { data: templates } = await supabase
      .from('contract_templates')
      .select('id, name, category, description, is_premium, usage_count')
      .eq('is_active', true)
      .order('usage_count', { ascending: false });

    return templates || [];
  } catch (error) {
    console.error('Error fetching contract templates:', error);
    throw error;
  }
}

// Create a new contract
export async function createContract(
  userId: string,
  contractData: {
    title: string;
    description?: string;
    contract_type: string;
    template_id?: string;
    content: any;
    ai_prompt?: string;
  }
): Promise<string> {
  try {
    // Check if user can create more contracts
    const canCreate = await supabase.rpc('check_usage_limit', {
      p_user_id: userId,
      p_usage_type: 'contract_creation'
    });

    if (!canCreate.data) {
      throw new Error('Contract creation limit reached');
    }

    const { data: contract, error } = await supabase
      .from('contracts')
      .insert({
        ...contractData,
        created_by: userId,
        status: 'draft'
      })
      .select('id')
      .single();

    if (error) throw error;

    // Track usage
    await supabase.rpc('track_usage', {
      p_user_id: userId,
      p_usage_type: 'contract_creation',
      p_resource_id: contract.id
    });

    return contract.id;
  } catch (error) {
    console.error('Error creating contract:', error);
    throw error;
  }
}

// Add party to contract
export async function addContractParty(
  contractId: string,
  partyData: {
    email: string;
    full_name: string;
    role: string;
    signing_order?: number;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('contract_parties')
      .insert({
        contract_id: contractId,
        ...partyData
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error adding contract party:', error);
    throw error;
  }
}

// Sign contract
export async function signContract(
  partyId: string,
  signatureData: any
): Promise<void> {
  try {
    const { error } = await supabase
      .from('contract_parties')
      .update({
        signed_at: new Date().toISOString(),
        signature_data: signatureData,
        ip_address: 'user_ip', // You'll need to get actual IP
        user_agent: navigator.userAgent
      })
      .eq('id', partyId);

    if (error) throw error;

    // Check if all parties have signed and update contract status
    const { data: parties } = await supabase
      .from('contract_parties')
      .select('signed_at, contract_id')
      .eq('id', partyId)
      .single();

    if (parties) {
      const { data: allParties } = await supabase
        .from('contract_parties')
        .select('signed_at')
        .eq('contract_id', parties.contract_id);

      const allSigned = allParties?.every(p => p.signed_at !== null);

      if (allSigned) {
        await supabase
          .from('contracts')
          .update({ status: 'signed' })
          .eq('id', parties.contract_id);
      }
    }
  } catch (error) {
    console.error('Error signing contract:', error);
    throw error;
  }
}

// Search contracts
export async function searchContracts(userId: string, searchTerm: string): Promise<Contract[]> {
  try {
    const { data: contracts } = await supabase
      .from('contracts')
      .select(`
        id,
        title,
        type,
        status,
        created_at,
        value_amount,
        value_currency,
        contract_parties (
          id,
          name,
          email,
          role,
          signed_at
        )
      `)
      .eq('created_by', userId)
      .or(`title.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    return contracts?.map(transformContract) || [];
  } catch (error) {
    console.error('Error searching contracts:', error);
    throw error;
  }
}