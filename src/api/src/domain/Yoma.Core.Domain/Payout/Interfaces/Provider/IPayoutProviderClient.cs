using Yoma.Core.Domain.Payout.Models.Provider;

namespace Yoma.Core.Domain.Payout.Interfaces.Provider
{
  public interface IPayoutProviderClient
  {
    /// <summary>Hosted wallet landing page, independent of the partner API endpoint.</summary>
    string WalletUrl { get; }

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
