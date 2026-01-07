using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using Yoma.Core.Domain.NewsFeedProvider.Interfaces;
using Yoma.Core.Domain.NewsFeedProvider.Models;

namespace Yoma.Core.Api.Controllers
{
  [Route($"api/{Common.Constants.Api_Version}/newsfeed")]
  [ApiController]
  [SwaggerTag("(by default, Anonymous)")]
  [AllowAnonymous]
  public class NewsFeedController : ControllerBase
  {
    #region Class Variables
    private readonly ILogger<NewsFeedController> _logger;
    private readonly INewsFeedService _newsFeedService;
    #endregion

    #region Constructor
    public NewsFeedController(ILogger<NewsFeedController> logger,
      INewsFeedService newsFeedService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _newsFeedService = newsFeedService ?? throw new ArgumentNullException(nameof(newsFeedService));
    }
    #endregion

    #region Public Members
    [SwaggerOperation(Summary = "List available news feeds",
      Description = "Returns all configured news feeds (e.g., News, Stories)")]
    [HttpGet("feeds")]
    [ProducesResponseType(typeof(IEnumerable<NewsFeed>), (int)HttpStatusCode.OK)]
    public ActionResult<IEnumerable<NewsFeed>> ListFeeds()
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(ListFeeds));

      var feeds = _newsFeedService.ListFeeds();

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(ListFeeds));

      return Ok(feeds);
    }

    [SwaggerOperation(Summary = "Search for news articles",
      Description = "Returns a paged list of news articles (newest first) based on the supplied filter")]
    [HttpPost("article/search")]
    [ProducesResponseType(typeof(NewsArticleSearchResults), (int)HttpStatusCode.OK)]
    public ActionResult<NewsArticleSearchResults> Search([FromBody] NewsArticleSearchFilter filter)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(Search));

      var result = _newsFeedService.Search(filter);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(Search));

      return Ok(result);
    }
    #endregion
  }
}
