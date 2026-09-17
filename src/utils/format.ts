// Currency formatting (BRL - R$ 1.234,56)
export function formatarMoeda(val: number | undefined | null): string {
  return (val || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Accent normalization for fuzzy/clean search
export function normalizarTexto(texto: string | undefined | null): string {
  if (!texto) return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Get month title with accounting reference month (ex: "Setembro de 2026 (Referente a Agosto)")
export function getMesFormatado(data: Date): string {
  return data.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}

export function getMesRefTexto(data: Date): string {
  const dataRef = new Date(data);
  dataRef.setMonth(dataRef.getMonth() - 1);
  const mesNome = dataRef.toLocaleDateString('pt-BR', { month: 'long' });
  return `(Referente a ${mesNome})`;
}

// Format current Brazilian date (DD/MM/AAAA)
export function getDataHojePtBr(): string {
  return new Date().toLocaleDateString('pt-BR');
}
