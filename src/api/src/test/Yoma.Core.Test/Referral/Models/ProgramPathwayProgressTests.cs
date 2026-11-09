using Xunit;
using Yoma.Core.Domain.Referral;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Test.Referral.Models
{
  public class ProgramPathwayProgressTests
  {
    private static readonly DateTimeOffset FirstCompletion = new(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);

    [Theory]
    [InlineData(PathwayCompletionRule.Any, 0, false, 0)]
    [InlineData(PathwayCompletionRule.Any, 1, true, 100)]
    [InlineData(PathwayCompletionRule.Any, 2, true, 100)]
    [InlineData(PathwayCompletionRule.All, 0, false, 0)]
    [InlineData(PathwayCompletionRule.All, 1, false, 50)]
    [InlineData(PathwayCompletionRule.All, 2, true, 100)]
    public void Step_CompletionHonoursRule(
      PathwayCompletionRule rule, int completedCount, bool expectedCompleted, int expectedPercent)
    {
      var step = CreateStep(rule, completedCount);

      Assert.Equal(expectedCompleted, step.Completed);
      Assert.Equal(expectedPercent, step.PercentComplete);
      Assert.Equal(2, step.TasksTotal);
      Assert.Equal(completedCount, step.TasksCompleted);
      Assert.Equal(expectedCompleted
        ? rule == PathwayCompletionRule.Any ? FirstCompletion : FirstCompletion.AddDays(1)
        : (DateTimeOffset?)null, step.DateCompleted);
    }

    [Theory]
    [InlineData(PathwayCompletionRule.Any, 0, false, 0)]
    [InlineData(PathwayCompletionRule.Any, 1, true, 100)]
    [InlineData(PathwayCompletionRule.Any, 2, true, 100)]
    [InlineData(PathwayCompletionRule.All, 0, false, 0)]
    [InlineData(PathwayCompletionRule.All, 1, false, 50)]
    [InlineData(PathwayCompletionRule.All, 2, true, 100)]
    public void Pathway_CompletionHonoursRule(
      PathwayCompletionRule rule, int completedCount, bool expectedCompleted, int expectedPercent)
    {
      var pathway = new ProgramPathwayProgress
      {
        Rule = rule,
        Steps = [CreateStep(PathwayCompletionRule.All, completedCount > 0 ? 2 : 0),
          CreateStep(PathwayCompletionRule.All, completedCount > 1 ? 2 : 0)]
      };
      foreach (var task in pathway.Steps[1].Tasks)
        task.DateCompleted = task.DateCompleted?.AddDays(2);

      Assert.Equal(expectedCompleted, pathway.Completed);
      Assert.Equal(expectedPercent, pathway.PercentComplete);
      Assert.Equal(2, pathway.StepsTotal);
      Assert.Equal(completedCount, pathway.StepsCompleted);
      Assert.Equal(expectedCompleted
        ? rule == PathwayCompletionRule.Any ? FirstCompletion.AddDays(1) : FirstCompletion.AddDays(3)
        : (DateTimeOffset?)null, pathway.DateCompleted);
    }

    [Theory]
    [InlineData(PathwayCompletionRule.Any, PathwayCompletionRule.Any, true, 100)]
    [InlineData(PathwayCompletionRule.Any, PathwayCompletionRule.All, false, 0)]
    [InlineData(PathwayCompletionRule.All, PathwayCompletionRule.Any, false, 50)]
    [InlineData(PathwayCompletionRule.All, PathwayCompletionRule.All, false, 25)]
    public void NestedRules_CombineWithoutRequiringUnusedAlternatives(
      PathwayCompletionRule pathwayRule, PathwayCompletionRule stepRule, bool expectedCompleted, int expectedPercent)
    {
      var pathway = new ProgramPathwayProgress
      {
        Rule = pathwayRule,
        Steps = [CreateStep(stepRule, 1), CreateStep(PathwayCompletionRule.All, 0)]
      };

      Assert.Equal(expectedCompleted, pathway.Completed);
      Assert.Equal(expectedPercent, pathway.PercentComplete);
      Assert.Equal(expectedCompleted ? FirstCompletion : (DateTimeOffset?)null, pathway.DateCompleted);
    }

    [Theory]
    [InlineData(PathwayCompletionRule.Any)]
    [InlineData(PathwayCompletionRule.All)]
    public void EmptyCollections_PreserveCompletedWithoutDate(PathwayCompletionRule rule)
    {
      var step = new ProgramPathwayStepProgress { Rule = rule, Tasks = [] };
      var pathway = new ProgramPathwayProgress { Rule = rule, Steps = [] };

      Assert.True(step.Completed);
      Assert.Equal(100m, step.PercentComplete);
      Assert.Null(step.DateCompleted);
      Assert.True(pathway.Completed);
      Assert.Equal(100m, pathway.PercentComplete);
      Assert.Null(pathway.DateCompleted);
    }

    [Theory]
    [InlineData(PathwayCompletionRule.Any)]
    [InlineData(PathwayCompletionRule.All)]
    public void CompletedWithoutDates_DoesNotInventCompletionDate(PathwayCompletionRule rule)
    {
      var step = CreateStep(rule, 2);
      step.Tasks.ForEach(task => task.DateCompleted = null);
      var pathway = new ProgramPathwayProgress { Rule = rule, Steps = [step] };

      Assert.True(step.Completed);
      Assert.Null(step.DateCompleted);
      Assert.True(pathway.Completed);
      Assert.Null(pathway.DateCompleted);
    }

    private static ProgramPathwayStepProgress CreateStep(PathwayCompletionRule rule, int completedCount)
    {
      return new ProgramPathwayStepProgress
      {
        Rule = rule,
        Tasks = [.. Enumerable.Range(0, 2).Select(index => new ProgramPathwayTaskProgress
        {
          Completed = index < completedCount,
          DateCompleted = index < completedCount ? FirstCompletion.AddDays(index) : null
        })]
      };
    }
  }
}
