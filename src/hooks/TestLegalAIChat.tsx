/**
 * Test component to verify Legal AI Chat hook integration
 * This can be used to test the hook functionality
 */

'use client';

import React from 'react';
import { useLegalAIChat } from './useLegalAIChat';
import { useAuth } from './useAuthContext';

export function TestLegalAIChat() {
  const { user } = useAuth();
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    conversations,
    loadConversations,
    usageStats,
    loadUsageStats,
  } = useLegalAIChat();

  const handleTestQuery = async () => {
    if (!user) {
      alert('Please sign in first');
      return;
    }
    
    try {
      await sendMessage('What are the requirements for forming a contract in Kenya?', false);
    } catch (error) {
      console.error('Test query failed:', error);
    }
  };

  const handleLoadConversations = async () => {
    try {
      await loadConversations();
    } catch (error) {
      console.error('Loading conversations failed:', error);
    }
  };

  const handleLoadUsageStats = async () => {
    try {
      await loadUsageStats();
    } catch (error) {
      console.error('Loading usage stats failed:', error);
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Legal AI Chat Hook Test</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Authentication Status:</h3>
          <p className={user ? 'text-green-600' : 'text-red-600'}>
            {user ? '✅ Authenticated' : '❌ Not authenticated'}
          </p>
        </div>

        <div>
          <h3 className="font-semibold">Hook Status:</h3>
          <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
          <p>Messages: {messages.length}</p>
          <p>Conversations: {conversations.length}</p>
          {error && <p className="text-red-600">Error: {error}</p>}
        </div>

        <div className="space-x-2">
          <button
            onClick={handleTestQuery}
            disabled={isLoading || !user}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Query
          </button>
          
          <button
            onClick={handleLoadConversations}
            disabled={isLoading || !user}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Load Conversations
          </button>
          
          <button
            onClick={handleLoadUsageStats}
            disabled={isLoading || !user}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Load Usage Stats
          </button>
        </div>

        {messages.length > 0 && (
          <div>
            <h3 className="font-semibold">Recent Messages:</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {messages.slice(-3).map((message) => (
                <div key={message.id} className="p-2 bg-white rounded border">
                  <p className="font-medium">{message.role}:</p>
                  <p className="text-sm">{message.content.substring(0, 100)}...</p>
                  {message.confidence_score && (
                    <p className="text-xs text-gray-500">
                      Confidence: {(message.confidence_score * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {usageStats && (
          <div>
            <h3 className="font-semibold">Usage Stats:</h3>
            <div className="text-sm space-y-1">
              <p>Total Queries: {usageStats.total_queries}</p>
              <p>Total Tokens: {usageStats.total_tokens}</p>
              <p>Total Cost: ${usageStats.total_cost.toFixed(4)}</p>
              <p>Avg Confidence: {(usageStats.average_confidence * 100).toFixed(1)}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
