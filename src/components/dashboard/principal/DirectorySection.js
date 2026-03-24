import React, { useState, useMemo, memo } from 'react';
import { X, Search, Filter, Download, AlertTriangle, CheckCircle, Clock, ArrowLeft, Award, ClipboardList } from 'lucide-react';
import styles from '../../../pages/PrincipalDashboard.module.css';
import { useAuth } from '../../../context/AuthContext';
import authenticatedFetch from '../../../utils/authFetch';
import API_BASE_URL from '../../../config/api';
import Skeleton from '../../ui/Skeleton';

export const StudentProfileModal = ({ selectedStudentProfile, setSelectedStudentProfile, selectedDept }) => {
    const [localToast, setLocalToast] = React.useState('');
    const showLocalToast = (msg) => { setLocalToast(msg); setTimeout(() => setLocalToast(''), 2500); };
    if (!selectedStudentProfile) return null;
    const s = selectedStudentProfile;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000, backdropFilter: 'blur(4px)'
        }} onClick={() => setSelectedStudentProfile(null)}>
            <div style={{
                background: 'white', borderRadius: '16px', width: '90%', maxWidth: '600px',
                padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => setSelectedStudentProfile(null)}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <X size={24} color="#64748b" />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '80px', height: '80px', background: '#e0f2fe', color: '#0369a1',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', fontWeight: 'bold', margin: '0 auto 1rem'
                    }}>
                        {s.name.charAt(0)}
                    </div>
                    <h2 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>{s.name}</h2>
                    <p style={{ margin: 0, color: '#64748b' }}>{s.regNo || s.rollNo} | {selectedDept?.name} | {s.semester || s.sem} Sem</p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <div className={styles.glassCard} style={{ padding: '1rem', overflowX: 'auto' }}>
                        <h4 style={{ margin: '0 0 0.5rem', color: '#64748b', fontSize: '0.9rem' }}>Subject-Wise Performance (Out of 50 each)</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Subject</th>
                                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>CIE-1</th>
                                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>CIE-2</th>
                                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>CIE-3</th>
                                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>CIE-4</th>
                                    <th style={{ textAlign: 'center', padding: '0.5rem' }}>CIE-5</th>
                                </tr>
                            </thead>
                            <tbody>
                                {s.subjectMarks && Object.entries(s.subjectMarks).map(([subj, marks]) => (
                                    <tr key={subj} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '0.5rem', color: '#0f172a', fontWeight: 500 }}>{subj}</td>
                                        <td style={{ textAlign: 'center', padding: '0.5rem' }}>{marks.cie1 !== undefined ? marks.cie1 : '-'}</td>
                                        <td style={{ textAlign: 'center', padding: '0.5rem' }}>{marks.cie2 !== undefined ? marks.cie2 : '-'}</td>
                                        <td style={{ textAlign: 'center', padding: '0.5rem' }}>{marks.cie3 !== undefined ? marks.cie3 : '-'}</td>
                                        <td style={{ textAlign: 'center', padding: '0.5rem' }}>{marks.cie4 !== undefined ? marks.cie4 : '-'}</td>
                                        <td style={{ textAlign: 'center', padding: '0.5rem' }}>{marks.cie5 !== undefined ? marks.cie5 : '-'}</td>
                                    </tr>
                                ))}
                                {(!s.subjectMarks || Object.keys(s.subjectMarks).length === 0) && (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>No marks entered yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className={styles.glassCard} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h4 style={{ margin: '0', color: '#64748b', fontSize: '0.9rem' }}>Overall Performance</h4>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: s.isCie1Complete ? '#10b981' : '#cbd5e1' }}>
                                {s.isCie1Complete && s.overallCie1Percentage !== null ? `${s.overallCie1Percentage.toFixed(1)}%` : 'Incomplete'}
                            </div>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: s.isCie1Complete ? '#059669' : '#f59e0b', fontWeight: 500 }}>
                                {s.isCie1Complete ? 'Completed all CIE-1 exams' : 'Missing CIE-1 marks for some subjects'}
                            </p>
                        </div>
                    </div>

                    <div className={styles.glassCard} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h4 style={{ margin: '0', color: '#64748b', fontSize: '0.9rem' }}>Behavior & Contact</h4>
                        <div>
                            <span style={{ padding: '4px 8px', background: '#f0f9ff', color: '#0284c7', borderRadius: '4px', fontSize: '0.8rem' }}>Good Conduct</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                            <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Mentor</span>
                            <span style={{ color: '#0f172a', fontWeight: 500 }}>{s.mentor || 'Not Assigned'}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem' }}>
                            <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Parent Number</span>
                            <span style={{ color: '#0f172a', fontWeight: 500 }}>{s.parentPhone || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className={styles.primaryBtn} onClick={() => showLocalToast('Report Generated')}>Download Report Card</button>
                    <button className={styles.secondaryBtn} onClick={() => showLocalToast('Contacting Parents...')}>Contact Parent</button>
                </div>
            </div>
            {localToast && <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 10001, padding: '0.85rem 1.5rem', borderRadius: '12px', background: '#dcfce7', color: '#166534', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontWeight: 600, fontSize: '0.9rem', maxWidth: '400px' }}>{localToast}</div>}
        </div>
    );
};

