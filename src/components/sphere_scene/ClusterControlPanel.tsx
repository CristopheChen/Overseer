import React from 'react';
import * as THREE from 'three'; // For THREE.Color

interface ClusterInfo {
  size: number;
  [key: string]: any;
}

interface ClusterEmbeddingsData {
  clusters?: {
    [clusterId: string]: ClusterInfo;
  };
}

interface ClusterAnalyses {
  [id: string]: string;
}

interface ClusterControlPanelProps {
  clusterEmbeddings: ClusterEmbeddingsData | null;
  clusterColors: THREE.Color[];
  visibleClusters: { [id: string]: boolean };
  toggleClusterVisibility: (clusterId: string) => void;
  selectCluster: (clusterId: string) => void;
  selectedCluster: string | null;
  handleRecenter: () => void;
  clusterAnalyses: ClusterAnalyses;
  setSelectedCluster: (clusterId: string | null) => void;
  getClusterLetter: (clusterId: string, clusterEmbeddings: any) => string;
  cleanAnalysisText: (text: string, clusterId: string) => string;
}

const ClusterControlPanel: React.FC<ClusterControlPanelProps> = ({
  clusterEmbeddings,
  clusterColors,
  visibleClusters,
  toggleClusterVisibility,
  selectCluster,
  selectedCluster,
  handleRecenter,
  clusterAnalyses,
  setSelectedCluster,
  getClusterLetter,
  cleanAnalysisText,
}) => {
  if (!clusterEmbeddings) {
    return null;
  }

  return (
    <div className="absolute top-28 left-10 z-10 space-y-4">
      {/* Cluster Panel */}
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-md max-w-xs">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          Clusters
        </h3>
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {Object.entries(clusterEmbeddings?.clusters || {}).map(
            ([clusterId, clusterInfo]: [string, ClusterInfo], index) => {
              const clusterColor =
                clusterColors[index % clusterColors.length];
              const clusterLetter = getClusterLetter(clusterId, clusterEmbeddings);
              return (
                <div
                  key={clusterId}
                  className="flex items-center space-x-2 text-black py-0.5"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`cluster-${clusterId}`}
                      checked={visibleClusters[clusterId] !== false}
                      onChange={() => toggleClusterVisibility(clusterId)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <label
                    htmlFor={`cluster-${clusterId}`}
                    className="flex-grow flex items-center cursor-pointer text-xs text-black"
                  >
                    <span
                      className="inline-block w-3 h-3 mr-1.5 rounded-full"
                      style={{
                        backgroundColor: `#${clusterColor.getHexString()}`,
                      }}
                    ></span>
                    Cluster {clusterLetter}
                    {clusterInfo.size && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({clusterInfo.size})
                      </span>
                    )}
                  </label>
                  <button
                    onClick={() => selectCluster(clusterId)}
                    className="ml-auto text-xs text-blue-500 hover:text-blue-700 font-medium"
                  >
                    {selectedCluster === clusterId ? "Hide" : "Info"}
                  </button>
                </div>
              );
            }
          )}
        </div>
        <button
          onClick={handleRecenter}
          className="mt-2.5 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded text-xs transition-colors duration-200 flex justify-center items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z"
              clipRule="evenodd"
            />
          </svg>
          Recenter View
        </button>
      </div>

      {/* Cluster Analysis Panel */}
      {selectedCluster && (
        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md max-h-[50vh] max-w-xs overflow-y-auto">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200 bg-blue-50 -m-3 p-3 rounded-t-lg">
            <h3 className="text-base font-bold text-blue-700">
              Cluster {getClusterLetter(selectedCluster, clusterEmbeddings)}{" "}
              Analysis
            </h3>
            <button
              onClick={() => setSelectedCluster(null)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              <span className="sr-only">Close</span>✕
            </button>
          </div>
          <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed mt-2">
            {clusterAnalyses[selectedCluster]
              ? cleanAnalysisText(clusterAnalyses[selectedCluster], selectedCluster)
              : "Loading analysis..."}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusterControlPanel; 