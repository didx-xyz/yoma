using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Extensions
{
  public static class UserExtensions
  {
    /// <summary>
    /// Resolves genuine account verification methods from confirmed contacts and social login.
    /// Social login uses the same recorded-provider check as referrals. Absence is unknown,
    /// not a failed KYC check or verification of the user's self-declared profile.
    /// </summary>
    public static void SetAccountVerificationMethods(this User user, bool hasSocialIdentityProviders)
    {
      ArgumentNullException.ThrowIfNull(user);

      var methods = AccountVerificationMethod.None;
      if (user.EmailConfirmed == true && !string.IsNullOrEmpty(user.Email))
        methods |= AccountVerificationMethod.EmailVerified;

      if (user.PhoneNumberConfirmed == true && !string.IsNullOrEmpty(user.PhoneNumber))
        methods |= AccountVerificationMethod.MobileVerified;

      if (hasSocialIdentityProviders)
        methods |= AccountVerificationMethod.SocialLogin;

      user.AccountVerificationMethods = methods;
    }

    public static void SetDisplayName(this User user)
    {
      ArgumentNullException.ThrowIfNull(user, nameof(user));

      // Previously kept existing DisplayName if set, 
      // now always override with FirstName + Surname
      // if (!string.IsNullOrEmpty(user.DisplayName)) return;
      user.DisplayName = string.Join(' ', new[] { user.FirstName, user.Surname }.Where(o => !string.IsNullOrEmpty(o)));
      if (string.IsNullOrEmpty(user.DisplayName)) user.DisplayName = null;
    }

    public static void SetDisplayName(this UserRequest user)
    {
      ArgumentNullException.ThrowIfNull(user, nameof(user));

      // Previously kept existing DisplayName if set, 
      // now always override with FirstName + Surname
      // if (!string.IsNullOrEmpty(user.DisplayName)) return;
      user.DisplayName = string.Join(' ', new[] { user.FirstName, user.Surname }.Where(o => !string.IsNullOrEmpty(o)));
      if (string.IsNullOrEmpty(user.DisplayName)) user.DisplayName = null;
    }

    public static UserRequest ToUserRequest(this User user)
    {
      ArgumentNullException.ThrowIfNull(user, nameof(user));

      return new UserRequest
      {
        Id = user.Id,
        Username = user.Username,
        Email = user.Email,
        EmailConfirmed = user.EmailConfirmed,
        FirstName = user.FirstName,
        Surname = user.Surname,
        DisplayName = user.DisplayName, //cannot default; used to update user
        PhoneNumber = user.PhoneNumber,
        PhoneNumberConfirmed = user.PhoneNumberConfirmed,
        CountryId = user.CountryId,
        Region = user.Region,
        City = user.City,
        Coordinates = user.Coordinates,
        LocationSource = user.LocationSource,
        EducationId = user.EducationId,
        GenderId = user.GenderId,
        DateOfBirth = user.DateOfBirth,
        DateLastLogin = user.DateLastLogin,
        ExternalId = user.ExternalId
      };
    }

    public static UserInfo ToInfo(this User value)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      return new UserInfo
      {
        Id = value.Id,
        Username = value.Username,
        Email = value.Email,
        EmailConfirmed = value.EmailConfirmed,
        FirstName = value.FirstName,
        Surname = value.Surname,
        DisplayName = value.DisplayName ?? value.Username,
        PhoneNumber = value.PhoneNumber,
        PhoneNumberConfirmed = value.PhoneNumberConfirmed,
        CountryId = value.CountryId
      };
    }

    public static UserProfile ToProfile(this User value)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      return new UserProfile
      {
        Id = value.Id,
        Username = value.Username,
        Email = value.Email,
        EmailConfirmed = value.EmailConfirmed,
        FirstName = value.FirstName,
        Surname = value.Surname,
        DisplayName = value.DisplayName, //cannot default; model returned on api for editing as authenticated user (similar to user returned on api as admin)
        PhoneNumber = value.PhoneNumber,
        PhoneNumberConfirmed = value.PhoneNumberConfirmed,
        AccountVerificationMethods = value.AccountVerificationMethods,
        CountryId = value.CountryId,
        EducationId = value.EducationId,
        Region = value.Region,
        City = value.City,
        Coordinates = value.Coordinates,
        LocationSource = value.LocationSource,
        GenderId = value.GenderId,
        DateOfBirth = value.DateOfBirth,
        PhotoId = value.PhotoId,
        PhotoURL = value.PhotoURL,
        DateLastLogin = value.DateLastLogin,
        YoIDOnboarded = value.YoIDOnboarded,
        DateYoIDOnboarded = value.DateYoIDOnboarded,
        Settings = value.Settings,
        DateCreated = value.DateCreated,
        DateModified = value.DateModified
      };
    }

  }
}
