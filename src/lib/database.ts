

import { supabase } from './supabase'

// =============================================
// DASHBOARD PAGE FUNCTIONS
// =============================================

export async function getDashboardStats(userId: string) {
  try {
    // Get contract counts
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('id, status')
      .eq('created_by', userId)

    if (contractsError) throw contractsError

    // Get recent contracts
    const { data: recentContracts, error: recentError } = await supabase
      .from('contracts')
      .select(`
        id,
        title,
        type,
        status,
        pdf_url,
        created_at,
        contract_parties (
          name,
          email,
          signed_at
        )
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) throw recentError

    // Get notification count
    const { count: notificationCount, error: notifError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (notifError) throw notifError

    return {
      totalContracts: contracts?.length || 0,
      pendingSignatures: contracts?.filter(c => c.status === 'pending_signature').length || 0,
      signedContracts: contracts?.filter(c => c.status === 'signed').length || 0,
      recentContracts: recentContracts || [],
      unreadNotifications: notificationCount || 0
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}

// =============================================
// CONTRACTS PAGE FUNCTIONS
// =============================================

export async function getUserContracts(userId: string, status?: string) {
  try {
    let query = supabase
      .from('contracts')
      .select(`
        id,
        title,
        type,
        status,
        value_amount,
        value_currency,
        pdf_url,
        file_size,
        created_at,
        signed_at,
        contract_parties (
          name,
          email,
          role,
          signed_at
        ),
        contract_analysis (
          summary,
          risk_assessment,
          ai_confidence
        )
      `)
      .eq('created_by', userId)

    if (status && status !== 'all') {
      if (status === 'pending') {
        query = query.eq('status', 'pending_signature')
      } else {
        query = query.eq('status', status)
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching contracts:', error)
    throw error
  }
}

export async function createContract(contractData: {
  title: string
  type: string
  content?: string
  pdf_url?: string
  template_data?: any
  value_amount?: number
  file_size?: number
  created_by: string
}) {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .insert({
        ...contractData,
        mime_type: 'application/pdf'
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating contract:', error)
    throw error
  }
}

export async function uploadContractPDF(file: File, userId: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `contracts/${userId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Error uploading contract PDF:', error)
    throw error
  }
}

// =============================================
// AI CONTRACT GENERATION FUNCTIONS
// =============================================

export async function createContractGenerationSession(userId: string, requirements: any) {
  try {
    const { data, error } = await supabase
      .from('contract_generation_sessions')
      .insert({
        user_id: userId,
        requirements,
        session_data: { step: 'requirements_gathering' }
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating contract generation session:', error)
    throw error
  }
}

export async function updateContractGenerationSession(
  sessionId: string, 
  updates: {
    current_draft?: string
    session_data?: any
    status?: string
  }
) {
  try {
    const { data, error } = await supabase
      .from('contract_generation_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating contract generation session:', error)
    throw error
  }
}

export async function generateContractPDF(content: string, sessionId: string): Promise<string> {
  // This would integrate with a PDF generation service
  // For now, return a placeholder URL
  try {
    // In a real implementation, you would:
    // 1. Convert the content to PDF using a library like jsPDF or Puppeteer
    // 2. Upload the PDF to Supabase storage
    // 3. Return the public URL
    
    const pdfUrl = `generated-contracts/${sessionId}/contract.pdf`
    return pdfUrl
  } catch (error) {
    console.error('Error generating contract PDF:', error)
    throw error
  }
}

// =============================================
// AI ANALYSIS FUNCTIONS
// =============================================

export async function analyzeContract(contractId: string, analysisType: string = 'full_analysis') {
  try {
    // This would integrate with an AI service for contract analysis
    // For now, return mock analysis data
    const mockAnalysis = {
      contract_id: contractId,
      summary: "This contract outlines the terms and conditions for professional services.",
      key_terms: ["Payment terms", "Scope of work", "Termination clause"],
      potential_issues: ["Vague termination conditions", "Payment schedule unclear"],
      risk_assessment: {
        overall_risk: "medium",
        financial_risk: "low",
        legal_risk: "medium"
      },
      compliance_check: {
        kenyan_law_compliant: true,
        missing_clauses: ["Force majeure", "Dispute resolution"]
      },
      recommendations: [
        "Add specific dispute resolution mechanism",
        "Clarify payment terms and penalties",
        "Include force majeure clause"
      ],
      ai_confidence: 0.85,
      analysis_type: analysisType
    }

    const { data, error } = await supabase
      .from('contract_analysis')
      .insert(mockAnalysis)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error analyzing contract:', error)
    throw error
  }
}

export async function getContractAnalysis(contractId: string) {
  try {
    const { data, error } = await supabase
      .from('contract_analysis')
      .select('*')
      .eq('contract_id', contractId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching contract analysis:', error)
    throw error
  }
}

// =============================================
// VAULT PAGE FUNCTIONS
// =============================================

export async function getUserDocuments(userId: string) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        id,
        name,
        type,
        file_url,
        file_size,
        status,
        created_at,
        document_summaries (
          summary,
          key_points,
          risk_level,
          recommendations
        )
      `)
      .eq('uploaded_by', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching documents:', error)
    throw error
  }
}

export async function uploadDocument(file: File, userId: string, documentData: {
  name: string
  type: string
}) {
  try {
    // Upload file to Supabase storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `documents/${userId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    // Create document record
    const { data, error } = await supabase
      .from('documents')
      .insert({
        name: documentData.name,
        type: documentData.type,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: userId,
        status: 'processing'
      })
      .select()
      .single()

    if (error) throw error

    // Trigger AI analysis (would be done asynchronously in production)
    await analyzeDocument(data.id)

    return data
  } catch (error) {
    console.error('Error uploading document:', error)
    throw error
  }
}

export async function analyzeDocument(documentId: string) {
  try {
    // Mock AI analysis - in production this would call an AI service
    const mockSummary = {
      document_id: documentId,
      summary: "Document analysis completed. Key legal terms and conditions identified.",
      key_points: [
        "Contract duration: 12 months",
        "Payment terms: Net 30 days",
        "Termination clause present"
      ],
      risk_level: "medium",
      risk_score: 6,
      recommendations: [
        "Review termination conditions",
        "Clarify payment penalties",
        "Add dispute resolution clause"
      ],
      ai_confidence: 0.82
    }

    const { data, error } = await supabase
      .from('document_summaries')
      .insert(mockSummary)
      .select()
      .single()

    if (error) throw error

    // Update document status to analyzed
    await supabase
      .from('documents')
      .update({ status: 'analyzed' })
      .eq('id', documentId)

    return data
  } catch (error) {
    console.error('Error analyzing document:', error)
    throw error
  }
}

// =============================================
// CHAT PAGE FUNCTIONS
// =============================================

export async function getUserChatConversations(userId: string) {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select(`
        id,
        title,
        updated_at,
        chat_messages (
          content,
          role,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching chat conversations:', error)
    throw error
  }
}

export async function getChatMessages(conversationId: string) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    throw error
  }
}

export async function createChatConversation(userId: string, title?: string) {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        title: title || `Chat ${new Date().toLocaleString()}`
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating chat conversation:', error)
    throw error
  }
}

export async function addChatMessage(conversationId: string, role: 'user' | 'assistant', content: string) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error adding chat message:', error)
    throw error
  }
}

// =============================================
// LAWYERS PAGE FUNCTIONS
// =============================================

export async function getNearbyLawyers(userLocation?: string) {
  try {
    const { data, error } = await supabase
      .from('lawyer_profiles')
      .select(`
        id,
        firm_name,
        practice_areas,
        years_experience,
        hourly_rate,
        rating,
        total_reviews,
        response_time_hours,
        is_verified,
        users!inner (
          full_name,
          email,
          phone_number,
          location
        )
      `)
      .eq('is_verified', true)
      .order('rating', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching lawyers:', error)
    throw error
  }
}

export async function getSuggestedLawyers(userId: string) {
  try {
    // Get user's recent contract types to suggest relevant lawyers
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('type')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (contractsError) throw contractsError

    const contractTypes = contracts?.map(c => c.type) || []
    
    // For now, return top-rated lawyers (later can be enhanced with ML)
    const { data: lawyers, error } = await supabase
      .from('lawyer_profiles')
      .select(`
        id,
        firm_name,
        practice_areas,
        rating,
        users!inner (
          full_name
        )
      `)
      .eq('is_verified', true)
      .order('rating', { ascending: false })
      .limit(6)

    if (error) throw error
    return {
      contractTypes,
      suggestedLawyers: lawyers || []
    }
  } catch (error) {
    console.error('Error fetching suggested lawyers:', error)
    throw error
  }
}

// =============================================
// NOTIFICATIONS PAGE FUNCTIONS
// =============================================

export async function getUserNotifications(userId: string, type?: string) {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)

    if (type && type !== 'all') {
      if (type === 'signatures') {
        query = query.eq('type', 'signature_request')
      } else if (type === 'ai') {
        query = query.eq('type', 'ai_response')
      } else if (type === 'system') {
        query = query.eq('type', 'system_update')
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching notifications:', error)
    throw error
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw error
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    throw error
  }
}

// =============================================
// ACCOUNT PAGE FUNCTIONS
// =============================================

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        user_subscriptions (
          id,
          status,
          current_period_end,
          subscription_plans (
            name,
            price_monthly
          )
        )
      `)
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw error
  }
}

export async function updateUserProfile(userId: string, updates: {
  full_name?: string
  email?: string
  phone_number?: string
  location?: string
}) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

export async function getBillingHistory(userId: string) {
  try {
    const { data, error } = await supabase
      .from('billing_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching billing history:', error)
    throw error
  }
}

// =============================================
// LAWYER DASHBOARD FUNCTIONS
// =============================================

export async function getLawyerCases(lawyerId: string, status?: string) {
  try {
    let query = supabase
      .from('cases')
      .select(`
        *,
        case_analysis (
          analysis_summary,
          key_findings,
          case_strength_score,
          recommended_actions
        )
      `)
      .eq('lawyer_id', lawyerId)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching lawyer cases:', error)
    throw error
  }
}

export async function createCase(caseData: {
  title: string
  description?: string
  client_name: string
  client_email?: string
  priority?: string
  lawyer_id: string
  case_pdf_url?: string
  file_size?: number
}) {
  try {
    const { data, error } = await supabase
      .from('cases')
      .insert({
        ...caseData,
        mime_type: 'application/pdf'
      })
      .select()
      .single()

    if (error) throw error

    // If PDF is provided, trigger AI analysis
    if (caseData.case_pdf_url) {
      await analyzeCaseDocument(data.id)
    }

    return data
  } catch (error) {
    console.error('Error creating case:', error)
    throw error
  }
}

export async function uploadCasePDF(file: File, lawyerId: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `cases/${lawyerId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Error uploading case PDF:', error)
    throw error
  }
}

export async function analyzeCaseDocument(caseId: string) {
  try {
    // Mock AI analysis for case documents
    const mockAnalysis = {
      case_id: caseId,
      analysis_summary: "Case document analyzed for legal precedents and strategic insights.",
      key_findings: [
        "Similar cases show 78% success rate",
        "Key witness testimonies identified",
        "Relevant statutes: Employment Act 2007, Section 45"
      ],
      legal_precedents: [
        "Kamau v. ABC Company (2019) - Wrongful termination",
        "Wanjiku v. XYZ Ltd (2020) - Employment benefits dispute"
      ],
      case_strength_score: 7,
      recommended_actions: [
        "Gather additional evidence from witness testimonies",
        "Review employment contract for breach clauses",
        "Prepare settlement negotiation strategy"
      ],
      similar_cases: {
        count: 15,
        success_rate: 0.78,
        average_settlement: "KSh 500,000"
      },
      ai_confidence: 0.79
    }

    const { data, error } = await supabase
      .from('case_analysis')
      .insert(mockAnalysis)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error analyzing case document:', error)
    throw error
  }
}

export async function getLawyerStats(lawyerId: string) {
  try {
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('id, status')
      .eq('lawyer_id', lawyerId)

    if (casesError) throw casesError

    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id')
      .eq('uploaded_by', lawyerId)

    if (docsError) throw docsError

    const { data: research, error: researchError } = await supabase
      .from('legal_research')
      .select('id')
      .eq('user_id', lawyerId)

    if (researchError) throw researchError

    return {
      activeCases: cases?.filter(c => c.status === 'active').length || 0,
      totalCases: cases?.length || 0,
      documentsAnalyzed: documents?.length || 0,
      researchQueries: research?.length || 0
    }
  } catch (error) {
    console.error('Error fetching lawyer stats:', error)
    throw error
  }
}

