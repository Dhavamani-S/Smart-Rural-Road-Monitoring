package com.smartroad.backend.analytics;

public final class RuleCodes {

    private RuleCodes() {
    }

    public static final String DELAY_OVERDUE = "DELAY_OVERDUE";
    public static final String DELAY_PROGRESS_GAP = "DELAY_PROGRESS_GAP";
    public static final String DELAY_MILESTONE = "DELAY_MILESTONE";
    public static final String DELAY_NO_UPDATE = "DELAY_NO_UPDATE";

    public static final String BUDGET_OVER = "BUDGET_OVER";
    public static final String BUDGET_AHEAD = "BUDGET_AHEAD";
    public static final String BUDGET_NEAR_LIMIT = "BUDGET_NEAR_LIMIT";
    public static final String BUDGET_RAPID_SPEND = "BUDGET_RAPID_SPEND";

    public static final String REC_OVERDUE_REVIEW = "REC_OVERDUE_REVIEW";
    public static final String REC_SCHEDULE_REVIEW = "REC_SCHEDULE_REVIEW";
    public static final String REC_MILESTONE_PRIORITY = "REC_MILESTONE_PRIORITY";
    public static final String REC_UPDATE_REQUEST = "REC_UPDATE_REQUEST";
    public static final String REC_BUDGET_OVERRUN = "REC_BUDGET_OVERRUN";
    public static final String REC_EXPENSE_REVIEW = "REC_EXPENSE_REVIEW";
    public static final String REC_BUDGET_WATCH = "REC_BUDGET_WATCH";
    public static final String REC_RECENT_SPEND_CHECK = "REC_RECENT_SPEND_CHECK";
    public static final String REC_ON_TRACK = "REC_ON_TRACK";
    public static final String REC_MONITOR = "REC_MONITOR";
}