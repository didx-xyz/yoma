using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.NewsFeedProvider.Models;

namespace Yoma.Core.Domain.NewsFeedProvider.Validators
{
  public class NewsArticleSearchFilterValidator : PaginationFilterValidator<NewsArticleSearchFilter>
  {
    #region Constructor
    public NewsArticleSearchFilterValidator()
    {
      RuleFor(x => x.ValueContains).Length(3, 50).When(x => !string.IsNullOrEmpty(x.ValueContains));
      RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination is required.");
    }
    #endregion
  }
}
