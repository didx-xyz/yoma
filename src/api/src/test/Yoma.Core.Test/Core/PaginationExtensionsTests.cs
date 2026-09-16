using Xunit;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Test.Core
{
  public class PaginationExtensionsTests
  {
    #region Class Variables
    private static readonly int[] ExpectedDescendingPage = [4, 3, 2];
    private static readonly int[] ExpectedLastPage = [7];
    #endregion

    #region Tests
    [Fact]
    public void ToPageWithChildren_RetainsHydrationGuardWhenSelectedRowChangesScope()
    {
      var allowedOrganization = Guid.NewGuid();
      var otherOrganization = Guid.NewGuid();
      var items = CreateItems();
      items.ForEach(o => o.OrganizationId = allowedOrganization);
      var query = items.AsQueryable().Where(o => o.OrganizationId == allowedOrganization).OrderBy(o => o.Order);
      // Model the later database read: same IDs, but the first row has been reassigned.
      var currentItems = items.Select((o, index) => new Item
      {
        Id = o.Id,
        Order = o.Order,
        OrganizationId = index == 0 ? otherOrganization : allowedOrganization
      }).AsQueryable();

      var (totalCount, pageItems) = query.ToPageWithChildren(
        new PaginationFilter { PageNumber = 1, PageSize = 2 }, o => o.Id,
        currentItems.Where(o => o.OrganizationId == allowedOrganization));

      Assert.Equal(4, totalCount);
      Assert.Equal(items[1].Id, Assert.Single(pageItems).Id);
      Assert.All(pageItems, o => Assert.Equal(allowedOrganization, o.OrganizationId));
    }

    [Fact]
    public void ToPageWithChildren_SeparateHydrationDisabled_PreservesFilteredPageAndIgnoresHydrationQuery()
    {
      var items = CreateItems();
      var query = items.AsQueryable().Where(o => o.Order >= 2).OrderByDescending(o => o.Order);

      var (totalCount, pageItems) = query.ToPageWithChildren(
        new PaginationFilter { PageNumber = 2, PageSize = 2 }, o => o.Id,
        Array.Empty<Item>().AsQueryable(), hydratePageSeparately: false);

      Assert.Equal(3, totalCount);
      Assert.Same(items[1], Assert.Single(pageItems));
    }

    [Fact]
    public void Page_Queryable_PreservesOrderingAndSelectsRequestedPage()
    {
      var query = Enumerable.Range(1, 7).AsQueryable().OrderByDescending(o => o);

      var result = query.Page(new PaginationFilter { PageNumber = 2, PageSize = 3 });

      Assert.IsType<IQueryable<int>>(result, exactMatch: false);
      Assert.Equal(ExpectedDescendingPage, result.ToArray());
    }

    [Fact]
    public void Page_Enumerable_SelectsPartialLastPage()
    {
      IEnumerable<int> query = Enumerable.Range(1, 7);

      var result = query.Page(new PaginationFilter { PageNumber = 3, PageSize = 3 });

      Assert.Equal(ExpectedLastPage, result.ToArray());
    }

    [Fact]
    public void ToPageWithChildren_RestoresPageOrderAndUsesHydratedItems()
    {
      var items = CreateItems();
      var query = items.AsQueryable().OrderByDescending(o => o.Order);
      var hydrated = items.Select(o => new Item { Id = o.Id, Order = o.Order, Hydrated = true }).AsQueryable();

      var (totalCount, pageItems) = query.ToPageWithChildren(new PaginationFilter { PageNumber = 1, PageSize = 2 }, o => o.Id, hydrated);

      Assert.Equal(4, totalCount);
      Assert.Equal(new[] { items[3].Id, items[2].Id }, pageItems.Select(o => o.Id).ToArray());
      Assert.All(pageItems, o => Assert.True(o.Hydrated));
    }

    [Fact]
    public void ToPageWithChildren_EmptyPage_PreservesTotalCount()
    {
      var items = CreateItems().AsQueryable();

      var (totalCount, pageItems) = items.OrderBy(o => o.Order).ToPageWithChildren(
        new PaginationFilter { PageNumber = 3, PageSize = 2 }, o => o.Id, items);

      Assert.Equal(4, totalCount);
      Assert.Empty(pageItems);
    }

    [Fact]
    public void ToPageWithChildren_Unpaginated_UsesOriginalQueryAndNullCount()
    {
      var items = CreateItems();
      var query = items.AsQueryable().Where(o => o.Order >= 2).OrderByDescending(o => o.Order);

      var (totalCount, pageItems) = query.ToPageWithChildren(new PaginationFilter(), o => o.Id, Array.Empty<Item>().AsQueryable());

      Assert.Null(totalCount);
      Assert.Equal(new[] { items[3].Id, items[2].Id, items[1].Id }, pageItems.Select(o => o.Id).ToArray());
      Assert.All(pageItems, o => Assert.False(o.Hydrated));
    }

    [Fact]
    public void ToPageWithChildren_MissingHydratedRow_IsOmittedWithoutReordering()
    {
      var items = CreateItems();
      var query = items.AsQueryable().OrderBy(o => o.Order);
      var hydrated = items.Where(o => o.Order != 2).Reverse().AsQueryable();

      var (totalCount, pageItems) = query.ToPageWithChildren(new PaginationFilter { PageNumber = 1, PageSize = 3 }, o => o.Id, hydrated);

      Assert.Equal(4, totalCount);
      Assert.Equal(new[] { items[0].Id, items[2].Id }, pageItems.Select(o => o.Id).ToArray());
    }

    [Fact]
    public void ToPageWithChildren_FilteredQuery_CountsAllMatchesAndHydratesOnlyPageIds()
    {
      var items = CreateItems();
      var query = items.AsQueryable().Where(o => o.Order % 2 == 0).OrderBy(o => o.Order);

      var (totalCount, pageItems) = query.ToPageWithChildren(
        new PaginationFilter { PageNumber = 2, PageSize = 1 }, o => o.Id, items.AsQueryable());

      Assert.Equal(2, totalCount);
      Assert.Equal(items[3].Id, Assert.Single(pageItems).Id);
    }
    #endregion

    #region Helpers
    private static List<Item> CreateItems()
    {
      return [.. Enumerable.Range(1, 4).Select(order => new Item { Id = Guid.NewGuid(), Order = order })];
    }

    private sealed class Item
    {
      public Guid Id { get; init; }

      public Guid OrganizationId { get; set; }

      public int Order { get; init; }

      public bool Hydrated { get; init; }
    }
    #endregion
  }
}
