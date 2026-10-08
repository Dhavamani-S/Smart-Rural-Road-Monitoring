package com.smartroad.backend.service;

import com.smartroad.backend.dto.PageResponse;
import com.smartroad.backend.dto.ProjectResponse;
import com.smartroad.backend.entity.Project;
import com.smartroad.backend.entity.ProjectStatus;
import com.smartroad.backend.exception.BadRequestException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class ProjectSearchService {

    private static final Set<String> SORTABLE = Set.of("name", "location", "status", "deadline",
            "startDate", "totalBudget", "completedPercentage", "createdAt");

    @PersistenceContext
    private EntityManager em;

    public record Criteria(
            String q,
            String location,
            ProjectStatus status,
            Long engineerId,
            LocalDate dateFrom,
            LocalDate dateTo,
            int page,
            int size,
            String sort,
            String direction) {
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectResponse> search(Criteria c, String email, boolean isAdmin) {
        if (c.dateFrom() != null && c.dateTo() != null && c.dateFrom().isAfter(c.dateTo())) {
            throw new BadRequestException("dateFrom must not be after dateTo");
        }
        int page = Math.max(0, c.page());
        int size = Math.min(100, Math.max(1, c.size()));
        String sortField = SORTABLE.contains(c.sort()) ? c.sort() : "createdAt";
        boolean ascending = "asc".equalsIgnoreCase(c.direction());

        CriteriaBuilder cb = em.getCriteriaBuilder();

        CriteriaQuery<Project> query = cb.createQuery(Project.class);
        Root<Project> root = query.from(Project.class);
        query.select(root).where(predicates(cb, root, c, email, isAdmin));
        Path<Object> sortPath = root.get(sortField);
        query.orderBy(ascending ? cb.asc(sortPath) : cb.desc(sortPath), cb.desc(root.get("id")));
        List<Project> content = em.createQuery(query)
                .setFirstResult(page * size)
                .setMaxResults(size)
                .getResultList();

        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Project> countRoot = countQuery.from(Project.class);
        countQuery.select(cb.count(countRoot)).where(predicates(cb, countRoot, c, email, isAdmin));
        long total = em.createQuery(countQuery).getSingleResult();

        int totalPages = (int) Math.ceil(total / (double) size);
        return new PageResponse<>(content.stream().map(ProjectResponse::from).toList(),
                page, size, total, totalPages);
    }

    private Predicate[] predicates(CriteriaBuilder cb, Root<Project> root, Criteria c,
                                   String email, boolean isAdmin) {
        List<Predicate> list = new ArrayList<>();
        if (!isAdmin) {
            list.add(cb.equal(root.get("assignedEngineer").get("email"), email));
        }
        if (hasText(c.q())) {
            list.add(cb.like(cb.lower(root.<String>get("name")), like(c.q()), '!'));
        }
        if (hasText(c.location())) {
            list.add(cb.like(cb.lower(root.<String>get("location")), like(c.location()), '!'));
        }
        if (c.status() != null) {
            list.add(cb.equal(root.get("status"), c.status()));
        }
        if (c.engineerId() != null) {
            list.add(cb.equal(root.get("assignedEngineer").get("id"), c.engineerId()));
        }
        // A project matches the date range when its schedule overlaps it.
        if (c.dateFrom() != null) {
            list.add(cb.greaterThanOrEqualTo(root.<LocalDate>get("deadline"), c.dateFrom()));
        }
        if (c.dateTo() != null) {
            list.add(cb.lessThanOrEqualTo(root.<LocalDate>get("startDate"), c.dateTo()));
        }
        return list.toArray(new Predicate[0]);
    }

    private boolean hasText(String text) {
        return text != null && !text.isBlank();
    }

    private String like(String text) {
        String escaped = text.trim().toLowerCase()
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");
        return "%" + escaped + "%";
    }
}