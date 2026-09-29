namespace Yoma.Core.Domain.Opportunity
{
  /// <summary>
  /// Stable contracts for system-controlled opportunity fields used by integrations.
  /// These identify metadata; resolution and validation remain in the common CF framework.
  /// Do not duplicate ordinary configurable fields or their display labels here.
  /// </summary>
  public static class CustomFieldConstants
  {
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
