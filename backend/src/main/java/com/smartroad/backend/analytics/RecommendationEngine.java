package com.smartroad.backend.analytics;

import com.smartroad.backend.entity.RecommendationType;
import com.smartroad.backend.entity.Severity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class RecommendationEngine {

    private final AnalyticsProperties props;

    public List<RecommendationItem> generate(EvaluationInput in, HealthIndexResult health,
                                             List<Finding> delay, List<Finding> budget) {
        Map<String, Finding> byCode = new LinkedHashMap<>();
        delay.forEach(f -> byCode.put(f.ruleCode(), f));
        budget.forEach(f -> byCode.put(f.ruleCode(), f));
        List<RecommendationItem> out = new ArrayList<>();

        Finding overdue = byCode.get(RuleCodes.DELAY_OVERDUE);
        Finding gap = byCode.get(RuleCodes.DELAY_PROGRESS_GAP);
        if (overdue != null) {
            // The deadline rule supersedes the general schedule review, so the two never both appear.
            out.add(issue(RuleCodes.REC_OVERDUE_REVIEW, "Deadline passed with incomplete work", Severity.HIGH,
                    overdue.reason(),
                    "Carry out an immediate project review and prepare a revised completion plan.",
                    "DELAY_OVERDUE: the deadline has passed and the project is not complete"));
        } else if (gap != null) {
            out.add(issue(RuleCodes.REC_SCHEDULE_REVIEW, "Progress behind the planned schedule", gap.severity(),
                    gap.reason(),
                    "Review the construction schedule and resource allocation.",
                    String.format(Locale.ROOT,
                            "DELAY_PROGRESS_GAP: actual progress is more than %.0f percentage points below the plan",
                            props.getDelayReviewGapPoints())));
        }

        Finding milestone = byCode.get(RuleCodes.DELAY_MILESTONE);
        if (milestone != null) {
            out.add(issue(RuleCodes.REC_MILESTONE_PRIORITY, "Milestone overdue", milestone.severity(),
                    milestone.reason(),
                    "Prioritise the delayed activity: " + String.join("; ", in.overdueMilestones()) + ".",
                    "DELAY_MILESTONE: a milestone passed its target date without being completed"));
        }

        Finding noUpdate = byCode.get(RuleCodes.DELAY_NO_UPDATE);
        if (noUpdate != null) {
            out.add(issue(RuleCodes.REC_UPDATE_REQUEST, noUpdate.title(), noUpdate.severity(),
                    noUpdate.reason(),
                    "Ask the assigned site engineer to submit a current progress update.",
                    String.format(Locale.ROOT,
                            "DELAY_NO_UPDATE: no progress update in the last %d days", props.getStaleUpdateDays())));
        }

        Finding over = byCode.get(RuleCodes.BUDGET_OVER);
        Finding ahead = byCode.get(RuleCodes.BUDGET_AHEAD);
        Finding near = byCode.get(RuleCodes.BUDGET_NEAR_LIMIT);
        if (over != null) {
            out.add(issue(RuleCodes.REC_BUDGET_OVERRUN, "Recorded expenditure exceeds the budget", Severity.HIGH,
                    over.reason(),
                    "Review spending immediately, stop non-essential expenses and prepare a budget revision request.",
                    "BUDGET_OVER: recorded expenditure is above the allocated budget"));
        } else if (ahead != null) {
            out.add(issue(RuleCodes.REC_EXPENSE_REVIEW, "Expenditure high compared with completed work",
                    ahead.severity(), ahead.reason(),
                    "Review the expense records and work completion data before approving further spending.",
                    String.format(Locale.ROOT,
                            "BUDGET_AHEAD: spending is more than %.0f points ahead of completed work",
                            props.getBudgetReviewGapPoints())));
        } else if (near != null) {
            out.add(issue(RuleCodes.REC_BUDGET_WATCH, "Approaching the budget limit", near.severity(),
                    near.reason(),
                    "Monitor the remaining budget closely and plan the remaining work within it.",
                    String.format(Locale.ROOT,
                            "BUDGET_NEAR_LIMIT: at least %.0f%% of the budget is spent and work is behind spending",
                            props.getNearLimitPercent())));
        }

        Finding rapid = byCode.get(RuleCodes.BUDGET_RAPID_SPEND);
        if (rapid != null) {
            out.add(issue(RuleCodes.REC_RECENT_SPEND_CHECK, "Rapid increase in expenses", rapid.severity(),
                    rapid.reason(),
                    "Verify the recent large expenses against the work completed.",
                    String.format(Locale.ROOT,
                            "BUDGET_RAPID_SPEND: recent daily spending is more than %.1f times the earlier average",
                            props.getRapidSpendMultiplier())));
        }

        boolean hasIssue = byCode.containsKey(RuleCodes.DELAY_OVERDUE)
                || byCode.containsKey(RuleCodes.DELAY_PROGRESS_GAP)
                || byCode.containsKey(RuleCodes.DELAY_MILESTONE)
                || byCode.containsKey(RuleCodes.BUDGET_OVER)
                || byCode.containsKey(RuleCodes.BUDGET_AHEAD)
                || byCode.containsKey(RuleCodes.BUDGET_NEAR_LIMIT)
                || byCode.containsKey(RuleCodes.BUDGET_RAPID_SPEND);

        double utilization = AnalyticsMath.utilizationPercent(in.metrics().totalExpenditure(),
                in.metrics().totalBudget());
        if (!hasIssue && health.healthIndex() >= props.getHealthyThreshold()) {
            out.add(new RecommendationItem(RuleCodes.REC_ON_TRACK, RecommendationType.POSITIVE,
                    "No issues detected", Severity.LOW,
                    String.format(Locale.ROOT,
                            "Health index %.1f (%s): progress is %.1f%% against %.1f%% planned and %.1f%% of the budget is spent.",
                            health.healthIndex(), health.category().getLabel(), health.actualProgress(),
                            health.plannedProgress(), utilization),
                    "Continue the current plan and keep progress and expense records up to date.",
                    String.format(Locale.ROOT,
                            "REC_ON_TRACK: no delay or budget rule fired and the health index is at least %.0f",
                            props.getHealthyThreshold())));
        } else if (out.isEmpty()) {
            out.add(issue(RuleCodes.REC_MONITOR, "Health index below the healthy range", Severity.LOW,
                    String.join(" ", health.factors()),
                    "Review the factors behind the health index and monitor the next progress update.",
                    String.format(Locale.ROOT,
                            "REC_MONITOR: health index %.1f is below %.0f but no alert rule fired",
                            health.healthIndex(), props.getHealthyThreshold())));
        }

        out.sort((a, b) -> b.severity().compareTo(a.severity()));
        return out;
    }

    private RecommendationItem issue(String code, String issue, Severity severity, String reason,
                                     String action, String triggeredRule) {
        return new RecommendationItem(code, RecommendationType.ISSUE, issue, severity, reason, action, triggeredRule);
    }
}