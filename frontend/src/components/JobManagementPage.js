import React, { useState, useEffect } from 'react';
import { getMyPostings, getJobApplicants, updateApplicationStatus, getUserByInternalId } from '../api/userApi';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faBriefcase, faCheck, faTimes, faChevronRight, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import '../App.css';

const JobManagementPage = () => {
  const [postings, setPostings] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  useEffect(() => {
    fetchPostings();
  }, []);

  const fetchPostings = async () => {
    setLoading(true);
    try {
      const data = await getMyPostings();
      setPostings(data);
      if (data.length > 0) handleJobSelect(data[0]);
    } catch (err) {
      toast.error('Failed to load your job postings.');
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelect = async (job) => {
    setSelectedJob(job);
    setLoadingApplicants(true);
    try {
      const apps = await getJobApplicants(job.id);
      const appsWithUsers = await Promise.all(apps.map(async (app) => {
          try {
              const userRes = await getUserByInternalId(app.applicantId);
              return { ...app, applicant: userRes.result };
          } catch (e) {
              return { ...app, applicant: { firstName: 'Applicant', lastName: app.applicantId.substring(0,8) } };
          }
      }));
      setApplicants(appsWithUsers);
    } catch (err) {
      toast.error('Failed to load applicants.');
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      await updateApplicationStatus(applicationId, newStatus);
      setApplicants(applicants.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
      toast.success(`Application marked as ${newStatus.toLowerCase()}`);
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="page-layout management-grid">
      <aside className="management-sidebar">
        <div className="linkedin-card">
          <div className="card-header">
            <h3>My Job Postings</h3>
          </div>
          <div className="posting-list-mini">
            {postings.length === 0 ? (
                <p style={{ padding: '16px', fontSize: '14px', color: '#666' }}>No jobs posted yet.</p>
            ) : postings.map(job => (
              <div 
                key={job.id} 
                className={`posting-item-mini ${selectedJob?.id === job.id ? 'active' : ''}`}
                onClick={() => handleJobSelect(job)}
              >
                <div className="posting-info">
                    <h4>{job.title}</h4>
                    <p>{job.company}</p>
                </div>
                <FontAwesomeIcon icon={faChevronRight} size="xs" />
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="management-main">
        {selectedJob ? (
          <div className="linkedin-card">
            <div className="card-header applicants-header">
              <div>
                <h3>Applicants for {selectedJob.title}</h3>
                <p style={{ fontSize: '14px', color: '#666', margin: '4px 0 0' }}>{applicants.length} total candidates</p>
              </div>
            </div>
            
            {loadingApplicants ? (
                <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner"></div></div>
            ) : applicants.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
                    <FontAwesomeIcon icon={faUsers} size="3x" style={{ opacity: 0.2, marginBottom: '16px' }} />
                    <p>No applications received for this position yet.</p>
                </div>
            ) : (
                <div className="applicants-list-refined">
                    {applicants.map(app => (
                        <div key={app.id} className="applicant-card-item">
                            <div className="applicant-main-info">
                                <FontAwesomeIcon icon={faUserCircle} size="3x" style={{ color: '#adb3b8' }} />
                                <div className="applicant-details">
                                    <h4>{app.applicant?.firstName} {app.applicant?.lastName}</h4>
                                    <p>{app.applicant?.email}</p>
                                    <span className={`status-pill ${app.status?.toLowerCase()}`}>
                                        {app.status}
                                    </span>
                                </div>
                            </div>
                            <div className="applicant-actions">
                                {app.status === 'PENDING' && (
                                    <>
                                        <button 
                                            onClick={() => handleStatusUpdate(app.id, 'REJECTED')}
                                            className="btn-reject" title="Reject"
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                        <button 
                                            onClick={() => handleStatusUpdate(app.id, 'REVIEWED')}
                                            className="btn-approve" title="Mark as Reviewed"
                                        >
                                            <FontAwesomeIcon icon={faCheck} />
                                        </button>
                                    </>
                                )}
                                {app.status === 'REVIEWED' && (
                                     <button 
                                        onClick={() => handleStatusUpdate(app.id, 'HIRED')}
                                        className="btn-hired"
                                    >
                                        Hire Candidate
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        ) : (
          <div className="linkedin-card empty-state" style={{ padding: '64px', textAlign: 'center' }}>
            <FontAwesomeIcon icon={faBriefcase} size="4x" style={{ opacity: 0.1, marginBottom: '24px' }} />
            <h3>Select a job posting to view candidates</h3>
          </div>
        )}
      </main>
    </div>
  );
};

export default JobManagementPage;
