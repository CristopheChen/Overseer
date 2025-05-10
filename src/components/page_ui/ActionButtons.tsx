import React from 'react';

interface ActionButtonsProps {
  handleUpload: () => void;
  handleFilter: () => void;
  handleDownload: () => void;
  fetchEmbeddings: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  handleUpload,
  handleFilter,
  handleDownload,
  fetchEmbeddings,
}) => {
  return (
    <div className="fixed right-10 top-16 z-20 flex flex-col space-y-4">
      <button
        onClick={handleUpload}
        className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded-md shadow"
      >
        Upload
      </button>

      <button
        onClick={handleFilter}
        className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded-md shadow"
      >
        Get Unbiased Data
      </button>

      <button
        onClick={handleDownload}
        className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded-md shadow"
      >
        Download Summary
      </button>

      <button
        onClick={fetchEmbeddings}
        className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded-md shadow"
      >
        Fetch Embeddings Info
      </button>
    </div>
  );
};

export default ActionButtons; 