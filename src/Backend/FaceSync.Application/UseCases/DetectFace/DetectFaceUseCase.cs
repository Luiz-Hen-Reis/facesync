using FaceSync.Application.Helpers;
using FaceSync.Communication.Requests;
using FaceSync.Communication.Responses;
using FaceSync.Infra.Services.FaceDetection;

namespace FaceSync.Application.UseCases.DetectFace;

public class DetectFaceUseCase : IDetectFaceUseCase
{
    private readonly IFaceDetectionService _faceDetectionService;

    public DetectFaceUseCase(IFaceDetectionService faceDetectionService)
    {
        _faceDetectionService = faceDetectionService;
    }

    public ResponseDetectFace Execute(
    RequestDetectFace request)
    {
        var imageBytes = ImageHelper.ConvertBase64ToBytes(request.Frame);

        var faces = _faceDetectionService.DetectFaces(imageBytes);

        if (faces.Length == 0)
        {
            return null;
        }

        var face = faces[0];



        return new ResponseDetectFace
        {
            Recognized = true,
            Name = "Luiz Henrique",
            Similarity = 0.95,
            Box = new BoundingBox
            {
                X = face.X,
                Y = face.Y,
                Width = face.Width,
                Height = face.Height
            }
        };

    }
}
