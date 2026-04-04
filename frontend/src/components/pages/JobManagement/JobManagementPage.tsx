import React, { useState, useEffect, useCallback } from 'react';
import { getMyPostings, getJobApplicants, updateApplicationStatus, deleteJob } from '../../../api/jobApi';
import { getUserById } from '../../../api/userApi';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faBriefcase, faCheck, faTimes, faChevronRight, faUserCircle, faTrashAlt, faEdit } from '@fortawesome/free-solid-svg-icons';
import '../../../App.css';
import { useNavigate } from 'react-router-dom';
import { Job, JobApplication, User } from '../../../types';

const JobManagementPage: React.FC = () => {
  const [postings, setPostings] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<(JobApplication & { applicant?: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const navigate = useNavigate();

  const fetchPostings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyPostings();
      const data = res || [];
      setPostings(data);
      if (data.length > 0) {
          // Use the latest selectedJob value from state if needed, 
          // but for initial load we just select the first one if none selected
          setSelectedJob(prev => {
              if (!prev) {
                  handleJobSelect(data[0]);
                  return data[0];
              }
              const updated = data.find(j => j.id === prev.id);
              if (updated) return updated;
              handleJobSelect(data[0]);
              return data[0];
          });
      } else {
          setSelectedJob(null);
      }
    } catch (err) {
      toast.error('Failed to load your job postings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPostings();
  }, [fetchPostings]);

  const handleJobSelect = async (job: Job) => {
    setSelectedJob(job);
    setLoadingApplicants(true);
    try {
      const res = await getJobApplicants(job.id);
      const apps = res?.content || res || [];
      const appsWithUsers = await Promise.all((apps as JobApplication[]).map(async (app) => {
          try {
              const userRes = await getUserById(app.applicantId || app.userId);
              return { ...app, applicant: userRes };
          } catch (e) {
              const id = app.applicantId || app.userId;
              return { ...app, applicant: { firstName: 'Applicant', lastName: id.substring(0,8) } as User };
          }
      }));
      setApplicants(appsWithUsers);
    } catch (err) {
      toast.error('Failed to load applicants.');
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleStatusUpdate = async (app: JobApplication, newStatus: string) => {
    if (!selectedJob) return;
    try {
      await updateApplicationStatus(selectedJob.id, app.applicantId || app.userId, newStatus);
      setApplicants(applicants.map(a => 
        a.id === app.id ? { ...a, status: newStatus as any } : a
      ));
      toast.success(`Application marked as ${newStatus.toLowerCase()}`);
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
      if (!window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) return;
      
      try {
          await deleteJob(jobId);
          toast.success('Job posting deleted successfully.');
          setSelectedJob(null);
          fetchPostings();
      } catch (err) {
          toast.error('Failed to delete job posting.');
      }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="page-layout management-grid">
      <aside className="management-sidebar">
        <div className="linkedin-card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>My Job Postings</h3>
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
            <div className="card-header applicants-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '20px' }}>{selectedJob.title}</h3>
                <p style={{ fontSize: '14px', color: '#666', margin: '4px 0 0' }}>{selectedJob.company} • {selectedJob.location}</p>
                <p style={{ fontSize: '14px', color: '#0a66c2', fontWeight: 600, margin: '8px 0 0' }}>{applicants.length} total candidates</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => navigate('/jobs/post', { state: { editJob: selectedJob } })}
                    className="btn-edit-job"
                    style={{ background: 'none', border: 'none', color: 'var(--linkedin-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600 }}
                  >
                      <FontAwesomeIcon icon={faEdit} />
                      Edit Job
                  </button>
                  <button 
                    onClick={() => handleDeleteJob(selectedJob.id)}
                    className="btn-delete-job"
                    style={{ background: 'none', border: 'none', color: '#d11124', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600 }}
                  >
                      <FontAwesomeIcon icon={faTrashAlt} />
                      Delete Job
                  </button>
              </div>
            </div>
            
            <div className="job-meta-details" style={{ padding: '0 16px 16px', borderBottom: '1px solid #eee' }}>
                <span className="meta-tag">{selectedJob.jobType?.replace('_', ' ')}</span>
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
                                {app.status === 'APPLIED' && (
                                    <>
                                        <button 
                                            onClick={() => handleStatusUpdate(app, 'REJECTED')}
                                            className="btn-reject" title="Reject"
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                        <button 
                                            onClick={() => handleStatusUpdate(app, 'REVIEWING')}
                                            className="btn-approve" title="Mark as Reviewing"
                                        >
                                            <FontAwesomeIcon icon={faCheck} />
                                        </button>
                                    </>
                                )}
                                {app.status === 'REVIEWING' && (
                                     <button 
                                        onClick={() => handleStatusUpdate(app, 'ACCEPTED')}
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
