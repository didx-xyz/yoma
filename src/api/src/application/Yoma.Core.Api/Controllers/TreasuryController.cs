using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Payout.Interfaces;
using Yoma.Core.Domain.Payout.Models;
using Yoma.Core.Domain.Treasury.Interfaces;
using Yoma.Core.Domain.Treasury.Models;

namespace Yoma.Core.Api.Controllers
{
  [Route($"api/{Common.Constants.Api_Version}/treasury")]
  [ApiController]
  [Authorize(Policy = Common.Constants.Authorization_Policy)]
  [SwaggerTag("(by default, Admin role required)")]
  public class TreasuryController : ControllerBase
  {
    #region Class Variables
    private readonly ILogger<TreasuryController> _logger;
    private readonly ITreasuryService _treasuryService;
    private readonly IPayoutTransactionService _payoutTransactionService;
    #endregion

    #region Constructor
    public TreasuryController(ILogger<TreasuryController> logger,
        ITreasuryService treasuryService,
        IPayoutTransactionService payoutTransactionService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _treasuryService = treasuryService ?? throw new ArgumentNullException(nameof(treasuryService));
      _payoutTransactionService = payoutTransactionService ?? throw new ArgumentNullException(nameof(payoutTransactionService));
    }
    #endregion

    #region Public Members
    #region Authenticated User Based Actions
    [SwaggerOperation(Summary = "Preview ZLTO to USD conversion (Authenticated User)",
      Description = "Returns an indicative ZLTO to USD conversion and whether the Treasury currently has sufficient funds for the payout. " +
      "This is a preview only. The final conversion is determined at the time of transaction and may differ")]
    [HttpGet("conversion/zlto-usd")]
    [Authorize(Roles = Constants.Role_User)]
    public async Task<ActionResult<ConversionResponse>> ConvertZltoToUsd([FromQuery] decimal amount)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(ConvertZltoToUsd));

      var result = await _treasuryService.ConvertZltoToUsd(amount);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(ConvertZltoToUsd));

      return Ok(result);
    }
    #endregion Authenticated User Based Actions

    #region Administrative Actions
    [SwaggerOperation(Summary = "Get treasury info",
      Description = "Returns the treasury configuration and top-level treasury information. " +
      "Detailed treasury data for organizations, opportunities and referral programs," +
      "including pools, cumulative amounts, and balances, must be queried via the existing admin search endpoints: " +
      "'organization/search', 'referral/program/search/admin', and 'opportunity/search/admin'")]
    [HttpGet]
    [Authorize(Roles = Constants.Role_Admin)]
    public ActionResult<TreasuryInfo> Get()
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(Get));

      var result = _treasuryService.GetInfo();

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(Get));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Get payout transaction",
      Description = "Returns Yoma's authoritative payout audit record with the user and linked reward funding transaction")]
    [HttpGet("payout/transaction/{id}")]
    [Authorize(Roles = Constants.Role_Admin)]
    public ActionResult<PayoutTransactionInfo> GetTransaction([FromRoute] Guid id)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(GetTransaction));

      var result = _payoutTransactionService.GetInfoById(id);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(GetTransaction));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search payout transactions",
      Description = "Searches Yoma's authoritative payout audit records for Treasury administration. " +
      "Supports filtering by user, lifecycle status, payout type, provider, amount and creation date; " +
      "the general value search includes user identity and Yoma/provider transaction references. " +
      "Returns lightweight transaction rows; use the transaction id endpoint for linked reward funding detail")]
    [HttpPost("payout/transaction/search")]
    [Authorize(Roles = Constants.Role_Admin)]
    public ActionResult<PayoutTransactionSearchResults> SearchTransactions([FromBody] PayoutTransactionSearchFilter filter)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(SearchTransactions));

      var result = _payoutTransactionService.Search(filter);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(SearchTransactions));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Update treasury info",
     Description = "Updates the treasury configuration. " +
      "If the financial-year configuration moves the current financial year forward, Treasury and organization " +
      "current-financial-year cumulatives are reset. Lifetime cumulatives are preserved, and financial-year pools " +
      "remain unchanged unless explicitly updated.")]
    [HttpPatch]
    [Authorize(Roles = Constants.Role_Admin)]
    public async Task<ActionResult<TreasuryInfo>> Update(TreasuryRequestUpdate request)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(Update));

      var result = await _treasuryService.Update(request);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(Update));

      return Ok(result);
    }
    #endregion Administrative Actions
    #endregion Public Members 
  }
}
