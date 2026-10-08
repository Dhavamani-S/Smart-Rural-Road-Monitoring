package com.smartroad.backend.repository;

import com.smartroad.backend.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByProjectIdOrderByExpenseDateDescIdDesc(Long projectId);
    void deleteByProjectId(Long projectId);
}