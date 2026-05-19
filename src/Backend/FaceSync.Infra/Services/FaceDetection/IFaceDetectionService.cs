using OpenCvSharp;

namespace FaceSync.Infra.Services.FaceDetection;

public interface IFaceDetectionService
{
    Rect[] DetectFaces(byte[] imageBytes);
}
