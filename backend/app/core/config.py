from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env.example", extra="ignore")

    database_url: str = "postgresql+asyncpg://xrd_user:xrd_pass@localhost:5432/xrd_db"
    gcp_project: str = "local"
    gcp_region: str = "us-central1"
    cors_origins: str = "http://localhost:5173"
    secret_key: str = "dev-secret-key"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
