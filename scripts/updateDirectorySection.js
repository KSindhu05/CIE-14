const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'HACKER', 'Desktop', 'Ia_management_system_final', 'src', 'components', 'dashboard', 'principal', 'DirectorySection.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add missing imports
code = code.replace(
    /import { Search, Filter, Mail, Phone, MoreVertical, X, CheckCircle, Clock, BookOpen, User, Download(.*?)} from 'lucide-react';/,
    "import { Search, Filter, Mail, Phone, MoreVertical, X, CheckCircle, Clock, BookOpen, User, Download, Award, ClipboardList, AlertTriangle$1} from 'lucide-react';"
);

// 2. Add State inside component
const stateInjection = `
    const [selectedMarksSubject, setSelectedMarksSubject] = useState('ALL');
    const [selectedCieType, setSelectedCieType] = useState('all');
    const [perfTab, setPerfTab] = useState('low');
    const [perfSubjectFilter, setPerfSubjectFilter] = useState('All');
    const [perfCieFilter, setPerfCieFilter] = useState('All');

    const derivedSubjects = useMemo(() => {
        const subjs = new Set();
        apiStudents.forEach(s => {
            if ((semester === 'all' || s.semester == semester) && s.subjectMarks) {
                Object.keys(s.subjectMarks).forEach(k => subjs.add(k));
            }
        });
        return Array.from(subjs).filter(name => name !== 'IC').map(name => ({ id: name, name, cleanName: name.replace(/\\[.*?\\]/g, '').trim() }));
    }, [apiStudents, semester]);

    const perfConfig = { excellent_threshold: 40, average_threshold_min: 20 };
    
    const processedPerfData = useMemo(() => {
        let excellent = [], average = [], low = [], passed = [];
        paginatedStudents.forEach(student => {
            const m = student.subjectMarks || {};
            let hasAddedToPass = false;
            let totalA = 0, totalP = 0;
            
            Object.entries(m).forEach(([subjName, sm]) => {
                ['cie1', 'cie2', 'cie3', 'cie4', 'cie5'].forEach(cieType => {
                    const score = sm[cieType];
                    if (score !== undefined && score !== null && score !== '') {
                        const scoreNum = parseFloat(score);
                        const entry = { ...student, subject: subjName, subjectClean: subjName.replace(/\\[.*?\\]/g, '').trim(), cieType: cieType.toUpperCase(), score: scoreNum };
                        if (scoreNum >= perfConfig.excellent_threshold) excellent.push(entry);
                        else if (scoreNum >= perfConfig.average_threshold_min) average.push(entry);
                        else low.push(entry);
                    }
                });
                totalA += (sm.cie1 || 0) + (sm.cie2 || 0) + (sm.cie3 || 0) + (sm.cie4 || 0) + (sm.cie5 || 0);
                totalP += (sm.cie1 !== undefined ? 1 : 0) + (sm.cie2 !== undefined ? 1 : 0) + (sm.cie3 !== undefined ? 1 : 0) + (sm.cie4 !== undefined ? 1 : 0) + (sm.cie5 !== undefined ? 1 : 0);
            });
            const pct = (totalP * 50) > 0 ? (totalA / (totalP * 50)) : 0;
            if (pct >= 0.4 && Object.keys(m).length > 0) passed.push({ ...student, score: Math.round(pct * 100) + '%' });
        });
        return { excellent, average, low, passed };
    }, [paginatedStudents]);
`;
// find where to inject state
code = code.replace(/(const \[internalSelectedStudent, setInternalSelectedStudent\] = useState\(null\);)/, "$1\n" + stateInjection);


