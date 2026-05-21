namespace FaceSync.Communication.Responses;

public class ResponseErrorMessages
{
    public List<string> ErrorMessages { get; set; } = [];

    public ResponseErrorMessages(string errorMessage)
    {
        ErrorMessages = [errorMessage];
    }

    public ResponseErrorMessages(List<string> errorMessages)
    {
        ErrorMessages = errorMessages;
    }
}
