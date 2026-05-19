using FaceSync.Communication.Requests;
using FaceSync.Communication.Responses;

namespace FaceSync.Application.UseCases.DetectFace;

public interface IDetectFaceUseCase
{
    public ResponseDetectFace Execute(RequestDetectFace request);
}
