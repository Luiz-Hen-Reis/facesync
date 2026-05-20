

namespace FaceSync.Domain.Repositories;

public interface IUnitOfWork
{
    Task Commit();
}
