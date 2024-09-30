import React from 'react';
import { Message } from 'ai';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[75%] ${isUser ? 'bg-indigo-500 text-white' : 'bg-gray-200'} rounded-2xl p-3 text-lg`}>
        {message.content}
      </div>
    </div>
  );
};

export default ChatMessage;