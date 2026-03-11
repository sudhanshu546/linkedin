import React, { useState, useEffect } from 'react';
import { 
  getPendingConnections, 
  respondToConnectionRequest, 
  getUserByInternalId, 
  getAllUsers, 
  sendConnectionRequest,
  getMyConnections
} from '../api/userApi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faUserCircle, 
  faHashtag, 
  faCalendarAlt, 
  faFileAlt, 
  faUserPlus,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { useUser } from '../context/UserContext';
import '../App.css';

const MyNetworkPage = () => {
  const { user: currentUser } = useUser();
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('invitations'); // 'invitations' or 'connections'

  useEffect(() => {
    fetchInitialData();
  }, [currentUser]);

  const fetchInitialData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [pendingData, allUsersRes, connectionsRes] = await Promise.all([
        getPendingConnections(),
        getAllUsers(0, 50), // Fetch more to allow for filtering
        getMyConnections()
      ]);

      // 1. Process received invitations
      const requestsWithUsers = await Promise.all(
        pendingData.map(async (req) => {
          try {
            const userRes = await getUserByInternalId(req.requesterId); 
            return { ...req, sender: userRes.result };
          } catch (err) {
            return { ...req, sender: { firstName: 'User', lastName: req.requesterId.substring(0,8) } };
          }
        })
      );
      setRequests(requestsWithUsers);

      // 2. Process existing connections
      const connectedUsers = await Promise.all(
        connectionsRes.map(async (userId) => {
            try {
                const userRes = await getUserByInternalId(userId);
                return userRes.result;
            } catch (err) {
                return { id: userId, firstName: 'User', email: 'Connected' };
            }
        })
      );
      setConnections(connectedUsers);

      // 3. Filter suggestions: Not self, Not already connected, Not already in pending requests
      const connectedIds = new Set(connectionsRes);
      const pendingIds = new Set(pendingData.map(r => r.requesterId));
      
      const filteredSuggestions = (allUsersRes.result || []).filter(u => 
        u.id !== currentUser.id && 
        !connectedIds.has(u.id) &&
        !pendingIds.has(u.id)
      ).slice(0, 12); // Limit to 12 for display

      setSuggestions(filteredSuggestions);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load network data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, accept) => {
    try {
      await respondToConnectionRequest(id, accept);
      setRequests(requests.filter(req => req.id !== id));
      if (accept) {
          // Re-fetch to update connections list
          fetchInitialData();
      }
      toast.success(accept ? 'Accepted!' : 'Ignored.');
    } catch (err) {
      toast.error('Failed to process.');
    }
  };

  const handleConnect = async (userId) => {
      try {
          await sendConnectionRequest(userId);
          toast.success('Connection request sent!');
          // Update local state to show "Pending" or remove from suggestions
          setSuggestions(suggestions.filter(s => s.id !== userId));
      } catch (err) {
          toast.error('Already sent or failed.');
      }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="page-layout network-grid">
      {/* Left Sidebar */}
      <aside className="network-sidebar">
        <div className="linkedin-card network-sidebar-card">
          <div className="card-header" style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Manage my network</h3>
          </div>
          <ul className="network-sidebar-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li 
                onClick={() => setView('connections')}
                style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    backgroundColor: view === 'connections' ? '#f3f2ef' : 'transparent',
                    fontWeight: view === 'connections' ? '600' : '400',
                    borderLeft: view === 'connections' ? '4px solid #057642' : '4px solid transparent'
                }}
            >
                <FontAwesomeIcon icon={faUsers} style={{ width: '20px' }} /> 
                <div style={{ flex: 1 }}>Connections</div>
                <span style={{ color: '#666' }}>{connections.length}</span>
            </li>
            <li 
                onClick={() => setView('invitations')}
                style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    backgroundColor: view === 'invitations' ? '#f3f2ef' : 'transparent',
                    fontWeight: view === 'invitations' ? '600' : '400',
                    borderLeft: view === 'invitations' ? '4px solid #057642' : '4px solid transparent'
                }}
            >
                <FontAwesomeIcon icon={faClock} style={{ width: '20px' }} /> 
                <div style={{ flex: 1 }}>Pending Invitations</div>
                <span style={{ color: '#666' }}>{requests.length}</span>
            </li>
            <li style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', color: '#666' }}>
                <FontAwesomeIcon icon={faUserCircle} style={{ width: '20px' }} /> 
                <span>Following & followers</span>
            </li>
            <li style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', color: '#666' }}>
                <FontAwesomeIcon icon={faCalendarAlt} style={{ width: '20px' }} /> 
                <span>Events</span>
            </li>
            <li style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', color: '#666' }}>
                <FontAwesomeIcon icon={faFileAlt} style={{ width: '20px' }} /> 
                <span>Newsletters</span>
            </li>
            <li style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', color: '#666' }}>
                <FontAwesomeIcon icon={faHashtag} style={{ width: '20px' }} /> 
                <span>Hashtags</span>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="network-main">
        {/* Invitations View */}
        {view === 'invitations' && (
            <div className="linkedin-card" style={{ marginBottom: '16px' }}>
                <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '400' }}>Invitations ({requests.length})</h3>
                    {requests.length > 0 && <button className="btn-secondary-round" style={{ fontSize: '14px', padding: '4px 12px' }}>Manage</button>}
                </div>
                {requests.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#666' }}>
                    <p style={{ margin: 0 }}>No pending invitations.</p>
                    </div>
                ) : (
                    <div className="invitations-list">
                    {requests.map((req) => (
                        <div key={req.id} className="invitation-item" style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="sender-info" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <FontAwesomeIcon icon={faUserCircle} size="3x" style={{ color: '#ccc' }} />
                                <div className="sender-details">
                                <Link to={`/profile/${req.sender?.id || ''}`} style={{ textDecoration: 'none' }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', color: 'rgba(0,0,0,0.9)', fontWeight: '600' }}>{req.sender?.firstName} {req.sender?.lastName}</h4>
                                </Link>
                                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{req.sender?.email}</p>
                                </div>
                            </div>
                            <div className="request-actions" style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleAction(req.id, false)} className="btn-secondary-round" style={{ padding: '4px 16px', fontSize: '14px', border: 'none', color: '#666' }}>Ignore</button>
                                <button onClick={() => handleAction(req.id, true)} className="btn-secondary-round" style={{ padding: '4px 16px', fontSize: '14px', color: '#0a66c2', fontWeight: '600' }}>Accept</button>
                            </div>
                        </div>
                    ))}
                    </div>
                )}
            </div>
        )}

        {/* Connections View */}
        {view === 'connections' && (
            <div className="linkedin-card" style={{ marginBottom: '16px' }}>
                <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '400' }}>Your Connections ({connections.length})</h3>
                </div>
                {connections.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#666' }}>
                        <p style={{ margin: 0 }}>You haven't connected with anyone yet.</p>
                    </div>
                ) : (
                    <div className="connections-list">
                        {connections.map((conn) => (
                            <div key={conn.id} className="invitation-item" style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="sender-info" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <FontAwesomeIcon icon={faUserCircle} size="3x" style={{ color: '#ccc' }} />
                                    <div className="sender-details">
                                        <Link to={`/profile/${conn.id}`} style={{ textDecoration: 'none' }}>
                                            <h4 style={{ margin: 0, fontSize: '14px', color: 'rgba(0,0,0,0.9)', fontWeight: '600' }}>{conn.firstName} {conn.lastName}</h4>
                                        </Link>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{conn.email}</p>
                                    </div>
                                </div>
                                <div className="request-actions">
                                    <button className="btn-secondary-round" style={{ padding: '4px 16px', fontSize: '14px' }}>Message</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* Suggestions Section */}
        <div className="linkedin-card">
            <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '400' }}>People you may know</h3>
                <Link to="/search" style={{ fontSize: '14px', color: '#666', textDecoration: 'none', fontWeight: '600' }}>See all</Link>
            </div>
            <div className="suggestions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', padding: '12px' }}>
                {suggestions.map(userSuggestion => (
                    <div key={userSuggestion.id} className="suggestion-card" style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                        <FontAwesomeIcon icon={faUserCircle} size="4x" style={{ color: '#adb3b8', marginBottom: '8px' }} />
                        <Link to={`/profile/${userSuggestion.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <h4 style={{ margin: '4px 0', fontSize: '14px', fontWeight: '600' }}>{userSuggestion.firstName} {userSuggestion.lastName}</h4>
                        </Link>
                        <p style={{ fontSize: '12px', color: '#666', height: '32px', overflow: 'hidden', marginBottom: '12px' }}>{userSuggestion.email}</p>
                        <button 
                            onClick={() => handleConnect(userSuggestion.id)}
                            className="btn-secondary-pill" 
                            style={{ marginTop: 'auto', width: '100%', padding: '4px 0', fontSize: '14px' }}
                        >
                            <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: '4px' }} />
                            Connect
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </main>
    </div>
  );
};

export default MyNetworkPage;
