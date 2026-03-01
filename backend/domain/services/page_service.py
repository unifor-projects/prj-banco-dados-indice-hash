from domain.models.page import Page
from domain.state import state


class PageService:
    @staticmethod
    def set_page_size(page_size: int):
        if not state.words:
            raise ValueError("Nenhum arquivo foi carregado ainda")

        if page_size <= 0:
            raise ValueError("Tamanho da página deve ser maior que zero")

        state.page_size = page_size

        total_records = len(state.words)
        total_pages = (total_records + page_size - 1) // page_size

        return {
            "page_size": page_size,
            "total_records": total_records,
            "total_pages": total_pages,
        }

    @staticmethod
    def create_pages():
        if not state.words:
            raise ValueError("Nenhum arquivo carregado")

        if not state.page_size:
            raise ValueError("Tamanho da página não configurado")

        state.pages = []

        page_size = state.page_size
        words = state.words

        total_pages = (len(words) + page_size - 1) // page_size

        for i in range(total_pages):
            start = i * page_size
            end = start + page_size
            page_records = words[start:end]
            page = Page(page_id=i, records=page_records)
            state.pages.append(page)

        if not state.pages:
            raise ValueError("Erro ao criar páginas")

        first_page = state.pages[0]
        last_page = state.pages[-1]

        return {
            "total_pages": len(state.pages),
            "first_page": {
                "page_id": first_page.page_id,
                "preview_records": first_page.records[:5],
            },
            "last_page": {
                "page_id": last_page.page_id,
                "preview_records": last_page.records[:5],
            },
        }
