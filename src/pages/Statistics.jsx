import { useState, useEffect } from 'react';

export default function Statistics() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalDeliveredBasePrice, setTotalDeliveredBasePrice] = useState(0);
  const [deduction21Percent, setDeduction21Percent] = useState(0);

  const FIREBASE_DB_URL = 'https://fetchgo-73a4c-default-rtdb.asia-southeast1.firebasedatabase.app';

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${FIREBASE_DB_URL}/usersOrder.json`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      
      if (data) {
        let allOrders = [];
        
        // Loop through each user's orders
        Object.keys(data).forEach(userId => {
          const userOrders = data[userId];
          // Convert each order to the format expected by the UI
          Object.keys(userOrders).forEach(orderId => {
            const order = userOrders[orderId];
            allOrders.push({
              id: orderId,
              customerName: order.fullname || 'N/A',
              customerPhone: order.phone || 'N/A',
              pickup: order.pickup || 'N/A',
              dropoff: order.dropoff || 'N/A',
              status: order.status || 'pending',
              total: order.total || 0,
              basePrice: order.basePrice || 0,
              tip: order.tip || 0,
              details: order.details || '',
              timestamp: order.createdAt || Date.now(),
              userId: userId
            });
          });
        });
        
        // Sort by creation date (newest first)
        allOrders.sort((a, b) => b.timestamp - a.timestamp);
        setOrders(allOrders);

        // Calculate total base price for delivered orders
        const deliveredOrders = allOrders.filter(order => order.status === 'delivered');
        const total = deliveredOrders.reduce((sum, order) => sum + (order.basePrice || 0), 0);
        setTotalDeliveredBasePrice(total);
        
        // Calculate 21% deduction
        const deduction = total * 0.21;
        setDeduction21Percent(deduction);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <main>
      <div className="page-container">
        <h1>Statistics</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Orders</h3>
            <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Delivered Orders</h3>
            <p className="text-3xl font-bold text-green-600">
              {orders.filter(order => order.status === 'delivered').length}
            </p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Base Price (Delivered)</h3>
            <p className="text-3xl font-bold text-purple-600">
              ₱{totalDeliveredBasePrice.toFixed(2)}
            </p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">21% Deduction</h3>
            <p className="text-3xl font-bold text-red-600">
              ₱{deduction21Percent.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              After deduction: ₱{(totalDeliveredBasePrice - deduction21Percent).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Status Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {orders.filter(order => order.status === 'pending').length}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {orders.filter(order => order.status === 'in_progress').length}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600">
                {orders.filter(order => order.status === 'delivered').length}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Other</p>
              <p className="text-2xl font-bold text-gray-600">
                {orders.filter(order => !['pending', 'in_progress', 'delivered'].includes(order.status)).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
