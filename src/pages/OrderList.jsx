import { useState, useEffect } from 'react';

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const FIREBASE_DB_URL = 'https://fetchgo-73a4c-default-rtdb.asia-southeast1.firebasedatabase.app';

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
              userId: userId  // Keep track of which user placed the order
            });
          });
        });
        
        // Sort by creation date (newest first)
        allOrders.sort((a, b) => b.timestamp - a.timestamp);
        setOrders(allOrders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedOrder(null);
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
    <main style={{
      padding: '20px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          color: '#1e3c72',
          borderBottom: '2px solid #eee',
          paddingBottom: '10px',
          marginBottom: '20px'
        }}>
          Orders ({orders.length})
        </h1>

        {!showDetails && (
          <div style={{ marginTop: '20px' }}>
            {orders.length === 0 ? (
              <div style={{
                backgroundColor: '#fff8e1',
                borderLeft: '4px solid #ffc107',
                padding: '15px',
                marginBottom: '20px',
                borderRadius: '4px'
              }}>
                No orders found.
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', color: '#1e3c72' }}>Order #{order.id.substring(0, 8)}</h3>
                      <p style={{ margin: '0', color: '#666' }}>Customer: {order.customerName || 'N/A'}</p>
                      <p style={{ margin: '0', color: '#666' }}>Phone: {order.customerPhone || 'N/A'}</p>
                      <div style={{ marginTop: '5px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: 
                            order.status === 'completed' ? '#e8f5e9' : 
                            order.status === 'pending' ? '#fff8e1' :
                            order.status === 'in_progress' ? '#e3f2fd' : '#f5f5f5',
                          color: 
                            order.status === 'completed' ? '#2e7d32' : 
                            order.status === 'pending' ? '#f57f17' :
                            order.status === 'in_progress' ? '#1565c0' : '#424242'
                        }}>
                          {order.status || 'N/A'}
                        </span>
                      </div>
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                        {formatDate(order.timestamp)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 5px 0', color: '#1e3c72', fontSize: '18px', fontWeight: '600' }}>
                        ₱{order.total ? order.total.toFixed(2) : '0.00'}
                      </p>
                      <button
                        onClick={() => viewOrderDetails(order)}
                        style={{
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          marginTop: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View Order
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <div style={{ padding: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px',
                paddingBottom: '15px',
                borderBottom: '1px solid #eee'
              }}>
                <h2 style={{
                  color: '#1e3c72',
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: '600'
                }}>Order Details</h2>
                <button 
                  onClick={closeDetails}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666',
                    fontSize: '24px',
                    lineHeight: '1'
                  }}
                >
                  &times;
                </button>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '30px',
                marginBottom: '30px'
              }}>
                <div>
                  <h3 style={{
                    color: '#1e3c72',
                    marginBottom: '15px',
                    fontSize: '16px',
                    borderBottom: '1px solid #eee',
                    paddingBottom: '8px'
                  }}>Order Information</h3>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <p style={{
                      fontSize: '13px',
                      color: '#666',
                      margin: '0 0 5px 0'
                    }}>Order ID</p>
                    <p style={{
                      margin: 0,
                      fontWeight: '500',
                      color: '#333'
                    }}>{selectedOrder.id}</p>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <p style={{
                      fontSize: '13px',
                      color: '#666',
                      margin: '0 0 5px 0'
                    }}>Status</p>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: 
                        selectedOrder.status === 'completed' ? '#e8f5e9' : 
                        selectedOrder.status === 'pending' ? '#fff8e1' :
                        selectedOrder.status === 'in_progress' ? '#e3f2fd' : '#f5f5f5',
                      color: 
                        selectedOrder.status === 'completed' ? '#2e7d32' : 
                        selectedOrder.status === 'pending' ? '#f57f17' :
                        selectedOrder.status === 'in_progress' ? '#1565c0' : '#424242'
                    }}>
                      {selectedOrder.status || 'N/A'}
                    </span>
                  </div>
                  
                  <div>
                    <p style={{
                      fontSize: '13px',
                      color: '#666',
                      margin: '0 0 5px 0'
                    }}>Order Placed</p>
                    <p style={{
                      margin: 0,
                      color: '#333'
                    }}>{formatDate(selectedOrder.timestamp)}</p>
                  </div>
                </div>
                
                <div>
                  <h3 style={{
                    color: '#1e3c72',
                    marginBottom: '15px',
                    fontSize: '16px',
                    borderBottom: '1px solid #eee',
                    paddingBottom: '8px'
                  }}>Pricing</h3>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <span style={{ color: '#666', fontSize: '14px' }}>Base Price:</span>
                    <span style={{ fontWeight: '500' }}>₱{selectedOrder.basePrice?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '15px',
                    paddingBottom: '15px',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <span style={{ color: '#666', fontSize: '14px' }}>Tip:</span>
                    <span style={{ fontWeight: '500' }}>₱{selectedOrder.tip?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '15px',
                    paddingTop: '15px',
                    borderTop: '2px solid #eee',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      color: '#1e3c72',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}>Total Amount:</span>
                    <span style={{ 
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#1e3c72'
                    }}>₱{selectedOrder.total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              <div style={{ 
                marginBottom: '30px',
                backgroundColor: '#f9f9f9',
                borderRadius: '6px',
                padding: '15px',
                border: '1px solid #eee'
              }}>
                <h3 style={{
                  color: '#1e3c72',
                  margin: '0 0 15px 0',
                  fontSize: '16px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #eee'
                }}>Delivery Information</h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  marginBottom: '15px'
                }}>
                  <div>
                    <p style={{
                      fontSize: '13px',
                      color: '#666',
                      margin: '0 0 5px 0'
                    }}>Pickup Location</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{selectedOrder.pickup || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p style={{
                      fontSize: '13px',
                      color: '#666',
                      margin: '0 0 5px 0'
                    }}>Drop-off Location</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{selectedOrder.dropoff || 'N/A'}</p>
                  </div>
                </div>
                
                {selectedOrder.details && (
                  <div>
                    <p style={{
                      fontSize: '13px',
                      color: '#666',
                      margin: '0 0 5px 0'
                    }}>Additional Details</p>
                    <div style={{
                      backgroundColor: 'white',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #eee',
                      fontSize: '14px',
                      whiteSpace: 'pre-line'
                    }}>
                      {selectedOrder.details}
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                backgroundColor: '#f9f9f9',
                borderRadius: '6px',
                padding: '15px',
                border: '1px solid #eee',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  color: '#1e3c72',
                  margin: '0 0 15px 0',
                  fontSize: '16px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #eee'
                }}>Customer Information</h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px'
                }}>
                  <div>
                    <p style={{
                      fontSize: '13px',
                      color: '#666',
                      margin: '0 0 5px 0'
                    }}>Name</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{selectedOrder.customerName || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p style={{
                      fontSize: '13px',
                      color: '#666',
                      margin: '0 0 5px 0'
                    }}>Phone</p>
                    <p style={{ margin: 0, fontWeight: '500' }}>{selectedOrder.customerPhone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Order Items</h3>
                <div className="border rounded overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              {item.variation && (
                                <div className="text-sm text-gray-500">{item.variation}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${item.price ? item.price.toFixed(2) : '0.00'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${(item.quantity * (item.price || 0)).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                            No items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-right px-6 py-3 text-sm font-medium text-gray-900">
                          Subtotal:
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900">
                          ${selectedOrder.subtotal ? selectedOrder.subtotal.toFixed(2) : '0.00'}
                        </td>
                      </tr>
                      {selectedOrder.shippingFee > 0 && (
                        <tr>
                          <td colSpan="3" className="text-right px-6 py-1 text-sm font-medium text-gray-900">
                            Shipping:
                          </td>
                          <td className="px-6 py-1 text-sm text-gray-900">
                            ${selectedOrder.shippingFee.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      {selectedOrder.tax > 0 && (
                        <tr>
                          <td colSpan="3" className="text-right px-6 py-1 text-sm font-medium text-gray-900">
                            Tax:
                          </td>
                          <td className="px-6 py-1 text-sm text-gray-900">
                            ${selectedOrder.tax.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan="3" className="text-right px-6 py-3 text-sm font-bold text-gray-900 border-t">
                          Total:
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-gray-900 border-t">
                          ${selectedOrder.total ? selectedOrder.total.toFixed(2) : '0.00'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '15px',
                marginTop: '30px',
                paddingTop: '20px',
                borderTop: '1px solid #eee'
              }}>
                <button
                  onClick={closeDetails}
                  style={{
                    padding: '8px 20px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: '#555',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Handle order status update
                    const newStatus = selectedOrder.status === 'completed' 
                      ? 'pending' 
                      : selectedOrder.status === 'pending'
                        ? 'in_progress'
                        : 'completed';
                        
                    // Update order status in your state/backend here
                    setSelectedOrder({ ...selectedOrder, status: newStatus });
                    // Update the orders list as well
                    setOrders(orders.map(order => 
                      order.id === selectedOrder.id 
                        ? { ...order, status: newStatus }
                        : order
                    ));
                  }}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '4px',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    backgroundColor: 
                      selectedOrder.status === 'completed' ? '#ff9800' : 
                      selectedOrder.status === 'in_progress' ? '#4caf50' : '#2196f3'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.opacity = '0.9';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.opacity = '1';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  {selectedOrder.status === 'completed' 
                    ? 'Reopen Order' 
                    : selectedOrder.status === 'in_progress'
                      ? 'Mark as Completed'
                      : 'Start Processing'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}
