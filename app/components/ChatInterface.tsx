'use client'

import React, { useRef, useEffect, useState } from 'react';
import { Message } from 'ai/react';
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { ScrollArea } from "@/app/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/app/components/ui/sheet"


const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent | string) => {
    if (typeof event !== 'string') {
      event.preventDefault();
    }
    setIsLoading(true);
    setStreamError(null);
    
    const inputContent = typeof event === 'string' ? event : input;
    
    try {
      const userMessage: Message = { role: 'user' as const, content: inputContent, id: Date.now().toString() };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setInput('');

      // Remove 'id' from messages before sending to API
      const messagesToSend = [...messages, userMessage].map(({ role, content }) => ({ role, content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesToSend,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        const assistantMessageId = Date.now().toString();
        setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: '', id: assistantMessageId }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(5).trim();
              if (data === '[DONE]') {
                // Stream is finished, break out of the loop
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  setMessages(prevMessages => prevMessages.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: msg.content + parsed.text }
                      : msg
                  ));
                }
              } catch (e) {
                console.error('Error parsing JSON:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      let errorMessage = "An unknown error occurred. Please try again.";
      if (error instanceof Error) {
        errorMessage = `An error occurred: ${error.message}. Please try again.`;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = `An error occurred: ${JSON.stringify(error)}. Please try again.`;
      }
      setStreamError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  const suggestionButtons = [
    "Spell 'friend'",
    "Define 'curious'",
    "Past tense help",
    "Homework tips"
  ];

  const chatHistory = [
    "Yesterday's Adventure",
    "Last Week's Quest",
    "Grammar Galaxy Exploration",
    "Vocabulary Voyage"
  ];

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSuggestionClick = (suggestion: string) => {
    handleSubmit(suggestion);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-sky-400 to-indigo-500 p-4 sm:p-6 md:p-8">
      <div className="flex-grow flex flex-col bg-white rounded-3xl shadow-xl overflow-hidden max-w-4xl w-full mx-auto">
        <div className="bg-yellow-400 p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-indigo-900">English Adventure Buddy</h1>
          <div className="flex items-center space-x-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="bg-white hover:bg-indigo-100 text-indigo-600 border-indigo-300">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Chat History</SheetTitle>
                  <SheetDescription>View your previous conversations</SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-2">
                  {chatHistory.map((chat, index) => (
                    <Button key={index} variant="ghost" className="w-full justify-start text-lg">
                      {chat}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
            <Avatar className="w-12 h-12 border-4 border-white">
              <AvatarImage src="https://api.dicebear.com/6.x/bottts/svg?seed=Buddy" />
              <AvatarFallback>B</AvatarFallback>
            </Avatar>
          </div>
        </div>
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              Start a conversation by typing a message or selecting a suggestion below.
            </div>
          ) : (
            messages.map((message: Message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className={`max-w-[75%] ${message.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200'} rounded-2xl p-3 text-lg`}>
                  {message.content}
                </div>
              </div>
            ))
          )}
          {streamError && (
            <div className="text-red-500 mt-2 p-2 bg-red-100 rounded">
              Error: {streamError}
            </div>
          )}
        </ScrollArea>
        <div className="p-4 bg-gray-100">
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestionButtons.map((suggestion, index) => (
              <Button 
                key={index} 
                variant="outline" 
                className="bg-white hover:bg-indigo-100 text-indigo-600 border-indigo-300" 
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isLoading}
              >
                {suggestion}
              </Button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input 
              placeholder="Type your question here..." 
              value={input}
              onChange={handleInputChange}
              className="text-lg"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading} className="bg-indigo-500 hover:bg-indigo-600 text-white">
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;