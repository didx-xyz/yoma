using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
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
using Yoma.Core.Domain.Referral.Extensions;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Referral.Validators;

namespace Yoma.Core.Domain.Referral.Services
{
  public class ProgramService : IProgramService
  {
    #region Class Variables
    private readonly ILogger<ProgramService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    private readonly IProgramStatusService _programStatusService;
    private readonly IOpportunityService _opportunityService;
    private readonly IBlobService _blobService;
    private readonly IUserService _userService;

    private readonly IExecutionStrategyService _executionStrategyService;

    private readonly ProgramRequestValidatorCreate _programRequestValidatorCreate;
    private readonly ProgramRequestValidatorUpdate _programRequestValidatorUpdate;

    private readonly IRepositoryBatchedValueContainsWithNavigation<Program> _programRepository;
    private readonly IRepositoryWithNavigation<ProgramPathway> _programPathwayRepository;
    private readonly IRepositoryWithNavigation<ProgramPathwayStep> _programPathwayStepRepository;
    private readonly IRepository<ProgramPathwayTask> _programPathwayTaskRepository;
    #endregion

    #region Constrcutor
    public ProgramService(
      ILogger<ProgramService> logger,
      IHttpContextAccessor httpContextAccessor,

      IProgramStatusService programStatusService,
      IOpportunityService opportunityService,
      IBlobService blobService,
      IUserService userService,

      IExecutionStrategyService executionStrategyService,

      ProgramRequestValidatorCreate programRequestValidatorCreate,
      ProgramRequestValidatorUpdate programRequestValidatorUpdate,

      IRepositoryBatchedValueContainsWithNavigation<Program> programRepository,
      IRepositoryWithNavigation<ProgramPathway> programPathwayRepository,
      IRepositoryWithNavigation<ProgramPathwayStep> programPathwayStepRepository,
      IRepository<ProgramPathwayTask> programPathwayTaskRepository
    )
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));

      _programStatusService = programStatusService ?? throw new ArgumentNullException(nameof(programStatusService));
      _opportunityService = opportunityService ?? throw new ArgumentNullException(nameof(opportunityService));
      _blobService = blobService ?? throw new ArgumentNullException(nameof(blobService));
      _userService = userService ?? throw new ArgumentNullException(nameof(userService));

      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));

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

    public ProgramSearchResults Search(ProgramSearchFilter filter)
    {
      throw new NotImplementedException();
    }

    public ProgramSearchResults Search(ProgramSearchFilterAdmin filter)
    {
      throw new NotImplementedException();
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
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

        //create the program
        result = await _programRepository.Create(result);

        //set as default
        if (request.IsDefault) await SetAsDefault(result);

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

      //TODO: ValidateUpdatable

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
      result.IsDefault = request.IsDefault; //processed below if true
      result.DateStart = request.DateStart;
      result.DateEnd = request.DateEnd;
      result.ModifiedByUserId = user.Id;

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

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
        if (request.IsDefault) await SetAsDefault(result);

        scope.Complete();
      });

      return result;
    }

    public async Task<ProgramInfo> UpdateImage(Guid id, IFormFile file)
    {
      var result = GetById(id, false, false);

      //TODO: ValidateUpdatable

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      (Program? Program, BlobObject? ItemAdded) resultImage = (null, null);
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        resultImage = await UpdateImage(result, file);
        result.ModifiedByUserId = user.Id;
        result = await _programRepository.Update(result);
        scope.Complete();
      });

      if (resultImage.Program == null)
        throw new InvalidOperationException($"{nameof(Models.Program)} expected");

      return resultImage.Program.ToInfo();
    }

    public Task<ProgramInfo> UpdateStatus(Guid id, ProgramStatus status)
    {
      throw new NotImplementedException();
    }

    public async Task<ProgramInfo> SetAsDefault(Guid id)
    {
      var result = GetById(id, false, false);

      //TODO: ValidateUpdatable 

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);
        result = await SetAsDefault(result);
        result.ModifiedByUserId = user.Id;
        result = await _programRepository.Update(result);
        scope.Complete();
      });

      return result.ToInfo();
    }
    #endregion

    #region Private Members
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
      var resultPathway = program.Pathway;

      if (resultPathway == null)
      {
        if (request.Id.HasValue)
          throw new ValidationException($"Specified program pathway does not exist for program");

        resultPathway = new ProgramPathway
        {
          ProgramId = program.Id,
          Name = request.Name,
          Description = request.Description
        };

        resultPathway = await _programPathwayRepository.Create(resultPathway);
      }
      else
      {
        if (resultPathway.Id != request.Id)
          throw new ValidationException($"Specified program pathway does not match existing pathway");

        resultPathway.Name = request.Name;
        resultPathway.Description = request.Description;

        resultPathway = await _programPathwayRepository.Update(resultPathway);
      }

      program.Pathway = await UpsertProgramPathwaySteps(resultPathway, request.Steps);

      return program;
    }

    private async Task<ProgramPathway> UpsertProgramPathwaySteps(ProgramPathway pathway, List<ProgramPathwayStepRequestUpsert> requests)
    {
      pathway.Steps ??= [];

      var resultSteps = new List<ProgramPathwayStep>();

      foreach (var request in requests)
      {
        var resultStep = request.Id.HasValue ? pathway.Steps.SingleOrDefault(s => s.Id == request.Id) : null;

        if (resultStep == null)
        {
          if (request.Id.HasValue)
            throw new ValidationException($"Specified pathway step does not exist for pathway {pathway.Id}");

          resultStep = new ProgramPathwayStep
          {
            PathwayId = pathway.Id,
            Name = request.Name,
            Description = request.Description,
            Rule = request.Rule,
            Order = request.Order
          };

          resultStep = await _programPathwayStepRepository.Create(resultStep);
          resultSteps.Add(resultStep);
        }
        else
        {
          resultStep.Name = request.Name;
          resultStep.Description = request.Description;
          resultStep.Rule = request.Rule;
          resultStep.Order = request.Order;

          resultStep = await _programPathwayStepRepository.Update(resultStep);
          resultSteps.Add(resultStep);
        }

        // And inside each step:
        await UpsertProgramPathwayTasks(resultStep, request.Tasks);
      }

      // avoids confusing the change tracker and minimizes churn
      pathway.Steps.Clear();
      pathway.Steps.AddRange(resultSteps);

      return pathway;
    }

    private async Task<ProgramPathwayStep> UpsertProgramPathwayTasks(ProgramPathwayStep step, List<ProgramPathwayTaskRequestUpsert> requests)
    {
      step.Tasks ??= [];

      var resultTasks = new List<ProgramPathwayTask>();

      foreach (var request in requests)
      {
        var resultTask = request.Id.HasValue ? step.Tasks.SingleOrDefault(t => t.Id == request.Id) : null;

        if (resultTask == null)
        {
          if (request.Id.HasValue)
            throw new ValidationException($"Specified task does not exist for step {step.Id}");

          resultTask = new ProgramPathwayTask
          {
            StepId = step.Id,
            EntityType = request.EntityType,
            Opportunity = new Opportunity.Models.OpportunityItem { Id = request.EntityId },
            Order = request.Order
          };

          resultTask = await _programPathwayTaskRepository.Create(resultTask);
          resultTasks.Add(resultTask);
        }
        else
        {
          resultTask.EntityType = request.EntityType;
          resultTask.Opportunity = new Opportunity.Models.OpportunityItem { Id = request.EntityId };
          resultTask.Order = request.Order;

          resultTask = await _programPathwayTaskRepository.Update(resultTask);
          resultTasks.Add(resultTask);
        }
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
          using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);
          blobObject = await _blobService.Create(FileType.Photos, StorageType.Public, file, null);
          program.ImageId = blobObject.Id;
          program.ImageStorageType = blobObject.StorageType;
          program.ImageKey = blobObject.Key;
          program = await _programRepository.Update(program);
          //ModifiedByUserId: set by caller

          if (currentLogoId.HasValue)
            await _blobService.Archive(currentLogoId.Value, blobObject); //preserve / archive previous logo as they might be referenced in credentials

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

    private async Task<Program> SetAsDefault(Program program)
    {
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

        var currentDefault = GetDefaultOrNull(false, false);
        if (currentDefault?.Id == program.Id) // avoid TOCTOU
        {
          scope.Complete();
          return;
        }

        if (currentDefault != null)
        {
          currentDefault.IsDefault = false;
          currentDefault = await _programRepository.Update(currentDefault);
        }

        program.IsDefault = true;
        program = await _programRepository.Update(program);
        //ModifiedByUserId: set by caller

        scope.Complete();
      });

      return program;
    }
    #endregion
  }
}
