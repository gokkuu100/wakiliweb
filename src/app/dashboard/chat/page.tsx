'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send,
  Bot,
  User,
  Clock,
  Paperclip,
  History,
  Sparkles
} from 'lucide-react';

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      type: 'user',
      message: 'What are the requirements for a valid contract in Kenya?',
      timestamp: new Date('2024-01-15T10:30:00')
    },
    {
      id: 2,
      type: 'ai',
      message: 'In Kenya, a valid contract requires four essential elements:\n\n1. **Offer and Acceptance**: One party must make a clear offer, and the other must accept it unconditionally.\n\n2. **Consideration**: There must be something of value exchanged between the parties (money, goods, services, or a promise).\n\n3. **Intention to Create Legal Relations**: Both parties must intend for the agreement to be legally binding.\n\n4. **Capacity**: Both parties must have the legal capacity to enter into a contract (be of sound mind, of legal age, etc.).\n\nAdditionally, the contract must be for a lawful purpose and comply with Kenyan law. Some contracts may require specific formalities, such as being in writing or witnessed.',
      timestamp: new Date('2024-01-15T10:30:30')
    }
  ]);

  const recentChats = [
    {
      id: 1,
      title: 'Employment law in Kenya',
      preview: 'What are the notice periods for...',
      date: '2024-01-15'
    },
    {
      id: 2,
      title: 'Contract termination clauses',
      preview: 'How to properly terminate a...',
      date: '2024-01-14'
    },
    {
      id: 3,
      title: 'Intellectual property rights',
      preview: 'Can I protect my business idea...',
      date: '2024-01-13'
    }
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newUserMessage = {
      id: chatHistory.length + 1,
      type: 'user' as const,
      message: message,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, newUserMessage]);
    setMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: chatHistory.length + 2,
        type: 'ai' as const,
        message: 'Thank you for your question about Kenyan law. Let me provide you with accurate information based on current legal statutes and regulations...',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
        {/* Chat History Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <History className="mr-2 h-5 w-5" />
                Recent Chats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentChats.map((chat) => (
                <div
                  key={chat.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <h4 className="font-medium text-sm">{chat.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{chat.preview}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(chat.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
              
              <Button variant="outline" className="w-full mt-4">
                <MessageSquare className="mr-2 h-4 w-4" />
                New Chat
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3">
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
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[80%] ${chat.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 ${chat.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        chat.type === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {chat.type === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    <div className={`rounded-lg px-4 py-2 ${
                      chat.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="whitespace-pre-wrap">{chat.message}</p>
                      <p className={`text-xs mt-2 ${
                        chat.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {chat.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Ask me about Kenyan law, contracts, or legal procedures..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="pr-12"
                  />
                  <Button
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage('What are the requirements for a valid employment contract in Kenya?')}
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  Employment Law
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage('How do I register a business in Kenya?')}
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  Business Registration
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage('What are tenant rights in Kenya?')}
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  Tenant Rights
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}