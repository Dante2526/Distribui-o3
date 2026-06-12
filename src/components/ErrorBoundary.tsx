import React from 'react';

// --- Error Boundary "Espião" para capturar erros e tela preta no mobile ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// ErrorBoundary usa coerção de tipo para compatibilidade com tsconfig (useDefineForClassFields: false)
const ErrorBoundaryBase = React.Component as any;

class ErrorBoundary extends ErrorBoundaryBase {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null } as ErrorBoundaryState;
    this.handleCopyError = this.handleCopyError.bind(this);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Erro capturado pelo Espião:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleCopyError() {
    const { error, errorInfo } = this.state as ErrorBoundaryState;
    const errorText = `Distribui-o2 - Erro Mobile (Espião)
Erro: ${error?.toString()}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
Device Info: ${navigator.userAgent}
Time: ${new Date().toISOString()}
    `;
    
    navigator.clipboard.writeText(errorText)
      .then(() => alert("Detalhes do erro copiados com sucesso! Cole na conversa com o desenvolvedor."))
      .catch(() => alert("Não foi possível copiar automaticamente. Selecione e copie o texto abaixo."));
  }

  render() {
    const state = this.state as ErrorBoundaryState;
    if (state.hasError) {
      return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#0d0e12] overflow-y-auto font-sans">
          <div className="w-full max-w-lg bg-[#1e2029]/95 border border-[#FF3B30]/30 backdrop-blur-xl rounded-[24px] p-6 shadow-2xl flex flex-col gap-6 text-white my-8">
            
            {/* Cabeçalho */}
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 rounded-[14px] flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-wider text-[#FF3B30] leading-none">ESPIÃO DE CRASH</h2>
                <p className="text-[11px] text-[#a0aec0] mt-1 font-semibold uppercase tracking-wider">A tela ficou preta por um erro interno no mobile</p>
              </div>
            </div>

            {/* Alerta explicativo */}
            <div className="p-4 bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 rounded-[16px] text-left">
              <p className="text-[12px] text-[#FF9F0A] font-bold leading-normal flex items-start gap-2">
                <span>⚠️</span>
                <span>Copie os detalhes do erro usando o botão abaixo e envie no chat para que possamos corrigir esse crash específico!</span>
              </p>
            </div>

            {/* Mensagem principal do Erro */}
            <div className="bg-[#111217] border border-white/5 rounded-[14px] p-4 text-left">
              <span className="text-[10px] font-black text-[#FF3B30] uppercase tracking-wider block mb-1.5">Mensagem do Erro</span>
              <p className="text-[13px] font-mono text-white break-words select-all font-bold">
                {state.error?.toString()}
              </p>
            </div>

            {/* Detalhes Técnicos / Stack */}
            <div className="bg-[#111217] border border-white/5 rounded-[14px] p-4 text-left flex flex-col gap-2">
              <span className="text-[10px] font-black text-[#a0aec0] uppercase tracking-wider block">Rastreamento Técnico (Stack)</span>
              <div className="max-h-[140px] overflow-y-auto text-[11px] font-mono text-[#a0aec0]/80 bg-[#0d0e12] rounded-[8px] p-3 border border-white/5 break-all whitespace-pre-wrap select-all">
                {state.error?.stack || state.errorInfo?.componentStack || "Nenhum detalhe técnico adicional capturado."}
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-3 w-full mt-2">
              <button
                onClick={this.handleCopyError}
                className="w-full py-3.5 bg-gradient-to-r from-[#BF5AF2] to-[#5E5CE6] hover:opacity-90 active:scale-[0.98] transition-all text-white font-black rounded-xl shadow-lg shadow-purple-500/10 text-center text-sm uppercase tracking-wider"
              >
                COPIAR DETALHES DO ERRO 📋
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all text-[#a0aec0] font-black rounded-xl text-center text-sm uppercase tracking-wider"
              >
                RECARREGAR APLICAÇÃO 🔄
              </button>
            </div>

          </div>
        </div>
      );
    }

    return (this.props as ErrorBoundaryProps).children;
  }
}

export { ErrorBoundary };
