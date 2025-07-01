/**
 * AI Preferences Settings Component
 * Allows users to customize their AI chat experience
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  Brain, 
  MessageSquare, 
  Settings, 
  Zap, 
  Shield,
  Globe,
  BookOpen,
  Save,
  RefreshCw,
  Crown,
  Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getUserAIPreferences, 
  updateUserAIPreferences, 
  UserAIPreferences,
  UserAIPreferencesUpdate,
  getResponseStyleDescriptions,
  getModelRecommendations,
  validatePreferences
} from '@/lib/database/ai-preferences';

interface AIPreferencesSettingsProps {
  onPreferencesChange?: (preferences: UserAIPreferences) => void;
}

export function AIPreferencesSettings({ onPreferencesChange }: AIPreferencesSettingsProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  
  const [preferences, setPreferences] = useState<UserAIPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const isLawyer = userProfile?.user_type === 'lawyer';
  const styleDescriptions = getResponseStyleDescriptions();
  const modelRecommendations = getModelRecommendations(userProfile?.user_type || 'citizen');

  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    }
  }, [user?.id]);

  const loadPreferences = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const prefs = await getUserAIPreferences(user.id);
      
      // Enforce citizen restrictions
      if (prefs && !isLawyer) {
        prefs.response_style = 'simple';
        prefs.response_language = 'en';
      }
      
      setPreferences(prefs);
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading AI preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load AI preferences",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (updates: UserAIPreferencesUpdate) => {
    if (!user?.id || !preferences) return;

    const errors = validatePreferences(updates);
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const updatedPrefs = await updateUserAIPreferences(user.id, updates);
      if (updatedPrefs) {
        setPreferences(updatedPrefs);
        setHasChanges(false);
        onPreferencesChange?.(updatedPrefs);
        toast({
          title: "Preferences Updated",
          description: "Your AI preferences have been saved successfully"
        });
      }
    } catch (error) {
      console.error('Error updating AI preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update AI preferences",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: keyof UserAIPreferences, value: any) => {
    if (!preferences) return;
    
    // Enforce restrictions for citizens
    if (!isLawyer) {
      if (field === 'response_style' && value !== 'simple') {
        toast({
          title: "Restricted Setting",
          description: "Citizens can only use simple response style",
          variant: "destructive"
        });
        return;
      }
      if (field === 'response_language' && value !== 'en') {
        toast({
          title: "Restricted Setting", 
          description: "Citizens can only use English language",
          variant: "destructive"
        });
        return;
      }
    }
    
    setPreferences(prev => prev ? { ...prev, [field]: value } : null);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!preferences || !hasChanges) return;
    
    const updates: UserAIPreferencesUpdate = {
      response_style: preferences.response_style,
      include_citations: preferences.include_citations,
      max_sources: preferences.max_sources,
      max_tokens_per_response: preferences.max_tokens_per_response,
      daily_query_limit: preferences.daily_query_limit,
      enable_document_analysis: preferences.enable_document_analysis,
      enable_case_suggestions: preferences.enable_case_suggestions,
      response_language: preferences.response_language,
      use_kenyan_context: preferences.use_kenyan_context,
      include_act_references: preferences.include_act_references,
      store_conversation_history: preferences.store_conversation_history,
      allow_usage_analytics: preferences.allow_usage_analytics,
    };

    handleUpdate(updates);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading preferences...
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Alert>
            <AlertDescription>
              Failed to load AI preferences. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">AI Preferences</h2>
            <p className="text-gray-600">Customize your AI assistant experience</p>
          </div>
        </div>
        {isLawyer && (
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Crown className="h-3 w-3" />
            <span>Lawyer</span>
          </Badge>
        )}
      </div>

      {/* Response Style */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Response Style</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>How detailed should AI responses be?</Label>
            {isLawyer ? (
              <Select 
                value={preferences.response_style} 
                onValueChange={(value: any) => handleFieldChange('response_style', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(styleDescriptions).map(([key, style]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span className="font-medium">{style.title}</span>
                        <span className="text-sm text-gray-500">{style.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Simple</span>
                    <p className="text-sm text-gray-600">Clear, easy-to-understand responses with minimal legal jargon</p>
                  </div>
                  <Badge variant="secondary">Citizens Only</Badge>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Include Legal Citations</Label>
              <p className="text-sm text-gray-500">Show sources and legal references</p>
            </div>
            <Switch
              checked={preferences.include_citations}
              onCheckedChange={(checked) => handleFieldChange('include_citations', checked)}
            />
          </div>

          <div>
            <Label>Maximum Sources per Response: {preferences.max_sources}</Label>
            <Slider
              value={[preferences.max_sources]}
              onValueChange={([value]) => handleFieldChange('max_sources', value)}
              min={1}
              max={20}
              step={1}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Model Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>AI Model</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              <strong>{isLawyer ? 'Lawyer' : 'Citizen'} Model: {preferences.preferred_model}</strong>
              <br />
              {modelRecommendations.description}
            </AlertDescription>
          </Alert>

          <div>
            <Label>Max Response Length: {preferences.max_tokens_per_response} tokens</Label>
            <Slider
              value={[preferences.max_tokens_per_response]}
              onValueChange={([value]) => handleFieldChange('max_tokens_per_response', value)}
              min={500}
              max={isLawyer ? 4000 : 3000}
              step={100}
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Longer responses provide more detail but use more tokens
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Usage Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Usage Limits</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Daily Query Limit: {preferences.daily_query_limit}</Label>
            <Slider
              value={[preferences.daily_query_limit]}
              onValueChange={([value]) => handleFieldChange('daily_query_limit', value)}
              min={10}
              max={isLawyer ? 200 : 100}
              step={10}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLawyer && (
            <div className="flex items-center justify-between">
              <div>
                <Label>Legal Research Mode</Label>
                <p className="text-sm text-gray-500">Advanced research capabilities</p>
              </div>
              <Badge variant="outline">Enabled for Lawyers</Badge>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>Document Analysis</Label>
              <p className="text-sm text-gray-500">Analyze uploaded documents</p>
            </div>
            <Switch
              checked={preferences.enable_document_analysis}
              onCheckedChange={(checked) => handleFieldChange('enable_document_analysis', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Case Suggestions</Label>
              <p className="text-sm text-gray-500">Get suggestions for similar cases</p>
            </div>
            <Switch
              checked={preferences.enable_case_suggestions}
              onCheckedChange={(checked) => handleFieldChange('enable_case_suggestions', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Language & Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Language & Context</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Response Language</Label>
            {isLawyer ? (
              <Select 
                value={preferences.response_language} 
                onValueChange={(value: any) => handleFieldChange('response_language', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="sw">Swahili</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">English</span>
                    <p className="text-sm text-gray-600">AI responses will be provided in English</p>
                  </div>
                  <Badge variant="secondary">Citizens Only</Badge>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Prioritize Kenyan Legal Context</Label>
              <p className="text-sm text-gray-500">Focus on Kenyan laws and regulations</p>
            </div>
            <Switch
              checked={preferences.use_kenyan_context}
              onCheckedChange={(checked) => handleFieldChange('use_kenyan_context', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Include Act References</Label>
              <p className="text-sm text-gray-500">Reference specific acts and regulations</p>
            </div>
            <Switch
              checked={preferences.include_act_references}
              onCheckedChange={(checked) => handleFieldChange('include_act_references', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Privacy & Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Store Conversation History</Label>
              <p className="text-sm text-gray-500">Save conversations for future reference</p>
            </div>
            <Switch
              checked={preferences.store_conversation_history}
              onCheckedChange={(checked) => handleFieldChange('store_conversation_history', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Allow Usage Analytics</Label>
              <p className="text-sm text-gray-500">Help improve the service with anonymous usage data</p>
            </div>
            <Switch
              checked={preferences.allow_usage_analytics}
              onCheckedChange={(checked) => handleFieldChange('allow_usage_analytics', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={loadPreferences}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
