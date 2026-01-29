import { useState, useEffect } from 'react';

export default function ManageRiders() {
  const [approvedRiders, setApprovedRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddCredit, setShowAddCredit] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [isAddingCredit, setIsAddingCredit] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, suspended

  const FIREBASE_DB_URL = 'https://fetchgo-73a4c-default-rtdb.asia-southeast1.firebasedatabase.app';

  useEffect(() => {
    fetchApprovedRiders();
  }, []);

  const fetchApprovedRiders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${FIREBASE_DB_URL}/ridersAccount.json`);
      const data = await response.json();
      
      if (data) {
        const riders = Object.keys(data)
          .map(key => ({
            id: key,
            phoneNumber: key,
            ...data[key]
          }))
          .sort((a, b) => b.approvedAt - a.approvedAt); // Sort by approval date
        setApprovedRiders(riders);
      } else {
        setApprovedRiders([]);
      }
    } catch (error) {
      console.error('Error fetching approved riders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (rider) => {
    if (!confirm(`Are you sure you want to suspend ${rider.fullName}?`)) {
      return;
    }

    try {
      const response = await fetch(`${FIREBASE_DB_URL}/ridersAccount/${rider.phoneNumber}.json`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'suspended',
          suspendedAt: Date.now()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to suspend rider');
      }

      // Refresh the list
      fetchApprovedRiders();
      alert('Rider suspended successfully!');
    } catch (error) {
      console.error('Error suspending rider:', error);
      alert('Failed to suspend rider. Please try again.');
    }
  };

  const handleRestore = async (rider) => {
    if (!confirm(`Are you sure you want to restore ${rider.fullName}?`)) {
      return;
    }

    try {
      const response = await fetch(`${FIREBASE_DB_URL}/ridersAccount/${rider.phoneNumber}.json`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved',
          restoredAt: Date.now()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to restore rider');
      }

      // Refresh the list
      fetchApprovedRiders();
      alert('Rider restored successfully!');
    } catch (error) {
      console.error('Error restoring rider:', error);
      alert('Failed to restore rider. Please try again.');
    }
  };

  const handleDelete = async (rider) => {
    if (!confirm(`Are you sure you want to permanently delete ${rider.fullName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${FIREBASE_DB_URL}/ridersAccount/${rider.phoneNumber}.json`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete rider');
      }

      // Refresh the list
      fetchApprovedRiders();
      setShowDetails(false);
      setSelectedRider(null);
      alert('Rider deleted successfully!');
    } catch (error) {
      console.error('Error deleting rider:', error);
      alert('Failed to delete rider. Please try again.');
    }
  };

  const handleAddCredit = async (rider) => {
    if (!creditAmount || parseFloat(creditAmount) <= 0) {
      alert('Please enter a valid credit amount');
      return;
    }

    if (!confirm(`Are you sure you want to add ₱${creditAmount} credit to ${rider.fullName}?`)) {
      return;
    }

    try {
      setIsAddingCredit(true);
      // Get current rider info to update credit balance
      const response = await fetch(`${FIREBASE_DB_URL}/ridersAccount/${rider.phoneNumber}.json`);
      const riderData = await response.json();
      
      if (!riderData) {
        throw new Error('Rider account not found');
      }

      // Update rider's credit balance
      const currentCredit = riderData.credit || 0;
      const newCredit = currentCredit + parseFloat(creditAmount);

      const updateResponse = await fetch(`${FIREBASE_DB_URL}/ridersAccount/${rider.phoneNumber}.json`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credit: newCredit,
          lastCreditUpdate: Date.now()
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update rider credit');
      }

      // Refresh the list
      await fetchApprovedRiders();
      
      // If we're in the details view, update the selected rider
      if (selectedRider && selectedRider.phoneNumber === rider.phoneNumber) {
        setSelectedRider({
          ...selectedRider,
          credit: newCredit
        });
      }
      
      setCreditAmount('');
      setShowAddCredit(false);
      alert(`Successfully added ₱${creditAmount} credit to ${rider.fullName}'s account.`);
    } catch (error) {
      console.error('Error adding credit:', error);
      alert('Failed to add credit. Please try again.');
    } finally {
      setIsAddingCredit(false);
    }
  };

  const viewRiderDetails = (rider) => {
    setSelectedRider(rider);
    setShowDetails(true);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#4CAF50';
      case 'suspended':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const filteredRiders = approvedRiders.filter(rider => {
    if (filter === 'all') return true;
    if (filter === 'active') return rider.status === 'approved';
    if (filter === 'suspended') return rider.status === 'suspended';
    return true;
  });

  if (loading) {
    return (
      <main>
        <div className="page-container">
          <h1>Manage Riders</h1>
          <div className="card">
            <p>Loading approved riders...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="page-container">
        <h1>Manage Riders</h1>
        
        {approvedRiders.length === 0 ? (
          <div className="card">
            <p>No approved riders found.</p>
          </div>
        ) : (
          <>
            {/* Filter Buttons */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3>Filter Riders</h3>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => setFilter('all')}
                  className="btn"
                  style={{ 
                    backgroundColor: filter === 'all' ? '#1e3c72' : '#9e9e9e',
                    padding: '8px 16px',
                    fontSize: '14px'
                  }}
                >
                  All ({approvedRiders.length})
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className="btn"
                  style={{ 
                    backgroundColor: filter === 'active' ? '#4CAF50' : '#9e9e9e',
                    padding: '8px 16px',
                    fontSize: '14px'
                  }}
                >
                  Active ({approvedRiders.filter(r => r.status === 'approved').length})
                </button>
                <button
                  onClick={() => setFilter('suspended')}
                  className="btn"
                  style={{ 
                    backgroundColor: filter === 'suspended' ? '#f44336' : '#9e9e9e',
                    padding: '8px 16px',
                    fontSize: '14px'
                  }}
                >
                  Suspended ({approvedRiders.filter(r => r.status === 'suspended').length})
                </button>
              </div>
            </div>

            {/* Riders List */}
            <div className="card">
              <h2>Approved Riders ({filteredRiders.length})</h2>
              <div style={{ marginTop: '20px' }}>
                {filteredRiders.map((rider) => (
                  <div key={rider.id} style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '15px',
                    backgroundColor: '#f9f9f9',
                    borderLeft: `4px solid ${getStatusColor(rider.status)}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: '0 0 5px 0', color: '#1e3c72' }}>
                          {rider.fullName}
                          <span style={{
                            marginLeft: '10px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            backgroundColor: getStatusColor(rider.status),
                            color: 'white'
                          }}>
                            {rider.status || 'approved'}
                          </span>
                        </h3>
                        <p style={{ margin: '0', color: '#666' }}>Phone: {rider.phoneNumber}</p>
                        <p style={{ margin: '0', color: '#666' }}>Email: {rider.email}</p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                          Approved: {formatDate(rider.approvedAt)}
                          {rider.suspendedAt && (
                            <span style={{ marginLeft: '10px', color: '#f44336' }}>
                              Suspended: {formatDate(rider.suspendedAt)}
                            </span>
                          )}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => viewRiderDetails(rider)}
                          className="btn"
                          style={{ backgroundColor: '#2196F3', padding: '8px 16px', fontSize: '14px' }}
                        >
                          View Details
                        </button>
                        {rider.status === 'approved' ? (
                          <button
                            onClick={() => handleSuspend(rider)}
                            className="btn"
                            style={{ backgroundColor: '#ff9800', padding: '8px 16px', fontSize: '14px' }}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestore(rider)}
                            className="btn"
                            style={{ backgroundColor: '#4CAF50', padding: '8px 16px', fontSize: '14px' }}
                          >
                            Restore
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

        {/* Rider Details Modal */}
        {showDetails && selectedRider && (
          <div className="card" style={{ marginTop: '20px' }}>
            <h2>Rider Details - {selectedRider.fullName}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div>
                <h4>Personal Information</h4>
                <p><strong>Full Name:</strong> {selectedRider.fullName}</p>
                <p><strong>Phone Number:</strong> {selectedRider.phoneNumber}</p>
                <p><strong>Email:</strong> {selectedRider.email}</p>
                <p><strong>Current Credit:</strong> ₱{(selectedRider.credit || 0).toFixed(2)}</p>
                <p><strong>Status:</strong> 
                  <span style={{
                    marginLeft: '5px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: getStatusColor(selectedRider.status),
                    color: 'white'
                  }}>
                    {selectedRider.status || 'approved'}
                  </span>
                </p>
                <p><strong>Applied:</strong> {formatDate(selectedRider.createdAt)}</p>
                <p><strong>Approved:</strong> {formatDate(selectedRider.approvedAt)}</p>
                {selectedRider.suspendedAt && (
                  <p><strong>Suspended:</strong> {formatDate(selectedRider.suspendedAt)}</p>
                )}
                {selectedRider.restoredAt && (
                  <p><strong>Restored:</strong> {formatDate(selectedRider.restoredAt)}</p>
                )}
                
                <div style={{ marginTop: '20px' }}>
                  <h4>Manage Credit</h4>
                  {showAddCredit ? (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        placeholder="Enter amount"
                        style={{
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          width: '150px'
                        }}
                      />
                      <button
                        onClick={() => handleAddCredit(selectedRider)}
                        disabled={isAddingCredit}
                        className="btn"
                        style={{ 
                          backgroundColor: '#4CAF50',
                          padding: '8px 16px',
                          opacity: isAddingCredit ? 0.7 : 1,
                          cursor: isAddingCredit ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isAddingCredit ? 'Adding...' : 'Add Credit'}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddCredit(false);
                          setCreditAmount('');
                        }}
                        className="btn"
                        style={{ 
                          backgroundColor: '#9e9e9e',
                          padding: '8px 16px'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddCredit(true)}
                      className="btn"
                      style={{ 
                        backgroundColor: '#1e3c72',
                        padding: '8px 16px',
                        marginTop: '10px'
                      }}
                    >
                      Add Credit
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <h4>Submitted Documents</h4>
                <div style={{ marginBottom: '10px' }}>
                  <p><strong>Profile Image:</strong></p>
                  {selectedRider.profileImage && (
                    <img 
                      src={selectedRider.profileImage} 
                      alt="Profile" 
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  )}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <p><strong>OR/CR:</strong></p>
                  {selectedRider.orcrImage && (
                    <img 
                      src={selectedRider.orcrImage} 
                      alt="OR/CR" 
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  )}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <p><strong>License:</strong></p>
                  {selectedRider.licenseImage && (
                    <img 
                      src={selectedRider.licenseImage} 
                      alt="License" 
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  )}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <p><strong>Selfie:</strong></p>
                  {selectedRider.selfieImage && (
                    <img 
                      src={selectedRider.selfieImage} 
                      alt="Selfie" 
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  )}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <p><strong>Motorcycle:</strong></p>
                  {selectedRider.motorcycleImage && (
                    <img 
                      src={selectedRider.motorcycleImage} 
                      alt="Motorcycle" 
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              {selectedRider.status === 'approved' ? (
                <button
                  onClick={() => handleSuspend(selectedRider)}
                  className="btn"
                  style={{ backgroundColor: '#ff9800' }}
                >
                  Suspend Account
                </button>
              ) : (
                <button
                  onClick={() => handleRestore(selectedRider)}
                  className="btn"
                  style={{ backgroundColor: '#4CAF50' }}
                >
                  Restore Account
                </button>
              )}
              <button
                onClick={() => handleDelete(selectedRider)}
                className="btn"
                style={{ backgroundColor: '#f44336' }}
              >
                Delete Account
              </button>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedRider(null);
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

