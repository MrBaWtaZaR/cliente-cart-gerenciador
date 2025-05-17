/**
 * Utilitário para simular o comando Ctrl+Shift+R com delay
 */

/**
 * Simula o pressionamento de Ctrl+Shift+R
 * @param delayMs - Delay em milissegundos antes de executar o comando (padrão: 5ms)
 */
export const executeRefreshCommand = (delayMs: number = 5): void => {
  setTimeout(() => {
    try {
      // Criar evento para simular o pressionamento de tecla
      const event = new KeyboardEvent('keydown', {
        key: 'r',
        code: 'KeyR',
        keyCode: 82,
        which: 82,
        shiftKey: true,
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      
      // Disparar o evento no documento
      document.dispatchEvent(event);
    } catch (error) {
      console.error('Erro ao executar comando de atualização:', error);
    }
  }, delayMs);
}; 