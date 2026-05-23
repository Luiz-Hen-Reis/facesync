using FaceSync.Application.Constants;
using FaceSync.Application.Helpers;
using FaceSync.Communication.Requests;
using FaceSync.Communication.Responses;
using FaceSync.Domain.Repositories.UserFace;
using FaceSync.Infra.Services.FaceDetection;
using FaceSync.Infra.Services.FaceRecognition;

namespace FaceSync.Application.UseCases.DetectFace;

public class DetectFaceUseCase : IDetectFaceUseCase
{
    private readonly IFaceDetectionService _faceDetectionService;
    private readonly IFaceRecognitionService _faceRecognitionService;
    private readonly IUserFaceReadOnlyRepository _userFaceReadOnlyRepository;

    public DetectFaceUseCase(IFaceDetectionService faceDetectionService, IFaceRecognitionService faceRecognitionService,
        IUserFaceReadOnlyRepository userFaceReadOnlyRepository)
    {
        _faceDetectionService = faceDetectionService;
        _faceRecognitionService = faceRecognitionService;
        _userFaceReadOnlyRepository = userFaceReadOnlyRepository;
    }

    public async Task<ResponseDetectFace> Execute(
    RequestDetectFace request)
    {
        var imageBytes = ImageHelper.ConvertBase64ToBytes(request.Frame);

        var faces = _faceDetectionService.DetectFaces(imageBytes);

        if (faces.Length == 0)
        {
            return null;
        }

        var face = faces[0];

        var newEmbedding = _faceRecognitionService.GenerateEmbeddings(imageBytes, face);

        var match = await _userFaceReadOnlyRepository.FindSimilar(newEmbedding, FaceRecognitionConstants.SimilarityThreshold);

        if (match is null)
        {
            return new ResponseDetectFace
            {
                Recognized = false,
                Name = null,
                Similarity = 0,
                Box = new BoundingBox { X = face.X, Y = face.Y, Width = face.Width, Height = face.Height }
            };
        }

        return new ResponseDetectFace
        {
            Recognized = true,
            Name = match.Value.UserFace.Name,
            Similarity = match.Value.Similarity,
            Box = new BoundingBox { X = face.X, Y = face.Y, Width = face.Width, Height = face.Height }
        };

    }
}
