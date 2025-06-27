/**
 * Lawyer Research Tool Component
 * Enhanced legal research with AI-powered analysis and citations
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Send, 
  Clock, 
  DollarSign, 
  BookOpen, 
  FileText, 
  MessageSquare,
  History,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  Copy,
  Star
} from 'lucide-react';
import { useLegalAIChat } from '@/hooks/useLegalAIChat';
import { useAuth } from '@/hooks/useAuthContext';
import { formatDistanceToNow } from 'date-fns';

interface LawyerResearchToolProps {
  className?: string;
}

export function LawyerResearchTool({ className }: LawyerResearchToolProps) {
  const { userProfile } = useAuth();
  const {
    messages,
    currentConversationId,
    isLoading,
    isTyping,
    error,
    usageStats,
    sendMessage,
    loadConversation,
    startNewConversation,
    conversations,
    loadConversations,
    deleteConversation,
    loadUsageStats,
  } = useLegalAIChat();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('research');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if user is a lawyer
  const isLawyer = userProfile?.user_type === 'lawyer';

  useEffect(() => {
    if (isLawyer) {
      loadConversations();
      loadUsageStats();
    }
  }, [isLawyer, loadConversations, loadUsageStats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const trimmedQuery = query.trim();
    setQuery('');
    
    // Use research endpoint for lawyers
    await sendMessage(trimmedQuery, true);
    
    // Focus back on input
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const formatCost = (cost: number) => {
    return cost < 0.01 ? '<$0.01' : `$${cost.toFixed(4)}`;
  };

  if (!isLawyer) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This advanced research tool is only available to lawyers. 
              Please upgrade your account to access detailed legal research with citations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Legal Research Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {usageStats?.total_queries || 0}
              </div>
              <div className="text-sm text-gray-600">Queries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCost(usageStats?.total_cost || 0)}
              </div>
              <div className="text-sm text-gray-600">Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((usageStats?.average_confidence || 0) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {usageStats?.total_queries ? Math.round((usageStats?.processing_time_ms || 0) / usageStats.total_queries) : 0}ms
              </div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Conversations */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Research History
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={startNewConversation}
              >
                New
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                    currentConversationId === conv.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => loadConversation(conv.id)}
                >
                  <div className="font-medium text-sm truncate">
                    {conv.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No research history yet
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Chat Interface */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI Legal Research
              {currentConversationId && (
                <Badge variant="secondary">Active Session</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Messages */}
              <ScrollArea className="h-96 border rounded-lg p-4">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Start your legal research by asking a question</p>
                      <p className="text-xs mt-1">
                        Get detailed analysis with citations and legal sources
                      </p>
                    </div>
                  )}
                  
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : message.role === 'system'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </div>
                        
                        {/* AI Response Metadata */}
                        {message.role === 'assistant' && (
                          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                            {/* Confidence and Performance */}
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              {message.confidence_score && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  Confidence: {Math.round(message.confidence_score * 100)}%
                                </div>
                              )}
                              {message.processing_time_ms && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {message.processing_time_ms}ms
                                </div>
                              )}
                              {message.cost && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCost(message.cost)}
                                </div>
                              )}
                            </div>

                            {/* Citations */}
                            {message.citations && message.citations.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-gray-700 mb-1">
                                  Legal Citations:
                                </div>
                                <div className="space-y-1">
                                  {message.citations.map((citation, idx) => (
                                    <div
                                      key={idx}
                                      className="text-xs bg-blue-50 p-2 rounded flex items-center justify-between"
                                    >
                                      <span>{citation}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(citation)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Sources */}
                            {message.sources && message.sources.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-gray-700 mb-1">
                                  Sources ({message.sources.length}):
                                </div>
                                <div className="space-y-1">
                                  {message.sources.slice(0, 3).map((source, idx) => (
                                    <div
                                      key={idx}
                                      className="text-xs bg-green-50 p-2 rounded"
                                    >
                                      <div className="font-medium">
                                        {source.source || 'Legal Document'}
                                      </div>
                                      {source.section && (
                                        <div className="text-gray-600">
                                          Section: {source.section}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-600">
                          Researching legal precedents...
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a detailed legal question..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  size="sm"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>

              {/* Sample Questions */}
              <div className="text-xs text-gray-600">
                <div className="font-medium mb-2">Sample Research Questions:</div>
                <div className="space-y-1">
                  <div>• What are the requirements for forming an arbitration agreement in Kenya?</div>
                  <div>• How long does copyright protection last under Kenyan law?</div>
                  <div>• What constitutes wrongful termination of employment?</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
