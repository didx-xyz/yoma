using Microsoft.AspNetCore.Http;
using System.Transactions;
using Yoma.Core.Domain.BlobProvider.Interfaces;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Validators;

namespace Yoma.Core.Domain.Core.Services
{
    public class BlobService : IBlobService
    {
        #region Class Variables
        private readonly IEnvironmentProvider _environmentProvider;
        private readonly IBlobProviderClient _blobProviderClient;
        private readonly IRepository<BlobObject> _blobObjectRepository;
        #endregion

        #region Constructor
        public BlobService(IEnvironmentProvider environmentProvider, IBlobProviderClientFactory blobProviderClientFactory, IRepository<BlobObject> blobObjectRepository)
        {
            _environmentProvider = environmentProvider;
            _blobProviderClient = blobProviderClientFactory.CreateClient();
            _blobObjectRepository = blobObjectRepository;
        }
        #endregion

        #region Public Members
        public BlobObject GetById(Guid id)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            var result = _blobObjectRepository.Query().SingleOrDefault(o => o.Id == id);

            return result ?? throw new ArgumentOutOfRangeException(nameof(id), $"Blob with id '{id}' does not exist");
        }

        // Create the blob object only, preserving the tracking record; used for rollbacks
        public async Task<BlobObject> Create(Guid id, IFormFile file, FileType type)
        {
            var result = GetById(id);
            
            if (file == null)
                throw new ArgumentNullException(nameof(file));

            new FileValidator(type).Validate(file);
            
            await _blobProviderClient.Create(result.Key, file.ContentType, file.ToBinary());

            return result;
        }

        public async Task<BlobObject> Create(IFormFile file, FileType type)
        {
            if (file == null)
                throw new ArgumentNullException(nameof(file));

            new FileValidator(type).Validate(file);

            var id = Guid.NewGuid();
            var key = $"{_environmentProvider.Environment}/{type}/{id}{file.GetExtension()}";

            var result = new BlobObject
            {
                Id = id,
                Key = key,
                ContentType = file.ContentType,
                OriginalFileName = file.FileName
            };

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

            await _blobObjectRepository.Create(result);
            await _blobProviderClient.Create(key, file.ContentType, file.ToBinary());

            scope.Complete();

            return result;
        }

        public async Task<IFormFile> Download(Guid id)
        {
            var item = GetById(id);

            var (ContentType, Data) = await _blobProviderClient.Download(item.Key);

            return FileHelper.FromByteArray(item.OriginalFileName, ContentType, Data);
        }

        public string GetURL(Guid id)
        {
            var item = GetById(id);

            return _blobProviderClient.GetUrl(item.Key);
        }

        public async Task Delete(Guid id)
        {
            var item = GetById(id);

            using var scope = new TransactionScope(TransactionScopeOption.Required, TransactionScopeAsyncFlowOption.Enabled);

            await _blobObjectRepository.Delete(item);
            await _blobProviderClient.Delete(item.Key);

            scope.Complete();
        }

        // Delete the blob object only; used for rollbacks
        public async Task Delete(string key)
        {
            if(string.IsNullOrWhiteSpace(key))
                throw new ArgumentNullException(nameof(key));

            await _blobProviderClient.Delete(key);
        }
        #endregion
    }
}
