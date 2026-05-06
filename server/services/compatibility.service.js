/**
 * Room Rental Compatibility Service
 * Calculates compatibility score between host and potential tenant
 * Based on lifestyle preferences and requirements
 */

class CompatibilityService {
  /**
   * Calculate overall compatibility score
   * @param {Object} hostProfile - Host's lifestyle profile
   * @param {Object} tenantProfile - Tenant's lifestyle profile
   * @returns {Object} - { score: Number, breakdown: Object }
   */
  calculateCompatibility(hostProfile, tenantProfile) {
    if (!hostProfile || !tenantProfile) {
      throw new Error("Both host and tenant profiles are required");
    }

    const breakdown = {
      sleepSchedule: this.compareSleepSchedule(
        hostProfile.sleepSchedule,
        tenantProfile.sleepSchedule
      ),
      smoking: this.compareSmokingPreference(
        hostProfile.smoking,
        tenantProfile.smoking
      ),
      cleanliness: this.compareCleanliness(
        hostProfile.cleanliness,
        tenantProfile.cleanliness
      ),
      noiseTolerance: this.compareNoiseTolerance(
        hostProfile.noiseTolerance,
        tenantProfile.noiseTolerance
      ),
      guestPolicy: this.compareGuestPolicy(
        hostProfile.guestPolicy,
        tenantProfile.guestPolicy
      ),
      petPreference: this.comparePetPreference(
        hostProfile.pets,
        tenantProfile.pets
      ),
      personality: this.comparePersonality(
        hostProfile.personality,
        tenantProfile.personality
      ),
    };

    // Calculate total score
    const totalScore =
      breakdown.sleepSchedule +
      breakdown.smoking +
      breakdown.cleanliness +
      breakdown.noiseTolerance +
      breakdown.guestPolicy +
      breakdown.petPreference +
      breakdown.personality;

    return {
      score: Math.round(totalScore),
      breakdown,
      recommendation: this.getRecommendation(totalScore),
    };
  }

  /**
   * Compare sleep schedules (20% weight)
   */
  compareSleepSchedule(host, tenant) {
    const maxScore = 20;

    if (!host || !tenant) return 0;

    const schedules = {
      early_bird: 1, // Sleep before 10pm, wake before 6am
      normal: 2, // Sleep 10pm-12am, wake 6am-8am
      night_owl: 3, // Sleep after 12am, wake after 8am
    };

    const hostValue = schedules[host] || 2;
    const tenantValue = schedules[tenant] || 2;

    const difference = Math.abs(hostValue - tenantValue);

    // Perfect match
    if (difference === 0) return maxScore;
    // Close match
    if (difference === 1) return maxScore * 0.7;
    // Poor match
    return maxScore * 0.3;
  }

  /**
   * Compare smoking preferences (25% weight - DEAL BREAKER)
   */
  compareSmokingPreference(host, tenant) {
    const maxScore = 25;

    if (!host || !tenant) return 0;

    const hostSmokes = host === "yes" || host === "occasionally";
    const tenantSmokes = tenant === "yes" || tenant === "occasionally";

    // Both smoke or both don't smoke - perfect match
    if (hostSmokes === tenantSmokes) return maxScore;

    // One smokes, one doesn't - DEAL BREAKER
    return 0;
  }

  /**
   * Compare cleanliness standards (15% weight)
   */
  compareCleanliness(host, tenant) {
    const maxScore = 15;

    if (!host || !tenant) return 0;

    // Convert to numeric scale (1-5)
    const hostLevel = parseInt(host) || 3;
    const tenantLevel = parseInt(tenant) || 3;

    const difference = Math.abs(hostLevel - tenantLevel);

    // Perfect match (same level)
    if (difference === 0) return maxScore;
    // Close (1 level difference)
    if (difference === 1) return maxScore * 0.8;
    // Acceptable (2 levels)
    if (difference === 2) return maxScore * 0.5;
    // Poor match (3+ levels)
    return maxScore * 0.2;
  }

