namespace Yoma.Core.Domain.Core.Extensions
{
  public static class GuidExtensions
  {
    public static bool IsNullOrEmpty(this Guid e)
    {
      return Equals(Guid.Empty, e);
    }

    public static bool IsNullOrEmpty(this Guid? e)
    {
      return !e.HasValue || Equals(Guid.Empty, e.Value);
    }
  }
}
