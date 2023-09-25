namespace Yoma.Core.Domain.Core.Extensions
{
    public static class VersionExtensions
    {
        public static Version Default => new(1, 0);

        public static Version ToMajorMinor(this Version version)
        {
            if (version == null)
                throw new ArgumentNullException(nameof(version));

            return new Version(version.Major, version.Minor);
        }

        public static Version IncrementMinor(this Version version)
        {
            if (version == null)
                throw new ArgumentNullException(nameof(version));

            return version.Minor < 9 ? new Version(version.Major, version.Minor + 1) : new Version(version.Major + 1, 0);
        }
    }
}
