import React, { useRef } from 'react';

interface UploadModalProps {
  showUploadModal: boolean;
  setShowUploadModal: (show: boolean) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  triggerFileInput: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleUseExampleDataset: () => void;
  exampleDatasetName: string | null;
  clusterCount: number;
  handleClusterCountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  aggressiveness: number;
  handleAggressivenessChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  processUpload: () => void;
  isLoading: boolean;
}

const UploadModal: React.FC<UploadModalProps> = ({
  showUploadModal,
  setShowUploadModal,
  isDragging,
  uploadedFile,
  handleFileChange,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  triggerFileInput,
  fileInputRef,
  handleUseExampleDataset,
  exampleDatasetName,
  clusterCount,
  handleClusterCountChange,
  aggressiveness,
  handleAggressivenessChange,
  processUpload,
  isLoading,
}) => {
  if (!showUploadModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => setShowUploadModal(false)}
      ></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all duration-300 ease-out animate-fadeIn">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">
              Upload CSV Data
            </h3>
            <button
              onClick={() => setShowUploadModal(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div
            className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-colors mb-6 ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "hover:border-blue-500"
            }`}
            onClick={triggerFileInput}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv"
              onChange={handleFileChange}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 mx-auto text-gray-400 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-base text-gray-700 font-medium">
              {uploadedFile
                ? `Selected: ${uploadedFile.name}`
                : "Drop CSV file here or click to browse"}
            </p>
            <p className="text-xs text-gray-500">
              Supports CSV files with Resume_str column
            </p>
          </div>

          <div className="text-center mb-4">
            <button
              onClick={handleUseExampleDataset}
              disabled={isLoading}
              className="text-sm text-blue-500 hover:text-blue-700 disabled:opacity-50"
            >
              Or use an Example Dataset
            </button>
          </div>

          {exampleDatasetName && (
            <p className="text-center text-sm text-green-600 mb-4">
              Using example: {exampleDatasetName}
            </p>
          )}

          <div className="bg-gray-50 p-4 rounded-xl mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Controls
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label
                    htmlFor="cluster-count"
                    className="text-xs font-medium text-gray-700"
                  >
                    Clusters
                  </label>
                  <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded-md shadow-sm">
                    {clusterCount}
                  </span>
                </div>
                <input
                  id="cluster-count"
                  type="range"
                  min="1"
                  max="10"
                  value={clusterCount}
                  onChange={handleClusterCountChange}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label
                    htmlFor="aggressiveness"
                    className="text-xs font-medium text-gray-700"
                  >
                    Aggressiveness
                  </label>
                  <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded-md shadow-sm">
                    {aggressiveness}%
                  </span>
                </div>
                <input
                  id="aggressiveness"
                  type="range"
                  min="0"
                  max="100"
                  value={aggressiveness}
                  onChange={handleAggressivenessChange}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-lg text-gray-700 mb-2">Expected format:</p>
            <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto text-gray-700 mb-2">
              id,Resume_str,Category
              <br />
              1,"I am a software engineer with 5 years of experience...",IT
              <br />
              ...
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowUploadModal(false)}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-lg"
            >
              Cancel
            </button>
            <button
              onClick={processUpload}
              disabled={!uploadedFile || isLoading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isLoading ? "Processing..." : "Process CSV"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal; 