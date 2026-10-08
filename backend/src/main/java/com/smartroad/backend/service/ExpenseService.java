package com.smartroad.backend.service;

import com.smartroad.backend.dto.ExpenseRequest;
import com.smartroad.backend.dto.ExpenseResponse;
import com.smartroad.backend.entity.Expense;
import com.smartroad.backend.entity.Project;
import com.smartroad.backend.entity.User;
import com.smartroad.backend.exception.BadRequestException;
import com.smartroad.backend.repository.ExpenseRepository;
import com.smartroad.backend.repository.ProjectRepository;
import com.smartroad.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectAccessService accessService;

    @Transactional
    public ExpenseResponse add(Long projectId, ExpenseRequest req, String email) {
        Project project = accessService.requireAccess(projectId, email, false);
        if (req.expenseDate().isBefore(project.getStartDate())) {
            throw new BadRequestException("Expense date cannot be before the project start date");
        }

        User engineer = userRepository.findByEmail(email).orElseThrow();
        Expense expense = new Expense();
        expense.setProject(project);
        expense.setRecordedBy(engineer);
        expense.setAmount(req.amount());
        expense.setCategory(req.category());
        expense.setExpenseDate(req.expenseDate());
        expense.setDescription(req.description());
        Expense saved = expenseRepository.save(expense);

        project.setTotalExpenditure(project.getTotalExpenditure().add(req.amount()));
        projectRepository.save(project);

        return ExpenseResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> history(Long projectId, String email, boolean isAdmin) {
        accessService.requireAccess(projectId, email, isAdmin);
        return expenseRepository.findByProjectIdOrderByExpenseDateDescIdDesc(projectId)
                .stream().map(ExpenseResponse::from).toList();
    }
}