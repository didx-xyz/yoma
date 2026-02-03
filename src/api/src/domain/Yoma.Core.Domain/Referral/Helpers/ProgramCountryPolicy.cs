namespace Yoma.Core.Domain.Referral.Helpers
{
  public static class ProgramCountryPolicy
  {
    public static bool ProgramAccessibleToUser(Guid worldwideCountryId, Guid? userCountryId, IReadOnlyCollection<Lookups.Models.Country>? programCountries)
    {
      // User has no country → no restriction enforceable → allow
      if (!userCountryId.HasValue) return true;

      // No program countries configured → implicit worldwide → allow
      if (programCountries == null || programCountries.Count == 0) return true;

      // Allow if program includes Worldwide OR user's country
      return programCountries.Any(c => c.Id == worldwideCountryId || c.Id == userCountryId.Value);
    }

    public static bool DefaultProgramIsWorldwide(Guid worldwideCountryId, IReadOnlyCollection<Lookups.Models.Country>? programCountries)
    {
      // Null / empty = implicit world-wide
      if (programCountries == null || programCountries.Count == 0) return true;

      // Must explicitly contain Worldwide
      return programCountries.Any(c => c.Id == worldwideCountryId);
    }

    public static List<Guid>? ResolveAvailableCountriesForProgramSearch(Guid worldwideCountryId, bool isAuthenticated, bool isAdmin, Guid? userCountryId, List<Guid>? requestedCountries)
    {
      requestedCountries = requestedCountries?.Distinct().ToList();

      // Authenticated non-admin users:
      // When a user country is available, always constrain results to
      // [UserCountry + Worldwide], regardless of what was requested.
      if (isAuthenticated && !isAdmin && userCountryId.HasValue)
        return [userCountryId.Value, worldwideCountryId];

      // No countries explicitly requested:
      // - Admins: no country filtering
      // - Everyone else: default to Worldwide-only
      if (requestedCountries == null || requestedCountries.Count == 0)
        return isAdmin ? null : [worldwideCountryId];

      // Explicit country filter provided by the caller
      return requestedCountries;
    }
  }
}
