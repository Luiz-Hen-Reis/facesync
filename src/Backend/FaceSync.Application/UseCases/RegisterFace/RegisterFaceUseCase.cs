using FaceSync.Application.Helpers;
using FaceSync.Communication.Requests;
using FaceSync.Domain.Entities;
using FaceSync.Domain.Repositories;
using FaceSync.Domain.Repositories.UserFace;
using FaceSync.Infra.DataAccess.Repositories.UserFace;
using FaceSync.Infra.Services.FaceDetection;
using FaceSync.Infra.Services.FaceRecognition;

namespace FaceSync.Application.UseCases.RegisterFace;

public class RegisterFaceUseCase : IRegisterFaceUseCase
{
    private const float SimilarityThreshold = 0.6f;

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
            throw new Exception("Nenhum rosto detectado");
        }


        if (faces.Length > 1) 
        {
            throw new Exception("Mais de um rosto detectado. Envie apenas uma pessoa.");
        }


        var newEmbedding = _faceRecognitionService.GenerateEmbeddings(imageBytes, faces[0]);

        var existing = await _userFaceReadOnlyRepository.ListAll();

        var duplicate = existing.FirstOrDefault(u => 
            EmbeddingHelper.CosineSimilarity(u.Embeddings, newEmbedding) > SimilarityThreshold);

        if (duplicate is not null)
            throw new Exception($"Rosto já cadastrado como '{duplicate.Name}'");

        await _userFaceWriteOnlyRepository.Add(new UserFace
        {
            Name = request.Name,
            Embeddings = newEmbedding
        });


        await _unitOfWork.Commit();
    }
}
