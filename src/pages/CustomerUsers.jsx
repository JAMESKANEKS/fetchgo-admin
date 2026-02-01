import { useState, useEffect } from 'react';

export default function CustomerUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${FIREBASE_DB_URL}/usersAccount.json`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      
      if (data) {
        const usersList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setUsers(usersList);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowDetails(true);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh'
      }}>
        <div style={{
          backgroundColor: '#ffebee',
          border: '1px solid #ef9a9a',
          color: '#c62828',
          padding: '15px',
          borderRadius: '4px',
          margin: '20px 0'
        }}>
          <strong>Error: </strong>
          {error}
        </div>
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
          Customer Users ({users.length})
        </h1>

        {!showDetails && (
          <div style={{ marginTop: '20px' }}>
            {users.length === 0 ? (
              <div style={{
                backgroundColor: '#fff8e1',
                borderLeft: '4px solid #ffc107',
                padding: '15px',
                marginBottom: '20px',
                borderRadius: '4px'
              }}>
                No customer users found.
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', color: '#1e3c72' }}>{user.fullname || 'N/A'}</h3>
                      <p style={{ margin: '0', color: '#666' }}>Email: {user.email || 'N/A'}</p>
                      <p style={{ margin: '0', color: '#666' }}>Phone: {user.phone || 'N/A'}</p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                        Member since: {formatDate(user.createdAt)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => viewUserDetails(user)}
                        style={{
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {showDetails && selectedUser && (
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '20px',
            backgroundColor: '#f9f9f9'
          }}>
            <h2 style={{ color: '#1e3c72', marginTop: 0 }}>User Details - {selectedUser.fullname || 'N/A'}</h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px', 
              marginTop: '20px' 
            }}>
              <div>
                <h4 style={{ color: '#1e3c72', marginBottom: '10px' }}>Personal Information</h4>
                <p style={{ margin: '8px 0' }}><strong>Full Name:</strong> {selectedUser.fullname || 'N/A'}</p>
                <p style={{ margin: '8px 0' }}><strong>Email:</strong> {selectedUser.email || 'N/A'}</p>
                <p style={{ margin: '8px 0' }}><strong>Phone:</strong> {selectedUser.phone || 'N/A'}</p>
                <p style={{ margin: '8px 0' }}><strong>Member Since:</strong> {formatDate(selectedUser.createdAt)}</p>
              </div>
              
              <div>
                <h4 style={{ color: '#1e3c72', marginBottom: '10px' }}>Account Information</h4>
                <p style={{ margin: '8px 0' }}><strong>User ID:</strong> {selectedUser.id || 'N/A'}</p>
                {selectedUser.profileImage && (
                  <div style={{ marginTop: '15px' }}>
                    <p><strong>Profile Image:</strong></p>
                    <img 
                      src={selectedUser.profileImage} 
                      alt="Profile" 
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        objectFit: 'cover', 
                        borderRadius: '8px',
                        marginTop: '10px'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              marginTop: '20px',
              borderTop: '1px solid #eee',
              paddingTop: '20px'
            }}>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedUser(null);
                }}
                style={{
                  backgroundColor: '#9e9e9e',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Back to List
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

