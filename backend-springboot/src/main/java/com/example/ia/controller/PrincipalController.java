package com.example.ia.controller;

import com.example.ia.entity.Announcement;
import com.example.ia.entity.CieMark;
import com.example.ia.entity.Student;
import com.example.ia.entity.Attendance;
import com.example.ia.repository.AttendanceRepository;
import org.springframework.transaction.annotation.Transactional;

import com.example.ia.entity.Subject;
import com.example.ia.entity.User;
import com.example.ia.repository.AnnouncementRepository;
import com.example.ia.repository.CieMarkRepository;
import com.example.ia.repository.StudentRepository;
import com.example.ia.repository.SubjectRepository;
import com.example.ia.repository.UserRepository;
import com.example.ia.entity.Notification;
import com.example.ia.repository.NotificationRepository;
import com.example.ia.repository.FacultyAssignmentRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/principal")
public class PrincipalController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    AnnouncementRepository announcementRepository;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    SubjectRepository subjectRepository;

    @Autowired
    CieMarkRepository cieMarkRepository;

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    AttendanceRepository attendanceRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    FacultyAssignmentRequestRepository assignmentRequestRepository;

    @Autowired
    private com.example.ia.service.StudentService studentService;

    private static String semesterStatus = "ACTIVE";

    @GetMapping("/semester/status")
    public ResponseEntity<?> getSemesterStatus() {
        return ResponseEntity.ok(Map.of("status", semesterStatus));
    }

    @PutMapping("/semester/status")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public ResponseEntity<?> updateSemesterStatus(@RequestBody Map<String, String> statusData) {
        String newStatus = statusData.get("status");
        if (newStatus != null && (newStatus.equals("ACTIVE") || newStatus.equals("COMPLETED"))) {
            semesterStatus = newStatus;
            return ResponseEntity.ok(Map.of("status", semesterStatus));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid status"));
    }

    @PostMapping("/semester/reset-marks")
    @PreAuthorize("hasRole('PRINCIPAL')")
    @Transactional
    public ResponseEntity<?> resetMarks(@RequestBody Map<String, String> request) {
        String targetSemester = request.getOrDefault("semester", "All");
        if ("All".equalsIgnoreCase(targetSemester)) {
            cieMarkRepository.deleteAll();
            attendanceRepository.deleteAll();
            return ResponseEntity.ok(Map.of("message", "All CIE marks and attendance have been permanently wiped."));
        } else {
            Integer sem = Integer.parseInt(targetSemester);
            List<CieMark> marks = cieMarkRepository.findAll().stream()
                .filter(m -> m.getStudent() != null && sem.equals(m.getStudent().getSemester()))
                .collect(Collectors.toList());
            cieMarkRepository.deleteAll(marks);
            
            List<Attendance> atts = attendanceRepository.findAll().stream()
                .filter(a -> a.getStudent() != null && sem.equals(a.getStudent().getSemester()))
                .collect(Collectors.toList());
            attendanceRepository.deleteAll(atts);
            return ResponseEntity.ok(Map.of("message", "CIE marks and attendance for Semester " + sem + " have been wiped."));
        }
    }

    @PostMapping("/semester/reset-faculty")
    @PreAuthorize("hasRole('PRINCIPAL')")
    @Transactional
    public ResponseEntity<?> resetFaculty(@RequestBody Map<String, String> request) {
        String targetSemester = request.getOrDefault("semester", "All");
        boolean isAll = "All".equalsIgnoreCase(targetSemester);

        List<User> faculty = userRepository.findByRole("FACULTY");
        for (User f : faculty) {
            if (isAll) {
                f.setSubjects(null);
                f.setSemester(null);
                f.setSection(null);
                userRepository.save(f);
            } else {
                if (f.getSemester() != null && f.getSemester().contains(targetSemester)) {
                    String newSem = Arrays.stream(f.getSemester().split(","))
                            .map(String::trim)
                            .filter(s -> !s.equals(targetSemester))
                            .collect(Collectors.joining(", "));
                    f.setSemester(newSem.isEmpty() ? null : newSem);
                    userRepository.save(f);
                }
            }
        }

        List<Subject> allSubjects = subjectRepository.findAll();
        for (Subject s : allSubjects) {
            if (isAll || (s.getSemester() != null && s.getSemester().toString().equals(targetSemester))) {
                s.setInstructorName(null);
                subjectRepository.save(s);
            }
        }

        if (isAll) {
            assignmentRequestRepository.deleteAll();
        } else {
            List<com.example.ia.entity.FacultyAssignmentRequest> requests = assignmentRequestRepository.findAll().stream()
                    .filter(r -> targetSemester.equals(r.getSemester()))
                    .collect(Collectors.toList());
            assignmentRequestRepository.deleteAll(requests);
        }

        return ResponseEntity.ok(
                Map.of("message", "Faculty workloads, subject assignments, and assignment requests have been reset" + (isAll ? "." : " for Semester " + targetSemester + ".")));
    }

    @PostMapping("/semester/cleanup-data")
    @PreAuthorize("hasRole('PRINCIPAL')")
    @Transactional
    public ResponseEntity<?> cleanupData(@RequestBody Map<String, String> request) {
        String targetSemester = request.getOrDefault("semester", "All");
        boolean isAll = "All".equalsIgnoreCase(targetSemester);

        if (isAll) {
            notificationRepository.deleteAll();
            announcementRepository.deleteAll();
            attendanceRepository.deleteAll();
            return ResponseEntity.ok(Map.of("message", "Notifications, CIE schedules, and attendance records have been cleaned up."));
        } else {
            Integer sem = Integer.parseInt(targetSemester);
            
            List<Attendance> atts = attendanceRepository.findAll().stream()
                .filter(a -> a.getStudent() != null && sem.equals(a.getStudent().getSemester()))
                .collect(Collectors.toList());
            attendanceRepository.deleteAll(atts);
            
            List<Announcement> anns = announcementRepository.findAll().stream()
                .filter(a -> a.getSubject() != null && sem.equals(a.getSubject().getSemester()))
                .collect(Collectors.toList());
            announcementRepository.deleteAll(anns);
            
            return ResponseEntity.ok(Map.of("message", "CIE schedules and attendance for Semester " + sem + " have been cleaned up."));
        }
    }

    @PostMapping("/semester/shift")
    @PreAuthorize("hasRole('PRINCIPAL')")
    @Transactional
    public ResponseEntity<?> shiftSemesters(@RequestBody Map<String, String> request) {
        String fromSemStr = request.get("fromSemester");
        String toSemStr = request.get("toSemester");
        String targetSemester = request.getOrDefault("semester", "All");
        boolean isAll = "All".equalsIgnoreCase(targetSemester);

        if (fromSemStr != null && toSemStr != null) {
            // Granular Shift: From X to Y (Atomic)
            Integer fromSem = Integer.parseInt(fromSemStr);
            Integer toSem = Integer.parseInt(toSemStr);
            int count = studentRepository.updateSemester(fromSem, toSem);
            return ResponseEntity.ok(Map.of("message", "Shifted " + count + " students from Semester " + fromSem + " to " + toSem + "."));
        } else {
            // Sequential Shift: All or Target -> Target+1 (Atomic)
            int count;
            if (isAll) {
                count = studentRepository.shiftAllSemesters();
            } else {
                try {
                    count = studentRepository.shiftSpecificSemester(Integer.parseInt(targetSemester));
                } catch (NumberFormatException e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid semester format"));
                }
            }
            return ResponseEntity.ok(Map.of("message", "Shifted " + count + " students to the next semester."));
        }
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public ResponseEntity<?> getDashboard() {
        System.out.println("DEBUG: Principal Dashboard Endpoint Hit");
        try {
            String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
                    .getAuthentication().getName();
            System.out.println("DEBUG: Authenticated user: " + username);
            System.out.println("DEBUG: Authorities: " + org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication().getAuthorities());
        } catch (Exception e) {
            System.out.println("DEBUG: Could not get auth details: " + e.getMessage());
        }

        Map<String, Object> response = new HashMap<>();

        // 1. Stats
        long totalStudents = studentRepository.count();
        long totalFaculty = userRepository.countByRoleAndDepartment("FACULTY", null); // Assuming role, generic count
        if (totalFaculty == 0) {
            // Fallback if countByRoleAndDepartment needs explicit null handling or isn't
            // built for it
            totalFaculty = userRepository.findByRole("FACULTY").size();
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStudents", totalStudents);
        stats.put("totalFaculty", totalFaculty);
        response.put("stats", stats);

        // 2. Branches & Performance
        // Get all subjects
        List<Subject> allSubjects = subjectRepository.findAll();
        // distinct departments — combine from subjects, HODs, and students
        Set<String> departments = new HashSet<>();

        // From subjects
        allSubjects.stream()
                .map(Subject::getDepartment)
                .filter(Objects::nonNull)
                .filter(d -> !d.isBlank())
                .forEach(departments::add);

        // From HOD users (new departments may not have subjects yet)
        userRepository.findByRole("HOD").stream()
                .map(User::getDepartment)
                .filter(Objects::nonNull)
                .filter(d -> !d.isBlank())
                .forEach(departments::add);

        // From students
        studentRepository.findAll().stream()
                .map(Student::getDepartment)
                .filter(Objects::nonNull)
                .filter(d -> !d.isBlank())
                .forEach(departments::add);

        // Remove non-department values like "ADMIN"
        departments.remove("ADMIN");

        if (departments.isEmpty()) {
            departments.addAll(Arrays.asList("CS", "EC", "ME", "CV"));
        }

        List<String> branchList = new ArrayList<>(departments);
        Collections.sort(branchList);

        List<Double> branchPerformance = new ArrayList<>();
        List<Map<String, Object>> hodSubmissionStatus = new ArrayList<>();
        Map<String, Long> deptCompletedCounts = new HashMap<>();

        for (String dept : branchList) {
            // Direct query: get all CIE marks for students in this department
            List<Student> deptStudentsList = studentRepository.findByDepartment(dept);
            Set<Long> deptStudentIds = deptStudentsList.stream()
                    .map(Student::getId)
                    .collect(Collectors.toSet());

            // Get all marks for students in this department
            List<CieMark> deptMarks = cieMarkRepository.findAll().stream()
                    .filter(m -> m.getStudent() != null && deptStudentIds.contains(m.getStudent().getId()))
                    .filter(m -> m.getMarks() != null && m.getMarks() > 0)
                    .collect(Collectors.toList());

            // Count distinct students who have any marks
            long studentsWithMarks = deptMarks.stream()
                    .map(m -> m.getStudent().getId())
                    .distinct()
                    .count();
            deptCompletedCounts.put(dept, studentsWithMarks);

            // Compute average as percentage of max (50)
            double avgPercentage = 0.0;
            if (!deptMarks.isEmpty()) {
                double avgMarks = deptMarks.stream()
                        .mapToDouble(CieMark::getMarks)
                        .average()
                        .orElse(0.0);
                avgPercentage = (avgMarks / 50.0) * 100.0;
            }

            branchPerformance.add(Math.round(avgPercentage * 10.0) / 10.0);

            // HOD Status (Mock logic based on performance/completion)
            Map<String, Object> status = new HashMap<>();
            status.put("id", dept);
            status.put("dept", dept);
            List<User> hods = userRepository.findByRoleAndDepartment("HOD", dept);
            String hodName = hods.isEmpty() ? "Not Assigned" : hods.get(0).getFullName();
            status.put("hod", hodName);
            status.put("status", avgPercentage > 50 ? "Approved" : "Pending");
            status.put("punctuality", "On Time");
            hodSubmissionStatus.add(status);
        }

        response.put("branches", branchList);
        response.put("branchPerformance", branchPerformance);
        response.put("hodSubmissionStatus", hodSubmissionStatus);
        response.put("deptCompletedCounts", deptCompletedCounts);

        // Per-department student counts
        Map<String, Long> deptStudentCounts = new HashMap<>();
        for (String dept : branchList) {
            deptStudentCounts.put(dept, studentRepository.countByDepartment(dept));
        }
        response.put("deptStudentCounts", deptStudentCounts);

        // 3. Faculty Analytics (Aggregated)
        List<CieMark> allMarks = cieMarkRepository.findAll();
        double globalAvg = allMarks.stream().filter(m -> m.getMarks() != null).mapToDouble(CieMark::getMarks).average()
                .orElse(0.0);
        double globalPassRate = 0;
        long passed = allMarks.stream().filter(m -> m.getMarks() != null && m.getMarks() >= 20).count();
        if (!allMarks.isEmpty()) {
            globalPassRate = (double) passed / allMarks.size() * 100;
        }

        long pendingMarks = allMarks.stream().filter(m -> "PENDING".equals(m.getStatus())).count();
        long evaluatedMarks = allMarks.size() - pendingMarks;

        Map<String, Object> facultyAnalytics = new HashMap<>();
        facultyAnalytics.put("avgScore", Math.round((globalAvg / 50.0 * 100) * 10.0) / 10.0);
        facultyAnalytics.put("passRate", Math.round(globalPassRate * 10.0) / 10.0);
        facultyAnalytics.put("evaluated", evaluatedMarks);
        facultyAnalytics.put("pending", pendingMarks);
        response.put("facultyAnalytics", facultyAnalytics);

        // 4. Low Performers (Marks < 20)
        List<Map<String, Object>> lowPerformers = allMarks.stream()
                .filter(m -> m.getMarks() != null && m.getMarks() < 20 && m.getStudent() != null)
                .limit(10) // Limit to 10
                .map(m -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("marks", m.getMarks());

                    Map<String, String> student = new HashMap<>();
                    student.put("name", m.getStudent().getName());
                    student.put("regNo", m.getStudent().getRegNo());
                    student.put("department", m.getStudent().getDepartment());
                    item.put("student", student);

                    Map<String, String> subj = new HashMap<>();
                    subj.put("code", m.getSubject().getCode());
                    item.put("subject", subj);

                    return item;
                })
                .collect(Collectors.toList());
        response.put("lowPerformers", lowPerformers);

        // 5. CIE Stats
        // Mocking conducted/graded distinction if not available
        Map<String, Object> cieStats = new HashMap<>();
        cieStats.put("conducted", evaluatedMarks + pendingMarks);
        cieStats.put("pending", pendingMarks);
        cieStats.put("graded", evaluatedMarks);
        response.put("cieStats", cieStats);

        // 6. Common Mock/Placeholder Data for UI completeness
        response.put("dates", new ArrayList<>()); // Schedule
        response.put("approvals", new ArrayList<>()); // Pending Approvals

        Map<String, Object> trends = new HashMap<>();
        trends.put("labels", Arrays.asList("2021", "2022", "2023", "2024", "2025"));
        trends.put("datasets", Collections.singletonList(
                Map.of("data", Arrays.asList(65, 59, 80, 81, 85), "borderColor", "#4f46e5", "tension", 0.4)));
        response.put("trends", trends);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/faculty/all")
    public List<Map<String, Object>> getAllFaculty() {
        List<User> allFaculty = userRepository.findByRole("FACULTY");
        List<Map<String, Object>> result = new ArrayList<>();

        for (User fac : allFaculty) {
            Map<String, Object> facMap = new HashMap<>();
            facMap.put("id", fac.getId());
            facMap.put("username", fac.getUsername());
            facMap.put("fullName", fac.getFullName());
            facMap.put("email", fac.getEmail());
            facMap.put("department", fac.getDepartment());
            facMap.put("designation", fac.getDesignation());
            facMap.put("semester", fac.getSemester());
            facMap.put("section", fac.getSection());
            facMap.put("role", fac.getRole());
            facMap.put("cieRole", fac.getCieRole());

            // Collect ALL subjects across all departments
            Set<String> allSubjects = new java.util.LinkedHashSet<>();

            // Use a map to merge assignments per department
            // Key = department name, Value = {subjects set, sections set, semester}
            Map<String, Map<String, Object>> deptMap = new java.util.LinkedHashMap<>();

            // 1. Home department from User fields
            if (fac.getDepartment() != null) {
                Map<String, Object> home = deptMap.computeIfAbsent(fac.getDepartment(), k -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("subjects", new java.util.LinkedHashSet<String>());
                    m.put("sections", new java.util.LinkedHashSet<String>());
                    m.put("semester", null);
                    return m;
                });
                if (fac.getSubjects() != null && !fac.getSubjects().isBlank()) {
                    Arrays.stream(fac.getSubjects().split(",")).map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .forEach(s -> ((Set<String>) home.get("subjects")).add(s));
                }
                if (fac.getSection() != null && !fac.getSection().isBlank()) {
                    Arrays.stream(fac.getSection().split(",")).map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .forEach(s -> ((Set<String>) home.get("sections")).add(s));
                }
                if (fac.getSemester() != null)
                    home.put("semester", fac.getSemester());
            }

            // 2. Subjects where this faculty is the instructor (from Subject table)
            List<Subject> instructedSubjects = subjectRepository.findAll().stream()
                    .filter(s -> s.getInstructorName() != null &&
                            (fac.getUsername().equalsIgnoreCase(s.getInstructorName())
                                    || fac.getFullName().equalsIgnoreCase(s.getInstructorName())))
                    .collect(Collectors.toList());
            for (Subject s : instructedSubjects) {
                String dept = s.getDepartment() != null ? s.getDepartment() : fac.getDepartment();
                Map<String, Object> entry = deptMap.computeIfAbsent(dept, k -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("subjects", new java.util.LinkedHashSet<String>());
                    m.put("sections", new java.util.LinkedHashSet<String>());
                    m.put("semester", null);
                    return m;
                });
                ((Set<String>) entry.get("subjects")).add(s.getName());
            }

            // 3. Cross-department assignment requests
            List<com.example.ia.entity.FacultyAssignmentRequest> approvedRequests = assignmentRequestRepository
                    .findByFacultyIdAndStatus(fac.getId(), "APPROVED");
            for (com.example.ia.entity.FacultyAssignmentRequest req : approvedRequests) {
                String dept = req.getTargetDepartment();
                Map<String, Object> entry = deptMap.computeIfAbsent(dept, k -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("subjects", new java.util.LinkedHashSet<String>());
                    m.put("sections", new java.util.LinkedHashSet<String>());
                    m.put("semester", null);
                    return m;
                });
                if (req.getSubjects() != null && !req.getSubjects().isBlank()) {
                    Arrays.stream(req.getSubjects().split(",")).map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .forEach(s -> ((Set<String>) entry.get("subjects")).add(s));
                }
                if (req.getSections() != null && !req.getSections().isBlank()) {
                    Arrays.stream(req.getSections().split(",")).map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .forEach(s -> ((Set<String>) entry.get("sections")).add(s));
                }
                if (req.getSemester() != null)
                    entry.put("semester", req.getSemester());
            }

            // Build the final departmentAssignments list from the merged map
            List<Map<String, Object>> deptAssignments = new ArrayList<>();
            for (Map.Entry<String, Map<String, Object>> e : deptMap.entrySet()) {
                Set<String> subjects = (Set<String>) e.getValue().get("subjects");
                Set<String> sections = (Set<String>) e.getValue().get("sections");
                allSubjects.addAll(subjects);

                Map<String, Object> assignment = new HashMap<>();
                assignment.put("department", e.getKey());
                assignment.put("subjects", subjects.isEmpty() ? null : String.join(", ", subjects));
                assignment.put("section", sections.isEmpty() ? null : String.join(", ", sections));
                assignment.put("semester", e.getValue().get("semester"));
                deptAssignments.add(assignment);
            }

            facMap.put("subjects", allSubjects.isEmpty() ? null : String.join(", ", allSubjects));
            facMap.put("departmentAssignments", deptAssignments);
            result.add(facMap);
        }

        return result;
    }

    @GetMapping("/timetables")
    public List<Announcement> getTimetables() {
        return announcementRepository.findAll();
    }

    @GetMapping("/debug/seed-cie")
    public String seedCie() {
        try {
            Subject s = subjectRepository.findAll().stream()
                    .filter(sub -> "CSE".equals(sub.getDepartment()))
                    .findFirst()
                    .orElse(null);

            if (s == null)
                return "Error: No CSE subjects found to attach CIE to.";

            Announcement a = new Announcement();
            a.setSubject(s);
            a.setCieNumber("TEST-" + System.currentTimeMillis() % 1000);
            a.setScheduledDate(java.time.LocalDate.now().plusDays(2));
            a.setStartTime("02:00 PM");
            a.setDurationMinutes(90);
            a.setStatus("SCHEDULED");
            a.setExamRoom("Room 101");

            User u = userRepository.findByRole("FACULTY").stream().findFirst().orElse(null);
            if (u == null)
                u = userRepository.findByUsernameIgnoreCase("PRINCIPAL").orElse(null);
            a.setFaculty(u);

            announcementRepository.save(a);
            return "Seeded CIE: " + a.getCieNumber();
        } catch (Exception e) {
            return "Error seeding: " + e.getMessage();
        }
    }

    @GetMapping("/notifications")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public List<Notification> getNotifications() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User principal = userRepository.findByUsernameIgnoreCase(username).orElse(null);
        if (principal == null)
            return List.of();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(principal.getId());
    }
    /*
     * @GetMapping("/circulars")
     * public List<Object> getCirculars() {
     * return new ArrayList<>();
     * }
     */

    @GetMapping("/reports")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public List<Map<String, Object>> getReports() {
        List<Map<String, Object>> reports = new ArrayList<>();

        reports.add(createReportMeta("1", "Consolidated Marks Report", "Academic", "Generated now"));
        reports.add(createReportMeta("2", "Attendance Shortage Report", "Compliance", "Generated now"));
        reports.add(createReportMeta("3", "Faculty Performance Summary", "Faculty", "Generated now"));
        reports.add(createReportMeta("4", "Complete Student List", "Administrative", "Generated now"));

        return reports;
    }

    private Map<String, Object> createReportMeta(String id, String name, String type, String date) {
        Map<String, Object> meta = new HashMap<>();
        meta.put("id", id);
        meta.put("name", name);
        meta.put("type", type);
        meta.put("size", "~15 KB");
        meta.put("date", date);
        meta.put("apiType", name.toLowerCase().replace(" ", "_"));
        return meta;
    }

    @GetMapping("/reports/download/{apiType}")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public ResponseEntity<String> downloadReport(@PathVariable String apiType) {
        StringBuilder csv = new StringBuilder();
        String filename = apiType + ".csv";

        if (apiType.contains("marks")) {
            csv.append("Reg No,Name,Department,Subject,CIE-1,CIE-2,Total\n");
            List<CieMark> marks = cieMarkRepository.findAll();
            for (CieMark m : marks) {
                if (m.getStudent() == null || m.getSubject() == null)
                    continue;
                double c1 = m.getMarks() != null ? m.getMarks() : 0;
                csv.append(String.format("%s,%s,%s,%s,%.1f,0,%.1f\n",
                        m.getStudent().getRegNo(),
                        m.getStudent().getName().replace(",", " "),
                        m.getStudent().getDepartment(),
                        m.getSubject().getName().replace(",", " "),
                        c1, c1));
            }
        } else if (apiType.contains("attendance")) {
            csv.append("Reg No,Name,Department,Total Classes,Present,Percentage\n");
            List<Student> students = studentRepository.findAll();
            for (Student s : students) {
                List<Attendance> atts = attendanceRepository.findByStudentId(s.getId());
                long present = atts.stream().filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus())).count();
                double pct = atts.isEmpty() ? 0 : (double) present / atts.size() * 100;
                if (pct < 75 || atts.isEmpty()) {
                    csv.append(String.format("%s,%s,%s,%d,%d,%.1f%%\n",
                            s.getRegNo(), s.getName().replace(",", " "), s.getDepartment(),
                            atts.size(), present, pct));
                }
            }
        } else if (apiType.contains("faculty")) {
            csv.append("Name,Department,Role,Email\n");
            List<User> faculty = userRepository.findByRole("FACULTY");
            for (User f : faculty) {
                csv.append(String.format("%s,%s,%s,%s\n",
                        f.getFullName().replace(",", " "), f.getDepartment(), f.getRole(), f.getEmail()));
            }
        } else {
            csv.append("Reg No,Name,Department,Semester,Section\n");
            List<Student> students = studentRepository.findAll();
            for (Student s : students) {
                csv.append(String.format("%s,%s,%s,%s,%s\n",
                        s.getRegNo(), s.getName().replace(",", " "), s.getDepartment(), s.getSemester(),
                        s.getSection()));
            }
        }

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=" + filename)
                .header("Content-Type", "text/csv")
                .body(csv.toString());
    }

    @GetMapping("/reports/download/{department}/{reportType}")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public ResponseEntity<String> downloadDeptReport(
            @PathVariable String department, @PathVariable String reportType) {

        StringBuilder csv = new StringBuilder();
        String filename = department + "_" + reportType + ".csv";

        switch (reportType) {
            case "students":
                csv.append("Reg No,Name,Semester,Section\n");
                List<Student> students = studentRepository.findByDepartment(department);
                for (Student s : students) {
                    csv.append(String.format("%s,%s,%s,%s\n",
                            s.getRegNo(), s.getName().replace(",", " "),
                            s.getSemester(), s.getSection()));
                }
                break;

            case "marks":
                csv.append("Reg No,Name,Subject,CIE Number,Marks\n");
                List<Subject> deptSubjects = subjectRepository.findByDepartment(department);
                for (Subject sub : deptSubjects) {
                    List<CieMark> marks = cieMarkRepository.findBySubject_Id(sub.getId());
                    for (CieMark m : marks) {
                        if (m.getStudent() == null)
                            continue;
                        csv.append(String.format("%s,%s,%s,%s,%s\n",
                                m.getStudent().getRegNo(),
                                m.getStudent().getName().replace(",", " "),
                                sub.getName().replace(",", " "),
                                m.getCieType() != null ? m.getCieType() : "",
                                m.getMarks() != null ? m.getMarks().toString() : ""));
                    }
                }
                break;

            case "attendance":
                csv.append("Reg No,Name,Total Classes,Present,Absent,Percentage\n");
                List<Student> deptStudents = studentRepository.findByDepartment(department);
                for (Student s : deptStudents) {
                    List<Attendance> atts = attendanceRepository.findByStudentId(s.getId());
                    long present = atts.stream()
                            .filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus())).count();
                    long absent = atts.size() - present;
                    double pct = atts.isEmpty() ? 0 : (double) present / atts.size() * 100;
                    csv.append(String.format("%s,%s,%d,%d,%d,%.1f%%\n",
                            s.getRegNo(), s.getName().replace(",", " "),
                            atts.size(), present, absent, pct));
                }
                break;

            case "faculty":
                csv.append("Name,Designation,Email,Subjects,Section\n");
                List<User> faculty = userRepository.findByRoleAndDepartment("FACULTY", department);
                for (User f : faculty) {
                    csv.append(String.format("%s,%s,%s,%s,%s\n",
                            f.getFullName().replace(",", " "),
                            f.getDesignation() != null ? f.getDesignation() : "",
                            f.getEmail() != null ? f.getEmail() : "",
                            f.getSubjects() != null ? f.getSubjects().replace(",", ";") : "",
                            f.getSection() != null ? f.getSection() : ""));
                }
                break;

            case "subjects":
                csv.append("Code,Name,Semester,Instructor\n");
                List<Subject> subjects = subjectRepository.findByDepartment(department);
                for (Subject s : subjects) {
                    csv.append(String.format("%s,%s,%s,%s\n",
                            s.getCode() != null ? s.getCode() : "",
                            s.getName().replace(",", " "),
                            s.getSemester() != null ? s.getSemester().toString() : "",
                            s.getInstructorName() != null ? s.getInstructorName().replace(",", " ") : ""));
                }
                break;

            default:
                return ResponseEntity.badRequest().body("Invalid report type");
        }

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=" + filename)
                .header("Content-Type", "text/csv")
                .body(csv.toString());
    }

    @GetMapping("/grievances")
    public List<Object> getGrievances() {
        return new ArrayList<>();
    }

    @GetMapping("/students/{deptId}")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public List<Student> getStudentsByDepartment(@PathVariable String deptId) {
        return studentRepository.findByDepartment(deptId);
    }

    // ========== HOD MANAGEMENT ==========

    @GetMapping("/hods")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public List<User> getAllHods() {
        return userRepository.findByRole("HOD");
    }

    @PostMapping("/hod")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public ResponseEntity<?> createHod(@RequestBody User hodData) {
        if (userRepository.existsByUsername(hodData.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username already exists"));
        }
        if (hodData.getPassword() == null || hodData.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
        }
        User hod = new User();
        hod.setUsername(hodData.getUsername());
        hod.setFullName(hodData.getFullName());
        hod.setEmail(hodData.getEmail());
        hod.setDepartment(hodData.getDepartment());
        hod.setRole("HOD");
        hod.setPassword(passwordEncoder.encode(hodData.getPassword()));
        userRepository.save(hod);
        return ResponseEntity.ok(hod);
    }

    @PutMapping("/hod/{id}")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public ResponseEntity<?> updateHod(@PathVariable Long id, @RequestBody User hodData) {
        return userRepository.findById(id).map(hod -> {
            hod.setFullName(hodData.getFullName());
            hod.setEmail(hodData.getEmail());
            hod.setDepartment(hodData.getDepartment());

            // Allow username update
            if (hodData.getUsername() != null && !hodData.getUsername().equals(hod.getUsername())) {
                if (userRepository.existsByUsername(hodData.getUsername())) {
                    // This is a simplified check; in a real app you might want to return 400
                    // But here we'll just not update it or throw an exception if forced
                } else {
                    hod.setUsername(hodData.getUsername());
                }
            }

            if (hodData.getPassword() != null && !hodData.getPassword().isBlank()) {
                hod.setPassword(passwordEncoder.encode(hodData.getPassword()));
            }
            userRepository.save(hod);
            return ResponseEntity.ok(hod);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/hod/{id}")
    @PreAuthorize("hasRole('PRINCIPAL')")
    @Transactional
    public ResponseEntity<?> deleteHod(@PathVariable Long id) {
        return userRepository.findById(id).map(hod -> {
            // Clean up related data
            notificationRepository.deleteByUserId(id);
            announcementRepository.deleteByFaculty(hod);
            attendanceRepository.deleteByFaculty(hod);
            userRepository.delete(hod);
            return ResponseEntity.ok(Map.of("message", "HOD removed successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
