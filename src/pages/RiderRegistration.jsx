import { useState, useEffect } from 'react';
import { getDatabase, ref, get, update, remove, set } from 'firebase/database';
import { db } from '../firebase';

export default function RiderRegistration() {
  const [pendingRiders, setPendingRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchPendingRiders();
  }, []);

  const fetchPendingRiders = async () => {
    try {
      setLoading(true);
      const manageridersRef = ref(db, 'manageriders');
      const snapshot = await get(manageridersRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
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
    if (!rider || !rider.phoneNumber) {
      console.error('Invalid rider data:', rider);
      alert('Invalid rider data. Please try again.');
      return;
    }

    if (!window.confirm(`Are you sure you want to approve ${rider.fullName || 'this rider'}?`)) {
      return; // User cancelled the approval
    }

    try {
      console.log('Approving rider:', rider.phoneNumber);
      
      // Move rider from manageriders to ridersAccount
      const riderData = {
        fullName: rider.fullName || '',
        phoneNumber: rider.phoneNumber,
        email: rider.email || '',
        password: rider.password || '',
        profileImage: rider.profileImage || '',
        orcrImage: rider.orcrImage || '',
        licenseImage: rider.licenseImage || '',
        selfieImage: rider.selfieImage || '',
        motorcycleImage: rider.motorcycleImage || '',
        status: 'approved',
        createdAt: rider.createdAt || Date.now(),
        approvedAt: Date.now()
      };

      console.log('Preparing to save rider data:', JSON.stringify(riderData, null, 2));

      // Add to ridersAccount
      const ridersAccountRef = ref(db, `ridersAccount/${rider.phoneNumber}`);
      await set(ridersAccountRef, riderData);

      console.log('Successfully added to ridersAccount, now removing from manageriders...');

      // Remove from manageriders
      const manageridersRef = ref(db, `manageriders/${rider.phoneNumber}`);
      await remove(manageridersRef);

      console.log('Successfully removed from manageriders');

      // Refresh the list and UI
      await fetchPendingRiders();
      setShowDetails(false);
      setSelectedRider(null);
      
      // Show success message
      alert(`Successfully approved ${rider.fullName || 'rider'}!`);
    } catch (error) {
      console.error('Error in handleApprove:', error);
      alert(`Failed to approve rider: ${error.message || 'Please check console for details.'}`);
    }
  };

  const handleReject = async (rider) => {
    if (!confirm('Are you sure you want to reject this rider registration?')) {
      return;
    }

    try {
      // Remove from manageriders
      const manageridersRef = ref(db, `manageriders/${rider.phoneNumber}`);
      await remove(manageridersRef);

      // Refresh the list
      await fetchPendingRiders();
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
