import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Sparkles, FileText, Shield, Scale } from "lucide-react";

const initialFormData = {
  // Party Information - Enhanced for Kenyan Requirements
  disclosing_party_name: "",
  disclosing_party_address: "",
  disclosing_party_email: "",
  disclosing_party_phone: "",
  disclosing_party_id_number: "",
  disclosing_party_id_type: "national_id", // national_id, passport, company_registration
  disclosing_party_app_id: "",
  disclosing_party_type: "individual", // individual, company, partnership
  disclosing_party_business_registration: "", // For companies
  
  receiving_party_name: "",
  receiving_party_address: "",
  receiving_party_email: "",
  receiving_party_phone: "",
  receiving_party_id_number: "",
  receiving_party_id_type: "national_id",
  receiving_party_app_id: "",
  receiving_party_type: "individual",
  receiving_party_business_registration: "",
  
  // Contract Terms - Enhanced for Kenyan Law Compliance
  purpose_of_disclosure: "",
  confidential_information_scope: "",
  discussion_subject: "",
  permitted_purposes: "",
  restriction_duration_months: "24", // Default 2 years as reasonable under Kenyan law
  effective_date: "",
  termination_conditions: "",
  
  // Kenyan Law Specific Requirements
  governing_law: "Laws of Kenya",
  jurisdiction_courts: "High Court of Kenya",
  arbitration_location: "Nairobi, Kenya",
  dispute_resolution_method: "arbitration", // arbitration, court, mediation
  
  // Financial and Penalty Terms
  breach_penalty_amount: "",
  breach_penalty_currency: "KSH",
  liquidated_damages_basis: "", // calculation method for damages
  
  // Advanced Legal Protections
  survival_clause_years: "5", // How long clauses survive termination
  territorial_restrictions: "Republic of Kenya",
  return_timeline_days: "7", // Days to return confidential materials
  
  // AI Workflow Management
  current_step: "party_details", // party_details, mandatory_clauses, optional_clauses, review, complete
  mandatory_clauses_completed: false,
  ai_generated_clauses: [],
  risk_assessment: null,
  compliance_score: null,
  clause_editing_history: [],
  
  // Contract Tracking
  contract_status: "draft", // draft, pending_second_party, signed, active, terminated
  first_party_verified: false,
  second_party_notified: false,
  audit_trail: []
};

// Mandatory clauses under Kenyan Law for NDAs
const mandatoryClauses = {
  parties_identification: {
    label: "Parties Identification and Legal Capacity",
    mandatory: true,
    kenyan_requirement: true,
    completed: false,
    ai_guidance: "Ensure both parties are properly identified with legal names, addresses, and identification numbers as required under Kenyan law",
    step_order: 1
  },
  definition_of_confidential_information: {
    label: "Definition of Confidential Information",
    mandatory: true,
    kenyan_requirement: true,
    completed: false,
    ai_guidance: "Must clearly define what constitutes confidential information to be enforceable under Kenyan courts",
    step_order: 2
  },
  purpose_and_permitted_use: {
    label: "Purpose of Disclosure and Permitted Use",
    mandatory: true,
    kenyan_requirement: true,
    completed: false,
    ai_guidance: "Clearly state the specific purpose for disclosure and permitted uses to ensure enforceability",
    step_order: 3
  },
  obligations_and_duties: {
    label: "Obligations and Duties of Receiving Party",
    mandatory: true,
    kenyan_requirement: true,
    completed: false,
    ai_guidance: "Detail specific obligations including duty of care, confidentiality standards, and protection measures",
    step_order: 4
  },
  restrictions_and_prohibitions: {
    label: "Restrictions on Use and Disclosure",
    mandatory: true,
    kenyan_requirement: true,
    completed: false,
    ai_guidance: "Specify what the receiving party cannot do with the confidential information",
    step_order: 5
  },
  duration_and_survival: {
    label: "Duration of Confidentiality and Survival",
    mandatory: true,
    kenyan_requirement: true,
    completed: false,
    ai_guidance: "Must specify reasonable duration (typically 2-5 years) and which clauses survive termination",
    step_order: 6
  },
  return_or_destruction: {
    label: "Return or Destruction of Materials",
    mandatory: true,
    kenyan_requirement: true,
    completed: false,
    ai_guidance: "Legal requirement to specify return/destruction process and timeline",
    step_order: 7
  },
  governing_law_jurisdiction: {
    label: "Governing Law and Jurisdiction",
    mandatory: true,
    kenyan_requirement: true,
    completed: false,
    ai_guidance: "Must specify Kenyan law and jurisdiction for enforceability in Kenyan courts",
    step_order: 8
  },
  dispute_resolution: {
    label: "Dispute Resolution Mechanism",
    mandatory: true,
    kenyan_requirement: true,
    completed: false,
    ai_guidance: "Required to specify how disputes will be resolved - arbitration preferred under Kenyan Arbitration Act",
    step_order: 9
  },
  signatures_execution: {
    label: "Signatures and Execution",
    mandatory: true,
    kenyan_requirement: true,
    completed: false,
    ai_guidance: "Legal execution requirements including witness signatures if required",
    step_order: 10
  }
};

