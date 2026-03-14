from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./gold_trading.db"
    GOLD_API_KEY: str = ""
    GOLD_API_BASE_URL: str = "https://www.goldapi.io/api"
    PRICE_CACHE_TTL_SECONDS: int = 300
    USE_MOCK_PRICES: bool = True

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
