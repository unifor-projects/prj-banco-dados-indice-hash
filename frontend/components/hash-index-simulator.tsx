"use client";

import * as React from "react";
import {
  buildIndex,
  compare,
  createBuckets,
  createPages,
  hashKey,
  searchKey,
  setPageSize,
  tableScan,
  uploadTxt,
  type BuildIndexResponse,
  type CompareResponse,
  type CreateBucketsResponse,
  type CreatePagesResponse,
  type PageConfigResponse,
  type SearchResponse,
  type TableScanResponse,
  type UploadResponse,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Step = "upload" | "pages" | "buckets" | "build" | "ready";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function HashIndexSimulator() {
  const [step, setStep] = React.useState<Step>("upload");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [file, setFile] = React.useState<File | null>(null);
  const [pageSize, setPageSizeState] = React.useState<number>(128);
  const [key, setKey] = React.useState<string>("");

  const [uploadResult, setUploadResult] = React.useState<UploadResponse | null>(
    null,
  );
  const [pageConfigResult, setPageConfigResult] =
    React.useState<PageConfigResponse | null>(null);
  const [createPagesResult, setCreatePagesResult] =
    React.useState<CreatePagesResponse | null>(null);
  const [createBucketsResult, setCreateBucketsResult] =
    React.useState<CreateBucketsResponse | null>(null);
  const [buildResult, setBuildResult] =
    React.useState<BuildIndexResponse | null>(null);

  const [hashResult, setHashResult] = React.useState<{
    key: string;
    bucket: number;
  } | null>(null);
  const [searchResult, setSearchResult] = React.useState<SearchResponse | null>(
    null,
  );
  const [scanResult, setScanResult] = React.useState<TableScanResponse | null>(
    null,
  );
  const [compareResult, setCompareResult] =
    React.useState<CompareResponse | null>(null);

  async function run<T>(fn: () => Promise<T>, onOk: (val: T) => void) {
    setBusy(true);
    setError(null);
    try {
      const val = await fn();
      onOk(val);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const canSearch = step === "ready" && key.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">
          Simulador de Índice Hash Estático
        </h1>
        <p className="text-sm text-muted-foreground">
          Fluxo: upload → configurar página → criar páginas → criar buckets →
          construir índice → consultar.
        </p>
      </div>

      {error ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            1) Upload do arquivo (.txt)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="file">Arquivo</Label>
            <Input
              id="file"
              type="file"
              accept=".txt,text/plain"
              disabled={busy}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              disabled={busy || !file}
              onClick={() =>
                run(
                  () => uploadTxt(file!),
                  (res) => {
                    setUploadResult(res);
                    setStep("pages");
                  },
                )
              }
            >
              Enviar
            </Button>
            {uploadResult ? (
              <span className="text-sm text-muted-foreground">
                {uploadResult.total_palavras} palavras carregadas.
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            2) Configurar página e criar páginas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="pageSize">Tamanho da página (FR de dados)</Label>
            <Input
              id="pageSize"
              type="number"
              min={1}
              value={pageSize}
              disabled={busy || step === "upload"}
              onChange={(e) => setPageSizeState(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              disabled={busy || step === "upload"}
              onClick={() =>
                run(
                  () => setPageSize(pageSize),
                  (res) => {
                    setPageConfigResult(res);
                    setStep("pages");
                  },
                )
              }
            >
              Configurar tamanho
            </Button>
            <Button
              disabled={busy || !pageConfigResult}
              onClick={() =>
                run(createPages, (res) => {
                  setCreatePagesResult(res);
                  setStep("buckets");
                })
              }
            >
              Criar páginas
            </Button>
          </div>

          {pageConfigResult ? (
            <div className="grid gap-2 rounded-md border p-3">
              <Stat label="Page size" value={pageConfigResult.page_size} />
              <Stat
                label="Total registros"
                value={pageConfigResult.total_records}
              />
              <Stat
                label="Total páginas"
                value={pageConfigResult.total_pages}
              />
            </div>
          ) : null}

          {createPagesResult ? (
            <div className="grid gap-2 rounded-md border p-3">
              <Stat
                label="Páginas criadas"
                value={createPagesResult.total_pages}
              />
              <Stat
                label="Primeira página (preview)"
                value={`#${createPagesResult.first_page.page_id} → ${createPagesResult.first_page.preview_records.join(", ")}`}
              />
              <Stat
                label="Última página (preview)"
                value={`#${createPagesResult.last_page.page_id} → ${createPagesResult.last_page.preview_records.join(", ")}`}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            3) Criar buckets e construir índice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              disabled={busy || step === "upload" || step === "pages"}
              onClick={() =>
                run(createBuckets, (res) => {
                  setCreateBucketsResult(res);
                  setStep("build");
                })
              }
            >
              Criar buckets (NB)
            </Button>
            <Button
              disabled={busy || !createBucketsResult}
              onClick={() =>
                run(buildIndex, (res) => {
                  setBuildResult(res);
                  setStep("ready");
                })
              }
            >
              Construir índice
            </Button>
          </div>

          {createBucketsResult ? (
            <div className="grid gap-2 rounded-md border p-3">
              <Stat
                label="NR (total registros)"
                value={createBucketsResult.total_records}
              />
              <Stat
                label="FR (capacidade bucket)"
                value={createBucketsResult.bucket_capacity_FR}
              />
              <Stat
                label="NB (buckets)"
                value={createBucketsResult.number_of_buckets_NB}
              />
            </div>
          ) : null}

          {buildResult ? (
            <div className="grid gap-2 rounded-md border p-3">
              <Stat
                label="Registros indexados"
                value={buildResult.total_registros_indexados}
              />
              <Stat label="Colisões" value={buildResult.colisoes} />
              <Stat
                label="Taxa colisões (%)"
                value={buildResult.taxa_colisoes_percentual}
              />
              <Stat
                label="Buckets com overflow"
                value={buildResult.buckets_com_overflow}
              />
              <Stat
                label="Taxa overflow (%)"
                value={buildResult.taxa_overflow_percentual}
              />
              <Stat
                label="Tempo construção (s)"
                value={buildResult.tempo_construcao_segundos}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">4) Consultas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="key">Chave (palavra)</Label>
            <Input
              id="key"
              placeholder="ex: database"
              value={key}
              disabled={busy || step !== "ready"}
              onChange={(e) => setKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Dica: use uma palavra que exista no seu arquivo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              disabled={busy || !canSearch}
              onClick={() => run(() => hashKey(key.trim()), setHashResult)}
            >
              Hash
            </Button>
            <Button
              disabled={busy || !canSearch}
              onClick={() => run(() => searchKey(key.trim()), setSearchResult)}
            >
              Buscar (Hash)
            </Button>
            <Button
              variant="secondary"
              disabled={busy || !canSearch}
              onClick={() => run(() => tableScan(key.trim()), setScanResult)}
            >
              Table scan
            </Button>
            <Button
              variant="outline"
              disabled={busy || !canSearch}
              onClick={() => run(() => compare(key.trim()), setCompareResult)}
            >
              Comparar
            </Button>
          </div>

          {hashResult || searchResult || scanResult || compareResult ? (
            <>
              <Separator />
              <div className="grid gap-3">
                {hashResult ? (
                  <div className="rounded-md border p-3">
                    <h3 className="mb-2 text-sm font-medium">Hash</h3>
                    <Stat label="Key" value={hashResult.key} />
                    <Stat label="Bucket" value={hashResult.bucket} />
                  </div>
                ) : null}

                {searchResult ? (
                  <div className="rounded-md border p-3">
                    <h3 className="mb-2 text-sm font-medium">
                      Busca por índice
                    </h3>
                    <Stat label="Found" value={String(searchResult.found)} />
                    <Stat label="Bucket" value={searchResult.bucket_index} />
                    <Stat
                      label="Buckets visitados"
                      value={searchResult.buckets_visited}
                    />
                    <Stat label="Page id" value={searchResult.page_id ?? "-"} />
                    <Stat
                      label="Custo (pages read)"
                      value={searchResult.cost_pages_read}
                    />
                    <Stat
                      label="Tempo (s)"
                      value={searchResult.tempo_busca_segundos}
                    />
                  </div>
                ) : null}

                {scanResult ? (
                  <div className="rounded-md border p-3">
                    <h3 className="mb-2 text-sm font-medium">Table scan</h3>
                    <Stat label="Found" value={String(scanResult.found)} />
                    <Stat label="Page id" value={scanResult.page_id ?? "-"} />
                    <Stat label="Pages lidas" value={scanResult.pages_read} />
                    <Stat
                      label="Tempo (s)"
                      value={scanResult.tempo_scan_segundos}
                    />
                  </div>
                ) : null}

                {compareResult ? (
                  <div className="rounded-md border p-3">
                    <h3 className="mb-2 text-sm font-medium">Comparativo</h3>
                    <Stat
                      label="Índice: custo"
                      value={compareResult.index_search.cost_pages_read}
                    />
                    <Stat
                      label="Scan: custo"
                      value={compareResult.table_scan.pages_read}
                    />
                    <Stat
                      label="Diferença tempo (s)"
                      value={compareResult.comparacao.diferenca_tempo_segundos}
                    />
                    <Stat
                      label="Ganho custo (%)"
                      value={compareResult.comparacao.ganho_percentual_custo}
                    />
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Config</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Stat
            label="API Base URL"
            value={
              process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
            }
          />
          <p className="text-xs text-muted-foreground">
            Configure via <code>NEXT_PUBLIC_API_BASE_URL</code> (ex:
            http://localhost:8000) se o backend estiver em outra porta.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
