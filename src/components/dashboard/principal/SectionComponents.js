import React, { memo, useState, useMemo } from 'react';
import { useDialog } from '../../GlobalDialogProvider';

import { Calendar, Download, Bell, FileText, Search, UserMinus, Briefcase, Clock, Mail, Phone, MapPin, Building, UserCheck, AlertTriangle, X, Trash2, Send, ShieldCheck, RefreshCw, Edit2, Edit3, Eye, EyeOff } from 'lucide-react';
import { SimpleModal } from './Shared';
import styles from '../../../pages/PrincipalDashboard.module.css';
import Skeleton from '../../ui/Skeleton';

export const FacultyDirectorySection = memo(({ facultyMembers = [], onRemove, loading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('All Departments');
    const [viewProfile, setViewProfile] = useState(null);

    const filteredFaculty = useMemo(() => {
        return facultyMembers.filter(f => {
            const matchesSearch = (f.fullName || f.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (f.id || f.EmployeeID || '').toString().includes(searchTerm);
            const matchesDept = selectedDept === 'All Departments' ||
                (f.department || f.dept || f.Department) === selectedDept;
            return matchesSearch && matchesDept;
        });
    }, [facultyMembers, searchTerm, selectedDept]);

    const departments = useMemo(() => ['All Departments', ...new Set(facultyMembers.map(f => f.department || f.dept || f.Department).filter(Boolean))], [facultyMembers]);

    return (
        <div className={styles.sectionVisible}>
            {/* --- FACULTY BANNER --- */}
            <div style={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                borderRadius: '24px',
                padding: '2rem',
                color: 'white',
                marginBottom: '2rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.5)'
            }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
                            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', backdropFilter: 'blur(4px)' }}>
                                <Briefcase size={24} color="white" />
                            </div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.9 }}>Academic Staff</span>
                        </div>
                        <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800 }}>Staff Directory</h1>
                        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>Manage faculty profiles, workload, and performance.</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>Total Faculty</p>
                        <p style={{ margin: '0', fontSize: '1.8rem', fontWeight: '700' }}>{facultyMembers.length}</p>
                    </div>
                </div>
            </div>

            {/* --- TOOLBAR --- */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem',
                background: 'white', padding: '1rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0'
            }}>
                <div className={styles.searchWrapper}>
                    <input
                        placeholder="Search Faculty..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className={styles.searchIcon}>
                        <Search size={18} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <select
                        className={styles.filterSelect}
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                    >
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                    <button
                        className={styles.primaryBtn}
                        onClick={onRemove}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', background: '#ef4444' }}
                    >
                        <UserMinus size={18} /> Remove Faculty
                    </button>
                </div>
            </div>

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>Sl. No</th>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Designation</th>

                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <tr key={i}>
                                    <td><Skeleton width="30px" height="14px" /></td>
                                    <td><Skeleton width="80px" height="14px" /></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Skeleton width="36px" height="36px" variant="circle" />
                                            <div>
                                                <Skeleton width="100px" height="14px" style={{ marginBottom: '4px' }} />
                                                <Skeleton width="60px" height="10px" />
                                            </div>
                                        </div>
                                    </td>
                                    <td><Skeleton width="80px" height="24px" /></td>
                                    <td><Skeleton width="100px" height="24px" /></td>
                                    <td><Skeleton width="100px" height="32px" /></td>
                                </tr>
                            ))
                        ) : filteredFaculty.map((f, index) => (
                            <tr key={f.id} style={{ transition: 'background 0.2s', cursor: 'default' }}>
                                <td style={{ color: '#64748b', fontWeight: 500 }}>{index + 1}</td>
                                <td style={{ fontFamily: 'monospace', color: '#64748b' }}>{f.id || f.EmployeeID}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                            {(f.fullName || f.name || '?').charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{f.fullName || f.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{f.qualifications || f.Qualification}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span style={{ padding: '4px 8px', borderRadius: '6px', background: '#f1f5f9', fontWeight: 600, fontSize: '0.85rem' }}>{f.department || f.dept || f.Department}</span>
                                </td>
                                <td>
                                    <span style={{ padding: '4px 10px', borderRadius: '6px', background: '#f0fdf4', color: '#166534', fontWeight: 600, fontSize: '0.85rem' }}>
                                        {f.designation || f.Designation || f.role || 'Faculty'}
                                    </span>
                                </td>

                                <td>
                                    <button
                                        className={styles.secondaryBtn}
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                        onClick={() => setViewProfile(f)}
                                    >
                                        View Profile
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredFaculty.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                    No faculty found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- PROFILE MODAL --- */}
            <SimpleModal isOpen={!!viewProfile} onClose={() => setViewProfile(null)} title="Faculty Profile">
                {viewProfile && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Header - horizontal layout */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '50%', background: '#f8fafc',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                                fontWeight: 800, color: '#334155', border: '3px solid #e2e8f0', flexShrink: 0
                            }}>
                                {(viewProfile.fullName || viewProfile.name || '?').charAt(0)}
                            </div>
                            <div>
                                <h2 style={{ margin: '0 0 0.25rem 0', color: '#0f172a', fontSize: '1.2rem' }}>{viewProfile.fullName || viewProfile.name}</h2>
                                <p style={{ margin: 0, color: '#64748b', fontWeight: 500, fontSize: '0.85rem' }}>{viewProfile.designation || viewProfile.role || 'Faculty'} • {viewProfile.department || viewProfile.dept}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.25rem' }}>
                                    <Mail size={13} color="#64748b" />
                                    <span style={{ fontSize: '0.8rem', color: '#475569' }}>{viewProfile.email || 'Email not provided'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Info grid - 3 columns */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                            <div style={{ background: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: '8px', textAlign: 'left' }}>
                                <p style={{ margin: '0 0 0.2rem', fontSize: '0.7rem', color: '#94a3b8' }}>Employee ID</p>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{viewProfile.id || viewProfile.EmployeeID}</p>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: '8px', textAlign: 'left' }}>
                                <p style={{ margin: '0 0 0.2rem', fontSize: '0.7rem', color: '#94a3b8' }}>Username</p>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{viewProfile.username || '—'}</p>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: '8px', textAlign: 'left' }}>
                                <p style={{ margin: '0 0 0.2rem', fontSize: '0.7rem', color: '#94a3b8' }}>Home Dept</p>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{viewProfile.department || '—'}</p>
                            </div>
                        </div>

                        {/* Teaching Assignments */}
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.8rem' }}>
                            <h4 style={{ margin: '0 0 0.6rem', textAlign: 'left', fontSize: '0.95rem' }}>Teaching Assignments</h4>
                            {viewProfile.departmentAssignments && viewProfile.departmentAssignments.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {viewProfile.departmentAssignments.map((assignment, idx) => (
                                        <div key={idx} style={{ background: '#f8fafc', padding: '0.7rem 0.9rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                                <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.88rem' }}>
                                                    📚 {assignment.department}
                                                </span>
                                                {assignment.section && (
                                                    <span style={{ padding: '2px 7px', background: '#f0fdf4', color: '#166534', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>
                                                        {assignment.semester ? `Sem ${assignment.semester} / ` : ''}Sec {assignment.section}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                                {assignment.subjects ? (
                                                    assignment.subjects.split(',').map((sub, sIdx) => (
                                                        <span key={sIdx} style={{ padding: '2px 8px', background: '#dbeafe', color: '#1e40af', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                            {sub.trim()}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>No subjects</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : viewProfile.subjects && viewProfile.subjects.trim() ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {viewProfile.subjects.split(',').map((sub, idx) => (
                                        <span key={idx} style={{ padding: '3px 9px', background: '#dbeafe', color: '#1e40af', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 }}>
                                            {sub.trim()}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No subjects assigned</span>
                            )}
                        </div>
                    </div>
                )}
            </SimpleModal>
        </div>
    );
});

export const CIEScheduleSection = memo(({ schedules = [], onDownload, loading }) => {
    const [selectedDept, setSelectedDept] = useState(null);
    const departments = ['CSE', 'MECH', 'EEE', 'CV', 'MT'];

    const filteredSchedules = useMemo(() => {
        if (!selectedDept) return [];
        return schedules.filter(s => s.subject?.department === selectedDept);
    }, [schedules, selectedDept]);

    if (!selectedDept) {
        return (
            <div className={styles.sectionVisible}>
                <h2 className={styles.chartTitle} style={{ marginBottom: '1.5rem' }}>Select Department for CIE Schedule</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2rem' }}>
                    {departments.map(dept => (
                        <div
                            key={dept}
                            className={styles.glassCard}
                            onClick={() => setSelectedDept(dept)}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                padding: '3rem', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #e2e8f0',
                                minHeight: '220px'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <div style={{ padding: '1rem', borderRadius: '50%', background: '#e0f2fe', color: '#0369a1', marginBottom: '1rem' }}>
                                <Building size={32} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{dept}</h3>
                            <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>View Schedules</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.sectionVisible}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setSelectedDept(null)}
                    style={{
                        padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0',
                        background: 'white', color: '#475569', cursor: 'pointer', fontWeight: 500
                    }}
                >
                    &larr; Back
                </button>
                <h2 className={styles.chartTitle} style={{ margin: 0 }}>{selectedDept} - CIE Examination Schedules</h2>
            </div>




            {/* Empty State / Loading */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className={styles.glassCard} style={{ padding: '1.5rem', borderLeft: '4px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div>
                                    <Skeleton width="150px" height="18px" style={{ marginBottom: '6px' }} />
                                    <Skeleton width="100px" height="14px" />
                                </div>
                                <Skeleton width="60px" height="20px" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <Skeleton width="120px" height="14px" />
                                <Skeleton width="140px" height="14px" />
                                <Skeleton width="100px" height="14px" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredSchedules.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', background: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No exams scheduled for {selectedDept}.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {filteredSchedules.map(t => (
                        <div key={t.id} className={styles.glassCard} style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', position: 'relative', borderLeft: '4px solid #0ea5e9' }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                                        {t.subject ? t.subject.name : 'Unknown Subject'}
                                    </h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                                        {t.cieNumber} | {t.subject?.code}
                                    </p>
                                </div>
                                <span style={{
                                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                                    background: t.status === 'COMPLETED' ? '#dcfce7' : '#e0f2fe',
                                    color: t.status === 'COMPLETED' ? '#166534' : '#0369a1'
                                }}>
                                    {t.status || 'SCHEDULED'}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem', fontSize: '0.9rem', color: '#334155' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Calendar size={16} color="#64748b" />
                                    <span style={{ fontWeight: 500 }}>{t.scheduledDate || 'Date TBD'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={16} color="#64748b" />
                                    <span>{t.startTime || 'Time TBD'} ({t.durationMinutes || 60} min)</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MapPin size={16} color="#64748b" />
                                    <span>Room: {t.examRoom || 'TBD'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Building size={16} color="#64748b" />
                                    <span>{t.subject?.department} - Sem {t.subject?.semester}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                                <UserCheck size={14} />
                                <span>
                                    Scheduled by: <span style={{ fontWeight: 600, color: '#475569' }}>
                                        {t.faculty ? t.faculty.username : 'Unknown'}
                                    </span>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

export const NotificationsSection = memo(({
    notifications = [],
    recipientType = 'HOD',
    setRecipientType,
    targetDept = 'ALL',
    setTargetDept,
    messageText = '',
    setMessageText,
    onSend,
    onClear,
    onDelete,
    loading,
    departments = []
}) => {
    const [filterDept, setFilterDept] = useState("ALL");

    const displayedNotifs = useMemo(() => {
        if (filterDept === "ALL") return notifications;
        const selectedDeptObj = departments.find(d => (d.id || d) === filterDept);
        const deptId = selectedDeptObj?.id || filterDept;
        const deptName = selectedDeptObj?.name || filterDept;

        return notifications.filter(n => {
            if (!n.category) return false;
            const cat = n.category.toUpperCase();
            return cat.includes(deptId.toUpperCase()) || cat.includes(deptName.toUpperCase());
        });
    }, [notifications, filterDept, departments]);

    return (
    <div className={styles.sectionVisible}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className={styles.chartTitle}>Notifications</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Send Message Form */}
            <div className={styles.glassCard} style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>Send Message</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>Recipient Group</label>
                        <select
                            className={styles.filterSelect}
                            style={{ width: '100%' }}
                            value={recipientType}
                            onChange={(e) => setRecipientType && setRecipientType(e.target.value)}
                        >
                            <option value="HOD">All HODs</option>
                            <option value="FACULTY">All Faculty</option>
                            <option value="STUDENT">All Students</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>Target Department</label>
                        <select
                            className={styles.filterSelect}
                            style={{ width: '100%' }}
                            value={targetDept}
                            onChange={(e) => setTargetDept && setTargetDept(e.target.value)}
                        >
                            <option value="ALL">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept.id || (dept.name || dept)} value={dept.id || (dept.name || dept)}>
                                    {dept.name || dept.id || dept}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>Message</label>
                        <textarea
                            rows="5"
                            placeholder="Type your message here..."
                            value={messageText}
                            onChange={(e) => setMessageText && setMessageText(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                        />
                    </div>
                    <button
                        onClick={onSend}
                        disabled={!messageText.trim()}
                        style={{
                            alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.65rem 1.5rem', borderRadius: '0.5rem', border: 'none',
                            background: messageText.trim() ? '#2563eb' : '#94a3b8', color: 'white',
                            fontWeight: 600, fontSize: '0.9rem', cursor: messageText.trim() ? 'pointer' : 'not-allowed',
                            transition: 'background 0.2s'
                        }}
                    >
                        <Send size={16} /> Send Message
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className={styles.glassCard} style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>Inbox &amp; Sent</h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select 
                            value={filterDept} 
                            onChange={e => setFilterDept(e.target.value)}
                            style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }}
                        >
                            <option value="ALL">All Depts</option>
                            {departments.map(dept => (
                                <option key={dept.id || (dept.name || dept)} value={dept.id || (dept.name || dept)}>
                                    {dept.name || dept.id || dept}
                                </option>
                            ))}
                        </select>
                        {displayedNotifs.length > 0 && onClear && (
                            <button
                                onClick={onClear}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', padding: '0.4rem 0.8rem', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                            >
                                <Trash2 size={14} /> Clear {filterDept !== "ALL" ? filterDept : "All"}
                            </button>
                        )}
                    </div>
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} style={{ padding: '0.85rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem' }}>
                                <Skeleton width="34px" height="34px" style={{ borderRadius: '8px' }} />
                                <div style={{ flex: 1 }}>
                                    <Skeleton width="100%" height="14px" style={{ marginBottom: '6px' }} />
                                    <Skeleton width="120px" height="10px" />
                                </div>
                            </div>
                        ))
                    ) : displayedNotifs.length > 0 ? displayedNotifs.map(notif => (
                        <div key={notif.id} style={{
                            position: 'relative', display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                            padding: '0.85rem',
                            borderBottom: '1px solid #f1f5f9',
                            background: notif.type === 'SENT'
                                ? 'linear-gradient(90deg, #f0fdf4, #dcfce7)'
                                : notif.isRead ? 'transparent' : '#f0f9ff',
                            borderLeft: notif.type === 'SENT' ? '3px solid #16a34a' : 'none',
                            borderRadius: '6px', marginBottom: '4px'
                        }}>
                            <div style={{
                                padding: '0.5rem',
                                background: notif.type === 'SENT' ? '#dcfce7'
                                    : notif.type === 'WARNING' ? '#fef3c7' : '#e0f2fe',
                                borderRadius: '8px',
                                color: notif.type === 'SENT' ? '#16a34a'
                                    : notif.type === 'WARNING' ? '#d97706' : '#0369a1',
                                flexShrink: 0
                            }}>
                                {notif.type === 'SENT' ? <Send size={18} /> : notif.type === 'WARNING' ? <AlertTriangle size={18} /> : <Bell size={18} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                {notif.type === 'SENT' && (
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Sent</span>
                                )}
                                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: 500, color: '#1e293b' }}>{notif.message}</p>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(notif.createdAt).toLocaleString()}</span>
                                {notif.category && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: notif.type === 'SENT' ? '#bbf7d0' : '#f1f5f9', padding: '2px 8px', borderRadius: '4px', color: notif.type === 'SENT' ? '#15803d' : '#475569' }}>{notif.category}</span>}
                            </div>
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(notif.id)}
                                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                                    title="Delete"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    )) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                            <Bell size={48} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                            <p style={{ margin: 0, fontSize: '0.95rem' }}>No notifications yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
    );
});

export const ReportsSection = memo(({ reports = [], onDownload, departments = [], loading }) => {
    const [selectedDept, setSelectedDept] = useState(departments[0] || '');
    const [downloading, setDownloading] = useState(null);

    const reportTypes = [
        { id: 'students', name: 'Student List', icon: '🎓', description: 'Complete list of students with semester and section details', color: '#3b82f6' },
        { id: 'marks', name: 'CIE Marks', icon: '📝', description: 'All CIE marks with subject-wise breakdown', color: '#8b5cf6' },
        { id: 'attendance', name: 'Attendance Report', icon: '📊', description: 'Student attendance with present/absent count and percentage', color: '#10b981' },
        { id: 'faculty', name: 'Faculty List', icon: '👨‍🏫', description: 'Faculty details with designation, subjects, and sections', color: '#f59e0b' },
        { id: 'subjects', name: 'Subject List', icon: '📚', description: 'All subjects with code, semester, and assigned instructor', color: '#ef4444' }
    ];

    const handleDeptDownload = async (reportType) => {
        if (!selectedDept) return;
        setDownloading(reportType);
        try {
            await onDownload({ apiType: `${selectedDept}/${reportType}`, name: `${selectedDept}_${reportType}` });
        } catch (e) { console.error(e); }
        setDownloading(null);
    };

    const handleDownloadAll = async () => {
        if (!selectedDept) return;
        for (const rt of reportTypes) {
            await handleDeptDownload(rt.id);
        }
    };

    return (
        <div className={styles.sectionVisible} style={{ animation: 'fadeIn 0.6s ease' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                borderRadius: '16px', padding: '2rem 2.5rem', marginBottom: '1.5rem',
                color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px' }}>
                            <FileText size={24} color="white" />
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.9 }}>Reports Center</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>Department Reports</h1>
                    <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>Download department-wise data as CSV files.</p>
                </div>
            </div>

            {/* Department Selector + Download All */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem',
                background: 'white', padding: '1rem 1.5rem', borderRadius: '12px',
                border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>Select Department:</label>
                    <select
                        value={selectedDept}
                        onChange={e => setSelectedDept(e.target.value)}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '8px', border: '2px solid #e2e8f0',
                            fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', background: '#f8fafc',
                            cursor: 'pointer', outline: 'none', minWidth: '180px'
                        }}
                    >
                        {departments.map(d => (
                            <option key={d.id || d} value={d.id || d}>
                                {d.name || d}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={handleDownloadAll}
                    disabled={!selectedDept}
                    style={{
                        padding: '0.6rem 1.5rem', borderRadius: '10px', border: 'none',
                        background: selectedDept ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#cbd5e1',
                        color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: selectedDept ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: selectedDept ? '0 4px 12px rgba(37,99,235,0.3)' : 'none'
                    }}
                >
                    ⬇ Download All Reports
                </button>
            </div>

            {/* Report Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {loading ? (
                    [1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={styles.glassCard} style={{ padding: '1.5rem', borderTop: '3px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.8rem' }}>
                                <Skeleton width="32px" height="32px" variant="circle" />
                                <Skeleton width="120px" height="18px" />
                            </div>
                            <Skeleton width="100%" height="12px" style={{ marginBottom: '6px' }} />
                            <Skeleton width="80%" height="12px" style={{ marginBottom: '1.5rem' }} />
                            <Skeleton width="100%" height="36px" />
                        </div>
                    ))
                ) : reportTypes.map(rt => (
                    <div key={rt.id} style={{
                        background: 'white', borderRadius: '14px', padding: '1.5rem',
                        border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
                        borderTop: `3px solid ${rt.color}`
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.8rem' }}>
                            <span style={{ fontSize: '1.8rem' }}>{rt.icon}</span>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>{rt.name}</h3>
                        </div>
                        <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>{rt.description}</p>
                        <button
                            onClick={() => handleDeptDownload(rt.id)}
                            disabled={!selectedDept || downloading === rt.id}
                            style={{
                                width: '100%', padding: '0.5rem', borderRadius: '8px', border: 'none',
                                background: downloading === rt.id ? '#94a3b8' : rt.color,
                                color: 'white', fontWeight: 600, fontSize: '0.85rem',
                                cursor: selectedDept ? 'pointer' : 'not-allowed',
                                opacity: !selectedDept ? 0.5 : 1
                            }}
                        >
                            {downloading === rt.id ? 'Downloading...' : `Download ${selectedDept || '...'} CSV`}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
});

export const ManageHODsSection = memo(({ hods = [], onCreate, user, departments = [], onRefresh, onUpdate, onDelete, loading }) => {
    const { showConfirm } = useDialog();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [department, setDepartment] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [editingHod, setEditingHod] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState('');

    // Fixed 5 departments + ability to add more
    const FIXED_DEPTS = [
        { id: 'CSE', name: 'Computer Science & Engineering' },
        { id: 'EEE', name: 'Electrical Electronics & Engineering' },
        { id: 'MECH', name: 'Mechanical Engineering' },
        { id: 'CIVIL', name: 'Civil Engineering' },
        { id: 'MT', name: 'Metallurgy' },
    ];
    const [customDepts, setCustomDepts] = useState([]);
    const [showAddDeptInput, setShowAddDeptInput] = useState(false);
    const [newDeptId, setNewDeptId] = useState('');
    const [newDeptName, setNewDeptName] = useState('');

    const allDepts = [...FIXED_DEPTS, ...customDepts];

    const handleAddDept = () => {
        const id = newDeptId.trim().toUpperCase();
        const nm = newDeptName.trim();
        if (!id || !nm) { setFormError('Please enter both department code and name.'); setTimeout(() => setFormError(''), 3000); return; }
        if (allDepts.some(d => d.id === id)) { setFormError('Department code already exists.'); setTimeout(() => setFormError(''), 3000); return; }
        setCustomDepts(prev => [...prev, { id, name: nm }]);
        setNewDeptId('');
        setNewDeptName('');
        setShowAddDeptInput(false);
        setDepartment(id);
    };

    const handleRefresh = async () => {
        if (!onRefresh) return;
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
    };

    const handleEdit = (hod) => {
        setEditingHod(hod);
        setName(hod.fullName);
        setUsername(hod.username);
        setEmail(hod.email || '');
        setDepartment(hod.department);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingHod(null);
        setName('');
        setUsername('');
        setEmail('');
        setPassword('');
        setDepartment('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || (!editingHod && !username) || !department) {
            setFormError('Name and Department are required.'); setTimeout(() => setFormError(''), 3000);
            return;
        }
        if (!editingHod && !password) {
            setFormError('Password is required.'); setTimeout(() => setFormError(''), 3000);
            return;
        }

        if (editingHod) {
            await onUpdate(editingHod.id, { fullName: name, username, email, password, department });
            setEditingHod(null);
        } else {
            await onCreate({ fullName: name, username, email, password, department });
        }

        // Reset form
        setName('');
        setUsername('');
        setEmail('');
        setPassword('');
        setDepartment('');
    };

    return (
        <div className={styles.sectionVisible}>
            {/* --- HOD BANNER --- */}
            <div className={styles.hodBanner}>
                <div className={styles.hodBannerDecorator}></div>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                            <div style={{ padding: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', backdropFilter: 'blur(4px)' }}>
                                <ShieldCheck size={20} color="white" />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.9 }}>Administrative Control</span>
                        </div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Department Leadership</h1>
                        <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.9rem', opacity: 0.9, maxWidth: '600px' }}>
                            Manage and register Head of Departments. Assigned HODs will have full administrative access to their respective department rosters and CIE management.
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className={styles.secondaryBtn}
                        style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        {isRefreshing ? 'Fetching...' : 'Refresh List'}
                    </button>
                </div>
            </div>

            <div className={styles.glassCard} style={{ padding: '2.5rem', marginBottom: '2.5rem', borderRadius: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '4px', height: '24px', background: editingHod ? '#f59e0b' : '#8b5cf6', borderRadius: '2px' }}></div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                            {editingHod ? 'Update HOD Details' : 'HOD Registration'}
                        </h3>
                    </div>
                    {editingHod && (
                        <button
                            onClick={handleCancelEdit}
                            className={styles.secondaryBtn}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.6rem', color: '#475569', fontSize: '0.9rem' }}>Full Name *</label>
                            <input
                                className={styles.inputField}
                                placeholder="e.g. Dr. John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.6rem', color: '#475569', fontSize: '0.9rem' }}>Employee ID (Username) *</label>
                            <input
                                className={styles.inputField}
                                placeholder="e.g. HODCS01"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.6rem', color: '#475569', fontSize: '0.9rem' }}>Institutional Email</label>
                            <input
                                className={styles.inputField}
                                type="email"
                                placeholder="e.g. john.doe@sgp.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.6rem', color: '#475569', fontSize: '0.9rem' }}>{editingHod ? 'Reset Password (Leave blank to keep current)' : 'Password *'}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className={styles.inputField}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={editingHod ? "New password (optional)" : "Set a strong password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required={!editingHod}
                                    style={{ paddingRight: '2.5rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    style={{
                                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px'
                                    }}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.6rem', color: '#475569', fontSize: '0.9rem' }}>Assigned Department *</label>
                            <select
                                className={styles.filterSelect}
                                style={{ width: '100%' }}
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                required
                            >
                                <option value="">Select Department</option>
                                {allDepts.map(d => (
                                    <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                                ))}
                            </select>
                            {/* + Add New Department */}
                            {!showAddDeptInput ? (
                                <button
                                    type="button"
                                    onClick={() => setShowAddDeptInput(true)}
                                    style={{ marginTop: '0.6rem', background: 'none', border: 'none', color: '#2563eb', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                                >
                                    + Add New Department
                                </button>
                            ) : (
                                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <input
                                        placeholder="Code (e.g. EEE)"
                                        value={newDeptId}
                                        onChange={e => setNewDeptId(e.target.value)}
                                        style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '110px' }}
                                        maxLength={8}
                                    />
                                    <input
                                        placeholder="Full name (e.g. Electrical Engg.)"
                                        value={newDeptName}
                                        onChange={e => setNewDeptName(e.target.value)}
                                        style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', flex: 1, minWidth: '160px' }}
                                    />
                                    <button type="button" onClick={handleAddDept} style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', background: '#2563eb', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Add</button>
                                    <button type="button" onClick={() => { setShowAddDeptInput(false); setNewDeptId(''); setNewDeptName(''); }} style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {formError && (
                        <div style={{
                            marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '10px',
                            background: '#fee2e2', color: '#991b1b', fontWeight: 600, fontSize: '0.88rem',
                            display: 'flex', alignItems: 'center', gap: '8px', animation: 'dialogIn 0.25s ease-out'
                        }}>
                            <AlertTriangle size={16} /> {formError}
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem', background: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                            <AlertTriangle size={16} />
                            <span>{editingHod ? 'Username & password cannot be changed here.' : 'HOD will log in with the password you set above.'}</span>
                        </div>
                        <button type="submit" className={editingHod ? styles.primaryBtn : styles.submitBtn} style={editingHod ? { background: '#f59e0b' } : {}}>
                            {editingHod ? <><RefreshCw size={20} /> Update Information</> : <><UserCheck size={20} /> Register & Grant Access</>}
                        </button>
                    </div>
                </form>
            </div>

            <div className={styles.tableCard} style={{ borderRadius: '24px', padding: '0' }}>
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Institutional HOD Directory</h3>
                    <span style={{ padding: '4px 12px', background: '#f1f5f9', color: '#64748b', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {hods.length} Active HODs
                    </span>
                </div>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ paddingLeft: '2rem' }}>Sl. No</th>
                            <th>Employee ID</th>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Email</th>
                            <th style={{ paddingRight: '2rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <tr key={i}>
                                    <td style={{ paddingLeft: '2rem' }}><Skeleton width="20px" height="14px" /></td>
                                    <td><Skeleton width="80px" height="14px" /></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Skeleton width="32px" height="32px" variant="circle" />
                                            <Skeleton width="100px" height="14px" />
                                        </div>
                                    </td>
                                    <td><Skeleton width="60px" height="24px" /></td>
                                    <td><Skeleton width="150px" height="14px" /></td>
                                    <td style={{ paddingRight: '2rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <Skeleton width="28px" height="28px" />
                                            <Skeleton width="28px" height="28px" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : hods.map((h, index) => (
                            <tr key={h.id}>
                                <td style={{ paddingLeft: '2rem', color: '#64748b', fontWeight: 500 }}>{index + 1}</td>
                                <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{h.username}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                            {h.fullName.charAt(0)}
                                        </div>
                                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{h.fullName}</span>
                                    </div>
                                </td>
                                <td>
                                    <span style={{ padding: '4px 10px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', fontWeight: 700, fontSize: '0.8rem' }}>
                                        {h.department}
                                    </span>
                                </td>
                                <td style={{ color: '#64748b' }}>{h.email || <span style={{ opacity: 0.5 }}>—</span>}</td>
                                <td style={{ paddingRight: '2rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => handleEdit(h)}
                                            style={{ padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}
                                            title="Edit HOD"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={async () => { const confirmed = await showConfirm({ title: 'Remove HOD', message: `Are you sure you want to remove ${h.fullName}?`, variant: 'danger', confirmText: 'Remove' }); if (confirmed) onDelete(h.id); }}
                                            style={{ padding: '6px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s' }}
                                            title="Delete HOD"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {hods.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                                    <ShieldCheck size={48} style={{ marginBottom: '1rem', opacity: 0.1 }} />
                                    <p style={{ margin: 0, fontSize: '1rem' }}>No HODs have been registered yet.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
});
