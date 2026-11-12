using System.Text.RegularExpressions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Extensions
{
  public static partial class UserExtensions
  {
    /// <summary>
    /// Detects changes to stored profile values without treating a login, audit update or
    /// resolved lookup label as a profile edit. The background job separately checks whether
    /// any changed values appear on the issued YoID; this hash is only a scheduling guard.
    /// </summary>
    public static string ComputeProfileHash(this User user)
    {
      ArgumentNullException.ThrowIfNull(user);

      return HashHelper.ComputeSHA256Hash(HashHelper.SerializeForHashing(new
      {
        user.Username,
        user.Email,
        user.EmailConfirmed,
        user.FirstName,
        user.Surname,
        user.DisplayName,
        user.PhoneNumber,
        user.PhoneNumberConfirmed,
        user.CountryId,
        user.Region,
        user.City,
        user.Coordinates,
        user.LocationSource,
        user.EducationId,
        user.GenderId,
        user.DateOfBirth,
        user.PhotoId
      }));
    }

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

    /// <summary>
    /// Character restrictions for free-text user names, aligned with Keycloak 26.4's
    /// person-name-prohibited-characters rule. Contact fields and lookups use their own validation.
    /// </summary>
    // Java's default Cntrl class is ASCII, not the broader .NET Unicode control category.
    [GeneratedRegex(@"[<>&""$%!#?§;*~/\\|^=\[\]{}()\x00-\x1F\x7F]")]
    public static partial Regex UserTextProhibitedCharacters();

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