// Optional but recommended clauses
const optionalClauses = {
  exceptions_to_confidentiality: {
    label: "Exceptions to Confidentiality (Standard Legal Exceptions)",
    mandatory: false,
    recommended: true,
    risk_level: "low",
    ai_guidance: "Include standard exceptions like publicly available information, independently developed, etc."
  },
  remedies_and_damages: {
    label: "Remedies and Liquidated Damages",
    mandatory: false,
    recommended: true,
    risk_level: "medium",
    ai_guidance: "Specify monetary damages and equitable remedies available for breach"
  },
  non_solicitation: {
    label: "Non-Solicitation of Employees/Customers",
    mandatory: false,
    recommended: false,
    risk_level: "high",
    ai_guidance: "Optional clause that may be too restrictive - use only when necessary"
  },
  intellectual_property_protection: {
    label: "Intellectual Property Rights Protection",
    mandatory: false,
    recommended: true,
    risk_level: "medium",
    ai_guidance: "Clarify that no IP rights are transferred through disclosure"
  },
  modification_amendment: {
    label: "Modification and Amendment Procedures",
    mandatory: false,
    recommended: true,
    risk_level: "low",
    ai_guidance: "Specify how the agreement can be modified in the future"
  },
  force_majeure: {
    label: "Force Majeure Clause",
    mandatory: false,
    recommended: false,
    risk_level: "low",
    ai_guidance: "Consider including for long-term agreements or uncertain circumstances"
  }
};

// Combine all clauses for the template
const initialClauses = { ...mandatoryClauses, ...optionalClauses };

// Clause content templates with Kenyan law guidance
const clauseContentTemplates = {
  parties_identification: {
    template: "This Agreement is entered into between [DISCLOSING_PARTY_NAME], a [PARTY_TYPE] with [ID_TYPE] number [ID_NUMBER], having their principal address at [ADDRESS] (the 'Disclosing Party'), and [RECEIVING_PARTY_NAME], a [PARTY_TYPE] with [ID_TYPE] number [ID_NUMBER], having their principal address at [ADDRESS] (the 'Receiving Party').",
    required_fields: ["disclosing_party_name", "receiving_party_name", "disclosing_party_address", "receiving_party_address"],
    ai_guidance: "Ensure all parties have legal capacity to enter contracts under Kenyan law"
  },
  
  definition_of_confidential_information: {
    template: "'Confidential Information' means any and all non-public, proprietary or confidential information disclosed by the Disclosing Party, including but not limited to: technical data, trade secrets, know-how, research, product plans, products, services, customers, customer lists, markets, software, developments, inventions, processes, formulas, technology, designs, drawings, engineering, hardware configuration information, marketing, finances, or other business information.",
    required_fields: ["confidential_information_scope"],
    ai_guidance: "Must be specific enough to be enforceable but broad enough to cover all relevant information"
  },
  
  purpose_and_permitted_use: {
    template: "The Confidential Information is disclosed solely for the purpose of [PURPOSE_OF_DISCLOSURE]. The Receiving Party may use the Confidential Information only for [PERMITTED_PURPOSES] and for no other purpose without the prior written consent of the Disclosing Party.",
    required_fields: ["purpose_of_disclosure", "permitted_purposes"],
    ai_guidance: "Clear purpose limitation is essential for enforceability under Kenyan contract law"
  },
  
  obligations_and_duties: {
    template: "The Receiving Party undertakes to: (a) hold and maintain the Confidential Information in strict confidence; (b) take reasonable precautions to protect the confidentiality of the information; (c) not disclose any Confidential Information to third parties without prior written consent; (d) limit access to employees or advisors who have a legitimate need to know; and (e) ensure such persons are bound by confidentiality obligations no less restrictive than those contained herein.",
    required_fields: [],
    ai_guidance: "Standard of care must be reasonable and practical - courts will consider industry standards"
  },
  
  restrictions_and_prohibitions: {
    template: "The Receiving Party shall not: (a) use the Confidential Information for any purpose other than the Purpose; (b) disclose, reveal, or make available the Confidential Information to any person or entity; (c) reverse engineer, disassemble, or decompile any prototypes, software, or other tangible materials; (d) copy or reproduce the Confidential Information except as necessary for the Purpose; or (e) remove or alter any proprietary notices.",
    required_fields: [],
    ai_guidance: "Restrictions must be reasonable in scope, duration, and geographical area under Kenyan law"
  },
  
  duration_and_survival: {
    template: "This Agreement shall commence on [EFFECTIVE_DATE] and shall continue for a period of [DURATION_MONTHS] months, unless terminated earlier. The obligations of confidentiality shall survive termination and continue for a period of [SURVIVAL_YEARS] years from the date of termination.",
    required_fields: ["effective_date", "restriction_duration_months", "survival_clause_years"],
    ai_guidance: "Duration must be reasonable - typically 2-5 years is enforceable in Kenya"
  },
  
  return_or_destruction: {
    template: "Upon termination of this Agreement or upon written request by the Disclosing Party, the Receiving Party shall, within [RETURN_TIMELINE_DAYS] days: (a) return all documents, materials, and other tangible manifestations of Confidential Information; and (b) destroy all copies, notes, and derivatives thereof in its possession or control, and provide written certification of such destruction.",
    required_fields: ["return_timeline_days"],
    ai_guidance: "Reasonable timeline for return - typically 7-30 days is standard"
  },
  
  governing_law_jurisdiction: {
    template: "This Agreement shall be governed by and construed in accordance with the laws of the Republic of Kenya. The parties hereby submit to the exclusive jurisdiction of the [JURISDICTION_COURTS] for the resolution of any disputes arising out of or in connection with this Agreement.",
    required_fields: ["jurisdiction_courts"],
    ai_guidance: "Essential for enforceability in Kenyan courts - must specify Kenyan law and jurisdiction"
  },
  
  dispute_resolution: {
    template: "Any dispute, controversy, or claim arising out of or relating to this Agreement shall be resolved through [DISPUTE_RESOLUTION_METHOD]. If arbitration is selected, it shall be conducted in [ARBITRATION_LOCATION] in accordance with the Arbitration Act (Cap 49) of Kenya.",
    required_fields: ["dispute_resolution_method", "arbitration_location"],
    ai_guidance: "Arbitration is often preferred and enforceable under the Kenyan Arbitration Act"
  },
  
  signatures_execution: {
    template: "This Agreement may be executed in counterparts and delivered electronically. Each party represents that the person executing this Agreement on its behalf has the authority to do so.",
    required_fields: [],
    ai_guidance: "Ensure proper execution - witness may be required for some party types"
  }
};

