import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center py-8">
      <h1 className="text-4xl font-bold text-white mb-2">Particle Auth Demo</h1>
      <p className="text-gray-400">Connect and interact with blockchain using Particle Network</p>
    </header>
  );
};

export default Header;