using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json.Linq;
using Xunit;
using Yoma.Core.Api.Controllers;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Entity.Models.Lookups;
using Yoma.Core.Domain.Entity.Services;
using Yoma.Core.Domain.Entity.Validators;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Payout.Interfaces;
using Yoma.Core.Domain.Referral.Events;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Infrastructure.IXO.YellowCard.Interfaces;
using Yoma.Core.Infrastructure.Keycloak.Models;

namespace Yoma.Core.Test.Core
{
  public class KeycloakWebhookTests
  {
    #region Recovery and Existing Users
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task LoginRecoversMissingUserThroughValidatedUpsert(bool phoneOnly)
    {
      using var fixture = new Fixture();
      if (phoneOnly)
      {
        fixture.KeycloakUser.Email = null;
        fixture.KeycloakUser.Username = fixture.KeycloakUser.PhoneNumber!;
      }

      var before = DateTimeOffset.UtcNow;
      await fixture.Deliver("LOGIN");

      var user = Assert.Single(fixture.Users);
      Assert.Equal(fixture.KeycloakUser.Id, user.ExternalId);
      Assert.Equal(fixture.KeycloakUser.Username.Trim(), user.Username);
      Assert.Equal(fixture.KeycloakUser.Email?.Trim().ToLower(), user.Email);
      Assert.Equal("Test", user.FirstName);
      Assert.Equal("User", user.Surname);
      Assert.Equal("Test User", user.DisplayName);
      Assert.Equal(fixture.CountryId, user.CountryId);
      Assert.Equal(fixture.EducationId, user.EducationId);
      Assert.Equal(fixture.GenderId, user.GenderId);
      Assert.Equal(new DateTimeOffset(2000, 1, 2, 0, 0, 0, TimeSpan.Zero), user.DateOfBirth);
      Assert.Equal(fixture.KeycloakUser.EmailVerified, user.EmailConfirmed);
      Assert.Equal(fixture.KeycloakUser.PhoneNumberVerified, user.PhoneNumberConfirmed);
      Assert.InRange(user.DateLastLogin!.Value, before, DateTimeOffset.UtcNow);
      Assert.False((bool)Assert.Single(user.Settings!.Items!).Value!);
      Assert.NotEqual(true, user.YoIDOnboarded);
      Assert.Null(user.DateYoIDOnboarded);

      fixture.VerifyRoleAssignment(Times.Once());
      fixture.Repository.Verify(o => o.Create(It.IsAny<User>()), Times.Once);
      fixture.Repository.Verify(o => o.Update(It.IsAny<User>()), Times.Never);
      fixture.UserService.Verify(o => o.Upsert(It.IsAny<UserRequest>(), false, true), Times.Once);
      fixture.VerifyReferralEvents(user.Id, 1);
      fixture.VerifyLoginEffects(user.Id, 1);
      fixture.VerifyNoOnboardingOrPayoutCalls();
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task LoginWarnsBeforeRecoveryRegardlessOfInformationLogging(bool informationEnabled)
    {
      using var fixture = new Fixture();
      var eventId = Guid.NewGuid().ToString();
      var warning = $"Login: Possible lost REGISTER event; no Yoma user found for Keycloak user '{fixture.KeycloakUser.Id}' (event '{eventId}'); attempting recovery";
      fixture.Logger.Setup(o => o.IsEnabled(LogLevel.Information)).Returns(informationEnabled);
      fixture.Repository.Setup(o => o.Create(It.IsAny<User>())).ReturnsAsync((User user) =>
      {
        fixture.VerifyLog(LogLevel.Warning, warning, Times.Once());
        fixture.VerifyLog(LogLevel.Information, "Login: Recovered the missing Yoma user", Times.Never());
        Assert.Empty(fixture.Users);

        fixture.Users.Add(user);
        return user;
      });

      await fixture.Deliver("LOGIN", eventId);

      var user = Assert.Single(fixture.Users);
      fixture.VerifyLog(LogLevel.Warning, warning, Times.Once());
      fixture.VerifyLog(LogLevel.Information,
        $"Login: Recovered the missing Yoma user '{user.Id}' from Keycloak user '{fixture.KeycloakUser.Id}'",
        informationEnabled ? Times.Once() : Times.Never());

      // Neither a replay nor a later ordinary login should report another recovery attempt.
      await fixture.Deliver("LOGIN", eventId);
      await fixture.Deliver("LOGIN");

      fixture.VerifyLog(LogLevel.Warning, "Login: Possible lost REGISTER event", Times.Once());
      fixture.Repository.Verify(o => o.Create(It.IsAny<User>()), Times.Once);
    }

    [Fact]
    public async Task ExistingLoginUsesExternalIdAndPreservesProfileSettingsAndOnboarding()
    {
      using var fixture = new Fixture();
      var existing = fixture.AddUser(linked: true);
      var snapshot = fixture.Snapshot(existing);
      fixture.KeycloakUser.Username = "changed@example.org";
      fixture.KeycloakUser.Email = "changed@example.org";
      fixture.KeycloakUser.PhoneNumber = "+27821234568";
      fixture.KeycloakUser.EmailVerified = false;
      fixture.KeycloakUser.PhoneNumberVerified = false;

      await fixture.Deliver("LOGIN");

      var user = Assert.Single(fixture.Users);
      Assert.Equal(snapshot.Id, user.Id);
      Assert.Equal("changed@example.org", user.Email);
      Assert.Equal("+27821234568", user.PhoneNumber);
      Assert.False(user.EmailConfirmed);
      Assert.False(user.PhoneNumberConfirmed);
      fixture.AssertProfilePreserved(snapshot, user);
      fixture.Country.Verify(o => o.GetByNameOrNull(It.IsAny<string>()), Times.Never);
      fixture.Identity.Verify(o => o.EnsureRoles(It.IsAny<Guid>(), It.IsAny<List<string>>()), Times.Never);
      fixture.Repository.Verify(o => o.Create(It.IsAny<User>()), Times.Never);
      fixture.VerifyReferralEvents(user.Id, 1);
      fixture.VerifyLoginEffects(user.Id, 1);
      fixture.VerifyNoOnboardingOrPayoutCalls();
      fixture.VerifyLog(LogLevel.Warning, "Login: Possible lost REGISTER event", Times.Never());
    }

    [Theory]
    [InlineData("REGISTER")]
    [InlineData("LOGIN")]
    public async Task ProvisionedUserIsLinkedWithoutCreatingAnotherRecord(string type)
    {
      using var fixture = new Fixture();
      var existing = fixture.AddUser(linked: false);
      var id = existing.Id;
      var settings = existing.SettingsRaw;

      await fixture.Deliver(type);

      var user = Assert.Single(fixture.Users);
      Assert.Equal(id, user.Id);
      Assert.Equal(fixture.KeycloakUser.Id, user.ExternalId);
      Assert.Equal(settings, user.SettingsRaw);
      Assert.Equal(type == "REGISTER" ? "Test" : "Provisioned", user.FirstName);
      fixture.Repository.Verify(o => o.Create(It.IsAny<User>()), Times.Never);
      fixture.VerifyRoleAssignment(type == "REGISTER" ? Times.Once() : Times.Never());
      fixture.VerifyNoOnboardingOrPayoutCalls();
      fixture.VerifyLog(LogLevel.Warning, "Login: Possible lost REGISTER event", Times.Never());
    }

    [Fact]
    public async Task ExternalIdLookupTakesPrecedenceOverUsernameFallback()
    {
      using var fixture = new Fixture();
      var existing = fixture.AddUser(linked: true);

      await fixture.Deliver("LOGIN");

      Assert.Equal(existing.Id, Assert.Single(fixture.Users).Id);
      fixture.UserService.Verify(o => o.GetByUsernameOrNull(It.IsAny<string>(), false, false), Times.Never);
    }

    [Fact]
    public async Task RegistrationStillCreatesWithoutLoginSideEffects()
    {
      using var fixture = new Fixture();

      await fixture.Deliver("REGISTER");

      var user = Assert.Single(fixture.Users);
      Assert.Null(user.DateLastLogin);
      fixture.VerifyRoleAssignment(Times.Once());
      Assert.Empty(fixture.History);
      Assert.Empty(fixture.Wallet.Invocations);
      fixture.VerifyNoOnboardingOrPayoutCalls();
      fixture.VerifyLog(LogLevel.Warning, "Login: Possible lost REGISTER event", Times.Never());
    }
    #endregion

    #region Ordering and Duplicates
    [Theory]
    [InlineData("REGISTER", "LOGIN", "UPDATE_PROFILE")]
    [InlineData("REGISTER", "UPDATE_PROFILE", "LOGIN")]
    [InlineData("LOGIN", "REGISTER", "UPDATE_PROFILE")]
    [InlineData("LOGIN", "UPDATE_PROFILE", "REGISTER")]
    [InlineData("UPDATE_PROFILE", "REGISTER", "LOGIN")]
    [InlineData("UPDATE_PROFILE", "LOGIN", "REGISTER")]
    public async Task EveryEventOrderingProducesOneLinkedUser(string first, string second, string third)
    {
      using var fixture = new Fixture();

      await fixture.Deliver(first);
      var createdId = fixture.Users.SingleOrDefault()?.Id;
      await fixture.Deliver(second);
      createdId ??= fixture.Users.SingleOrDefault()?.Id;
      await fixture.Deliver(third);

      var user = Assert.Single(fixture.Users);
      Assert.Equal(createdId, user.Id);
      Assert.Equal(fixture.KeycloakUser.Id, user.ExternalId);
      Assert.Equal("Test", user.FirstName);
      Assert.NotNull(user.DateLastLogin);
      fixture.Repository.Verify(o => o.Create(It.IsAny<User>()), Times.Once);
      fixture.VerifyLoginEffects(user.Id, 1);
      fixture.VerifyNoOnboardingOrPayoutCalls();
    }

    [Theory]
    [InlineData("REGISTER")]
    [InlineData("LOGIN")]
    public async Task IdenticalEventReplayIsSuppressed(string type)
    {
      using var fixture = new Fixture();
      var eventId = Guid.NewGuid().ToString();

      await fixture.Deliver(type, eventId);
      await fixture.Deliver(type, eventId);

      var user = Assert.Single(fixture.Users);
      fixture.Repository.Verify(o => o.Create(It.IsAny<User>()), Times.Once);
      fixture.Repository.Verify(o => o.Update(It.IsAny<User>()), Times.Never);
      fixture.Identity.Verify(o => o.GetUserById(fixture.KeycloakUser.Id), Times.Once);
      fixture.VerifyReferralEvents(user.Id, 1);
      if (type == "LOGIN") fixture.VerifyLoginEffects(user.Id, 1);
    }

    [Fact]
    public async Task DistinctLoginEventsRemainLegitimateLoginsWithoutRecreatingUser()
    {
      using var fixture = new Fixture();

      await fixture.Deliver("LOGIN");
      var user = Assert.Single(fixture.Users);
      var id = user.Id;
      var settings = user.SettingsRaw;
      await fixture.Deliver("LOGIN");
      await fixture.Deliver("LOGIN");

      Assert.Equal(id, Assert.Single(fixture.Users).Id);
      Assert.Equal(settings, user.SettingsRaw);
      fixture.Repository.Verify(o => o.Create(It.IsAny<User>()), Times.Once);
      fixture.Repository.Verify(o => o.Update(It.IsAny<User>()), Times.Exactly(2));
      fixture.VerifyRoleAssignment(Times.Once());
      fixture.VerifyReferralEvents(id, 3);
      fixture.VerifyLoginEffects(id, 3);
    }

    [Fact]
    public async Task LateRegistrationDoesNotResetRecoveredLoginOrProfile()
    {
      using var fixture = new Fixture();
      await fixture.Deliver("LOGIN");
      var user = Assert.Single(fixture.Users);
      var lastLogin = user.DateLastLogin;
      var snapshot = fixture.Snapshot(user);
      fixture.KeycloakUser.FirstName = "Changed";
      fixture.KeycloakUser.LastName = "Changed";

      await fixture.Deliver("REGISTER");

      Assert.Equal(lastLogin, user.DateLastLogin);
      fixture.AssertProfilePreserved(snapshot, user);
      fixture.Repository.Verify(o => o.Create(It.IsAny<User>()), Times.Once);
      fixture.VerifyLoginEffects(user.Id, 1);
    }

    [Theory]
    [InlineData("LOGIN", "REGISTER")]
    [InlineData("REGISTER", "LOGIN")]
    public async Task ConcurrentLoginAndRegistrationAreSerializedWithoutLookupWait(string first, string second)
    {
      using var fixture = new Fixture();
      var roleStarted = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
      var releaseRole = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
      fixture.Identity.Setup(o => o.EnsureRoles(It.IsAny<Guid>(), It.IsAny<List<string>>()))
        .Returns(async () =>
        {
          roleStarted.TrySetResult();
          await releaseRole.Task;
        });

      var firstEvent = fixture.Deliver(first);
      await roleStarted.Task.WaitAsync(TimeSpan.FromSeconds(3), TestContext.Current.CancellationToken);
      var secondEvent = fixture.Deliver(second);
      Assert.Empty(fixture.Users);
      fixture.Identity.Verify(o => o.GetUserById(fixture.KeycloakUser.Id), Times.Once);
      releaseRole.SetResult();
      await Task.WhenAll(firstEvent, secondEvent).WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);

      var user = Assert.Single(fixture.Users);
      fixture.Repository.Verify(o => o.Create(It.IsAny<User>()), Times.Once);
      fixture.VerifyLoginEffects(user.Id, 1);
      fixture.VerifyNoOnboardingOrPayoutCalls();
    }

