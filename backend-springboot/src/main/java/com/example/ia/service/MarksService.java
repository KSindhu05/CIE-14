package com.example.ia.service;

import com.example.ia.entity.CieMark;
import com.example.ia.entity.Student;
import com.example.ia.entity.Subject;
import com.example.ia.repository.CieMarkRepository;
import com.example.ia.repository.StudentRepository;
import com.example.ia.repository.SubjectRepository;
import com.example.ia.entity.Notification;
import com.example.ia.entity.User;
import com.example.ia.repository.NotificationRepository;
import com.example.ia.repository.UserRepository;
import com.example.ia.entity.UnlockRequest;
import com.example.ia.repository.UnlockRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class MarksService {
    @Autowired
    private CieMarkRepository cieMarkRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FacultyService facultyService;

    @Autowired
    private UnlockRequestRepository unlockRequestRepository;

    @Transactional
    public void submitMarks(Long subjectId, String cieType, String facultyUsername) {
        // Get the faculty's allowed student IDs (only their assigned sections)
        List<Student> allowedStudents = facultyService.getStudentsForFaculty(facultyUsername);
        java.util.Set<Long> allowedStudentIds = allowedStudents.stream()
                .map(Student::getId).collect(java.util.stream.Collectors.toSet());

        // Find all marks for this subject and CIE type 
        // Only submit marks that belong to this faculty's students
        List<CieMark> marks = cieMarkRepository.findBySubject_Id(subjectId);
        marks.forEach(mark -> {
            if (mark.getCieType().equals(cieType)
                    && mark.getMarks() != null
                    && mark.getStudent() != null
                    && allowedStudentIds.contains(mark.getStudent().getId())) {
                mark.setStatus("SUBMITTED");
            }
        });
        cieMarkRepository.saveAll(marks);
    }

    public List<CieMark> getMarksBySubject(Long subjectId) {
        return cieMarkRepository.findBySubject_Id(subjectId);
    }

    @Transactional
    public void updateBatchMarks(List<CieMark> marksPayload, boolean isHod, String currentUsername) {
        java.util.List<String> changeDetails = new java.util.ArrayList<>();
        String subjectName = "";
        String subjectDepartment = "";

        if (marksPayload.isEmpty()) return;

        // PERFORMANCE: Pre-fetch ALL existing marks for this subject in ONE query
        Long subjectId = marksPayload.get(0).getSubject().getId();
        List<CieMark> allExistingMarks = cieMarkRepository.findBySubject_Id(subjectId);
        
        // Build a lookup map: "studentId_cieType" -> existing CieMark
        java.util.Map<String, CieMark> existingMap = new java.util.HashMap<>();
        for (CieMark m : allExistingMarks) {
            if (m.getStudent() != null) {
                String key = m.getStudent().getId() + "_" + m.getCieType();
                existingMap.put(key, m);
            }
        }

        // Collect all marks to batch-save at the end
        List<CieMark> toSave = new java.util.ArrayList<>();

        for (CieMark payload : marksPayload) {
            String key = payload.getStudent().getId() + "_" + payload.getCieType();
            CieMark existing = existingMap.get(key);

            if (existing != null) {
                CieMark mark = existing;

                if (isHod) {
                    boolean changed = false;
                    String studentNameInfo = mark.getStudent() != null ? (mark.getStudent().getName() + " (" + mark.getStudent().getRegNo() + ") [" + payload.getCieType() + "]") : "Unknown Student";
                    String changeStr = "- " + studentNameInfo + ": ";
                    
                    if (payload.getMarks() != null) {
                        Double newM = payload.getMarks() < 0 ? null : payload.getMarks();
                        Double oldM = mark.getMarks();
                        if ((oldM == null && newM != null) || (oldM != null && !oldM.equals(newM))) {
                            changeStr += "Marks(" + (oldM == null ? "N/A" : oldM) + "->" + (newM == null ? "N/A" : newM) + ") ";
                            changed = true;
                        }
                    }
                    if (payload.getAttendancePercentage() != null) {
                        Double newA = payload.getAttendancePercentage() < 0 ? null : payload.getAttendancePercentage();
                        Double oldA = mark.getAttendancePercentage();
                        if ((oldA == null && newA != null) || (oldA != null && !oldA.equals(newA))) {
                            changeStr += "Att(" + (oldA == null ? "N/A" : oldA) + "->" + (newA == null ? "N/A" : newA) + ") ";
                            changed = true;
                        }
                    }
                    if (changed) {
                        changeDetails.add(changeStr.trim());
                        if (subjectName.isEmpty() && mark.getSubject() != null) {
                            subjectName = mark.getSubject().getName() + " (" + mark.getSubject().getCode() + ")";
                            subjectDepartment = mark.getSubject().getDepartment();
                        }
                    }
                }

                if (payload.getMarks() != null) {
                    mark.setMarks(payload.getMarks() < 0 ? null : payload.getMarks());
                }
                if (payload.getAttendancePercentage() != null) {
                    mark.setAttendancePercentage(payload.getAttendancePercentage() < 0 ? null : payload.getAttendancePercentage());
                }

                toSave.add(mark);
            } else {
                if (payload.getMarks() != null && payload.getMarks() < 0) payload.setMarks(null);
                if (payload.getAttendancePercentage() != null && payload.getAttendancePercentage() < 0) payload.setAttendancePercentage(null);

                if (payload.getMarks() != null || payload.getAttendancePercentage() != null) {
                    if (isHod) {
                        String studentInfo = payload.getStudent() != null ? (payload.getStudent().getName() + " (" + payload.getStudent().getRegNo() + ") [" + payload.getCieType() + "]") : "Unknown";
                        String changeStr = "- " + studentInfo + ": Added new ";
                        if (payload.getMarks() != null) changeStr += "Marks=" + payload.getMarks() + " ";
                        if (payload.getAttendancePercentage() != null) changeStr += "Att=" + payload.getAttendancePercentage();
                        changeDetails.add(changeStr.trim());
                        
                        if (subjectName.isEmpty() && payload.getSubject() != null) {
                            subjectName = payload.getSubject().getName() + " (" + payload.getSubject().getCode() + ")";
                            subjectDepartment = payload.getSubject().getDepartment();
                        }
                    }

                    if (payload.getStatus() == null) payload.setStatus("PENDING");
                    toSave.add(payload);
                }
            }
        }

        // PERFORMANCE: Batch-save ALL marks in one call
        if (!toSave.isEmpty()) {
            cieMarkRepository.saveAll(toSave);
        }

        if (isHod && !changeDetails.isEmpty()) {
            String message = "HOD (" + currentUsername + ") updated marks for " + subjectName + ":\n" + String.join("\n", changeDetails);

            // Notify Principal
            User principal = userRepository.findByRole("PRINCIPAL").stream().findFirst().orElse(null);
            if (principal != null) {
                Notification notif = new Notification();
                notif.setUser(principal);
                notif.setMessage(message);
                notif.setType("INFO");
                notif.setCategory("HOD Update - " + subjectDepartment);
                notificationRepository.save(notif);
            }

            // Notify Faculty
            if (marksPayload.size() > 0 && marksPayload.get(0).getSubject() != null) {
                java.util.Set<Long> affectedStudentIds = new java.util.HashSet<>();
                for (CieMark pm : marksPayload) {
                    if (pm.getStudent() != null) affectedStudentIds.add(pm.getStudent().getId());
                }

                java.util.Set<User> notifiedFaculties = new java.util.HashSet<>();
                List<User> allFaculties = userRepository.findByRole("FACULTY");

                for (User faculty : allFaculties) {
                    for (Long studentId : affectedStudentIds) {
                        if (facultyService.isFacultyAssignedToSubjectAndStudent(faculty.getUsername(), subjectId, studentId)) {
                            notifiedFaculties.add(faculty);
                            break; 
                        }
                    }
                }

                for (User faculty : notifiedFaculties) {
                    Notification notif = new Notification();
                    notif.setUser(faculty);
                    notif.setMessage(message);
                    notif.setType("INFO");
                    notif.setCategory("HOD Update - " + subjectDepartment);
                    notificationRepository.save(notif);
                }
            }
        }
    }

    // HOD Features
    public List<CieMark> getPendingApprovals(String department) {
        return cieMarkRepository.findByStatusAndSubject_Department("SUBMITTED", department);
    }

    @Transactional
    public void approveMarks(Long subjectId, String cieType) {
        List<CieMark> marks = cieMarkRepository.findBySubject_Id(subjectId);
        marks.forEach(mark -> {
            if (mark.getCieType().equals(cieType) && "SUBMITTED".equals(mark.getStatus())) {
                mark.setStatus("APPROVED");
            }
        });
        cieMarkRepository.saveAll(marks);
    }

    @Transactional
    public void rejectMarks(Long subjectId, String cieType) {
        List<CieMark> marks = cieMarkRepository.findBySubject_Id(subjectId);
        marks.forEach(mark -> {
            if (mark.getCieType().equals(cieType) && "SUBMITTED".equals(mark.getStatus())) {
                mark.setStatus("REJECTED");
            }
        });
        cieMarkRepository.saveAll(marks);
    }

    @Transactional(readOnly = true)
    public List<CieMark> getMarksByStudentUsername(String username) {
        // Username for student is their RegNo
        Student student = studentRepository.findByRegNoIgnoreCase(username).orElse(null);
        if (student == null) {
            return List.of();
        }
        return cieMarkRepository.findByStudent_Id(student.getId())
                .stream()
                .filter(m -> "APPROVED".equalsIgnoreCase(m.getStatus()))
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CieMark> getMarksByStudentId(Long studentId) {
        return cieMarkRepository.findByStudent_Id(studentId);
    }

    @Transactional
    public void unlockMarks(Long subjectId, String cieType) {
        List<CieMark> marks = cieMarkRepository.findBySubject_Id(subjectId);

        // Get all students who already have marks for this CIE type
        java.util.Set<Long> studentsWithMarks = new java.util.HashSet<>();

        // Update existing marks to PENDING so faculty can edit them
        marks.forEach(mark -> {
            if (mark.getCieType().equals(cieType)) {
                mark.setStatus("PENDING");
                if (mark.getStudent() != null) {
                    studentsWithMarks.add(mark.getStudent().getId());
                }
            }
        });
        cieMarkRepository.saveAll(marks);

        // For CIE types that don't have records yet (e.g. CIE-2 to CIE-5),
        // create PENDING placeholders with NULL marks (not 0) so the frontend
        // knows these CIE types are unlocked for editing
        java.util.Set<Long> allStudentIds = new java.util.HashSet<>();
        marks.forEach(mark -> {
            if (mark.getStudent() != null) {
                allStudentIds.add(mark.getStudent().getId());
            }
        });

        Subject subject = subjectRepository.findById(subjectId).orElse(null);
        if (subject != null) {
            for (Long studentId : allStudentIds) {
                if (!studentsWithMarks.contains(studentId)) {
                    Student student = studentRepository.findById(studentId).orElse(null);
                    if (student != null) {
                        CieMark newMark = new CieMark();
                        newMark.setStudent(student);
                        newMark.setSubject(subject);
                        newMark.setCieType(cieType);
                        newMark.setMarks(null); // NULL not 0 — won't display as "0"
                        newMark.setStatus("PENDING");
                        cieMarkRepository.save(newMark);
                    }
                }
            }
        }
    }

    // --- Unlock Requests ---
    
    @Transactional
    public UnlockRequest createUnlockRequest(Long subjectId, String facultyUsername, String cieTypes, String reason) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        User faculty = userRepository.findByUsername(facultyUsername)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        UnlockRequest request = new UnlockRequest();
        request.setSubject(subject);
        request.setFaculty(faculty);
        request.setCieTypes(cieTypes);
        request.setReason(reason);
        request.setStatus("PENDING");
        request.setDepartment(subject.getDepartment());
        
        UnlockRequest savedRequest = unlockRequestRepository.save(request);

        // Notify HODs
        List<User> hods = userRepository.findByRoleAndDepartment("ROLE_HOD", subject.getDepartment());
        for (User hod : hods) {
            Notification notif = new Notification();
            notif.setUser(hod);
            notif.setMessage("Faculty " + faculty.getFullName() + " requested to unlock marks for " + subject.getName() + " (" + cieTypes + ")");
            notif.setType("INFO");
            notif.setCategory("Unlock Request");
            notificationRepository.save(notif);
        }

        return savedRequest;
    }

    @Transactional(readOnly = true)
    public List<UnlockRequest> getPendingUnlockRequests(String department) {
        return unlockRequestRepository.findByDepartmentAndStatusOrderByCreatedAtDesc(department, "PENDING");
    }

    @Transactional
    public void approveUnlockRequest(Long requestId) {
        UnlockRequest request = unlockRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Unlock request not found"));
        
        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Request is not pending");
        }

        // Unlock each requested CIE
        String[] types = request.getCieTypes().split(",");
        for (String type : types) {
            unlockMarks(request.getSubject().getId(), type.trim());
        }

        request.setStatus("APPROVED");
        unlockRequestRepository.save(request);

        // Notify faculty
        Notification notif = new Notification();
        notif.setUser(request.getFaculty());
        notif.setMessage("Your request to unlock marks for " + request.getSubject().getName() + " (" + request.getCieTypes() + ") has been APPROVED.");
        notif.setType("INFO");
        notif.setCategory("Unlock Approved");
        notificationRepository.save(notif);
    }

    @Transactional
    public void rejectUnlockRequest(Long requestId) {
        UnlockRequest request = unlockRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Unlock request not found"));
        
        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Request is not pending");
        }

        request.setStatus("REJECTED");
        unlockRequestRepository.save(request);

        // Notify faculty
        Notification notif = new Notification();
        notif.setUser(request.getFaculty());
        notif.setMessage("Your request to unlock marks for " + request.getSubject().getName() + " (" + request.getCieTypes() + ") has been REJECTED.");
        notif.setType("ALERT");
        notif.setCategory("Unlock Rejected");
        notificationRepository.save(notif);
    }
}
