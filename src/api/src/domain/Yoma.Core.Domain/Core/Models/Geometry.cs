using Newtonsoft.Json;

namespace Yoma.Core.Domain.Core.Models
{
    public class Geometry
    {
        [JsonProperty("type")]
        public SpatialType SpatialType { get; set; }

        //Point: X-coordinate (longitude -180 to +180), Y-coordinate (latitude -90 to +90), Z-elevation
        [JsonProperty("coordinates")]
        public List<double[]>? Coordinates { get; set; }
    }
}
