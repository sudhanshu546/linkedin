import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getMyPostings, getJobApplicants, updateApplicationStatus, deleteJob } from '../../../api/jobApi';
import { getUserById } from '../../../api/userApi';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faBriefcase, 
  faCheck, 
  faTimes, 
  faChevronRight, 
  faUserCircle, 
  faTrashAlt, 
  faEdit, 
  faCommentAlt, 
  faCalendarPlus,
  faExternalLinkAlt,
  faFilter
} from '@fortawesome/free-solid-svg-icons';
import '../../../App.css';
import { useNavigate } from 'react-router-dom';
import { Job, JobApplication, User } from '../../../types';
import { IMAGE_BASE_URL } from '../../../constants/api';
import { motion, AnimatePresence } from 'framer-motion';

const JobManagementPage: React.FC = () => {
  const [postings, setPostings] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Interview Scheduling State
  const [schedulingAppId, setSchedulingAppId] = useState<string | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewLink, setInterviewLink] = useState('');

  const navigate = useNavigate();

  const fetchPostings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyPostings();
      const data = res || [];
      setPostings(data);
      if (data.length > 0) {
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
      const apps = res?.data || res?.content || res || [];
      
      const appsWithUsers = await Promise.all((apps as JobApplication[]).map(async (app) => {
          try {
              const userId = app.applicantId || app.userId;
              const userRes = await getUserById(userId);
              return { ...app, user: userRes };
          } catch (e) {
              const id = app.applicantId || app.userId;
              return { ...app, user: { firstName: 'Applicant', lastName: id?.substring(0,8) || 'User' } as User };
          }
      }));
      setApplicants(appsWithUsers);
    } catch (err) {
      toast.error('Failed to load applicants.');
    } finally {
      setLoadingApplicants(false);
    }
  };

  const filteredApplicants = useMemo(() => {
    if (statusFilter === 'ALL') return applicants;
    return applicants.filter(app => app.status === statusFilter);
  }, [applicants, statusFilter]);

  const handleStatusUpdate = async (app: JobApplication, newStatus: string, date?: string, link?: string) => {
    if (!selectedJob) return;
    try {
      await updateApplicationStatus(selectedJob.id, app.applicantId || app.userId, newStatus, date, link);
      setApplicants(applicants.map(a => 
        (a.id === app.id || (a.applicantId === app.applicantId && a.jobId === app.jobId)) 
          ? { ...a, status: newStatus as any, interviewDate: date || a.interviewDate, interviewLink: link || a.interviewLink } 
          : a
      ));
      toast.success(`Application marked as ${newStatus.toLowerCase()}`);
      setSchedulingAppId(null);
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const handleMessageCandidate = (user?: User) => {
    if (!user) return;
    navigate('/messaging', { state: { userId: user.id, userName: `${user.firstName} ${user.lastName}` } });
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

  const renderStatusPill = (status: string) => {
    const statusMap: Record<string, string> = {
      'PENDING': 'pending',
      'APPLIED': 'applied',
      'REVIEWING': 'reviewing',
      'INTERVIEW': 'interview',
      'ACCEPTED': 'accepted',
      'REJECTED': 'rejected'
    };
    return <span className={`status-pill ${statusMap[status] || 'applied'}`}>{status}</span>;
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div className="page-layout management-grid" style={{ maxWidth: '1128px', margin: '0 auto' }}>
      <motion.aside 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="management-sidebar"
      >
        <div className="linkedin-card" style={{ overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>My Job Postings</h3>
          </div>
          <div className="posting-list-mini custom-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {postings.length === 0 ? (
                <p style={{ padding: '16px', fontSize: '14px', color: '#666' }}>No jobs posted yet.</p>
            ) : postings.map(job => (
              <div 
                key={job.id} 
                className={`posting-item-mini ${selectedJob?.id === job.id ? 'active' : ''}`}
                onClick={() => handleJobSelect(job)}
                style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer', 
                    borderBottom: '1px solid #eee',
                    backgroundColor: selectedJob?.id === job.id ? '#f3f2ef' : 'transparent',
                    borderLeft: selectedJob?.id === job.id ? '4px solid #0a66c2' : '4px solid transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                }}
              >
                <div className="posting-info" style={{ overflow: 'hidden' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</h4>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#666' }}>{job.company}</p>
                </div>
                <FontAwesomeIcon icon={faChevronRight} size="xs" style={{ color: '#666' }} />
              </div>
            ))}
          </div>
        </div>
      </motion.aside>

      <main className="management-main">
        <AnimatePresence mode="wait">
        {selectedJob ? (
          <motion.div 
            key={selectedJob.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="linkedin-card"
          >
            <div className="card-header applicants-header" style={{ padding: '24px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{selectedJob.title}</h3>
                  <p style={{ fontSize: '14px', color: '#666', margin: '4px 0 0' }}>{selectedJob.company} • {selectedJob.location}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => navigate('/jobs/post', { state: { editJob: selectedJob } })} style={{ background: 'none', border: 'none', color: '#0a66c2', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                        <FontAwesomeIcon icon={faEdit} /> Edit
                    </button>
                    <button onClick={() => handleDeleteJob(selectedJob.id)} style={{ background: 'none', border: 'none', color: '#d11124', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                        <FontAwesomeIcon icon={faTrashAlt} /> Delete
                    </button>
                </div>
              </div>

              <div className="filter-bar" style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#666', alignSelf: 'center', marginRight: '8px' }}>
                      <FontAwesomeIcon icon={faFilter} style={{ marginRight: '4px' }} /> Filter by:
                  </span>
                  {['ALL', 'APPLIED', 'REVIEWING', 'INTERVIEW', 'ACCEPTED', 'REJECTED'].map(s => (
                      <button 
                        key={s} 
                        className={`filter-pill ${statusFilter === s ? 'active' : ''}`}
                        onClick={() => setStatusFilter(s)}
                        style={{
                            padding: '4px 12px',
                            borderRadius: '16px',
                            border: '1px solid #666',
                            background: statusFilter === s ? '#057642' : 'white',
                            color: statusFilter === s ? 'white' : '#666',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                      >
                          {s.charAt(0) + s.slice(1).toLowerCase()}
                      </button>
                  ))}
              </div>
            </div>
            
            <div style={{ padding: '0' }}>
            {loadingApplicants ? (
                <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner"></div></div>
            ) : filteredApplicants.length === 0 ? (
                <div style={{ padding: '80px 24px', textAlign: 'center', color: '#666' }}>
                    <FontAwesomeIcon icon={faUsers} size="3x" style={{ opacity: 0.1, marginBottom: '24px' }} />
                    <h4 style={{ margin: 0 }}>No candidates found</h4>
                    <p style={{ margin: '8px 0 0' }}>Try changing your filter criteria.</p>
                </div>
            ) : (
                <div className="applicants-list">
                    <AnimatePresence>
                    {filteredApplicants.map((app, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={app.id} 
                            className="applicant-card-item"
                            style={{ padding: '20px 24px', borderBottom: '1px solid #eee' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    {app.user?.profileImageUrl ? (
                                        <img src={`${IMAGE_BASE_URL}${app.user.profileImageUrl}`} alt="" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <FontAwesomeIcon icon={faUserCircle} size="4x" style={{ color: '#adb3b8' }} />
                                    )}
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'rgba(0,0,0,0.9)' }}>{app.user?.firstName} {app.user?.lastName}</h4>
                                        <p style={{ margin: '2px 0', fontSize: '14px', color: '#666' }}>{app.user?.email}</p>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                                            {renderStatusPill(app.status)}
                                            {app.interviewDate && (
                                                <span style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: '#eef3f8', color: '#0a66c2', borderRadius: '4px', fontWeight: 600 }}>
                                                    <FontAwesomeIcon icon={faCalendarPlus} style={{ marginRight: '6px' }} />
                                                    {new Date(app.interviewDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        onClick={() => handleMessageCandidate(app.user)}
                                        style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #666', background: 'white', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Message"
                                    >
                                        <FontAwesomeIcon icon={faCommentAlt} />
                                    </button>
                                    
                                    {app.status === 'APPLIED' && (
                                        <>
                                            <button onClick={() => handleStatusUpdate(app, 'REJECTED')} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #d11124', background: 'white', color: '#d11124', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Reject">
                                                <FontAwesomeIcon icon={faTimes} />
                                            </button>
                                            <button onClick={() => handleStatusUpdate(app, 'REVIEWING')} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #057642', background: 'white', color: '#057642', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Approve">
                                                <FontAwesomeIcon icon={faCheck} />
                                            </button>
                                        </>
                                    )}

                                    {(app.status === 'REVIEWING' || app.status === 'APPLIED') && (
                                        <button 
                                            onClick={() => {
                                                setSchedulingAppId(app.id);
                                                setInterviewDate('');
                                                setInterviewLink('');
                                            }}
                                            style={{ padding: '0 16px', height: '36px', borderRadius: '18px', border: '1px solid #0a66c2', background: 'white', color: '#0a66c2', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
                                        >
                                            Schedule
                                        </button>
                                    )}

                                    {app.status === 'INTERVIEW' && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {app.interviewLink && (
                                                <a href={app.interviewLink} target="_blank" rel="noopener noreferrer" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #0a66c2', background: 'white', color: '#0a66c2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                                                </a>
                                            )}
                                            <button onClick={() => handleStatusUpdate(app, 'ACCEPTED')} style={{ padding: '0 16px', height: '36px', borderRadius: '18px', border: 'none', background: '#0a66c2', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Hire</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {schedulingAppId === app.id && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #eee' }}
                                >
                                    <h5 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600 }}>Schedule Interview</h5>
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Date & Time</label>
                                            <input 
                                                type="datetime-local" 
                                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                                value={interviewDate}
                                                onChange={(e) => setInterviewDate(e.target.value)}
                                            />
                                        </div>
                                        <div style={{ flex: 2 }}>
                                            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Meeting Link</label>
                                            <input 
                                                type="text" 
                                                placeholder="https://zoom.us/j/..."
                                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                                value={interviewLink}
                                                onChange={(e) => setInterviewLink(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setSchedulingAppId(null)} style={{ background: 'none', border: 'none', color: '#666', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                        <button 
                                            onClick={() => handleStatusUpdate(app, 'INTERVIEW', interviewDate, interviewLink)}
                                            disabled={!interviewDate}
                                            style={{ padding: '6px 16px', borderRadius: '16px', border: 'none', background: '#0a66c2', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: interviewDate ? 1 : 0.5 }}
                                        >
                                            Send Invite
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </div>
            )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="linkedin-card empty-state" 
            style={{ padding: '80px 24px', textAlign: 'center' }}
          >
            <FontAwesomeIcon icon={faBriefcase} size="4x" style={{ opacity: 0.1, marginBottom: '24px' }} />
            <h3>Select a job posting to view candidates</h3>
            <p style={{ color: '#666', marginTop: '8px' }}>Choose a posting from the left to manage your applicants.</p>
          </motion.div>
        )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default JobManagementPage;
