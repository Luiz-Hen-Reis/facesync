using FaceSync.Application.UseCases.DetectFace;
using FaceSync.Communication.Requests;
using Microsoft.AspNetCore.SignalR;

namespace FaceSync.Api.Hubs;

public class FaceHub : Hub
{
    private readonly IDetectFaceUseCase _detectFaceUseCase;

    public FaceHub(IDetectFaceUseCase detectFaceUseCase)
    {
        _detectFaceUseCase = detectFaceUseCase;
    }
        
    public async Task SendFrame(string frame)
    {
        var request = new RequestDetectFace
        {
            Frame = frame
        };

        var result = _detectFaceUseCase.Execute(request);

        await Clients.Caller.SendAsync("RecognitionResult", result);
    }
}
