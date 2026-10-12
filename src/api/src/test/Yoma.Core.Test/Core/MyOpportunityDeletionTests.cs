using FluentValidation;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Reflection;
using System.Runtime.CompilerServices;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.MyOpportunity;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.MyOpportunity.Services;
using Yoma.Core.Domain.Opportunity;

namespace Yoma.Core.Test.Core
{
  public class MyOpportunityDeletionTests
  {
    #region Tests
    [Theory]
    [InlineData(0, 0)]
    [InlineData(1, 0)]
    [InlineData(0, 2)]
    [InlineData(1, 2)]
    public async Task DeletesAllEvidenceBeforeCustomFieldsAndParent(int locationCount, int fileCount)
    {
      var fixture = new Fixture(locationCount, fileCount);
      var callbackCalled = false;

      await fixture.Delete(() =>
      {
        Assert.Empty(fixture.RemainingEvidence);
        callbackCalled = true;
        return Task.CompletedTask;
      });

      Assert.True(callbackCalled);
      Assert.Empty(fixture.RemainingEvidence);
      fixture.Parent.Verify(repository => repository.Delete(fixture.Submission), Times.Once);
      fixture.CustomFields.Verify(service => service.Delete(CustomFieldEntityType.MyOpportunity, fixture.Submission.Id), Times.Once);
      fixture.Blobs.Verify(service => service.Download(It.IsAny<Guid>()), Times.Exactly(fileCount));
      fixture.Blobs.Verify(service => service.Delete(It.IsAny<Guid>()), Times.Exactly(fileCount));
      fixture.Blobs.Verify(service => service.Create(It.IsAny<Guid>(), It.IsAny<IFormFile>()), Times.Never);
    }

    [Fact]
    public async Task DeletesSubmissionWithNullEvidence()
    {
      var fixture = new Fixture(0, 0);
      fixture.Submission.Verifications = null;

      await fixture.Delete();

      fixture.Parent.Verify(repository => repository.Delete(fixture.Submission), Times.Once);
      fixture.Blobs.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task RestoresOnlyDeletedFilesWhenLaterCleanupFails(bool failCallback)
    {
      var fixture = new Fixture(1, 2);
      var error = new InvalidOperationException("Cleanup failed");
      if (!failCallback)
        fixture.Parent.Setup(repository => repository.Delete(fixture.Submission)).ThrowsAsync(error);

      var actual = await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.Delete(
        failCallback ? () => Task.FromException(error) : null));

      Assert.Same(error, actual);
      Assert.Empty(fixture.RemainingEvidence);
      foreach (var item in fixture.Submission.Verifications!.Where(item => item.FileId.HasValue))
        fixture.Blobs.Verify(service => service.Create(item.FileId!.Value, fixture.File), Times.Once);
      fixture.Blobs.Verify(service => service.Create(It.IsAny<Guid>(), It.IsAny<IFormFile>()), Times.Exactly(2));
    }

    [Theory]
    [InlineData(VerificationStatus.Completed)]
    [InlineData(VerificationStatus.Rejected)]
    public async Task RejectsNonPendingWithoutDeletingAnything(VerificationStatus status)
    {
      var fixture = new Fixture(1, 1);
      fixture.Submission.VerificationStatus = status;

      await Assert.ThrowsAsync<ValidationException>(() => fixture.Delete());

      fixture.Evidence.VerifyNoOtherCalls();
      fixture.Blobs.VerifyNoOtherCalls();
      fixture.CustomFields.VerifyNoOtherCalls();
      fixture.Parent.VerifyNoOtherCalls();
    }
    #endregion Tests

    #region Private Members
    private sealed class Fixture
    {
      public readonly Domain.MyOpportunity.Models.MyOpportunity Submission;
      public readonly List<MyOpportunityVerification> RemainingEvidence;
      public readonly Mock<IRepository<MyOpportunityVerification>> Evidence = new();
      public readonly Mock<IRepositoryBatchedWithNavigationAndCustomFieldFilter<Domain.MyOpportunity.Models.MyOpportunity>> Parent = new();
      public readonly Mock<ICustomFieldValueService> CustomFields = new();
      public readonly Mock<IBlobService> Blobs = new();
      public readonly IFormFile File = Mock.Of<IFormFile>();
      private readonly MyOpportunityService _service;

      public Fixture(int locationCount, int fileCount)
      {
        Submission = new() { Id = Guid.NewGuid(), VerificationStatus = VerificationStatus.Pending, Verifications = [] };
        for (var index = 0; index < locationCount + fileCount; index++)
          Submission.Verifications.Add(new()
          {
            Id = Guid.NewGuid(),
            MyOpportunityId = Submission.Id,
            VerificationType = index < locationCount ? VerificationType.Location : VerificationType.FileUpload,
            FileId = index < locationCount ? null : Guid.NewGuid()
          });
        RemainingEvidence = [.. Submission.Verifications];

        Evidence.Setup(repository => repository.Delete(It.IsAny<MyOpportunityVerification>()))
          .Callback<MyOpportunityVerification>(item => Assert.True(RemainingEvidence.Remove(item)))
          .Returns(Task.CompletedTask);
        var customFieldsDeleted = false;
        CustomFields.Setup(service => service.Delete(CustomFieldEntityType.MyOpportunity, Submission.Id))
          .Callback(() =>
          {
            Assert.Empty(RemainingEvidence);
            customFieldsDeleted = true;
          }).Returns(Task.CompletedTask);
        Parent.Setup(repository => repository.Delete(Submission))
          .Callback(() =>
          {
            Assert.Empty(RemainingEvidence);
            Assert.True(customFieldsDeleted);
          }).Returns(Task.CompletedTask);
        Blobs.Setup(service => service.Download(It.IsAny<Guid>())).ReturnsAsync(File);
        var strategy = new Mock<IExecutionStrategyService>();
        strategy.Setup(service => service.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>(), false))
          .Returns((Func<Task> body, bool _) => body());

        //Isolate the shared deletion routine from unrelated authentication/issuance dependencies.
        _service = (MyOpportunityService)RuntimeHelpers.GetUninitializedObject(typeof(MyOpportunityService));
        SetDependency("_myOpportunityRepository", Parent.Object);
        SetDependency("_myOpportunityVerificationRepository", Evidence.Object);
        SetDependency("_customFieldValueService", CustomFields.Object);
        SetDependency("_blobService", Blobs.Object);
        SetDependency("_executionStrategyService", strategy.Object);
      }

      public Task Delete(Func<Task>? beforeDelete = null) => (Task)typeof(MyOpportunityService)
        .GetMethod("PerformActionDeleteVerification", BindingFlags.Instance | BindingFlags.NonPublic)!
        .Invoke(_service, [Submission, beforeDelete])!;

      private void SetDependency(string name, object value) => typeof(MyOpportunityService)
        .GetField(name, BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(_service, value);
    }
    #endregion Private Members
  }
}
