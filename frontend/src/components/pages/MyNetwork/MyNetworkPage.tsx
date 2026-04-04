import React, { useState, useEffect, useCallback } from 'react';
import { 
  respondToConnectionRequest, 
  sendConnectionRequest,
  getPendingRequests,
  getConnections
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
  sender?: User;
}

const MyNetworkPage: React.FC = () => {
  const { user: currentUser } = useUser();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [connections, setConnections] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'invitations' | 'connections'>('invitations'); 

  const fetchInitialData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [pendingRes, allUsersRes, connectionsRes] = await Promise.all([
        getPendingRequests(),
        getAllUsers(0, 100), 
        getConnections()
      ]);

      const pendingData = Array.isArray(pendingRes) ? pendingRes : (pendingRes as any)?.data || [];
      const connectionsData = Array.isArray(connectionsRes) ? connectionsRes : (connectionsRes as any)?.data || [];

      // Fetch senders for pending requests
      const requestsWithUsers = await Promise.all(
        pendingData.map(async (req: any) => {
          try {
            const userData = await getUserById(req.requesterId); 
            return { ...req, sender: userData };
          } catch (err) {
            return { ...req, sender: { id: req.requesterId, firstName: 'LinkedIn', lastName: 'User', email: '' } as User };
          }
        })
      );
      setRequests(requestsWithUsers);

      // Fetch detailed connection info
      const connectedUsers = await Promise.all(
        connectionsData.map(async (conn: any) => {
            const otherId = conn.requesterId === currentUser.id ? conn.receiverId : conn.requesterId;
            try {
                const userData = await getUserById(otherId);
                return userData;
            } catch (err) {
                return { id: otherId, firstName: 'LinkedIn', lastName: 'User', email: '' } as User;
            }
        })
      );
      setConnections(connectedUsers.filter(u => u !== null));

      // Filtering logic for suggestions
      const connectedAndPendingIds = new Set<string>();
      connectedAndPendingIds.add(currentUser.id);

      connectionsData.forEach((c: any) => {
          connectedAndPendingIds.add(c.requesterId);
          connectedAndPendingIds.add(c.receiverId);
      });

      pendingData.forEach((r: any) => {
          connectedAndPendingIds.add(r.requesterId);
          connectedAndPendingIds.add(r.receiverId);
      });
      
      const allUsersData = Array.isArray(allUsersRes) ? allUsersRes : (allUsersRes as any)?.data || [];
      const suggestionList = Array.isArray(allUsersData) ? allUsersData : (allUsersData as any).data || [];

      const finalSuggestions = suggestionList.filter((u: User) => 
        u && u.id && !connectedAndPendingIds.has(u.id)
      ).slice(0, 12);

      setSuggestions(finalSuggestions);
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

  const handleMessageClick = (conn: User) => {
    navigate(`/messaging?userId=${conn.id}&userName=${encodeURIComponent(conn.firstName + ' ' + conn.lastName)}`);
  };

  const renderAvatar = (user?: User, size: "3x" | "4x" = "3x") => {
      if (user?.profileImageUrl) {
          return <img 
            src={`${IMAGE_BASE_URL}${user.profileImageUrl}`} 
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
                                {renderAvatar(req.sender, "3x")}
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
                                    {renderAvatar(conn, "3x")}
                                    <div className="sender-details">
                                        <Link to={`/profile/${conn.id}`} style={{ textDecoration: 'none' }}>
                                            <h4 style={{ margin: 0, fontSize: '14px', color: 'rgba(0,0,0,0.9)', fontWeight: '600' }}>{conn.firstName} {conn.lastName}</h4>
                                        </Link>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{conn.email}</p>
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
                        ))}
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
                        {renderAvatar(userSuggestion, "4x")}
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
