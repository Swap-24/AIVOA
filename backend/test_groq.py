import asyncio

from dotenv import load_dotenv

load_dotenv()

from app.services.groq_client import GroqError, groq_client  


async def test_model(model: str) -> None:
    print(f"\n--- Testing {model} ---")
    try:
        result = await groq_client.chat_json(
            system_prompt='Respond ONLY with JSON: {"answer": "..."}',
            user_prompt="What is the capital of France? Answer in one word.",
            model=model,
        )
        print("OK ->", result)
    except GroqError as e:
        print("FAILED ->", e)


async def main() -> None:
    await test_model(groq_client.primary_model)   
    await test_model(groq_client.context_model)    


if __name__ == "__main__":
    asyncio.run(main())