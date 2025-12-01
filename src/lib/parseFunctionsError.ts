export async function parseFunctionsError(err: unknown): Promise<{ 
  status?: number; 
  message: string;
  details?: any;
}> {
  const anyErr = err as any;
  const ctx = anyErr?.context;
  let status: number | undefined = anyErr?.status;
  let message = anyErr?.message || "Erro ao comunicar com a Edge Function";
  let details: any = undefined;

  // Se o contexto for um Response, extrair status e corpo
  if (ctx && typeof ctx === "object" && typeof (ctx as Response).clone === "function") {
    const resp = (ctx as Response).clone();
    status = status ?? resp.status;
    
    try {
      const json = await resp.clone().json().catch(() => undefined);
      if (json) {
        message = json?.error?.message || json?.message || JSON.stringify(json);
        details = json;
      } else {
        const text = await resp.text();
        if (text) message = text;
      }
    } catch (e) {
      console.error("Erro ao parsear resposta:", e);
    }
  }

  return { status, message, details };
}
