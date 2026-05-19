using Microsoft.AspNetCore.SignalR;

namespace FaceSync.Api.Hubs;

public class FaceHub : Hub
{
    public async Task SendFrame(string frame)
    {
        Console.WriteLine("FRAME RECEBIDO COM SUCESSO!" + " " + frame);

        var result = new
        {
            recognized = true,
            name = "Luiz Henrique",
            similarity = 0.96,

            boundingBox = new
            {
                x = 120,
                y = 80,
                width = 180,
                height = 220
            }
        };

        await Clients.Caller.SendAsync("RecognitionResult", result);
    }
}