    [Fact]
    public async Task ConcurrentDistinctLoginsCreateOnlyOnce()
    {
      using var fixture = new Fixture();
      fixture.Repository.Setup(o => o.Create(It.IsAny<User>()))
        .Returns(async (User user) =>
        {
          // Keep creation in flight so the remaining callbacks contend for the same lock.
          await Task.Delay(20, TestContext.Current.CancellationToken);
          fixture.Users.Add(user);
          return user;
        });

      await Task.WhenAll(Enumerable.Range(0, 12).Select(_ => fixture.Deliver("LOGIN")))
        .WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);

      var user = Assert.Single(fixture.Users);
      fixture.Repository.Verify(o => o.Create(It.IsAny<User>()), Times.Once);
      fixture.VerifyRoleAssignment(Times.Once());
      fixture.VerifyReferralEvents(user.Id, 12);
      fixture.VerifyLoginEffects(user.Id, 12);
    }

    [Fact]
    public async Task ConcurrentIdenticalLoginsAreProcessedOnlyOnce()
    {
      using var fixture = new Fixture();
      fixture.Repository.Setup(o => o.Create(It.IsAny<User>()))
        .Returns(async (User user) =>
        {
          await Task.Delay(20, TestContext.Current.CancellationToken);
          fixture.Users.Add(user);
          return user;
        });

      var eventId = Guid.NewGuid().ToString();

      await Task.WhenAll(Enumerable.Range(0, 8).Select(_ => fixture.Deliver("LOGIN", eventId)));

      var user = Assert.Single(fixture.Users);
      fixture.Repository.Verify(o => o.Create(It.IsAny<User>()), Times.Once);
      fixture.VerifyLoginEffects(user.Id, 1);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task ConcurrentMixedEventsPreserveExistingUserAndProvisionedLinking(bool linked)
    {
      using var fixture = new Fixture();
      var existing = fixture.AddUser(linked);
      var snapshot = fixture.Snapshot(existing);
      fixture.Repository.Setup(o => o.Update(It.IsAny<User>()))
        .Returns(async (User user) =>
        {
          // Hold each update briefly to exercise queued callbacks, not sequential completed tasks.
          await Task.Delay(20, TestContext.Current.CancellationToken);
          return user;
        });

      await Task.WhenAll(Enumerable.Range(0, 24)
        .Select(index => fixture.Deliver(index % 2 == 0 ? "LOGIN" : "REGISTER")))
        .WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);

      var user = Assert.Single(fixture.Users);
      Assert.Equal(existing.Id, user.Id);
      Assert.Equal(fixture.KeycloakUser.Id, user.ExternalId);
      Assert.Equal(snapshot.SettingsRaw, user.SettingsRaw);
      Assert.Equal(snapshot.YoIDOnboarded, user.YoIDOnboarded);
      Assert.Equal(snapshot.DateYoIDOnboarded, user.DateYoIDOnboarded);
      if (linked) fixture.AssertProfilePreserved(snapshot, user);

      fixture.Repository.Verify(o => o.Create(It.IsAny<User>()), Times.Never);
      fixture.Repository.Verify(o => o.Update(It.IsAny<User>()), Times.Exactly(24));
      fixture.VerifyReferralEvents(user.Id, 24);
      fixture.VerifyLoginEffects(user.Id, 12);
      fixture.VerifyNoOnboardingOrPayoutCalls();
    }
    #endregion

