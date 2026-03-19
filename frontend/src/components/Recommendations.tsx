import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecommendations } from '../../api/profileApi'; // Assuming recommendations endpoint is here
import { useUser } from '../../context/UserContext'; // To get current user ID for connection status
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faUserPlus } from '@fortawesome/free-solid-svg-icons'; // Add icons needed
import { sendConnectionRequest } from '../../api/profileApi'; // Assuming connection request is handled by profileApi

interface Recommendation {
  id: string; // Keycloak ID or internal ID
  firstName: string;
  lastName: string;
  headline?: string;
  profilePictureUrl?: string;
  // Add other relevant fields if available from the backend
}

const Recommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser(); // Get current user to avoid recommending self and for connection status

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecommendations();
      // The backend currently returns a list of UUIDs.
      // We need to fetch user details for each recommendation.
      // This part might need further backend enhancement to return full user details directly.
      // For now, we'll assume the backend returns enough info or we'll fetch user details.
      // Example: Assuming backend returns a list of user IDs for now.
      // If backend returns Recommendation object, adjust mapping accordingly.
      
      // Placeholder for fetching full user details if backend only returns IDs
      const detailedRecommendations = await Promise.all(data.map(async (recId: string) => {
          try {
              // Assuming getUserById returns basic user info. May need to adjust.
              const userDetails = await getUserById(recId); 
              return {
                  id: recId, 
                  firstName: userDetails?.firstName || 'User',
                  lastName: userDetails?.lastName || '',
                  headline: userDetails?.headline || 'LinkedIn Member',
                  profilePictureUrl: userDetails?.profilePictureUrl,
              };
          } catch (userErr) {
              console.error(`Error fetching details for user ${recId}:`, userErr);
              return { id: recId, firstName: 'User', lastName: '', headline: 'LinkedIn Member', profilePictureUrl: '' };
          }
      }));
      
      setRecommendations(detailedRecommendations);
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_URL || 'http://localhost:9191/us/uploads/';

  if (loading) return (
    <div className="linkedin-card recommendations-card">
      <div className="card-header"><h3>People you may know</h3></div>
      <div className="card-body" style={{ padding: '16px' }}><div className="spinner-small"></div></div>
    </div>
  );
  if (error) return (
    <div className="linkedin-card recommendations-card">
      <div className="card-header"><h3>People you may know</h3></div>
      <div className="card-body" style={{ padding: '16px', color: 'red' }}>{error}</div>
    </div>
  );
  if (recommendations.length === 0) return (
    <div className="linkedin-card recommendations-card">
      <div className="card-header"><h3>People you may know</h3></div>
      <div className="card-body" style={{ padding: '16px', color: '#666' }}>No recommendations available at the moment.</div>
    </div>
  );

  return (
    <div className="linkedin-card recommendations-card">
      <div className="card-header">
        <h3>People you may know</h3>
        {/* Potentially add a 'See all' link */}
      </div>
      <div className="card-body">
        {recommendations.map(rec => (
          <div key={rec.id} className="recommendation-item">
            {rec.profilePictureUrl ? (
              <img src={`${IMAGE_BASE_URL}${rec.profilePictureUrl}`} alt="Profile" className="avatar-md" style={{ objectFit: 'cover' }} />
            ) : (
              <FontAwesomeIcon icon={faUserCircle} className="avatar-md-icon" />
            )}
            <div className="recommendation-info">
              <Link to={`/profile/${rec.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h4>{rec.firstName} {rec.lastName}</h4>
              </Link>
              <p>{rec.headline}</p>
              {/* Placeholder for Connect button - requires fetching connection status */}
              <button 
                className="primary-button-small" 
                onClick={() => {/* handleConnect(rec.id) */}}
                style={{ padding: '6px 12px', fontSize: '13px' }}
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
