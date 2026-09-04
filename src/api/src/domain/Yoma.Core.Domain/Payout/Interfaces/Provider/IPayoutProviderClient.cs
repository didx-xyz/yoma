using Yoma.Core.Domain.Payout.Models.Provider;

namespace Yoma.Core.Domain.Payout.Interfaces.Provider
{
  public interface IPayoutProviderClient
  {
    /// <summary>
    /// Returns the countries currently supported by the payout provider as standard Yoma country models,
    /// together with live provider availability.
    /// </summary>
    Task<PayoutCountries> ListCountriesSupported();

    Task<PayoutResponse> Initiate(PayoutRequest request);

    Task<PayoutSessionResponse> GetSession(PayoutSessionRequest request);

    Task<PayoutStatusResponse> GetStatus(PayoutStatusRequest request);
  }
}
