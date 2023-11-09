using Microsoft.Extensions.Logging;
using System.Reflection;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Services
{
    public class UserBackgroundService : IUserBackgroundService
    {
        #region Class Variables
        private readonly ILogger<UserBackgroundService> _logger;
        private readonly IEnvironmentProvider _environmentProvider;
        private readonly IUserService _userService;
        private readonly IRepositoryValueContainsWithNavigation<User> _userRepository;

        private static readonly object _lock_Object = new();
        #endregion

        #region Constructor
        public UserBackgroundService(ILogger<UserBackgroundService> logger,
            IEnvironmentProvider environmentProvider,
            IUserService userService,
            IRepositoryValueContainsWithNavigation<User> userRepository)
        {
            _logger = logger;
            _environmentProvider = environmentProvider;
            _userService = userService;
            _userRepository = userRepository;
        }
        #endregion

        #region Public Members
        public void SeedPhotos()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                switch (_environmentProvider.Environment) //locally en development only
                {
                    case Core.Environment.Local:
                    case Core.Environment.Development:
                        break;
                    default:
                        _logger.LogInformation("SSI seeding skipped for environment '{environment}'", _environmentProvider.Environment);
                        return;
                }

                _logger.LogInformation("Processing user image seeding");

                var items = _userRepository.Query().Where(o => !o.PhotoId.HasValue).ToList();
                SeedPhotos(items);

                _logger.LogInformation("Processed user image seeding");
            }
        }
        #endregion

        #region Private Members
        private void SeedPhotos(List<User> items)
        {
            if (!items.Any()) return;

            var resourcePath = "Yoma.Core.Domain.Entity.SampleBlobs.sample_photo.png";
            var assembly = Assembly.GetExecutingAssembly();
            using var resourceStream = assembly.GetManifestResourceStream(resourcePath)
                ?? throw new InvalidOperationException($"Embedded resource '{resourcePath}' not found");

            byte[] resourceBytes;
            using (var memoryStream = new MemoryStream())
            {
                resourceStream.CopyTo(memoryStream);
                resourceBytes = memoryStream.ToArray();
            }

            string fileName = string.Join('.', resourcePath.Split('.').Reverse().Take(2).Reverse());
            string fileExtension = Path.GetExtension(fileName)[1..];

            foreach (var item in items)
                _userService.UpsertPhoto(item.Email, FileHelper.FromByteArray(fileName, $"image/{fileExtension}", resourceBytes)).Wait();
        }
        #endregion
    }
}
