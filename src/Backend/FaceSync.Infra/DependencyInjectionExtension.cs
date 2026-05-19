using FaceSync.Infra.Services.FaceDetection;
using Microsoft.Extensions.DependencyInjection;

namespace FaceSync.Infra;

public static class DependencyInjectionExtension
{
    public static void AddInfra(this IServiceCollection services)
    {
        AddServices(services);
    }

    private static void AddServices(IServiceCollection services)
    {
        services.AddSingleton<IFaceDetectionService, FaceDetectionService>();
    }
}
