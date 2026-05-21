
using FluentMigrator.Runner;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace FaceSync.Infra.Migrations;

public static class DatabaseMigration
{
    public static void Migrate(string connectionString, IServiceProvider serviceProvider)
    {
        EnsureDatabaseExists(connectionString);
        MigrateDatabase(serviceProvider);
    }

    private static void EnsureDatabaseExists(string connectionString)
    {
        var connectionStringBuilder = new NpgsqlConnectionStringBuilder(connectionString);

        var databaseName = connectionStringBuilder.Database;

        // conecta no banco padrão do postgres
        connectionStringBuilder.Database = "postgres";

        using var connection = new NpgsqlConnection(connectionStringBuilder.ConnectionString);

        connection.Open();

        // verifica se o banco já existe
        var checkDatabaseCommand = new NpgsqlCommand(
            $"SELECT 1 FROM pg_database WHERE datname = '{databaseName}'",
            connection
        );

        var databaseExists = checkDatabaseCommand.ExecuteScalar();

        if (databaseExists is null)
        {
            var createDatabaseCommand = new NpgsqlCommand(
                $"CREATE DATABASE \"{databaseName}\"",
                connection
            );

            createDatabaseCommand.ExecuteNonQuery();
        }
    }

    private static void MigrateDatabase(IServiceProvider serviceProvider)
    {
        var runner = serviceProvider.GetRequiredService<IMigrationRunner>();

        runner.ListMigrations();

        runner.MigrateUp();
    }
}
