using FluentValidation;
using Microsoft.AspNetCore.Http;
using System.Transactions;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Referral.Validators;

namespace Yoma.Core.Domain.Referral.Services
{
  public class ProgramService : IProgramService
  {
    #region Class Variables
    private readonly IHttpContextAccessor _httpContextAccessor;

    private readonly IProgramStatusService _programStatusService;
    private readonly IOpportunityService _opportunityService;
    private readonly IBlobService _blobService;
    private readonly IUserService _userService;
    private readonly ILinkMaintenanceService _linkMaintenanceService;

    private readonly IExecutionStrategyService _executionStrategyService;

    private readonly ProgramSearchFilterValidator _programSearchFilterValidator;
    private readonly ProgramRequestValidatorCreate _programRequestValidatorCreate;
    private readonly ProgramRequestValidatorUpdate _programRequestValidatorUpdate;

    private readonly IRepositoryBatchedValueContainsWithNavigation<Program> _programRepository;
    private readonly IRepositoryWithNavigation<ProgramPathway> _programPathwayRepository;
    private readonly IRepositoryWithNavigation<ProgramPathwayStep> _programPathwayStepRepository;
    private readonly IRepository<ProgramPathwayTask> _programPathwayTaskRepository;

    private static readonly ProgramStatus[] Statuses_Updatable = [ProgramStatus.Active, ProgramStatus.Inactive];
    private static readonly ProgramStatus[] Statuses_Activatable = [ProgramStatus.Inactive];
    private static readonly ProgramStatus[] Statuses_CanDelete = [ProgramStatus.Active, ProgramStatus.Inactive];
    private static readonly ProgramStatus[] Statuses_DeActivatable = [ProgramStatus.Active, ProgramStatus.Expired];
    #endregion

    #region Constrcutor
    public ProgramService(
      IHttpContextAccessor httpContextAccessor,

      IProgramStatusService programStatusService,
      IOpportunityService opportunityService,
      IBlobService blobService,
      IUserService userService,
      ILinkMaintenanceService linkMaintenanceService,

      IExecutionStrategyService executionStrategyService,

      ProgramSearchFilterValidator programSearchFilterValidator,
      ProgramRequestValidatorCreate programRequestValidatorCreate,
      ProgramRequestValidatorUpdate programRequestValidatorUpdate,

      IRepositoryBatchedValueContainsWithNavigation<Program> programRepository,
      IRepositoryWithNavigation<ProgramPathway> programPathwayRepository,
      IRepositoryWithNavigation<ProgramPathwayStep> programPathwayStepRepository,
      IRepository<ProgramPathwayTask> programPathwayTaskRepository
    )
    {
      _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));

