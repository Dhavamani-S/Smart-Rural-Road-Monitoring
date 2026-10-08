package com.smartroad.backend.analytics;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.analytics")
@Getter
@Setter
public class AnalyticsProperties {

    // Road Health Index
    private double weightProgress = 0.40;
    private double weightBudget = 0.30;
    private double weightSchedule = 0.30;
    private double healthyThreshold = 80;
    private double attentionThreshold = 60;
    private double scheduleTolerancePoints = 5;
    private double schedulePenaltyPerPoint = 2.0;
    private double missedMilestonePenalty = 10;
    private double overdueScoreCap = 20;
    private double budgetTolerancePoints = 5;
    private double budgetPenaltyPerPoint = 2.0;
    private double overBudgetScoreCap = 30;
    private int staleUpdateDays = 14;

    // Delay detection
    private double delayReviewGapPoints = 15;
    private double delaySevereGapPoints = 30;
    private int missedMilestoneHighCount = 3;
    private int staleUpdateMediumDays = 30;

    // Budget risk detection
    private double budgetReviewGapPoints = 15;
    private double budgetSevereGapPoints = 30;
    private double nearLimitPercent = 90;
    private int rapidWindowDays = 14;
    private double rapidSpendMultiplier = 2.0;
    private double rapidMinPercentOfBudget = 10;
    private double rapidFirstSpendPercentOfBudget = 30;
}