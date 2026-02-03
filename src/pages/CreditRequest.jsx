import { useState, useEffect } from 'react';
import { getDatabase, ref, get, update, remove, set, push } from 'firebase/database';
import { db } from '../firebase';

export default function CreditRequest() {
  const [creditRequests, setCreditRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [lastUpdated, setLastUpdated] = useState(null);


  useEffect(() => {
    fetchCreditRequests();
    
    // Set up real-time polling every 10 seconds
    const interval = setInterval(() => {
      fetchCreditRequests();
    }, 10000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const fetchCreditRequests = async () => {
    try {
      const creditRef = ref(db, 'credit');
      const snapshot = await get(creditRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const requests = Object.keys(data)
          .map(key => ({
            id: key,
            ...data[key]
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setCreditRequests(requests);
      } else {
        setCreditRequests([]);
      }
      
      // Update last updated timestamp
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching credit requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiderInfo = async (phoneKey) => {
    try {
      const riderRef = ref(db, `ridersAccount/${phoneKey}`);
      const snapshot = await get(riderRef);
      return snapshot.val();
    } catch (error) {
      console.error('Error fetching rider info:', error);
      return null;
    }
  };

  const handleApprove = async (request) => {
    if (!creditAmount || parseFloat(creditAmount) <= 0) {
      alert('Please enter a valid credit amount');
      return;
    }

    if (!confirm(`Are you sure you want to add ₱${creditAmount} credit to this rider?`)) {
      return;
    }

    try {
      // Get current rider info to update credit balance
      const riderInfo = await fetchRiderInfo(request.phoneKey);
      
      if (!riderInfo) {
        alert('Rider account not found');
        return;
      }

      // Update rider's credit balance
      const currentCredit = riderInfo.credit || 0;
      const newCredit = currentCredit + parseFloat(creditAmount);

      const riderRef = ref(db, `ridersAccount/${request.phoneKey}`);
      await update(riderRef, {
        credit: newCredit,
        lastCreditUpdate: Date.now()
      });

      // Record credit history
      const historyRef = ref(db, `creditHistory/${request.phoneKey}`);
      const historySnapshot = await get(historyRef);
      const existingHistory = historySnapshot.val() || [];
      
      const newTransaction = {
        id: Date.now().toString(),
        type: 'add',
        amount: parseFloat(creditAmount),
        timestamp: Date.now(),
        adminEmail: 'admin@fetchgo.com',
        riderPhoneNumber: request.phoneKey,
        relatedRequestId: request.id,
        source: 'credit_request'
      };
      
      const updatedHistory = [...existingHistory, newTransaction];
      await set(historyRef, updatedHistory);

      // Update credit request status
      const requestRef = ref(db, `credit/${request.id}`);
      await update(requestRef, {
        status: 'approved',
        approvedAmount: parseFloat(creditAmount),
        approvedAt: Date.now(),
        adminNote: `Approved credit of ₱${creditAmount}`
      });

      // Refresh the list
      await fetchCreditRequests();
      setShowDetails(false);
      setSelectedRequest(null);
      setCreditAmount('');
      alert(`Credit request approved! ₱${creditAmount} has been added to the rider's account.`);
    } catch (error) {
      console.error('Error approving credit request:', error);
      alert('Failed to approve credit request. Please try again.');
    }
  };

  const handleReject = async (request) => {
    if (!confirm('Are you sure you want to reject this credit request?')) {
      return;
    }

    try {
      const requestRef = ref(db, `credit/${request.id}`);
      await update(requestRef, {
        status: 'rejected',
        rejectedAt: Date.now(),
        adminNote: 'Credit request rejected by admin'
      });

      // Refresh the list
      await fetchCreditRequests();
      setShowDetails(false);
      setSelectedRequest(null);
      alert('Credit request rejected!');
    } catch (error) {
      console.error('Error rejecting credit request:', error);
      alert('Failed to reject credit request. Please try again.');
    }
  };

  const viewRequestDetails = async (request) => {
    // Fetch rider info to show current credit balance
    const riderInfo = await fetchRiderInfo(request.phoneKey);
    setSelectedRequest({
      ...request,
      riderInfo
    });
    setShowDetails(true);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#f44336';
      case 'completed':
        return '#2196F3';
      default:
        return '#9e9e9e';
    }
  };

  const filteredRequests = creditRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  if (loading) {
    return (
      <main>
        <div className="page-container">
          <h1>Credit Requests</h1>
          <div className="card">
            <p>Loading credit requests...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Credit Requests</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>
              {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
            </span>
            <button
              onClick={fetchCreditRequests}
              className="btn"
              style={{ 
                backgroundColor: '#2196F3', 
                padding: '8px 16px', 
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              disabled={loading}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
        
        {creditRequests.length === 0 ? (
          <div className="card">
            <p>No credit requests found.</p>
          </div>
        ) : (
          <>
            {/* Filter Buttons */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3>Filter Requests</h3>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => setFilter('pending')}
                  className="btn"
                  style={{ 
                    backgroundColor: filter === 'pending' ? '#ff9800' : '#9e9e9e',
                    padding: '8px 16px',
                    fontSize: '14px'
                  }}
                >
                  Pending ({creditRequests.filter(r => r.status === 'pending').length})
                </button>
                <button
                  onClick={() => setFilter('approved')}
                  className="btn"
                  style={{ 
                    backgroundColor: filter === 'approved' ? '#4CAF50' : '#9e9e9e',
                    padding: '8px 16px',
                    fontSize: '14px'
                  }}
                >
                  Approved ({creditRequests.filter(r => r.status === 'approved').length})
                </button>
                <button
                  onClick={() => setFilter('rejected')}
                  className="btn"
                  style={{ 
                    backgroundColor: filter === 'rejected' ? '#f44336' : '#9e9e9e',
                    padding: '8px 16px',
                    fontSize: '14px'
                  }}
                >
                  Rejected ({creditRequests.filter(r => r.status === 'rejected').length})
                </button>
                <button
                  onClick={() => setFilter('all')}
                  className="btn"
                  style={{ 
                    backgroundColor: filter === 'all' ? '#1e3c72' : '#9e9e9e',
                    padding: '8px 16px',
                    fontSize: '14px'
                  }}
                >
                  All ({creditRequests.length})
                </button>
              </div>
            </div>

            {/* Requests List */}
            <div className="card">
              <h2>
                Credit Requests ({filteredRequests.length})
                {filter === 'pending' && filteredRequests.length > 0 && (
                  <span style={{
                    marginLeft: '10px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: '#ff9800',
                    color: 'white',
                    animation: 'pulse 2s infinite'
                  }}>
                    🔴 New Requests
                  </span>
                )}
              </h2>
              <div style={{ marginTop: '20px' }}>
                {filteredRequests.map((request) => (
                  <div key={request.id} style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '15px',
                    backgroundColor: '#f9f9f9',
                    borderLeft: `4px solid ${getStatusColor(request.status)}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: '0 0 5px 0', color: '#1e3c72' }}>
                          Rider: {request.phoneKey}
                          <span style={{
                            marginLeft: '10px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            backgroundColor: getStatusColor(request.status),
                            color: 'white'
                          }}>
                            {request.status}
                          </span>
                        </h3>
                        <p style={{ margin: '0', color: '#666' }}>GCash Reference: {request.gcashReference}</p>
                        {request.approvedAmount && (
                          <p style={{ margin: '0', color: '#4CAF50', fontWeight: 'bold' }}>
                            Amount Added: ₱{request.approvedAmount.toFixed(2)}
                          </p>
                        )}
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                          Requested: {formatDate(request.createdAt)}
                          {request.approvedAt && (
                            <span style={{ marginLeft: '10px', color: '#4CAF50' }}>
                              Approved: {formatDate(request.approvedAt)}
                            </span>
                          )}
                          {request.rejectedAt && (
                            <span style={{ marginLeft: '10px', color: '#f44336' }}>
                              Rejected: {formatDate(request.rejectedAt)}
                            </span>
                          )}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => viewRequestDetails(request)}
                          className="btn"
                          style={{ backgroundColor: '#2196F3', padding: '8px 16px', fontSize: '14px' }}
                        >
                          View Details
                        </button>
                        {request.status === 'pending' && (
                          <button
                            onClick={() => handleReject(request)}
                            className="btn"
                            style={{ backgroundColor: '#f44336', padding: '8px 16px', fontSize: '14px' }}
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Request Details Modal */}
        {showDetails && selectedRequest && (
          <div className="card" style={{ marginTop: '20px' }}>
            <h2>Credit Request Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div>
                <h4>Request Information</h4>
                <p><strong>Rider Phone:</strong> {selectedRequest.phoneKey}</p>
                <p><strong>GCash Reference:</strong> {selectedRequest.gcashReference}</p>
                <p><strong>Status:</strong> 
                  <span style={{
                    marginLeft: '5px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: getStatusColor(selectedRequest.status),
                    color: 'white'
                  }}>
                    {selectedRequest.status}
                  </span>
                </p>
                <p><strong>Requested:</strong> {formatDate(selectedRequest.createdAt)}</p>
                {selectedRequest.approvedAt && (
                  <p><strong>Approved:</strong> {formatDate(selectedRequest.approvedAt)}</p>
                )}
                {selectedRequest.rejectedAt && (
                  <p><strong>Rejected:</strong> {formatDate(selectedRequest.rejectedAt)}</p>
                )}
                {selectedRequest.adminNote && (
                  <p><strong>Admin Note:</strong> {selectedRequest.adminNote}</p>
                )}
              </div>
              
              <div>
                <h4>Rider Information</h4>
                {selectedRequest.riderInfo ? (
                  <>
                    <p><strong>Name:</strong> {selectedRequest.riderInfo.fullName}</p>
                    <p><strong>Email:</strong> {selectedRequest.riderInfo.email}</p>
                    <p><strong>Current Credit:</strong> ₱{(selectedRequest.riderInfo.credit || 0).toFixed(2)}</p>
                    <p><strong>Account Status:</strong> {selectedRequest.riderInfo.status || 'approved'}</p>
                  </>
                ) : (
                  <p style={{ color: '#666' }}>Rider information not available</p>
                )}
              </div>
            </div>
            
            {selectedRequest.status === 'pending' && (
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
                <h4>Approve Credit Request</h4>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Credit Amount to Add (₱):
                  </label>
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleApprove(selectedRequest)}
                    className="btn"
                    style={{ backgroundColor: '#4CAF50' }}
                  >
                    Approve Request
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest)}
                    className="btn"
                    style={{ backgroundColor: '#f44336' }}
                  >
                    Reject Request
                  </button>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedRequest(null);
                  setCreditAmount('');
                }}
                className="btn"
                style={{ backgroundColor: '#9e9e9e' }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

