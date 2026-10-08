package com.smartroad.backend.analytics;

import com.smartroad.backend.entity.AlertCategory;
import com.smartroad.backend.entity.ProjectStatus;
import com.smartroad.backend.entity.Severity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class DelayDetector {

    private final AnalyticsProperties props;

    public List<Finding> detect(EvaluationInput in) {
        ProjectMetrics m = in.metrics();
        List<Finding> findings = new ArrayList<>();

        double actual = AnalyticsMath.clamp(m.completedPercentage(), 0, 100);
        boolean completed = m.status() == ProjectStatus.COMPLETED || actual >= 100;
        if (completed || m.today().isBefore(m.startDate())) {
            return findings;
        }
        double planned = AnalyticsMath.plannedProgress(m.startDate(), m.deadline(), m.today());

        if (m.today().isAfter(m.deadline())) {
            long days = ChronoUnit.DAYS.between(m.deadline(), m.today());
            findings.add(new Finding(AlertCategory.DELAY, RuleCodes.DELAY_OVERDUE, Severity.HIGH,
                    "Deadline passed and project incomplete",
                    String.format(Locale.ROOT,
                            "The deadline (%s) passed %d day(s) ago and only %.1f%% of the work is complete.",
                            m.deadline(), days, actual),
                    "Hold an immediate project review and prepare a revised completion plan.",
                    true));
        }

        if (m.status() == ProjectStatus.ON_HOLD) {
            return findings;
        }

        double gap = planned - actual;
        if (gap > props.getDelayReviewGapPoints()) {
            Severity severity = gap >= props.getDelaySevereGapPoints() ? Severity.HIGH : Severity.MEDIUM;
            findings.add(new Finding(AlertCategory.DELAY, RuleCodes.DELAY_PROGRESS_GAP, severity,
                    "Progress behind the planned schedule",
                    String.format(Locale.ROOT,
                            "Project delayed: actual progress is %.1f percentage points below planned progress "
                                    + "(actual %.1f%%, planned %.1f%%).", gap, actual, planned),
                    "Review the construction schedule and resource allocation.",
                    false));
        }

        List<String> overdueMilestones = in.overdueMilestones();
        if (!overdueMilestones.isEmpty()) {
            Severity severity = overdueMilestones.size() >= props.getMissedMilestoneHighCount()
                    ? Severity.HIGH : Severity.MEDIUM;
            findings.add(new Finding(AlertCategory.DELAY, RuleCodes.DELAY_MILESTONE, severity,
                    "Milestone overdue",
                    String.format(Locale.ROOT,
                            "%d milestone(s) passed their target date without being marked complete: %s.",
                            overdueMilestones.size(), String.join("; ", overdueMilestones)),
                    "Prioritise the delayed milestone activity and confirm a revised target date.",
                    false));
        }

        if (m.lastProgressUpdate() == null) {
            long daysSinceStart = ChronoUnit.DAYS.between(m.startDate(), m.today());
            if (daysSinceStart > props.getStaleUpdateDays()) {
                findings.add(new Finding(AlertCategory.DELAY, RuleCodes.DELAY_NO_UPDATE, Severity.MEDIUM,
                        "No progress update recorded",
                        "No progress update has been recorded since the project started "
                                + daysSinceStart + " day(s) ago.",
                        "Ask the assigned site engineer to submit a current progress update.",
                        false));
            }
        } else {
            long days = ChronoUnit.DAYS.between(m.lastProgressUpdate(), m.today());
            if (days > props.getStaleUpdateDays()) {
                Severity severity = days > props.getStaleUpdateMediumDays() ? Severity.MEDIUM : Severity.LOW;
                findings.add(new Finding(AlertCategory.DELAY, RuleCodes.DELAY_NO_UPDATE, severity,
                        "No recent progress update",
                        "The last progress update was " + days + " day(s) ago.",
                        "Ask the assigned site engineer to submit a current progress update.",
                        false));
            }
        }
        return findings;
    }
}