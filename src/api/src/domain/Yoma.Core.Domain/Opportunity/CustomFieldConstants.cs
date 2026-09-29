namespace Yoma.Core.Domain.Opportunity
{
  /// <summary>
  /// Stable contracts for system-controlled opportunity fields used by integrations.
  /// These identify metadata; resolution and validation remain in the common CF framework.
  /// Do not duplicate ordinary configurable fields or their display labels here.
  /// </summary>
  public static class CustomFieldConstants
  {
    #region Impact Action
    public static class ImpactAction
    {
      public static class Tools
      {
        public const string Required = "impactActionToolsRequired";
        public const string OtherDescription = "impactActionToolsOtherDescription";
      }
    }
    #endregion

    #region Job
    public static class Job
    {
      public static class Salary
      {
        public const string Disclosed = "jobSalaryDisclosed";
        public const string Minimum = "jobSalaryMinimum";
        public const string Maximum = "jobSalaryMaximum";
        public const string Currency = "jobSalaryCurrency";
        public const string PayInterval = "jobPayInterval";

        public static class PayIntervalOptions
        {
          public const string PerYear = "PerYear";
          public const string PerMonth = "PerMonth";
          public const string PerHour = "PerHour";
          public const string PerEngagement = "PerEngagement";
        }
      }

      public static class Employment
      {
        public const string Type = "jobEmploymentType";
        public const string Schedule = "jobWorkSchedule";
        public const string Duration = "jobEmploymentDuration";
        public const string DurationUnit = "jobEmploymentDurationUnit";

        public static class ScheduleOptions
        {
          public const string FullTime = "FullTime";
          public const string PartTime = "PartTime";
        }
      }

      public const string Industry = "jobIndustry";

      public static class IndustryOptions
      {
        public const string Manufacturing = "C";
        public const string Retail = "G";
        public const string Transport = "H";
        public const string Hospitality = "I";
        public const string BusinessSupport = "O";
      }
    }
    #endregion

    #region Difficulty
    public static class Difficulty
    {
      public static class Keys
      {
        public const string Learning = "learningDifficulty";
        public const string Other = "otherDifficulty";
        public const string ImpactAction = "impactActionDifficulty";
        public const string Event = "eventDifficulty";
      }

      /// <summary>
      /// Shared mapping targets, not a complete catalogue of configured options.
      /// Options selected by logical operations use the corresponding domain enum instead.
      /// </summary>
      public static class Options
      {
        public const string Beginner = "Beginner";
        public const string Intermediate = "Intermediate";
        public const string Advanced = "Advanced";
        public const string EntryLevel = "EntryLevel";
        public const string ExperienceNeeded = "ExperienceNeeded";
        public const string SkillsRequired = "SkillsRequired";
        public const string OpenToAll = "OpenToAll";
        public const string FamiliarityNeeded = "FamiliarityNeeded";
        public const string ExperiencedIndividuals = "ExperiencedIndividuals";
      }
    }
    #endregion
  }
}
