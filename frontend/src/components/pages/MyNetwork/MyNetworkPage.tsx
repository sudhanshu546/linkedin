import React, { useState, useEffect, useCallback } from 'react';
import { 
  respondToConnectionRequest, 
  sendConnectionRequest,
  getPendingRequests,
  getConnections,
  getRecommendations
} from '../../../api/profileApi';
import { 
  getUserById, 
  getAllUsers
} from '../../../api/userApi';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faUserCircle,  
  faUserPlus,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { useUser } from '../../../context/UserContext';
import '../../../App.css';
import { User } from '../../../types';
import { IMAGE_BASE_URL } from '../../../constants/api';

interface PendingRequest {
  id: string;
  requesterId: string;
  receiverId: string;
  status: string;
  // Enriched fields from backend
  requesterName?: string;
  requesterAvatar?: string;
  requesterDesignation?: string;
}

interface UserConnection {
  id: string;
  requesterId: string;
  receiverId: string;
  status: string;
  // Enriched fields from backend
  requesterName?: string;
  requesterAvatar?: string;
  requesterDesignation?: string;
  receiverName?: string;
  receiverAvatar?: string;
  receiverDesignation?: string;
}

const MyNetworkPage: React.FC = () => {
  const { user: currentUser } = useUser();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'invitations' | 'connections'>('invitations'); 

  const fetchInitialData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [pendingRes, connectionsRes, suggestionsRes] = await Promise.all([
        getPendingRequests(),
        getConnections(),
        getRecommendations()
      ]);

      setRequests(pendingRes || []);
      setConnections(connectionsRes || []);
      setSuggestions(suggestionsRes || []);
    } catch (err) {
      console.error('Error fetching network data:', err);
      toast.error('Failed to load network data.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleAction = async (id: string, accept: boolean) => {
    try {
      await respondToConnectionRequest(id, accept);
      setRequests(requests.filter(req => req.id !== id));
      if (accept) {
          fetchInitialData();
      }
      toast.success(accept ? 'Accepted!' : 'Ignored.');
    } catch (err) {
      toast.error('Failed to process.');
    }
  };

  const handleConnect = async (userId: string) => {
      try {
          await sendConnectionRequest(userId);
          toast.success('Connection request sent!');
          setSuggestions(suggestions.filter(s => s.id !== userId));
      } catch (err) {
          toast.error('Failed to send request.');
      }
  };

  const handleMessageClick = (conn: UserConnection) => {
    const isRequester = conn.requesterId === currentUser?.id;
    const otherId = isRequester ? conn.receiverId : conn.requesterId;
    const otherName = isRequester ? conn.receiverName : conn.requesterName;
    navigate(`/messaging?userId=${otherId}&userName=${encodeURIComponent(otherName || '')}`);
  };

  const renderAvatar = (imageUrl?: string, size: "3x" | "4x" = "3x") => {
      if (imageUrl) {
          return <img 
            src={imageUrl.startsWith('http') ? imageUrl : `${IMAGE_BASE_URL}${imageUrl}`} 
            alt="" 
            style={{ 
                width: size === "3x" ? "48px" : "80px", 
                height: size === "3x" ? "48px" : "80px", 
                borderRadius: "50%", 
                objectFit: "cover" 
            }} 
          />;
      }
      return <FontAwesomeIcon icon={faUserCircle} size={size} style={{ color: '#adb3b8' }} />;
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="page-layout network-grid">
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
          </ul>
        </div>
      </aside>

      <main className="network-main">
        {view === 'invitations' && (
            <div className="linkedin-card" style={{ marginBottom: '16px' }}>
                <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '400' }}>Invitations ({requests.length})</h3>
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
                                {renderAvatar(req.requesterAvatar, "3x")}
                                <div className="sender-details">
                                <Link to={`/profile/${req.requesterId}`} style={{ textDecoration: 'none' }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', color: 'rgba(0,0,0,0.9)', fontWeight: '600' }}>{req.requesterName}</h4>
                                </Link>
                                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{req.requesterDesignation || 'LinkedIn Member'}</p>
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
                        {connections.map((conn) => {
                            const isRequester = conn.requesterId === currentUser?.id;
                            const otherId = isRequester ? conn.receiverId : conn.requesterId;
                            const otherName = isRequester ? conn.receiverName : conn.requesterName;
                            const otherAvatar = isRequester ? conn.receiverAvatar : conn.requesterAvatar;
                            const otherDesignation = isRequester ? conn.receiverDesignation : conn.requesterDesignation;

                            return (
                                <div key={conn.id} className="invitation-item" style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="sender-info" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        {renderAvatar(otherAvatar, "3x")}
                                        <div className="sender-details">
                                            <Link to={`/profile/${otherId}`} style={{ textDecoration: 'none' }}>
                                                <h4 style={{ margin: 0, fontSize: '14px', color: 'rgba(0,0,0,0.9)', fontWeight: '600' }}>{otherName}</h4>
                                            </Link>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{otherDesignation || 'LinkedIn Member'}</p>
                                        </div>
                                    </div>
                                    <div className="request-actions">
                                        <button 
                                            onClick={() => handleMessageClick(conn)} 
                                            className="btn-secondary-round" 
                                            style={{ padding: '4px 16px', fontSize: '14px', color: '#0a66c2', fontWeight: '600' }}
                                        >
                                            Message
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        )}

        <div className="linkedin-card">
            <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '400' }}>People you may know</h3>
            </div>
            <div className="suggestions-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', padding: '12px', display: 'grid' }}>
                {suggestions.map(userSuggestion => (
                    <div key={userSuggestion.id} className="suggestion-card" style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                        {renderAvatar(userSuggestion.profileImageUrl, "4x")}
                        <Link to={`/profile/${userSuggestion.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <h4 style={{ margin: '4px 0', fontSize: '14px', fontWeight: '600' }}>{userSuggestion.firstName} {userSuggestion.lastName}</h4>
                        </Link>
                        <p style={{ fontSize: '12px', color: '#666', height: '32px', overflow: 'hidden', marginBottom: '12px' }}>{userSuggestion.designation || 'LinkedIn Member'}</p>
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
