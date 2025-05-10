import React from 'react';

interface JobStatusDisplayProps {
  jobId: string | null;
  jobStatus: string | null;
  processingLog: string;
}

const JobStatusDisplay: React.FC<JobStatusDisplayProps> = ({
  jobId,
  jobStatus,
  processingLog,
}) => {
  if (!jobId || !jobStatus) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-2">
        Job Status: {jobStatus.charAt(0).toUpperCase() + jobStatus.slice(1)}
      </h3>
      <p className="text-sm">Job ID: {jobId}</p>
      {processingLog && (
        <div className="mt-2">
          <details>
            <summary className="cursor-pointer text-blue-500">
              View logs
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded max-h-40 overflow-auto">
              {processingLog}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default JobStatusDisplay; 