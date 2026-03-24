package com.example.ia.service;

import com.example.ia.entity.CieMark;
import com.example.ia.entity.FacultyAssignmentRequest;
import com.example.ia.entity.Student;
import com.example.ia.entity.Subject;
import com.example.ia.entity.User;
import com.example.ia.payload.response.FacultyClassAnalytics;
import com.example.ia.payload.response.SubjectWithRoleDto;
import com.example.ia.repository.CieMarkRepository;
import com.example.ia.repository.FacultyAssignmentRequestRepository;
import com.example.ia.repository.StudentRepository;
import com.example.ia.repository.SubjectRepository;
import com.example.ia.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.ia.entity.SystemConfig;
import com.example.ia.repository.SystemConfigRepository;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FacultyService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private CieMarkRepository cieMarkRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private FacultyAssignmentRequestRepository assignmentRequestRepository;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    // ---------------------------------------------------------------
    // Parse the comma-separated section field into a list of sections.
    // e.g. "A,B" → ["A", "B"]
    // ---------------------------------------------------------------
    private List<String> parseSections(User user) {
        if (user.getSection() == null || user.getSection().isBlank()) {
            return List.of();
        }
        return Arrays.stream(user.getSection().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    // ---------------------------------------------------------------
    // Returns students this faculty is allowed to see.
    // Home dept: uses faculty's own department + sections.
    // Cross-dept: filters by each approved request's dept + its sections.
    // ---------------------------------------------------------------
    public List<Student> getStudentsForFaculty(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null)
            return List.of();

        List<String> homeSections = parseSections(user);

        // Use faculty's own department as home department
        String homeDept = user.getDepartment();

        List<FacultyAssignmentRequest> approvedRequests = assignmentRequestRepository
                .findByFacultyId(user.getId());

        // Merge any sections explicitly requested for the home department
        Set<String> allHomeSections = new HashSet<>(homeSections);
        for (FacultyAssignmentRequest req : approvedRequests) {
            if ("APPROVED".equals(req.getStatus()) && homeDept != null && homeDept.equals(req.getTargetDepartment())) {
                if (req.getSections() != null && !req.getSections().isBlank()) {
                    Arrays.stream(req.getSections().split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .forEach(allHomeSections::add);
                }
            }
        }
        homeSections = new ArrayList<>(allHomeSections);

        List<Student> result = new ArrayList<>();
        Set<Long> addedIds = new HashSet<>();

        // 1. Home department students — only if faculty has subjects assigned
        String facultySubjects = user.getSubjects();
        boolean hasAssignments = facultySubjects != null && !facultySubjects.isBlank();
        if (homeDept != null && !homeDept.isBlank() && hasAssignments) {
            List<Student> homeStudents;
            if (!homeSections.isEmpty()) {
                homeStudents = studentRepository.findByDepartmentInAndSectionIn(
                        List.of(homeDept), new ArrayList<>(homeSections));
            } else {
                homeStudents = studentRepository.findByDepartment(homeDept);
            }
            for (Student s : homeStudents) {
                if (addedIds.add(s.getId()))
                    result.add(s);
            }
        }

        // 2. Cross-department students — use each request's own sections
        for (FacultyAssignmentRequest req : approvedRequests) {
            if (!"APPROVED".equals(req.getStatus()))
                continue;

            String dept = req.getTargetDepartment();
            if (dept == null || dept.isBlank())
                continue;

            // Parse request-specific sections
            List<String> reqSections = new ArrayList<>();
            if (req.getSections() != null && !req.getSections().isBlank()) {
                reqSections = Arrays.stream(req.getSections().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList());
            }

            List<Student> crossStudents;
            if (!reqSections.isEmpty()) {
                crossStudents = studentRepository.findByDepartmentInAndSectionIn(
                        List.of(dept), reqSections);
            } else {
                crossStudents = studentRepository.findByDepartment(dept);
            }
            for (Student s : crossStudents) {
                if (addedIds.add(s.getId()))
                    result.add(s);
            }
        }

        // Sort by registration number so sections always appear in A→B→C order
        result.sort((a, b) -> {
            String regA = a.getRegNo() != null ? a.getRegNo() : "";
            String regB = b.getRegNo() != null ? b.getRegNo() : "";
            return regA.compareToIgnoreCase(regB);
        });

        return result;
    }

    public List<com.example.ia.payload.response.StudentResponse> getStudentsForFacultyWithAnalytics(String username) {
        List<Student> students = getStudentsForFaculty(username);

        return students.stream().map(student -> {
            List<CieMark> marksList = cieMarkRepository.findByStudent_Id(student.getId());
            java.util.Map<String, Double> marksMap = new java.util.HashMap<>();
            java.util.Map<String, java.util.Map<String, Object>> subjectMarks = new java.util.HashMap<>();
            
            int cie1Count = 0;
            double totalCie1Marks = 0.0;

            for (CieMark mark : marksList) {
                // Determine key based on cieType (e.g., CIE1, CIE2)
                String key = mark.getCieType().toLowerCase().replaceAll("[^a-z0-9]", "");
                Double markValue = mark.getMarks() != null ? mark.getMarks() : 0.0;
                
                // Add to flat marksMap
                marksMap.put(key, marksMap.getOrDefault(key, 0.0) + markValue);
                
                // Add to subject-wise map
                String subName = mark.getSubject().getName();
                subjectMarks.putIfAbsent(subName, new java.util.HashMap<>());
                subjectMarks.get(subName).put(key, markValue);
                if (mark.getAttendancePercentage() != null) {
                    subjectMarks.get(subName).put(key + "_att", mark.getAttendancePercentage());
                }
                if (mark.getRemarks() != null && !mark.getRemarks().isEmpty()) {
                    subjectMarks.get(subName).put(key + "_remarks", mark.getRemarks());
                }

                // Count for CIE-1 completion
                if (key.equals("cie1") && mark.getMarks() != null) {
                    cie1Count++;
                    totalCie1Marks += markValue;
                }
            }
            
            // Direct lookup: get subjects for this student's department + semester
            java.util.List<Subject> subjects = java.util.List.of();
            if (student.getDepartment() != null && student.getSemester() != null) {
                subjects = subjectRepository.findByDepartmentAndSemester(
                    student.getDepartment(), student.getSemester());
            }
            
            // Filter out Lab duplicates
            java.util.Set<String> uniqueSubjectNames = subjects.stream()
                .map(s -> s.getName().replaceAll("(?i)\\s*[\\[\\(]?(Theory|Lab|T|L)[\\]\\)]?\\s*$", "").trim())
                .collect(java.util.stream.Collectors.toSet());
            int enrolledCount = uniqueSubjectNames.size();
            
            Boolean isCie1Complete = (enrolledCount > 0 && cie1Count >= enrolledCount);
            Double overallCie1Percentage = 0.0;
            
            if (cie1Count > 0) {
                overallCie1Percentage = (totalCie1Marks / (cie1Count * 50.0)) * 100.0;
            }
            
            return new com.example.ia.payload.response.StudentResponse(student, marksMap, subjectMarks, isCie1Complete, overallCie1Percentage);
        }).collect(java.util.stream.Collectors.toList());
    }

    public List<SubjectWithRoleDto> getSubjectsForFaculty(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null)
            return List.of();

        List<SubjectWithRoleDto> result = new ArrayList<>();
        Set<Long> addedIds = new HashSet<>();

        // 1. Home department subjects — filter by faculty's own department
        String homeDept = user.getDepartment();
        String homeCieRole = user.getCieRole(); // null = ALL
        if (user.getSubjects() != null && !user.getSubjects().isBlank() &&
                homeDept != null && !homeDept.isBlank()) {
            List<String> homeSubjectNames = Arrays.stream(user.getSubjects().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
            if (!homeSubjectNames.isEmpty()) {
                List<Subject> homeSubjects = subjectRepository.findByNameInAndDepartment(
                        homeSubjectNames, homeDept);
                for (Subject s : homeSubjects) {
                    if (addedIds.add(s.getId()))
                        result.add(new SubjectWithRoleDto(s, homeCieRole));
                }
            }
        }

        // 2. Cross-department subjects — use each approved request's cieRole
        List<FacultyAssignmentRequest> approvedRequests = assignmentRequestRepository
                .findByFacultyId(user.getId());
        for (FacultyAssignmentRequest req : approvedRequests) {
            if (!"APPROVED".equals(req.getStatus()) || req.getSubjects() == null)
                continue;

            List<String> crossSubjectNames = Arrays.stream(req.getSubjects().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
            if (!crossSubjectNames.isEmpty()) {
                List<Subject> crossSubjects = subjectRepository.findByNameInAndDepartment(
                        crossSubjectNames, req.getTargetDepartment());
                for (Subject s : crossSubjects) {
                    if (addedIds.add(s.getId()))
                        result.add(new SubjectWithRoleDto(s, req.getCieRole()));
                }
            }
        }

        return result;
    }

    public FacultyClassAnalytics getAnalytics(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        String department = user != null ? user.getDepartment() : null;

        // Fetch department-specific configurations
        double excellentThreshold = 40.0;
        double lowThreshold = 20.0;
        Map<Long, Double> subjectTargetsMap = new HashMap<>();
        
        if (department != null) {
            List<SystemConfig> configs = systemConfigRepository.findByDepartment(department);
            for (SystemConfig cfg : configs) {
                try {
                    if ("excellent_threshold".equals(cfg.getConfigKey())) {
                        excellentThreshold = Double.parseDouble(cfg.getConfigValue());
                    } else if ("low_threshold".equals(cfg.getConfigKey())) {
                        lowThreshold = Double.parseDouble(cfg.getConfigValue());
                    } else if ("subject_targets".equals(cfg.getConfigKey())) {
                        String targetsJson = cfg.getConfigValue();
                        if (targetsJson != null && !targetsJson.trim().isEmpty()) {
                            targetsJson = targetsJson.replace("{", "").replace("}", "").replace("\"", "").replace(" ", "");
                            if (!targetsJson.isEmpty()) {
                                String[] pairs = targetsJson.split(",");
                                for (String pair : pairs) {
                                    String[] kv = pair.split(":");
                                    if (kv.length == 2) {
                                        Long subId = Long.parseLong(kv[0]);
                                        Double targetPercent = Double.parseDouble(kv[1]);
                                        subjectTargetsMap.put(subId, (targetPercent / 100.0) * 50.0);
                                    }
                                }
                            }
                        }
                    }
                } catch (Exception ignored) {}
            }
        }

        List<Student> allowedStudents = getStudentsForFaculty(username);
        Set<Long> allowedStudentIds = allowedStudents.stream().map(Student::getId).collect(Collectors.toSet());

        List<SubjectWithRoleDto> subjects = getSubjectsForFaculty(username);
        double totalScore = 0;
        int scoredCount = 0;
        int low = 0;
        int top = 0;
        Set<Long> uniqueStudents = new HashSet<>();
        List<FacultyClassAnalytics.PerformanceRecord> excellentList = new ArrayList<>();
        List<FacultyClassAnalytics.PerformanceRecord> averageList = new ArrayList<>();
        List<FacultyClassAnalytics.PerformanceRecord> lowList = new ArrayList<>();

        for (SubjectWithRoleDto sub : subjects) {
            List<CieMark> marks = cieMarkRepository.findBySubject_Id(sub.getId());
            for (CieMark mark : marks) {
                if (mark.getStudent() == null)
                    continue;

                // Skip students not in the faculty's allowed list
                if (!allowedStudentIds.contains(mark.getStudent().getId())) {
                    continue;
                }

                uniqueStudents.add(mark.getStudent().getId());

                if (mark.getMarks() != null && mark.getMarks() >= 0) {
                    double score = mark.getMarks();
                    totalScore += score;
                    scoredCount++;

                    FacultyClassAnalytics.PerformanceRecord record = new FacultyClassAnalytics.PerformanceRecord(
                            mark.getStudent().getRegNo(), mark.getStudent().getName(), sub.getName(),
                            mark.getCieType(), score, mark.getAttendancePercentage(),
                            mark.getStudent().getParentPhone());

                    double currentLowThreshold = subjectTargetsMap.containsKey(sub.getId()) ? subjectTargetsMap.get(sub.getId()) : lowThreshold;
                    
                    if (score < currentLowThreshold) {
                        low++;
                        lowList.add(record);
                    } else if (score >= currentLowThreshold && score < excellentThreshold) {
                        averageList.add(record);
                    } else if (score >= excellentThreshold && score >= currentLowThreshold) {
                        top++;
                        excellentList.add(record);
                    }
                }
            }
        }

        int evaluated = uniqueStudents.size();
        int pending = allowedStudents.size() - evaluated;
        double avg = scoredCount > 0 ? Math.round((totalScore / scoredCount / 50.0 * 100) * 10.0) / 10.0 : 0;
        return new FacultyClassAnalytics(evaluated, pending, avg, low, top, allowedStudents.size(), excellentList,
                averageList, lowList);
    }

    public boolean isFacultyAssignedToSubjectAndStudent(String username, Long subjectId, Long studentId) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null)
            return false;

        // 1. Check if faculty teaches the subject
        List<SubjectWithRoleDto> assignedSubjects = getSubjectsForFaculty(username);
        boolean teachesSubject = assignedSubjects.stream().anyMatch(s -> s.getId().equals(subjectId));
        if (!teachesSubject)
            return false;

        // 2. If studentId is provided, check if student is in an allowed section for this faculty
        if (studentId != null) {
            List<Student> allowedStudents = getStudentsForFaculty(username);
            return allowedStudents.stream().anyMatch(s -> s.getId().equals(studentId));
        }

        return true;
    }

    /**
     * Checks if any of the requested subjects and sections are already assigned to
     * another faculty in the specified department.
     * @return null if available, or an error message if already assigned.
     */
    public String validateSubjectSectionAvailability(String department, String subjectsStr, String sectionsStr, Long excludeFacultyId) {
        if (department == null || department.isBlank() || subjectsStr == null || subjectsStr.isBlank()
                || sectionsStr == null || sectionsStr.isBlank()) {
            return null;
        }

        List<String> requestedSubjects = Arrays.stream(subjectsStr.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList());
        List<String> requestedSections = Arrays.stream(sectionsStr.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList());

        // 1. Check Home Department Faculties
        List<User> homeFaculties = userRepository.findByRoleAndDepartment("FACULTY", department);
        for (User faculty : homeFaculties) {
            if (excludeFacultyId != null && excludeFacultyId.equals(faculty.getId())) {
                continue;
            }
            if (faculty.getSubjects() == null || faculty.getSection() == null) continue;

            List<String> facSubjects = Arrays.stream(faculty.getSubjects().split(","))
                    .map(String::trim).collect(Collectors.toList());
            List<String> facSections = Arrays.stream(faculty.getSection().split(","))
                    .map(String::trim).collect(Collectors.toList());

            for (String sub : requestedSubjects) {
                if (facSubjects.contains(sub)) {
                    for (String sec : requestedSections) {
                        if (facSections.contains(sec)) {
                            return "Subject '" + sub + "' for section '" + sec + "' is already assigned to faculty '" + faculty.getFullName() + "'";
                        }
                    }
                }
            }
        }

        // 2. Check Approved Cross-Department Requests
        List<FacultyAssignmentRequest> approvedReqs = assignmentRequestRepository.findByTargetDepartmentAndStatus(department, "APPROVED");
        for (FacultyAssignmentRequest req : approvedReqs) {
            if (excludeFacultyId != null && excludeFacultyId.equals(req.getFacultyId())) {
                continue;
            }
            if (req.getSubjects() == null || req.getSections() == null) continue;

            List<String> reqSubjects = Arrays.stream(req.getSubjects().split(","))
                    .map(String::trim).collect(Collectors.toList());
            List<String> reqSections = Arrays.stream(req.getSections().split(","))
                    .map(String::trim).collect(Collectors.toList());

            for (String sub : requestedSubjects) {
                if (reqSubjects.contains(sub)) {
                    for (String sec : requestedSections) {
                        if (reqSections.contains(sec)) {
                            return "Subject '" + sub + "' for section '" + sec + "' is already assigned to faculty '" + req.getFacultyName() + "'";
                        }
                    }
                }
            }
        }

        return null;
    }
}
