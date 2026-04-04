import React, { useEffect, useState } from 'react';
import { getTrendingHashtags } from '../../api/searchApi';
import { Link } from 'react-router-dom';

const TrendingHashtags: React.FC = () => {
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrendingHashtags().then(res => {
      setHashtags(res);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading trending...</div>;
  if (hashtags.length === 0) return null;

  return (
    <div className="linkedin-card" style={{ padding: '16px' }}>
      <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>Trending Hashtags</h4>
      <div className="hashtags-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {hashtags.map(tag => (
          <Link 
            key={tag} 
            to={`/search?q=${encodeURIComponent('#' + tag)}`}
            style={{ textDecoration: 'none', color: '#0a66c2', fontSize: '14px', fontWeight: 600 }}
          >
            #{tag}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TrendingHashtags;
