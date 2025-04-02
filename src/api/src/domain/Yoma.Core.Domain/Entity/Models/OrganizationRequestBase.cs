using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Entity.Models
{
  public abstract class OrganizationRequestBase
  {
    [Required]
    public string Name { get; set; }

    public string? WebsiteURL { get; set; }

    [Required]
    public string? PrimaryContactName { get; set; }

    [Required]
    public string? PrimaryContactEmail { get; set; }

    [Required]
    public string? PrimaryContactPhone { get; set; }

    public string? VATIN { get; set; }

    public string? TaxNumber { get; set; }

    public string? RegistrationNumber { get; set; }

    [Required]
    public string? City { get; set; }

    [Required]
    public Guid? CountryId { get; set; }

    [Required]
    public string? StreetAddress { get; set; }

    [Required]
    public string? Province { get; set; }

    [Required]
    public string? PostalCode { get; set; }

    public string? Tagline { get; set; }

    public string? Biography { get; set; }

    public IFormFile? Logo { get; set; }

    [Required]
    public List<Guid> ProviderTypes { get; set; }

    public List<IFormFile>? RegistrationDocuments { get; set; }

    public List<IFormFile>? EducationProviderDocuments { get; set; }

    public List<IFormFile>? BusinessDocuments { get; set; }

    [Required]
    public bool AddCurrentUserAsAdmin { get; set; }

    public List<string?>? Admins { get; set; }

    /// <summary>
    /// Outbound SSO Client ID used for configuring SSO, allowing logins on third-party systems using Yoma credentials
    /// </summary>
    public string? SSOClientIdOutbound { get; set; }

    /// <summary>
    /// Inbound SSO Client ID used for configuring SSO, allowing logins on Yoma's site using third-party credentials
    /// </summary>
    public string? SSOClientIdInbound { get; set; }

    public decimal? ZltoRewardPool { get; set; }

    public decimal? YomaRewardPool { get; set; }
  }
}
