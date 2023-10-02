using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Exceptions;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Services.Lookups
{
    public class SSISchemaEntityService : ISSISchemaEntityService
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly IMemoryCache _memoryCache;
        private readonly IRepositoryWithNavigation<SSISchemaEntity> _ssiSchemaEntityRepository;
        #endregion

        #region Constructor
        public SSISchemaEntityService(IOptions<AppSettings> appSettings,
            IMemoryCache memoryCache,
            IRepositoryWithNavigation<SSISchemaEntity> ssiSchemaEntityRepository)
        {
            _appSettings = appSettings.Value;
            _memoryCache = memoryCache;
            _ssiSchemaEntityRepository = ssiSchemaEntityRepository;
        }
        #endregion

        #region Public Members
        public SSISchemaEntity GetById(Guid id)
        {
            var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(SSISchemaEntity)} with '{id}' does not exists", nameof(id));
            return result;
        }

        public SSISchemaEntity? GetByIdOrNull(Guid id)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            return List().SingleOrDefault(o => o.Id == id);
        }

        public SSISchemaEntityProperty GetByAttributeName(string attributeName)
        {
            var result = GetByAttributeNameOrNull(attributeName) ?? throw new ArgumentException($"{nameof(SSISchemaEntityProperty)} with attribute name '{attributeName}' does not exists", nameof(attributeName));
            return result;
        }

        public SSISchemaEntityProperty? GetByAttributeNameOrNull(string attributeName)
        {
            if (string.IsNullOrWhiteSpace(attributeName))
                throw new ArgumentNullException(nameof(attributeName));
            attributeName = attributeName.Trim();

            var result = List().SelectMany(o => o.Properties?.Where(p => string.Equals(p.AttributeName, attributeName, StringComparison.InvariantCultureIgnoreCase)) ?? Enumerable.Empty<SSISchemaEntityProperty>()).ToList();
            if (result == null || !result.Any())
                throw new ArgumentException($"{nameof(SSISchemaEntityProperty)} not found with attribute name '{attributeName}'", nameof(attributeName));

            if (result.Count > 1)
                throw new DataInconsistencyException($"More than one {nameof(SSISchemaEntityProperty)} found with attribute name '{attributeName}'");

            return result.SingleOrDefault();
        }

        public List<SSISchemaEntity> List()
        {
            if (!_appSettings.CacheEnabledByCacheItemTypes.HasFlag(Core.CacheItemType.Lookups))
            {
                var entities = _ssiSchemaEntityRepository.Query(true).ToList();
                ReflectEntityTypeInformation(entities);
                entities = entities.OrderBy(o => o.Name).ToList();
                entities.ForEach(o => o.Properties = o.Properties?.OrderBy(p => p.AttributeName).ToList());
                return entities;
            }

            var result = _memoryCache.GetOrCreate(nameof(SSISchemaEntity), entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
                var entities = _ssiSchemaEntityRepository.Query(true).ToList();
                ReflectEntityTypeInformation(entities);
                entities = entities.OrderBy(o => o.Name).ToList();
                entities.ForEach(o => o.Properties = o.Properties?.OrderBy(p => p.AttributeName).ToList());
                return entities;
            }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(SSISchemaEntity)}s'");
            return result;
        }
        #endregion

        #region Private Members
        private static void ReflectEntityTypeInformation(List<SSISchemaEntity>? entities)
        {
            if (entities == null || !entities.Any()) return;

            foreach (var entity in entities)
            {
                var typeInfo = Type.GetType(entity.TypeName, false, true) ?? throw new InvalidOperationException($"Type not found with name '{entity.TypeName}' for entity '{entity.Name}'");

                entity.Name = typeInfo.Name;

                if (entity.Properties == null) continue;

                foreach (var prop in entity.Properties)
                {
                    var propNameParts = prop.Name.Split('.', StringSplitOptions.RemoveEmptyEntries).ToList();
                    if (propNameParts.Count == 0)
                        throw new InvalidOperationException($"Property name is empty for entity '{entity.Name}'. At least 1 property name part required");

                    if (propNameParts.Count > 2)
                        throw new InvalidOperationException($"Only support multi-part property with one level deep. Property '{prop.Name}'");

                    var multiPart = propNameParts.Count > 1;
                    var currentType = typeInfo;
                    foreach (var propName in propNameParts)
                    {
                        var propInfo = currentType.GetProperty(propName)
                            ?? throw new InvalidOperationException($"Property '{propName}' not found for type '{entity.TypeName}' in entity '{entity.Name}'");

                        if (propInfo.DeclaringType == null)
                            throw new InvalidOperationException($"Property declaring type not found for property '{propName}' in entity '{entity.Name}'");

                        if (multiPart)
                        {
                            if (!IsListType(propInfo.PropertyType, out Type? elementType))
                                throw new InvalidOperationException($"With a multi-part property, only a parent of List<> is supported for property '{propName}' in entity '{entity.Name}'");

                            if (elementType == null)
                                throw new InvalidOperationException("ElementType expected with ListType");

                            if (elementType.IsPrimitive || elementType == typeof(string) || elementType == typeof(DateTimeOffset))
                                throw new InvalidOperationException($"Multi-part property only supports a non-nullable child property of type primitive, string, or DateTimeOffset for property '{propName}' in entity '{entity.Name}'");

                            currentType = elementType;

                            prop.TypeName = $"List<{elementType.Name}>";
                            prop.DotNetType = $"{propInfo.PropertyType.GetGenericTypeDefinition().FullName}[[{{0}}]]";

                            multiPart = false;
                        }
                        else
                        {
                            var propTypeDisplayName = string.Empty;
                            if (Nullable.GetUnderlyingType(propInfo.PropertyType) != null) // Nullable<>
                            {
                                var genericArguments = propInfo.PropertyType.GetGenericArguments();
                                if (genericArguments.Length != 1)
                                    throw new InvalidOperationException($"With nullable property, single generic argument expected Nullable<T> for property '{propName}' in entity '{entity.Name}'");

                                propTypeDisplayName = genericArguments[0].Name;
                            }
                            else
                                propTypeDisplayName = propInfo.PropertyType.Name;

                            prop.TypeName = string.IsNullOrEmpty(prop.TypeName) ? propTypeDisplayName : string.Format(prop.TypeName, propTypeDisplayName);
                            prop.DotNetType = string.IsNullOrEmpty(prop.DotNetType) ? propInfo.PropertyType.FullName : string.Format(prop.DotNetType, propInfo.PropertyType.FullName);
                        }

                        if (string.IsNullOrEmpty(prop.AttributeName)) prop.AttributeName += $"{propInfo.DeclaringType.Name}_{propInfo.Name}";
                    }
                }
            }
        }

        private static bool IsListType(Type type, out Type? elementType)
        {
            elementType = null;
            if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(List<>))
            {
                elementType = type.GetGenericArguments()[0];
                return true;
            }
            return false;
        }
    }
    #endregion
}
