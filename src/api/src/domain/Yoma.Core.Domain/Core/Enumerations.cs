using System.ComponentModel;

namespace Yoma.Core.Domain.Core
{
    [Flags]
    public enum Environment
    {
        None = 0,
        [Description("Local")]
        Local = 1,
        [Description("Development")]
        Development = 2,
        [Description("Testing / Staging")]
        Staging = 4,
        [Description("Production")]
        Production = 8
    }

    [Flags]
    public enum CacheItemType
    {
        None = 0,
        Lookups = 1, //lookup entities i.e. countries; reference data store in lookup db namespace
        AmazonS3Client = 2
    }

    public enum FileType
    {
        Photos, //logo and profile photo
        Certificates,
        Documents,
        VoiceNotes
    }

    public enum Country
    {
        [Description("WW")]
        Worldwide
    }

    public enum SpatialType
    {
        None,
        Point
    }

    public enum TimeInterval
    {
        Hour,
        Day,
        Week,
        Month
    }

    public enum FilterSortOrder
    {
        Ascending,
        Descending
    }
}
