using FaceSync.Application.UseCases.DetectFace;
using Microsoft.Extensions.DependencyInjection;

namespace FaceSync.Application;

public static class DependencyInjectionExtension
{
    public static void AddApplication(this IServiceCollection services)
    {
        AddUseCases(services);
    }

    private static void AddUseCases(IServiceCollection services)
    {
        services.AddScoped<IDetectFaceUseCase, DetectFaceUseCase>();
    }
}
