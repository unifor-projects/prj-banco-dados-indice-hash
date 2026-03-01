from typing import List
from domain.models.hash_index import HashIndex
from domain.models.page import Page


class AppState:
    def __init__(self):
        self.words: List[str] = []
        self.pages: List[Page] = []
        self.page_size: int | None = None
        self.hash_index: HashIndex | None = None


state = AppState()
