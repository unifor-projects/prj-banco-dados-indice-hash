class Bucket:
    def __init__(self, bucket_id: int, capacity: int):
        self.bucket_id = bucket_id
        self.capacity = capacity  # FR
        self.entries: list[tuple[str, int]] = []  # (chave, numero_da_pagina)
        self.overflow: Bucket | None = None

    def is_full(self) -> bool:
        return len(self.entries) >= self.capacity

    def insert(self, key: str, page_id: int) -> tuple[bool, bool]:
        """
        Retorna:
        (houve_colisao, houve_overflow_novo)
        """

        # Caso ainda tenha espaço
        if not self.is_full():
            self.entries.append((key, page_id))
            return (False, False)

        # Bucket cheio → colisão
        # Se ainda não tem overflow, cria
        if self.overflow is None:
            self.overflow = Bucket(bucket_id=self.bucket_id, capacity=self.capacity)
            self.overflow.entries.append((key, page_id))
            return (True, True)  # colisão + novo overflow

        # Já existe overflow → delega inserção
        return (True, *self._insert_overflow(key, page_id))

    def _insert_overflow(self, key: str, page_id: int) -> tuple[bool]:
        current = self.overflow

        while True:
            if not current.is_full():
                current.entries.append((key, page_id))
                return (False,)  # não criou novo overflow

            if current.overflow is None:
                current.overflow = Bucket(
                    bucket_id=self.bucket_id, capacity=self.capacity
                )
                current.overflow.entries.append((key, page_id))
                return (True,)  # criou novo overflow

            current = current.overflow

    def search(self, key: str) -> tuple[int | None, int]:
        """
        Retorna:
        (page_id_encontrado ou None, buckets_visitados)
        """

        current = self
        buckets_visited = 0

        while current is not None:
            buckets_visited += 1

            for stored_key, page_id in current.entries:
                if stored_key == key:
                    return page_id, buckets_visited

            current = current.overflow

        return None, buckets_visited
