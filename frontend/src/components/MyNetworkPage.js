import React, { useState, useEffect } from 'react';
import { getPendingConnections, respondToConnectionRequest, getUserByInternalId, getAllUsers, sendConnectionRequest } from '../api/userApi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUserCircle, faHashtag, faCalendarAlt, faFileAlt, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import '../App.css';

const MyNetworkPage = () => {
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [pendingData, allUsersRes] = await Promise.all([
        getPendingConnections(),
        getAllUsers(0, 12)
      ]);

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
      setSuggestions(allUsersRes.result || []);
    } catch (err) {
      toast.error('Failed to load network data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, accept) => {
    try {
      await respondToConnectionRequest(id, accept);
      setRequests(requests.filter(req => req.id !== id));
      toast.success(accept ? 'Accepted!' : 'Ignored.');
    } catch (err) {
      toast.error('Failed to process.');
    }
  };

  const handleConnect = async (userId) => {
      try {
          await sendConnectionRequest(userId);
          toast.success('Connection request sent!');
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
          <div className="card-header">
            <h3>Manage my network</h3>
          </div>
          <ul className="network-sidebar-list">
            <li><FontAwesomeIcon icon={faUsers} /> Connections</li>
            <li><FontAwesomeIcon icon={faUserCircle} /> Following & followers</li>
            <li><FontAwesomeIcon icon={faCalendarAlt} /> Events</li>
            <li><FontAwesomeIcon icon={faFileAlt} /> Newsletters</li>
            <li><FontAwesomeIcon icon={faHashtag} /> Hashtags</li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="network-main">
        {/* Invitations Section */}
        <div className="linkedin-card" style={{ marginBottom: '16px' }}>
          <div className="card-header">
            <h3>Invitations ({requests.length})</h3>
          </div>
          {requests.length === 0 ? (
            <div className="card-body">
              <p className="no-data">No pending invitations.</p>
            </div>
          ) : (
            <div className="invitations-list">
              {requests.map((req) => (
                <div key={req.id} className="invitation-item">
                  <div className="sender-info">
                    <FontAwesomeIcon icon={faUserCircle} size="3x" style={{ color: '#ccc' }} />
                    <div className="sender-details">
                      <Link to={`/profile/${req.sender?.keycloakUserId || ''}`}>
                        <h4>{req.sender?.firstName} {req.sender?.lastName}</h4>
                      </Link>
                      <p>{req.sender?.email}</p>
                    </div>
                  </div>
                  <div className="request-actions">
                    <button onClick={() => handleAction(req.id, false)} className="secondary-button">Ignore</button>
                    <button onClick={() => handleAction(req.id, true)} className="primary-button">Accept</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggestions Section */}
        <div className="linkedin-card">
            <div className="card-header">
                <h3>People you may know</h3>
            </div>
            <div className="suggestions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', padding: '12px' }}>
                {suggestions.map(user => (
                    <div key={user.id} className="suggestion-card" style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <FontAwesomeIcon icon={faUserCircle} size="4x" style={{ color: '#adb3b8', marginBottom: '8px' }} />
                        <h4 style={{ margin: '4px 0', fontSize: '14px' }}>{user.firstName} {user.lastName}</h4>
                        <p style={{ fontSize: '12px', color: '#666', height: '32px', overflow: 'hidden' }}>{user.email}</p>
                        <button 
                            onClick={() => handleConnect(user.id)}
                            className="btn-secondary-round" 
                            style={{ marginTop: 'auto', width: '100%' }}
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
