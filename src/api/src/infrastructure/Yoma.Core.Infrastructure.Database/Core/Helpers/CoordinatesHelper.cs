using NetTopologySuite.Geometries;

namespace Yoma.Core.Infrastructure.Database.Core.Helpers
{
  public static class CoordinatesHelper
  {
    // Convert the materialized geography point for the API only; spatial predicates stay in SQL.
    // Projecting X/Y directly translates to ST_X/ST_Y, which require geometry rather than geography.
    public static double[]? ToArray(Point? point) => point == null ? null : [point.X, point.Y];

    // Input is validated at the domain boundary: [longitude, latitude], WGS84 (SRID 4326).
    public static Point? ToPoint(double[]? coordinates) => coordinates == null ? null :
      new Point(coordinates[0], coordinates[1]) { SRID = 4326 };
  }
}
