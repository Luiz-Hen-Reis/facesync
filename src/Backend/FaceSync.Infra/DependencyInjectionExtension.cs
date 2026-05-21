using FaceSync.Domain.Repositories;
using FaceSync.Domain.Repositories.UserFace;
using FaceSync.Infra.DataAccess;
using FaceSync.Infra.DataAccess.Repositories.UserFace;
using FaceSync.Infra.Extensions;
using FaceSync.Infra.Services.FaceDetection;
using FaceSync.Infra.Services.FaceRecognition;
using FluentMigrator.Runner;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace FaceSync.Infra;

public static class DependencyInjectionExtension
{
    public static void AddInfra(this IServiceCollection services, IConfiguration configuration)
    {
        AddDbContext(services, configuration);
        AddFluentMigrator(services, configuration);
        AddServices(services);
        AddRepositories(services);
    }

    private static void AddRepositories(IServiceCollection services)
    {
        services.AddScoped<IUserFaceWriteOnlyRepository, UserFaceRepository>();
        services.AddScoped<IUserFaceReadOnlyRepository, UserFaceRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
    }

    private static void AddServices(IServiceCollection services)
    {
        services.AddSingleton<IFaceDetectionService, FaceDetectionService>();
        services.AddSingleton<IFaceRecognitionService, FaceRecognitionService>();
    }

    private static void AddDbContext(IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.ConnectionString();

        services.AddDbContext<AppDbContext>(config =>
            config.UseNpgsql(connectionString));
    }

    private static void AddFluentMigrator(IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.ConnectionString();

        var infra = Assembly.Load("FaceSync.Infra");

        services.AddFluentMigratorCore().ConfigureRunner(config =>
        {
            var migrationRunnerBuilder = config.AddPostgres();

            migrationRunnerBuilder.WithGlobalConnectionString(connectionString)
                .ScanIn(infra).For.All();
        });
    }
}
