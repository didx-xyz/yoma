using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Yoma.Core.Infrastructure.Shared.Converters
{
    public class UtcDateTimeOffsetConverter : ValueConverter<DateTimeOffset, DateTimeOffset>
    {
        public UtcDateTimeOffsetConverter(ConverterMappingHints? mappingHints = null)
            : base(
                convertToProviderExpression: dto => dto.ToUniversalTime(),
                convertFromProviderExpression: utc => utc,
                mappingHints)
        { }
    }
}
