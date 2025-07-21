using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Extensions
{
  public static class UserExtensions
  {
    public static void SetDisplayName(this User user)
    {
      ArgumentNullException.ThrowIfNull(user, nameof(user));

      if (!string.IsNullOrEmpty(user.DisplayName)) return;
      user.DisplayName = string.Join(' ', new[] { user.FirstName, user.Surname }.Where(o => !string.IsNullOrEmpty(o)));
      if (string.IsNullOrEmpty(user.DisplayName)) user.DisplayName = null;
    }

    public static void SetDisplayName(this UserRequest user)
    {
      ArgumentNullException.ThrowIfNull(user, nameof(user));

      if (!string.IsNullOrEmpty(user.DisplayName)) return;
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
        EducationId = user.EducationId,
        GenderId = user.GenderId,
        DateOfBirth = user.DateOfBirth,
        DateLastLogin = user.DateLastLogin,
        ExternalId = user.ExternalId,
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
        CountryId = value.CountryId,
        EducationId = value.EducationId,
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
