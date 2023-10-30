using System.Collections;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.MyOpportunity;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Models.Provider;

namespace Yoma.Core.Domain.SSI.Services
{
    public class SSICredentialService : ISSICredentialService
    {
        #region Class Variables
        private readonly ISSIProviderClient _ssiProviderClient;
        private readonly ISSISchemaTypeService _ssiSchemaTypeService;
        private readonly ISSISchemaService _ssiSchemaService;
        private readonly IUserService _userService;
        private readonly IOpportunityService _opportunityService;
        private readonly IMyOpportunityActionService _myOpportunityActionService;
        private readonly IMyOpportunityVerificationStatusService _myOpportunityVerificationStatusService;
        private readonly IRepository<SSICredentialIssuance> _ssiCredentialRepository;
        private readonly IRepositoryBatchedWithNavigation<MyOpportunity.Models.MyOpportunity> _myOpportunityRepository;
        #endregion

        #region Constructor
        public SSICredentialService(ISSIProviderClientFactory ssiProviderClientFactory,
            ISSISchemaTypeService ssiSchemaTypeService,
            ISSISchemaService ssiSchemaService,
            IUserService userService,
            IOpportunityService opportunityService,
            IMyOpportunityActionService myOpportunityActionService,
            IMyOpportunityVerificationStatusService myOpportunityVerificationStatusService,
            IRepository<SSICredentialIssuance> ssiCredentialRepository,
            IRepositoryBatchedWithNavigation<MyOpportunity.Models.MyOpportunity> myOpportunityRepository)
        {
            _ssiProviderClient = ssiProviderClientFactory.CreateClient();
            _ssiSchemaTypeService = ssiSchemaTypeService;
            _ssiSchemaService = ssiSchemaService;
            _userService = userService;
            _opportunityService = opportunityService;
            _myOpportunityActionService = myOpportunityActionService;
            _myOpportunityVerificationStatusService = myOpportunityVerificationStatusService;
            _ssiCredentialRepository = ssiCredentialRepository;
            _myOpportunityRepository = myOpportunityRepository;
        }
        #endregion

        #region Public Members
        public List<MyOpportunity.Models.MyOpportunity> ListPendingIssuanceMyOpportunity(int batchSize)
        {
            if (batchSize <= default(int))
                throw new ArgumentOutOfRangeException(nameof(batchSize));

            var schemaTypeId = _ssiSchemaTypeService.GetByName(SchemaType.Opportunity.ToString()).Id;
            var actionVerificationId = _myOpportunityActionService.GetByName(MyOpportunity.Action.Verification.ToString()).Id;
            var statusVerificationCompletedId = _myOpportunityVerificationStatusService.GetByName(VerificationStatus.Completed.ToString()).Id;

            var results = _myOpportunityRepository.Query(true).Where(
                o => o.ActionId == actionVerificationId && o.VerificationStatusId == statusVerificationCompletedId //completed verification
                 && !string.IsNullOrEmpty(o.OrganizationSSITenantId) && !string.IsNullOrEmpty(o.UserSSITenantId) //ssi tenants created
                 && o.OpportunityCredentialIssuanceEnabled //credential issuance enabled
                 && !_ssiCredentialRepository.Query().Any(
                     credential => credential.SchemaTypeId == schemaTypeId && credential.UserId == o.UserId && credential.MyOpportunityId == o.Id)) //not issued
                .OrderBy(o => o.DateModified).Take(batchSize).ToList();

            return results;
        }

