using FaceSync.Exceptions.ExceptionBase;
using Microsoft.AspNetCore.SignalR;

namespace FaceSync.Api.Filters;

public class HubExceptionFilter : IHubFilter
{
    public async ValueTask<object?> InvokeMethodAsync(
        HubInvocationContext invocationContext,
        Func<HubInvocationContext, ValueTask<object?>> next)
    {
        try
        {
            return await next(invocationContext);
        }
        catch (AppException ex)
        {
            await invocationContext.Hub.Clients.Caller.SendAsync(
                "Error",
                ex.GetErrors()
            );

            return null;
        }
        catch (Exception)
        {
            await invocationContext.Hub.Clients.Caller.SendAsync(
                "Error",
                new List<string>
                {
                    ResourceErrorMessages.UNKNOWN_ERROR
                }
            );

            return null;
        }
    }
}