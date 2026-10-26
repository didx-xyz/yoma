using Moq;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.PartnerSync.Extensions;

namespace Yoma.Core.Test.PartnerSync
{
  public class SyncCustomFieldSnapshotTests
  {
    #region Class Variables
    private static readonly string[] SnapshotKeys = ["changed", "withdrawn", "unrelated"];
    #endregion Class Variables

    #region Tests
    [Fact]
    public void SnapshotAddsOnlyMissingOwnedKeysAndPreservesExplicitValues()
    {
      var scalar = new CustomFieldValueRequest { Key = "amount", Value = "100" };
      var option = new CustomFieldValueRequest { Key = "schedule", Values = ["FullTime"] };
      var unrelated = new CustomFieldValueRequest { Key = "anotherMapping", Value = "unchanged" };
      var fields = new List<CustomFieldValueRequest> { scalar, option, unrelated };

      Assert.Same(fields, fields.CompleteCustomFieldSnapshot("amount", "schedule", "withdrawn"));
      Assert.Equal(4, fields.Count);
      Assert.Same(scalar, fields[0]);
      Assert.Same(option, fields[1]);
      Assert.Same(unrelated, fields[2]);
      var cleared = Assert.Single(fields, field => field.Key == "withdrawn");
      Assert.Null(cleared.Value);
      Assert.Null(cleared.Values);
    }

    [Fact]
    public void OwnershipIsCaseInsensitiveAndRepeatedCompletionDoesNotChangeThePayload()
    {
      var fields = new List<CustomFieldValueRequest> { new() { Key = "amount", Value = "100" } };
      fields.CompleteCustomFieldSnapshot("AMOUNT", "withdrawn", "WITHDRAWN");
      var request = new OpportunityRequestUpdate
      {
        Id = Guid.NewGuid(),
        Categories = [],
        Countries = [],
        Languages = [],
        CustomFields = fields
      };
      var hash = HashHelper.ComputeSHA256Hash(request);

      fields.CompleteCustomFieldSnapshot("amount", "withdrawn");

      Assert.Equal(2, fields.Count);
      Assert.Equal(hash, HashHelper.ComputeSHA256Hash(request));
    }

    [Fact]
    public void EmptyOwnershipDoesNotTurnAPartialPayloadIntoAReplacement()
    {
      var fields = new List<CustomFieldValueRequest>();

      fields.CompleteCustomFieldSnapshot();

      Assert.Empty(fields);
    }

    [Fact]
    public void SnapshotRejectsMissingCollectionsAndInvalidOwnershipKeys()
    {
      Assert.Throws<ArgumentNullException>(() => SyncExtensions.CompleteCustomFieldSnapshot(null!, []));
      Assert.Throws<ArgumentNullException>(() => new List<CustomFieldValueRequest>().CompleteCustomFieldSnapshot(null!));
      Assert.Throws<ArgumentException>(() => new List<CustomFieldValueRequest>().CompleteCustomFieldSnapshot(" "));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task CommonPatchPersistenceClearsOnlyExplicitSnapshotsAndPreservesUnrelatedValues(bool authoritativeSnapshot)
    {
      var opportunityId = Guid.NewGuid();
      var definitions = SnapshotKeys.Select(key => new CustomFieldDefinition
      {
        Id = Guid.NewGuid(),
        EntityType = CustomFieldEntityType.Opportunity.ToString(),
        EntityContext = "Job",
        Key = key,
        Title = key,
        DataType = CustomFieldDataType.String,
        IsActive = true
      }).ToList();
      var stored = definitions.Select(definition => new CustomFieldValue
      {
        Id = Guid.NewGuid(),
        OpportunityId = opportunityId,
        CustomFieldDefinitionId = definition.Id,
        Value = "original"
      }).ToList();
      var repository = new Mock<IRepository<CustomFieldValue>>();
      repository.Setup(service => service.Query()).Returns(() => stored.AsQueryable());
      repository.Setup(service => service.Delete(It.IsAny<CustomFieldValue>()))
        .Callback<CustomFieldValue>(value => stored.Remove(value))
        .Returns(Task.CompletedTask);
      repository.Setup(service => service.Update(It.IsAny<CustomFieldValue>()))
        .ReturnsAsync((CustomFieldValue value) => value);
      var metadata = new Mock<ICustomFieldDefinitionService>();
      metadata.Setup(service => service.List(CustomFieldEntityType.Opportunity, true, true, "Job"))
        .Returns(definitions);
      var strategy = new Mock<IExecutionStrategyService>();
      strategy.Setup(service => service.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>(), false))
        .Returns((Func<Task> body, bool _) => body());
      var valueService = new CustomFieldValueService(metadata.Object,
        Mock.Of<ICountryService>(), Mock.Of<ILanguageService>(), Mock.Of<ISkillService>(),
        Mock.Of<IEducationService>(), Mock.Of<ICurrencyService>(), repository.Object, strategy.Object);
      var fields = new List<CustomFieldValueRequest> { new() { Key = "changed", Value = "replacement" } };
      if (authoritativeSnapshot) fields.CompleteCustomFieldSnapshot("changed", "withdrawn");
      fields.NormalizeForPatch();

      var result = await valueService.Upsert(CustomFieldEntityType.Opportunity, "Job", null,
        opportunityId, null, fields, CustomFieldUpsertMode.PatchAllowMissingRequired);

      Assert.Equal("replacement", result.Scalar("changed"));
      Assert.Equal("original", result.Scalar("unrelated"));
      Assert.Equal(authoritativeSnapshot ? null : "original", result.Scalar("withdrawn"));
      repository.Verify(service => service.Delete(It.IsAny<CustomFieldValue>()),
        authoritativeSnapshot ? Times.Once() : Times.Never());
      repository.Verify(service => service.Delete(It.Is<CustomFieldValue>(value =>
        value.CustomFieldDefinitionId == definitions.Single(definition => definition.Key == "unrelated").Id)), Times.Never);
    }
    #endregion
  }
}
