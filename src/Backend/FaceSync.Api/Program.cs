using FaceSync.Api.Filters;
using FaceSync.Api.Hubs;
using FaceSync.Application;
using FaceSync.Infra;
using FaceSync.Infra.Extensions;
using FaceSync.Infra.Migrations;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddOpenApi();

builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
}).AddHubOptions<FaceHub>(options =>
{
    options.MaximumReceiveMessageSize = 1024 * 1024; // 1MB
    options.AddFilter<HubExceptionFilter>();
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});


builder.Services.AddApplication();
builder.Services.AddInfra(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("frontend");

app.UseAuthorization();

app.MapControllers();

app.MapHub<FaceHub>("/hubs/facesync");

await MigrateDatabase();

app.Run();

async Task MigrateDatabase()
{
    await using var scope = app.Services.CreateAsyncScope();
    var stringConnection = app.Configuration.ConnectionString();

    DatabaseMigration.Migrate(stringConnection, scope.ServiceProvider);
}