import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecommendations, sendConnectionRequest } from '../api/profileApi';
import { getUserById } from '../api/userApi';
import { useUser } from '../context/UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { IMAGE_BASE_URL } from '../constants/api';
import { toast } from 'react-toastify';

interface Recommendation {
  id: string;
  firstName: string;
  lastName: string;
  headline?: string;
  profileImageUrl?: string;
}

const Recommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRecommendations();
      // Handle both ApiResponse and direct array
      const data = Array.isArray(res) ? res : (res as any)?.data || [];
      
      if (data.length === 0) {
          setRecommendations([]);
          return;
      }

      const detailedRecommendations = await Promise.all(data.map(async (recId: string) => {
          if (typeof recId !== 'string') return null;
          try {
              const userDetails = await getUserById(recId); 
              if (!userDetails) return null;
              return {
                  id: recId, 
                  firstName: userDetails.firstName || 'User',
                  lastName: userDetails.lastName || '',
                  headline: userDetails.userName || 'LinkedIn Member',
                  profileImageUrl: userDetails.profileImageUrl,
              };
          } catch (userErr) {
              console.error(`Error fetching details for user ${recId}:`, userErr);
              return null; // Skip failed users instead of breaking all
          }
      }));
      
      setRecommendations(detailedRecommendations.filter((r): r is Recommendation => r !== null));
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      // Don't show error to user for side-bar component, just log it
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleConnect = async (targetUserId: string) => {
      try {
          await sendConnectionRequest(targetUserId);
          toast.success('Connection request sent!');
          setRecommendations(prev => prev.filter(r => r.id !== targetUserId));
      } catch (err) {
          toast.error('Failed to send request.');
      }
  };

  if (loading) return (
    <div className="linkedin-card recommendations-card">
      <div className="card-header"><h3>People you may know</h3></div>
      <div className="card-body" style={{ padding: '16px' }}><div className="spinner-small"></div></div>
    </div>
  );

  if (recommendations.length === 0) return null;

  return (
    <div className="linkedin-card recommendations-card">
      <div className="card-header">
        <h3>People you may know</h3>
      </div>
      <div className="card-body">
        {recommendations.map(rec => (
          <div key={rec.id} className="recommendation-item">
            {rec.profileImageUrl ? (
              <img src={`${IMAGE_BASE_URL}${rec.profileImageUrl}`} alt="Profile" className="avatar-md" style={{ objectFit: 'cover' }} />
            ) : (
              <FontAwesomeIcon icon={faUserCircle} className="avatar-md-icon" style={{ fontSize: '48px', color: '#adb3b8' }} />
            )}
            <div className="recommendation-info">
              <Link to={`/profile/${rec.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h4 style={{ fontSize: '14px', margin: 0 }}>{rec.firstName} {rec.lastName}</h4>
              </Link>
              <p style={{ fontSize: '12px', color: '#666', margin: '2px 0 8px' }}>{rec.headline}</p>
              <button 
                className="primary-button-small" 
                onClick={() => handleConnect(rec.id)}
                style={{ 
                    padding: '4px 12px', 
                    fontSize: '13px', 
                    borderRadius: '16px',
                    border: '1px solid #0a66c2',
                    backgroundColor: 'transparent',
                    color: '#0a66c2',
                    fontWeight: 600,
                    cursor: 'pointer'
                }}
              >
                <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: '6px' }} /> Connect
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;
