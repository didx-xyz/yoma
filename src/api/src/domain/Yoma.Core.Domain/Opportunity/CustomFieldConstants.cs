namespace Yoma.Core.Domain.Opportunity
{
  /// <summary>
  /// Stable keys and mapping targets for opportunity fields referenced by code or integrations.
  /// These identify metadata; resolution and validation remain in the common CF framework.
  /// A shared mapping constant does not make a field system-controlled. Do not duplicate
  /// the configurable catalogue or its display labels here.
  /// </summary>
  public static class CustomFieldConstants
  {
    #region Impact Action
    public static class ImpactAction
    {
      public static class Tools
      {
        public const string Required = "ImpactActionToolsRequired";
        public const string OtherDescription = "ImpactActionToolsOtherDescription";
      }
    }
    #endregion

    #region Job
    public static class Job
    {
      public static class Salary
      {
        public const string Disclosed = "JobSalaryDisclosed";
        public const string Minimum = "JobSalaryMinimum";
        public const string Maximum = "JobSalaryMaximum";
        public const string Currency = "JobSalaryCurrency";
        public const string PayInterval = "JobPayInterval";

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
        public const string Type = "JobEmploymentType";
        public const string Schedule = "JobWorkSchedule";
        public const string Duration = "JobEmploymentDuration";
        public const string DurationUnit = "JobEmploymentDurationUnit";

        public static class ScheduleOptions
        {
          public const string FullTime = "FullTime";
          public const string PartTime = "PartTime";
        }
      }

      public const string Industry = "JobIndustry";

      public const string MinimumQualification = "JobMinimumQualification";

      public static class Experience
      {
        public const string Level = "JobExperienceLevel";

        public static class Options
        {
          public const string None = "None";
          public const string EntryJunior = "EntryJunior";
          public const string Mid = "Mid";
          public const string Senior = "Senior";
        }
      }

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

    #region Entrepreneurship
    public static class Entrepreneurship
    {
      public static class Programme
      {
        public const string Type = "EntrepreneurshipProgrammeType";
        public const string OtherDescription = "EntrepreneurshipProgrammeOtherDescription";
      }
    }
    #endregion

    #region Difficulty
    public static class Difficulty
    {
      public static class Keys
      {
        public const string Learning = "LearningDifficulty";
        public const string Other = "OtherDifficulty";
        public const string ImpactAction = "ImpactActionDifficulty";
        public const string Event = "EventDifficulty";
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
