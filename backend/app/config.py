from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    secret_key: str = "dev-secret-key-change-in-production-min-32-chars"
    app_env: str = "development"
    debug: bool = True

    # Database
    database_url: str = "sqlite:///./admin_portal.db"

    # Admin seed credentials
    admin_email: str = "admin@maruti.co.in"
    admin_password: str = "password"

    # LLM
    llm_provider: str = "openai"
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    llm_model: str = "gpt-4o-mini"

    # JWT
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 30

    # CORS
    cors_origins: str = "http://localhost:4000,http://localhost:4001,http://127.0.0.1:4001"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
