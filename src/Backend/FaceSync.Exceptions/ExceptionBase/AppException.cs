namespace FaceSync.Exceptions.ExceptionBase;

public abstract class AppException : SystemException
{
    protected AppException(string? message) : base(message) { }

    public abstract List<string> GetErrors();
}