// 3. Replace Marks Tab Render Code
const marksRegex = /\{viewMode === 'marks' && \(\s*<table className=\{styles\.table\}[\s\S]*?<\/table>\s*\)\}/;
const newMarksRender = `
                {viewMode === 'marks' && (
                    <div className={styles.sectionContainer} style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem', fontWeight: 600 }}>Student Marks Directory</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>View detailed CIE marks for {selectedDept?.id} department. Showing {paginatedStudents.length} students.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <select className={styles.filterSelect} value={selectedMarksSubject} onChange={e => setSelectedMarksSubject(e.target.value)}>
                                    <option value="ALL">All Subjects Overview</option>
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
                                                <th style={{ background: '#f8fafc', width: '50px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'center' }}>Sl. No.</th>
                                                <th style={{ background: '#f8fafc', width: '120px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Reg No</th>
                                                <th style={{ background: '#f8fafc', width: '220px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>Student Name</th>
                                                {derivedSubjects.map(sub => (
                                                    <th key={sub.id} style={{ textAlign: 'center', background: '#e2e8f0', color: '#0f172a', borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '8px' }}>
                                                        <div style={{ fontSize: '0.85rem' }}>{sub.cleanName}</div>
                                                    </th>
                                                ))}
                                                <th style={{ width: '150px', backgroundColor: '#fefce8', color: '#a16207', borderBottom: '1px solid #cbd5e1', borderLeft: '1px solid #cbd5e1', textAlign: 'center' }}>Overall Avg</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedStudents.length > 0 ? paginatedStudents.map((student, index) => {
                                                const m = student.subjectMarks || {};
                                                let grandTotal = 0, grandCount = 0;
                                                return (
                                                    <tr key={student.id} onClick={() => handleViewProfile(student)} style={{ cursor: 'pointer', background: selectedStudents.includes(student.id) ? '#f0f9ff' : 'transparent', transition: 'background 0.2s' }}>
                                                        <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>{index + 1}</td>
                                                        <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>{student.regNo || student.rollNo}</td>
                                                        <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>{student.name}</td>
                                                        {derivedSubjects.map(sub => {
                                                            const sm = m[sub.id] || {};
                                                            let c1 = sm.cie1!==undefined?sm.cie1:0, c2=sm.cie2!==undefined?sm.cie2:0, c3=sm.cie3!==undefined?sm.cie3:0, c4=sm.cie4!==undefined?sm.cie4:0, c5=sm.cie5!==undefined?sm.cie5:0;
                                                            let count = (sm.cie1!==undefined?1:0)+(sm.cie2!==undefined?1:0)+(sm.cie3!==undefined?1:0)+(sm.cie4!==undefined?1:0)+(sm.cie5!==undefined?1:0);
                                                            let subTotal = c1+c2+c3+c4+c5;
                                                            if (count > 0) { grandTotal += subTotal; grandCount += count; }
                                                            const avgText = count > 0 ? Math.round(subTotal/count) + ' / 50' : '-';
                                                            return (
                                                                <td key={sub.id} style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', color: (count > 0 && Math.round(subTotal/count) < 20) ? '#ef4444' : '#1e293b' }}>
                                                                    {avgText}
                                                                </td>
                                                            );
                                                        })}
                                                        <td style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', borderLeft: '1px solid #e2e8f0', fontWeight: 'bold', backgroundColor: '#fefce8', color: grandCount > 0 && (grandTotal/grandCount) < 20 ? '#ef4444' : '#a16207' }}>
                                                            {grandCount > 0 ? Math.round(grandTotal/grandCount) + ' / 50' : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            }) : (
                                                <tr><td colSpan={derivedSubjects.length + 4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No students found.</td></tr>
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
                                                {['cie1', 'all'].includes(selectedCieType) && <th style={{ background: '#eff6ff', color: '#1d4ed8', borderRight: '1px solid #cbd5e1' }}>CIE-1 (50)</th>}
                                                {['cie2', 'all'].includes(selectedCieType) && <th style={{ background: '#eff6ff', color: '#1d4ed8', borderRight: '1px solid #cbd5e1' }}>CIE-2 (50)</th>}
                                                {['cie3', 'all'].includes(selectedCieType) && <th style={{ background: '#eff6ff', color: '#1d4ed8', borderRight: '1px solid #cbd5e1' }}>CIE-3 (50)</th>}
                                                {['cie4', 'all'].includes(selectedCieType) && <th style={{ background: '#eff6ff', color: '#1d4ed8', borderRight: '1px solid #cbd5e1' }}>CIE-4 (50)</th>}
                                                {['cie5', 'all'].includes(selectedCieType) && <th style={{ background: '#eff6ff', color: '#1d4ed8', borderRight: '1px solid #cbd5e1' }}>CIE-5 (50)</th>}
                                                <th rowSpan="2" style={{ textAlign: 'center', background: '#fefce8', color: '#a16207', borderBottom: '1px solid #cbd5e1' }}>Total</th>
                                            </tr>
                                            <tr>
                                                {['cie1', 'all'].includes(selectedCieType) && <th style={{ background: '#f0fdf4', color: '#15803d', borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '4px' }}>Att (%)</th>}
                                                {['cie2', 'all'].includes(selectedCieType) && <th style={{ background: '#f0fdf4', color: '#15803d', borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '4px' }}>Att (%)</th>}
                                                {['cie3', 'all'].includes(selectedCieType) && <th style={{ background: '#f0fdf4', color: '#15803d', borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '4px' }}>Att (%)</th>}
                                                {['cie4', 'all'].includes(selectedCieType) && <th style={{ background: '#f0fdf4', color: '#15803d', borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '4px' }}>Att (%)</th>}
                                                {['cie5', 'all'].includes(selectedCieType) && <th style={{ background: '#f0fdf4', color: '#15803d', borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '4px' }}>Att (%)</th>}
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
                                                            <>
                                                                <td style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9', fontWeight: 600 }}>{sm.cie1 !== undefined ? sm.cie1 : '-'}</td>
                                                                <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>{sm.cie1_att !== undefined ? sm.cie1_att + '%' : '-'}</td>
                                                            </>
                                                        )}
                                                        {['cie2', 'all'].includes(selectedCieType) && (
                                                            <>
                                                                <td style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9', fontWeight: 600 }}>{sm.cie2 !== undefined ? sm.cie2 : '-'}</td>
                                                                <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>{sm.cie2_att !== undefined ? sm.cie2_att + '%' : '-'}</td>
                                                            </>
                                                        )}
                                                        {['cie3', 'all'].includes(selectedCieType) && (
                                                            <>
                                                                <td style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9', fontWeight: 600 }}>{sm.cie3 !== undefined ? sm.cie3 : '-'}</td>
                                                                <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>{sm.cie3_att !== undefined ? sm.cie3_att + '%' : '-'}</td>
                                                            </>
                                                        )}
                                                        {['cie4', 'all'].includes(selectedCieType) && (
                                                            <>
                                                                <td style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9', fontWeight: 600 }}>{sm.cie4 !== undefined ? sm.cie4 : '-'}</td>
                                                                <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>{sm.cie4_att !== undefined ? sm.cie4_att + '%' : '-'}</td>
                                                            </>
                                                        )}
                                                        {['cie5', 'all'].includes(selectedCieType) && (
                                                            <>
                                                                <td style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9', fontWeight: 600 }}>{sm.cie5 !== undefined ? sm.cie5 : '-'}</td>
                                                                <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>{sm.cie5_att !== undefined ? sm.cie5_att + '%' : '-'}</td>
                                                            </>
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
`;
code = code.replace(marksRegex, newMarksRender);