export default function EnhancedNDATemplate({ 
  contractId = null, 
  onSave, 
  onAIAssist, 
  initialData = null,
  aiSuggestions = null 
}) {
  const [formData, setFormData] = useState(initialData || initialFormData);
  const [activeClauses, setActiveClauses] = useState(initialClauses);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [completionStatus, setCompletionStatus] = useState({});
  const [currentStep, setCurrentStep] = useState(formData.current_step);
  const [mandatoryProgress, setMandatoryProgress] = useState(0);
  const [canProceedToNext, setCanProceedToNext] = useState(false);

  // AI Integration hooks
  useEffect(() => {
    if (aiSuggestions) {
      updateFormWithAISuggestions(aiSuggestions);
    }
  }, [aiSuggestions]);

  // Track mandatory clause completion
  useEffect(() => {
    const mandatoryKeys = Object.keys(mandatoryClauses);
    const completedMandatory = mandatoryKeys.filter(key => 
      mandatoryClauses[key].completed || completionStatus[key]
    ).length;
    
    setMandatoryProgress((completedMandatory / mandatoryKeys.length) * 100);
    setCanProceedToNext(completedMandatory === mandatoryKeys.length);
  }, [completionStatus]);

  // Workflow management functions
  const proceedToNextStep = () => {
    const steps = ["party_details", "mandatory_clauses", "optional_clauses", "review", "complete"];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex < steps.length - 1 && canProceedToNext) {
      const nextStep = steps[currentIndex + 1];
      setCurrentStep(nextStep);
      setFormData(prev => ({ ...prev, current_step: nextStep }));
    }
  };

  const goBackToStep = (step) => {
    // Allow going back only if not in review/complete stage
    if (currentStep !== "review" && currentStep !== "complete") {
      setCurrentStep(step);
      setFormData(prev => ({ ...prev, current_step: step }));
    }
  };

  const validateMandatoryRequirements = () => {
    const errors = {};
    
    // Check if user has required verification documents
    if (!formData.disclosing_party_app_id) {
      errors.verification = "User must be registered and verified in the app to create contracts";
    }
    
    // Check mandatory party information
    const requiredPartyFields = [
      'disclosing_party_name', 'disclosing_party_address', 
      'disclosing_party_email', 'disclosing_party_id_number',
      'receiving_party_name', 'receiving_party_email'
    ];
    
    requiredPartyFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        errors[field] = 'This field is required for legal compliance';
      }
    });
    
    // Validate Kenyan legal requirements
    if (formData.restriction_duration_months && 
        (parseInt(formData.restriction_duration_months) > 60)) {
      errors.restriction_duration_months = "Duration over 5 years may not be enforceable under Kenyan law";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value,
      clause_editing_history: [
        ...prev.clause_editing_history,
        { field, value, timestamp: new Date().toISOString() }
      ]
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Update completion status and mandatory clause tracking
    updateCompletionStatus(field, value);
    updateMandatoryClauseCompletion(field, value);
  };

  const handleClauseToggle = (clauseKey) => {
    // Prevent toggling mandatory clauses
    if (mandatoryClauses[clauseKey]) {
      return;
    }
    
    setActiveClauses(prev => ({
      ...prev,
      [clauseKey]: { 
        ...prev[clauseKey], 
        active: !prev[clauseKey].active 
      }
    }));
  };

  const updateMandatoryClauseCompletion = (field, value) => {
    // Check if this field completion affects any mandatory clauses
    Object.keys(mandatoryClauses).forEach(clauseKey => {
      const template = clauseContentTemplates[clauseKey];
      if (template && template.required_fields.includes(field)) {
        const allFieldsCompleted = template.required_fields.every(
          reqField => formData[reqField] && formData[reqField].trim() !== ''
        );
        
        if (allFieldsCompleted) {
          setActiveClauses(prev => ({
            ...prev,
            [clauseKey]: { ...prev[clauseKey], completed: true }
          }));
        }
      }
    });
  };

  const updateCompletionStatus = (field, value) => {
    setCompletionStatus(prev => ({
      ...prev,
      [field]: value && value.trim().length > 0
    }));
  };

  const updateFormWithAISuggestions = (suggestions) => {
    // Apply AI suggestions to form fields
    if (suggestions.formFields) {
      setFormData(prev => ({ ...prev, ...suggestions.formFields }));
    }
    
    // Apply AI clause recommendations
    if (suggestions.recommendedClauses) {
      setActiveClauses(prev => ({ ...prev, ...suggestions.recommendedClauses }));
    }
  };

  const requestAIAssistance = async (context = "general", specificClause = null) => {
    setIsAIProcessing(true);
    try {
      const aiContext = {
        context,
        currentData: formData,
        activeClauses,
        contractType: "nda",
        currentStep,
        mandatoryProgress,
        specificClause,
        kenyanLawRequirements: true,
        legalJurisdiction: "Kenya"
      };
      
      await onAIAssist(aiContext);
    } finally {
      setIsAIProcessing(false);
    }
  };

  const generateClauseText = (clauseKey) => {
    const template = clauseContentTemplates[clauseKey];
    if (!template) return "";
    
    let text = template.template;
    
    // Replace placeholders with actual form data
    const replacements = {
      '[DISCLOSING_PARTY_NAME]': formData.disclosing_party_name || '[TO BE FILLED]',
      '[RECEIVING_PARTY_NAME]': formData.receiving_party_name || '[TO BE FILLED]',
      '[PARTY_TYPE]': formData.disclosing_party_type || 'individual',
      '[ID_TYPE]': formData.disclosing_party_id_type === 'national_id' ? 'National ID' : 'Passport',
      '[ID_NUMBER]': formData.disclosing_party_id_number || '[TO BE FILLED]',
      '[ADDRESS]': formData.disclosing_party_address || '[TO BE FILLED]',
      '[PURPOSE_OF_DISCLOSURE]': formData.purpose_of_disclosure || '[TO BE FILLED]',
      '[PERMITTED_PURPOSES]': formData.permitted_purposes || '[TO BE FILLED]',
      '[EFFECTIVE_DATE]': formData.effective_date || '[TO BE FILLED]',
      '[DURATION_MONTHS]': formData.restriction_duration_months || '24',
      '[SURVIVAL_YEARS]': formData.survival_clause_years || '5',
      '[RETURN_TIMELINE_DAYS]': formData.return_timeline_days || '7',
      '[JURISDICTION_COURTS]': formData.jurisdiction_courts || 'High Court of Kenya',
      '[DISPUTE_RESOLUTION_METHOD]': formData.dispute_resolution_method || 'arbitration',
      '[ARBITRATION_LOCATION]': formData.arbitration_location || 'Nairobi, Kenya'
    };
    
    Object.entries(replacements).forEach(([placeholder, value]) => {
      text = text.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });
    
    return text;
  };

  const validateContract = () => {
    if (!validateMandatoryRequirements()) {
      return false;
    }
    
    // Additional legal validation for Kenyan NDA requirements
    const errors = {};
    
    // Check if all mandatory clauses are completed
    const incompleteMandatory = Object.keys(mandatoryClauses).filter(
      key => !mandatoryClauses[key].completed && !completionStatus[key]
    );
    
    if (incompleteMandatory.length > 0) {
      errors.mandatory_clauses = `Complete all mandatory clauses: ${incompleteMandatory.join(', ')}`;
    }
    
    // Validate duration reasonableness under Kenyan law
    if (parseInt(formData.restriction_duration_months) > 60) {
      errors.duration = "Confidentiality period should not exceed 5 years for enforceability";
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(prev => ({ ...prev, ...errors }));
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (validateContract()) {
      const contractData = {
        template_data: {
          form_fields: formData,
          active_clauses: activeClauses,
          contract_type: "nda",
          version: "2.0",
          kenyan_law_compliant: true,
          mandatory_clauses_completed: mandatoryProgress === 100,
          generated_clauses: Object.keys(mandatoryClauses).reduce((acc, key) => {
            acc[key] = generateClauseText(key);
            return acc;
          }, {})
        },
        type: "Non-Disclosure Agreement (Kenya)",
        title: `NDA: ${formData.disclosing_party_name} & ${formData.receiving_party_name}`,
        status: "draft",
        jurisdiction: "Kenya",
        governing_law: "Laws of Kenya",
        created_by: formData.disclosing_party_app_id,
        workflow_step: currentStep,
        audit_trail: [{
          action: "contract_created",
          timestamp: new Date().toISOString(),
          user_id: formData.disclosing_party_app_id
        }]
      };
      
      await onSave(contractData);
    }
  };

  const sendToSecondParty = async () => {
    if (formData.receiving_party_app_id && mandatoryProgress === 100) {
      const notificationData = {
        contract_id: contractId,
        from_party: formData.disclosing_party_app_id,
        to_party: formData.receiving_party_app_id,
        contract_type: "nda",
        status: "pending_signature"
      };
      
      // This would trigger the second party notification
      // onSendToSecondParty(notificationData);
    }
  };

  const getRiskBadgeColor = (riskLevel) => {
    switch (riskLevel) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT
        </h1>
        <p className="text-gray-600">Under the Laws of the Republic of Kenya</p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Kenyan Law Compliant
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            AI-Guided Creation
          </Badge>
        </div>
      </div>

      {/* Progress Indicator */}
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Contract Creation Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Step indicators */}
            <div className="flex items-center justify-between text-sm">
              <div className={`flex items-center gap-2 ${currentStep === 'party_details' ? 'text-blue-600 font-medium' : currentStep === 'mandatory_clauses' || currentStep === 'optional_clauses' || currentStep === 'review' || currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep === 'party_details' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>1</div>
                Party Details
              </div>
              <div className={`flex items-center gap-2 ${currentStep === 'mandatory_clauses' ? 'text-blue-600 font-medium' : currentStep === 'optional_clauses' || currentStep === 'review' || currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep === 'mandatory_clauses' ? 'bg-blue-100 text-blue-600' : currentStep === 'optional_clauses' || currentStep === 'review' || currentStep === 'complete' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>2</div>
                Mandatory Clauses
              </div>
              <div className={`flex items-center gap-2 ${currentStep === 'optional_clauses' ? 'text-blue-600 font-medium' : currentStep === 'review' || currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep === 'optional_clauses' ? 'bg-blue-100 text-blue-600' : currentStep === 'review' || currentStep === 'complete' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>3</div>
                Optional Clauses
              </div>
              <div className={`flex items-center gap-2 ${currentStep === 'review' ? 'text-blue-600 font-medium' : currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep === 'review' ? 'bg-blue-100 text-blue-600' : currentStep === 'complete' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>4</div>
                Review
              </div>
              <div className={`flex items-center gap-2 ${currentStep === 'complete' ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep === 'complete' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>5</div>
                Complete
              </div>
            </div>
            
            {/* Mandatory clauses progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Mandatory Legal Requirements</span>
                <span>{Math.round(mandatoryProgress)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${mandatoryProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Alerts */}
      {Object.keys(validationErrors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please fix the following issues: {Object.values(validationErrors).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* AI Assistant Panel */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Sparkles className="w-5 h-5" />
            AI Legal Assistant - Kenyan Law Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => requestAIAssistance("party_verification")}
              disabled={isAIProcessing}
            >
              Verify Party Information
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => requestAIAssistance("mandatory_clauses")}
              disabled={isAIProcessing}
            >
              Guide Mandatory Clauses
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => requestAIAssistance("kenyan_law_review")}
              disabled={isAIProcessing}
            >
              Kenyan Law Review
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => requestAIAssistance("suggest_improvements")}
              disabled={isAIProcessing}
            >
              Suggest Improvements
            </Button>
          </div>
          {isAIProcessing && (
            <div className="mt-3 text-sm text-blue-600">
              AI is analyzing your contract for Kenyan law compliance...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Party Information - Enhanced for Kenyan Legal Requirements */}
      {(currentStep === 'party_details' || currentStep === 'review') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Party Information (Required for Legal Validity)
            </CardTitle>
            <p className="text-sm text-gray-600">
              Complete information is required for enforceability under Kenyan law
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Disclosing Party */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-2">
                  Disclosing Party (First Party)
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Legal Name *</label>
                    <Input
                      placeholder="Full Name or Registered Company Name"
                      value={formData.disclosing_party_name}
                      onChange={(e) => handleFieldChange("disclosing_party_name", e.target.value)}
                      className={validationErrors.disclosing_party_name ? "border-red-500" : ""}
                    />
                    {validationErrors.disclosing_party_name && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.disclosing_party_name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Party Type *</label>
                    <select
                      value={formData.disclosing_party_type}
                      onChange={(e) => handleFieldChange("disclosing_party_type", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="individual">Individual</option>
                      <option value="company">Limited Company</option>
                      <option value="partnership">Partnership</option>
                      <option value="sole_proprietorship">Sole Proprietorship</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">ID Type *</label>
                      <select
                        value={formData.disclosing_party_id_type}
                        onChange={(e) => handleFieldChange("disclosing_party_id_type", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="national_id">National ID</option>
                        <option value="passport">Passport</option>
                        <option value="company_registration">Company Registration</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">ID Number *</label>
                      <Input
                        placeholder="ID Number"
                        value={formData.disclosing_party_id_number}
                        onChange={(e) => handleFieldChange("disclosing_party_id_number", e.target.value)}
                        className={validationErrors.disclosing_party_id_number ? "border-red-500" : ""}
                      />
                    </div>
                  </div>
                  
                  {formData.disclosing_party_type !== 'individual' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Business Registration Number</label>
                      <Input
                        placeholder="Company/Business Registration Number"
                        value={formData.disclosing_party_business_registration}
                        onChange={(e) => handleFieldChange("disclosing_party_business_registration", e.target.value)}
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Physical Address *</label>
                    <Textarea
                      placeholder="Full Address (Street, City, County, Kenya)"
                      value={formData.disclosing_party_address}
                      onChange={(e) => handleFieldChange("disclosing_party_address", e.target.value)}
                      rows={3}
                      className={validationErrors.disclosing_party_address ? "border-red-500" : ""}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Email Address *</label>
                      <Input
                        placeholder="Email Address"
                        type="email"
                        value={formData.disclosing_party_email}
                        onChange={(e) => handleFieldChange("disclosing_party_email", e.target.value)}
                        className={validationErrors.disclosing_party_email ? "border-red-500" : ""}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone Number</label>
                      <Input
                        placeholder="+254..."
                        value={formData.disclosing_party_phone}
                        onChange={(e) => handleFieldChange("disclosing_party_phone", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">App ID (Auto-filled)</label>
                    <Input
                      placeholder="User App ID"
                      value={formData.disclosing_party_app_id}
                      onChange={(e) => handleFieldChange("disclosing_party_app_id", e.target.value)}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Receiving Party */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-2">
                  Receiving Party (Second Party)
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Legal Name *</label>
                    <Input
                      placeholder="Full Name or Registered Company Name"
                      value={formData.receiving_party_name}
                      onChange={(e) => handleFieldChange("receiving_party_name", e.target.value)}
                      className={validationErrors.receiving_party_name ? "border-red-500" : ""}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Party Type</label>
                    <select
                      value={formData.receiving_party_type}
                      onChange={(e) => handleFieldChange("receiving_party_type", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="individual">Individual</option>
                      <option value="company">Limited Company</option>
                      <option value="partnership">Partnership</option>
                      <option value="sole_proprietorship">Sole Proprietorship</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">ID Type</label>
                      <select
                        value={formData.receiving_party_id_type}
                        onChange={(e) => handleFieldChange("receiving_party_id_type", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="national_id">National ID</option>
                        <option value="passport">Passport</option>
                        <option value="company_registration">Company Registration</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">ID Number</label>
                      <Input
                        placeholder="ID Number (Optional)"
                        value={formData.receiving_party_id_number}
                        onChange={(e) => handleFieldChange("receiving_party_id_number", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {formData.receiving_party_type !== 'individual' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Business Registration Number</label>
                      <Input
                        placeholder="Company/Business Registration Number"
                        value={formData.receiving_party_business_registration}
                        onChange={(e) => handleFieldChange("receiving_party_business_registration", e.target.value)}
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Physical Address</label>
                    <Textarea
                      placeholder="Full Address (Street, City, County, Kenya)"
                      value={formData.receiving_party_address}
                      onChange={(e) => handleFieldChange("receiving_party_address", e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Email Address *</label>
                      <Input
                        placeholder="Email Address"
                        type="email"
                        value={formData.receiving_party_email}
                        onChange={(e) => handleFieldChange("receiving_party_email", e.target.value)}
                        className={validationErrors.receiving_party_email ? "border-red-500" : ""}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone Number</label>
                      <Input
                        placeholder="+254..."
                        value={formData.receiving_party_phone}
                        onChange={(e) => handleFieldChange("receiving_party_phone", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">App ID (If registered)</label>
                    <Input
                      placeholder="Second Party App ID"
                      value={formData.receiving_party_app_id}
                      onChange={(e) => handleFieldChange("receiving_party_app_id", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {currentStep === 'party_details' && (
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={proceedToNextStep}
                  disabled={!validateMandatoryRequirements()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Proceed to Mandatory Clauses
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contract Terms */}
      {(currentStep === 'party_details' || currentStep === 'mandatory_clauses' || currentStep === 'review') && (
        <Card>
          <CardHeader>
            <CardTitle>Essential Contract Terms</CardTitle>
            <p className="text-sm text-gray-600">
              These terms define the scope and purpose of the confidentiality agreement
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Purpose of Disclosure *</label>
              <Textarea
                placeholder="Describe the specific business purpose for sharing confidential information (e.g., 'Exploring potential business partnership in software development')"
                value={formData.purpose_of_disclosure}
                onChange={(e) => handleFieldChange("purpose_of_disclosure", e.target.value)}
                className={validationErrors.purpose_of_disclosure ? "border-red-500" : ""}
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Permitted Use of Information *</label>
              <Textarea
                placeholder="Describe what the receiving party is allowed to do with the confidential information"
                value={formData.permitted_purposes}
                onChange={(e) => handleFieldChange("permitted_purposes", e.target.value)}
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Scope of Confidential Information *</label>
              <Textarea
                placeholder="Define what specific information will be considered confidential..."
                value={formData.confidential_information_scope}
                onChange={(e) => handleFieldChange("confidential_information_scope", e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Confidentiality Duration (Months) *</label>
                <Input
                  type="number"
                  value={formData.restriction_duration_months}
                  onChange={(e) => handleFieldChange("restriction_duration_months", e.target.value)}
                  min="1"
                  max="60"
                  placeholder="24"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum 60 months (5 years) recommended under Kenyan law</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Effective Date *</label>
                <Input
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => handleFieldChange("effective_date", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Return Timeline (Days)</label>
                <Input
                  type="number"
                  value={formData.return_timeline_days}
                  onChange={(e) => handleFieldChange("return_timeline_days", e.target.value)}
                  min="1"
                  max="30"
                  placeholder="7"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Dispute Resolution Method</label>
                <select
                  value={formData.dispute_resolution_method}
                  onChange={(e) => handleFieldChange("dispute_resolution_method", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="arbitration">Arbitration (Recommended)</option>
                  <option value="court">Court Proceedings</option>
                  <option value="mediation">Mediation First, then Arbitration</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Arbitration/Court Location</label>
                <Input
                  placeholder="Nairobi, Kenya"
                  value={formData.arbitration_location}
                  onChange={(e) => handleFieldChange("arbitration_location", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mandatory Clauses - Step by Step */}
      {currentStep === 'mandatory_clauses' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-red-600" />
              Mandatory Legal Clauses (Required by Kenyan Law)
            </CardTitle>
            <p className="text-sm text-gray-600">
              Complete each clause step-by-step. These are legally required for enforceability in Kenyan courts.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(mandatoryClauses)
              .sort(([,a], [,b]) => a.step_order - b.step_order)
              .map(([clauseKey, clause]) => (
              <div key={clauseKey} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    clause.completed || completionStatus[clauseKey] 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {clause.step_order}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">
                        {clause.label}
                      </h4>
                      <Badge variant="destructive" className="text-xs">
                        Mandatory
                      </Badge>
                      {clause.completed || completionStatus[clauseKey] ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {clause.ai_guidance}
                    </p>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h5 className="text-sm font-medium mb-2">Generated Clause:</h5>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {generateClauseText(clauseKey)}
                      </p>
                    </div>
                    
                    <div className="mt-3 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => requestAIAssistance("clause_guidance", clauseKey)}
                        disabled={isAIProcessing}
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Guidance
                      </Button>
                      <Button 
                        size="sm"
                        variant={clause.completed || completionStatus[clauseKey] ? "secondary" : "default"}
                        onClick={() => {
                          const newStatus = { ...activeClauses };
                          newStatus[clauseKey] = { ...newStatus[clauseKey], completed: true };
                          setActiveClauses(newStatus);
                        }}
                      >
                        {clause.completed || completionStatus[clauseKey] ? "Completed ✓" : "Mark Complete"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline"
                onClick={() => goBackToStep('party_details')}
              >
                Back to Party Details
              </Button>
              <Button 
                onClick={proceedToNextStep}
                disabled={!canProceedToNext}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Proceed to Optional Clauses
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optional Clauses */}
      {currentStep === 'optional_clauses' && (
        <Card>
          <CardHeader>
            <CardTitle>Optional Clauses</CardTitle>
            <p className="text-sm text-gray-600">
              These clauses can strengthen your agreement but are not legally required.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(optionalClauses).map(([clauseKey, clause]) => (
              <div key={clauseKey} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={activeClauses[clauseKey]?.active || false}
                    onCheckedChange={() => handleClauseToggle(clauseKey)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">
                        {clause.label}
                      </h4>
                      <Badge 
                        variant={clause.recommended ? "secondary" : "outline"} 
                        className="text-xs"
                      >
                        {clause.recommended ? "Recommended" : "Optional"}
                      </Badge>
                      <Badge className={`text-xs ${getRiskBadgeColor(clause.risk_level)}`}>
                        {clause.risk_level} risk
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {clause.ai_guidance}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline"
                onClick={() => goBackToStep('mandatory_clauses')}
              >
                Back to Mandatory Clauses
              </Button>
              <Button 
                onClick={proceedToNextStep}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Review Contract
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Section */}
      {currentStep === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Contract Review & Final Polish
            </CardTitle>
            <p className="text-sm text-gray-600">
              Review your complete NDA before finalizing. AI will perform final legal checks.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Once you proceed to completion, you will not be able to edit the mandatory clauses.
                Optional clauses and party information can be modified until the contract is signed.
              </AlertDescription>
            </Alert>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Contract Summary</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Disclosing Party:</strong> {formData.disclosing_party_name}</p>
                  <p><strong>Receiving Party:</strong> {formData.receiving_party_name}</p>
                  <p><strong>Purpose:</strong> {formData.purpose_of_disclosure}</p>
                </div>
                <div>
                  <p><strong>Duration:</strong> {formData.restriction_duration_months} months</p>
                  <p><strong>Effective Date:</strong> {formData.effective_date}</p>
                  <p><strong>Jurisdiction:</strong> {formData.jurisdiction_courts}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Active Clauses Summary:</h4>
              <div className="grid md:grid-cols-2 gap-2">
                {Object.entries(mandatoryClauses).map(([key, clause]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    {clause.label}
                  </div>
                ))}
                {Object.entries(optionalClauses)
                  .filter(([key]) => activeClauses[key]?.active)
                  .map(([key, clause]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    {clause.label}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline"
                onClick={() => goBackToStep('optional_clauses')}
              >
                Back to Optional Clauses
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => requestAIAssistance("final_review")}
                  disabled={isAIProcessing}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Final Review
                </Button>
                <Button 
                  onClick={proceedToNextStep}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Finalize Contract
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Section */}
      {currentStep === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Contract Completed
            </CardTitle>
            <p className="text-sm text-gray-600">
              Your NDA has been created and is ready for execution.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Contract has passed all Kenyan law compliance checks and is ready for signing.
              </AlertDescription>
            </Alert>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Next Steps:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Review final document</li>
                  <li>• Send to second party for review</li>
                  <li>• Both parties sign digitally</li>
                  <li>• Contract becomes legally binding</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Legal Protections:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Enforceable in Kenyan courts</li>
                  <li>• Complies with Contract Act (Cap 23)</li>
                  <li>• Includes arbitration clause</li>
                  <li>• Digital audit trail maintained</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save Draft
              </Button>
              {formData.receiving_party_app_id && (
                <Button 
                  onClick={sendToSecondParty}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Send to Second Party
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={() => requestAIAssistance("export_options")}
              >
                Export Options
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions - Only show for non-complete steps */}
      {currentStep !== 'complete' && (
        <div className="flex gap-4 justify-between">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => requestAIAssistance("general_help")}
              disabled={isAIProcessing}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Help
            </Button>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleSave}
            >
              Save Progress
            </Button>
            {currentStep === 'review' && (
              <Button 
                onClick={() => requestAIAssistance("kenyan_law_final_check")}
                disabled={isAIProcessing}
                className="bg-red-600 hover:bg-red-700"
              >
                Final Legal Check
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced clause content component for better AI integration
function ClauseContent({ clauseKey, formData, onFieldChange }) {
  const template = clauseContentTemplates[clauseKey];
  
  // Generate clause text with current form data
  const generateClauseText = (clauseKey) => {
    const template = clauseContentTemplates[clauseKey];
    if (!template) return "";
    
    let text = template.template;
    
    // Replace placeholders with actual form data
    const replacements = {
      '[DISCLOSING_PARTY_NAME]': formData.disclosing_party_name || '[TO BE FILLED]',
      '[RECEIVING_PARTY_NAME]': formData.receiving_party_name || '[TO BE FILLED]',
      '[PARTY_TYPE]': formData.disclosing_party_type || 'individual',
      '[ID_TYPE]': formData.disclosing_party_id_type === 'national_id' ? 'National ID' : 'Passport',
      '[ID_NUMBER]': formData.disclosing_party_id_number || '[TO BE FILLED]',
      '[ADDRESS]': formData.disclosing_party_address || '[TO BE FILLED]',
      '[PURPOSE_OF_DISCLOSURE]': formData.purpose_of_disclosure || '[TO BE FILLED]',
      '[PERMITTED_PURPOSES]': formData.permitted_purposes || '[TO BE FILLED]',
      '[EFFECTIVE_DATE]': formData.effective_date || '[TO BE FILLED]',
      '[DURATION_MONTHS]': formData.restriction_duration_months || '24',
      '[SURVIVAL_YEARS]': formData.survival_clause_years || '5',
      '[RETURN_TIMELINE_DAYS]': formData.return_timeline_days || '7',
      '[JURISDICTION_COURTS]': formData.jurisdiction_courts || 'High Court of Kenya',
      '[DISPUTE_RESOLUTION_METHOD]': formData.dispute_resolution_method || 'arbitration',
      '[ARBITRATION_LOCATION]': formData.arbitration_location || 'Nairobi, Kenya'
    };
    
    Object.entries(replacements).forEach(([placeholder, value]) => {
      text = text.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });
    
    return text;
  };
  
  if (!template) {
    return (
      <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
        <p>Standard clause for {clauseKey.replace(/_/g, ' ')}.</p>
        <p className="mt-2 text-xs">This clause will be auto-generated based on your form inputs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700 p-3 bg-blue-50 rounded">
        <h5 className="font-medium mb-2">AI Guidance:</h5>
        <p>{template.ai_guidance}</p>
      </div>
      
      <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded">
        <h5 className="font-medium mb-2">Generated Clause Text:</h5>
        <div className="whitespace-pre-wrap font-mono text-xs">
          {generateClauseText(clauseKey)}
        </div>
      </div>
      
      {template.required_fields && template.required_fields.length > 0 && (
        <div className="text-sm text-gray-600">
          <p className="font-medium mb-1">Required Information:</p>
          <ul className="text-xs space-y-1">
            {template.required_fields.map(field => (
              <li key={field} className="flex items-center gap-2">
                {formData[field] && formData[field].trim() !== '' ? (
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-red-600" />
                )}
                {field.replace(/_/g, ' ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Legacy clause content for backward compatibility
function LegacyClauseContent({ clauseKey, formData, onFieldChange }) {
  switch (clauseKey) {
    case 'non_compete':
      return (
        <p className="text-sm text-gray-700">
          The Receiving Party shall not engage in competing activities or provide similar services 
          without written consent from the Disclosing Party during the restriction period.
        </p>
      );
      
    case 'return_destroy':
      return (
        <p className="text-sm text-gray-700">
          Upon termination or request, the Receiving Party must return or destroy all confidential 
          materials and provide written confirmation of compliance.
        </p>
      );
      
    case 'arbitration':
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            Any disputes shall be resolved through arbitration in:
          </p>
          <Input
            placeholder="Arbitration location"
            value={formData.arbitration_location}
            onChange={(e) => onFieldChange("arbitration_location", e.target.value)}
            className="max-w-xs"
          />
        </div>
      );
      
    case 'liquidated_damages':
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            In case of breach, the Receiving Party agrees to pay liquidated damages of:
          </p>
          <div className="flex gap-2 max-w-xs">
            <Input
              placeholder="Amount"
              value={formData.breach_penalty_amount}
              onChange={(e) => onFieldChange("breach_penalty_amount", e.target.value)}
            />
            <select
              value={formData.breach_penalty_currency}
              onChange={(e) => onFieldChange("breach_penalty_currency", e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="KSH">KSH</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      );

    case 'restrictions_on_use':
      return (
        <p className="text-sm text-gray-700">
          The Receiving Party undertakes not to use the Confidential Information for any purpose other than:
          (i) that for which it is disclosed; and (ii) in accordance with the provisions of this Agreement.
          The Receiving Party shall not use the Confidential Information for personal gain, to develop their own business,
          or consult with other professionals.
        </p>
      );

    case 'return_of_material':
      return (
        <p className="text-sm text-gray-700">
          The Disclosing Party may, at any time, request the return of all materials containing or pertaining to
          Confidential Information. The Receiving Party must return or destroy all such materials within 7 days
          and provide written confirmation that none is retained in any form.
        </p>
      );

    case 'entire_agreement':
      return (
        <p className="text-sm text-gray-700">
          This Agreement constitutes the entire agreement between the Parties with respect to the subject matter herein
          and supersedes all prior understandings, whether oral or written. No amendment shall be effective unless
          in writing and signed by both Parties.
        </p>
      );
      
    default:
      return (
        <p className="text-sm text-gray-700">
          Standard clause content for {clauseKey.replace(/_/g, ' ')}.
        </p>
      );
  }
}