      _programStatusService = programStatusService ?? throw new ArgumentNullException(nameof(programStatusService));
      _opportunityService = opportunityService ?? throw new ArgumentNullException(nameof(opportunityService));
      _blobService = blobService ?? throw new ArgumentNullException(nameof(blobService));
      _userService = userService ?? throw new ArgumentNullException(nameof(userService));
      _linkMaintenanceService = linkMaintenanceService ?? throw new ArgumentNullException(nameof(linkMaintenanceService));

      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));

      _programSearchFilterValidator = programSearchFilterValidator ?? throw new ArgumentNullException(nameof(programSearchFilterValidator));
      _programRequestValidatorCreate = programRequestValidatorCreate ?? throw new ArgumentNullException(nameof(programRequestValidatorCreate));
      _programRequestValidatorUpdate = programRequestValidatorUpdate ?? throw new ArgumentNullException(nameof(programRequestValidatorUpdate));

      _programRepository = programRepository ?? throw new ArgumentNullException(nameof(programRepository));
      _programPathwayRepository = programPathwayRepository ?? throw new ArgumentNullException(nameof(programPathwayRepository));
      _programPathwayStepRepository = programPathwayStepRepository ?? throw new ArgumentNullException(nameof(programPathwayStepRepository));
      _programPathwayTaskRepository = programPathwayTaskRepository ?? throw new ArgumentNullException(nameof(programPathwayTaskRepository));
    }
    #endregion

    #region Public Membmers
    public Program GetById(Guid id, bool includeChildItems, bool includeComputed)
    {
      var result = GetByIdOrNull(id, includeChildItems, includeComputed)
        ?? throw new EntityNotFoundException($"{nameof(Program)} with id '{id}' does not exist");

      return result;
    }

    public Program? GetByIdOrNull(Guid id, bool includeChildItems, bool includeComputed)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      var result = _programRepository.Query(includeChildItems).SingleOrDefault(o => o.Id == id);
      if (result == null) return null;

      if (includeComputed)
        result.ImageURL = GetBlobObjectURL(result.ImageStorageType, result.ImageKey);

      return result;
    }

    public Program? GetByNameOrNull(string name, bool includeChildItems, bool includeComputed)
    {
      if (string.IsNullOrWhiteSpace(name)) throw new ArgumentNullException(nameof(name));
      name = name.Trim();

#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      var result = _programRepository.Query(includeChildItems).SingleOrDefault(o => o.Name.ToLower() == name.ToLower());
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      if (result == null) return null;

      if (includeComputed)
        result.ImageURL = GetBlobObjectURL(result.ImageStorageType, result.ImageKey);

      return result;
    }

    public Program? GetDefaultOrNull(bool includeChildItems, bool includeComputed)
    {
      var results = _programRepository.Query(includeChildItems).Where(o => o.IsDefault).ToList();
      if (results.Count > 1)
        throw new DataInconsistencyException($"Multiple {nameof(Program)} records are marked as default");

      var result = results.SingleOrDefault();
      if (result == null) return null;

      if (includeComputed)
        result.ImageURL = GetBlobObjectURL(result.ImageStorageType, result.ImageKey);

      return result;
    }

    public ProgramSearchResults Search(ProgramSearchFilterAdmin filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _programSearchFilterValidator.ValidateAndThrow(filter);

      var query = _programRepository.Query(true);

      //valueContains
      if (!string.IsNullOrEmpty(filter.ValueContains))
      {
        filter.ValueContains = filter.ValueContains.Trim();
        query = _programRepository.Contains(query, filter.ValueContains);
      }

      if (filter.PublishedStates != null)
      {
        var statusActiveId = _programStatusService.GetByName(ProgramStatus.Active.ToString()).Id;
        var statusExpiredId = _programStatusService.GetByName(ProgramStatus.Expired.ToString()).Id;

        var predicate = PredicateBuilder.False<Models.Program>();
        foreach (var state in filter.PublishedStates)
        {
          switch (state)
          {
            case PublishedState.NotStarted:
              predicate = predicate.Or(o => o.StatusId == statusActiveId && o.DateStart > DateTimeOffset.UtcNow);

              break;

            case PublishedState.Active:
              predicate = predicate.Or(o => o.StatusId == statusActiveId && o.DateStart <= DateTimeOffset.UtcNow);
              break;

            case PublishedState.Expired:
              predicate = predicate.Or(o => o.StatusId == statusExpiredId);
              break;
          }
        }

        query = query.Where(predicate);
      }

      //date range
      if (filter.DateStart.HasValue)
      {
        filter.DateStart = filter.DateStart.Value.RemoveTime();
        query = query.Where(o => o.DateStart >= filter.DateStart.Value);
      }

      if (filter.DateEnd.HasValue)
      {
        filter.DateEnd = filter.DateEnd.Value.ToEndOfDay();
        query = query.Where(o => o.DateEnd <= filter.DateEnd.Value);
      }

      //statuses
      if (filter.Statuses != null && filter.Statuses.Count != 0)
      {
        filter.Statuses = [.. filter.Statuses.Distinct()];
        var statusIds = filter.Statuses.Select(o => _programStatusService.GetByName(o.ToString()).Id).ToList();
        query = query.Where(o => statusIds.Contains(o.StatusId));
      }

      query = query.OrderBy(o => o.Name).ThenBy(o => o.Id);

      var results = new ProgramSearchResults();

      if (filter.TotalCountOnly)
      {
        results.TotalCount = query.Count();
        return results;
      }

      if (filter.PaginationEnabled)
      {
        results.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }

      results.Items = [.. query];

      results.Items.ForEach(o => o.ImageURL = GetBlobObjectURL(o.ImageStorageType, o.ImageKey));
      return results;
    }

    public async Task<Program> Create(ProgramRequestCreate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _programRequestValidatorCreate.ValidateAndThrowAsync(request);

      request.DateStart = request.DateStart.RemoveTime();
      if (request.DateEnd.HasValue) request.DateEnd = request.DateEnd.Value.ToEndOfDay();

      if (request.DateStart < DateTimeOffset.UtcNow.RemoveTime())
        throw new ValidationException("The start date cannot be in the past, it can be today or later");

      var existingByName = GetByNameOrNull(request.Name, false, false);
      if (existingByName != null)
        throw new ValidationException($"{nameof(Program)} with the specified name '{request.Name}' already exists");

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      var result = new Program
      {
        Name = request.Name,
        Description = request.Description,
        CompletionWindowInDays = request.CompletionWindowInDays,
        CompletionLimitReferee = request.CompletionLimitReferee,
        CompletionLimit = request.CompletionLimit,
        ZltoRewardReferrer = request.ZltoRewardReferrer,
        ZltoRewardReferee = request.ZltoRewardReferee,
        ZltoRewardPool = request.ZltoRewardPool,
        ProofOfPersonhoodRequired = request.ProofOfPersonhoodRequired,
        PathwayRequired = request.PathwayRequired,
        MultipleLinksAllowed = request.MultipleLinksAllowed,
        StatusId = _programStatusService.GetByName(ProgramStatus.Active.ToString()).Id,
        Status = ProgramStatus.Active,
        IsDefault = false, //processed below if true
        DateStart = request.DateStart,
        DateEnd = request.DateEnd,
        CreatedByUserId = user.Id,
        ModifiedByUserId = user.Id
      };

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateSerializable(TransactionScopeOption.RequiresNew);

        //create the program
        result = await _programRepository.Create(result);

        //set as default
        if (request.IsDefault)
        {
          var outcome = await SetAsDefault(result);
          if (outcome.Updated) result = outcome.Program;
        }

        //pathway
        if (request.Pathway != null) result = await UpsertProgramPathway(result, request.Pathway);

        scope.Complete();
      });

      return result;
    }

    public async Task<Program> Update(ProgramRequestUpdate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _programRequestValidatorUpdate.ValidateAndThrowAsync(request);

      request.DateStart = request.DateStart.RemoveTime();
      if (request.DateEnd.HasValue) request.DateEnd = request.DateEnd.Value.ToEndOfDay();

      var result = GetById(request.Id, true, false);

      AssertUpdatable(result);

      var existingByName = GetByNameOrNull(request.Name, false, false);
      if (existingByName != null && result.Id != existingByName.Id)
        throw new ValidationException($"{nameof(Program)} with the specified name '{request.Name}' already exists");

      if (!result.DateStart.Equals(request.DateStart) && request.DateStart < DateTimeOffset.UtcNow.RemoveTime())
        throw new ValidationException("The start date cannot be in the past. The start date has been updated and must be today or later");

      //by default, status remains unchanged, except for immediate expiration based on DateEnd (status updated via UpdateStatus)
      if (request.DateEnd.HasValue && request.DateEnd.Value <= DateTimeOffset.UtcNow)
      {
        result.StatusId = _programStatusService.GetByName(Status.Expired.ToString()).Id;
        result.Status = ProgramStatus.Expired;
        //TODO: Expire associated links and usages
      }

      if (request.ZltoRewardPool.HasValue && result.ZltoRewardCumulative.HasValue && request.ZltoRewardPool.Value < result.ZltoRewardCumulative.Value)
        throw new ValidationException($"The Zlto reward pool cannot be less than the cumulative Zlto rewards ({result.ZltoRewardCumulative.Value:F0}) already allocated to participants");

      if (request.CompletionLimitReferee.HasValue && result.CompletionTotal.HasValue && request.CompletionLimitReferee.Value < result.CompletionTotal.Value)
        throw new ValidationException($"The per-referrer completion limit cannot be lower than the total completions already recorded ({result.CompletionTotal.Value}).");

      if (request.CompletionLimit.HasValue && result.CompletionTotal.HasValue && request.CompletionLimit.Value < result.CompletionTotal.Value)
        throw new ValidationException($"The overall completion limit cannot be lower than the total completions already recorded ({result.CompletionTotal.Value:F0}).");

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      result.Name = request.Name;
      result.Description = request.Description;
      result.CompletionWindowInDays = request.CompletionWindowInDays;
      result.CompletionLimitReferee = request.CompletionLimitReferee;
      result.CompletionLimit = request.CompletionLimit;
      result.ZltoRewardReferrer = request.ZltoRewardReferrer;
      result.ZltoRewardReferee = request.ZltoRewardReferee;
      result.ZltoRewardPool = request.ZltoRewardPool;
      result.ProofOfPersonhoodRequired = request.ProofOfPersonhoodRequired;
      result.PathwayRequired = request.PathwayRequired;
      result.MultipleLinksAllowed = request.MultipleLinksAllowed;
      //status processed above
      if (!request.IsDefault) result.IsDefault = false; //processed below if true to avoid unique index constraint 
      result.DateStart = request.DateStart;
      result.DateEnd = request.DateEnd;
      result.ModifiedByUserId = user.Id;

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateSerializable(TransactionScopeOption.RequiresNew);

        //pathway
        if (request.Pathway == null)
          result = await DeleteProgramPathway(result);
        else
        {
          result = await DeletePathwayChildren(result, request.Pathway);
          result = await UpsertProgramPathway(result, request.Pathway);
        }

        //update the program
        result = await _programRepository.Update(result);

        //set as default
        if (request.IsDefault)
        {
          var outcome = await SetAsDefault(result);
          if (outcome.Updated) result = outcome.Program;
        }

        scope.Complete();
      });

      return result;
    }

    public async Task<Program> UpdateImage(Guid id, IFormFile file)
    {
      var result = GetById(id, false, false);

      AssertUpdatable(result);

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      (Program? Program, BlobObject? ItemAdded) resultImage = (null, null);
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateSerializable(TransactionScopeOption.RequiresNew);
        resultImage = await UpdateImage(result, file);
        result.ModifiedByUserId = user.Id;
        result = await _programRepository.Update(result);
        scope.Complete();
      });

      if (resultImage.Program == null)
        throw new InvalidOperationException($"{nameof(Program)} expected");

      return resultImage.Program;
    }

    public async Task<Program> UpdateStatus(Guid id, ProgramStatus status)
    {
      var result = GetById(id, false, false);

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      bool cancelReferralLinks = false;
      switch (status)
      {
        case ProgramStatus.Active:
          if (result.Status == ProgramStatus.Active) return result;
          if (!Statuses_Activatable.Contains(result.Status))
            throw new ValidationException($"The {nameof(Program)} can not be activated (current status '{result.Status.ToDescription()}'). Required state '{Statuses_Activatable.JoinNames()}'");

          //ensure DateEnd was updated for re-activation of previously expired program
          if (result.DateEnd.HasValue && result.DateEnd.Value <= DateTimeOffset.UtcNow)
            throw new ValidationException($"The {nameof(Program)} cannot be activated because its end date ('{result.DateEnd:yyyy-MM-dd}') is in the past. Please update the {nameof(Program).ToLower()} before proceeding with activation");

          //TODO: Ensure completable pathway specially for opportunity tasks
          break;

        case ProgramStatus.Inactive:
          // existing referral links remain usable and can still be completed, but new links cannot be created
          if (result.Status == ProgramStatus.Inactive) return result;
          if (!Statuses_DeActivatable.Contains(result.Status))
            throw new ValidationException($"The {nameof(Program)} can not be deactivated (current status '{result.Status.ToDescription()}'). Required state '{Statuses_DeActivatable.JoinNames()}'");

          break;

        case ProgramStatus.Deleted:
          if (result.Status == ProgramStatus.Deleted) return result;
          if (!Statuses_CanDelete.Contains(result.Status))
            throw new ValidationException($"The {nameof(Program)} can not be deleted (current status '{result.Status.ToDescription()}'). Required state '{Statuses_CanDelete.JoinNames()}'");

          cancelReferralLinks = true;

          break;

        default:
          throw new ArgumentOutOfRangeException(nameof(status), $"{nameof(ProgramStatus)} of '{status.ToDescription()}' not supported");
      }

      var statusId = _programStatusService.GetByName(status.ToString()).Id;

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateSerializable(TransactionScopeOption.RequiresNew);

        result.StatusId = statusId;
        result.Status = status;
        result.ModifiedByUserId = user.Id;

        result = await _programRepository.Update(result);

        if (cancelReferralLinks) await _linkMaintenanceService.CancelByProgramId(result.Id);

        scope.Complete();
      });

      return result;
    }

    public async Task<Program> SetAsDefault(Guid id)
    {
      var result = GetById(id, false, false);

      AssertUpdatable(result);

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateSerializable(TransactionScopeOption.RequiresNew);

        var outcome = await SetAsDefault(result);
        if (!outcome.Updated) return;

        result = outcome.Program;
        result.ModifiedByUserId = user.Id;
        result = await _programRepository.Update(result);

        scope.Complete();
      });

      return result;
    }
    #endregion

    #region Private Members
    private static void AssertUpdatable(Program program)
    {
      if (!Statuses_Updatable.Contains(program.Status))
        throw new ValidationException($"The {nameof(Program)} can no longer be updated (current status '{program.Status.ToDescription()}'). Required state '{Statuses_Updatable.JoinNames()}'");
    }

    private string? GetBlobObjectURL(StorageType? storageType, string? key)
    {
      if (!storageType.HasValue || string.IsNullOrEmpty(key)) return null;
      return _blobService.GetURL(storageType.Value, key);
    }

    private async Task<Program> DeleteProgramPathway(Program program)
    {
      if (program.Pathway == null) return program;

      var pathway = program.Pathway;

      pathway.Steps ??= [];

      foreach (var step in pathway.Steps.ToList())
      {
        step.Tasks ??= [];

        foreach (var task in step.Tasks.ToList())
          await _programPathwayTaskRepository.Delete(task);

        await _programPathwayStepRepository.Delete(step);
      }

      await _programPathwayRepository.Delete(pathway);

      program.Pathway = null;
      return program;
    }

    private async Task<Program> DeletePathwayChildren(Program program, ProgramPathwayRequestUpsert request)
    {
      if (program.Pathway == null) return program;

      var pathway = program.Pathway;

      pathway.Steps ??= [];

      var requestStepIds = request.Steps.Where(s => s.Id.HasValue).Select(s => s.Id!.Value).ToHashSet();
      var stepsToDelete = pathway.Steps.Where(s => !requestStepIds.Contains(s.Id)).ToList();

      //deleted steps and related tasks
      foreach (var step in stepsToDelete)
      {
        step.Tasks ??= [];

        foreach (var task in step.Tasks.ToList())
          await _programPathwayTaskRepository.Delete(task);

        await _programPathwayStepRepository.Delete(step);
        pathway.Steps.Remove(step);
      }

      //deleted tasks for steps preserved
      foreach (var stepReq in request.Steps.Where(s => s.Id.HasValue))
      {
        var step = pathway.Steps.SingleOrDefault(s => s.Id == stepReq.Id!.Value);
        if (step == null) continue;
        step.Tasks ??= [];

        var reqTaskIds = stepReq.Tasks.Where(t => t.Id.HasValue).Select(t => t.Id!.Value).ToHashSet();
        var tasksToDelete = step.Tasks.Where(t => !reqTaskIds.Contains(t.Id)).ToList();

        foreach (var task in tasksToDelete)
        {
          await _programPathwayTaskRepository.Delete(task);
          step.Tasks.Remove(task);
        }
      }

      program.Pathway = pathway;
      return program;
    }

    private async Task<Program> UpsertProgramPathway(Program program, ProgramPathwayRequestUpsert request)
    {
      //pathway name is implicitly unique per program — currently a program can only have one pathway

      var resultPathway = program.Pathway;

      if (resultPathway == null)
      {
        //program has no pathway, but the request includes an existing pathway
        if (request.Id.HasValue)
          throw new ValidationException($"This program does not have a pathway, but a pathway was specified to update");

        resultPathway = new ProgramPathway
        {
          ProgramId = program.Id,
          Name = request.Name,
          Description = request.Description,
          Rule = request.Rule,
          OrderMode = request.OrderMode
        };

        resultPathway = await _programPathwayRepository.Create(resultPathway);
      }
      else
      {
        if (!request.Id.HasValue)
          throw new ValidationException("The program has an existing pathway, but a new pathway was added");

        //program has an existing pathway, but the request references a different one
        if (resultPathway.Id != request.Id)
          throw new ValidationException($"The specified pathway does not match the existing pathway for this program");

        resultPathway.Name = request.Name;
        resultPathway.Description = request.Description;
        resultPathway.Rule = request.Rule;
        resultPathway.OrderMode = request.OrderMode;

        resultPathway = await _programPathwayRepository.Update(resultPathway);
      }

      program.Pathway = await UpsertProgramPathwaySteps(resultPathway, request.Steps);

      return program;
    }

    private async Task<ProgramPathway> UpsertProgramPathwaySteps(ProgramPathway pathway, List<ProgramPathwayStepRequestUpsert> requests)
    {
      // No need to recheck for duplicate step names here —
      // the validator already enforces unique names within the incoming request,
      // and after delete, update, and insert operations, the persisted steps will exactly match the request set.

      pathway.Steps ??= [];

      var resultSteps = new List<ProgramPathwayStep>();

      byte orderDisplay = 1;
      foreach (var request in requests)
      {
        var resultStep = request.Id.HasValue ? pathway.Steps.SingleOrDefault(s => s.Id == request.Id) : null;

        if (resultStep == null)
        {
          if (request.Id.HasValue)
            throw new ValidationException($"The specified step '{request.Name}' does not match an existing step for pathway");

          resultStep = new ProgramPathwayStep
          {
            PathwayId = pathway.Id,
            Name = request.Name,
            Description = request.Description,
            Rule = request.Rule,
            OrderMode = request.OrderMode,
            Order = pathway.OrderMode == PathwayOrderMode.Sequential ? orderDisplay : null,
            OrderDisplay = orderDisplay
          };

          resultStep = await _programPathwayStepRepository.Create(resultStep);
          resultSteps.Add(resultStep);
        }
        else
        {
          resultStep.Name = request.Name;
          resultStep.Description = request.Description;
          resultStep.Rule = request.Rule;
          resultStep.OrderMode = request.OrderMode;
          resultStep.Order = pathway.OrderMode == PathwayOrderMode.Sequential ? orderDisplay : null;
          resultStep.OrderDisplay = orderDisplay;

          resultStep = await _programPathwayStepRepository.Update(resultStep);
          resultSteps.Add(resultStep);
        }

        // And inside each step:
        await UpsertProgramPathwayTasks(resultStep, request.Tasks);

        orderDisplay++;
      }

      // avoids confusing the change tracker and minimizes churn
      pathway.Steps.Clear();
      pathway.Steps.AddRange(resultSteps);

      return pathway;
    }

    private async Task<ProgramPathwayStep> UpsertProgramPathwayTasks(ProgramPathwayStep step, List<ProgramPathwayTaskRequestUpsert> requests)
    {
      // No need to recheck for duplicate tasks here —
      // the validator already enforces unique entity references within each step,
      // and after delete, update, and insert operations, the persisted tasks will exactly match the request set.

      step.Tasks ??= [];

      var resultTasks = new List<ProgramPathwayTask>();

      byte orderDisplay = 1;
      foreach (var request in requests)
      {
        var resultTask = request.Id.HasValue ? step.Tasks.SingleOrDefault(t => t.Id == request.Id) : null;

        OpportunityItem? opportunityItem = null;
        switch (request.EntityType)
        {
          case PathwayTaskEntityType.Opportunity:
            var opportunity = _opportunityService.GetById(request.EntityId, false, true, false);
            if (!opportunity.Published)
              throw new ValidationException($"The specified opportunity is not published and cannot be assigned as a task");

            if (!opportunity.VerificationEnabled)
              throw new ValidationException($"Opportunity '{opportunity.Title}' can not be completed / verification is not enabled");

            if (!opportunity.VerificationMethod.HasValue) //support any verification method
              throw new DataInconsistencyException($"Data inconsistency detected: The opportunity '{opportunity.Title}' has verification enabled, but no verification method is set");

            opportunityItem = new OpportunityItem
            {
              Id = opportunity.Id,
              Title = opportunity.Title
            };

            break;

          default:
            throw new InvalidOperationException($"Entity type of '{request.EntityType}' is not supported");
        }

        if (resultTask == null)
        {
          if (request.Id.HasValue)
            throw new ValidationException($"The specified task for entity '{request.EntityType}: {request.EntityId}' does not match an existing task for step {step.Name}");

          resultTask = new ProgramPathwayTask
          {
            StepId = step.Id,
            EntityType = request.EntityType,
            Opportunity = opportunityItem,
            Order = step.OrderMode == PathwayOrderMode.Sequential ? orderDisplay : null,
            OrderDisplay = orderDisplay
          };

          resultTask = await _programPathwayTaskRepository.Create(resultTask);
          resultTasks.Add(resultTask);
        }
        else
        {
          resultTask.EntityType = request.EntityType;
          resultTask.Opportunity = opportunityItem;
          resultTask.Order = step.OrderMode == PathwayOrderMode.Sequential ? orderDisplay : null;
          resultTask.OrderDisplay = orderDisplay;

          resultTask = await _programPathwayTaskRepository.Update(resultTask);
          resultTasks.Add(resultTask);
        }

        orderDisplay++;
      }

      // avoids confusing the change tracker and minimizes churn
      step.Tasks.Clear();
      step.Tasks.AddRange(resultTasks);
      return step;
    }

    private async Task<(Program Program, BlobObject ItemAdded)> UpdateImage(Program program, IFormFile? file)
    {
      if (file == null || file.Length == 0)
        throw new ValidationException("File is required");

      var currentLogoId = program.ImageId;

      BlobObject? blobObject = null;
      try
      {
        await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
        {
          using var scope = TransactionScopeHelper.CreateSerializable();
          blobObject = await _blobService.Create(FileType.Photos, StorageType.Public, file, null); // public storage; images must remain permanently accessible (e.g., emails, shared links).
          program.ImageId = blobObject.Id;
          program.ImageStorageType = blobObject.StorageType;
          program.ImageKey = blobObject.Key;
          program = await _programRepository.Update(program);
          //ModifiedByUserId: set by caller

          if (currentLogoId.HasValue)
            await _blobService.Archive(currentLogoId.Value, blobObject); //preserve / archive images; they may still appear in sent emails or other public communications

          scope.Complete();
        });
      }
      catch
      {
        if (blobObject != null)
          await _blobService.Delete(blobObject);
        throw;
      }

      if (blobObject == null)
        throw new InvalidOperationException("Blob object expected");

      program.ImageURL = GetBlobObjectURL(program.ImageStorageType, program.ImageKey);

      return (program, blobObject);
    }

    private async Task<(Program Program, bool Updated)> SetAsDefault(Program program)
    {
      var updated = false;

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateSerializable();

        var currentDefault = GetDefaultOrNull(false, false);
        if (currentDefault?.Id == program.Id) // avoid TOCTOU
        {
          scope.Complete();
          return;
        }

        var items = new List<Program>();

        if (currentDefault != null)
        {
          currentDefault.IsDefault = false;
          currentDefault = await _programRepository.Update(currentDefault);
        }

        program.IsDefault = true;
        program = await _programRepository.Update(program);
        //ModifiedByUserId: set by caller

        scope.Complete();

        updated = true;
      });

      return (program, updated);
    }
    #endregion
  }
}
