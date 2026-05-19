using OpenCvSharp;

namespace FaceSync.Infra.Services.FaceDetection;

public class FaceDetectionService : IFaceDetectionService
{
    private readonly CascadeClassifier _cascade;

    public FaceDetectionService()
    {
        string baseDirectory = AppContext.BaseDirectory;
        string cascadePath = Path.Combine(baseDirectory, "CascadeClassifiers", "haarcascade_frontalface_default.xml");


        if (!File.Exists(cascadePath))
        {
            throw new FileNotFoundException($"O arquivo de classificação não foi encontrado no caminho esperado: {cascadePath}");
        }

        _cascade = new CascadeClassifier(cascadePath);
    }

    public Rect[] DetectFaces(byte[] imageBytes)
    {
        var mat = Cv2.ImDecode(imageBytes, ImreadModes.Color);

        var gray = new Mat();

        Cv2.CvtColor(mat, gray, ColorConversionCodes.BGR2GRAY);

        var faces = _cascade.DetectMultiScale(
            gray,
            scaleFactor: 1.1,
            minNeighbors: 5,
            minSize: new Size(100, 100)
         );

        return faces;
    }
}