// 4. Replace Performance Tab Render Code
const perfRegex = /\{viewMode === 'performance' && \(\s*<table className=\{styles\.table\}[\s\S]*?<\/table>\s*\)\}/;
const newPerfRender = `
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
                        { id: 'excellent', label: 'Excellent Performance', color: '#10b981', bg: '#f0fdf4', borderColor: '#bcf0da', icon: <Award size={20} />, list: filteredExcellent, studentCount: getUniqueStudentCount(filteredExcellent), description: \\\`Scored > \${perfConfig.excellent_threshold}/50 marks.\\\` },
                        { id: 'average', label: 'Average Performance', color: '#f59e0b', bg: '#fffbeb', borderColor: '#fde68a', icon: <ClipboardList size={20} />, list: filteredAverage, studentCount: getUniqueStudentCount(filteredAverage), description: \\\`Scored \${perfConfig.average_threshold_min} - \${perfConfig.excellent_threshold} marks.\\\` },
                        { id: 'low', label: 'Low Performance', color: '#ef4444', bg: '#fef2f2', borderColor: '#fecaca', icon: <AlertTriangle size={20} />, list: filteredLow, studentCount: getUniqueStudentCount(filteredLow), description: \\\`Scored < \${perfConfig.average_threshold_min} marks.\\\` },
                        { id: 'passedTarget', label: 'Passed Students', color: '#3b82f6', bg: '#eff6ff', borderColor: '#bfdbfe', icon: <CheckCircle size={20} />, list: filteredPassed, studentCount: getUniqueStudentCount(filteredPassed), description: 'Overall Pass Target Met' }
                    ];
                    
                    const activeConfig = perfTabs.find(t => t.id === perfTab) || perfTabs[2];
                    const filteredList = activeConfig.list;

                    return (
                        <div className={styles.sectionContainer} style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
                            
                            {/* Performance Tabs */}
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                {perfTabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setPerfTab(tab.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '0.6rem 1rem', borderRadius: '10px',
                                            border: perfTab === tab.id ? \\\`1px solid \${tab.color}\\\` : '1px solid #e2e8f0',
                                            background: perfTab === tab.id ? tab.bg : '#f8fafc',
                                            color: perfTab === tab.id ? tab.color : '#64748b',
                                            fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
                                            transition: 'all 0.2s', boxShadow: perfTab === tab.id ? \\\`0 2px 8px \${tab.color}30\\\` : 'none'
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
                            
                            <div style={{ padding: '1rem', background: activeConfig.bg, border: \\\`1px solid \${activeConfig.borderColor}\\\`, borderRadius: '8px', marginBottom: '1.5rem', color: activeConfig.color, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {activeConfig.icon}
                                <strong>{activeConfig.label} ({filteredList.length} records):</strong> {activeConfig.description}
                                <span style={{ marginLeft: 'auto', fontSize: '0.8rem', opacity: 0.8 }}>Unique Students: {activeConfig.studentCount}</span>
                            </div>
                            
                            <div className={styles.tableWrapper}>
                                <table className={styles.table} style={{ borderCollapse: 'collapse', width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ background: '#f8fafc', width: '60px', borderBottom: '1px solid #cbd5e1' }}>Sl. No</th>
                                            <th style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>Reg No</th>
                                            <th style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>Name</th>
                                            <th style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>Subject</th>
                                            <th style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>CIE Type</th>
                                            <th style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>Score</th>
                                            <th style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'center' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredList.length > 0 ? (
                                            filteredList.map((record, index) => (
                                            <tr key={\\\`\${record.id}-\${record.subject}-\${record.cieType}\\\`} onClick={() => handleViewProfile(record)} style={{ cursor: 'pointer', borderBottom: '1px solid #e2e8f0' }}>
                                                <td style={{ color: '#64748b', fontWeight: 500 }}>{index + 1}</td>
                                                <td>{record.regNo || record.rollNo}</td>
                                                <td style={{ fontWeight: 600 }}>{record.name}</td>
                                                <td><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>{record.subjectClean || record.subject}</span></td>
                                                <td><span style={{ fontWeight: 'bold', color: '#475569' }}>{record.cieType}</span></td>
                                                <td>
                                                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', background: activeConfig.bg, color: activeConfig.color, border: \\\`1px solid \${activeConfig.borderColor}\\\`, fontWeight: 'bold' }}>
                                                        {record.score} {record.cieType !== 'OVERALL' ? '/ 50' : ''}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button className={styles.secondaryBtn} onClick={(e) => { e.stopPropagation(); handleViewProfile(record); }} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>View Profile</button>
                                                </td>
                                            </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No {activeConfig.label.toLowerCase()} records found matching criteria.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })()}
`;
code = code.replace(perfRegex, newPerfRender);


fs.writeFileSync(filePath, code);
console.log("Successfully rebuilt components.");
