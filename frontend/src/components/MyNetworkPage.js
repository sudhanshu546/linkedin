import React, { useState, useEffect } from 'react';
import { getPendingConnections, respondToConnectionRequest, getUserByInternalId } from '../api/userApi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUserCircle, faHashtag, faCalendarAlt, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import '../App.css';

const MyNetworkPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await getPendingConnections();
      const requestsWithUsers = await Promise.all(
        data.map(async (req) => {
          try {
            const userRes = await getUserByInternalId(req.requesterId); 
            return { ...req, sender: userRes.result };
          } catch (err) {
            return { ...req, sender: { firstName: 'User', lastName: req.requesterId.substring(0,8) } };
          }
        })
      );
      setRequests(requestsWithUsers);
    } catch (err) {
      toast.error('Failed to load network.');
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
        <div className="linkedin-card">
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
                    <img src="https://via.placeholder.com/72" alt="Avatar" className="author-avatar" />
                    <div className="sender-details">
                      <Link to={`/profile/${req.sender.keycloakUserId}`}>
                        <h4>{req.sender.firstName} {req.sender.lastName}</h4>
                      </Link>
                      <p>{req.sender.email}</p>
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
      </main>
    </div>
  );
};

export default MyNetworkPage;