export const DirectorySection = memo(({ departments = [], selectedDept, deptStudents, handleDeptClick, setSelectedDept, setSelectedStudentProfile: propSetSelectedStudentProfile, loading: parentLoading }) => {
    const { user } = useAuth();
    const [semester, setSemester] = useState('2nd');
    const [section, setSection] = useState('A');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAtRisk, setShowAtRisk] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [bulkToast, setBulkToast] = useState('');
    const showBulkToast = (msg) => { setBulkToast(msg); setTimeout(() => setBulkToast(''), 2500); };
    const itemsPerPage = 10000; // Show all students

    const [internalSelectedStudent, setInternalSelectedStudent] = useState(null);

    // State for students fetched from API
    const [apiStudents, setApiStudents] = useState([]);
    const [localLoading, setLocalLoading] = useState(false);
    const effectiveLoading = parentLoading || localLoading;

    // Derived State: Filtered Students
    const filteredStudents = useMemo(() => {
        setCurrentPage(1);

        // Use API data
        let baseList = apiStudents;

        return baseList.filter(s => {
            const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (s.regNo || '').includes(searchQuery);
            // Optional: Filter by sem/sec if selected (omitted for strictly search-based for now or add back if needed)
            const matchesSem = semester === 'All' || (s.semester || s.sem) == semester.replace(/\D/g, ''); // Extract number
            const matchesSec = section === 'All' || s.section === section;

            // Risk calculation: student is at risk if total CIE marks < 40%
            const totalAcquired = Object.values(s.subjectMarks || {}).reduce((sum, marks) => sum + (marks.cie1 || 0) + (marks.cie2 || 0) + (marks.cie3 || 0) + (marks.cie4 || 0) + (marks.cie5 || 0), 0);
            const totalPossible = Object.values(s.subjectMarks || {}).reduce((count, marks) => count + (marks.cie1 !== undefined ? 1 : 0) + (marks.cie2 !== undefined ? 1 : 0) + (marks.cie3 !== undefined ? 1 : 0) + (marks.cie4 !== undefined ? 1 : 0) + (marks.cie5 !== undefined ? 1 : 0), 0) * 50;
            const percentage = totalPossible > 0 ? (totalAcquired / totalPossible) * 100 : 0;
            const isAtRisk = totalPossible > 0 && percentage < 40;

            // If filter is active, only show at-risk students; otherwise show all
            const matchesRisk = showAtRisk ? isAtRisk : true;

            return matchesSearch && matchesSem && matchesSec && matchesRisk;
        });
    }, [apiStudents, searchQuery, showAtRisk, semester, section]);

    // Pagination Logic
    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredStudents.slice(start, start + itemsPerPage);
    }, [currentPage, filteredStudents]);

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    // HOD Dashboard Replicated State
    const [selectedMarksSubject, setSelectedMarksSubject] = useState('ALL');
    const [selectedCieType, setSelectedCieType] = useState('all');
    const [perfTab, setPerfTab] = useState('low');
    const [perfSubjectFilter, setPerfSubjectFilter] = useState('All');
    const [perfCieFilter, setPerfCieFilter] = useState('All');

    // Download Modal State
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [dlDataType, setDlDataType] = useState('list');
    const [dlSections, setDlSections] = useState(['All']);
    const [dlCies, setDlCies] = useState(['All']);
    const [dlSubject, setDlSubject] = useState('All');
    const [dlPerfCategory, setDlPerfCategory] = useState('all');

    const derivedSubjects = useMemo(() => {
        const subjs = new Set();
        const semNum = semester.toLowerCase() === 'all' ? 'all' : semester.replace(/\D/g, '');
        (apiStudents || []).forEach(s => {
            const stuSem = s.semester || s.sem;
            if ((semNum === 'all' || stuSem == semNum) && s.subjectMarks) {
                Object.keys(s.subjectMarks).forEach(k => subjs.add(k));
            }
        });
        return Array.from(subjs).filter(n => n !== 'IC').map(name => ({ id: name, name, cleanName: name.replace(/\[.*?\]/g, '').trim() }));
    }, [apiStudents, semester]);

    const perfConfig = { excellent_threshold: 40, average_threshold_min: 20 };
    
    const processedPerfData = useMemo(() => {
        let excellent = [], average = [], low = [], passed = [];
        paginatedStudents.forEach(student => {
            const m = student.subjectMarks || {};
            let totalA = 0, totalP = 0;
            
            Object.entries(m).forEach(([subjName, sm]) => {
                ['cie1', 'cie2', 'cie3', 'cie4', 'cie5'].forEach(cieType => {
                    const score = sm[cieType];
                    if (score !== undefined && score !== null && score !== '') {
                        const scoreNum = parseFloat(score);
                        const attVal = sm[cieType + '_att'] != null ? parseFloat(sm[cieType + '_att']) : null;
                        const dbRemarks = sm[cieType + '_remarks'] || null;
                        
                        // Auto-generate remarks if none exist
                        let autoRemarks = dbRemarks;
                        if (!autoRemarks) {
                            const lowMarks = scoreNum < perfConfig.average_threshold_min;
                            const lowAtt = attVal != null && attVal < 75;
                            if (lowMarks && lowAtt) autoRemarks = 'Needs Improvement – Low marks & attendance';
                            else if (lowMarks) autoRemarks = 'Below Average – Low marks';
                            else if (lowAtt) autoRemarks = 'Attendance Issue – Low attendance';
                            else if (scoreNum >= perfConfig.excellent_threshold && (attVal == null || attVal >= 75)) autoRemarks = 'Excellent Performance';
                            else autoRemarks = 'Good – On Track';
                        }
                        
                        const entry = { ...student, subject: subjName, subjectClean: subjName.replace(/\[.*?\]/g, '').trim(), cieType: cieType.toUpperCase(), score: scoreNum, attendance: attVal, remarksText: autoRemarks };
                        if (scoreNum >= perfConfig.excellent_threshold) excellent.push(entry);
                        else if (scoreNum >= perfConfig.average_threshold_min) average.push(entry);
                        else low.push(entry);
                    }
                });
                totalA += (parseFloat(sm.cie1) || 0) + (parseFloat(sm.cie2) || 0) + (parseFloat(sm.cie3) || 0) + (parseFloat(sm.cie4) || 0) + (parseFloat(sm.cie5) || 0);
                totalP += (sm.cie1 !== undefined ? 1 : 0) + (sm.cie2 !== undefined ? 1 : 0) + (sm.cie3 !== undefined ? 1 : 0) + (sm.cie4 !== undefined ? 1 : 0) + (sm.cie5 !== undefined ? 1 : 0);
            });
            const pct = (totalP * 50) > 0 ? (totalA / (totalP * 50)) : 0;
            if (pct >= 0.4 && Object.keys(m).length > 0) passed.push({ ...student, score: Math.round(pct * 100) + '%' });
        });
        return { excellent, average, low, passed };
    }, [paginatedStudents]);

    const handleViewProfile = (student) => {
        if (propSetSelectedStudentProfile) {
            propSetSelectedStudentProfile(student);
        }
        setInternalSelectedStudent(student);
    };

    const handleSelectStudent = (id) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedStudents(paginatedStudents.map(s => s.id));
        } else {
            setSelectedStudents([]);
        }
    };

    // Fetch students when department changes (or on mount if all)
    React.useEffect(() => {
        const fetchStudents = async () => {
            if (!selectedDept || !selectedDept.id) return;

            setLocalLoading(true);
            try {
                // Determine API endpoint
                const endpoint = `${API_BASE_URL}/student/all?department=${selectedDept.id}`;
                const response = await authenticatedFetch(endpoint);

                if (response.ok) {
                    const data = await response.json();
                    setApiStudents(data);
                } else {
                    console.error("Failed to fetch students");
                    setApiStudents([]);
                }
            } catch (error) {
                console.error("Error fetching students:", error);
            } finally {
                setLocalLoading(false);
            }
        };

        if (user) {
            fetchStudents();
        }
    }, [selectedDept, user]);

    if (parentLoading && departments.length === 0) {
        return (
            <div className={styles.sectionVisible}>
                <h3 className={styles.chartTitle} style={{ marginBottom: '1.5rem' }}>Select Department</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={styles.glassCard} style={{ borderLeft: '4px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <Skeleton width="120px" height="24px" />
                                <Skeleton width="40px" height="20px" />
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                <Skeleton width="80px" height="14px" style={{ marginBottom: '8px' }} />
                                <Skeleton width="120px" height="14px" />
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <Skeleton width="100px" height="16px" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!selectedDept) {
        return (
            <div className={styles.sectionVisible}>
                <h3 className={styles.chartTitle} style={{ marginBottom: '1.5rem' }}>Select Department</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {departments.map(dept => (
                        <div
                            key={dept.id}
                            className={styles.glassCard}
                            onClick={() => handleDeptClick(dept)}
                            style={{
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                borderLeft: `4px solid ${dept.id === 'CS' ? '#3b82f6' : dept.id === 'ME' ? '#f59e0b' : '#10b981'}`
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '1.2rem', color: '#1e293b', margin: 0 }}>{dept.name}</h4>
                                <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>{dept.id}</span>
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                <p style={{ margin: '0 0 4px 0' }}>HOD: <span style={{ background: 'linear-gradient(to right, #2563eb, #9333ea, #db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 700 }}>{dept.hod}</span></p>
                                <p style={{ margin: 0 }}>Total Students: {dept.studentCount}</p>
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <span style={{ color: '#2563eb', fontWeight: '600', fontSize: '0.9rem' }}>View Students →</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.sectionVisible}>
            {/* --- NEW COLORFUL HEADER BANNER --- */}
            <div style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                borderRadius: '24px',
                padding: '2rem',
                color: 'white',
                marginBottom: '2rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)'
            }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', bottom: '-20px', left: '100px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>

                <button
                    onClick={() => setSelectedDept(null)}
                    style={{
                        background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '12px', padding: '0.5rem 1rem', color: 'white', fontSize: '0.9rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem',
                        fontWeight: 500, transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >
                    <ArrowLeft size={16} /> Back to Departments
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-1px' }}>{selectedDept.name}</h1>
                        <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '1.1rem' }}>Student Directory & Performance</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Total Students</p>
                            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>{filteredStudents.length}</p>
                        </div>

                    </div>
                </div>
            </div>

            {/* --- ACTION TOOLBAR --- */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem',
                background: 'white', padding: '1rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '1rem'
            }}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                    <div className={styles.searchWrapper}>
                        <input
                            placeholder="Search by Name or Reg No..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className={styles.searchIcon}>
                            <Search size={18} />
                        </div>
                    </div>

                    <button
                        onClick={() => setShowAtRisk(!showAtRisk)}
                        style={{
                            padding: '0.7rem 1rem', borderRadius: '10px',
                            border: showAtRisk ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                            background: showAtRisk ? '#eff6ff' : 'white', color: showAtRisk ? '#2563eb' : '#0f172a',
                            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600,
                            transition: 'all 0.2s'
                        }}
                    >
                        <Filter size={16} /> {showAtRisk ? 'At Risk' : 'Filter'}
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                        <select
                            className={styles.filterSelect}
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                        >
                            {['1st', '2nd', '3rd', '4th', '5th', '6th'].map(sem => (
                                <option key={sem} value={sem}>{sem} Sem</option>
                            ))}
                        </select>

                        <select
                            className={styles.filterSelect}
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                        >
                            <option value="All">All Sections</option>
                            <option value="A">Section A</option>
                            <option value="B">Section B</option>
                            <option value="C">Section C</option>
                            <option value="D">Section D</option>
                        </select>
                    </div>

                    <button
                        style={{
                            padding: '0.7rem 1.2rem', borderRadius: '10px', border: 'none',
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
                            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(59,130,246,0.3)', transition: 'all 0.2s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.4)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.3)'; }}
                        onClick={() => setShowDownloadModal(true)}
                    >
                        <Download size={16} /> Download
                    </button>
                </div>
            </div>

            {/* ===== DOWNLOAD MODAL ===== */}
            {showDownloadModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={() => setShowDownloadModal(false)}>
                    <div style={{ background: 'white', borderRadius: '16px', width: '90%', maxWidth: '560px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} onClick={() => setShowDownloadModal(false)}><X size={22} color="#64748b" /></button>
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Download size={22} color="#3b82f6" /> Download Data
                            </h3>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Select what you want to download</p>
                        </div>

                        {/* Data Type */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Data Type</label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {[{ id: 'list', label: 'Student List' }, { id: 'marks', label: 'Marks' }, { id: 'performance', label: 'Performance' }].map(dt => (
                                    <button key={dt.id} style={{
                                        padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                                        border: dlDataType === dt.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                        background: dlDataType === dt.id ? '#eff6ff' : '#f8fafc',
                                        color: dlDataType === dt.id ? '#2563eb' : '#64748b', transition: 'all 0.15s'
                                    }} onClick={() => setDlDataType(dt.id)}>{dt.label}</button>
                                ))}
                            </div>
                        </div>

                        {/* Sections */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Sections</label>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                {['All', 'A', 'B', 'C', 'D'].map(sec => (
                                    <label key={sec} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#1e293b', cursor: 'pointer', fontWeight: 500 }}>
                                        <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }}
                                            checked={dlSections.includes(sec)}
                                            onChange={() => {
                                                if (sec === 'All') setDlSections(dlSections.includes('All') ? [] : ['All']);
                                                else setDlSections(prev => { const next = prev.filter(s => s !== 'All'); return next.includes(sec) ? next.filter(s => s !== sec) : [...next, sec]; });
                                            }}
                                        />
                                        {sec === 'All' ? 'All Sections' : `Section ${sec}`}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* CIE Types */}
                        {(dlDataType === 'marks' || dlDataType === 'performance') && (
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>CIE Types</label>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    {['All', 'CIE1', 'CIE2', 'CIE3', 'CIE4', 'CIE5'].map(cie => (
                                        <label key={cie} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#1e293b', cursor: 'pointer', fontWeight: 500 }}>
                                            <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }}
                                                checked={dlCies.includes(cie)}
                                                onChange={() => {
                                                    if (cie === 'All') setDlCies(dlCies.includes('All') ? [] : ['All']);
                                                    else setDlCies(prev => { const next = prev.filter(s => s !== 'All'); return next.includes(cie) ? next.filter(s => s !== cie) : [...next, cie]; });
                                                }}
                                            />
                                            {cie}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Subject */}
                        {(dlDataType === 'marks' || dlDataType === 'performance') && (
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Subject</label>
                                <select className={styles.filterSelect} style={{ width: '100%' }} value={dlSubject} onChange={e => setDlSubject(e.target.value)}>
                                    <option value="All">All Subjects</option>
                                    {derivedSubjects.map(sub => <option key={sub.id} value={sub.id}>{sub.cleanName}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Performance Category */}
                        {dlDataType === 'performance' && (
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Performance Category</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {[{ id: 'all', label: 'All', c: '#6366f1' }, { id: 'excellent', label: 'Excellent', c: '#10b981' }, { id: 'average', label: 'Average', c: '#f59e0b' }, { id: 'low', label: 'Low', c: '#ef4444' }, { id: 'passed', label: 'Passed', c: '#3b82f6' }].map(cat => (
                                        <button key={cat.id} style={{
                                            padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                                            border: dlPerfCategory === cat.id ? `2px solid ${cat.c}` : '1px solid #e2e8f0',
                                            background: dlPerfCategory === cat.id ? cat.c + '15' : '#f8fafc',
                                            color: dlPerfCategory === cat.id ? cat.c : '#64748b', transition: 'all 0.15s'
                                        }} onClick={() => setDlPerfCategory(cat.id)}>{cat.label}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
                            <button style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
                                onClick={() => setShowDownloadModal(false)}>Cancel</button>
                            <button style={{ flex: 2, padding: '0.75rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}
                                onClick={() => {
                                    const secFilter = dlSections.includes('All') || dlSections.length === 0 ? null : dlSections;
                                    const students = apiStudents.filter(s => {
                                        const semNum = semester.toLowerCase() === 'all' ? null : semester.replace(/\D/g, '');
                                        const matchSem = !semNum || (s.semester || s.sem) == semNum;
                                        const matchSec = !secFilter || secFilter.includes(s.section);
                                        return matchSem && matchSec;
                                    });
                                    const cieKeys = dlCies.includes('All') || dlCies.length === 0 ? ['cie1','cie2','cie3','cie4','cie5'] : dlCies.map(c => c.toLowerCase());
                                    const dept = selectedDept?.id || 'dept';
                                    let headers, rows, filename;

                                    if (dlDataType === 'marks') {
                                        const subs = dlSubject === 'All' ? derivedSubjects : derivedSubjects.filter(s => s.id === dlSubject);
                                        headers = ['Sl No', 'Reg No', 'Name', 'Semester', 'Section'];
                                        subs.forEach(sub => { cieKeys.forEach(cie => { headers.push(`${sub.cleanName} ${cie.toUpperCase()}`); headers.push(`${sub.cleanName} ${cie.toUpperCase()} Att%`); }); });
                                        headers.push('Total');
                                        rows = students.map((s, i) => {
                                            const row = [i+1, s.regNo||'', (s.name||'').replace(/,/g,' '), s.semester||s.sem||'', s.section||''];
                                            let total = 0;
                                            subs.forEach(sub => { const sm = (s.subjectMarks||{})[sub.id]||{}; cieKeys.forEach(cie => { row.push(sm[cie]!==undefined?sm[cie]:'-'); row.push(sm[cie+'_att']!=null?sm[cie+'_att']+'%':'-'); if(sm[cie]!==undefined) total+=parseFloat(sm[cie]); }); });
                                            row.push(total); return row;
                                        });
                                        filename = `${dept}_Marks_${dlSubject === 'All' ? 'AllSubjects' : dlSubject.replace(/\s+/g,'_')}.csv`;
                                    } else if (dlDataType === 'performance') {
                                        let allPerf = [];
                                        students.forEach(student => {
                                            const m = student.subjectMarks || {};
                                            Object.entries(m).forEach(([subjName, sm]) => {
                                                if (dlSubject !== 'All' && dlSubject !== subjName) return;
                                                cieKeys.forEach(cie => {
                                                    const score = sm[cie];
                                                    if (score !== undefined && score !== null && score !== '') {
                                                        const scoreNum = parseFloat(score);
                                                        const attVal = sm[cie+'_att'] != null ? parseFloat(sm[cie+'_att']) : null;
                                                        const dbRemarks = sm[cie+'_remarks'] || null;
                                                        let cat = scoreNum >= 40 ? 'excellent' : scoreNum >= 20 ? 'average' : 'low';
                                                        let remark = dbRemarks || (scoreNum < 20 && attVal != null && attVal < 75 ? 'Needs Improvement' : scoreNum < 20 ? 'Below Average' : scoreNum >= 40 ? 'Excellent Performance' : 'Good');
                                                        if (dlPerfCategory === 'all' || dlPerfCategory === cat) {
                                                            allPerf.push({ regNo: student.regNo, name: student.name, section: student.section, subject: subjName.replace(/\[.*?\]/g,'').trim(), cieType: cie.toUpperCase(), score: scoreNum, att: attVal, remarks: remark, phone: student.parentPhone || '' });
                                                        }
                                                    }
                                                });
                                            });
                                        });
                                        headers = ['Sl No', 'Reg No', 'Name', 'Section', 'Subject', 'CIE', 'Marks', 'Attendance', 'Remarks', 'Phone'];
                                        rows = allPerf.map((r,i) => [i+1, r.regNo, (r.name||'').replace(/,/g,' '), r.section||'', r.subject.replace(/,/g,' '), r.cieType, `${r.score}/50`, r.att!=null?`${r.att}%`:'N/A', r.remarks.replace(/,/g,' '), r.phone]);
                                        filename = `${dept}_${dlPerfCategory==='all'?'All':dlPerfCategory}_Performance.csv`;
                                    } else {
                                        headers = ['Sl No', 'Reg No', 'Name', 'Semester', 'Section', 'Department', 'Email', 'Phone', 'Parent Phone'];
                                        rows = students.map((s,i) => [i+1, s.regNo||'', (s.name||'').replace(/,/g,' '), s.semester||s.sem||'', s.section||'', s.department||dept, s.email||'', s.phone||'', s.parentPhone||'']);
                                        filename = `${dept}_StudentList.csv`;
                                    }

                                    if (rows.length === 0) { alert('No data to download for the selected filters.'); return; }
                                    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url; link.download = filename;
                                    document.body.appendChild(link); link.click(); document.body.removeChild(link);
                                    URL.revokeObjectURL(url);
                                    setShowDownloadModal(false);
                                }}
                            ><Download size={16} /> Download CSV</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- VIEW MODE TABS --- */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                {[
                    { id: 'list', label: 'Students List' },
                    { id: 'marks', label: 'Marks' },
                    { id: 'performance', label: 'Performance' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setViewMode(tab.id)}
                        style={{
                            background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '0.95rem',
                            fontWeight: viewMode === tab.id ? 700 : 500,
                            color: viewMode === tab.id ? '#3b82f6' : '#64748b',
                            borderBottom: viewMode === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                            cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* --- BULK ACTIONS BAR --- */}
            {selectedStudents.length > 0 && (
                <div style={{
                    background: '#0f172a', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '12px',
                    marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'fadeIn 0.2s',
                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CheckCircle size={20} color="#4ade80" />
                        <span style={{ fontWeight: 600 }}>{selectedStudents.length} students selected</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }} onClick={() => showBulkToast('Sending SMS to selected parents...')}>Send SMS</button>
                        <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }} onClick={() => showBulkToast('Printing Reports...')}>Print Reports</button>
                        <button style={{ background: 'white', border: 'none', color: '#0f172a', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }} onClick={() => setSelectedStudents([])}>Clear</button>
                    </div>
                </div>
            )}

            <div className={styles.tableCard}>
                {viewMode === 'list' && (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}><input type="checkbox" onChange={handleSelectAll} checked={selectedStudents.length === paginatedStudents.length && paginatedStudents.length > 0} /></th>
                            <th style={{ width: '60px' }}>Sl. No</th>
                            <th>Reg No</th>
                            <th>Name</th>
                            <th>Sem</th>

                            <th>CIE Performance</th>

                            <th>Mentoring</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {effectiveLoading ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <tr key={i}>
                                    <td><Skeleton width="20px" height="20px" /></td>
                                    <td><Skeleton width="40px" height="14px" /></td>
                                    <td><Skeleton width="100px" height="14px" /></td>
                                    <td><Skeleton width="150px" height="14px" /></td>
                                    <td><Skeleton width="40px" height="14px" /></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Skeleton width="80px" height="6px" />
                                            <Skeleton width="30px" height="14px" />
                                        </div>
                                    </td>
                                    <td><Skeleton width="80px" height="20px" /></td>
                                    <td><Skeleton width="100px" height="32px" /></td>
                                </tr>
                            ))
                        ) : paginatedStudents.length > 0 ? (
                            paginatedStudents.map((student, index) => (
                                <tr key={student.id} onClick={() => handleViewProfile(student)} style={{ cursor: 'pointer', background: selectedStudents.includes(student.id) ? '#f0f9ff' : 'transparent' }}>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => handleSelectStudent(student.id)} />
                                    </td>
                                    <td style={{ color: '#64748b', fontWeight: 500 }}>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td>{student.regNo || student.rollNo}</td>
                                    <td style={{ fontWeight: 600 }}>
                                        {student.name}
                                    </td>
                                    <td>{student.semester || student.sem}</td>

                                    <td>
                                        {(() => {
                                            const totalAcquired = Object.values(student.subjectMarks || {}).reduce((sum, marks) => sum + (marks.cie1 || 0) + (marks.cie2 || 0) + (marks.cie3 || 0) + (marks.cie4 || 0) + (marks.cie5 || 0), 0);
                                            const totalPossible = Object.values(student.subjectMarks || {}).reduce((count, marks) => count + (marks.cie1 !== undefined ? 1 : 0) + (marks.cie2 !== undefined ? 1 : 0) + (marks.cie3 !== undefined ? 1 : 0) + (marks.cie4 !== undefined ? 1 : 0) + (marks.cie5 !== undefined ? 1 : 0), 0) * 50;
                                            const percentage = totalPossible > 0 ? Math.round((totalAcquired / totalPossible) * 100) : 0;
                                            return (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '80px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{
                                                            width: `${percentage}%`,
                                                            height: '100%',
                                                            background: percentage >= 50 ? '#3b82f6' : '#f59e0b'
                                                        }}></div>
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{percentage}%</span>
                                                </div>
                                            );
                                        })()}
                                    </td>

                                    <td>
                                        {student.mentoringStatus === 'Done' ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.85rem' }}>
                                                <CheckCircle size={14} color="#10b981" /> Done
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 500 }}>
                                                <Clock size={14} /> Pending
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <button className={styles.secondaryBtn} onClick={(e) => { e.stopPropagation(); handleViewProfile(student); }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                            View Profile
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <Search size={32} color="#cbd5e1" />
                                        <p style={{ margin: 0 }}>No students found matching your filters.</p>
                                        <button
                                            onClick={() => { setSearchQuery(''); setShowAtRisk(false); }}
                                            style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                )}

                {viewMode === 'marks' && (
                    <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem', fontWeight: 600 }}>Student Marks Overview</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Detailed CIE marks for {selectedDept?.id || 'department'}.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <select className={styles.filterSelect} value={selectedMarksSubject} onChange={e => setSelectedMarksSubject(e.target.value)}>
                                    <option value="ALL">All Subjects</option>
                                    {derivedSubjects.map(sub => <option key={sub.id} value={sub.id}>{sub.cleanName}</option>)}
                                </select>
                                {selectedMarksSubject !== 'ALL' && (
                                    <select className={styles.filterSelect} value={selectedCieType} onChange={e => setSelectedCieType(e.target.value)}>
                                        <option value="all">View All CIEs</option>
                                        <option value="cie1">CIE-1</option>
                                        <option value="cie2">CIE-2</option>
                                        <option value="cie3">CIE-3</option>
                                        <option value="cie4">CIE-4</option>
                                        <option value="cie5">CIE-5</option>
                                    </select>
                                )}
                            </div>
                        </div>
                        
                        <div className={styles.tableWrapper} style={{ overflowX: 'auto' }}>
                            <table className={styles.table} style={{ borderCollapse: 'collapse', width: selectedMarksSubject === 'ALL' ? '100%' : 'max-content', minWidth: '100%' }}>
                                {selectedMarksSubject === 'ALL' ? (
                                    <>
                                        <thead>
                                            <tr>
                                                <th rowSpan={2} style={{ width: '50px', minWidth: '50px', borderRight: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', verticalAlign: 'middle', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>Sl. No.</th>
                                                <th rowSpan={2} style={{ width: '130px', minWidth: '130px', borderRight: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', verticalAlign: 'middle', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>Reg No</th>
                                                <th rowSpan={2} style={{ width: '220px', minWidth: '220px', borderRight: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', verticalAlign: 'middle', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>Student Name</th>
                                                {derivedSubjects.map(sub => {
                                                    let subTotal = 0, subPassed = 0;
                                                    paginatedStudents.forEach(st => {
                                                        const sm = st.subjectMarks?.[sub.id] || {};
                                                        ['cie1','cie2','cie3','cie4','cie5'].forEach(cie => {
                                                            if (sm[cie] !== undefined) {
                                                                subTotal++;
                                                                if (parseFloat(sm[cie]) >= 20) subPassed++;
                                                            }
                                                        });
                                                    });
                                                    const passPercent = subTotal > 0 ? Math.round((subPassed * 100 / subTotal) * 10) / 10 : 0;
                                                    return (
                                                        <th key={sub.id} colSpan={selectedCieType === 'all' ? 10 : 2} style={{ textAlign: 'center', background: '#e2e8f0', color: '#0f172a', borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '6px' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                <span>{sub.cleanName}</span>
                                                                <span style={{ fontSize: '0.75rem', color: passPercent >= 70 ? '#16a34a' : passPercent >= 40 ? '#1d4ed8' : '#dc2626', fontWeight: 'bold', marginTop: '2px' }}>
                                                                    Pass: {passPercent}%
                                                                </span>
                                                            </div>
                                                        </th>
                                                    );
                                                })}
                                                <th rowSpan={2} style={{ width: '200px', minWidth: '200px', backgroundColor: '#fefce8', color: '#a16207', verticalAlign: 'middle', borderLeft: '1px solid #e2e8f0', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>Overall Status</th>
                                            </tr>
                                            <tr>
                                                {derivedSubjects.map(sub => (
                                                    <React.Fragment key={`subhead-${sub.id}`}>
                                                        {['cie1', 'all'].includes(selectedCieType) && (
                                                            <>
                                                                <th style={{ background: '#eff6ff', color: '#1d4ed8', width: '55px', minWidth: '55px', padding: '8px 2px', fontSize: '0.8rem', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>C1</th>
                                                                <th style={{ background: '#f0fdf4', color: '#15803d', width: '55px', minWidth: '55px', padding: '8px 2px', fontSize: '0.8rem', textAlign: 'center', borderRight: selectedCieType === 'cie1' ? '1px solid #cbd5e1' : 'none', borderBottom: '1px solid #cbd5e1' }}>A1</th>
                                                            </>
                                                        )}
                                                        {['cie2', 'all'].includes(selectedCieType) && (
                                                            <>
                                                                <th style={{ background: '#eff6ff', color: '#1d4ed8', width: '55px', minWidth: '55px', padding: '8px 2px', fontSize: '0.8rem', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>C2</th>
                                                                <th style={{ background: '#f0fdf4', color: '#15803d', width: '55px', minWidth: '55px', padding: '8px 2px', fontSize: '0.8rem', textAlign: 'center', borderRight: selectedCieType === 'cie2' ? '1px solid #cbd5e1' : 'none', borderBottom: '1px solid #cbd5e1' }}>A2</th>
                                                            </>
                                                        )}
                                                        {['cie3', 'all'].includes(selectedCieType) && (
                                                            <>
                                                                <th style={{ background: '#eff6ff', color: '#1d4ed8', width: '55px', minWidth: '55px', padding: '8px 2px', fontSize: '0.8rem', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>C3</th>
                                                                <th style={{ background: '#f0fdf4', color: '#15803d', width: '55px', minWidth: '55px', padding: '8px 2px', fontSize: '0.8rem', textAlign: 'center', borderRight: selectedCieType === 'cie3' ? '1px solid #cbd5e1' : 'none', borderBottom: '1px solid #cbd5e1' }}>A3</th>
                                                            </>
                                                        )}
                                                        {['cie4', 'all'].includes(selectedCieType) && (
                                                            <>
                                                                <th style={{ background: '#eff6ff', color: '#1d4ed8', width: '55px', minWidth: '55px', padding: '8px 2px', fontSize: '0.8rem', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>C4</th>
                                                                <th style={{ background: '#f0fdf4', color: '#15803d', width: '55px', minWidth: '55px', padding: '8px 2px', fontSize: '0.8rem', textAlign: 'center', borderRight: selectedCieType === 'cie4' ? '1px solid #cbd5e1' : 'none', borderBottom: '1px solid #cbd5e1' }}>A4</th>
                                                            </>
                                                        )}
                                                        {['cie5', 'all'].includes(selectedCieType) && (
                                                            <>
                                                                <th style={{ background: '#eff6ff', color: '#1d4ed8', width: '55px', minWidth: '55px', padding: '8px 2px', fontSize: '0.8rem', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>C5</th>
                                                                <th style={{ background: '#f0fdf4', color: '#15803d', width: '55px', minWidth: '55px', padding: '8px 2px', fontSize: '0.8rem', textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>A5</th>
                                                            </>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedStudents.length > 0 ? paginatedStudents.map((student, index) => {
                                                const m = student.subjectMarks || {};
                                                let grandTotal = 0, grandCount = 0;
                                                return (
                                                    <tr key={student.id} onClick={() => handleViewProfile(student)} style={{ cursor: 'pointer', background: selectedStudents.includes(student.id) ? '#f0f9ff' : 'transparent', transition: 'background 0.2s', borderBottom: '1px solid #e2e8f0' }}>
                                                        <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', color: '#64748b' }}>{index + 1}</td>
                                                        <td style={{ borderRight: '1px solid #e2e8f0', fontWeight: 600 }}>{student.regNo || student.rollNo}</td>
                                                        <td style={{ borderRight: '1px solid #e2e8f0', padding: '10px' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontWeight: 600, color: '#0f172a' }}>{student.name}</span>
                                                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Sem {student.semester || student.sem} | Sec {student.section || 'A'}</span>
                                                            </div>
                                                        </td>
                                                        {derivedSubjects.map(sub => {
                                                            const sm = m[sub.id] || {};
                                                            return (
                                                                <React.Fragment key={`sub-${sub.id}`}>
                                                                    {['cie1', 'all'].includes(selectedCieType) && (() => {
                                                                        if (sm.cie1 !== undefined) { grandTotal += parseFloat(sm.cie1); grandCount++; }
                                                                        return (
                                                                        <>
                                                                            <td style={{ textAlign: 'center', padding: '6px', borderRight: '1px dashed #e2e8f0', color: sm.cie1 !== undefined && sm.cie1 < 20 ? '#ef4444' : '#1e293b', fontWeight: sm.cie1 !== undefined ? 600 : 400, background: '#f8fafc' }}>
                                                                                {sm.cie1 !== undefined ? sm.cie1 : '-'}
                                                                            </td>
                                                                            <td style={{ textAlign: 'center', padding: '6px', borderRight: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.85rem' }}>
                                                                                {sm.cie1_att !== undefined ? sm.cie1_att + '%' : '-'}
                                                                            </td>
                                                                        </>
                                                                        );
                                                                    })()}
                                                                    {['cie2', 'all'].includes(selectedCieType) && (() => {
                                                                        if (sm.cie2 !== undefined) { grandTotal += parseFloat(sm.cie2); grandCount++; }
                                                                        return (
                                                                        <>
                                                                            <td style={{ textAlign: 'center', padding: '6px', borderRight: '1px dashed #e2e8f0', color: sm.cie2 !== undefined && sm.cie2 < 20 ? '#ef4444' : '#1e293b', fontWeight: sm.cie2 !== undefined ? 600 : 400, background: '#f8fafc' }}>
                                                                                {sm.cie2 !== undefined ? sm.cie2 : '-'}
                                                                            </td>
                                                                            <td style={{ textAlign: 'center', padding: '6px', borderRight: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.85rem' }}>
                                                                                {sm.cie2_att !== undefined ? sm.cie2_att + '%' : '-'}
                                                                            </td>
                                                                        </>
                                                                        );
                                                                    })()}
                                                                    {['cie3', 'all'].includes(selectedCieType) && (() => {
                                                                        if (sm.cie3 !== undefined) { grandTotal += parseFloat(sm.cie3); grandCount++; }
                                                                        return (
                                                                        <>
                                                                            <td style={{ textAlign: 'center', padding: '6px', borderRight: '1px dashed #e2e8f0', color: sm.cie3 !== undefined && sm.cie3 < 20 ? '#ef4444' : '#1e293b', fontWeight: sm.cie3 !== undefined ? 600 : 400, background: '#f8fafc' }}>
                                                                                {sm.cie3 !== undefined ? sm.cie3 : '-'}
                                                                            </td>
                                                                            <td style={{ textAlign: 'center', padding: '6px', borderRight: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.85rem' }}>
                                                                                {sm.cie3_att !== undefined ? sm.cie3_att + '%' : '-'}
                                                                            </td>
                                                                        </>
                                                                        );
                                                                    })()}
                                                                    {['cie4', 'all'].includes(selectedCieType) && (() => {
                                                                        if (sm.cie4 !== undefined) { grandTotal += parseFloat(sm.cie4); grandCount++; }
                                                                        return (
                                                                        <>
                                                                            <td style={{ textAlign: 'center', padding: '6px', borderRight: '1px dashed #e2e8f0', color: sm.cie4 !== undefined && sm.cie4 < 20 ? '#ef4444' : '#1e293b', fontWeight: sm.cie4 !== undefined ? 600 : 400, background: '#f8fafc' }}>
                                                                                {sm.cie4 !== undefined ? sm.cie4 : '-'}
                                                                            </td>
                                                                            <td style={{ textAlign: 'center', padding: '6px', borderRight: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.85rem' }}>
                                                                                {sm.cie4_att !== undefined ? sm.cie4_att + '%' : '-'}
                                                                            </td>
                                                                        </>
                                                                        );
                                                                    })()}
                                                                    {['cie5', 'all'].includes(selectedCieType) && (() => {
                                                                        if (sm.cie5 !== undefined) { grandTotal += parseFloat(sm.cie5); grandCount++; }
                                                                        return (
                                                                        <>
                                                                            <td style={{ textAlign: 'center', padding: '6px', borderRight: '1px dashed #e2e8f0', color: sm.cie5 !== undefined && sm.cie5 < 20 ? '#ef4444' : '#1e293b', fontWeight: sm.cie5 !== undefined ? 600 : 400, background: '#f8fafc' }}>
                                                                                {sm.cie5 !== undefined ? sm.cie5 : '-'}
                                                                            </td>
                                                                            <td style={{ textAlign: 'center', padding: '6px', borderRight: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.85rem' }}>
                                                                                {sm.cie5_att !== undefined ? sm.cie5_att + '%' : '-'}
                                                                            </td>
                                                                        </>
                                                                        );
                                                                    })()}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                        <td style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0', fontWeight: 'bold', backgroundColor: '#fefce8', verticalAlign: 'middle', padding: '8px' }}>
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: grandCount > 0 && (grandTotal/grandCount) >= 20 ? '#dcfce7' : '#fee2e2', color: grandCount > 0 && (grandTotal/grandCount) >= 20 ? '#16a34a' : '#ef4444' }}>
                                                                {grandCount > 0 ? Math.round(grandTotal/grandCount) : '-'}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }) : (
                                                <tr><td colSpan={derivedSubjects.length * (selectedCieType === 'all' ? 10 : 2) + 4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No students found.</td></tr>
                                            )}
                                        </tbody>
                                    </>
                                ) : (
                                    <>
                                        <thead>
                                            <tr>
                                                <th rowSpan="2" style={{ background: '#f8fafc', width: '50px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'center' }}>Sl. No.</th>
                                                <th rowSpan="2" style={{ background: '#f8fafc', width: '120px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Reg No</th>
                                                <th rowSpan="2" style={{ background: '#f8fafc', width: '220px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Student Name</th>
                                                {['cie1', 'all'].includes(selectedCieType) && <th colSpan={2} style={{ background: '#eff6ff', color: '#1d4ed8', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'center' }}>CIE-1 (50)</th>}
                                                {['cie2', 'all'].includes(selectedCieType) && <th colSpan={2} style={{ background: '#eff6ff', color: '#1d4ed8', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'center' }}>CIE-2 (50)</th>}
                                                {['cie3', 'all'].includes(selectedCieType) && <th colSpan={2} style={{ background: '#eff6ff', color: '#1d4ed8', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'center' }}>CIE-3 (50)</th>}
                                                {['cie4', 'all'].includes(selectedCieType) && <th colSpan={2} style={{ background: '#eff6ff', color: '#1d4ed8', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'center' }}>CIE-4 (50)</th>}
                                                {['cie5', 'all'].includes(selectedCieType) && <th colSpan={2} style={{ background: '#eff6ff', color: '#1d4ed8', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'center' }}>CIE-5 (50)</th>}
                                                <th rowSpan="2" style={{ textAlign: 'center', background: '#fefce8', color: '#a16207', borderBottom: '1px solid #cbd5e1' }}>Total</th>
                                            </tr>
                                            <tr>
                                                {['cie1', 'all'].includes(selectedCieType) && <React.Fragment><th style={{ background: '#eff6ff', color: '#1d4ed8', borderBottom: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>M</th><th style={{ background: '#f0fdf4', color: '#15803d', borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>A%</th></React.Fragment>}
                                                {['cie2', 'all'].includes(selectedCieType) && <React.Fragment><th style={{ background: '#eff6ff', color: '#1d4ed8', borderBottom: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>M</th><th style={{ background: '#f0fdf4', color: '#15803d', borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>A%</th></React.Fragment>}
                                                {['cie3', 'all'].includes(selectedCieType) && <React.Fragment><th style={{ background: '#eff6ff', color: '#1d4ed8', borderBottom: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>M</th><th style={{ background: '#f0fdf4', color: '#15803d', borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>A%</th></React.Fragment>}
                                                {['cie4', 'all'].includes(selectedCieType) && <React.Fragment><th style={{ background: '#eff6ff', color: '#1d4ed8', borderBottom: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>M</th><th style={{ background: '#f0fdf4', color: '#15803d', borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>A%</th></React.Fragment>}
                                                {['cie5', 'all'].includes(selectedCieType) && <React.Fragment><th style={{ background: '#eff6ff', color: '#1d4ed8', borderBottom: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>M</th><th style={{ background: '#f0fdf4', color: '#15803d', borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '4px', textAlign: 'center' }}>A%</th></React.Fragment>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedStudents.length > 0 ? paginatedStudents.map((student, index) => {
                                                const sm = (student.subjectMarks || {})[selectedMarksSubject] || {};
                                                return (
                                                    <tr key={student.id} onClick={() => handleViewProfile(student)} style={{ cursor: 'pointer', background: selectedStudents.includes(student.id) ? '#f0f9ff' : 'transparent', transition: 'background 0.2s' }}>
                                                        <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>{index + 1}</td>
                                                        <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>{student.regNo || student.rollNo}</td>
                                                        <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>{student.name}</td>
                                                        
                                                        {['cie1', 'all'].includes(selectedCieType) && (
                                                            <React.Fragment>
                                                                <td style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600 }}>{sm.cie1 !== undefined ? sm.cie1 : '-'}</td>
                                                                <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>{sm.cie1_att !== undefined ? sm.cie1_att + '%' : '-'}</td>
                                                            </React.Fragment>
                                                        )}
                                                        {['cie2', 'all'].includes(selectedCieType) && (
                                                            <React.Fragment>
                                                                <td style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600 }}>{sm.cie2 !== undefined ? sm.cie2 : '-'}</td>
                                                                <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>{sm.cie2_att !== undefined ? sm.cie2_att + '%' : '-'}</td>
                                                            </React.Fragment>
                                                        )}
                                                        {['cie3', 'all'].includes(selectedCieType) && (
                                                            <React.Fragment>
                                                                <td style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600 }}>{sm.cie3 !== undefined ? sm.cie3 : '-'}</td>
                                                                <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>{sm.cie3_att !== undefined ? sm.cie3_att + '%' : '-'}</td>
                                                            </React.Fragment>
                                                        )}
                                                        {['cie4', 'all'].includes(selectedCieType) && (
                                                            <React.Fragment>
                                                                <td style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600 }}>{sm.cie4 !== undefined ? sm.cie4 : '-'}</td>
                                                                <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>{sm.cie4_att !== undefined ? sm.cie4_att + '%' : '-'}</td>
                                                            </React.Fragment>
                                                        )}
                                                        {['cie5', 'all'].includes(selectedCieType) && (
                                                            <React.Fragment>
                                                                <td style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600 }}>{sm.cie5 !== undefined ? sm.cie5 : '-'}</td>
                                                                <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>{sm.cie5_att !== undefined ? sm.cie5_att + '%' : '-'}</td>
                                                            </React.Fragment>
                                                        )}
                                                        <td style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', backgroundColor: '#fefce8', color: '#0f172a' }}>
                                                            {((sm.cie1||0)+(sm.cie2||0)+(sm.cie3||0)+(sm.cie4||0)+(sm.cie5||0)) || '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            }) : (
                                                <tr><td colSpan="15" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No students found.</td></tr>
                                            )}
                                        </tbody>
                                    </>
                                )}
                            </table>
                        </div>
                    </div>
                )}

                {viewMode === 'performance' && (() => {
                    const applyFilters = (list) => list
                        .filter(item => perfSubjectFilter === 'All' || item.subject === perfSubjectFilter)
                        .filter(item => perfCieFilter === 'All' || item.cieType === perfCieFilter);
                    const getUniqueStudentCount = (list) => new Set(list.map(s => s.regNo || s.rollNo)).size;
                    
                    const filteredExcellent = applyFilters(processedPerfData.excellent);
                    const filteredAverage = applyFilters(processedPerfData.average);
                    const filteredLow = applyFilters(processedPerfData.low);
                    const filteredPassed = applyFilters(processedPerfData.passed);
                    
                    const perfTabs = [
                        { id: 'excellent', label: 'Excellent Performance', color: '#10b981', bg: '#f0fdf4', borderColor: '#bcf0da', icon: <Award size={20} />, list: filteredExcellent, studentCount: getUniqueStudentCount(filteredExcellent), description: `Scored > ${perfConfig.excellent_threshold}/50 marks.` },
                        { id: 'average', label: 'Average Performance', color: '#f59e0b', bg: '#fffbeb', borderColor: '#fde68a', icon: <ClipboardList size={20} />, list: filteredAverage, studentCount: getUniqueStudentCount(filteredAverage), description: `Scored ${perfConfig.average_threshold_min} - ${perfConfig.excellent_threshold} marks.` },
                        { id: 'low', label: 'Low Performance', color: '#ef4444', bg: '#fef2f2', borderColor: '#fecaca', icon: <AlertTriangle size={20} />, list: filteredLow, studentCount: getUniqueStudentCount(filteredLow), description: `Scored < ${perfConfig.average_threshold_min} marks.` },
                        { id: 'passedTarget', label: 'Passed Students', color: '#3b82f6', bg: '#eff6ff', borderColor: '#bfdbfe', icon: <CheckCircle size={20} />, list: filteredPassed, studentCount: getUniqueStudentCount(filteredPassed), description: 'Overall Pass Target Met (Avg >= 40%)' }
                    ];
                    
                    const activeConfig = perfTabs.find(t => t.id === perfTab) || perfTabs[2];
                    const filteredList = activeConfig.list;

                    return (
                        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div>
                                    <h3 style={{ color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                                        Student Performance Analytics
                                    </h3>
                                    <p style={{ color: '#64748b', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                                        Deep dive into specific CIE performance statistics.
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select className={styles.filterSelect} value={perfSubjectFilter} onChange={(e) => setPerfSubjectFilter(e.target.value)}>
                                        <option value="All">All Subjects</option>
                                        {derivedSubjects.map(sub => (<option key={sub.id} value={sub.id}>{sub.cleanName}</option>))}
                                    </select>
                                    <select className={styles.filterSelect} value={perfCieFilter} onChange={(e) => setPerfCieFilter(e.target.value)}>
                                        <option value="All">All CIE</option>
                                        {['CIE1', 'CIE2', 'CIE3', 'CIE4', 'CIE5'].map(cie => (<option key={cie} value={cie}>{cie}</option>))}
                                    </select>
                                </div>
                            </div>
                            
                            {/* Performance Sub-tabs */}
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                {perfTabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setPerfTab(tab.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '0.6rem 1rem', borderRadius: '10px',
                                            border: perfTab === tab.id ? `1px solid ${tab.color}` : '1px solid #e2e8f0',
                                            background: perfTab === tab.id ? tab.bg : '#f8fafc',
                                            color: perfTab === tab.id ? tab.color : '#64748b',
                                            fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
                                            transition: 'all 0.2s', boxShadow: perfTab === tab.id ? `0 2px 8px ${tab.color}30` : 'none'
                                        }}
                                    >
                                        {tab.icon} {tab.label}
                                        <span style={{
                                            background: perfTab === tab.id ? tab.color : '#cbd5e1',
                                            color: 'white', padding: '2px 8px', borderRadius: '12px',
                                            fontSize: '0.75rem', marginLeft: '4px'
                                        }}>{tab.studentCount}</span>
                                    </button>
                                ))}
                            </div>
                            
                            <div style={{ padding: '1rem', background: activeConfig.bg, border: `1px solid ${activeConfig.borderColor}`, borderRadius: '8px', marginBottom: '1.5rem', color: activeConfig.color, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {activeConfig.icon}
                                <strong>{activeConfig.label} ({filteredList.length} records):</strong> {activeConfig.description}
                                <span style={{ marginLeft: 'auto', fontSize: '0.8rem', opacity: 0.8 }}>Unique Students: {activeConfig.studentCount}</span>
                            </div>
                            
                            <div className={styles.tableWrapper} style={{ overflowX: 'auto' }}>
                                <table className={styles.table} style={{ borderCollapse: 'collapse', width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', width: '60px' }}>Sl No</th>
                                            <th style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>Reg No</th>
                                            <th style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>Student Name</th>
                                            <th style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>Marks</th>
                                            <th style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>Attendance</th>
                                            <th style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>Remarks</th>
                                            <th style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>Phone</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredList.length > 0 ? (
                                            filteredList.map((record, index) => {
                                                const att = record.attendance;
                                                const remarks = record.remarksText || 'No remarks recorded.';
                                                return (
                                                <tr key={`${record.id}-${record.subject || 'ALL'}-${record.cieType || 'OVERALL'}`} onClick={() => handleViewProfile(record)} style={{ cursor: 'pointer', borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s', background: 'transparent' }} onMouseOver={e=>e.currentTarget.style.background='#f8fafc'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                                                    <td style={{ color: '#64748b', fontWeight: 500 }}>{index + 1}</td>
                                                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{record.regNo || record.rollNo}</td>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{record.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{record.subjectClean || record.subject || 'All Subjects'} ({record.cieType || 'OVERALL'})</div>
                                                    </td>
                                                    <td>
                                                        <span style={{ color: activeConfig.color, fontWeight: 'bold' }}>
                                                            {record.score} {(!record.cieType || record.cieType.toUpperCase() !== 'OVERALL') && !record.score?.toString().includes('%') ? ' / 50' : ''}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontWeight: 500 }}>
                                                        {att != null ? `${att}%` : 'N/A'}
                                                    </td>
                                                    <td>
                                                        <div style={{ background: remarks.includes('Low') || remarks.includes('Needs') ? '#fef2f2' : remarks.includes('Excellent') ? '#f0fdf4' : '#f8fafc', border: `1px solid ${remarks.includes('Low') || remarks.includes('Needs') ? '#fecaca' : remarks.includes('Excellent') ? '#bbf7d0' : '#e2e8f0'}`, padding: '6px 10px', borderRadius: '6px', fontSize: '0.85rem', color: remarks.includes('Low') || remarks.includes('Needs') ? '#dc2626' : remarks.includes('Excellent') ? '#16a34a' : '#475569', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }} title={remarks}>
                                                            {remarks}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b' }}>
                                                                {record.parentPhone || 'No Contact'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                                );
                                            })
                                        ) : (
                                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                    {perfTab === 'excellent' ? <Award size={48} color="#cbd5e1" /> : <CheckCircle size={48} color="#cbd5e1" />}
                                                    <p style={{ fontSize: '1rem' }}>No {activeConfig.label.toLowerCase()} records found matching criteria.</p>
                                                </div>
                                            </td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })()}

                {/* Footer showing count */}
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                    Showing all {filteredStudents.length} students
                </div>
            </div>

            <StudentProfileModal
                selectedStudentProfile={internalSelectedStudent}
                setSelectedStudentProfile={setInternalSelectedStudent}
                selectedDept={selectedDept}
            />
            {bulkToast && <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 10001, padding: '0.85rem 1.5rem', borderRadius: '12px', background: '#dcfce7', color: '#166534', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontWeight: 600, fontSize: '0.9rem', maxWidth: '400px' }}>{bulkToast}</div>}
        </div>
    );
});
