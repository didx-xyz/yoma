using Yoma.Core.Domain.Payout.Models.Provider;

namespace Yoma.Core.Domain.Payout.Interfaces.Provider
{
  public interface IPayoutProviderClient
  {
    /// <summary>
    /// Returns supported payout countries, preserving standard country fields and adding nullable minimums,
    /// together with live provider availability.
    /// </summary>
    Task<PayoutCountries> ListCountriesSupported();

    Task<PayoutResponse> Initiate(PayoutRequest request);

    Task<PayoutSessionResponse> GetSession(PayoutSessionRequest request);

    Task<PayoutStatusResponse> GetStatus(PayoutStatusRequest request);

    /// <summary>Cancel the specified payout atomically at the provider. Only a confirmed Cancelled response is success.</summary>
    Task<PayoutStatusResponse> Cancel(PayoutCancellationRequest request);
  }
}
