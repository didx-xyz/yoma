using FluentValidation;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Validators
{
  public abstract class ProgramRequestValidatorBase<TRequest> : AbstractValidator<TRequest>
        where TRequest : ProgramRequestBase
  {
    #region Constructor
    public ProgramRequestValidatorBase()
    {
      // ---------------------------------------
      // Program-level fields
      // ---------------------------------------
      RuleFor(x => x.Name)
          .Cascade(CascadeMode.Stop)
          .NotEmpty()
          .Length(1, 150)
          .WithMessage("Please enter a program name (maximum 150 characters).");

      RuleFor(x => x.Description)
          .Cascade(CascadeMode.Stop)
          .Length(1, 500)
          .When(x => !string.IsNullOrWhiteSpace(x.Description))
          .WithMessage("The description cannot be longer than 500 characters.");

      RuleFor(x => x.CompletionWindowInDays)
          .GreaterThan(0)
          .When(x => x.CompletionWindowInDays.HasValue)
          .WithMessage("Completion window must be greater than 0 days.");

      RuleFor(x => x.CompletionLimitReferee)
          .GreaterThan(0)
          .When(x => x.CompletionLimitReferee.HasValue)
          .WithMessage("Per-referrer completion limit must be greater than 0.");

      RuleFor(x => x.CompletionLimit)
          .GreaterThan(0)
          .When(x => x.CompletionLimit.HasValue)
          .WithMessage("Program completion limit must be greater than 0.");

      RuleFor(x => x.ZltoRewardReferrer)
          .GreaterThan(0)
          .When(x => x.ZltoRewardReferrer.HasValue)
          .WithMessage("Referrer reward must be greater than 0.")
          .LessThanOrEqualTo(2000)
          .When(x => x.ZltoRewardReferrer.HasValue)
          .WithMessage("Referrer reward may not exceed 2000.")
          .Must(v => v.HasValue && v.Value % 1m == 0m)
          .When(x => x.ZltoRewardReferrer.HasValue)
          .WithMessage("Referrer reward must be a whole number.");

      RuleFor(x => x.ZltoRewardReferee)
          .GreaterThan(0)
          .When(x => x.ZltoRewardReferee.HasValue)
          .WithMessage("Referee reward must be greater than 0.")
          .LessThanOrEqualTo(2000)
          .When(x => x.ZltoRewardReferee.HasValue)
          .WithMessage("Referee reward may not exceed 2000.")
          .Must(v => v.HasValue && v.Value % 1m == 0m)
          .When(x => x.ZltoRewardReferee.HasValue)
          .WithMessage("Referee reward must be a whole number.");

      RuleFor(x => x.ZltoRewardPool)
          .GreaterThan(0)
          .When(x => x.ZltoRewardPool.HasValue)
          .WithMessage("Reward pool must be greater than 0.")
          .Must((m, pool) => !pool.HasValue ||
                             pool.Value >= ((m.ZltoRewardReferrer ?? 0m) + (m.ZltoRewardReferee ?? 0m)))
          .WithMessage("Reward pool must be at least the total of the referrer + referee rewards.")
          .LessThanOrEqualTo(10_000_000m)
          .When(x => x.ZltoRewardPool.HasValue)
          .WithMessage("Reward pool may not exceed 10 million.")
          .Must(pool => !pool.HasValue || pool.Value % 1m == 0m)
          .When(x => x.ZltoRewardPool.HasValue)
          .WithMessage("Reward pool must be a whole number.");

      RuleFor(x => x)
          .Must(m =>
          {
            var rewardsConfigured = (m.ZltoRewardReferrer ?? 0m) + (m.ZltoRewardReferee ?? 0m) > 0m;
            if (!rewardsConfigured) return true; // No rewards → no cap required
            return (m.CompletionLimitReferee ?? 0) > 0 || (m.CompletionLimit ?? 0) > 0;
          })
          .WithMessage("When rewards are set, add at least one completion cap (per referrer or program-wide).");

      // Require at least one eligibility gate: POP or Pathway
      RuleFor(x => x)
        .Must(m =>
        {
          var proofRequired = m.ProofOfPersonhoodRequired == true;
          var pathwayRequired = m.PathwayRequired;
          return proofRequired || pathwayRequired;
        })
        .WithMessage("At least one eligibility gate must be enabled: Proof of Personhood or Pathway.");

      RuleFor(x => x.DateStart)
          .NotEmpty()
          .WithMessage("Start Date is required.");

      RuleFor(x => x.DateEnd)
          .GreaterThanOrEqualTo(m => m.DateStart)
          .When(m => m.DateEnd.HasValue)
          .WithMessage("End Date cannot be earlier than the Start Date.");

      // Single default enforced by service

      // ---------------------------------------
      // Pathway rules
      // ---------------------------------------

      // If PathwayRequired == false -> Pathway must be null
      RuleFor(x => x.Pathway)
          .Null()
          .When(x => !x.PathwayRequired)
          .WithMessage("Remove the pathway — this program does not require one.");

      // If PathwayRequired == true -> Pathway must be provided
      RuleFor(x => x.Pathway)
          .NotNull()
          .When(x => x.PathwayRequired)
          .WithMessage("Please add a pathway — this program requires one.");

      // If a Pathway object is present, validate shared base fields
      When(x => x.Pathway != null, () =>
      {
        RuleFor(x => x.Pathway!.Id)
            .Must(id => id == null || id != Guid.Empty)
            .WithMessage("If a pathway Id is specified, it cannot be empty.");

        RuleFor(x => x.Pathway!.Name)
            .NotEmpty()
            .Length(1, 150)
            .WithMessage("Please enter a pathway name (maximum 150 characters).");

        RuleFor(x => x.Pathway!.Description)
            .Length(1, 500)
            .When(o => !string.IsNullOrWhiteSpace(o.Pathway!.Description))
            .WithMessage("The pathway description cannot be longer than 500 characters.");

        RuleFor(x => x.Pathway!)
            .Must(p => p.OrderMode != PathwayOrderMode.Sequential || p.Rule == PathwayCompletionRule.All)
            .WithMessage("When the pathway order mode is 'Sequential', the pathway rule must be 'All' (cannot be 'Any').");

        // ---------------------------------------
        // Steps rules
        // ---------------------------------------
        RuleFor(x => x.Pathway!.Steps)
            .NotNull()
            .When(m => m.PathwayRequired)
            .WithMessage("Please add at least one step to the pathway.")
            .Must(s => s != null && s.Count > 0)
            .When(m => m.PathwayRequired)
            .WithMessage("Please add at least one step to the pathway.");

        // Ensure unique step names within the same pathway (case-insensitive)
        RuleFor(x => x.Pathway!.Steps!)
          .Must(steps =>
          {
            var normalizedNames = steps.Where(s => !string.IsNullOrEmpty(s.Name)).Select(s => s.Name.ToLowerInvariant()).ToList();
            return normalizedNames.Distinct().Count() == normalizedNames.Count;
          })
          .When(m => m.Pathway!.Steps != null && m.Pathway!.Steps.Count > 1)
          .WithMessage("Each step name must be unique within the pathway.");

        // Validate each step
        RuleForEach(x => x.Pathway!.Steps!)
          .ChildRules(step =>
          {
            step.RuleFor(s => s.Id)
             .Must(id => id == null || id != Guid.Empty)
             .WithMessage("If a step Id is specified, it cannot be empty.");

            step.RuleFor(s => s.Name)
                .NotEmpty()
                .Length(1, 150)
                .WithMessage("Please enter a step name (maximum 150 characters).");

            step.RuleFor(s => s.Description)
                .Length(1, 500)
                .When(s => !string.IsNullOrWhiteSpace(s.Description))
                .WithMessage("The step description cannot be longer than 500 characters.");

            step.RuleFor(s => s)
                .Must(s => s.OrderMode != PathwayOrderMode.Sequential || s.Rule == PathwayCompletionRule.All)
                .WithMessage("When a step's order mode is 'Sequential', the step rule must be 'All' (cannot be 'Any').");

            // Each step MUST have ≥ 1 task
            step.RuleFor(s => s.Tasks)
                .NotEmpty()
                .WithMessage("Please add at least one task to each step.");

            // Ensure unique tasks per step by (EntityType, EntityId)
            step.RuleFor(s => s.Tasks!)
                .Must(tasks =>
                {
                  if (tasks == null || tasks.Count <= 1) return true;
                  var keys = tasks
                    .Where(t => t.EntityId != Guid.Empty)
                    .Select(t => (t.EntityType, t.EntityId))
                    .ToList();
                  return keys.Distinct().Count() == keys.Count;
                })
                .WithMessage("Each task in a step must reference a unique entity.");

            // Validate each task
            step.RuleForEach(s => s.Tasks!)
              .ChildRules(task =>
              {
                task.RuleFor(t => t.Id)
                    .Must(id => id == null || id != Guid.Empty)
                    .WithMessage("If a task Id is specified, it cannot be empty.");

                task.RuleFor(t => t.EntityId)
                    .NotEmpty()
                    .WithMessage("Each task must reference an entity.");
              });
          });
      });
    }
    #endregion
  }

  public class ProgramRequestValidatorCreate : ProgramRequestValidatorBase<ProgramRequestCreate>
  {
    #region Constructor
    public ProgramRequestValidatorCreate()
    {
      // Pathway and child entities must not include Ids during creation
      When(x => x.Pathway != null, () =>
      {
        RuleFor(x => x.Pathway!.Id)
          .Must(id => id == null)
          .WithMessage("A new pathway cannot include an Id.");

        RuleForEach(x => x.Pathway!.Steps!)
          .ChildRules(step =>
          {
            step.RuleFor(s => s.Id)
              .Must(id => id == null)
              .WithMessage("New steps cannot include an Id.");

            step.RuleForEach(s => s.Tasks!)
              .ChildRules(task =>
              {
                task.RuleFor(t => t.Id)
                  .Must(id => id == null)
                  .WithMessage("New tasks cannot include an Id.");
              });
          });
      });
    }
    #endregion
  }

  public class ProgramRequestValidatorUpdate : ProgramRequestValidatorBase<ProgramRequestUpdate>
  {
    #region Constructor
    public ProgramRequestValidatorUpdate()
    {
      RuleFor(x => x.Id).NotEmpty().WithMessage("Id is required."); //existence validated by service

      // new pathway is being created during update -> steps & tasks must NOT specify Ids
      When(x => x.Pathway != null && x.Pathway!.Id == null, () =>
      {
        RuleForEach(x => x.Pathway!.Steps!)
          .ChildRules(step =>
          {
            step.RuleFor(s => s.Id)
                .Must(id => id == null)
                .WithMessage("When creating a new pathway, step Ids cannot be specified.");

            step.RuleForEach(s => s.Tasks!)
                .ChildRules(task =>
                {
                  task.RuleFor(t => t.Id)
                      .Must(id => id == null)
                      .WithMessage("When creating a new pathway, task Ids cannot be specified.");
                });
          });
      });

      // new step is being created during update -> that step's tasks must NOT specify Ids
      When(x => x.Pathway != null, () =>
      {
        RuleForEach(x => x.Pathway!.Steps!)
          .ChildRules(step =>
          {
            step.When(s => s.Id == null, () =>
            {
              step.RuleForEach(s => s.Tasks!)
                  .ChildRules(task =>
                  {
                    task.RuleFor(t => t.Id)
                        .Must(id => id == null)
                        .WithMessage("When creating a new step, task Ids cannot be specified.");
                  });
            });
          });
      });
    }
    #endregion
  }
}

