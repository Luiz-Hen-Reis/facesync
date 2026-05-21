using FaceSync.Application.UseCases.DetectFace;
using FaceSync.Application.UseCases.RegisterFace;
using FaceSync.Communication.Requests;
using Microsoft.AspNetCore.SignalR;

namespace FaceSync.Api.Hubs;

public class FaceHub : Hub
{
    private readonly IRegisterFaceUseCase _registerFaceUseCase;
    private readonly IDetectFaceUseCase _detectFaceUseCase;

    public FaceHub(IRegisterFaceUseCase registerFaceUseCase, IDetectFaceUseCase detectFaceUseCase)
    {
        _registerFaceUseCase = registerFaceUseCase;
        _detectFaceUseCase = detectFaceUseCase;
    }

    public async Task RegisterFace(RequestRegisterFace request)
    {
        await _registerFaceUseCase.Execute(request);
        await Clients.Caller.SendAsync("FaceRegistered", $"Rosto registrado de {request.Name} registrado com sucesso");
    }

    public async Task SendFrame(string frame)
    {
        Console.WriteLine($"Received frame of size: {frame.Length} characters");

        var request = new RequestDetectFace
        {
            Frame = frame
        };

        var result = _detectFaceUseCase.Execute(request);

        await Clients.Caller.SendAsync("RecognitionResult", result);
    }

}