    #region Validation and Failure Handling
    [Theory]
    [InlineData("not-a-guid")]
    [InlineData("00000000-0000-0000-0000-000000000000")]
    public async Task InvalidUserIdDoesNotReadKeycloakOrWrite(string userId)
    {
      using var fixture = new Fixture();
      await fixture.Deliver("LOGIN", userId: userId);

      Assert.Empty(fixture.Users);
      Assert.DoesNotContain(fixture.Identity.Invocations, o => o.Method.Name == nameof(IIdentityProviderClient.GetUserById));
      Assert.Empty(fixture.UserService.Invocations);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task MissingKeycloakUserOrUsernameDoesNotCreate(bool missingUsername)
    {
      using var fixture = new Fixture();
      if (missingUsername) fixture.KeycloakUser.Username = " ";
      else fixture.Identity.Setup(o => o.GetUserById(It.IsAny<Guid>())).ReturnsAsync((Domain.IdentityProvider.Models.User?)null);

      await fixture.Deliver("LOGIN");

      Assert.Empty(fixture.Users);
      Assert.Empty(fixture.Wallet.Invocations);
      fixture.VerifyRoleAssignment(Times.Never());
    }

    [Fact]
    public async Task KeycloakFailureReleasesLockAndFreshLoginCanRecover()
    {
      using var fixture = new Fixture();
      fixture.Identity.SetupSequence(o => o.GetUserById(It.IsAny<Guid>()))
        .ThrowsAsync(new InvalidOperationException("Keycloak unavailable"))
        .ReturnsAsync(fixture.KeycloakUser);

      await fixture.Deliver("LOGIN");
      Assert.Empty(fixture.Users);
      await fixture.Deliver("LOGIN");

      fixture.VerifyLoginEffects(Assert.Single(fixture.Users).Id, 1);
    }

    [Fact]
    public async Task UpdateProfileStillCannotCreateMissingUser()
    {
      using var fixture = new Fixture();

      await fixture.Deliver("UPDATE_PROFILE");

      Assert.Empty(fixture.Users);
      fixture.Repository.Verify(o => o.Create(It.IsAny<User>()), Times.Never);
      fixture.VerifyRoleAssignment(Times.Never());
      Assert.Empty(fixture.Wallet.Invocations);
      Assert.Empty(fixture.History);
    }

    [Fact]
    public async Task MissingEventIdIsRejectedBeforeReplayCheckOrIdentityLookup()
    {
      using var fixture = new Fixture();
      await fixture.Deliver("LOGIN", eventId: " ");

      Assert.Empty(fixture.Users);
      Assert.Empty(fixture.Idempotency.Invocations);
      fixture.Identity.Verify(o => o.GetUserById(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task EmailActionAndHistoryFailuresRemainNonFatalAfterRecovery()
    {
      using var fixture = new Fixture();
      fixture.Identity.Setup(o => o.EnsureVerifyEmailActionRemovedIfNoEmail(It.IsAny<Guid>()))
        .ThrowsAsync(new InvalidOperationException("Cleanup unavailable"));
      fixture.UserService.Setup(o => o.TrackLogin(It.IsAny<UserRequestLoginEvent>()))
        .ThrowsAsync(new InvalidOperationException("History unavailable"));

      await fixture.Deliver("LOGIN");

      var user = Assert.Single(fixture.Users);
      fixture.Wallet.Verify(o => o.ScheduleWalletCreation(user.Id), Times.Once);
      fixture.VerifyNoOnboardingOrPayoutCalls();
    }

    [Theory]
    [InlineData("email")]
    [InlineData("phone")]
    [InlineData("birth-date")]
    [InlineData("username")]
    [InlineData("contact-missing")]
    public async Task RecoveryDoesNotBypassExistingValidation(string invalid)
    {
      using var fixture = new Fixture();
      switch (invalid)
      {
        case "email":
          fixture.KeycloakUser.Email = "invalid";
          fixture.KeycloakUser.Username = "invalid";
          break;
        case "phone":
          fixture.KeycloakUser.PhoneNumber = "bad-phone";
          break;
        case "birth-date":
          fixture.KeycloakUser.DateOfBirth = DateTimeOffset.UtcNow.AddDays(2).ToString("yyyy-MM-dd");
          break;
        case "username":
          fixture.KeycloakUser.Username = "different@example.org";
          break;
        case "contact-missing":
          fixture.KeycloakUser.Email = null;
          fixture.KeycloakUser.PhoneNumber = null;
          break;
        default:
          throw new NotSupportedException(invalid);
      }

      await fixture.Deliver("LOGIN");

      Assert.Empty(fixture.Users);
      Assert.Empty(fixture.Wallet.Invocations);
      Assert.Empty(fixture.History);
      fixture.Repository.Verify(o => o.Create(It.IsAny<User>()), Times.Never);
    }

    [Fact]
    public async Task ContactConflictDoesNotMergeOrCreateUser()
    {
      using var fixture = new Fixture();
      var existing = fixture.AddUser(linked: true);
      fixture.KeycloakUser.Email = "other@example.org";
      fixture.KeycloakUser.Username = "other@example.org";
      fixture.KeycloakUser.Id = Guid.NewGuid();

      await fixture.Deliver("LOGIN");

      Assert.Equal(existing.Id, Assert.Single(fixture.Users).Id);
      Assert.NotEqual(fixture.KeycloakUser.Id, existing.ExternalId);
      Assert.Empty(fixture.History);
      Assert.Empty(fixture.Wallet.Invocations);
    }

    [Fact]
    public async Task UnknownProfileAttributesRetainRegistrationParsingBehaviour()
    {
      using var fixture = new Fixture();
      fixture.KeycloakUser.Country = "Unknown";
      fixture.KeycloakUser.Education = "Unknown";
      fixture.KeycloakUser.Gender = "Unknown";
      fixture.KeycloakUser.DateOfBirth = "not-a-date";

      await fixture.Deliver("LOGIN");

      var user = Assert.Single(fixture.Users);
      Assert.Null(user.CountryId);
      Assert.Null(user.EducationId);
      Assert.Null(user.GenderId);
      Assert.Null(user.DateOfBirth);
      fixture.VerifyLoginEffects(user.Id, 1);
    }

    [Fact]
    public async Task DatabaseFailureIsNotTreatedAsSuccessfulRecoveryAndNewLoginCanRetry()
    {
      using var fixture = new Fixture();
      var failedId = Guid.NewGuid().ToString();
      fixture.Repository.Setup(o => o.Create(It.IsAny<User>())).ThrowsAsync(new InvalidOperationException("Database unavailable"));

      await fixture.Deliver("LOGIN", failedId);
      await fixture.Deliver("LOGIN", failedId);
      Assert.Empty(fixture.Users);
      Assert.Empty(fixture.Wallet.Invocations);
      fixture.Repository.Verify(o => o.Create(It.IsAny<User>()), Times.Once);
      fixture.VerifyLog(LogLevel.Warning,
        $"Login: Possible lost REGISTER event; no Yoma user found for Keycloak user '{fixture.KeycloakUser.Id}' (event '{failedId}'); attempting recovery",
        Times.Once());
      fixture.VerifyLog(LogLevel.Information, "Login: Recovered the missing Yoma user", Times.Never());

      fixture.ConfigureCreate();
      await fixture.Deliver("LOGIN");
      var user = Assert.Single(fixture.Users);
      fixture.Wallet.Verify(o => o.ScheduleWalletCreation(user.Id), Times.Once);
      Assert.Equal(user.Id, Assert.Single(fixture.History).UserId);
      fixture.VerifyLog(LogLevel.Warning, "Login: Possible lost REGISTER event", Times.Exactly(2));
      fixture.VerifyLog(LogLevel.Information, "Login: Recovered the missing Yoma user", Times.Once());

      // Cleanup is intentionally attempted before persistence, including the failed attempt.
      fixture.Identity.Verify(o => o.EnsureVerifyEmailActionRemovedIfNoEmail(fixture.KeycloakUser.Id), Times.Exactly(2));
    }

    [Fact]
    public async Task RoleAndWalletFailuresRemainNonFatalAndHistoryStillRuns()
    {
      using var fixture = new Fixture();
      fixture.Identity.Setup(o => o.EnsureRoles(It.IsAny<Guid>(), It.IsAny<List<string>>()))
        .ThrowsAsync(new InvalidOperationException("Role service unavailable"));
      fixture.Wallet.Setup(o => o.ScheduleWalletCreation(It.IsAny<Guid?>()))
        .ThrowsAsync(new InvalidOperationException("Wallet service unavailable"));

      await fixture.Deliver("LOGIN");

      var user = Assert.Single(fixture.Users);
      Assert.Equal(user.Id, Assert.Single(fixture.History).UserId);
      fixture.VerifyNoOnboardingOrPayoutCalls();
    }

    [Fact]
    public async Task LockTimeoutDoesNotRunIdentityOrUserProcessing()
    {
      using var fixture = new Fixture();
      fixture.Lock.Setup(o => o.RunWithLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<Func<Task>>(), It.IsAny<string>()))
        .ThrowsAsync(new TimeoutException("Lock unavailable"));

      await fixture.Deliver("LOGIN");

      Assert.Empty(fixture.Users);
      Assert.Empty(fixture.UserService.Invocations);
      fixture.Identity.Verify(o => o.GetUserById(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task IdempotencyCacheFailureRetainsPerUserSerialization()
    {
      using var fixture = new Fixture();
      fixture.Idempotency.Setup(o => o.TryCreateAsync(It.IsAny<string>(), It.IsAny<string>()))
        .ThrowsAsync(new InvalidOperationException("Replay cache unavailable"));

      await Task.WhenAll(Enumerable.Range(0, 8).Select(_ => fixture.Deliver("LOGIN")));

      var user = Assert.Single(fixture.Users);
      fixture.Repository.Verify(o => o.Create(It.IsAny<User>()), Times.Once);
      fixture.VerifyLoginEffects(user.Id, 8);
    }

    [Fact]
    public async Task UnauthorizedWebhookNeverProcessesItsPayload()
    {
      using var fixture = new Fixture();
      fixture.Identity.Setup(o => o.AuthenticateWebhook(It.IsAny<HttpContext>())).Returns(false);

      await fixture.Deliver("LOGIN", expectedStatus: StatusCodes.Status403Forbidden);

      Assert.Empty(fixture.Users);
      Assert.Empty(fixture.Idempotency.Invocations);
      Assert.Empty(fixture.UserService.Invocations);
    }

    [Theory]
    [InlineData("LOGIN_ERROR")]
    [InlineData("DELETE_ACCOUNT")]
    [InlineData("UNKNOWN")]
    public async Task UnsupportedEventsDoNotCreateUsers(string type)
    {
      using var fixture = new Fixture();
      await fixture.Deliver(type);

      Assert.Empty(fixture.Users);
      Assert.Empty(fixture.UserService.Invocations);
    }

    [Fact]
    public async Task LoginHistoryRetainsSocialProviderMetadata()
    {
      using var fixture = new Fixture();
      await fixture.Deliver("LOGIN", identityProvider: "google");

      var history = Assert.Single(fixture.History);
      Assert.Equal("google", history.IdentityProvider);
      Assert.Equal("openid-connect", history.AuthMethod);
      Assert.Equal("code", history.AuthType);
      Assert.Equal("yoma-web", history.ClientId);
      Assert.Equal("127.0.0.1", history.IpAddress);
    }
    #endregion

    #region Fixture
    private sealed class Fixture : IDisposable
    {
      public readonly Guid CountryId = Guid.NewGuid();
      public readonly Guid EducationId = Guid.NewGuid();
      public readonly Guid GenderId = Guid.NewGuid();
      public readonly List<User> Users = [];
      public readonly List<UserLoginHistory> History = [];
      public readonly Mock<ILogger<WebhookController>> Logger = new();
      public readonly Mock<IIdentityProviderClient> Identity = new();
      public readonly Mock<IUserService> UserService = new();
      public readonly Mock<IRepositoryValueContainsWithNavigation<User>> Repository = new();
      public readonly Mock<ICountryService> Country = new();
      public readonly Mock<IEducationService> Education = new();
      public readonly Mock<IGenderService> Gender = new();
      public readonly Mock<IWalletService> Wallet = new();
      public readonly Mock<IPayoutService> Payout = new();
      public readonly Mock<IIdempotencyService> Idempotency = new();
      public readonly Mock<IDistributedLockService> Lock = new();
      private readonly Mock<ISSITenantService> _tenant = new();
      private readonly Mock<ISSICredentialService> _credential = new();
      private readonly Mock<IMediator> _mediator = new();
      private readonly SemaphoreSlim _semaphore = new(1, 1);
      private readonly HashSet<string> _eventIds = [];
      private readonly UserService _realUserService;

      public readonly Domain.IdentityProvider.Models.User KeycloakUser = new()
      {
        Id = Guid.NewGuid(),
        Username = "test@example.org",
        Email = " TEST@EXAMPLE.ORG ",
        FirstName = " test ",
        LastName = " user ",
        PhoneNumber = "+27821234567",
        Country = "South Africa",
        Education = "Tertiary",
        Gender = "Prefer not to say",
        DateOfBirth = "2000-01-02",
        EmailVerified = true,
        PhoneNumberVerified = true
      };

      public Fixture()
      {
        Logger.Setup(o => o.IsEnabled(It.IsAny<LogLevel>())).Returns(true);

        Identity.Setup(o => o.AuthenticateWebhook(It.IsAny<HttpContext>())).Returns(true);
        Identity.Setup(o => o.GetUserById(It.IsAny<Guid>())).ReturnsAsync(() => KeycloakUser);
        Identity.Setup(o => o.EnsureRoles(It.IsAny<Guid>(), It.IsAny<List<string>>())).Returns(Task.CompletedTask);
        Identity.Setup(o => o.EnsureVerifyEmailActionRemovedIfNoEmail(It.IsAny<Guid>())).Returns(Task.CompletedTask);

        Country.Setup(o => o.GetByNameOrNull("South Africa"))
          .Returns(new Domain.Lookups.Models.Country { Id = CountryId, Name = "South Africa" });
        Country.Setup(o => o.GetByIdOrNull(CountryId))
          .Returns(new Domain.Lookups.Models.Country { Id = CountryId, Name = "South Africa" });
        Country.Setup(o => o.GetByCodeAlpha2("WW"))
          .Returns(new Domain.Lookups.Models.Country { Id = Guid.NewGuid(), Name = "Worldwide" });
        Education.Setup(o => o.GetByNameOrNull("Tertiary"))
          .Returns(new Domain.Lookups.Models.Education { Id = EducationId, Name = "Tertiary" });
        Education.Setup(o => o.GetByIdOrNull(EducationId))
          .Returns(new Domain.Lookups.Models.Education { Id = EducationId, Name = "Tertiary" });
        Gender.Setup(o => o.GetByNameOrNull("Prefer not to say"))
          .Returns(new Domain.Lookups.Models.Gender { Id = GenderId, Name = "Prefer not to say" });
        Gender.Setup(o => o.GetByIdOrNull(GenderId))
          .Returns(new Domain.Lookups.Models.Gender { Id = GenderId, Name = "Prefer not to say" });

        Repository.Setup(o => o.Query(It.IsAny<bool>())).Returns(() => Users.AsQueryable());
        Repository.Setup(o => o.Query()).Returns(() => Users.AsQueryable());
        ConfigureCreate();
        Repository.Setup(o => o.Update(It.IsAny<User>())).ReturnsAsync((User user) => user);

        var definitions = new Mock<ISettingsDefinitionService>();
        definitions.Setup(o => o.ListByEntityType(EntityType.User)).Returns(
        [
          new SettingsDefinition
          {
            Key = "User_Settings_Configured",
            Type = SettingType.Boolean,
            DefaultValue = "false"
          }
        ]);
        var history = new Mock<IRepository<UserLoginHistory>>();
        history.Setup(o => o.Create(It.IsAny<UserLoginHistory>())).ReturnsAsync((UserLoginHistory item) =>
        {
          History.Add(item);
          return item;
        });
        _mediator.Setup(o => o.Publish(It.IsAny<ReferralProgressTriggerEvent>(), It.IsAny<CancellationToken>()))
          .Returns(Task.CompletedTask);

        _realUserService = new UserService(
          Options.Create(new AppSettings()),
          Mock.Of<IBlobService>(),
          Mock.Of<ISkillService>(),
          _tenant.Object,
          _credential.Object,
          definitions.Object,
          Mock.Of<IDelayedExecutionService>(),
          new UserRequestValidator(Country.Object, Education.Object, Gender.Object),
          new UserSearchFilterValidator(),
          new SettingsRequestValidator(),
          Repository.Object,
          Mock.Of<IRepository<UserSkill>>(),
          Mock.Of<IRepository<UserSkillOrganization>>(),
          history.Object,
          Mock.Of<IExecutionStrategyService>(),
          _mediator.Object);

        UserService.Setup(o => o.GetByExternalIdOrNull(It.IsAny<Guid>(), false, false))
          .Returns((Guid id, bool _, bool _) => _realUserService.GetByExternalIdOrNull(id, false, false));
        UserService.Setup(o => o.GetByUsernameOrNull(It.IsAny<string>(), false, false))
          .Returns((string username, bool _, bool _) => _realUserService.GetByUsernameOrNull(username, false, false));
        UserService.Setup(o => o.Upsert(It.IsAny<UserRequest>(), false, true))
          .Returns((UserRequest request, bool _, bool _) => _realUserService.Upsert(request, false, true));
        UserService.Setup(o => o.TrackLogin(It.IsAny<UserRequestLoginEvent>()))
          .Returns((UserRequestLoginEvent request) => _realUserService.TrackLogin(request));
        Wallet.Setup(o => o.ScheduleWalletCreation(It.IsAny<Guid?>())).Returns(Task.CompletedTask);

        Idempotency.Setup(o => o.TryCreateAsync(It.IsAny<string>(), It.IsAny<string>()))
          .ReturnsAsync((string key, string _) =>
          {
            lock (_eventIds) return _eventIds.Add(key);
          });
        Lock.Setup(o => o.RunWithLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<Func<Task>>(), It.IsAny<string>()))
          .Returns(async (string _, TimeSpan _, Func<Task> action, string _) =>
          {
            await _semaphore.WaitAsync();
            try { await action(); }
            finally { _semaphore.Release(); }
          });
      }

      public void ConfigureCreate()
      {
        Repository.Setup(o => o.Create(It.IsAny<User>())).ReturnsAsync((User user) =>
        {
          Users.Add(user);
          return user;
        });
      }

      public User AddUser(bool linked)
      {
        var user = new User
        {
          Id = Guid.NewGuid(),
          Username = KeycloakUser.Username,
          Email = KeycloakUser.Username,
          EmailConfirmed = true,
          FirstName = "Provisioned",
          Surname = "Person",
          DisplayName = "Provisioned Person",
          PhoneNumber = KeycloakUser.PhoneNumber,
          PhoneNumberConfirmed = true,
          CountryId = CountryId,
          EducationId = EducationId,
          GenderId = GenderId,
          DateOfBirth = DateTimeOffset.UtcNow.AddYears(-30).Date,
          ExternalId = linked ? KeycloakUser.Id : null,
          YoIDOnboarded = true,
          DateYoIDOnboarded = DateTimeOffset.UtcNow.AddYears(-1),
          SettingsRaw = "{\"User_Settings_Configured\":true}"
        };
        Users.Add(user);
        return user;
      }

      public User Snapshot(User user)
      {
        return new User
        {
          Id = user.Id,
          FirstName = user.FirstName,
          Surname = user.Surname,
          DisplayName = user.DisplayName,
          CountryId = user.CountryId,
          EducationId = user.EducationId,
          GenderId = user.GenderId,
          DateOfBirth = user.DateOfBirth,
          YoIDOnboarded = user.YoIDOnboarded,
          DateYoIDOnboarded = user.DateYoIDOnboarded,
          SettingsRaw = user.SettingsRaw
        };
      }

      public void AssertProfilePreserved(User snapshot, User user)
      {
        Assert.Equal(snapshot.Id, user.Id);
        Assert.Equal(snapshot.FirstName, user.FirstName);
        Assert.Equal(snapshot.Surname, user.Surname);
        Assert.Equal(snapshot.DisplayName, user.DisplayName);
        Assert.Equal(snapshot.CountryId, user.CountryId);
        Assert.Equal(snapshot.EducationId, user.EducationId);
        Assert.Equal(snapshot.GenderId, user.GenderId);
        Assert.Equal(snapshot.DateOfBirth, user.DateOfBirth);
        Assert.Equal(snapshot.YoIDOnboarded, user.YoIDOnboarded);
        Assert.Equal(snapshot.DateYoIDOnboarded, user.DateYoIDOnboarded);
        Assert.Equal(snapshot.SettingsRaw, user.SettingsRaw);
      }

      public void VerifyRoleAssignment(Times times)
      {
        Identity.Verify(o => o.EnsureRoles(KeycloakUser.Id, It.Is<List<string>>(roles =>
          roles.Count == 1 && roles[0] == Domain.Core.Constants.Role_User)), times);
      }

      public void VerifyLoginEffects(Guid id, int count)
      {
        Wallet.Verify(o => o.ScheduleWalletCreation(id), Times.Exactly(count));
        Identity.Verify(o => o.EnsureVerifyEmailActionRemovedIfNoEmail(KeycloakUser.Id), Times.Exactly(count));
        Assert.Equal(count, History.Count);
        Assert.All(History, item => Assert.Equal(id, item.UserId));
        UserService.Verify(o => o.Upsert(It.IsAny<UserRequest>(), false, true), Times.AtLeastOnce);
      }

      public void VerifyReferralEvents(Guid id, int count)
      {
        _mediator.Verify(o => o.Publish(It.Is<ReferralProgressTriggerEvent>(item =>
          item.Entity.UserId == id && item.Entity.Source == Domain.Referral.ReferralTriggerSource.IdentityAction),
          It.IsAny<CancellationToken>()), Times.Exactly(count));
      }

      public void VerifyNoOnboardingOrPayoutCalls()
      {
        Assert.Empty(_tenant.Invocations);
        Assert.Empty(_credential.Invocations);
        Assert.Empty(Payout.Invocations);
        UserService.Verify(o => o.YoIDOnboard(It.IsAny<User>()), Times.Never);
        UserService.Verify(o => o.YoIDOnboard(It.IsAny<string>()), Times.Never);
      }

      public void VerifyLog(LogLevel level, string message, Times times)
      {
        Logger.Verify(o => o.Log(
          level,
          It.IsAny<EventId>(),
          It.Is<It.IsAnyType>((state, _) => state != null && state.ToString() != null
            && state.ToString()!.StartsWith(message, StringComparison.Ordinal)),
          It.IsAny<Exception?>(),
          It.IsAny<Func<It.IsAnyType, Exception?, string>>()), times);
      }

      public async Task Deliver(string type, string? eventId = null, string? userId = null,
        int expectedStatus = StatusCodes.Status200OK, string? identityProvider = null)
      {
        var response = new CompletedResponseFeature();
        var context = new DefaultHttpContext();
        context.Features.Set<IHttpResponseFeature>(response);
        var factory = new Mock<IIdentityProviderClientFactory>();
        factory.Setup(o => o.CreateClient()).Returns(Identity.Object);
        var controller = new WebhookController(
          Logger.Object,
          Options.Create(new AppSettings { DistributedLockKeycloakEventDurationInSeconds = 60 }),
          Idempotency.Object,
          Lock.Object,
          factory.Object,
          UserService.Object,
          Gender.Object,
          Country.Object,
          Education.Object,
          Wallet.Object,
          Payout.Object,
          Mock.Of<IYellowCardWebhookParser>())
        {
          ControllerContext = new ControllerContext { HttpContext = context }
        };
        var payload = JObject.FromObject(new KeycloakWebhookEvent
        {
          Type = type,
          RealmId = "yoma",
          Id = eventId ?? Guid.NewGuid().ToString(),
          Time = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
          ClientId = "yoma-web",
          UserId = userId ?? KeycloakUser.Id.ToString(),
          IpAddress = "127.0.0.1",
          Details = new Details
          {
            Auth_method = "openid-connect",
            Auth_type = "code",
            Identity_provider = identityProvider!
          }
        });

        var result = Assert.IsType<StatusCodeResult>(controller.ReceiveKeycloakWebhook(payload));
        Assert.Equal(expectedStatus, result.StatusCode);
        await response.Complete();
      }

      public void Dispose() => _semaphore.Dispose();
    }

    /// <summary>
    /// Drives the public webhook's actual OnCompleted callback, not its private mapping methods.
    /// The acknowledgement and subsequent processing remain separate, as they are in production.
    /// </summary>
    private sealed class CompletedResponseFeature : HttpResponseFeature
    {
      private readonly List<(Func<object, Task> Callback, object State)> _callbacks = [];

      public override void OnCompleted(Func<object, Task> callback, object state)
      {
        _callbacks.Add((callback, state));
      }

      public async Task Complete()
      {
        foreach (var (callback, state) in _callbacks.AsEnumerable().Reverse())
          await callback(state);
      }
    }
    #endregion
  }
}
