using Microsoft.Extensions.Configuration;

namespace FaceSync.Infra.Extensions;

public static class ConfigurationExtension
{
    public static string ConnectionString (this IConfiguration configuration) =>
        configuration.GetConnectionString("PostgresConnection")!;
}
