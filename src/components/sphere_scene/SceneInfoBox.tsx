import React from 'react';

const SceneInfoBox: React.FC = () => {
  return (
    <div className="absolute bottom-4 right-4 bg-gray-700/80 text-white p-3 rounded-lg shadow-lg max-w-xs">
      <p className="text-sm">Click on spheres to view details</p>
      <p className="text-sm">Drag to rotate | Scroll to zoom</p>
    </div>
  );
};

export default SceneInfoBox; 