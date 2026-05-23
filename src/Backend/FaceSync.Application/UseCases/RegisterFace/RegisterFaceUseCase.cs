using FaceSync.Application.Constants;
using FaceSync.Application.Helpers;
using FaceSync.Communication.Requests;
using FaceSync.Domain.Entities;
using FaceSync.Domain.Repositories;
using FaceSync.Domain.Repositories.UserFace;
using FaceSync.Exceptions.ExceptionBase;
using FaceSync.Infra.Services.FaceDetection;
using FaceSync.Infra.Services.FaceRecognition;

namespace FaceSync.Application.UseCases.RegisterFace;

public class RegisterFaceUseCase : IRegisterFaceUseCase
{
    private readonly IFaceDetectionService _faceDetectionService;
    private readonly IFaceRecognitionService _faceRecognitionService;
    private readonly IUserFaceWriteOnlyRepository _userFaceWriteOnlyRepository;
    private readonly IUserFaceReadOnlyRepository _userFaceReadOnlyRepository;
    private readonly IUnitOfWork _unitOfWork;


    public RegisterFaceUseCase(IFaceDetectionService faceDetectionService,
        IFaceRecognitionService faceRecognitionService,
        IUserFaceWriteOnlyRepository userFaceWriteOnlyRepository,
        IUserFaceReadOnlyRepository userFaceReadOnlyRepository,
        IUnitOfWork unitOfWork)
    {
        _faceDetectionService = faceDetectionService;
        _faceRecognitionService = faceRecognitionService;
        _userFaceWriteOnlyRepository = userFaceWriteOnlyRepository;
        _userFaceReadOnlyRepository = userFaceReadOnlyRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task Execute(RequestRegisterFace request)
    {
        var imageBytes = ImageHelper.ConvertBase64ToBytes(request.Frame);

        var faces = _faceDetectionService.DetectFaces(imageBytes);

        if (faces.Length == 0)
        {
            throw new FaceNotDetectedException();
        }


        if (faces.Length > 1) 
        {
            throw new MultipleFacesException();
        }


        var newEmbedding = _faceRecognitionService.GenerateEmbeddings(imageBytes, faces[0]);

        var duplicate = _userFaceReadOnlyRepository.FindSimilar(newEmbedding, FaceRecognitionConstants.SimilarityThreshold);

        if (duplicate is not null)
            throw new DuplicateFacesException();

        await _userFaceWriteOnlyRepository.Add(new UserFace
        {
            Name = request.Name,
            Embeddings = newEmbedding
        });


        await _unitOfWork.Commit();
    }
}
