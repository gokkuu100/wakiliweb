'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuthContext';
import { 
  MessageSquare, 
  Send,
  Bot,
  User,
  Clock,
  Paperclip,
  History,
  Sparkles,
  Loader2,
  AlertCircle,
  File,
  Upload,
  FileText,
  Brain,
  Scale,
  CheckCircle
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: any[];
  confidence_score?: number;
  legal_citations?: string[];
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  total_tokens_used: number;
}

function ChatPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [legalArea, setLegalArea] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    async function loadChatData() {
      if (!user) return;
      
      try {
        setLoading(true);
        const [historyResponse, usageResponse] = await Promise.all([
          fetch('/api/ai/chat'),
          fetch('/api/ai/usage?type=overview')
        ]);
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setChatHistory(historyData);
        }
        
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          setUsageStats(usageData);
        }
      } catch (err) {
        console.error('Error loading chat data:', err);
        setError('Failed to load chat data');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadChatData();
    }
  }, [user, authLoading]);

  const loadConversation = async (conversationId: string) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/ai/chat?conversationId=${conversationId}`);
      if (response.ok) {
        const conversationData = await response.json();
        setCurrentConversation(conversationData);
        setMessages(conversationData.chat_messages || []);
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || sending || !user) return;

    setSending(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          conversationId: currentConversation?.id,
          legalArea,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();

      // Add user message to UI
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString(),
      };

      // Add AI response to UI
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: result.message,
        timestamp: new Date().toISOString(),
        sources: result.sources_used || [],
        confidence_score: result.confidence_score,
        legal_citations: result.legal_citations || [],
      };

      setMessages(prev => [...prev, userMessage, aiMessage]);
      setMessage('');

      // Update conversation if new
      if (!currentConversation && result.conversation_id) {
        setCurrentConversation({ id: result.conversation_id });
        
        // Refresh chat history
        const historyResponse = await fetch('/api/ai/chat');
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setChatHistory(historyData);
        }
      }

    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const startNewChat = async () => {
    setCurrentConversation(null);
    setMessages([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading chat history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
        {/* Chat History Sidebar */}
        <div id="history" className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <History className="mr-2 h-5 w-5" />
                Recent Chats
              </CardTitle>
              {usageStats && (
                <CardDescription>
                  {usageStats.queriesUsed} of {usageStats.queriesLimit || '∞'} queries used
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {chatHistory.length > 0 ? (
                chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                      currentConversation?.id === chat.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => loadConversation(chat.id)}
                  >
                    <h4 className="font-medium text-sm">{chat.title}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">
                        {new Date(chat.updated_at).toLocaleDateString()}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {chat.total_tokens_used} tokens
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">No conversations yet</p>
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={startNewChat}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                New Chat
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div id="ask" className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Bot className="mr-2 h-6 w-6 text-blue-600" />
                    Legal AI Assistant
                  </CardTitle>
                  <CardDescription>
                    Ask me anything about Kenyan law and legal matters
                  </CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  Online
                </Badge>
              </div>
            </CardHeader>

            {/* Chat Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Welcome to Legal AI Assistant
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Ask me anything about Kenyan law, contracts, or legal procedures.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMessage('What are the requirements for a valid employment contract in Kenya?')}
                    >
                      Employment Law
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMessage('How do I register a business in Kenya?')}
                    >
                      Business Registration
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMessage('What are tenant rights in Kenya?')}
                    >
                      Tenant Rights
                    </Button>
                  </div>
                </div>
              ) : (
                messages.map((chat) => (
                  <div
                    key={chat.id}
                    className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[80%] ${chat.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`flex-shrink-0 ${chat.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          chat.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {chat.role === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      <div className={`rounded-lg px-4 py-2 ${
                        chat.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="whitespace-pre-wrap">{chat.content}</p>
                        <p className={`text-xs mt-2 ${
                          chat.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(chat.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {sending && (
                <div className="flex justify-start">
                  <div className="flex">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-gray-600" />
                      </div>
                    </div>
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Message Input */}
            <div className="border-t p-4">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Ask me about Kenyan law, contracts, or legal procedures..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    className="pr-12"
                    disabled={sending}
                  />
                  <Button
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sending}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div id="upload" className="flex flex-wrap gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage('What are the requirements for a valid employment contract in Kenya?')}
                  disabled={sending}
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  Employment Law
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage('How do I register a business in Kenya?')}
                  disabled={sending}
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  Business Registration
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage('What are tenant rights in Kenya?')}
                  disabled={sending}
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  Tenant Rights
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
  );
}

export default ChatPage;