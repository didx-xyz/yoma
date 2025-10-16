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
        IsDefault = false, //set below if true
        DateStart = request.DateStart,
        DateEnd = request.DateEnd,
        CreatedByUserId = user.Id,
        ModifiedByUserId = user.Id
      };

      var blobObjects = new List<BlobObject>();
      try
      {
        await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
        {
          using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

          //create the program
          result = await _programRepository.Create(result);

          //insert image
          if (request.Image != null)
          {
            var resultImage = await UpdateImage(result, request.Image);
            result = resultImage.Program;
            blobObjects.Add(resultImage.ItemAdded);
          }

          //set as default
          if (request.IsDefault) await SetAsDefault(result);

          //pathway
          //TODO

          scope.Complete();
        });
      }
      catch
      {
        //rollback created blobs
        if (blobObjects.Count != 0)
          foreach (var blob in blobObjects)
            await _blobService.Delete(blob);
        throw;
      }

      return result;
    }

    public Task<Program> Update(ProgramRequestUpdate request)
    {
      throw new NotImplementedException();
    }

    public Task<ProgramInfo> UpdateStatus(Guid id, ProgramStatus status)
    {
      throw new NotImplementedException();
    }

    public async Task<ProgramInfo> SetAsDefault(Guid id)
    {
      var result = GetById(id, false, false);

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
    #endregion

    #region Private Members
    private async Task<(Program Program, BlobObject ItemAdded)> UpdateImage(Program program, IFormFile? file)
    {
      ArgumentNullException.ThrowIfNull(file, nameof(file));

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

        scope.Complete();
      });

      return program;
    }
    #endregion
  }
}
