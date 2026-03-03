import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import RightSidebar from '../components/RightSidebar'; // Import RightSidebar
import API_BASE_URL from '../config/api';
import { LayoutDashboard, FileText, Calendar, Book, User, Download, Bell, TrendingUp, Award, Clock, CheckCircle, Mail, MapPin, ChevronDown, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchSemesterStatus } from '../services/api';
import styles from './StudentDashboard.module.css';
import AcademicSummary from '../components/dashboard/student/AcademicSummary';
import AcademicInsights from '../components/dashboard/student/AcademicInsights';

const StudentDashboard = () => {
    const [activeSection, setActiveSection] = useState('Overview');
    const [toast, setToast] = useState({ show: false, message: '' });

    const { user } = useAuth(); // Get auth context

    // API State
    const [realMarks, setRealMarks] = useState([]);
    const [realSubjects, setRealSubjects] = useState([]);
    const [cieStatus, setCieStatus] = useState("0/3");

    // CIE & Notification State
    const [upcomingExams, setUpcomingExams] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
    const [facultyList, setFacultyList] = useState([]); // Added facultyList state
    const [semesterStatus, setSemesterStatus] = useState('ACTIVE');

    // Student Profile State
    const [studentInfo, setStudentInfo] = useState({
        name: 'Loading...',
        rollNo: user?.username || '...',
        branch: '...',
        semester: '...',
        cgpa: 0
    });

    React.useEffect(() => {
        const fetchMarks = async () => {
            try {
                if (!user || !user.token) return;
                const response = await fetch(`${API_BASE_URL}/marks/my-marks`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });

                if (response.ok) {
                    const data = await response.json();

                    const groupedMarks = {};
                    data.forEach(mark => {
                        if (!mark.subject) return;
                        // Use base subject name as key to merge Theory/Lab
                        const baseName = mark.subject.name.replace(/\s*[\(\[]?(Theory|Lab|T|L|Theory\s+Exam|Practical)[\)\]]?\s*$/i, '').trim();
                        if (!groupedMarks[baseName]) {
                            groupedMarks[baseName] = {
                                name: baseName,
                                code: mark.subject.code.replace(/[-(\s]+(T|L|Theory|Lab)$/i, '').trim(),
                                cie1Score: null, cie2Score: null, cie3Score: null, cie4Score: null, cie5Score: null,
                                cie1Att: null, cie2Att: null, cie3Att: null, cie4Att: null, cie5Att: null,
                                totalScore: 0,
                                subjectIds: new Set([mark.subject.id])
                            };
                        }
                        groupedMarks[baseName].subjectIds.add(mark.subject.id);

                        const score = mark.totalScore;
                        const att = mark.attendancePercentage;

                        if (mark.cieType === 'CIE1') { groupedMarks[baseName].cie1Score = score; groupedMarks[baseName].cie1Att = att; }
                        else if (mark.cieType === 'CIE2') { groupedMarks[baseName].cie2Score = score; groupedMarks[baseName].cie2Att = att; }
                        else if (mark.cieType === 'CIE3') { groupedMarks[baseName].cie3Score = score; groupedMarks[baseName].cie3Att = att; }
                        else if (mark.cieType === 'CIE4') { groupedMarks[baseName].cie4Score = score; groupedMarks[baseName].cie4Att = att; }
                        else if (mark.cieType === 'CIE5') { groupedMarks[baseName].cie5Score = score; groupedMarks[baseName].cie5Att = att; }
                    });

                    Object.values(groupedMarks).forEach(item => {
                        item.totalScore = (item.cie1Score || 0) + (item.cie2Score || 0) + (item.cie3Score || 0) + (item.cie4Score || 0) + (item.cie5Score || 0);
                    });

                    setRealMarks(Object.values(groupedMarks));

                    // Aggregate stats for profile
                    const recordsWithMarks = data.filter(m => m.totalScore != null && m.totalScore > 0);
                    const totalMarks = recordsWithMarks.reduce((sum, m) => sum + (m.totalScore || 0), 0);
                    const totalMaxMarks = recordsWithMarks.reduce((sum, m) => sum + (m.subject?.maxMarks || 50), 0);
                    const aggregatePercentage = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(1) : 0;
                    let avgScore25 = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 25) : 0;

                    if (data.length > 0) {
                        const s = data[0].student;
                        setStudentInfo(prev => ({
                            ...prev,
                            name: s.name,
                            rollNo: s.regNo,
                            branch: s.department,
                            semester: s.semester,
                            cgpa: aggregatePercentage,
                            avgCieScore: `${avgScore25}/25`,
                            parentPhone: s.parentPhone
                        }));
                        setSelectedSemester(s.semester.toString());
                    } else {
                        // Fetch profile if no marks
                        try {
                            const profileRes = await fetch(`${API_BASE_URL}/student/profile`, { headers: { 'Authorization': `Bearer ${user.token}` } });
                            if (profileRes.ok) {
                                const s = await profileRes.json();
                                setStudentInfo(prev => ({
                                    ...prev,
                                    name: s.name,
                                    rollNo: s.regNo,
                                    branch: s.department,
                                    semester: s.semester,
                                    parentPhone: s.parentPhone
                                }));
                                setSelectedSemester(s.semester.toString());
                            }
                        } catch (e) { console.error("Failed to fetch student profile", e); }
                    }
                    const uniqueCIEs = new Set(data.filter(m => m.totalScore != null && m.totalScore > 0).map(m => m.cieType));
                    setCieStatus(`${uniqueCIEs.size}/5`);
                }
            } catch (error) {
                console.error("Failed to fetch marks", error);
            }
        };

        const loadSemesterStatus = async () => {
            const status = await fetchSemesterStatus();
            if (status) setSemesterStatus(status.status);
        };

        fetchMarks();
        loadSemesterStatus();

        const fetchUpdates = async () => {
            if (!user || !user.token) return;
            try {
                const subRes = await fetch(`${API_BASE_URL}/student/subjects`, { headers: { 'Authorization': `Bearer ${user.token}` } });
                if (subRes.ok) {
                    const subData = await subRes.json();

                    // Group subjects by base name
                    const mergedSubjects = {};
                    subData.forEach(s => {
                        const baseName = s.name.replace(/\s*[\(\[]?(Theory|Lab|T|L|Theory\s+Exam|Practical)[\)\]]?\s*$/i, '').trim();
                        if (!mergedSubjects[baseName]) {
                            mergedSubjects[baseName] = {
                                id: s.id,
                                name: baseName,
                                code: s.code.replace(/[-(\s]+(T|L|Theory|Lab)$/i, '').trim(),
                                department: s.department,
                                semester: s.semester
                            };
                        }
                    });
                    setRealSubjects(Object.values(mergedSubjects));
                }

                const annRes = await fetch(`${API_BASE_URL}/cie/student/announcements`, { headers: { 'Authorization': `Bearer ${user.token}` } });
                if (annRes.ok) {
                    const anns = await annRes.json();
                    setUpcomingExams(anns.map(a => ({
                        id: a.id, exam: `CIE-${a.cieNumber}`, subject: a.subject?.name || 'Subject', date: a.scheduledDate, time: a.startTime ? a.startTime.substring(0, 5) : 'TBD', duration: a.durationMinutes + ' mins', room: a.examRoom || 'TBD', instructions: a.instructions, syllabus: a.syllabusCoverage
                    })));
                }
                const notifRes = await fetch(`${API_BASE_URL}/cie/student/notifications`, { headers: { 'Authorization': `Bearer ${user.token}` } });
                if (notifRes.ok) {
                    const notifs = await notifRes.json();
                    const filteredNotifs = notifs.filter(n => !n.message.includes("Welcome to the IA Management System") && n.type !== 'EXAM_SCHEDULE');
                    setNotifications(filteredNotifs.map(n => ({
                        id: n.id, message: n.message, time: new Date(n.createdAt).toLocaleDateString(), type: (n.type === 'CIE_ANNOUNCEMENT' || n.type === 'EXAM_SCHEDULE') ? 'info' : 'alert', isRead: n.isRead
                    })));
                    setUnreadCount(filteredNotifs.filter(n => !n.isRead).length);
                } else { setNotifications([]); }
            } catch (e) { console.error("Error fetching updates:", e); } finally { setLoadingAnnouncements(false); }
            try {
                const facRes = await fetch(`${API_BASE_URL}/student/faculty`, { headers: { 'Authorization': `Bearer ${user.token}` } });
                if (facRes.ok) { const facData = await facRes.json(); setFacultyList(facData); }
            } catch (e) { console.error("Error fetching faculty:", e); }
        };

        fetchUpdates();
    }, [user]);

    const [selectedSemester, setSelectedSemester] = useState('5');
    const [selectedCIE, setSelectedCIE] = useState('All');

    const menuItems = [
        { label: 'Overview', path: '/dashboard/student', icon: <LayoutDashboard size={20} />, isActive: activeSection === 'Overview', onClick: () => setActiveSection('Overview') },
        { label: 'CIE Marks', path: '/dashboard/student', icon: <FileText size={20} />, isActive: activeSection === 'CIE Marks', onClick: () => setActiveSection('CIE Marks') },

        { label: 'Subjects', path: '/dashboard/student', icon: <Book size={20} />, isActive: activeSection === 'Subjects', onClick: () => setActiveSection('Subjects') },
        { label: 'Faculty', path: '/dashboard/student', icon: <User size={20} />, isActive: activeSection === 'Faculty', onClick: () => setActiveSection('Faculty') },
        { label: 'Syllabus Topics', path: '/dashboard/student', icon: <BookOpen size={20} />, isActive: activeSection === 'Syllabus Topics', onClick: () => setActiveSection('Syllabus Topics') },
        { label: 'Notifications', path: '/dashboard/student', icon: <Bell size={20} />, isActive: activeSection === 'Notifications', onClick: () => setActiveSection('Notifications') },
    ];

    const showToast = (message) => { setToast({ show: true, message }); setTimeout(() => setToast({ show: false, message: '' }), 3000); };
    const handleDownload = () => window.print();
    const getStatus = (marks, max) => {
        const percentage = (marks / max) * 100; // Fixed percentage calc
        if (percentage >= 90) return { label: 'Distinction', color: 'var(--success)', bg: 'rgba(22, 163, 74, 0.1)' };
        if (percentage >= 75) return { label: 'First Class', color: 'var(--secondary)', bg: 'rgba(59, 130, 246, 0.1)' };
        if (percentage >= 60) return { label: 'Second Class', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' };
        return { label: 'At Risk', color: 'var(--danger)', bg: 'rgba(220, 38, 38, 0.1)' };
    };
    const getRemarks = (marks, max) => {
        const percentage = (marks / max) * 100;
        if (percentage >= 85) return "Excellent performance! Keep it up.";
        if (percentage >= 70) return "Good understanding. Focus on weak areas.";
        if (percentage >= 50) return "Average. Needs more consistent effort.";
        return "Critical: Please meet the faculty.";
    };

    // Typewriter Effect Logic
    const [typedText, setTypedText] = useState('');
    const welcomeMessage = `Welcome, ${studentInfo.name !== 'Loading...' ? studentInfo.name : 'Student'} 👋`;

    React.useEffect(() => {
        if (studentInfo.name === 'Loading...') return;
        let i = 0;
        setTypedText('');
        const typingInterval = setInterval(() => {
            if (i < welcomeMessage.length) {
                setTypedText(welcomeMessage.substring(0, i + 1));
                i++;
            } else {
                clearInterval(typingInterval);
            }
        }, 50); // Speed of typing
        return () => clearInterval(typingInterval);
    }, [studentInfo.name]);

    const renderOverview = () => {
        // Determine the latest CIE that has any marks across all subjects
        const cieKeys = [
            { key: 'cie5Score', att: 'cie5Att', label: 'CIE-5' },
            { key: 'cie4Score', att: 'cie4Att', label: 'CIE-4' },
            { key: 'cie3Score', att: 'cie3Att', label: 'CIE-3' },
            { key: 'cie2Score', att: 'cie2Att', label: 'CIE-2' },
            { key: 'cie1Score', att: 'cie1Att', label: 'CIE-1' },
        ];
        let latestCie = { key: 'cie1Score', att: 'cie1Att', label: 'CIE-1' }; // default
        for (const cie of cieKeys) {
            if (realMarks.some(m => m[cie.key] != null)) {
                latestCie = cie;
                break;
            }
        }

        return (
            <div className={styles.detailsContainer}>
                <div className={styles.contentGrid}>
                    <div className={styles.card} style={{ animationDelay: '0.2s' }}>
                        <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className={styles.cardTitle} style={{ margin: 0 }}>📑 Current Semester CIE Performance</h2>
                        </div>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead><tr><th>Subject</th><th>{latestCie.label}</th><th>Att %</th><th>Total Progress</th><th style={{ background: '#fefce8', color: '#a16207' }}>Remarks</th></tr></thead>
                                <tbody>
                                    {realSubjects.length > 0 ? realSubjects.map((sub, idx) => {
                                        const mark = realMarks.find(m => m.name === sub.name) || {};
                                        const total = mark.totalScore || 0;
                                        const maxMarks = 250;
                                        const cieScore = mark[latestCie.key];
                                        const cieAtt = mark[latestCie.att];
                                        const status = getStatus(cieScore || 0, 50);
                                        const progressWidth = Math.min((total / maxMarks) * 100, 100);

                                        return (
                                            <tr key={idx} style={{ animation: `fadeIn 0.4s ease-out ${idx * 0.1}s backwards` }}>
                                                <td><div className={styles.subjectCell}><span style={{ fontWeight: 600 }}>{sub.name}</span><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{sub.code}</span></div></td>
                                                <td>{cieScore != null ? cieScore + '/50' : '-'}</td>
                                                <td>{cieAtt != null ? cieAtt + '%' : '-'}</td>
                                                <td style={{ minWidth: '150px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                                                        <span>{total} / {maxMarks}</span>
                                                        <span style={{ fontWeight: 600 }}>{Math.round(progressWidth)}%</span>
                                                    </div>
                                                    <div className={styles.progressContainer}>
                                                        <div className={styles.progressBar} style={{ width: `${progressWidth}%`, background: status.color }}></div>
                                                    </div>
                                                </td>
                                                {(() => {
                                                    const score = cieScore != null ? parseFloat(cieScore) : null;
                                                    const att = cieAtt != null ? parseFloat(cieAtt) : null;
                                                    if (score == null) return <td style={{ width: '250px', minWidth: '250px', padding: 0 }}><div style={{ fontSize: '0.72rem', color: '#94a3b8', padding: '8px 4px' }}>-</div></td>;
                                                    let remark = ''; let color = '#64748b'; let bg = 'transparent';
                                                    if (score < 25 && att != null && att < 75) { remark = `${latestCie.label}: Marks & Att Low - Meet HOD`; color = '#dc2626'; bg = '#fef2f2'; }
                                                    else if (score < 25) { remark = `${latestCie.label}: Marks Low - Meet HOD`; color = '#ea580c'; bg = '#fff7ed'; }
                                                    else if (att != null && att < 75) { remark = `${latestCie.label}: Att Low - Meet HOD`; color = '#ea580c'; bg = '#fff7ed'; }
                                                    else if (score >= 40 && (att == null || att >= 75)) { remark = 'Excellent'; color = '#15803d'; bg = '#f0fdf4'; }
                                                    else { remark = 'Good'; color = '#2563eb'; bg = '#eff6ff'; }
                                                    return <td style={{ width: '250px', minWidth: '250px', padding: '8px 4px', background: bg }}>
                                                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color, whiteSpace: 'normal', wordWrap: 'break-word', lineHeight: '1.4' }}>{remark}</div>
                                                    </td>;
                                                })()}
                                            </tr>
                                        );
                                    }) : <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>Loading data...</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <AcademicInsights realMarks={realMarks} />
                </div>
            </div>
        );
    };

    // ... (rest of render functions remain mostly same but can benefit from global CSS updates)

    const downloadCIEMarks = (subjects, filter) => {
        let headers = ['Code', 'Subject'];
        if (filter === 'All') {
            headers.push('CIE-1', 'Att-1', 'CIE-2', 'Att-2', 'CIE-3', 'Att-3', 'CIE-4', 'Att-4', 'CIE-5', 'Att-5');
        } else {
            headers.push(filter, 'Attendance');
        }
        headers.push('Total');

        const rows = subjects.map(item => {
            const row = [item.code, `"${item.subject}"`];
            if (filter === 'All') {
                row.push(item.cie1, item.cie1Att, item.cie2, item.cie2Att, item.cie3, item.cie3Att, item.cie4, item.cie4Att, item.cie5, item.cie5Att);
            } else {
                let score = '-'; let att = '-';
                if (filter === 'CIE-1') { score = item.cie1; att = item.cie1Att; }
                else if (filter === 'CIE-2') { score = item.cie2; att = item.cie2Att; }
                else if (filter === 'CIE-3') { score = item.cie3; att = item.cie3Att; }
                else if (filter === 'CIE-4') { score = item.cie4; att = item.cie4Att; }
                else if (filter === 'CIE-5') { score = item.cie5; att = item.cie5Att; }
                row.push(score, att);
            }
            row.push(item.total);
            return row.join(',');
        });

        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CIE_Marks_${studentInfo.rollNo}_${filter.replace('-', '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const renderCIEMarks = () => {
        const theorySubjects = [];
        let hasDataForSelectedCIE = false;

        realSubjects.forEach(sub => {
            if (sub.semester && sub.semester.toString() !== selectedSemester) return;
            const mark = realMarks.find(m => m.name === sub.name) || {};

            if (selectedCIE === 'All') {
                if (mark.cie1Score != null || mark.cie2Score != null || mark.cie3Score != null || mark.cie4Score != null || mark.cie5Score != null) hasDataForSelectedCIE = true;
            } else {
                const check = (selectedCIE === 'CIE-1' && mark.cie1Score != null) ||
                    (selectedCIE === 'CIE-2' && mark.cie2Score != null) ||
                    (selectedCIE === 'CIE-3' && mark.cie3Score != null) ||
                    (selectedCIE === 'CIE-4' && mark.cie4Score != null) ||
                    (selectedCIE === 'CIE-5' && mark.cie5Score != null);
                if (check) hasDataForSelectedCIE = true;
            }

            const fmt = (val) => val != null ? val : '-';

            theorySubjects.push({
                code: sub.code,
                subject: sub.name,
                cie1: fmt(mark.cie1Score),
                cie2: fmt(mark.cie2Score),
                cie3: fmt(mark.cie3Score),
                cie4: fmt(mark.cie4Score),
                cie5: fmt(mark.cie5Score),
                cie1Att: fmt(mark.cie1Att),
                cie2Att: fmt(mark.cie2Att),
                cie3Att: fmt(mark.cie3Att),
                cie4Att: fmt(mark.cie4Att),
                cie5Att: fmt(mark.cie5Att),
                total: mark.totalScore || 0
            });
        });

        const isRestricted = (Number(selectedSemester) < Number(studentInfo.semester)) ||
            (semesterStatus === 'COMPLETED' && Number(selectedSemester) === Number(studentInfo.semester));

        return (
            <div className={styles.detailsContainer}>
                {isRestricted && (
                    <div className={styles.card} style={{ marginBottom: '1rem', background: '#fefce8', borderLeft: '4px solid #eab308' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem' }}>
                            <AlertCircle size={20} style={{ color: '#a16207' }} />
                            <span style={{ color: '#854d0e', fontSize: '0.9rem', fontWeight: 500 }}>
                                {Number(selectedSemester) < Number(studentInfo.semester)
                                    ? `Semester ${selectedSemester} is archived. Displaying Total Marks only.`
                                    : "The current semester is completed. Displaying Total Marks only."}
                            </span>
                        </div>
                    </div>
                )}
                <div className={styles.card} style={{ marginBottom: '1.5rem', animationDelay: '0.1s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div className={styles.selectionRow} style={{ flex: 1 }}>
                            <div className={styles.selectionGroup}><label className={styles.selectionLabel}>Select Semester:</label><select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className={styles.filterSelect}>{[1, 2, 3, 4, 5, 6, 7, 8].map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}</select></div>
                            <div className={styles.selectionGroup}><label className={styles.selectionLabel}>Select Internals:</label>
                                <select value={selectedCIE} onChange={(e) => setSelectedCIE(e.target.value)} className={styles.filterSelect}>
                                    <option value="All">All Internals</option>
                                    <option value="CIE-1">CIE-1</option>
                                    <option value="CIE-2">CIE-2</option>
                                    <option value="CIE-3">CIE-3 Skill Test 1</option>
                                    <option value="CIE-4">CIE-4 Skill Test 2</option>
                                    <option value="CIE-5">CIE-5 Activities</option>
                                </select>
                            </div>
                        </div>
                        <button onClick={() => downloadCIEMarks(theorySubjects, selectedCIE)} className={styles.actionBtn} style={{ padding: '0.5rem 1rem' }}><Download size={16} /> Download CSV</button>
                    </div>
                </div>

                {!hasDataForSelectedCIE && selectedCIE !== 'All' ? (
                    <div className={styles.card} style={{ animationDelay: '0.2s', textAlign: 'center', padding: '3rem' }}>
                        <div style={{ background: '#fef2f2', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', color: '#ef4444' }}><AlertCircle size={32} /></div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>No Marks Uploaded Yet</h3>
                        <p style={{ color: '#6b7280', maxWidth: '400px', margin: '0 auto' }}>
                            The faculty has not uploaded marks for <span style={{ fontWeight: '600', color: '#374151' }}>{selectedCIE}</span>. Please check back later.
                        </p>
                    </div>
                ) : (
                    <div className={styles.card} style={{ animationDelay: '0.2s' }}>
                        <div className={styles.cardHeader}><h2 className={styles.cardTitle}>📘 Subjects</h2></div>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        {selectedCIE === 'All' ? (
                                            <>
                                                <th>CIE-1</th><th>Att</th>
                                                <th>CIE-2</th><th>Att</th>
                                                <th>CIE-3</th><th>Att</th>
                                                <th>CIE-4</th><th>Att</th>
                                                <th>CIE-5</th><th>Att</th>
                                            </>
                                        ) : (
                                            <><th>Marks ({selectedCIE})</th><th>Attendance</th></>
                                        )}
                                        <th>Total (250)</th>
                                        <th style={{ background: '#fefce8', color: '#a16207' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {theorySubjects.map((row, idx) => {
                                        const status = getStatus(row.total, 250);
                                        return (
                                            <tr key={idx} style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.05}s backwards` }}>
                                                <td><div className={styles.subjectCell}><span style={{ fontWeight: 600 }}>{row.subject}</span><span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.code}</span></div></td>
                                                {selectedCIE === 'All' ? (
                                                    <>
                                                        <td>{row.cie1 !== '-' ? row.cie1 + '/50' : '-'}</td><td><span style={{ fontSize: '0.72rem' }}>{row.cie1Att !== '-' ? row.cie1Att + '%' : '-'}</span></td>
                                                        <td>{row.cie2 !== '-' ? row.cie2 + '/50' : '-'}</td><td><span style={{ fontSize: '0.72rem' }}>{row.cie2Att !== '-' ? row.cie2Att + '%' : '-'}</span></td>
                                                        <td>{row.cie3 !== '-' ? row.cie3 + '/50' : '-'}</td><td><span style={{ fontSize: '0.72rem' }}>{row.cie3Att !== '-' ? row.cie3Att + '%' : '-'}</span></td>
                                                        <td>{row.cie4 !== '-' ? row.cie4 + '/50' : '-'}</td><td><span style={{ fontSize: '0.72rem' }}>{row.cie4Att !== '-' ? row.cie4Att + '%' : '-'}</span></td>
                                                        <td>{row.cie5 !== '-' ? row.cie5 + '/50' : '-'}</td><td><span style={{ fontSize: '0.72rem' }}>{row.cie5Att !== '-' ? row.cie5Att + '%' : '-'}</span></td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td>{(() => { const score = selectedCIE === 'CIE-1' ? row.cie1 : selectedCIE === 'CIE-2' ? row.cie2 : selectedCIE === 'CIE-3' ? row.cie3 : selectedCIE === 'CIE-4' ? row.cie4 : row.cie5; return score !== '-' ? score + '/50' : '-'; })()}</td>
                                                        <td>{selectedCIE === 'CIE-1' ? (row.cie1Att !== '-' ? row.cie1Att + '%' : '-') : selectedCIE === 'CIE-2' ? (row.cie2Att !== '-' ? row.cie2Att + '%' : '-') : selectedCIE === 'CIE-3' ? (row.cie3Att !== '-' ? row.cie3Att + '%' : '-') : selectedCIE === 'CIE-4' ? (row.cie4Att !== '-' ? row.cie4Att + '%' : '-') : (row.cie5Att !== '-' ? row.cie5Att + '%' : '-')}</td>
                                                    </>
                                                )}
                                                <td style={{ fontWeight: 700, color: 'var(--accent-indigo)' }}>{row.total} / 250</td>
                                                <td><span className={styles.badge} style={{ background: `${status.color}15`, color: status.color }}>{status.label}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };



    // ... (rest of the file as is, just wrapped in render)

    const renderSubjects = () => (
        <div className={styles.detailsContainer}>
            <div className={styles.card} style={{ animationDelay: '0.1s' }}>
                <div className={styles.cardHeader}><h2 className={styles.cardTitle}>📚 Registered Subjects</h2></div>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead><tr><th>Code</th><th>Subject Name</th><th>Department</th><th>Semester</th></tr></thead>
                        <tbody>
                            {realSubjects.length > 0 ? realSubjects.map((sub, idx) => (
                                <tr key={idx} style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.05}s backwards` }}>
                                    <td><span className={styles.codeBadge}>{sub.code}</span></td>
                                    <td><span style={{ fontWeight: 600 }}>{sub.name}</span></td>
                                    <td>{sub.department}</td><td>{sub.semester}</td>
                                </tr>
                            )) : <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No subjects found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderFaculty = () => (
        <div className={styles.detailsContainer}>
            <div className={styles.facultyGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', animation: 'fadeIn 0.8s ease-out' }}>
                {facultyList.length > 0 ? facultyList.map((fac, idx) => (
                    <div key={idx} className={styles.facultyCard} style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s backwards` }}>
                        <div style={{ width: '64px', height: '64px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#3b82f6', border: '1px solid #bfdbfe' }}><User size={32} /></div>
                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: '700' }}>{fac.name}</h3>
                        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.8 }}>{fac.department} Department</p>
                        <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', margin: '0.75rem 0' }}></div>
                        <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.9 }}><span style={{ fontWeight: 600 }}>Teaches:</span> {fac.subjects}</p>
                        {fac.email && <a href={`mailto:${fac.email}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontSize: '0.85rem', textDecoration: 'none', marginTop: 'auto', fontWeight: '500' }}><Mail size={14} /> Contact</a>}
                    </div>
                )) : <div style={{ textAlign: 'center', padding: '3rem', width: '100%', gridColumn: '1/-1' }}><p>No faculty details available.</p></div>}
            </div>
        </div>
    );

    const renderSyllabusTopics = () => {
        const updates = upcomingExams.filter(exam => exam.syllabus && exam.syllabus.trim() !== '');
        return (
            <div className={styles.detailsContainer}>
                <div className={styles.card} style={{ animationDelay: '0.1s' }}>
                    <h2 className={styles.cardTitle}>📖 Syllabus Notifications</h2>
                    {updates.length === 0 ? <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No syllabus updates.</p> :
                        <div className={styles.notificationsList}>
                            {updates.map((item, idx) => (
                                <div key={idx} className={styles.notifItem} style={{ borderLeft: '4px solid #3b82f6', background: '#eff6ff', padding: '1rem', marginBottom: '1rem', borderRadius: '8px', animation: `slideUp 0.4s ease-out ${idx * 0.1}s backwards` }}>
                                    <div className={styles.notifContent}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <div><span style={{ fontWeight: '600', color: '#1e40af', display: 'block' }}>{item.subject}</span><span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{item.exam}</span></div>
                                        </div>
                                        <div style={{ background: 'white', padding: '0.75rem', borderRadius: '6px', border: '1px solid #dbeafe' }}><p style={{ color: '#334155', margin: 0 }}>{item.syllabus}</p></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                </div>
            </div>
        );
    };

    const renderNotifications = () => (
        <div className={styles.detailsContainer}>
            {/* Upcoming Exams Section in Notifications Tab */}
            <div className={styles.card} style={{ animationDelay: '0.05s', marginBottom: '1.5rem' }}>
                <h2 className={styles.cardTitle}>📅 Upcoming Exams</h2>
                <div className={styles.examsList}>
                    {loadingAnnouncements ? <p>Loading schedule...</p> : upcomingExams.length > 0 ? upcomingExams.map((exam, idx) => (
                        <div key={exam.id} className={styles.examItem} style={{ animationDelay: `${0.1 * idx}s` }}>
                            <div className={styles.examBadge}>{exam.exam}</div>
                            <div className={styles.examInfo}><span className={styles.examSubject}>{exam.subject}</span><span className={styles.examDate}><Calendar size={12} /> {exam.date} • {exam.time} • Room: {exam.room}</span></div>
                            <Clock size={16} className={styles.examIcon} />
                        </div>
                    )) : <p style={{ color: '#6b7280', padding: '1rem' }}>No upcoming exams scheduled.</p>}
                </div>
            </div>

            {/* General Notifications Section */}
            <div className={styles.card} style={{ animationDelay: '0.1s' }}>
                <h2 className={styles.cardTitle}>🔔 General Notifications</h2>
                <div className={styles.notificationsList} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    {notifications.length > 0 ? notifications.map((notif, idx) => (
                        <div key={notif.id} className={styles.notifItem} style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            background: notif.type === 'alert' ? '#fef2f2' : '#f0f9ff',
                            border: `1px solid ${notif.type === 'alert' ? '#fecaca' : '#bae6fd'}`,
                            display: 'flex',
                            gap: '1rem',
                            animation: `slideUp 0.3s ease-out ${idx * 0.1}s backwards`
                        }}>
                            <div style={{ color: notif.type === 'alert' ? '#dc2626' : '#0284c7' }}>
                                {notif.type === 'alert' ? <AlertCircle size={24} /> : <Bell size={24} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: '0 0 0.5rem 0', color: '#334155', lineHeight: '1.5' }}>{notif.message}</p>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{notif.time}</span>
                            </div>
                        </div>
                    )) : (
                        <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No new notifications.</p>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <DashboardLayout menuItems={menuItems}>
            <div className={styles.dashboardContainer}>
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.welcomeText}>
                            {activeSection === 'Overview' ?
                                <span className={styles.typewriter}>{typedText}</span>
                                : activeSection}
                        </h1>
                        <p className={styles.subtitle}>{studentInfo.branch} | Semester: {studentInfo.semester} | Reg No: {studentInfo.rollNo}</p>
                    </div>
                </header>

                {activeSection === 'Overview' && (
                    <AcademicSummary
                        studentInfo={studentInfo}
                        cieStatus={cieStatus}
                        // Risk Logic: High if Aggregate < 40 OR Attendance < 75. Moderate if Aggregate < 60. Else Low.
                        riskLevel={
                            (parseFloat(studentInfo.cgpa) < 40) ? 'High' :
                                parseFloat(studentInfo.cgpa) < 60 ? 'Moderate' : 'Low'
                        }
                    />
                )}

                {activeSection === 'Overview' && renderOverview()}
                {activeSection === 'CIE Marks' && renderCIEMarks()}

                {activeSection === 'Subjects' && renderSubjects()}
                {activeSection === 'Faculty' && renderFaculty()}
                {activeSection === 'Syllabus Topics' && renderSyllabusTopics()}
                {activeSection === 'Notifications' && renderNotifications()}

                {toast.show && <div className={styles.toast}>{toast.message}</div>}
            </div>
        </DashboardLayout>
    );
};
export default StudentDashboard;
