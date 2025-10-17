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

      // If rewards exist, require at least one gate: POP or Pathway
      RuleFor(x => x)
        .Must(m =>
        {
          var rewards = (m.ZltoRewardReferrer ?? 0m) + (m.ZltoRewardReferee ?? 0m) > 0m;
          if (!rewards) return true;
          return m.ProofOfPersonhoodRequired || m.PathwayRequired;
        })
        .WithMessage("When rewards are set, enable Proof of Personhood or require a Pathway.");

      // If program is marked as default, require POP or Pathway
      RuleFor(x => x)
        .Must(m =>
        {
          if (!m.IsDefault) return true;
          return m.ProofOfPersonhoodRequired || m.PathwayRequired;
        })
        .WithMessage("Default programs must enable Proof of Personhood or require a Pathway.");

      // If multiple links are allowed, require POP or a per-referrer cap (and optionally Pathway)
      RuleFor(x => x)
        .Must(m =>
        {
          if (!m.MultipleLinksAllowed) return true;
          var hasPerReferrerCap = (m.CompletionLimitReferee ?? 0) > 0;
          return m.ProofOfPersonhoodRequired || hasPerReferrerCap || m.PathwayRequired;
        })
        .WithMessage("When multiple links are allowed, enable Proof of Personhood, set a per-referrer cap, or require a Pathway.");

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
            .WithMessage("If a pathway ID is specified, it cannot be empty.");

        RuleFor(x => x.Pathway!.Name)
            .NotEmpty()
            .Length(1, 150)
            .WithMessage("Please enter a pathway name (maximum 150 characters).");

        RuleFor(x => x.Pathway!.Description)
            .Length(1, 500)
            .When(o => !string.IsNullOrWhiteSpace(o.Pathway!.Description))
            .WithMessage("The pathway description cannot be longer than 500 characters.");

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

            // Rule must be All or Any
            step.RuleFor(s => s.Rule)
                .Must(r => r == PathwayStepRule.All || r == PathwayStepRule.Any)
                .WithMessage("Step rule must be either 'All' or 'Any'.");

            // Each step MUST have ≥ 1 task
            step.RuleFor(s => s.Tasks)
                .NotNull().WithMessage("Please add at least one task to each step.")
                .Must(t => t != null && t.Count > 0).WithMessage("Please add at least one task to each step.");

            // Task ordering rule (optional but if used → 1..N, no gaps/dupes, and in order)
            step.RuleFor(s => s.Tasks!)
                .Must(IsSequentialOrdered)
                .When(s => s.Tasks != null && s.Tasks.Count > 0)
                .WithMessage("Task order must be 1, 2, 3... without gaps or duplicates, in the same order as listed.");

            // Validate each task (EntityType enum is required by model; no specific value restriction)
            step.RuleForEach(s => s.Tasks!)
              .ChildRules(task =>
              {
                task.RuleFor(t => t.Id)
                 .Must(id => id == null || id != Guid.Empty)
                 .WithMessage("If a task ID is specified, it cannot be empty.");

                task.RuleFor(t => t.EntityId)
                    .NotEmpty()
                    .WithMessage("Each task must reference an entity.");

                // Optional order, but if provided must be ≥1 (the sequential rule above enforces exact sequence)
                task.RuleFor(t => t.Order)
                    .GreaterThanOrEqualTo((byte)1)
                    .When(t => t.Order.HasValue)
                    .WithMessage("Task order must be 1 or higher.");
              });
          });

        // Step ordering rule (optional but if used → 1..N, no gaps/dupes, and in order)
        RuleFor(x => x.Pathway!.Steps!)
          .Must(IsSequentialOrdered)
          .When(m => m.PathwayRequired && m.Pathway!.Steps != null && m.Pathway!.Steps.Count > 0)
          .WithMessage("Step order must be 1, 2, 3... without gaps or duplicates, in the same order as listed.");
      });
    }
    #endregion

    #region Private Members
    // Ordering is optional:
    // - If none have Order → OK
    // - If any have Order → ALL must have Order, be 1..N with no gaps/dupes, and align to list position (i == Order-1)
    private static bool IsSequentialOrdered<TItem>(IList<TItem> items) where TItem : class
    {
      // Extract nullable byte? Order via reflection-like pattern with dynamic accessor
      static byte? GetOrder(TItem it)
      {
        var prop = typeof(TItem).GetProperty("Order");
        return (byte?)prop?.GetValue(it);
      }

      var orders = items.Select(GetOrder).ToList();

      // Case 1: none specified -> valid
      if (orders.All(o => !o.HasValue))
        return true;

      // Case 2: some specified but not all -> invalid
      if (orders.Any(o => !o.HasValue))
        return false;

      // All specified. Check 1..N sequential and in list order
      var values = orders.Select(o => o!.Value).ToList();
      var n = values.Count;

      // No duplicates, min=1, max=n
      if (values.Distinct().Count() != n) return false;
      if (values.Min() != 1) return false;
      if (values.Max() != n) return false;

      // In order relative to list index (i -> Order == i+1)
      for (int i = 0; i < n; i++)
      {
        if (values[i] != i + 1) return false;
      }

      return true;
    }
    #endregion
  }

  public class ProgramRequestValidatorCreate : ProgramRequestValidatorBase<ProgramRequestCreate>
  {
    #region Constructor
    public ProgramRequestValidatorCreate()
    {
      // Pathway and child entities must not include IDs during creation
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
      RuleFor(x => x.Id).NotEmpty(); //existence validated by service

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
