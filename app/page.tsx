import React from 'react';
import ChatInterface from './components/ChatInterface';

const Home: React.FC = () => {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-center my-8">English Homework Helper</h1>
      <ChatInterface />
    </div>
  );
};

export default Home;