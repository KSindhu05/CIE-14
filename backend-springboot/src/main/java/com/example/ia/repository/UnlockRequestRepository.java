package com.example.ia.repository;

import com.example.ia.entity.UnlockRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UnlockRequestRepository extends JpaRepository<UnlockRequest, Long> {
    List<UnlockRequest> findByDepartmentAndStatusOrderByCreatedAtDesc(String department, String status);
}
