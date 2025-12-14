import React, { useState } from 'react';
import { X, Copy, Check, QrCode } from 'lucide-react';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

const ReceiveModal: React.FC<ReceiveModalProps> = ({ isOpen, onClose, address }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Receive</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* QR Code Placeholder */}
          <div className="flex justify-center">
            <div className="w-48 h-48 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
              <QrCode className="w-24 h-24 text-slate-400" />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-3">
            <p className="text-sm text-slate-400 text-center">Your TON Address</p>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className="text-sm font-mono text-slate-300 break-all text-center">
                {address}
              </p>
            </div>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyAddress}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {copySuccess ? (
              <>
                <Check className="w-5 h-5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy Address
              </>
            )}
          </button>

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-xs text-yellow-400 text-center">
              Only send TON and TON-based tokens to this address. Sending other cryptocurrencies may result in permanent loss.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiveModal;
