import time
from domain.state import state
from domain.models.hash_index import HashIndex
import math


class HashService:
    FR = 4  # definido pela equipe

    @staticmethod
    def create_buckets():
        if not state.pages:
            raise ValueError("Páginas ainda não foram criadas")

        nr = len(state.words)
        fr = HashService.FR

        # RN08 → NB > NR / FR
        nb_min = nr / fr
        nb = math.floor(nb_min) + 1

        if nb <= nb_min:
            raise ValueError("NB não atende regra NB > NR/FR")

        state.hash_index = HashIndex(nb=nb, fr=fr)

        return {
            "total_records": nr,
            "bucket_capacity_FR": fr,
            "number_of_buckets_NB": nb,
        }

    @staticmethod
    def hash_function(key: str) -> int:
        if not state.hash_index:
            raise ValueError("Índice hash ainda não foi criado")

        hash_value = state.hash_index.hash_function(key)

        return hash_value

    @staticmethod
    def build_index():
        if not state.hash_index:
            raise ValueError("Buckets ainda não foram criados")

        if not state.pages:
            raise ValueError("Páginas ainda não foram criadas")

        # 🔹 RESET antes de reconstruir
        state.hash_index.reset()
        start_time = time.perf_counter()

        for page in state.pages:  # RN12 → percorrer páginas
            for word in page.records:  # percorrer registros
                state.hash_index.insert(word, page.page_id)

        end_time = time.perf_counter()
        elapsed_time = end_time - start_time

        return {
            "total_registros_indexados": state.hash_index.total_insertions,
            "colisoes": state.hash_index.collision_count,
            "taxa_colisoes_percentual": round(state.hash_index.collision_rate(), 4),
            "buckets_com_overflow": state.hash_index.overflowed_buckets,
            "taxa_overflow_percentual": round(state.hash_index.overflow_rate(), 4),
            "tempo_construcao_segundos": round(elapsed_time, 6),
        }

    @staticmethod
    def search_key(key: str):
        if not state.hash_index:
            raise ValueError("Índice ainda não foi construído")

        if not state.pages:
            raise ValueError("Páginas não foram criadas")

        start_time = time.perf_counter()

        result = state.hash_index.search(key)

        end_time = time.perf_counter()
        elapsed_time = end_time - start_time

        result["tempo_busca_segundos"] = round(elapsed_time, 8)

        return result

    @staticmethod
    def table_scan(key: str):
        if not state.pages:
            raise ValueError("Páginas ainda não foram criadas")

        start_time = time.perf_counter()

        pages_read = 0
        registros_lidos = []

        for page in state.pages:
            pages_read += 1

            for word in page.records:
                registros_lidos.append(word)

                if word == key:
                    end_time = time.perf_counter()
                    elapsed_time = end_time - start_time

                    return {
                        "found": True,
                        "page_id": page.page_id,
                        "pages_read": pages_read,
                        # "registros_lidos": registros_lidos,
                        "tempo_scan_segundos": round(elapsed_time, 8),
                    }

        end_time = time.perf_counter()
        elapsed_time = end_time - start_time

        return {
            "found": False,
            "page_id": None,
            "pages_read": pages_read,
            "registros_lidos": registros_lidos,
            "tempo_scan_segundos": round(elapsed_time, 8),
        }

    @staticmethod
    def compare_search(key: str):
        if not state.hash_index:
            raise ValueError("Índice ainda não foi construído")

        # 🔹 Busca por índice
        index_result = HashService.search_key(key)

        # 🔹 Table scan
        scan_result = HashService.table_scan(key)

        # 🔹 Diferença de tempo
        tempo_index = index_result["tempo_busca_segundos"]
        tempo_scan = scan_result["tempo_scan_segundos"]

        diferenca_tempo = tempo_scan - tempo_index

        # 🔹 Diferença percentual de custo
        custo_index = index_result["cost_pages_read"]
        custo_scan = scan_result["pages_read"]

        if custo_scan == 0:
            percentual_ganho = 0
        else:
            percentual_ganho = ((custo_scan - custo_index) / custo_scan) * 100

        return {
            "index_search": index_result,
            "table_scan": scan_result,
            "comparacao": {
                "diferenca_tempo_segundos": round(diferenca_tempo, 8),
                "ganho_percentual_custo": round(percentual_ganho, 4),
            },
        }
