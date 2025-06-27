'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuthContext';
import { CitizenAIChat } from '@/components/dashboard/CitizenAIChat';
import { LawyerResearchTool } from '@/components/lawyer/LawyerResearchTool';
import { 
  MessageSquare, 
  Bot,
  Scale,
  Brain,
  Shield,
  Sparkles
} from 'lucide-react';

export default function ChatPage() {
  const { user, userProfile, isLoading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<string>('citizen');

  useEffect(() => {
    if (userProfile?.user_type) {
      setUserRole(userProfile.user_type);
    }
  }, [userProfile]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bot className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading Legal AI Chat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to access the Legal AI Chat
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isLawyer = userRole === 'lawyer';

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Legal AI Assistant</h1>
          <Badge variant={isLawyer ? "default" : "secondary"} className="ml-2">
            {isLawyer ? "Lawyer Mode" : "Citizen Mode"}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {isLawyer 
            ? "Advanced legal research with detailed citations and comprehensive analysis" 
            : "Get simple, easy-to-understand legal guidance and information"
          }
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Smart Chat</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Interactive AI chat with legal expertise
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Kenyan Law</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Specialized in Kenyan legal framework
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">{isLawyer ? "Research Tools" : "Simple Guidance"}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {isLawyer ? "Detailed analysis with citations" : "Easy-to-understand explanations"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Chat Component */}
      <div className="h-[calc(100vh-300px)] min-h-[600px]">
        {isLawyer ? (
          <LawyerResearchTool className="h-full" />
        ) : (
          <CitizenAIChat className="h-full" />
        )}
      </div>
    </div>
  );
}