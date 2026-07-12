/**
 * Pausa a execução da thread atual cedendo o controle de volta ao navegador.
 * Isso permite que a interface do usuário (UI) seja atualizada (ex: animações, barras de progresso)
 * antes que o código pesado continue rodando.
 * 
 * Útil para evitar o congelamento da aba em loops muito grandes.
 */
export const yieldToMain = (): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, 0));
};
