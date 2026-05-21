using OpenCvSharp;

namespace FaceSync.Infra.Services.FaceRecognition;

public interface IFaceRecognitionService
{
    public float[] GenerateEmbeddings(byte[] imageBytes, Rect faceRect);
}
