/**
 * Citizen AI Chat Component
 * Simplified legal AI chat for citizens with easy-to-understand responses
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  Bot,
  User,
  AlertCircle,
  Loader2,
  Lightbulb,
  Shield,
  HelpCircle
} from 'lucide-react';
import { useLegalAIChat } from '@/hooks/useLegalAIChat';
import { useAuth } from '@/hooks/useAuthContext';
import { formatDistanceToNow } from 'date-fns';

interface CitizenAIChatProps {
  className?: string;
}

const SAMPLE_QUESTIONS = [
  "What are my rights as a tenant?",
  "How do I write a simple contract?",
  "What should I do if my employer doesn't pay me?",
  "What are the steps to register a small business?",
  "How can I protect my intellectual property?",
];

export function CitizenAIChat({ className }: CitizenAIChatProps) {
  const { user, userProfile } = useAuth();
  const {
    messages,
    currentConversationId,
    isLoading,
    isTyping,
    error,
    sendMessage,
    startNewConversation,
    conversations,
    loadConversations,
    loadConversation,
  } = useLegalAIChat();

  const [query, setQuery] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasLoadedInitialData = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcome(false);
    }
  }, [messages]);

  useEffect(() => {
    // Load conversations on mount - only once to prevent infinite loops
    if (user?.id && !hasLoadedInitialData.current) {
      hasLoadedInitialData.current = true;
      loadConversations();
    }
  }, [user?.id, loadConversations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const trimmedQuery = query.trim();
    setQuery('');
    setShowWelcome(false);
    
    // Use regular chat endpoint for citizens (simplified responses)
    await sendMessage(trimmedQuery, false);
    
    // Focus back on input
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSampleQuestion = async (question: string) => {
    setQuery(question);
    setShowWelcome(false);
    await sendMessage(question, false);
  };

  const handleNewChat = () => {
    startNewConversation();
    setShowWelcome(true);
    setQuery('');
    inputRef.current?.focus();
  };

  const handleLoadConversation = async (conversationId: string) => {
    await loadConversation(conversationId);
    setShowWelcome(false);
  };

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to access the Legal AI Assistant.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`${className} flex h-full bg-white rounded-lg border overflow-hidden`}>
      {/* Sidebar - Chat History */}
      <div className="w-80 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b">
          <Button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2"
            size="sm"
          >
            <MessageSquare className="h-4 w-4" />
            New Chat
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleLoadConversation(conversation.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-white ${
                    currentConversationId === conversation.id 
                      ? 'bg-white border-primary shadow-sm' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="font-medium text-sm truncate mb-1">
                    {conversation.title || 'Legal Question'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No previous chats</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Legal AI Assistant</span>
              <Badge variant="secondary">Citizen Mode</Badge>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
              Online
            </Badge>
          </div>
        </div>
        
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-hidden">
          {/* Error Display */}
          {error && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Welcome Screen */}
          {showWelcome && messages.length === 0 && (
            <ScrollArea className="flex-1 h-full">
              <div className="flex items-center justify-center p-8 min-h-full">
                <div className="text-center space-y-4 max-w-md">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Bot className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Welcome to Legal AI Assistant
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Get simple, easy-to-understand answers to your legal questions. 
                      I'll help explain complex legal matters in plain language.
                    </p>
                  </div>
                  
                  {/* Important Notice */}
                  <Alert className="text-left">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> This AI provides general legal information only. 
                      For specific legal advice, please consult with a qualified lawyer.
                    </AlertDescription>
                  </Alert>

                  {/* Sample Questions */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Try asking about:
                    </div>
                    <div className="grid gap-2">
                      {SAMPLE_QUESTIONS.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-left justify-start h-auto py-2 px-3"
                          onClick={() => handleSampleQuestion(question)}
                          disabled={isLoading}
                        >
                          <HelpCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                          <span className="text-xs">{question}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <ScrollArea className="flex-1 h-full">
              <div className="p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : message.role === 'system'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {/* Message Avatar */}
                      <div className="flex items-start gap-2">
                        {message.role === 'user' ? (
                          <User className="h-4 w-4 mt-1 flex-shrink-0" />
                        ) : message.role === 'assistant' ? (
                          <Bot className="h-4 w-4 mt-1 flex-shrink-0 text-blue-600" />
                        ) : null}
                        
                        <div className="flex-1">
                          <div className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </div>
                          
                          {/* Message Timestamp */}
                          <div className="text-xs opacity-70 mt-2">
                            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                          </div>

                          {/* AI Response Quality Indicator (for citizens - simplified) */}
                          {message.role === 'assistant' && message.confidence_score && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className={`text-xs px-2 py-1 rounded ${
                                message.confidence_score > 0.8 
                                  ? 'bg-green-100 text-green-800' 
                                  : message.confidence_score > 0.6
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {message.confidence_score > 0.8 ? 'High confidence' :
                                 message.confidence_score > 0.6 ? 'Moderate confidence' :
                                 'Low confidence'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator with 3-dot animation */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-3">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        Thinking...
                      </span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Input Form */}
        <div className="border-t p-4 bg-white">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask me any legal question in simple terms..."
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
            </div>

            {/* Tips for Citizens */}
            <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
              <div className="font-medium mb-1 flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                Tips for better answers:
              </div>
              <ul className="space-y-1">
                <li>• Be specific about your situation</li>
                <li>• Mention if you're in Kenya or dealing with Kenyan law</li>
                <li>• Ask one question at a time for clearer answers</li>
              </ul>
            </div>
          </form>

          {/* Disclaimer */}
          <Alert className="mt-3">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-xs">
              This AI provides general legal information only and should not be considered as legal advice. 
              For specific legal matters, please consult with a qualified lawyer.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}