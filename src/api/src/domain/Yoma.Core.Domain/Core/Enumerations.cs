using System.ComponentModel;

namespace Yoma.Core.Domain.Core
{
    public enum Environment
    {
        None,
        [Description("Local")]
        Local,
        [Description("Development")]
        Development,
        [Description("Testing / Staging")]
        Staging,
        [Description("Production")]
        Production
    }

    [Flags]
    public enum CacheItemType
    {
        None,
        Lookups, //lookup entities i.e. countries; reference data store in lookup db namespace
        AmazonS3Client,
        TrustRegistry
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
}
