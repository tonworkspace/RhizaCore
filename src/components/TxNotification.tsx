import React from 'react';

interface TxNotificationProps {
  hash: string;
  blockExplorerUrl: string;
}

const TxNotification: React.FC<TxNotificationProps> = ({ hash, blockExplorerUrl }) => {
  const explorerUrl = `${blockExplorerUrl}/tx/${hash}`;

  return (
    <div className="mt-4 p-4 bg-green-800 text-white rounded-lg">
      <p className="font-semibold">Transaction Successful!</p>
      <p className="text-sm">Hash: {hash}</p>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-300 underline"
      >
        View on Explorer
      </a>
    </div>
  );
};

export default TxNotification;