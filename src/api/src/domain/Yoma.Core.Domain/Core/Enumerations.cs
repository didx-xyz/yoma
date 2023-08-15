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
  public enum ReferenceDataType
  {
    None = 0,
    Lookups = 1 //lookup entities i.e. countries; reference data store in lookup db namespace
  }

  public enum FileTypeEnum
  {
    Photos, //logo and profile photo
    Certificates,
    Documents
  }
}
