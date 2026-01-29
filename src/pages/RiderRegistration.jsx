import { useState, useEffect } from 'react';
import { getDatabase, ref, get, update, remove } from 'firebase/database';

export default function RiderRegistration() {
  const [pendingRiders, setPendingRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const FIREBASE_DB_URL = 'https://fetchgo-73a4c-default-rtdb.asia-southeast1.firebasedatabase.app';

  useEffect(() => {
    fetchPendingRiders();
  }, []);

  const fetchPendingRiders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${FIREBASE_DB_URL}/manageriders.json`);
      const data = await response.json();
      
      if (data) {
        const riders = Object.keys(data)
          .filter(key => data[key].status === 'pending')
          .map(key => ({
            id: key,
            ...data[key]
          }));
        setPendingRiders(riders);
      } else {
        setPendingRiders([]);
      }
    } catch (error) {
      console.error('Error fetching pending riders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (rider) => {
    try {
      // Move rider from manageriders to ridersAccount
      const riderData = {
        fullName: rider.fullName,
        phoneNumber: rider.phoneNumber,
        email: rider.email,
        password: rider.password,
        profileImage: rider.profileImage,
        orcrImage: rider.orcrImage,
        licenseImage: rider.licenseImage,
        selfieImage: rider.selfieImage,
        motorcycleImage: rider.motorcycleImage,
        status: 'approved',
        createdAt: rider.createdAt,
        approvedAt: Date.now()
      };

      // Add to ridersAccount
      const addToRidersResponse = await fetch(`${FIREBASE_DB_URL}/ridersAccount/${rider.phoneNumber}.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(riderData),
      });

      if (!addToRidersResponse.ok) {
        throw new Error('Failed to approve rider');
      }

      // Remove from manageriders
      const removeFromPendingResponse = await fetch(`${FIREBASE_DB_URL}/manageriders/${rider.phoneNumber}.json`, {
        method: 'DELETE',
      });

      if (!removeFromPendingResponse.ok) {
        throw new Error('Failed to remove from pending');
      }

      // Refresh the list
      fetchPendingRiders();
      setShowDetails(false);
      setSelectedRider(null);
      alert('Rider approved successfully!');
    } catch (error) {
      console.error('Error approving rider:', error);
      alert('Failed to approve rider. Please try again.');
    }
  };

  const handleReject = async (rider) => {
    if (!confirm('Are you sure you want to reject this rider registration?')) {
      return;
    }

    try {
      // Remove from manageriders
      const response = await fetch(`${FIREBASE_DB_URL}/manageriders/${rider.phoneNumber}.json`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to reject rider');
      }

      // Refresh the list
      fetchPendingRiders();
      setShowDetails(false);
      setSelectedRider(null);
      alert('Rider registration rejected!');
    } catch (error) {
      console.error('Error rejecting rider:', error);
      alert('Failed to reject rider. Please try again.');
    }
  };

  const viewRiderDetails = (rider) => {
    setSelectedRider(rider);
    setShowDetails(true);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <main>
        <div className="page-container">
          <h1>Rider Registration</h1>
          <div className="card">
            <p>Loading pending registrations...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="page-container">
        <h1>Rider Registration</h1>
        
        {pendingRiders.length === 0 ? (
          <div className="card">
            <p>No pending rider registrations.</p>
          </div>
        ) : (
          <div className="card">
            <h2>Pending Registrations ({pendingRiders.length})</h2>
            <div style={{ marginTop: '20px' }}>
              {pendingRiders.map((rider) => (
                <div key={rider.id} style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', color: '#1e3c72' }}>{rider.fullName}</h3>
                      <p style={{ margin: '0', color: '#666' }}>Phone: {rider.phoneNumber}</p>
                      <p style={{ margin: '0', color: '#666' }}>Email: {rider.email}</p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                        Applied: {formatDate(rider.createdAt)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => viewRiderDetails(rider)}
                        className="btn"
                        style={{ backgroundColor: '#2196F3', padding: '8px 16px', fontSize: '14px' }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showDetails && selectedRider && (
          <div className="card" style={{ marginTop: '20px' }}>
            <h2>Rider Details - {selectedRider.fullName}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div>
                <h4>Personal Information</h4>
                <p><strong>Full Name:</strong> {selectedRider.fullName}</p>
                <p><strong>Phone Number:</strong> {selectedRider.phoneNumber}</p>
                <p><strong>Email:</strong> {selectedRider.email}</p>
                <p><strong>Applied:</strong> {formatDate(selectedRider.createdAt)}</p>
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
              <button
                onClick={() => handleApprove(selectedRider)}
                className="btn"
                style={{ backgroundColor: '#4CAF50' }}
              >
                Approve Registration
              </button>
              <button
                onClick={() => handleReject(selectedRider)}
                className="btn"
                style={{ backgroundColor: '#f44336' }}
              >
                Reject Registration
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
