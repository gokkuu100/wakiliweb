'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Send,
  MessageSquare,
  Bot,
  User,
  FileText,
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { documentService } from '@/lib/services/documentService';
import { Document, ChatMessage } from '@/types/documents';

interface DocumentChatProps {
  document: Document;
  onBack: () => void;
  onStatsRefresh?: () => void;
  onDocumentRefresh?: (documentId: string) => void;
}

export default function DocumentChat({ document, onBack, onStatsRefresh, onDocumentRefresh }: DocumentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, [document.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await documentService.getDocumentQuestions(document.id);
      
      // Transform the Q&A sessions to chat messages
      const chatMessages: ChatMessage[] = [];
      
      response.questions.forEach((sessionData: any) => {
        // Add user question
        chatMessages.push({
          id: `q-${sessionData.id}`,
          type: 'user',
          content: sessionData.question,
          timestamp: sessionData.created_at
        });
        
        // Add assistant answer
        if (sessionData.answer) {
          chatMessages.push({
            id: `a-${sessionData.id}`,
            type: 'assistant',
            content: sessionData.answer,
            timestamp: sessionData.created_at
          });
        }
      });
      
      // Sort by timestamp (oldest first for better chat experience)
      chatMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setMessages(chatMessages);
    } catch (err) {
      console.error('Error loading chat history:', err);
      setError('Failed to load chat history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentQuestion.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content: currentQuestion,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentQuestion('');
    setLoading(true);
    setError(null);

    try {
      const assistantMessage = await documentService.askDocumentQuestion(
        document.id,
        userMessage.content
      );

      setMessages(prev => [...prev, assistantMessage]);
      
      // Refresh stats and document data after successful question
      if (onStatsRefresh) {
        onStatsRefresh();
      }
      if (onDocumentRefresh) {
        onDocumentRefresh(document.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get answer');
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (document.status !== 'completed' || document.ai_analysis_status !== 'completed') {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Document Chat
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Document must be fully processed before you can ask questions. Please wait for processing to complete.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat with {document.original_filename}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {document.document_type} • {document.chunks_count} chunks
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {document.questions_remaining || 0} questions remaining
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading chat history...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet. Ask a question about this document to get started!</p>
              <p className="text-sm mt-2">Try asking about key terms, legal implications, or specific clauses.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {message.type === 'user' ? (
                        <User className="h-4 w-4 mt-0.5" />
                      ) : (
                        <Bot className="h-4 w-4 mt-0.5" />
                      )}
                      <span className="font-medium text-sm">
                        {message.type === 'user' ? 'You' : 'AI Assistant'}
                      </span>
                    </div>
                    
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-border/50">
                        <p className="text-xs font-medium mb-2">Sources:</p>
                        <div className="space-y-1">
                          {message.sources.map((source, idx) => (
                            <div key={idx} className="text-xs p-2 bg-background/50 rounded border">
                              <Badge variant="secondary" className="text-xs mb-1">
                                Page {source.page_number || 'N/A'} • {Math.round(source.similarity_score * 100)}% match
                              </Badge>
                              <p className="text-muted-foreground">{source.content_preview}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs opacity-70 mt-2">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <span className="font-medium text-sm">AI Assistant</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {error && (
          <div className="p-4 border-t">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="p-4 border-t">
          {(document.questions_remaining || 0) <= 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have reached the maximum of 5 questions for this document. 
                Upload a new document to ask more questions.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about this document..."
                  disabled={loading || (document.questions_remaining || 0) <= 0}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentQuestion.trim() || loading || (document.questions_remaining || 0) <= 0}
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send • Shift+Enter for new line • {document.questions_remaining || 0} questions remaining
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
