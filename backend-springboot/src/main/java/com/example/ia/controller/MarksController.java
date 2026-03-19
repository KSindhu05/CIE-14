package com.example.ia.controller;

import com.example.ia.entity.CieMark;
import com.example.ia.entity.Student;
import com.example.ia.entity.Subject;
import com.example.ia.payload.request.MarkUpdateDto;
import com.example.ia.payload.response.MessageResponse;
import com.example.ia.repository.StudentRepository;
import com.example.ia.repository.SubjectRepository;
import com.example.ia.repository.UserRepository;
import com.example.ia.service.FacultyService;
import com.example.ia.service.MarksService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.example.ia.security.UserDetailsImpl;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

import java.util.ArrayList;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/marks")
public class MarksController {

    @Autowired
    MarksService marksService;

    @Autowired
    FacultyService facultyService;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    SubjectRepository subjectRepository;

    @Autowired
    UserRepository userRepository;

    private boolean isAuthorizedForDepartment(String department, UserDetailsImpl userDetails) {
        if (userDetails == null) return false;
        if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PRINCIPAL"))) {
            return true;
        }
        return department != null && department.equalsIgnoreCase(userDetails.getDepartment());
    }

    @GetMapping("/subject/{subjectId}")
    @PreAuthorize("hasRole('FACULTY') or hasRole('HOD') or hasRole('PRINCIPAL')")
    public List<CieMark> getMarksBySubject(@PathVariable Long subjectId) {
        return marksService.getMarksBySubject(subjectId);
    }

    @GetMapping("/my-marks")
    @PreAuthorize("hasRole('STUDENT')")
    public List<CieMark> getMyMarks() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return marksService.getMarksByStudentUsername(username);
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('FACULTY') or hasRole('HOD') or hasRole('PRINCIPAL')")
    public List<CieMark> getMarksByStudent(@PathVariable Long studentId) {
        return marksService.getMarksByStudentId(studentId);
    }

    @PostMapping("/update/batch")
    @PreAuthorize("hasRole('FACULTY') or hasRole('HOD')")
    public ResponseEntity<?> updateBatchMarks(@RequestBody List<MarkUpdateDto> markDtos, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        String username = userDetails.getUsername();
        boolean isHod = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_HOD"));
        List<CieMark> marksToSave = new ArrayList<>();

        // PERFORMANCE: Pre-fetch allowed student IDs ONCE instead of per-record
        java.util.Set<Long> allowedStudentIds = null;
        if (!isHod) {
            List<com.example.ia.entity.Student> allowedStudents = facultyService.getStudentsForFaculty(username);
            allowedStudentIds = allowedStudents.stream().map(s -> s.getId()).collect(java.util.stream.Collectors.toSet());
        }

        // PERFORMANCE: Cache subject lookups (usually all marks are for the same subject)
        java.util.Map<Long, Subject> subjectCache = new java.util.HashMap<>();
        java.util.Map<Long, Student> studentCache = new java.util.HashMap<>();

        for (MarkUpdateDto dto : markDtos) {
            // PERFORMANCE: Use pre-fetched set instead of per-record DB call
            if (!isHod && (allowedStudentIds == null || !allowedStudentIds.contains(dto.getStudentId()))) {
                continue; // Skip unauthorized entries
            }

            // Use cached lookups
            Student student = studentCache.computeIfAbsent(dto.getStudentId(), 
                    id -> studentRepository.findById(id).orElse(null));
            Subject subject = subjectCache.computeIfAbsent(dto.getSubjectId(), 
                    id -> subjectRepository.findById(id).orElse(null));

            if (student != null && subject != null) {
                // Enforce Name-Based CIE role restrictions (only for actual marks/attendance
                // updates)
                if ((dto.getCo1() != null || dto.getAttendancePercentage() != null) && dto.getIaType() != null) {
                    String name = subject.getName().toLowerCase();
                    String iaType = dto.getIaType().toUpperCase();

                    boolean isLabType = iaType.equals("CIE3") || iaType.equals("CIE4");
                    boolean isTheoryType = !isLabType; // CIE1, CIE2, CIE5 = theory

                    if (name.contains("(lab)") && isTheoryType) {
                        return ResponseEntity.status(403).body(
                                java.util.Map.of("message",
                                        "Cannot save theory marks (" + iaType + ") for a Lab subject."));
                    }
                    if (name.contains("(theory)") && isLabType) {
                        return ResponseEntity.status(403).body(
                                java.util.Map.of("message",
                                        "Cannot save lab marks (" + iaType + ") for a Theory subject."));
                    }
                }

                CieMark mark = new CieMark();
                mark.setStudent(student);
                mark.setSubject(subject);
                mark.setCieType(dto.getIaType());
                mark.setMarks(dto.getCo1());
                mark.setAttendancePercentage(dto.getAttendancePercentage());
                marksToSave.add(mark);
            }
        }

        marksService.updateBatchMarks(marksToSave, isHod, username);
        return ResponseEntity.ok(new MessageResponse("Marks updated successfully"));
    }

    @PostMapping("/submit")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<?> submitMarks(@RequestParam Long subjectId, @RequestParam String cieType, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        String username = userDetails.getUsername();
        
        // Authorization check: Does faculty teach this subject?
        if (!facultyService.isFacultyAssignedToSubjectAndStudent(username, subjectId, null)) {
             return ResponseEntity.status(403).body(Map.of("message", "Access denied: You are not authorized to submit marks for this subject."));
        }
        
        marksService.submitMarks(subjectId, cieType, username);
        return ResponseEntity.ok(new MessageResponse("Marks submitted successfully"));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> getPendingApprovals(@RequestParam String department, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (!isAuthorizedForDepartment(department, userDetails)) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied: You are not authorized for this department."));
        }
        return ResponseEntity.ok(marksService.getPendingApprovals(department));
    }

    @PostMapping("/approve")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> approveMarks(@RequestParam Long subjectId, @RequestParam String iaType, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return subjectRepository.findById(subjectId).map(subject -> {
            if (!isAuthorizedForDepartment(subject.getDepartment(), userDetails)) {
                return ResponseEntity.status(403).body(Map.of("message", "Access denied: You are not authorized for this department."));
            }
            marksService.approveMarks(subjectId, iaType);
            return ResponseEntity.ok(new MessageResponse("Marks approved"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/reject")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> rejectMarks(@RequestParam Long subjectId, @RequestParam String iaType, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return subjectRepository.findById(subjectId).map(subject -> {
            if (!isAuthorizedForDepartment(subject.getDepartment(), userDetails)) {
                return ResponseEntity.status(403).body(Map.of("message", "Access denied: You are not authorized for this department."));
            }
            marksService.rejectMarks(subjectId, iaType);
            return ResponseEntity.ok(new MessageResponse("Marks rejected"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- Unlock Requests ---

    @PostMapping("/unlock-request")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<?> createUnlockRequest(@RequestBody Map<String, Object> request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Long subjectId = ((Number) request.get("subjectId")).longValue();
        String cieTypes = (String) request.get("cieTypes");
        String reason = (String) request.get("reason");
        
        marksService.createUnlockRequest(subjectId, userDetails.getUsername(), cieTypes, reason);
        return ResponseEntity.ok(new MessageResponse("Unlock request sent to HOD successfully."));
    }

    @GetMapping("/unlock-requests/pending")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> getPendingUnlockRequests(@RequestParam String department, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (!isAuthorizedForDepartment(department, userDetails)) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied: You are not authorized for this department."));
        }
        return ResponseEntity.ok(marksService.getPendingUnlockRequests(department));
    }

    @PostMapping("/unlock-requests/{id}/approve")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> approveUnlockRequest(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        // ideally checking department auth again, but handled simplified here
        marksService.approveUnlockRequest(id);
        return ResponseEntity.ok(new MessageResponse("Unlock request approved marks unlocked."));
    }

    @PostMapping("/unlock-requests/{id}/reject")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> rejectUnlockRequest(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        marksService.rejectUnlockRequest(id);
        return ResponseEntity.ok(new MessageResponse("Unlock request rejected."));
    }

    // Restore original HOD manual unlock
    @PostMapping("/unlock")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<?> unlockMarks(@RequestBody UnlockRequestDTO request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return subjectRepository.findById(request.getSubjectId()).map(subject -> {
            if (!isAuthorizedForDepartment(subject.getDepartment(), userDetails)) {
                return ResponseEntity.status(403).body(Map.of("message", "Access denied."));
            }
            marksService.unlockMarks(request.getSubjectId(), request.getIaType());
            return ResponseEntity.ok(new MessageResponse("Marks unlocked for editing"));
        }).orElse(ResponseEntity.notFound().build());
    }

    static class UnlockRequestDTO {
        private Long subjectId;
        private String iaType;

        public Long getSubjectId() { return subjectId; }
        public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }
        public String getIaType() { return iaType; }
        public void setIaType(String iaType) { this.iaType = iaType; }
    }
}
