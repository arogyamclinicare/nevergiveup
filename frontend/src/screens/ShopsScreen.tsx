import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Filter, Plus, Calendar, ArrowUp, ArrowDown } from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  owner_name: string;
  phone: string;
  route_number: string;
  current_balance: number;
  daily_status: 'delivered' | 'not_delivered';
  last_transaction?: {
    type: 'delivery' | 'payment';
    amount: number;
    description: string;
    created_at: string;
  };
}

interface NetBalance {
  total_balance: number;
  date: string;
}

interface ShopsScreenProps {
  onSelectShop: (shop: any) => void;
  refreshTrigger?: number;
}

const ShopsScreen: React.FC<ShopsScreenProps> = ({ onSelectShop, refreshTrigger }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [netBalance, setNetBalance] = useState<NetBalance>({ total_balance: 0, date: new Date().toISOString().split('T')[0] });
  const [searchTerm, setSearchTerm] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  // Load shops data
  useEffect(() => {
    loadShopsData();
  }, [netBalance.date, refreshTrigger]);

  // Daily status reset at 12 AM
  useEffect(() => {
    const checkDailyReset = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Check if it's 12:00 AM (midnight)
      if (currentHour === 0 && currentMinute === 0) {
        // Reset daily status for all shops
        resetDailyStatus();
      }
    };

    // Check immediately
    checkDailyReset();

    // Set up interval to check every minute
    const interval = setInterval(checkDailyReset, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const resetDailyStatus = async () => {
    try {
      // This function can be used to reset any daily status flags
      // For now, we'll just reload the data which will recalculate status
      await loadShopsData();
    } catch (error) {
      console.error('Error resetting daily status:', error);
    }
  };

  const loadShopsData = async () => {
    try {
      setLoading(true);
      
      // Get shops data
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id, name, owner_name, phone, route_number')
        .eq('is_active', true);

      if (shopsError) throw shopsError;

      // Calculate balances from deliveries and payments instead of using shop_daily_balance
      const { data: allDeliveries, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('shop_id, total_amount, payment_amount, delivery_date')
        .eq('is_archived', false);

      const { data: allPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('shop_id, amount, payment_date');

      if (deliveriesError) {
        console.warn('Deliveries query failed:', deliveriesError);
      }
      if (paymentsError) {
        console.warn('Payments query failed:', paymentsError);
      }

      // Get today's deliveries to check status
      const { data: todayDeliveries, error: todayDeliveriesError } = await supabase
        .from('deliveries')
        .select('shop_id, total_amount, delivery_status')
        .eq('delivery_date', netBalance.date)
        .eq('is_archived', false);

      if (todayDeliveriesError) {
        console.warn('Today deliveries query failed:', todayDeliveriesError);
      }

      // Get latest payments for each shop
      const { data: todayPayments, error: todayPaymentsError } = await supabase
        .from('payments')
        .select('shop_id, amount, created_at')
        .eq('payment_date', netBalance.date)
        .order('created_at', { ascending: false });

      if (todayPaymentsError) {
        console.warn('Today payments query failed:', todayPaymentsError);
      }

      // Process and combine data
      const processedShops = shops?.map(shop => {
        // Calculate balance from all deliveries and payments - WITH VALIDATION
        const shopAllDeliveries = allDeliveries?.filter(d => d.shop_id === shop.id) || [];
        const shopAllPayments = allPayments?.filter(p => p.shop_id === shop.id) || [];
        
        const totalDelivered = shopAllDeliveries.reduce((sum, d) => {
          const amount = Number(d.total_amount) || 0;
          if (isNaN(amount) || amount < 0) {
            console.error('Invalid delivery amount in shop list:', d);
            return sum;
          }
          return sum + amount;
        }, 0);
        
        const totalPaid = shopAllPayments.reduce((sum, p) => {
          const amount = Number(p.amount) || 0;
          if (isNaN(amount) || amount < 0) {
            console.error('Invalid payment amount in shop list:', p);
            return sum;
          }
          return sum + amount;
        }, 0);
        
        const currentBalance = totalDelivered - totalPaid;
        
        // Get today's deliveries and payments
        const shopDeliveries = todayDeliveries?.filter(d => d.shop_id === shop.id) || [];
        const shopPayments = todayPayments?.filter(p => p.shop_id === shop.id) || [];
        
        const hasDeliveries = shopDeliveries.length > 0;
        const lastPayment = shopPayments[0];

        return {
          id: shop.id,
          name: shop.name,
          owner_name: shop.owner_name,
          phone: shop.phone,
          route_number: shop.route_number?.toString() || '0',
          current_balance: currentBalance,
          daily_status: (hasDeliveries ? 'delivered' : 'not_delivered') as 'delivered' | 'not_delivered',
          last_transaction: lastPayment ? {
            type: 'payment' as 'delivery' | 'payment',
            amount: lastPayment.amount,
            description: `Payment of ₹${lastPayment.amount}`,
            created_at: lastPayment.created_at
          } : undefined
        };
      }) || [];

      // Sort shops: not delivered first, then delivered
      const sortedShops = processedShops.sort((a, b) => {
        if (a.daily_status === 'not_delivered' && b.daily_status === 'delivered') return -1;
        if (a.daily_status === 'delivered' && b.daily_status === 'not_delivered') return 1;
        return 0;
      });

      setShops(sortedShops);
      setFilteredShops(sortedShops);

      // Calculate net balance
      const totalBalance = processedShops.reduce((sum, shop) => sum + shop.current_balance, 0);
      setNetBalance(prev => ({ ...prev, total_balance: totalBalance }));

    } catch (error) {
      console.error('Error loading shops data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter shops based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredShops(shops);
    } else {
      const filtered = shops.filter(shop =>
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.route_number.includes(searchTerm)
      );
      setFilteredShops(filtered);
    }
  }, [searchTerm, shops]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'delivered' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusText = (status: string) => {
    return status === 'delivered' ? 'Delivered' : 'Not Delivered';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Shops</h1>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Filter className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search shops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Net Balance Section */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Net Balance</h2>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(netBalance.total_balance)}
                </p>
              </div>
              <div className="text-right">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    {formatDate(netBalance.date)}
                  </span>
                </button>
                {showDatePicker && (
                  <input
                    type="date"
                    value={netBalance.date}
                    onChange={(e) => setNetBalance(prev => ({ ...prev, date: e.target.value }))}
                    className="mt-1 px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Delivered: {shops.filter(s => s.daily_status === 'delivered').length}</span>
                <span>Pending: {shops.filter(s => s.daily_status === 'not_delivered').length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${shops.length > 0 ? (shops.filter(s => s.daily_status === 'delivered').length / shops.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shops List */}
      <div className="px-4 py-2">
        <div className="space-y-3">
          {filteredShops.map((shop) => (
            <div
              key={shop.id}
              onClick={() => {
                if (!navigating) {
                  setNavigating(true)
                  onSelectShop(shop)
                  // Reset navigating state after a short delay
                  setTimeout(() => setNavigating(false), 1000)
                }
              }}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer touch-manipulation ${
                navigating ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Shop Avatar - Mobile Optimized */}
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xl">
                      {shop.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate">{shop.name}</h3>
                    <p className="text-base text-gray-600 font-medium">{shop.owner_name}</p>
                    
                    {/* Status - Mobile Optimized */}
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`text-sm font-semibold px-2 py-1 rounded-full ${getStatusColor(shop.daily_status)}`}>
                        {getStatusText(shop.daily_status)}
                      </span>
                      <span className="text-sm text-gray-500 font-medium">Route {shop.route_number}</span>
                    </div>

                    {/* Last Transaction */}
                    {shop.last_transaction && (
                      <div className="flex items-center space-x-1 mt-1">
                        {shop.last_transaction.type === 'delivery' ? (
                          <ArrowUp className="h-3 w-3 text-blue-600" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-green-600" />
                        )}
                        <span className="text-xs text-gray-600">
                          {shop.last_transaction.type === 'delivery' ? 'Delivered' : 'Received'}: {formatCurrency(shop.last_transaction.amount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xl font-bold ${shop.current_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(shop.current_balance)}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">Due</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-20 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors z-50">
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
};

export default ShopsScreen;