        public async Task Issue(MyOpportunity.Models.MyOpportunity item)
        {
            if (string.IsNullOrEmpty(item.OpportunitySSISchemaName))
                throw new InvalidOperationException($"'My' opportunity with id {item.Id} has no associated schema");

            if (string.IsNullOrEmpty(item.OrganizationSSITenantId))
                throw new InvalidOperationException($"Organization with id '{item.OrganizationId}' has no associated SSI tenant id");

            if (string.IsNullOrEmpty(item.UserSSITenantId))
                throw new InvalidOperationException($"User with id '{item.UserSSITenantId}' has no associated SSI tenant id");

            var schema = _ssiSchemaService.GetByName(item.OpportunitySSISchemaName).Result;

            var request = new CredentialIssuanceRequest
            {
                SchemaName = schema.Name,
                ArtifactType = schema.ArtifactType,
                TenantIdIssuer = item.OrganizationSSITenantId,
                TenantIdHolder = item.UserSSITenantId,
                Attributes = new Dictionary<string, string>()
            };

            foreach (var entity in schema.Entities)
            {
                var entityType = Type.GetType(entity.TypeName);
                if (entityType == null)
                    throw new InvalidOperationException($"Failed to get the entity of type '{entity.TypeName}'");

                switch (entityType)
                {
                    case Type t when t == typeof(User):
                        var user = _userService.GetById(item.UserId, true, true);
                        ReflectEntityValues(request, entity, t, user);
                        break;

                    case Type t when t == typeof(Opportunity.Models.Opportunity):
                        var opportunity = _opportunityService.GetById(item.OpportunityId, true, true, false);
                        ReflectEntityValues(request, entity, t, opportunity);
                        break;

                    case Type t when t == typeof(MyOpportunity.Models.MyOpportunity):
                        ReflectEntityValues(request, entity, t, item);
                        break;

                    default:
                        throw new InvalidOperationException($"Entity of type '{entity.TypeName}' not supported");
                }
            }

            var credential = _ssiCredentialRepository.Query().SingleOrDefault(o => o.SchemaTypeId == schema.TypeId && o.UserId == item.UserId && o.MyOpportunityId == item.Id);
            if (credential != null)
                throw new InvalidOperationException($"Credential for 'my' opportunity with '{item.Id}' has already been issued on '{credential.DateIssued}'");

            var credentialId = await _ssiProviderClient.IssueCredential(request);
            credential = new SSICredentialIssuance
            {
                SchemaTypeId = schema.TypeId,
                UserId = item.UserId,
                MyOpportunityId = item.Id,
                CredentialId = credentialId
            };

            credential = await _ssiCredentialRepository.Create(credential);
        }
        #endregion

        #region Private Members
        private static void ReflectEntityValues<T>(CredentialIssuanceRequest request, SSISchemaEntity schemaEntity, Type type, T entity)
            where T : class

        {
            if (schemaEntity.Properties == null)
                throw new InvalidOperationException($"Entity properties is null or empty for entity '{schemaEntity.Name}'");

            foreach (var prop in schemaEntity.Properties)
            {
                var propNameParts = prop.Name.Split('.');
                if (!propNameParts.Any() || propNameParts.Length > 2)
                    throw new InvalidOperationException($"Entity '{schemaEntity.Name}' has an property with no name or a multi-part property are more than one level deep");

                var multiPart = propNameParts.Length > 1;

                var propValue = string.Empty;
                var propInfo = type.GetProperty(propNameParts.First())
                    ?? throw new InvalidOperationException($"Entity property '{prop.Name}' not found in entity '{schemaEntity.Name}'");

                var propValueObject = propInfo.GetValue(entity);
                if (prop.Required && propValueObject == null)
                    throw new InvalidOperationException($"Entity property '{prop.Name}' marked as required but is null");

                if (multiPart)
                {
                    var valList = propValueObject as IList
                        ?? throw new InvalidOperationException($"Multi-part property '{prop.Name}''s parent is not of type List<>");

                    var nonNullOrEmptyNames = valList
                         .Cast<object>()
                         .Where(item => item != null)
                         .Select(item =>
                         {
                             var skillType = item.GetType();
                             var nameProperty = skillType.GetProperty(propNameParts.Last());
                             if (nameProperty != null)
                             {
                                 return nameProperty.GetValue(item)?.ToString();
                             }
                             return null;
                         })
                         .Where(name => !string.IsNullOrEmpty(name)).ToList();

                    propValue = string.Join(", ", nonNullOrEmptyNames);
                }
                else
                    propValue = string.IsNullOrEmpty(propValueObject?.ToString()) ? "n/a" : propValueObject.ToString() ?? "n/a";

                request.Attributes.Add(prop.AttributeName, propValue);
            }
        }
        #endregion
    }
}
