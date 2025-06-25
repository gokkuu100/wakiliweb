import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

const initialFormData = {
  // Party Information
  disclosing_party_name: "",
  disclosing_party_address: "",
  disclosing_party_email: "",
  disclosing_party_id_number: "",
  receiving_party_name: "",
  receiving_party_address: "",
  receiving_party_email: "",
  receiving_party_id_number: "",
  
  // Contract Terms
  discussion_subject: "",
  additional_info_types: "",
  restriction_duration_months: "60",
  arbitration_location: "Nairobi",
  governing_law: "Laws of Kenya",
  effective_date: "",
  
  // Financial Terms
  penalty_amount: "",
  penalty_currency: "KSH",
  
  // Advanced Clauses
  survival_clause_years: "2",
  territorial_restrictions: "Kenya",
  
  // AI-Generated Content
  ai_generated_clauses: [],
  risk_assessment: null,
  compliance_score: null
};

const initialClauses = {
  non_compete: { active: true, ai_recommended: true, risk_level: "medium" },
  return_destroy: { active: true, ai_recommended: true, risk_level: "low" },
  arbitration: { active: true, ai_recommended: true, risk_level: "low" },
  liquidated_damages: { active: false, ai_recommended: false, risk_level: "high" },
  survival: { active: true, ai_recommended: true, risk_level: "medium" },
  territorial_scope: { active: false, ai_recommended: false, risk_level: "medium" },
  notification_requirements: { active: true, ai_recommended: true, risk_level: "low" }
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

  // AI Integration hooks
  useEffect(() => {
    if (aiSuggestions) {
      updateFormWithAISuggestions(aiSuggestions);
    }
  }, [aiSuggestions]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Update completion status
    updateCompletionStatus(field, value);
  };

  const handleClauseToggle = (clauseKey) => {
    setActiveClauses(prev => ({
      ...prev,
      [clauseKey]: { 
        ...prev[clauseKey], 
        active: !prev[clauseKey].active 
      }
    }));
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

  const requestAIAssistance = async (context = "general") => {
    setIsAIProcessing(true);
    try {
      await onAIAssist({
        context,
        currentData: formData,
        activeClauses,
        contractType: "nda"
      });
    } finally {
      setIsAIProcessing(false);
    }
  };

  const validateContract = () => {
    const errors = {};
    
    // Required fields validation
    const requiredFields = [
      'disclosing_party_name', 'receiving_party_name',
      'disclosing_party_email', 'receiving_party_email',
      'discussion_subject'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        errors[field] = 'This field is required';
      }
    });
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    ['disclosing_party_email', 'receiving_party_email'].forEach(field => {
      if (formData[field] && !emailRegex.test(formData[field])) {
        errors[field] = 'Please enter a valid email address';
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (validateContract()) {
      const contractData = {
        template_data: {
          form_fields: formData,
          active_clauses: activeClauses,
          contract_type: "nda",
          version: "1.0"
        },
        type: "Non-Disclosure Agreement",
        title: `NDA: ${formData.disclosing_party_name} & ${formData.receiving_party_name}`,
        status: "draft"
      };
      
      onSave(contractData);
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
        <p className="text-gray-600">Under the Laws of Kenya</p>
      </div>

      {/* AI Assistant Panel */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Sparkles className="w-5 h-5" />
            AI Contract Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => requestAIAssistance("parties")}
              disabled={isAIProcessing}
            >
              Help with Party Details
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => requestAIAssistance("clauses")}
              disabled={isAIProcessing}
            >
              Suggest Clauses
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => requestAIAssistance("review")}
              disabled={isAIProcessing}
            >
              Review Contract
            </Button>
          </div>
          {isAIProcessing && (
            <div className="mt-3 text-sm text-blue-600">
              AI is analyzing your contract...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Party Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Party Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Disclosing Party */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Disclosing Party</h3>
              <div className="space-y-3">
                <div>
                  <Input
                    placeholder="Full Name or Company Name"
                    value={formData.disclosing_party_name}
                    onChange={(e) => handleFieldChange("disclosing_party_name", e.target.value)}
                    className={validationErrors.disclosing_party_name ? "border-red-500" : ""}
                  />
                  {validationErrors.disclosing_party_name && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.disclosing_party_name}</p>
                  )}
                </div>
                <Textarea
                  placeholder="Full Address"
                  value={formData.disclosing_party_address}
                  onChange={(e) => handleFieldChange("disclosing_party_address", e.target.value)}
                  rows={3}
                />
                <Input
                  placeholder="Email Address"
                  type="email"
                  value={formData.disclosing_party_email}
                  onChange={(e) => handleFieldChange("disclosing_party_email", e.target.value)}
                  className={validationErrors.disclosing_party_email ? "border-red-500" : ""}
                />
                <Input
                  placeholder="ID Number (Optional)"
                  value={formData.disclosing_party_id_number}
                  onChange={(e) => handleFieldChange("disclosing_party_id_number", e.target.value)}
                />
              </div>
            </div>

            {/* Receiving Party */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Receiving Party</h3>
              <div className="space-y-3">
                <Input
                  placeholder="Full Name or Company Name"
                  value={formData.receiving_party_name}
                  onChange={(e) => handleFieldChange("receiving_party_name", e.target.value)}
                  className={validationErrors.receiving_party_name ? "border-red-500" : ""}
                />
                <Textarea
                  placeholder="Full Address"
                  value={formData.receiving_party_address}
                  onChange={(e) => handleFieldChange("receiving_party_address", e.target.value)}
                  rows={3}
                />
                <Input
                  placeholder="Email Address"
                  type="email"
                  value={formData.receiving_party_email}
                  onChange={(e) => handleFieldChange("receiving_party_email", e.target.value)}
                  className={validationErrors.receiving_party_email ? "border-red-500" : ""}
                />
                <Input
                  placeholder="ID Number (Optional)"
                  value={formData.receiving_party_id_number}
                  onChange={(e) => handleFieldChange("receiving_party_id_number", e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Subject of Discussion</label>
            <Textarea
              placeholder="Describe what the parties will be discussing..."
              value={formData.discussion_subject}
              onChange={(e) => handleFieldChange("discussion_subject", e.target.value)}
              className={validationErrors.discussion_subject ? "border-red-500" : ""}
              rows={3}
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Restriction Duration (Months)</label>
              <Input
                type="number"
                value={formData.restriction_duration_months}
                onChange={(e) => handleFieldChange("restriction_duration_months", e.target.value)}
                min="1"
                max="120"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Effective Date</label>
              <Input
                type="date"
                value={formData.effective_date}
                onChange={(e) => handleFieldChange("effective_date", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Additional Information Types</label>
            <Textarea
              placeholder="Specify any additional confidential information types..."
              value={formData.additional_info_types}
              onChange={(e) => handleFieldChange("additional_info_types", e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contract Clauses */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Clauses</CardTitle>
          <p className="text-sm text-gray-600">
            Toggle clauses on/off based on your requirements. AI recommendations are marked with badges.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(activeClauses).map(([clauseKey, clause]) => (
            <div key={clauseKey} className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={clause.active}
                  onCheckedChange={() => handleClauseToggle(clauseKey)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium capitalize">
                      {clauseKey.replace(/_/g, ' ')}
                    </h4>
                    {clause.ai_recommended && (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Recommended
                      </Badge>
                    )}
                    <Badge className={`text-xs ${getRiskBadgeColor(clause.risk_level)}`}>
                      {clause.risk_level} risk
                    </Badge>
                  </div>
                  <ClauseContent clauseKey={clauseKey} formData={formData} onFieldChange={handleFieldChange} />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={() => requestAIAssistance("review")}>
          AI Review
        </Button>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          Save Contract
        </Button>
      </div>
    </div>
  );
}

// Individual clause content components
function ClauseContent({ clauseKey, formData, onFieldChange }) {
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
              value={formData.penalty_amount}
              onChange={(e) => onFieldChange("penalty_amount", e.target.value)}
            />
            <select
              value={formData.penalty_currency}
              onChange={(e) => onFieldChange("penalty_currency", e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="KSH">KSH</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      );
      
    default:
      return (
        <p className="text-sm text-gray-700">
          Standard clause content for {clauseKey.replace(/_/g, ' ')}.
        </p>
      );
  }
}
