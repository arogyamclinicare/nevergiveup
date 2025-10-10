import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Plus, Minus } from 'lucide-react';

interface MilkType {
  id: string;
  name: string;
  price_per_packet: number;
}

interface DeliveryModalProps {
  shopId: string;
  shopName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const DeliveryModal: React.FC<DeliveryModalProps> = ({ shopId, shopName, onClose, onSuccess }) => {
  const [milkTypes, setMilkTypes] = useState<MilkType[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{[key: string]: number}>({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadMilkTypes();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [selectedProducts, milkTypes]);

  const loadMilkTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('milk_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMilkTypes(data || []);
    } catch (error) {
      console.error('Error loading milk types:', error);
    }
  };

  const calculateTotal = () => {
    const total = milkTypes.reduce((sum, milk) => {
      const quantity = selectedProducts[milk.id] || 0;
      return sum + (milk.price_per_packet * quantity);
    }, 0);
    setTotalAmount(total);
  };

  const updateQuantity = (milkId: string, quantity: number) => {
    if (quantity < 0) return;
    setSelectedProducts(prev => ({
      ...prev,
      [milkId]: quantity
    }));
  };

  const handleSave = async () => {
    if (totalAmount === 0) {
      alert('Please select at least one product');
      return;
    }

    try {
      setLoading(true);
      
      const products = milkTypes
        .filter(milk => selectedProducts[milk.id] > 0)
        .map(milk => ({
          id: milk.id,
          name: milk.name,
          price: milk.price_per_packet,
          quantity: selectedProducts[milk.id]
        }));

      // Create delivery record
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          shop_id: shopId,
          delivery_boy_id: '270cf1bb-44ff-4d62-b98f-24cb2aedcbcb', // First delivery boy
          delivery_date: new Date().toISOString().split('T')[0],
          products: products,
          total_amount: totalAmount,
          payment_status: 'pending',
          payment_amount: 0,
          delivery_status: 'delivered',
          notes: description || `Delivered milk to ${shopName}`,
          delivered_at: new Date().toISOString()
        })
        .select()
        .single();

      if (deliveryError) throw deliveryError;

      if (deliveryData) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error saving delivery:', error);
      alert('Error saving delivery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Add Delivery - {shopName}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Products */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Select Products</h4>
            {milkTypes.map((milk) => (
              <div key={milk.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{milk.name}</div>
                  <div className="text-sm text-gray-600">{formatCurrency(milk.price_per_packet)} per packet</div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(milk.id, (selectedProducts[milk.id] || 0) - 1)}
                    className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                    disabled={!selectedProducts[milk.id]}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={selectedProducts[milk.id] || 0}
                    onChange={(e) => updateQuantity(milk.id, Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-12 text-center font-medium border border-gray-300 rounded px-1 py-1"
                  />
                  <button
                    onClick={() => updateQuantity(milk.id, (selectedProducts[milk.id] || 0) + 1)}
                    className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
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
              placeholder="Add any notes about this delivery..."
            />
          </div>

          {/* Total */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
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
            disabled={loading || totalAmount === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Delivery'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryModal;
