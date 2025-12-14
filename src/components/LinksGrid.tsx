import React from 'react';

const LinksGrid: React.FC = () => {
  const links = [
    { name: 'Particle Network', url: 'https://particle.network' },
    { name: 'Documentation', url: 'https://docs.particle.network' },
    { name: 'Dashboard', url: 'https://dashboard.particle.network' },
  ];

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-white mb-4">Useful Links</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105 shadow-lg text-center"
          >
            {link.name}
          </a>
        ))}
      </div>
    </div>
  );
};

export default LinksGrid;