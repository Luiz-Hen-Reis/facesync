using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;
using OpenCvSharp;

namespace FaceSync.Infra.Services.FaceRecognition;

public class FaceRecognitionService : IFaceRecognitionService
{

    private readonly InferenceSession _session; 

    public FaceRecognitionService()
    {
        string baseDirectory = AppContext.BaseDirectory;

        var modelPath = Path.Combine(baseDirectory, "Models", "w600k_r50.onnx");

        _session = new InferenceSession(modelPath);
    }

    // Gerar embeddings a partir da imagem e do retângulo do rosto usando o modelo ONNX
    public float[] GenerateEmbeddings(byte[] imageBytes, Rect faceRect)
    {
        var image = Cv2.ImDecode(imageBytes, ImreadModes.Color);

        var face = new Mat(image, faceRect);

        Cv2.Resize(face, face, new Size(112, 112));

        Cv2.CvtColor(face, face, ColorConversionCodes.BGR2RGB);

        var input = new DenseTensor<float>(new[] { 1, 3, 112, 112 });

        for (int y = 0; y < 112; y++)
        {
            for (int x = 0; x < 112; x++)
            {
                var pixel = face.At<Vec3b>(y, x);

                // Normalização
                input[0, 0, y, x] = (pixel.Item0 - 127.5f) / 128f;
                input[0, 1, y, x] = (pixel.Item1 - 127.5f) / 128f;
                input[0, 2, y, x] = (pixel.Item2 - 127.5f) / 128f;
            }
        }

        var inputs = new List<NamedOnnxValue>
        {
            NamedOnnxValue.CreateFromTensor("data", input)
        };

        using var results = _session.Run(inputs);


        var embedding = results.First()
            .AsEnumerable<float>()
            .ToArray();

        return embedding;
    }
}
