using FaceSync.Application.Helpers;
using FaceSync.Communication.Requests;
using FaceSync.Domain.Entities;
using FaceSync.Domain.Repositories;
using FaceSync.Domain.Repositories.UserFace;
using FaceSync.Infra.Services.FaceDetection;
using FaceSync.Infra.Services.FaceRecognition;

namespace FaceSync.Application.UseCases.RegisterFace;

public class RegisterFaceUseCase : IRegisterFaceUseCase
{
    private readonly IFaceDetectionService _faceDetectionService;
    private readonly IFaceRecognitionService _faceRecognitionService;
    private readonly IUserFaceWriteOnlyRepository _userFaceRepository;
    private readonly IUnitOfWork _unitOfWork;


    public RegisterFaceUseCase(IFaceDetectionService faceDetectionService,
        IFaceRecognitionService faceRecognitionService,
        IUserFaceWriteOnlyRepository userFaceRepository,
        IUnitOfWork unitOfWork)
    {
        _faceDetectionService = faceDetectionService;
        _faceRecognitionService = faceRecognitionService;
        _userFaceRepository = userFaceRepository;
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


        var embeddings = _faceRecognitionService.GenerateEmbeddings(imageBytes, faces[0]);

        // checar se já existe um registro com o mesmo rosto

        var userFace = new UserFace
        {
            Name = request.Name,
            Embeddings = embeddings
        };


        await _userFaceRepository.Add(userFace);
        await _unitOfWork.Commit();
    }
}
