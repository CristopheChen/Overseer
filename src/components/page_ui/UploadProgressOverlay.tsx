import React from 'react';

interface UploadProgressOverlayProps {
  uploadStatus: "idle" | "uploading" | "processing" | "complete" | "error";
  uploadedFile: File | null;
  uploadProgress: number;
  setUploadStatus: (status: "idle" | "uploading" | "processing" | "complete" | "error") => void;
}

const UploadProgressOverlay: React.FC<UploadProgressOverlayProps> = ({
  uploadStatus,
  uploadedFile,
  uploadProgress,
  setUploadStatus,
}) => {
  if (uploadStatus === "idle" || uploadStatus === "complete") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fadeIn">
        <div className="text-center">
          {uploadStatus === "uploading" && (
            <>
              <div className="mb-4">
                <svg
                  className="w-16 h-16 mx-auto text-blue-500 animate-bounce"
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
              </div>
              <h3 className="text-xl font-bold mb-2 text-black">
                Uploading {uploadedFile?.name}
              </h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-gray-600">
                Please wait while we upload your file...
              </p>
            </>
          )}

          {uploadStatus === "processing" && (
            <>
              <div className="mb-4">
                <svg
                  className="w-16 h-16 mx-auto text-blue-500 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-black">
                Processing Data
              </h3>
              <p className="text-gray-600 mb-4">
                Analyzing and clustering your data...
              </p>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></div>
              </div>
            </>
          )}

          {uploadStatus === "error" && (
            <>
              <div className="mb-4">
                <svg
                  className="w-16 h-16 mx-auto text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-red-600">
                Processing Failed
              </h3>
              <p className="text-gray-600 mb-4">
                There was an error processing your file.
              </p>
              <button
                onClick={() => setUploadStatus("idle")}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadProgressOverlay; 