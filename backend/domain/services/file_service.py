from fastapi import UploadFile
from domain.state import state


class FileService:
    @staticmethod
    async def load_words(file: UploadFile) -> int:
        if not file.filename.endswith(".txt"):
            raise ValueError("Arquivo deve ser .txt")

        content = await file.read()

        if not content:
            raise ValueError("Arquivo vazio")

        try:
            lines = content.decode("utf-8").splitlines()
        except Exception:
            raise ValueError("Arquivo ilegível")

        words = [line.strip() for line in lines if line.strip()]

        if not words:
            raise ValueError("Arquivo não contém palavras válidas")

        state.words = words

        return len(words)
