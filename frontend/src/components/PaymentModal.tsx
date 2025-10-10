import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface PaymentModalProps {
  shopId: string;
  shopName: string;
  currentBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  shopId, 
  shopName, 
  currentBalance, 
  onClose, 
  onSuccess 
}) => {
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'full' | 'custom'>('full');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    if (numValue <= currentBalance) {
      setAmount(value);
    }
  };

  const handlePaymentTypeChange = (type: 'full' | 'custom') => {
    setPaymentType(type);
    if (type === 'full') {
      setAmount(currentBalance.toString());
    } else {
      setAmount('');
    }
  };

  const handleSave = async () => {
    const paymentAmount = parseFloat(amount);
    
    if (!paymentAmount || paymentAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (paymentAmount > currentBalance) {
      alert('Payment amount cannot exceed current balance');
      return;
    }

    try {
      setLoading(true);
      
      // Create payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          shop_id: shopId,
          delivery_boy_id: '270cf1bb-44ff-4d62-b98f-24cb2aedcbcb', // First delivery boy
          amount: paymentAmount,
          payment_date: new Date().toISOString().split('T')[0],
          payment_type: paymentType,
          notes: description || `Payment from ${shopName}`
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      if (paymentData) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Error saving payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add Payment - {shopName}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Current Balance */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Current Balance</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(currentBalance)}
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePaymentTypeChange('full')}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  paymentType === 'full'
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-gray-100 border-gray-300 text-gray-700'
                }`}
              >
                Full Payment
              </button>
              <button
                onClick={() => handlePaymentTypeChange('custom')}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  paymentType === 'custom'
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-gray-100 border-gray-300 text-gray-700'
                }`}
              >
                Custom Amount
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="0"
                max={currentBalance}
                step="0.01"
              />
            </div>
            {paymentType === 'custom' && (
              <div className="mt-2 text-sm text-gray-600">
                Maximum: {formatCurrency(currentBalance)}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Add any notes about this payment..."
            />
          </div>

          {/* Payment Summary */}
          {amount && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Amount Paid:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(parseFloat(amount) || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Remaining Balance:</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(currentBalance - (parseFloat(amount) || 0))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
