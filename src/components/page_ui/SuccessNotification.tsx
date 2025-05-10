import React from 'react';

interface SuccessNotificationProps {
  showSuccessNotification: boolean;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({ showSuccessNotification }) => {
  if (!showSuccessNotification) {
    return null;
  }

  return (
    <div className="fixed bottom-28 right-4 z-50 bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-lg animate-fadeOut w-full max-w-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-green-800">
            Processing complete! Your data is ready.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessNotification; 