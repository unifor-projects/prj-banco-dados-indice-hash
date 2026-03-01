from domain.models.bucket import Bucket


# NB = número de buckets
# NR = número de registros
# FR = capacidade do bucket
class HashIndex:
    def __init__(self, nb: int, fr: int):
        self.HASH_BASE = 31
        self.nb = nb
        self.fr = fr
        self.buckets: list[Bucket] = []
        self._create_buckets()

        self.collision_count = 0
        self.overflowed_buckets = 0
        self.total_insertions = 0

    def _create_buckets(self):
        self.buckets = [Bucket(bucket_id=i, capacity=self.fr) for i in range(self.nb)]

    def reset(self):
        self.collision_count = 0
        self.total_insertions = 0
        self.overflowed_buckets = 0
        self._create_buckets()

    def hash_function(self, key: str) -> int:
        hash_value = 0
        for char in key:
            hash_value = (hash_value * self.HASH_BASE + ord(char)) % self.nb
        return hash_value

    def insert(self, key: str, page_id: int) -> bool:
        bucket_index = self.hash_function(key)
        bucket = self.buckets[bucket_index]

        had_collision, new_overflow = bucket.insert(key, page_id)

        if had_collision:
            self.collision_count += 1

        if new_overflow:
            self.overflowed_buckets += 1

        self.total_insertions += 1

    def collision_rate(self) -> float:
        if self.total_insertions == 0:
            return 0.0
        return (self.collision_count / self.total_insertions) * 100

    def overflow_rate(self) -> float:
        if self.nb == 0:
            return 0.0
        return (self.overflowed_buckets / self.nb) * 100

    def search(self, key: str) -> dict:
        bucket_index = self.hash_function(key)
        bucket = self.buckets[bucket_index]

        page_id, buckets_visited = bucket.search(key)

        if page_id is None:
            return {
                "found": False,
                "bucket_index": bucket_index,
                "buckets_visited": buckets_visited,
                "page_id": None,
                "cost_pages_read": buckets_visited,
            }

        return {
            "found": True,
            "bucket_index": bucket_index,
            "buckets_visited": buckets_visited,
            "page_id": page_id,
            "cost_pages_read": buckets_visited + 1,  # leitura da página de dados
        }
