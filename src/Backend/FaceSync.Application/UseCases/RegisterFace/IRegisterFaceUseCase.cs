using FaceSync.Communication.Requests;

namespace FaceSync.Application.UseCases.RegisterFace;

public interface IRegisterFaceUseCase
{
    Task Execute(RequestRegisterFace request);
}