  /**
   * Compare noise tolerance (10% weight)
   */
  compareNoiseTolerance(host, tenant) {
    const maxScore = 10;

    if (!host || !tenant) return 0;

    const levels = {
      very_quiet: 1,
      quiet: 2,
      moderate: 3,
      tolerant: 4,
      very_tolerant: 5,
    };

    const hostLevel = levels[host] || 3;
    const tenantLevel = levels[tenant] || 3;

    const difference = Math.abs(hostLevel - tenantLevel);

    if (difference === 0) return maxScore;
    if (difference === 1) return maxScore * 0.7;
    if (difference === 2) return maxScore * 0.4;
    return maxScore * 0.2;
  }

  /**
   * Compare guest policy (10% weight)
   */
  compareGuestPolicy(host, tenant) {
    const maxScore = 10;

    if (!host || !tenant) return 0;

    const policies = {
      no_guests: 1,
      rare: 2, // Once a month
      occasional: 3, // Few times a month
      frequent: 4, // Weekly
      very_frequent: 5, // Multiple times a week
    };

    const hostPolicy = policies[host] || 2;
    const tenantPolicy = policies[tenant] || 2;

    const difference = Math.abs(hostPolicy - tenantPolicy);

    if (difference === 0) return maxScore;
    if (difference === 1) return maxScore * 0.7;
    if (difference === 2) return maxScore * 0.5;
    return maxScore * 0.3;
  }

  /**
   * Compare pet preferences (15% weight - DEAL BREAKER)
   */
  comparePetPreference(host, tenant) {
    const maxScore = 15;

    if (!host || !tenant) return 0;

    // Host has pets
    const hostHasPets = host === "yes" || host === "has_pets";
    // Tenant wants to bring pets
    const tenantWantsPets = tenant === "yes" || tenant === "has_pets";
    // Host allows pets
    const hostAllowsPets = host === "yes" || host === "allowed";
    // Tenant is allergic or doesn't like pets
    const tenantAllergic = tenant === "allergic" || tenant === "no";

    // Deal breaker scenarios
    if (hostHasPets && tenantAllergic) return 0;
    if (tenantWantsPets && host === "no") return 0;

    // Perfect matches
    if (!hostHasPets && !tenantWantsPets) return maxScore;
    if (hostHasPets && tenant === "yes") return maxScore;
    if (hostAllowsPets && tenantWantsPets) return maxScore;

    // Neutral
    return maxScore * 0.6;
  }

  /**
   * Compare personality types (5% weight)
   */
  comparePersonality(host, tenant) {
    const maxScore = 5;

    if (!host || !tenant) return 0;

    const types = {
      very_introverted: 1,
      introverted: 2,
      balanced: 3,
      extroverted: 4,
      very_extroverted: 5,
    };

    const hostType = types[host] || 3;
    const tenantType = types[tenant] || 3;

    // Similar personalities
    const difference = Math.abs(hostType - tenantType);

    if (difference === 0) return maxScore;
    if (difference === 1) return maxScore * 0.8;
    if (difference === 2) return maxScore * 0.6;
    return maxScore * 0.4;
  }

  /**
   * Get recommendation based on score
   */
  getRecommendation(score) {
    if (score >= 90) return "excellent_match";
    if (score >= 75) return "good_match";
    if (score >= 60) return "potential_match";
    return "not_recommended";
  }

  /**
   * Check if profiles have deal-breaker conflicts
   */
  haseDealBreakers(hostProfile, tenantProfile) {
    const dealBreakers = [];

    // Smoking conflict
    const smokingScore = this.compareSmokingPreference(
      hostProfile.smoking,
      tenantProfile.smoking
    );
    if (smokingScore === 0) {
      dealBreakers.push({
        type: "smoking",
        message: "Smoking preference conflict",
      });
    }

    // Pet conflict
    const petScore = this.comparePetPreference(
      hostProfile.pets,
      tenantProfile.pets
    );
    if (petScore === 0) {
      dealBreakers.push({
        type: "pets",
        message: "Pet preference conflict",
      });
    }

    return dealBreakers;
  }
}

module.exports = new CompatibilityService();

