package com.smartroad.backend.config;

import com.smartroad.backend.entity.*;
import com.smartroad.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

import static com.smartroad.backend.entity.ExpenseCategory.*;
import static com.smartroad.backend.entity.ProjectStatus.*;

/** Creates clearly labelled sample data. Disabled unless app.demo-data.enabled=true. */
@Slf4j
@Component
@RequiredArgsConstructor
public class DemoDataSeeder implements CommandLineRunner {

    private static final String PREFIX = "[DEMO]";
    private static final String NOTE = "Demonstration data. Not real government construction data.";

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final ProgressUpdateRepository progressUpdateRepository;
    private final ExpenseRepository expenseRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.demo-data.enabled:false}")
    private boolean enabled;

    @Value("${app.demo-data.password:}")
    private String demoPassword;

    private LocalDate today;

    @Override
    public void run(String... args) {
        if (!enabled) {
            return;
        }
        if (demoPassword == null || demoPassword.length() < 8) {
            log.warn("Demo data was not created: set app.demo-data.password (at least 8 characters)");
            return;
        }
        if (projectRepository.findAll().stream().anyMatch(p -> p.getName().startsWith(PREFIX))) {
            log.info("Demo data already exists, nothing to do");
            return;
        }
        today = LocalDate.now();
        User one = engineer("Demo Engineer One", "demo.engineer1@smartroad.com");
        User two = engineer("Demo Engineer Two", "demo.engineer2@smartroad.com");

        // 1. On track, healthy
        Project p1 = project("Rural Road - Village A to Highway", "Demo Village A, Demo District",
                12_000_000, -120, 120, IN_PROGRESS, one);
        progress(p1, one, -100, 8, "Survey and site clearing started");
        progress(p1, one, -80, 15, "Earthwork in progress");
        progress(p1, one, -60, 24, "First 3 km levelled");
        progress(p1, one, -40, 33, "Sub-base work started");
        progress(p1, one, -20, 42, "Sub-base 80% complete");
        progress(p1, one, -5, 50, "Base course started");
        expense(p1, one, -110, 150_000, PERMITS, "Local permits and approvals");
        expense(p1, one, -100, 900_000, MATERIAL, "Gravel and aggregate");
        expense(p1, one, -90, 600_000, LABOUR, "Crew wages");
        expense(p1, one, -70, 800_000, EQUIPMENT, "Roller and grader hire");
        expense(p1, one, -50, 1_500_000, MATERIAL, "Sub-base material");
        expense(p1, one, -30, 700_000, LABOUR, "Crew wages");
        expense(p1, one, -10, 400_000, TRANSPORT, "Material transport");
        milestone(p1, "Survey and site clearing", -100, true);
        milestone(p1, "Earthwork and levelling", -60, true);
        milestone(p1, "Sub-base layer", -10, true);
        milestone(p1, "Base course and drainage", 40, false);
        milestone(p1, "Surfacing and road markings", 100, false);

        // 2. Behind schedule with an overdue milestone
        Project p2 = project("Bridge Approach Road - Village B", "Demo Village B, Demo District",
                8_000_000, -90, 90, DELAYED, two);
        progress(p2, two, -70, 7, "Clearing started late");
        progress(p2, two, -50, 13, "Equipment breakdown");
        progress(p2, two, -25, 22, "Work resumed");
        progress(p2, two, -8, 28, "Embankment work ongoing");
        expense(p2, two, -80, 800_000, MATERIAL, "Fill material");
        expense(p2, two, -60, 700_000, LABOUR, "Crew wages");
        expense(p2, two, -30, 1_100_000, MATERIAL, "Embankment material");
        milestone(p2, "Site clearing", -75, true);
        milestone(p2, "Culvert construction", -15, false);
        milestone(p2, "Embankment and approach slab", 40, false);

        // 3. Deadline passed, far behind
        Project p3 = project("Market Link Road - Village C", "Demo Village C, Demo District",
                6_000_000, -150, -20, DELAYED, one);
        progress(p3, one, -120, 15, "Earthwork started");
        progress(p3, one, -90, 30, "Earthwork continuing");
        progress(p3, one, -60, 45, "Sub-base complete on half the road");
        progress(p3, one, -30, 55, "Base course started");
        expense(p3, one, -140, 600_000, MATERIAL, "Gravel");
        expense(p3, one, -120, 500_000, LABOUR, "Crew wages");
        expense(p3, one, -100, 800_000, EQUIPMENT, "Machinery hire");
        expense(p3, one, -80, 900_000, MATERIAL, "Sub-base material");
        expense(p3, one, -55, 600_000, LABOUR, "Crew wages");
        expense(p3, one, -35, 500_000, TRANSPORT, "Material transport");
        milestone(p3, "Survey and clearing", -140, true);
        milestone(p3, "Earthwork", -100, true);
        milestone(p3, "Final surfacing and signage", -25, false);

        // 4. Spending far ahead of the work
        Project p4 = project("School Access Road - Village D", "Demo Village D, Demo District",
                5_000_000, -60, 60, IN_PROGRESS, two);
        progress(p4, two, -40, 20, "Earthwork finished");
        progress(p4, two, -20, 35, "Sub-base started");
        progress(p4, two, -5, 45, "Sub-base in progress");
        expense(p4, two, -55, 1_200_000, MATERIAL, "Bulk material purchase");
        expense(p4, two, -40, 900_000, EQUIPMENT, "Machinery purchase");
        expense(p4, two, -25, 1_300_000, MATERIAL, "Bitumen and aggregate");
        expense(p4, two, -8, 1_100_000, EQUIPMENT, "Paver hire");
        milestone(p4, "Earthwork", -40, true);
        milestone(p4, "Base course", 20, false);
        milestone(p4, "Surfacing", 55, false);

        // 5. Completed
        Project p5 = project("Hamlet Connector Road - Village E", "Demo Village E, Demo District",
                3_500_000, -200, -30, COMPLETED, one);
        progress(p5, one, -150, 30, "Earthwork done");
        progress(p5, one, -110, 60, "Base course done");
        progress(p5, one, -70, 85, "Surfacing underway");
        progress(p5, one, -40, 100, "Road completed and handed over");
        expense(p5, one, -190, 800_000, MATERIAL, "Gravel");
        expense(p5, one, -150, 600_000, LABOUR, "Crew wages");
        expense(p5, one, -110, 700_000, EQUIPMENT, "Machinery hire");
        expense(p5, one, -70, 600_000, MATERIAL, "Bitumen");
        expense(p5, one, -60, 100_000, OTHER, "Site office and miscellaneous");
        expense(p5, one, -45, 300_000, TRANSPORT, "Material transport");
        milestone(p5, "Earthwork", -150, true);
        milestone(p5, "Base course", -100, true);
        milestone(p5, "Surfacing", -50, true);

        // 6. Not started yet
        Project p6 = project("Panchayat Road Extension - Village F", "Demo Village F, Demo District",
                4_000_000, 20, 160, NOT_STARTED, two);
        milestone(p6, "Survey and marking", 40, false);
        milestone(p6, "Earthwork", 80, false);

        // 7. On hold
        Project p7 = project("Hill Road Realignment - Village G", "Demo Village G, Demo District",
                7_000_000, -70, 100, ON_HOLD, one);
        progress(p7, one, -45, 10, "Survey and clearing");
        progress(p7, one, -25, 18, "Work paused for land clearance");
        expense(p7, one, -60, 600_000, MATERIAL, "Initial materials");
        expense(p7, one, -35, 400_000, LABOUR, "Crew wages");
        milestone(p7, "Survey", -50, true);
        milestone(p7, "Earthwork", 30, false);

        log.info("Demo data created: 2 engineers and 7 projects");
    }

    private User engineer(String name, String email) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = new User();
            user.setFullName(name);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(demoPassword));
            user.setRole(Role.SITE_ENGINEER);
            return userRepository.save(user);
        });
    }

    private Project project(String name, String location, long budget, int startOffset, int deadlineOffset,
                            ProjectStatus status, User engineer) {
        Project p = new Project();
        p.setName(PREFIX + " " + name);
        p.setLocation(location);
        p.setDescription(NOTE);
        p.setTotalBudget(BigDecimal.valueOf(budget));
        p.setStartDate(today.plusDays(startOffset));
        p.setDeadline(today.plusDays(deadlineOffset));
        p.setStatus(status);
        p.setAssignedEngineer(engineer);
        return projectRepository.save(p);
    }

    private void progress(Project p, User by, int dayOffset, int percentage, String remarks) {
        ProgressUpdate update = new ProgressUpdate();
        update.setProject(p);
        update.setUpdatedBy(by);
        update.setCompletedPercentage(percentage);
        update.setRemarks(remarks);
        update.setUpdateDate(today.plusDays(dayOffset));
        progressUpdateRepository.save(update);
        p.setCompletedPercentage(percentage);
        projectRepository.save(p);
    }

    private void expense(Project p, User by, int dayOffset, long amount, ExpenseCategory category, String description) {
        Expense expense = new Expense();
        expense.setProject(p);
        expense.setRecordedBy(by);
        expense.setAmount(BigDecimal.valueOf(amount));
        expense.setCategory(category);
        expense.setExpenseDate(today.plusDays(dayOffset));
        expense.setDescription(description);
        expenseRepository.save(expense);
        p.setTotalExpenditure(p.getTotalExpenditure().add(BigDecimal.valueOf(amount)));
        projectRepository.save(p);
    }

    private void milestone(Project p, String title, int targetOffset, boolean completed) {
        Milestone m = new Milestone();
        m.setProject(p);
        m.setTitle(title);
        m.setTargetDate(today.plusDays(targetOffset));
        m.setCompleted(completed);
        if (completed) {
            m.setCompletedDate(m.getTargetDate());
        }
        milestoneRepository.save(m);
    }
}